"""Update silver-data.json for the BrokerMatch "Silver rate today in the UAE" page.

Sources
- Spot price (USD per troy ounce): https://api.gold-api.com/price/XAG
- Daily history: COMEX silver futures (SI=F) daily close from Yahoo Finance, converted to AED
  at the 3.6725 peg. (LBMA's JSON and Stooq refuse requests from GitHub runners.) If it fails, the page keeps its own archive of
  one spot reading per UAE day (silver-archive.json), so the chart never goes empty.

Rules: never overwrite good data with nothing. If a source fails, the last good values stay
in the file and the source is flagged as stale. The run fails only when the spot price has
not been refreshed for more than 2 days.
"""
import datetime as dt
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


def _window(rows, days=400):
    start = (dt.date.today() - dt.timedelta(days=days)).isoformat()
    out = [{"d": d, "g": round(aed_g(c), 3)} for d, c in rows if d >= start and 5 < c < 500]
    if len(out) < 100:
        raise ValueError("history too short: %d rows" % len(out))
    return out


def get_lbma():
    """LBMA Silver Price (USD per ounce, daily benchmark)."""
    rows = []
    for r in fetch("https://prices.lbma.org.uk/json/silver.json"):
        v = r.get("v") or []
        if v and v[0]:
            rows.append((r["d"], float(v[0])))
    return _window(rows)


def get_yahoo():
    """Fallback: COMEX silver futures daily close (SI=F)."""
    j = fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI=F?range=2y&interval=1d")["chart"]["result"][0]
    closes = j["indicators"]["quote"][0]["close"]
    rows = [(dt.datetime.utcfromtimestamp(t).strftime("%Y-%m-%d"), c) for t, c in zip(j["timestamp"], closes) if c]
    return _window(rows)


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
    hist = None
    for name, fn in (("yahoo", get_yahoo),):
        try:
            hist = fn()
            data["history"], data["historySource"] = hist, name
            break
        except Exception as e:
            warnings.append("history %s: %s" % (name, e))
    if hist is None:
        own = [{"d": k, "g": archive["days"][k]["last"]} for k in sorted(archive["days"])]
        if len(own) > len(data.get("history") or []) or data.get("historySource") not in ("lbma", "yahoo"):
            data["history"] = own
            data["historySource"] = "archive"

    data["peg"] = PEG
    data["updatedAt"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    data["sources"] = {
        "spot": "api.gold-api.com (XAG)",
        "history": "COMEX silver futures (SI=F) daily close via Yahoo Finance, AED at the 3.6725 peg",
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
