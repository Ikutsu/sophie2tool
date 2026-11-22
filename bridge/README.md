# bridge: game reader

Reads the material box (材料箱) of a running **Atelier Sophie 2** (Steam, v1.8.0.0) and serves it to the
web app in this repo, so the optimizer can plan with items you actually own.

**Read-only.** The server uses Windows `ReadProcessMemory` on fixed addresses. It injects nothing and
writes nothing, binds to `127.0.0.1`, and only answers localhost origins. On any other game version it
refuses and reports `unsupportedVersion`.

## Use (players)

Download `sophie2-bridge.exe` from the latest release
(<https://github.com/Ikutsu/sophie2tool/releases/latest>), start the game, double-click the exe and
keep its window open, then click **Import from game** on <https://sophie2.ikutsu.dev>. The web app
shows the same steps when it can't reach the bridge.

The bridge answers the published site and localhost origins (`SITE_ORIGINS` / `LOCAL_ORIGIN` in
`server.py`) and opts in to Chromium's local-network-access preflight. Chrome still fails a public
page's request to `http://127.0.0.1:47823` until the player allows "local network access", a prompt
that is easy to miss. So when the direct request fails, the web app opens `/handoff?origin=…` in a
small window instead: that page reads `/api/inventory` same-origin and posts the result back to its
opener with `postMessage`, only to an allowed origin, then closes. No permission prompt needed.

## Run from source

```powershell
cd bridge
python -m venv .venv          # first time only; server.py needs only the standard library
.venv\Scripts\python server.py
```

`requirements.txt` lists what the research scripts need (`frida` for `run.py`/`probe/`, `numpy` for `analyze/`).

Then on a recipe page in the web app click **Import from game**. The import is cached in the browser;
re-import after you gather or synthesize. Endpoints: `GET /api/status`, `GET /api/inventory`, `GET /api/synthesis`.

## Build and release the exe

```powershell
pip install -r bridge/requirements-build.txt
pyinstaller bridge/sophie2-bridge.spec --noconfirm     # -> dist/sophie2-bridge.exe
```

`sophie2-bridge.spec` bundles only what `server.py` needs (the decoding tables and the web app's
`public/data/materials.json`). Releases are built by `.github/workflows/bridge-release.yml`: push a
tag `bridge-vX.Y.Z` and the exe is attached to that GitHub release. Bump `VERSION` in `server.py`
with it. The exe is unsigned, so Windows SmartScreen warns on first run.

## Layout

| Path | What |
|---|---|
| `sophie2_bridge.py` | process access, version check, record decoding |
| `server.py` | HTTP server on port 47823 |
| `sophie2-bridge.spec`, `requirements-build.txt` | PyInstaller build of the one-file exe |
| `data/` | item, trait, effect, shape and link tables (shape/link read from the exe), pointer chains to the synthesis state |
| `data/experiments/` | logs from the in-game rule experiments (see [docs/rules-verification.md](../docs/rules-verification.md)) |
| `analyze/` | read-only research tools: `memscan` (pattern scan), `valuescan` (value narrowing), `snapdiff` (snapshot diff), `pointerscan`, `synth_chains`, `watch_synth` (log synthesis changes), `gridscan`, `friendship_diff` |
| `probe/`, `run.py` | Frida research scripts (inject into the game; research only) |
| `save-backup/` | copy of the save folder taken before any probing (git-ignored: personal data) |

## Known gaps

- Only the material box; the basket and equipment are not read yet. The board's cells are not read
  either: `/api/synthesis` gives per-element values, links, quality gain and unlocked effects.
- Friendship is read (static array at 0x141871918, 20-byte records, int32 = hearts − 1) and the web app
  turns it into co-op caps (2♥ → Lv3, 3♥ → Lv5, 4♥+ → Lv7, per the PRD; 2♥ → Lv3 and 4♥ → Lv7 verified in game).
  Companions not yet in the party read as 1♥, which maps to Off.
