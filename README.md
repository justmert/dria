# DRIA

A neutral aggregator for DeFi risk intelligence. It shows what every major risk feed says about the top 20 Ethereum protocols, side by side, exactly as each provider published it. No scores of our own, no synthesis.

## What it does

- One grid: 20 protocols as rows, risk feeds as columns.
- Each cell shows the feed's own rating verbatim, with a source link and a date.
- Coverage gaps are shown as data ("not yet covered"), never hidden.
- Live TVL/volume from DefiLlama. Governance, audits and incidents per protocol.

## Stack

- React + TypeScript + Vite, Tailwind for styling.
- Data lives as plain JSON in `data/` and is validated with Zod. No database.
- Ingestion scripts in `ingest/` pull live data and write the JSON files.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build to dist/
npm run validate   # check data against the schema
npm run ingest     # refresh the machine-readable feeds (tvl, defiscan, etc.)
```

## Layout

```
src/        app (components, pages, data loader)
data/       the dataset (protocols, feeds, coverage, governance, audits, incidents, tvl)
ingest/     scripts that fetch live data
scripts/    validation + checks used in CI
```

## Data

Everything is a file, so a correction is just a pull request that edits a JSON file. Every populated cell needs a real source URL. Feeds that can't be verified are flagged and left empty rather than filled with made-up data.

- Add a protocol: a file in `data/protocols/`.
- Add a feed: a file in `data/feeds/`.
- Fix a rating: edit the feed's file in `data/coverage/`.

## License

AGPL-3.0.
