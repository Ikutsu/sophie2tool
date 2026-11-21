"""Local HTTP bridge between the running game and the sophie2tool web app.

  python server.py            -> http://127.0.0.1:47823
  GET /api/status             -> {"gameRunning": bool, "supported": bool, "error"?: str}
  GET /api/inventory          -> {"items": [...], "traits": {id: names}, "companions": [...]}
  GET /api/synthesis          -> live synthesis stats while on a synthesis board ({"active": false} otherwise)

Read-only, bound to 127.0.0.1, CORS limited to localhost origins.
"""
import json
import re
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import sophie2_bridge as sb

PORT = 47823
LOCAL_ORIGIN = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")
TABLES = sb.Tables()


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        origin = self.headers.get("Origin", "")
        if LOCAL_ORIGIN.match(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # CORS preflight
        self._send(204, {})

    def do_GET(self) -> None:
        try:
            if self.path == "/api/status":
                try:
                    with sb.GameMemory():
                        pass
                    self._send(200, {"gameRunning": True, "supported": True})
                except sb.GameNotRunning:
                    self._send(200, {"gameRunning": False, "supported": False})
                except sb.UnsupportedVersion as e:
                    self._send(200, {"gameRunning": True, "supported": False, "error": str(e)})
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


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"sophie2 bridge listening on http://127.0.0.1:{PORT}", flush=True)
    srv.serve_forever()
