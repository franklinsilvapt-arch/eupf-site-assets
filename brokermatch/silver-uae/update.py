"""Update silver-data.json for the BrokerMatch "Silver rate today in the UAE" page.

Sources
- Spot price (USD per troy ounce): https://api.gold-api.com/price/XAG
- Daily history: Stooq XAGUSD daily closes (https://stooq.com/q/d/l/?s=xagusd&i=d),
  converted to AED at the 3.6725 peg. If Stooq fails, the page keeps its own archive of
  one spot reading per UAE day (silver-archive.json), so the chart never goes empty.

Rules: never overwrite good data with nothing. If a source fails, the last good values stay
in the file and the source is flagged as stale. The run fails only when the spot price has
not been refreshed for more than 2 days.
"""
import csv
import datetime as dt
import io
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "silver-data.json")
ARCHIVE = os.path.join(HERE, "silver-archive.json")
PEG = 3.6725
OZ = 31.1034768
UA = {"User-Agent": "Mozilla/5.0 (compatible; brokermatch-silver-bot/1.0; +https://www.brokermatch.ae)"}


def fetch(url, as_json=True, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8", "replace")
    return json.loads(raw) if as_json else raw


def load(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return default


def aed_g(usd_oz):
    return round(usd_oz * PEG / OZ, 4)


def get_spot():
    p = float(fetch("https://api.gold-api.com/price/XAG")["price"])
    if not 5 < p < 500:
        raise ValueError("spot out of range: %s" % p)
    return p


def get_stooq(days=400):
    raw = fetch("https://stooq.com/q/d/l/?s=xagusd&i=d", as_json=False)
    rows = list(csv.DictReader(io.StringIO(raw)))
    if not rows or "Close" not in rows[0]:
        raise ValueError("unexpected Stooq answer: %r" % raw[:80])
    start = (dt.date.today() - dt.timedelta(days=days)).isoformat()
    out = []
    for r in rows:
        try:
            d, c = r["Date"], float(r["Close"])
        except (KeyError, ValueError):
            continue
        if d >= start and 5 < c < 500:
            out.append({"d": d, "g": round(aed_g(c), 3)})
    if len(out) < 100:
        raise ValueError("Stooq history too short: %d rows" % len(out))
    return out


def main():
    now = dt.datetime.utcnow().replace(microsecond=0)
    uae_day = (now + dt.timedelta(hours=4)).strftime("%Y-%m-%d")
    data = load(DATA, {})
    archive = load(ARCHIVE, {"days": {}})
    warnings = []

    # 1) Spot
    try:
        usd_oz = get_spot()
        data["spot"] = {
            "usdOz": round(usd_oz, 3),
            "aedG": round(aed_g(usd_oz), 3),
            "at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "date": uae_day,
            "stale": False,
        }
        day = archive["days"].setdefault(uae_day, {})
        day.setdefault("open", round(aed_g(usd_oz), 3))
        day["last"] = round(aed_g(usd_oz), 3)
    except Exception as e:
        warnings.append("spot: %s" % e)
        if data.get("spot"):
            data["spot"]["stale"] = True

    keep = sorted(archive["days"])[-420:]
    archive["days"] = {k: archive["days"][k] for k in keep}

    # Previous UAE day close (for the daily change)
    prev = [k for k in sorted(archive["days"]) if k < uae_day]
    data["prev"] = {"date": prev[-1], "aedG": archive["days"][prev[-1]]["last"]} if prev else None

    # 2) History
    try:
        data["history"] = get_stooq()
        data["historySource"] = "stooq"
    except Exception as e:
        warnings.append("history: %s" % e)
        own = [{"d": k, "g": archive["days"][k]["last"]} for k in sorted(archive["days"])]
        if len(own) > len(data.get("history") or []) or data.get("historySource") != "stooq":
            data["history"] = own
            data["historySource"] = "archive"

    data["peg"] = PEG
    data["updatedAt"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    data["sources"] = {
        "spot": "api.gold-api.com (XAG)",
        "history": "Stooq XAGUSD daily close, AED at the 3.6725 peg",
    }

    with open(DATA, "w") as f:
        f.write(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    with open(ARCHIVE, "w") as f:
        f.write(json.dumps(archive, indent=1, ensure_ascii=False) + "\n")

    for w in warnings:
        print("::warning::%s" % w)

    last = data.get("spot", {}).get("date")
    if not last or (dt.date.fromisoformat(uae_day) - dt.date.fromisoformat(last)).days > 2:
        print("::error::Silver spot not refreshed for more than 2 days")
        sys.exit(1)


if __name__ == "__main__":
    main()
