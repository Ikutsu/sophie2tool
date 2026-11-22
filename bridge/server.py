"""Local HTTP bridge between the running game and the sophie2tool web app.

  python server.py            -> http://127.0.0.1:47823   (or sophie2-bridge.exe)
  GET /api/status             -> {"gameRunning": bool, "supported": bool, "bridge": version, "error"?: str}
  GET /api/inventory          -> {"items": [...], "traits": {id: names}, "companions": [...]}
  GET /api/synthesis          -> live synthesis stats while on a synthesis board ({"active": false} otherwise)

Read-only, bound to 127.0.0.1. CORS: localhost origins (development) and the
published web app; answers the browser's local-network-access preflight so the
public HTTPS site may call this local server.
"""
import json
import re
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import sophie2_bridge as sb

VERSION = "1.0.0"
PORT = 47823
LOCAL_ORIGIN = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")
SITE_ORIGINS = {"https://sophie2.ikutsu.dev"}


def allowed_origin(origin: str) -> bool:
    return origin in SITE_ORIGINS or bool(LOCAL_ORIGIN.match(origin))

TABLES = sb.Tables()


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _cors(self) -> None:
        origin = self.headers.get("Origin", "")
        if allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def do_OPTIONS(self) -> None:  # CORS preflight
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET")
        self.send_header("Access-Control-Max-Age", "600")
        # A public HTTPS page calling 127.0.0.1 is a private-network request; Chromium
        # asks the server to opt in (and may also prompt the user for permission).
        if self.headers.get("Access-Control-Request-Private-Network") == "true":
            self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()

    def do_GET(self) -> None:
        try:
            if self.path == "/api/status":
                try:
                    with sb.GameMemory():
                        pass
                    self._send(200, {"gameRunning": True, "supported": True, "bridge": VERSION})
                except sb.GameNotRunning:
                    self._send(200, {"gameRunning": False, "supported": False, "bridge": VERSION})
                except sb.UnsupportedVersion as e:
                    self._send(
                        200, {"gameRunning": True, "supported": False, "bridge": VERSION, "error": str(e)}
                    )
            elif self.path == "/api/synthesis":
                s = sb.read_synthesis(TABLES)
                self._send(200, {"active": s is not None, **(s or {})})
            elif self.path == "/api/inventory":
                t0 = time.perf_counter()
                body = sb.read_material_box(TABLES)
                body["readMs"] = round((time.perf_counter() - t0) * 1000, 1)
                self._send(200, body)
            else:
                self._send(404, {"error": "not found"})
        except sb.GameNotRunning:
            self._send(409, {"error": "gameNotRunning"})
        except sb.UnsupportedVersion as e:
            self._send(409, {"error": "unsupportedVersion", "detail": str(e)})
        except Exception as e:  # noqa: BLE001 - report anything else to the client
            self._send(500, {"error": "internal", "detail": repr(e)})

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[bridge] " + fmt % args + "\n")


BANNER = f"""
  Sophie 2 bridge {VERSION}  (http://127.0.0.1:{PORT})

  EN  Keep this window open, then click "Import from game" on
      https://sophie2.ikutsu.dev . Read-only: it only reads the game's memory.
  中文 保持此視窗開啟，然後在網頁上按「從遊戲匯入」。只讀取遊戲記憶體，不會修改遊戲。
  日本語 このウィンドウを開いたまま、サイトで「ゲームから読込」を押してください。

  Close this window to stop.
"""


def _wait_if_double_clicked() -> None:
    """The packaged exe runs in its own console; keep an error readable before it closes."""
    if getattr(sys, "frozen", False):
        input("\nPress Enter to close / 按 Enter 關閉 ...")


if __name__ == "__main__":
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        print(f"Port {PORT} is in use: the bridge is probably already running.")
        print(f"連接埠 {PORT} 已被佔用：橋接程式可能已經在執行了。")
        _wait_if_double_clicked()
        sys.exit(1)
    print(BANNER, flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
