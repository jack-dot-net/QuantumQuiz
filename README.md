# QuantumQuiz

Retro-arcade hi-fi prototype of QuantumQuiz — a real-time multiplayer trivia + social-deduction party game. Built as a self-contained static site (React 18 + Babel-in-the-browser), ready to deploy to Render in one click.

The prototype shows a **dual-display showcase** of every game scene:
- **Host TV** (big screen) on the left
- **Player phone** (mobile) on the right
- **Scene rail** at the bottom — click a chip or press `←`/`→` to walk every state

12 scenes across three phases:
- **Intro** — Landing · Host · Player · Lobby
- **Trivia** — Question · Reveal · Leaderboard · Podium
- **Impostor** — Word reveal · Clue phase · Vote · Result

---

## Deploy to Render (fastest path)

The repo ships with [`render.yaml`](./render.yaml) configured for a free **Static Site**.

1. Push this repo to GitHub / GitLab.
2. In Render, click **New → Blueprint**, point it at the repo, and confirm.
3. Render reads `render.yaml`, publishes `./public`, and serves it on a free `*.onrender.com` URL.

No build step, no env vars, no plan upgrade required. First deploy takes ~30 seconds.

### Manual setup (if you prefer not to use Blueprint)

- **Type:** Static Site
- **Build command:** *(leave empty)*
- **Publish directory:** `public`
- **Rewrite rule:** `/* → /index.html` (optional — there's no client-side routing today, but it future-proofs the deploy)

---

## Run it locally

Any static-file server works. The shortest path:

```bash
npm start          # serves ./public on http://localhost:3000
```

Or open `public/index.html` directly in a browser — it will work, but a couple of CDN scripts behave better over `http://` than `file://`.

---

## What's in `public/`

| File | Purpose |
| ---- | ------- |
| `index.html` | Entry. Loads React/ReactDOM/Babel from CDN and the JSX modules below. |
| `styles.css` | All visual styling — CRT scanlines, neon palette, layout grid. |
| `data.js` | Mock data: players, the demo trivia question, chat, impostor word pair. |
| `shared.jsx` | Reusable bits: `Avatar`, `QR`, `TimerRing`, `Bar`, `Soundwave`, `StageScaler`. |
| `host.jsx` | The 12 host-TV scenes. |
| `player.jsx` | The 12 player-phone scenes. |
| `app.jsx` | Top-level scene router, top bar, scene rail, arrow-key navigation. |
| `tweaks-panel.jsx` | Designer overlay — toggles CRT scanlines / vignette at runtime. |

---

## Notes for the next iteration

This is a **hi-fi interactive prototype** — every scene is real React, but state is mocked. The brief calls for a real Socket.IO backend with SQLite persistence; that's the natural next step. Suggested order:

1. Lift the visual components into a Vite + React + Tailwind project (preserves the design verbatim).
2. Add an Express + Socket.IO server. Authoritative scoring lives there.
3. Seed `questions.json` (500+) and `word-pairs.json` (150+).
4. Swap the static publish for a Render **Web Service** pointing at the Node server.

Until then: the prototype above is enough to walk a real group of friends through the full game flow on a TV + phones, which is exactly what was asked for as a starting point.
