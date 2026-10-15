"""Regenerate a 300-record OpenNGC subset. Python 3, standard library only.
Metadata adaptation is CC BY-SA 4.0. Original importer code is MIT.
"""
import csv
import hashlib
import io
import json
import math
from pathlib import Path
from urllib.request import urlopen

REVISION = "75ca7ff090e1d0081a5b08be70eb3bc45ccd9e06"
SOURCE = f"https://raw.githubusercontent.com/mattiaverga/OpenNGC/{REVISION}/database_files/NGC.csv"
ROOT = Path(__file__).resolve().parents[1]


def degrees(value, right_ascension=False):
    parts = [float(part) for part in value.lstrip("+-").split(":")]
    angle = parts[0] + parts[1] / 60 + parts[2] / 3600
    return angle * (15 if right_ascension else -1 if value.startswith("-") else 1)


def morphology(hubble, ratio):
    if "m" in hubble or "I" in hubble:
        return "irregular"
    if hubble.startswith("E"):
        return "elliptical"
    if "0" in hubble:
        return "lenticular"
    if ratio < 0.28:
        return "edge-on"
    if hubble.startswith(("SB", "SAB")):
        return "barred"
    return "spiral"


raw = urlopen(SOURCE).read()
rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8")), delimiter=";"))
valid = [row for row in rows if row["Type"] == "G" and all(row[key] for key in ["RA", "Dec", "Hubble", "MajAx", "MinAx"])]
valid.sort(key=lambda row: (float(row["V-Mag"] or row["B-Mag"] or 99), row["Name"]))
required = ["NGC0224", "NGC5194", "NGC4486", "NGC3034", "NGC4594"]
selected = [next(row for row in valid if row["Name"] == name) for name in required]
# Favor bright objects across the sky before filling the remaining slots.
cells = set()
for row in valid:
    cell = (int(degrees(row["RA"], True) / 20), int((degrees(row["Dec"]) + 90) / 15))
    if cell not in cells and row not in selected:
        cells.add(cell)
        selected.append(row)
    if len(selected) == 300:
        break
for row in valid:
    if len(selected) == 300:
        break
    if row not in selected:
        selected.append(row)

records = []
for index, row in enumerate(selected):
    ratio = min(1, float(row["MinAx"]) / float(row["MajAx"]))
    ra, dec = degrees(row["RA"], True), degrees(row["Dec"])
    redshift = float(row["Redshift"]) if row["Redshift"] else None
    # Sky projection with compressed artistic depth, not physical 3D coordinates.
    records.append({
        "id": row["Name"], "messier": f'M{int(row["M"])}' if row["M"] else None,
        "raDeg": round(ra, 7), "decDeg": round(dec, 7), "epoch": "J2000",
        "hubbleType": row["Hubble"], "majorArcmin": float(row["MajAx"]),
        "minorArcmin": float(row["MinAx"]), "positionAngleDeg": float(row["PosAng"] or 0),
        "redshift": redshift, "distanceMly": None,
        "morphology": morphology(row["Hubble"], ratio), "inclination": max(0.14, ratio),
        "rotation": math.radians(float(row["PosAng"] or 0)), "seed": index + 1001,
        "scenePosition": [round((ra / 360 - 0.5) * 1900, 3), round(math.sin(math.radians(dec)) * 520, 3), round(-350 - min(1, max(0, redshift or 0) / 0.025) * 650, 3)],
        "source": f"https://github.com/mattiaverga/OpenNGC/blob/{REVISION}/database_files/NGC.csv",
        "dataSources": row["Sources"], "license": "CC-BY-SA-4.0", "renderKind": "artistic-morphology"
    })
output = ROOT / "src/data/catalog/galaxies-300.json"
output.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
manifest = {"upstream": SOURCE, "revision": REVISION, "sha256": hashlib.sha256(raw).hexdigest(), "count": len(records), "license": "CC-BY-SA-4.0", "credit": "OpenNGC, Mattia Verga and contributors", "adaptation": "300 unique galaxy rows; J2000 coordinate conversion; morphology grouping; compressed artistic scene projection. Missing distances stay null."}
(output.parent / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(records)} real galaxy records from {REVISION}")
