# PyInstaller spec for the one-file bridge exe (sophie2-bridge.exe).
#   pip install pyinstaller
#   pyinstaller bridge/sophie2-bridge.spec      (from the repo root)
# Output: dist/sophie2-bridge.exe. Only what server.py needs is bundled: the
# decoding tables and the web app's materials.json (for item slugs).
import os

BRIDGE = os.path.dirname(os.path.abspath(SPEC))  # noqa: F821 - provided by PyInstaller
DATA = os.path.join(BRIDGE, "data")
TABLES = ["items", "shape_table", "star_table_exe", "traits", "effects", "synth_chains"]

a = Analysis(  # noqa: F821
    [os.path.join(BRIDGE, "server.py")],
    pathex=[BRIDGE],
    datas=[(os.path.join(DATA, f"{t}.json"), "data") for t in TABLES]
    + [(os.path.join(BRIDGE, "..", "public", "data", "materials.json"), "web-data")],
    excludes=["tkinter", "unittest", "pydoc", "frida", "numpy", "PIL"],
)
pyz = PYZ(a.pure)  # noqa: F821
exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    name="sophie2-bridge",
    console=True,  # the window is the UI: closing it stops the bridge
    upx=False,  # UPX-packed exes trip more antivirus heuristics
)
