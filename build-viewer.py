"""Rebuild the standalone viewer using only the Python standard library."""
import html
from pathlib import Path

root = Path(__file__).resolve().parent
fragment = (root / "viewer-fragment.html").read_text()
fragment = fragment.replace("__GEODATA__", (root / "downtown.geojson").read_text())
fragment = fragment.replace("__MODEL_CODE__", (root / "build-model.js").read_text())
shell = (root / "viewer-shell.html").read_text()
assert shell.count("__MODEL_FRAGMENT_ESCAPED__") == 1
page = shell.replace("__MODEL_FRAGMENT_ESCAPED__", html.escape(fragment, quote=True))
(root / "index.html").write_text(page)
print("Wrote index.html")
