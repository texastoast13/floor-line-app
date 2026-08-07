# Floorline — Manufacturing Ops Platform

A prototype shop-floor platform: AI quoting, inventory forecasting, supplier
comparison, preventive maintenance scheduling, sales follow-up, documentation
automation, a safety training assistant, and quality control reporting.

## Status right now

Fully working out of the box, no setup needed:
- Dashboard / attention queue
- Inventory forecasting chart + reorder math
- Supplier comparison + scoring
- Preventive maintenance schedule
- Quality control logging + chart

Needs a small backend wired up before it will work (see below):
- AI quoting draft
- Sales follow-up email draft
- Documentation generation
- Safety assistant chat
- QC management summary

These five all call an AI model. Right now the code calls Anthropic's API
directly from the browser, which only works inside Claude's own artifact
environment — once deployed on the open web it needs a small server route
holding the API key instead, so the key is never exposed to visitors. Ask
Claude to add that route when you're ready for this next step.

Data also doesn't persist between visits yet (it resets on refresh) — it
uses Claude's built-in `window.storage`, which needs to be swapped for a
real database (e.g. Supabase, Firebase) for a live deployment.

## Local development (optional — not required to deploy)

```
npm install
npm run dev
```

## Deploying

See the deployment guide provided alongside this project. Short version:
push this folder to GitHub, then import it into Vercel — Vercel auto-detects
the Vite + React setup and deploys it with no configuration needed.
