// game.js — game state machine, scoring, phase transitions.
// All authoritative game logic lives here; the network layer (index.js)
// only forwards intent and broadcasts results.

const fs = require('fs');
const path = require('path');

const QUESTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'questions.json'), 'utf8'));
const WORD_PAIRS = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'word-pairs.json'), 'utf8'));

const REVEAL_MS = 6000;
const LEADERBOARD_MS = 6000;
const IMPOSTOR_REVEAL_MS = 10000;
const IMPOSTOR_CLUE_TURN_MS = 25000;
const IMPOSTOR_VOTE_MS = 30000;
const IMPOSTOR_BONUS_MS = 25000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(settings) {
  const { rounds, categories, difficulty } = settings;
  let pool = QUESTIONS.filter(q => categories.includes(q.category));
  if (difficulty && difficulty !== 'mixed') {
    pool = pool.filter(q => q.difficulty === difficulty);
  }
  if (pool.length === 0) pool = QUESTIONS.slice();
  return shuffle(pool).slice(0, Math.min(rounds, pool.length));
}

function pickWordPair() {
  return WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreAnswer({ correct, timeRemainingMs, totalMs, streak }) {
  if (!correct) return 0;
  const ratio = Math.max(0, Math.min(1, timeRemainingMs / totalMs));
  const base = Math.round(500 + 500 * ratio); // 500..1000
  const streakBonus = streak >= 2 ? streak * 100 : 0;
  return base + streakBonus;
}

// ─── Phase orchestration ─────────────────────────────────────────────────────

function clearPhaseTimer(room) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
  room.phaseEndsAt = null;
}

function setPhaseTimer(room, ms, fn) {
  clearPhaseTimer(room);
  room.phaseEndsAt = Date.now() + ms;
  room.phaseTimer = setTimeout(() => {
    room.phaseTimer = null;
    room.phaseEndsAt = null;
    fn();
  }, ms);
}

// Returns the next phase, given the current state of `room`.
function startGame(room, broadcast) {
  // Reset player scores at game start
  room.players.forEach(p => { p.score = 0; p.streak = 0; });
  if (room.settings.mode === 'impostor') {
    return startImpostorRound(room, broadcast);
  }
  return startTriviaRound(room, broadcast);
}

// ─── Trivia ──────────────────────────────────────────────────────────────────

function startTriviaRound(room, broadcast) {
  room.trivia = {
    questions: pickQuestions(room.settings),
    questionNum: 0,
    currentQuestion: null,
    answers: {},
    questionStartAt: null,
  };
  nextTriviaQuestion(room, broadcast);
}

function nextTriviaQuestion(room, broadcast) {
  clearPhaseTimer(room);
  const t = room.trivia;
  if (!t) return;
  if (t.questionNum >= t.questions.length) {
    return showPodium(room, broadcast);
  }
  const q = t.questions[t.questionNum];
  t.questionNum += 1;
  t.currentQuestion = q;
  t.answers = {};
  t.questionStartAt = Date.now();
  room.state = 'trivia-question';
  const totalMs = room.settings.timePerQuestion * 1000;
  setPhaseTimer(room, totalMs, () => {
    revealTriviaAnswer(room, broadcast);
    broadcast();
  });
  broadcast();
}

function recordTriviaAnswer(room, playerId, choice, broadcast) {
  const t = room.trivia;
  if (!t || room.state !== 'trivia-question') return;
  if (t.answers[playerId]) return; // locked
  const totalMs = room.settings.timePerQuestion * 1000;
  const elapsed = Date.now() - t.questionStartAt;
  const timeRemainingMs = Math.max(0, totalMs - elapsed);
  const player = room.players.find(p => p.id === playerId);
  if (!player || !player.connected) return;
  const correct = choice === t.currentQuestion.correct;
  const prevStreak = player.streak;
  const newStreak = correct ? prevStreak + 1 : 0;
  const pts = scoreAnswer({ correct, timeRemainingMs, totalMs, streak: prevStreak + 1 });
  t.answers[playerId] = {
    choice,
    correct,
    points: pts,
    timeRemainingMs,
    streakAtAnswer: newStreak,
  };
  // Don't apply score until reveal — keeps board clean during question
  // Check if everyone answered → reveal early
  const expected = room.players.filter(p => p.connected && p.id !== room.hostId).length;
  // Treat host as a spectator only if they're explicitly a non-player host —
  // in our model, host is also a player and can answer.
  const expectedAll = room.players.filter(p => p.connected).length;
  if (Object.keys(t.answers).length >= expectedAll) {
    revealTriviaAnswer(room, broadcast);
  }
  broadcast();
}

function revealTriviaAnswer(room, broadcast) {
  clearPhaseTimer(room);
  const t = room.trivia;
  if (!t || !t.currentQuestion) return;
  // Apply points + update streaks
  for (const player of room.players) {
    const a = t.answers[player.id];
    if (!a) {
      player.streak = 0;
      continue;
    }
    player.score += a.points;
    player.streak = a.correct ? a.streakAtAnswer : 0;
  }
  room.state = 'trivia-reveal';
  setPhaseTimer(room, REVEAL_MS, () => {
    showTriviaLeaderboard(room, broadcast);
    broadcast();
  });
}

function showTriviaLeaderboard(room, broadcast) {
  clearPhaseTimer(room);
  room.state = 'trivia-leaderboard';
  const t = room.trivia;
  const more = t && t.questionNum < t.questions.length;
  setPhaseTimer(room, LEADERBOARD_MS, () => {
    if (more) nextTriviaQuestion(room, broadcast);
    else showPodium(room, broadcast);
    broadcast();
  });
}

function showPodium(room, broadcast) {
  clearPhaseTimer(room);
  room.state = 'trivia-podium';
}

// ─── Impostor ────────────────────────────────────────────────────────────────

function startImpostorRound(room, broadcast) {
  const connected = room.players.filter(p => p.connected);
  if (connected.length < 3) {
    // Not enough players; bounce back to lobby
    room.state = 'lobby';
    return;
  }
  const pair = pickWordPair();
  const impostor = connected[Math.floor(Math.random() * connected.length)];
  const turnOrder = shuffle(connected.map(p => p.id));
  room.impostor = {
    word: pair,
    impostorId: impostor.id,
    clues: [],
    turnOrder,
    currentTurnIndex: 0,
    votes: {},
    bonusGuess: null,
    eliminatedId: null,
    cluesPerPlayer: room.settings.cluesPerPlayer || 1,
    roundsCompleted: 0,
  };
  room.state = 'impostor-reveal';
  setPhaseTimer(room, IMPOSTOR_REVEAL_MS, () => {
    startImpostorClues(room, broadcast);
    broadcast();
  });
}

function startImpostorClues(room, broadcast) {
  clearPhaseTimer(room);
  room.state = 'impostor-clues';
  setPhaseTimer(room, IMPOSTOR_CLUE_TURN_MS, () => {
    advanceImpostorTurn(room, true, broadcast);
    broadcast();
  });
}

function recordClue(room, playerId, word, broadcast) {
  const im = room.impostor;
  if (!im || room.state !== 'impostor-clues') return;
  const currentId = im.turnOrder[im.currentTurnIndex];
  if (currentId !== playerId) return;
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;
  const cleanWord = String(word || '').replace(/\s+/g, '').slice(0, 20).toUpperCase();
  if (!cleanWord) return;
  im.clues.push({
    playerId,
    name: player.name,
    hue: player.hue,
    word: cleanWord,
    role: playerId === im.impostorId ? 'impostor' : 'crew',
    at: Date.now(),
  });
  advanceImpostorTurn(room, false, broadcast);
}

function advanceImpostorTurn(room, autoSkip, broadcast) {
  const im = room.impostor;
  if (!im) return;
  im.currentTurnIndex += 1;
  const total = im.turnOrder.length * im.cluesPerPlayer;
  if (im.clues.length >= total || im.currentTurnIndex >= im.turnOrder.length * im.cluesPerPlayer) {
    return startImpostorVote(room, broadcast);
  }
  clearPhaseTimer(room);
  setPhaseTimer(room, IMPOSTOR_CLUE_TURN_MS, () => {
    advanceImpostorTurn(room, true, broadcast);
    broadcast();
  });
  if (broadcast && autoSkip) broadcast();
}

function startImpostorVote(room, broadcast) {
  clearPhaseTimer(room);
  room.state = 'impostor-vote';
  setPhaseTimer(room, IMPOSTOR_VOTE_MS, () => {
    resolveImpostorVote(room, broadcast);
    broadcast();
  });
}

function recordVote(room, voterId, suspectId, broadcast) {
  const im = room.impostor;
  if (!im || room.state !== 'impostor-vote') return;
  const voter = room.players.find(p => p.id === voterId);
  const suspect = room.players.find(p => p.id === suspectId);
  if (!voter || !voter.connected) return;
  if (!suspect) return;
  if (voterId === suspectId) return; // cannot vote self
  im.votes[voterId] = suspectId;
  const eligible = room.players.filter(p => p.connected).length;
  if (Object.keys(im.votes).length >= eligible) {
    resolveImpostorVote(room, broadcast);
  }
  if (broadcast) broadcast();
}

function resolveImpostorVote(room, broadcast) {
  clearPhaseTimer(room);
  const im = room.impostor;
  if (!im) return;
  const tally = {};
  for (const suspectId of Object.values(im.votes)) {
    tally[suspectId] = (tally[suspectId] || 0) + 1;
  }
  let topId = null;
  let topCount = 0;
  for (const [id, n] of Object.entries(tally)) {
    if (n > topCount) { topId = id; topCount = n; }
  }
  im.tally = tally;
  im.eliminatedId = topId;
  const caught = topId === im.impostorId;
  if (caught) {
    // Crew wins (provisional) — impostor gets bonus guess
    room.state = 'impostor-bonus';
    setPhaseTimer(room, IMPOSTOR_BONUS_MS, () => {
      finalizeImpostorResult(room, null, broadcast);
      broadcast();
    });
  } else {
    // Impostor survives → impostor wins outright
    finalizeImpostorResult(room, null, broadcast);
  }
}

function recordBonusGuess(room, playerId, word, broadcast) {
  const im = room.impostor;
  if (!im || room.state !== 'impostor-bonus') return;
  if (playerId !== im.impostorId) return;
  const guess = String(word || '').trim().toUpperCase().slice(0, 30);
  im.bonusGuess = { word: guess, correct: guess === String(im.word.crew).toUpperCase() };
  finalizeImpostorResult(room, im.bonusGuess, broadcast);
  if (broadcast) broadcast();
}

function finalizeImpostorResult(room, bonusGuess, broadcast) {
  clearPhaseTimer(room);
  const im = room.impostor;
  if (!im) return;
  const impostor = room.players.find(p => p.id === im.impostorId);
  const crew = room.players.filter(p => p.id !== im.impostorId && p.connected);
  const caught = im.eliminatedId === im.impostorId;
  if (!caught) {
    // Impostor survived
    if (impostor) impostor.score += 1000;
    im.outcome = 'impostor-wins';
  } else if (bonusGuess && bonusGuess.correct) {
    // Impostor caught but stole the win
    if (impostor) impostor.score += 750;
    im.outcome = 'impostor-steals';
  } else {
    // Crew wins
    crew.forEach(p => { p.score += 500; });
    if (bonusGuess && !bonusGuess.correct) {
      crew.forEach(p => { p.score += 200; });
    }
    im.outcome = 'crew-wins';
  }
  room.state = 'impostor-result';
}

// ─── Host advancement (manual) ───────────────────────────────────────────────

function hostAdvance(room, broadcast) {
  // Skip current phase early
  switch (room.state) {
    case 'trivia-question':
      return revealTriviaAnswer(room, broadcast);
    case 'trivia-reveal':
      return showTriviaLeaderboard(room, broadcast);
    case 'trivia-leaderboard':
      return room.trivia && room.trivia.questionNum < room.trivia.questions.length
        ? nextTriviaQuestion(room, broadcast)
        : showPodium(room, broadcast);
    case 'trivia-podium':
      return resetToLobby(room, broadcast);
    case 'impostor-reveal':
      return startImpostorClues(room, broadcast);
    case 'impostor-clues':
      return startImpostorVote(room, broadcast);
    case 'impostor-vote':
      return resolveImpostorVote(room, broadcast);
    case 'impostor-bonus':
      return finalizeImpostorResult(room, null, broadcast);
    case 'impostor-result':
      // Next impostor round, or back to lobby on host choice
      return startImpostorRound(room, broadcast);
  }
}

function resetToLobby(room, broadcast) {
  clearPhaseTimer(room);
  room.state = 'lobby';
  room.trivia = null;
  room.impostor = null;
  room.players.forEach(p => { p.score = 0; p.streak = 0; });
}

// ─── Public state projection ─────────────────────────────────────────────────

// What every player sees. Strips secrets (correct answer mid-question,
// impostor identity & word during play).
function projectPublic(room) {
  const out = {
    code: room.code,
    state: room.state,
    hostId: room.hostId,
    settings: room.settings,
    phaseEndsAt: room.phaseEndsAt,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      hue: p.hue,
      shape: p.shape,
      connected: p.connected,
      isHost: p.isHost,
      score: p.score,
      streak: p.streak,
    })),
    chat: room.chat.slice(-50),
  };
  if (room.trivia) {
    const t = room.trivia;
    const showAnswer = room.state !== 'trivia-question';
    out.trivia = {
      questionNum: t.questionNum,
      totalQuestions: t.questions.length,
      question: t.currentQuestion ? {
        category: t.currentQuestion.category,
        difficulty: t.currentQuestion.difficulty,
        text: t.currentQuestion.text,
        options: t.currentQuestion.options,
        correct: showAnswer ? t.currentQuestion.correct : null,
      } : null,
      answeredCount: Object.keys(t.answers).length,
      distribution: showAnswer && t.currentQuestion
        ? t.currentQuestion.options.map((_, i) =>
            Object.values(t.answers).filter(a => a.choice === i).length)
        : null,
      results: showAnswer ? Object.entries(t.answers).map(([pid, a]) => ({
        playerId: pid, ...a,
      })) : null,
      questionStartAt: t.questionStartAt,
    };
  }
  if (room.impostor) {
    const im = room.impostor;
    const reveal = room.state === 'impostor-result' || room.state === 'impostor-bonus';
    out.impostor = {
      theme: im.word.theme,
      clues: im.clues.map(c => ({
        playerId: c.playerId, name: c.name, hue: c.hue, word: c.word,
        role: reveal ? c.role : null,
      })),
      turnOrder: im.turnOrder,
      currentTurnIndex: im.currentTurnIndex,
      currentTurnPlayerId: im.turnOrder[im.currentTurnIndex] || null,
      cluesPerPlayer: im.cluesPerPlayer,
      voteCount: Object.keys(im.votes).length,
      tally: im.tally || null,
      eliminatedId: im.eliminatedId,
      outcome: im.outcome || null,
      bonusGuess: reveal ? im.bonusGuess : null,
      // Reveal words only at end
      crewWord: reveal ? im.word.crew : null,
      impostorWord: reveal ? im.word.impostor : null,
      impostorId: reveal ? im.impostorId : null,
    };
  }
  return out;
}

// What a specific player sees in addition to public state. Their secret word,
// their recorded answer, whether it's their turn to clue, etc.
function projectPrivate(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;
  const out = {
    playerId,
    name: player.name,
    isHost: player.isHost,
    score: player.score,
    streak: player.streak,
  };
  if (room.trivia && room.state === 'trivia-question') {
    const a = room.trivia.answers[playerId];
    out.myAnswer = a ? { choice: a.choice, locked: true } : null;
  }
  if (room.impostor) {
    const im = room.impostor;
    const isImpostor = playerId === im.impostorId;
    out.impostor = {
      role: isImpostor ? 'impostor' : 'crew',
      myWord: isImpostor ? im.word.impostor : im.word.crew,
      isMyTurn: room.state === 'impostor-clues'
        && im.turnOrder[im.currentTurnIndex] === playerId,
      myVote: im.votes[playerId] || null,
    };
  }
  return out;
}

module.exports = {
  QUESTIONS,
  WORD_PAIRS,
  startGame,
  recordTriviaAnswer,
  recordClue,
  recordVote,
  recordBonusGuess,
  hostAdvance,
  resetToLobby,
  projectPublic,
  projectPrivate,
  REVEAL_MS,
  LEADERBOARD_MS,
};
