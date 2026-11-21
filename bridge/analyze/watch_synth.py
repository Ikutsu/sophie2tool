"""Log every change of the live synthesis stats (read-only) as JSON lines.

Usage: python analyze/watch_synth.py [seconds] > log.jsonl
Keeps one process handle open while polling; reopens it if the game restarts.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import sophie2_bridge as sb  # noqa: E402

t = sb.Tables()
end = time.time() + float(sys.argv[1] if len(sys.argv) > 1 else 900)
last = None
n = 0
while time.time() < end:
    try:
        with sb.GameMemory() as g:
            while time.time() < end:
                s = sb.read_synthesis(t, g)
                key = json.dumps(s, sort_keys=True)
                if key != last:
                    n += 1
                    row = {"step": n, "t": time.strftime("%H:%M:%S"), **(s or {"active": False})}
                    print(json.dumps(row, ensure_ascii=False), flush=True)
                    last = key
                time.sleep(0.2)
    except sb.GameNotRunning:
        break
    except OSError:
        time.sleep(1)  # the process went away or changed; reopen
