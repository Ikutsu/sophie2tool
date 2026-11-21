"""Attach to Atelier Sophie 2, run a Frida JS script, print what it sends, exit on 'done'.

Usage: python run.py <script.js> [json-params]
The script receives params via a global `PARAMS` and should `send({type:'done'})` when finished.
Long-running work in the script must be deferred with setTimeout so load() returns quickly.

Safety: the script is always unloaded and the session detached, even on errors or Ctrl+C,
so no Frida agent is left running inside the game (a leftover agent crashed the game once).
A lock file prevents two runs from attaching at the same time.
"""
import json
import os
import sys
import threading

import frida

PROCESS = "Atelier_Sophie_2.exe"
LOCK = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".attach.lock")


def main() -> int:
    script_path = sys.argv[1]
    params = sys.argv[2] if len(sys.argv) > 2 else "{}"
    timeout = float(json.loads(params).get("timeout", 120))
    src = f"const PARAMS = {params};\n" + open(script_path, encoding="utf-8").read()

    try:
        fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
    except FileExistsError:
        print(f"another run holds {LOCK}; if none is running, delete it", file=sys.stderr)
        return 2

    session = script = None
    done = threading.Event()

    def on_message(msg, data):
        if msg["type"] == "error":
            print("JS ERROR:", msg.get("stack") or msg, flush=True)
            done.set()
            return
        payload = msg["payload"]
        if data is not None and isinstance(payload, dict) and "file" in payload:
            with open(payload["file"], "wb") as f:
                f.write(data)
            print(f"wrote {len(data)} bytes to {payload['file']}", flush=True)
            return
        if isinstance(payload, dict) and payload.get("type") == "done":
            done.set()
            return
        print(json.dumps(payload, ensure_ascii=False) if not isinstance(payload, str) else payload, flush=True)

    try:
        session = frida.attach(PROCESS)
        script = session.create_script(src)
        script.on("message", on_message)
        script.load()
        if not done.wait(timeout=timeout):
            print(f"timed out after {timeout}s", file=sys.stderr)
            return 1
        return 0
    finally:
        for step in (lambda: script and script.unload(), lambda: session and session.detach()):
            try:
                step()
            except Exception as e:  # process may already be gone
                print(f"cleanup: {e}", file=sys.stderr)
        os.remove(LOCK)


if __name__ == "__main__":
    sys.exit(main())
