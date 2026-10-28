#!/usr/bin/env python3
"""SMN/CONAGUA -> public Sonora-only forecast snapshot for MAPA BALAM.

Official source: https://smn.conagua.gob.mx/es/web-service-api
Daily forecast endpoint: https://smn.conagua.gob.mx/tools/GUI/webservices/?method=1
No patient data, no credentials, no emergency alerts invented.
"""
import argparse
import datetime as dt
import gzip
import hashlib
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = "https://smn.conagua.gob.mx/tools/GUI/webservices/?method=1"
TARGET = ROOT / "data" / "smn" / "sonora_latest.json"
DISTRICTS = ROOT / "data" / "districts.json"
LIMIT_BYTES = 24 * 1024 * 1024
UTC = dt.timezone.utc
THRESHOLDS = {"rain_mm_day": 30, "wind_gust_kmh": 60, "heat_c": 40, "cold_c": 5}

def number(value):
    try:
        if value is None or str(value).strip() in ("", "-", "N/D"):
            return None
        return round(float(str(value).strip()), 2)
    except (TypeError, ValueError):
        return None

def parse_source(raw):
    if raw.startswith(b"\x1f\x8b"):
        raw = gzip.decompress(raw)
    if raw.startswith(b"\x1f\x8b"):
        raw = gzip.decompress(raw)
    obj = json.loads(raw.decode("utf-8-sig"))
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        for field in ("data", "datos", "results", "pronosticos", "result", "rows"):
            if isinstance(obj.get(field), list):
                return obj[field]
    raise ValueError("Formato JSON no reconocido: no es una lista de pronósticos")

def signals(row):
    out = []
    for code, key, lower in [
        ("lluvia_intensa_potencial", "rain_mm", False),
        ("racha_fuerte", "gust_kmh", False),
        ("calor_extremo", "tmax_c", False),
        ("frio", "tmin_c", True),
    ]:
        val = row.get(key)
        if val is None:
            continue
        threshold = {
            "rain_mm": THRESHOLDS["rain_mm_day"],
            "gust_kmh": THRESHOLDS["wind_gust_kmh"],
            "tmax_c": THRESHOLDS["heat_c"],
            "tmin_c": THRESHOLDS["cold_c"],
        }[key]
        if (val <= threshold if lower else val >= threshold):
            out.append(code)
    return out

def build(rows, district_cfg, now):
    codes = {}
    for d in district_cfg["districts"]:
        for mun in d["municipalities"]:
            codes[str(mun).zfill(3)] = d["id"]
    items = {}
    skipped = 0
    for r in rows:
        if not isinstance(r, dict):
            skipped += 1
            continue
        st = str(r.get("ides", "")).strip()
        name = str(r.get("nes", "")).strip().lower()
        if st not in ("26", "026") and name != "sonora":
            continue
        mun = str(r.get("idmun", "")).strip()
        if not mun.isdigit():
            skipped += 1
            continue
        mun = mun.zfill(3)
        if mun not in codes:
            skipped += 1
            continue
        dloc = str(r.get("dloc", "")).strip()
        if len(dloc) < 8 or not dloc[:8].isdigit():
            skipped += 1
            continue
        stamp = dloc[:8]
        try:
            day = dt.datetime.strptime(stamp, "%Y%m%d").date().isoformat()
        except ValueError:
            skipped += 1
            continue
        vals = {
            "date": day,
            "tmax_c": number(r.get("tmax")),
            "tmin_c": number(r.get("tmin")),
            "rain_mm": number(r.get("prec")),
            "rain_probability_pct": number(r.get("probprec")),
            "wind_kmh": number(r.get("velvien")),
            "gust_kmh": number(r.get("raf")),
            "sky": str(r.get("desciel", "")).strip()[:100],
        }
        vals["signals"] = signals(vals)
        key = "26" + mun
        cur = items.setdefault(key, {
            "code": key, "name": str(r.get("nmun", "")).strip()[:130],
            "district": codes[mun], "days": []
        })
        # Deduplicate same forecast day, preserving last record in source.
        cur["days"] = [x for x in cur["days"] if x["date"] != day]
        cur["days"].append(vals)
    result = []
    for v in items.values():
        v["days"].sort(key=lambda x: x["date"])
        v["days"] = v["days"][:4]
        v["signal_count"] = len(set(x for day in v["days"] for x in day["signals"]))
        result.append(v)
    result.sort(key=lambda x: x["code"])
    if len(result) < 20:
        raise ValueError(f"Cobertura insuficiente: {len(result)} municipios; se conserva el corte previo")
    if not any(x["days"] for x in result):
        raise ValueError("No hay fechas de pronóstico interpretables")
    return {
        "schema": "balam-smn-municipal-v1",
        "status": "ok",
        "source": "SMN / CONAGUA · Pronóstico por municipio (3 días)",
        "source_url": URL,
        "api_documentation": "https://smn.conagua.gob.mx/es/web-service-api",
        "fetched_at": now.isoformat(timespec="seconds").replace("+00:00", "Z"),
        "forecast_days": sorted({day["date"] for row in result for day in row["days"]}),
        "municipalities_count": len(result),
        "districts_count": len({x["district"] for x in result}),
        "skipped_rows": skipped,
        "internal_watch_thresholds": THRESHOLDS,
        "disclaimer": "Señales internas exploratorias de vigilancia BALAM; no son alertas oficiales, pronóstico de impactos ni disponibilidad CRUM.",
        "municipalities": result,
    }

def selftest(cfg):
    test = [
        {"ides": "26", "idmun": "30", "nmun": "Hermosillo", "nes": "Sonora", "dloc": "20261028T00",
         "prec": "42", "tmax": "41", "tmin": "17", "raf": "24", "velvien": "12",
         "probprec": "70", "desciel": "Nublado"},
        {"ides": "26", "idmun": "30", "nmun": "Hermosillo", "nes": "Sonora", "dloc": "20261029T00",
         "prec": "0", "tmax": "36", "tmin": "15", "raf": "12"},
        {"ides": "20", "idmun": "30", "nmun": "Otro", "nes": "Oaxaca", "dloc": "20261028T00"}
    ]
    assert len(parse_source(gzip.compress(json.dumps(test).encode()))) == 3
    # Validate normalization without enforcing production coverage in this self-test.
    full = []
    for d in cfg["districts"]:
        for c in d["municipalities"]:
            full.append({"ides": "26", "idmun": c, "nmun": "TEST", "nes": "Sonora",
                         "dloc": "20261028T00", "prec": "0", "tmax": "30",
                         "tmin": "10", "raf": "10"})
    full += test
    output = build(full, cfg, dt.datetime(2026, 10, 28, tzinfo=UTC))
    assert output["municipalities_count"] == 72
    hermosillo = next(x for x in output["municipalities"] if x["code"] == "26030")
    assert hermosillo["district"] == "DS01"
    assert "calor_extremo" in hermosillo["days"][0]["signals"]
    assert "lluvia_intensa_potencial" in hermosillo["days"][0]["signals"]
    assert all(x["code"].startswith("26") for x in output["municipalities"])
    print("SELFTEST OK: 72 municipios, filtro Sonora, 2 señales operativas, gzip")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    cfg = json.loads(DISTRICTS.read_text(encoding="utf-8"))
    if args.self_test:
        selftest(cfg)
        return
    req = urllib.request.Request(URL, headers={
        "User-Agent": "BALAM-MAPA/0.9 (+https://github.com/doctopanda/MAPA-BALAM)",
        "Accept": "application/octet-stream,application/json,application/gzip,*/*"
    })
    with urllib.request.urlopen(req, timeout=75) as resp:
        payload = resp.read(LIMIT_BYTES + 1)
    if len(payload) > LIMIT_BYTES:
        raise RuntimeError("Respuesta del SMN excedió límite de seguridad")
    out = build(parse_source(payload), cfg, dt.datetime.now(UTC))
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    tmp = TARGET.with_suffix(".tmp")
    tmp.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    tmp.replace(TARGET)
    print("SMN OK", out["fetched_at"], out["municipalities_count"], "municipios", len(payload), "bytes originales")

if __name__ == "__main__":
    main()
