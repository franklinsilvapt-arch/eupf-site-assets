# Bankrekening vergelijken (EUPF NL)

Vergelijker van particuliere en zakelijke rekeningen voor https://www.eupersonalfinance.eu/nl/bankrekening-vergelijken
Fork van de LF comparador-contas (pedrofintech/lf-site-assets@f3fa33b), vertaald naar het Nederlands.

- `rekeningen.js` / `rekeningen.css`: de tool (root `#lf-cb`)
- `dados/rekeningen.json`: ALLE gegevens. Dit bestand is de bron: elke waarde in `t` heeft een `src` (officiele bron van de bank).
  `f` bevat de getallen en vlaggen voor filters en sortering (custoMes, jurosMax, ideal, numerario, tpa, boekhouding, eenmanszaak/vof/bv...).
- `logos/`: logo's
- `qa/`: test van gesimuleerde gebruikers. Start `python3 -m http.server 8765` in `eupf/` en draai `node rekeningen-nl/qa/sim.js 120`.

De Webflow-pagina laadt de bestanden van `@main` via jsDelivr. Na een push: cache legen met
https://purge.jsdelivr.net/gh/franklinsilvapt-arch/eupf-site-assets@main/eupf/rekeningen-nl/dados/rekeningen.json (en .js/.css).

Maandelijkse controle: een geplande taak controleert elke waarde bij de bron, past de JSON aan, test en pusht.
