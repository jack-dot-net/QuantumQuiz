// index.js — Express + Socket.IO entry. Serves the static client and
// forwards player intents to the authoritative game logic in game.js.

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const rooms = require('./rooms');
const game = require('./game');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());

app.use(express.static(PUBLIC_DIR, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.jsx')) res.setHeader('Content-Type', 'text/babel; charset=utf-8');
  },
}));

app.get('/healthz', (_, res) => res.json({ ok: true, t: Date.now() }));

app.get('/api/stats', (_, res) => {
  res.json({
    rooms: rooms.listRooms().length,
    questions: game.QUESTIONS.length,
    wordPairs: game.WORD_PAIRS.length,
    uptimeSec: Math.round(process.uptime()),
  });
});

// SPA fallback so client-side routes load index.html
app.get(/.*/, (_, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 25000,
  pingTimeout: 60000,
});

// ─── Rate limiting (per-socket, simple token bucket) ─────────────────────────
const buckets = new WeakMap();
function rateLimit(socket, key, perSec = 5) {
  const now = Date.now();
  let b = buckets.get(socket);
  if (!b) { b = {}; buckets.set(socket, b); }
  if (!b[key]) b[key] = { tokens: perSec, last: now };
  const refill = ((now - b[key].last) / 1000) * perSec;
  b[key].tokens = Math.min(perSec, b[key].tokens + refill);
  b[key].last = now;
  if (b[key].tokens < 1) return false;
  b[key].tokens -= 1;
  return true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function broadcastRoom(room) {
  if (!room) return;
  const publicState = game.projectPublic(room);
  io.to(room.code).emit('room:state', publicState);
  for (const player of room.players) {
    if (player.socketId && player.connected) {
      const priv = game.projectPrivate(room, player.id);
      io.to(player.socketId).emit('room:private', priv);
    }
  }
}

function joinSocketToRoom(socket, room, player) {
  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.data.playerId = player.id;
}

function getContext(socket) {
  const room = rooms.getRoom(socket.data.roomCode);
  if (!room) return null;
  const player = room.players.find(p => p.socketId === socket.id);
  if (!player) return null;
  return { room, player };
}

function requireHost(socket, hostToken) {
  const ctx = getContext(socket);
  if (!ctx) return null;
  if (ctx.room.hostToken !== hostToken) return null;
  if (!ctx.player.isHost) return null;
  return ctx;
}

// ─── Socket lifecycle ────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.on('host:create', (payload, ack) => {
    try {
      if (!rateLimit(socket, 'create', 2)) throw new Error('Slow down');
      const room = rooms.newRoom();
      const player = rooms.addPlayer(room, {
        name: payload?.name || 'HOST',
        hue: payload?.hue,
        shape: payload?.shape,
        socketId: socket.id,
        isHost: true,
      });
      joinSocketToRoom(socket, room, player);
      rooms.appendChat(room, { from: 'SYSTEM', kind: 'system', text: `${player.name} opened the lobby` });
      ack?.({
        ok: true,
        code: room.code,
        playerId: player.id,
        token: player.token,
        hostToken: room.hostToken,
      });
      broadcastRoom(room);
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('player:join', (payload, ack) => {
    try {
      if (!rateLimit(socket, 'join', 3)) throw new Error('Slow down');
      const room = rooms.getRoom(payload?.code);
      if (!room) throw new Error('Room not found');
      if (room.state !== 'lobby') throw new Error('Game already in progress');
      const player = rooms.addPlayer(room, {
        name: payload.name,
        hue: payload.hue,
        shape: payload.shape,
        socketId: socket.id,
        isHost: false,
      });
      joinSocketToRoom(socket, room, player);
      rooms.appendChat(room, { from: 'SYSTEM', kind: 'system', text: `${player.name} joined` });
      ack?.({
        ok: true,
        code: room.code,
        playerId: player.id,
        token: player.token,
      });
      broadcastRoom(room);
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('player:reconnect', (payload, ack) => {
    try {
      const room = rooms.getRoom(payload?.code);
      if (!room) throw new Error('Room not found');
      const player = rooms.reconnectPlayer(room, {
        playerId: payload.playerId,
        token: payload.token,
        socketId: socket.id,
      });
      joinSocketToRoom(socket, room, player);
      ack?.({
        ok: true,
        code: room.code,
        playerId: player.id,
        token: player.token,
        hostToken: player.isHost ? room.hostToken : null,
      });
      broadcastRoom(room);
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('host:settings', (payload, ack) => {
    const ctx = requireHost(socket, payload?.hostToken);
    if (!ctx) return ack?.({ ok: false, error: 'Not host' });
    if (ctx.room.state !== 'lobby') return ack?.({ ok: false, error: 'In progress' });
    const s = payload.settings || {};
    if (['trivia', 'impostor', 'mixed'].includes(s.mode)) ctx.room.settings.mode = s.mode;
    if (Number.isFinite(s.rounds)) ctx.room.settings.rounds = Math.max(3, Math.min(30, s.rounds));
    if (Number.isFinite(s.timePerQuestion)) ctx.room.settings.timePerQuestion = Math.max(8, Math.min(45, s.timePerQuestion));
    if (Array.isArray(s.categories) && s.categories.length) ctx.room.settings.categories = s.categories;
    if (['easy', 'medium', 'hard', 'mixed'].includes(s.difficulty)) ctx.room.settings.difficulty = s.difficulty;
    if (Number.isFinite(s.cluesPerPlayer)) ctx.room.settings.cluesPerPlayer = Math.max(1, Math.min(3, s.cluesPerPlayer));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('host:start', (payload, ack) => {
    const ctx = requireHost(socket, payload?.hostToken);
    if (!ctx) return ack?.({ ok: false, error: 'Not host' });
    if (ctx.room.state !== 'lobby') return ack?.({ ok: false, error: 'Already running' });
    const minPlayers = ctx.room.settings.mode === 'impostor' ? 3 : 2;
    if (ctx.room.players.filter(p => p.connected).length < minPlayers) {
      return ack?.({ ok: false, error: `Need ${minPlayers}+ players` });
    }
    game.startGame(ctx.room, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('host:next', (payload, ack) => {
    const ctx = requireHost(socket, payload?.hostToken);
    if (!ctx) return ack?.({ ok: false, error: 'Not host' });
    game.hostAdvance(ctx.room, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('host:reset', (payload, ack) => {
    const ctx = requireHost(socket, payload?.hostToken);
    if (!ctx) return ack?.({ ok: false, error: 'Not host' });
    game.resetToLobby(ctx.room, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('host:kick', (payload, ack) => {
    const ctx = requireHost(socket, payload?.hostToken);
    if (!ctx) return ack?.({ ok: false, error: 'Not host' });
    if (payload.playerId === ctx.player.id) return ack?.({ ok: false, error: 'Cannot kick self' });
    const removed = rooms.removePlayer(ctx.room, payload.playerId);
    if (removed?.socketId) {
      io.to(removed.socketId).emit('kicked');
      io.sockets.sockets.get(removed.socketId)?.leave(ctx.room.code);
    }
    rooms.appendChat(ctx.room, { from: 'SYSTEM', kind: 'system', text: `${removed?.name || 'A player'} was kicked` });
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('player:answer', (payload, ack) => {
    if (!rateLimit(socket, 'answer', 5)) return;
    const ctx = getContext(socket);
    if (!ctx) return;
    const choice = Number(payload?.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) return ack?.({ ok: false });
    game.recordTriviaAnswer(ctx.room, ctx.player.id, choice, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('player:clue', (payload, ack) => {
    if (!rateLimit(socket, 'clue', 3)) return;
    const ctx = getContext(socket);
    if (!ctx) return;
    game.recordClue(ctx.room, ctx.player.id, payload?.word, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('player:vote', (payload, ack) => {
    if (!rateLimit(socket, 'vote', 3)) return;
    const ctx = getContext(socket);
    if (!ctx) return;
    game.recordVote(ctx.room, ctx.player.id, payload?.suspectId, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('player:guess', (payload, ack) => {
    if (!rateLimit(socket, 'guess', 2)) return;
    const ctx = getContext(socket);
    if (!ctx) return;
    game.recordBonusGuess(ctx.room, ctx.player.id, payload?.word, () => broadcastRoom(ctx.room));
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('chat:send', (payload, ack) => {
    if (!rateLimit(socket, 'chat', 4)) return;
    const ctx = getContext(socket);
    if (!ctx) return;
    const text = String(payload?.text || '').trim().slice(0, 200);
    if (!text) return;
    rooms.appendChat(ctx.room, {
      from: ctx.player.name,
      hue: ctx.player.hue,
      kind: 'user',
      text,
    });
    ack?.({ ok: true });
    broadcastRoom(ctx.room);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.getRoom(code);
    if (!room) return;
    const player = rooms.markDisconnected(room, socket.id);
    if (player) {
      rooms.appendChat(room, { from: 'SYSTEM', kind: 'system', text: `${player.name} disconnected` });
      // If host disconnects and there are other players, promote one
      if (player.isHost) {
        const next = room.players.find(p => p.connected && p.id !== player.id);
        if (next) {
          player.isHost = false;
          next.isHost = true;
          room.hostId = next.id;
          room.hostToken = rooms.genId('h_');
          rooms.appendChat(room, { from: 'SYSTEM', kind: 'system', text: `${next.name} is now host` });
          if (next.socketId) {
            io.to(next.socketId).emit('host:promoted', { hostToken: room.hostToken });
          }
        }
      }
    }
    broadcastRoom(room);
  });
});

server.listen(PORT, () => {
  console.log(`QuantumQuiz listening on http://localhost:${PORT}`);
  console.log(`  ${game.QUESTIONS.length} questions, ${game.WORD_PAIRS.length} word pairs loaded`);
});
