// rooms.js — in-memory room registry, lifecycle, player join/reconnect.

const crypto = require('crypto');

const rooms = new Map(); // code -> Room

const MAX_PLAYERS = 12;
const ROOM_TTL_MS = 1000 * 60 * 60 * 4;       // 4 hours of inactivity → GC
const RECONNECT_WINDOW_MS = 1000 * 60;        // 60s reconnect window

function genCode() {
  // 6 chars, omit easily-confused (O/0, I/1, L)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  } while (rooms.has(code));
  return code;
}

function genId(prefix = '') {
  return prefix + crypto.randomBytes(8).toString('hex');
}

function newRoom() {
  const code = genCode();
  const room = {
    code,
    hostId: null,           // player id of the host
    hostToken: genId('h_'),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    state: 'lobby',
    players: [],
    chat: [],
    settings: {
      mode: 'trivia',
      rounds: 10,
      timePerQuestion: 20,
      categories: ['General', 'Science', 'History', 'Geography', 'Film/TV', 'Music', 'Sports', 'Games', 'Literature', 'Tech', 'Food'],
      difficulty: 'mixed',
      cluesPerPlayer: 1,
    },
    trivia: null,
    impostor: null,
    phaseTimer: null,        // setTimeout handle for auto-advance
    phaseEndsAt: null,       // ms timestamp the current timed phase ends
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  if (!code) return null;
  return rooms.get(String(code).toUpperCase()) || null;
}

function touch(room) {
  if (room) room.lastActivity = Date.now();
}

function addPlayer(room, { name, hue, shape, socketId, isHost }) {
  const cleanName = String(name || '').trim().toUpperCase().slice(0, 10) || 'PLAYER';
  if (room.players.length >= MAX_PLAYERS) {
    throw new Error('Room is full');
  }
  if (room.players.some(p => p.connected && p.name === cleanName)) {
    throw new Error('Name already taken in this room');
  }
  const player = {
    id: genId('p_'),
    token: genId('t_'),
    name: cleanName,
    hue: Number.isFinite(hue) ? hue : 200,
    shape: Number.isFinite(shape) ? shape : 0,
    socketId,
    connected: true,
    isHost: !!isHost,
    isYou: false,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    score: 0,
    streak: 0,
  };
  room.players.push(player);
  if (isHost) {
    room.hostId = player.id;
  }
  touch(room);
  return player;
}

function reconnectPlayer(room, { playerId, token, socketId }) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Unknown player');
  if (player.token !== token) throw new Error('Bad token');
  const droppedFor = Date.now() - player.lastSeen;
  if (!player.connected && droppedFor > RECONNECT_WINDOW_MS) {
    throw new Error('Reconnect window expired');
  }
  player.connected = true;
  player.socketId = socketId;
  player.lastSeen = Date.now();
  touch(room);
  return player;
}

function markDisconnected(room, socketId) {
  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return null;
  player.connected = false;
  player.lastSeen = Date.now();
  touch(room);
  return player;
}

function findPlayerBySocket(room, socketId) {
  return room.players.find(p => p.socketId === socketId) || null;
}

function removePlayer(room, playerId) {
  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) return null;
  const [removed] = room.players.splice(idx, 1);
  if (room.hostId === playerId) {
    // Promote first remaining connected player
    const next = room.players.find(p => p.connected) || room.players[0];
    if (next) {
      next.isHost = true;
      room.hostId = next.id;
      room.hostToken = genId('h_');
    } else {
      room.hostId = null;
    }
  }
  touch(room);
  return removed;
}

function appendChat(room, msg) {
  const safe = {
    from: String(msg.from || 'SYSTEM').slice(0, 20),
    text: String(msg.text || '').slice(0, 240),
    hue: Number.isFinite(msg.hue) ? msg.hue : null,
    kind: msg.kind === 'system' ? 'system' : 'user',
    at: Date.now(),
  };
  room.chat.push(safe);
  if (room.chat.length > 200) room.chat.splice(0, room.chat.length - 200);
  touch(room);
  return safe;
}

function gcRooms() {
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const [code, room] of rooms) {
    if (room.lastActivity < cutoff) {
      if (room.phaseTimer) clearTimeout(room.phaseTimer);
      rooms.delete(code);
    }
  }
}
setInterval(gcRooms, 1000 * 60 * 15).unref?.();

function listRooms() {
  return Array.from(rooms.values()).map(r => ({
    code: r.code,
    players: r.players.length,
    state: r.state,
    createdAt: r.createdAt,
  }));
}

module.exports = {
  MAX_PLAYERS,
  RECONNECT_WINDOW_MS,
  newRoom,
  getRoom,
  addPlayer,
  reconnectPlayer,
  markDisconnected,
  findPlayerBySocket,
  removePlayer,
  appendChat,
  touch,
  listRooms,
  genId,
};
