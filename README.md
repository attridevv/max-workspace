# Max Workspace

**An analog-first journaling system.** Optimize and document your life — habits, goals, daily highlights, reflections — on paper, with a quiet digital companion for the parts paper can't do.

- **Companion app:** https://max-workspace-app.vercel.app/app
- **Landing page:** https://attridevv.github.io/max-workspace/

![Max Workspace — monthly view](https://attridevv.com/assets/work/max-workspace.jpg)

## What's inside

| Part | Path | Stack |
|---|---|---|
| Landing site | `/` (repo root) | Astro 5 |
| Companion app | `app/` | Next.js 16, React 19, TypeScript, Tailwind v4 |

The companion has onboarding (or a filled example month), a monthly spread with a day editor, habits, goals, highlights, reflections, life-archive chapters, a printable year in review, quick capture (⌘K) and JSON export / import. It is **local-first**: everything is stored in your browser, nothing is sent to a server.

## Run locally

```sh
npm install && npm --prefix app install
npm run dev        # landing  → http://localhost:4321/max-workspace
npm run dev:app    # companion → http://localhost:3000/app
```

`npm run shots` takes Playwright screenshots of the landing page (desktop + mobile).

## Deploy

- Landing → GitHub Pages via `.github/workflows/deploy-landing.yml` on every push to `main`.
- Companion → Vercel (`vercel deploy --prod` from `app/`).

---

Built by [Dev Attri](https://attridevv.com).
