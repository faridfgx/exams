# Run after ANY change to app.js / styles.css / students.js / config.js / lesson pages / images:
#   python bump.py
# then upload everything. All browsers pick up the new version automatically.
import json, time, pathlib
p = pathlib.Path(__file__).with_name("version.json")
v = time.strftime("%Y%m%d-%H%M%S")
p.write_text(json.dumps({"v": v}) + "\n", encoding="utf-8")
print("version ->", v)
