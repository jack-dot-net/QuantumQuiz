# QuantumQuiz

Retro-arcade real-time multiplayer party game. Trivia (Kahoot-style speed + streak scoring) and Impostor (social-deduction word bluffing) in one app. Built as an Express + Socket.IO server with a React-via-CDN client — no build step, one-command deploy to Render.

- **Host opens the game on a TV/laptop** → big-screen display with room code + QR
- **Players scan the QR or enter the code on their phone** → mobile-optimized controls
- **Server is authoritative** — scoring, timers, vote tally, and word assignments all live in `server/game.js`. Clients can't cheat.

---

## Deploy to Render

The repo ships with [`render.yaml`](./render.yaml) configured for a free **Node web service** (Socket.IO needs a real server, not a static CDN).

1. Push the repo to GitHub.
2. In Render: **New → Blueprint**, select the repo, confirm.
3. Render runs `npm install`, starts `node server/index.js`, and gives you a `*.onrender.com` URL.

The free tier sleeps after 15 min of no traffic — first request wakes it back up in a few seconds. Fine for party-game use.

### Manual setup (if not using Blueprint)

- **Type:** Web Service
- **Runtime:** Node
- **Build command:** `npm install`
- **Start command:** `node server/index.js`
- **Health check path:** `/healthz`

---

## Run locally

```bash
npm install
npm start
# http://localhost:3000
```

Open it in two browser windows (or browser + phone on the same network) to play against yourself.

---

## How a game works

**Lobby** — Host creates a room and gets a 6-char code + QR. Up to 12 players join. Host can adjust mode/rounds/time/difficulty and start when ready.

**Trivia mode**
1. Question appears on the host display with a countdown ring.
2. Players see 4 answer buttons on their phones. Tapping locks the answer.
3. After all answer (or the timer hits zero), the correct answer is revealed.
4. Faster correct answers earn more points (500 base + up to 500 time bonus + streak bonus).
5. Leaderboard between questions, podium with confetti at the end.

**Impostor mode**
1. Server picks a word pair from the same theme (e.g. *Pizza / Lasagna*).
2. One random player is the **impostor** and gets the second word. Everyone else gets the crew word.
3. Players see "tap to reveal" on their phone for their secret word — pass the phone around if needed.
4. Turn-based clue phase: each player types **one word** describing their secret word. Vague enough to fool the impostor, specific enough that fellow crew know you're in the know.
5. Everyone votes for who they think is the impostor.
6. If the crew catches the impostor → impostor gets one **bonus guess** at the crew's word. Correct = impostor steals the win. Wrong = crew gets a +200 bonus.
7. If the impostor survives the vote → impostor wins outright (+1000).

---

## Project layout

```
QuantumQuiz/
├── server/
│   ├── index.js              Express + Socket.IO entry, rate-limiting, lifecycle
│   ├── rooms.js              In-memory room registry, player join/reconnect
│   ├── game.js               Game state machine, scoring, public/private projection
│   └── seed/
│       ├── questions.json    150 trivia questions across 10 categories (easy/med/hard)
│       └── word-pairs.json   ~115 themed impostor word pairs
├── public/
│   ├── index.html            Loads React, Babel, Socket.IO client, QR lib, app
│   ├── styles.css            Full visual system — CRT, neon, layouts
│   ├── client-state.js       Socket client + tiny store + React hook
│   ├── shared.jsx            Avatar, QR, TimerRing, Bar, Soundwave, Confetti
│   ├── app.jsx               Landing + Host-Create + Player-Join + router
│   ├── host.jsx              Host display scenes (lobby + trivia + impostor)
│   └── player.jsx            Player phone scenes (lobby + trivia + impostor)
├── package.json
├── render.yaml               Render Blueprint config (web service, free plan)
└── README.md
```

---

## Adding questions or word pairs

Edit the JSON files in `server/seed/` and redeploy. Schema:

```json
// questions.json
{ "category": "Science", "difficulty": "medium",
  "text": "What planet has the most moons?",
  "options": ["Jupiter", "Saturn", "Uranus", "Neptune"],
  "correct": 1 }

// word-pairs.json
{ "theme": "Italian food", "crew": "PIZZA", "impostor": "LASAGNA" }
```

Categories must be one of: `General`, `Science`, `History`, `Geography`, `Film/TV`, `Music`, `Sports`, `Games`, `Literature`, `Tech`, `Food`. Difficulties: `easy`, `medium`, `hard`.

The questions array currently has 150 items, the word-pairs array has ~115. Both are loaded into memory at startup.

---

## Tech notes

- **Real-time:** Socket.IO with WebSocket transport + polling fallback. Server emits `room:state` (public) and `room:private` (per-player secrets like the impostor word).
- **State:** In-memory only. Rooms are GC'd after 4 hours of inactivity. Players can reconnect within 60 seconds of dropping (token stored in `sessionStorage`).
- **Anti-cheat:** All scoring server-side. Server validates timing of answers against `questionStartAt`, locks per-player after first answer, only reveals the correct answer in the reveal phase.
- **Rate limiting:** Simple per-socket token buckets for chat / answers / votes.
- **Client:** No build step — `react.production.min.js` + `@babel/standalone` transpiles JSX in the browser. Saves dev complexity at the cost of ~2s cold load.
- **Auth model:** Host owns a `hostToken` returned only to the original creator. Host-only actions (start, advance, kick, settings, reset) require it. If the host disconnects, the first remaining player is promoted automatically.

---

## Known trade-offs

- **Cold-load JSX transpile** adds ~2 seconds on first load. Acceptable for a party game (open once, play for an hour). To eliminate, switch to a Vite build and serve the bundle.
- **In-memory state** means a Render restart drops live rooms. Acceptable for ephemeral party use. Swap to Redis or SQLite if you want survivability.
- **Free Render tier sleeps** after 15 min idle. First request after sleep takes ~30 seconds to wake.
- **Question bank is 150**, not the brief's 500. The schema and loader handle any size — just add more JSON. Word-pair bank is ~115, brief asked for 150.

---

## License

MIT.
