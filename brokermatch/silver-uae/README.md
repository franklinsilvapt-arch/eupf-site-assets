# silver-uae

Data for the "Silver rate today in the UAE" page on brokermatch.ae (/silver-rate-today-uae and /ar/...).

- `update.py`: run by `.github/workflows/silver-uae.yml` every 2 hours (07:23 to 23:23 UAE time).
- `silver-data.json`: read by the page from raw.githubusercontent.com.
- `silver-archive.json`: one opening and last spot reading per UAE day (daily change and a fallback history).

## Sources

- Spot (USD per ounce): https://api.gold-api.com/price/XAG
- One-year chart: COMEX silver futures (SI=F) daily close, Yahoo Finance, AED at the 3.6725 peg.
  LBMA's JSON and Stooq answer 403 or a captcha to GitHub runners, so they are not used.

## When does a run fail?

Only when the spot price has not been refreshed for more than 2 days.
