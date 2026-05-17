// QuantumQuiz — Player display. Mobile-first phone view, wired to live state.

(function () {
  const { Avatar, TimerRing, Bar, Soundwave, Confetti, useCountdown } = window.QQShared;
  const { useState, useEffect, useRef } = React;

  function PlayerScreen({ store }) {
    const { room, private: priv, self } = store;
    if (!room || !priv) return <div className="player-shell waiting"><div className="mono ink-mute">Connecting…</div></div>;
    return (
      <div className="player-shell">
        <PlayerTopBar room={room} priv={priv} />
        <div className="player-stage">
          <PlayerSwitch room={room} priv={priv} self={self} />
        </div>
      </div>
    );
  }

  function PlayerTopBar({ room, priv }) {
    return (
      <div className="player-topbar">
        <div className="brand-mini">
          <div className="brand-mark sm"></div>
          <div>
            <div className="brand-name sm">QUANTUM<span className="accent">QUIZ</span></div>
            <div className="brand-tag sm">ROOM · {room.code}</div>
          </div>
        </div>
        <div className="row gap-sm">
          <div className="status-pill sm"><span>{priv.score.toLocaleString()} pts</span></div>
          <button className="status-pill sm btn-ghostpill" onClick={() => {
            if (confirm('Leave the room?')) QQ.actions.leave();
          }}>LEAVE</button>
        </div>
      </div>
    );
  }

  function PlayerSwitch({ room, priv, self }) {
    switch (room.state) {
      case 'lobby':                return <Lobby room={room} priv={priv} />;
      case 'trivia-question':      return <TriviaQuestion room={room} priv={priv} />;
      case 'trivia-reveal':        return <TriviaReveal room={room} priv={priv} />;
      case 'trivia-leaderboard':   return <TriviaLeaderboard room={room} priv={priv} />;
      case 'trivia-podium':        return <TriviaPodium room={room} priv={priv} />;
      case 'impostor-reveal':      return <ImpostorReveal room={room} priv={priv} />;
      case 'impostor-clues':       return <ImpostorClues room={room} priv={priv} />;
      case 'impostor-vote':        return <ImpostorVote room={room} priv={priv} />;
      case 'impostor-bonus':       return <ImpostorBonus room={room} priv={priv} />;
      case 'impostor-result':      return <ImpostorResult room={room} priv={priv} />;
      default:                     return <div className="mono ink-dim">unknown state: {room.state}</div>;
    }
  }

  // ─── Lobby ─────────────────────────────────────────────────────────────────
  function Lobby({ room, priv }) {
    const me = room.players.find(p => p.id === priv.playerId);
    const [text, setText] = useState('');
    const ref = useRef(null);
    useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [room.chat.length]);
    function send(e) {
      e.preventDefault();
      const t = text.trim();
      if (!t) return;
      QQ.actions.chat(t);
      setText('');
    }
    return (
      <div className="p-scene">
        <div className="p-hero">
          {me && <Avatar name={me.name} hue={me.hue} shape={me.shape} size="xl" />}
          <div className="nm xl">{me?.name}</div>
          <div className="mono lime small">● READY · WAITING ON HOST</div>
        </div>
        <div className="p-section">
          <div className="eyebrow">LOBBY · {room.players.filter(p => p.connected).length}/12</div>
          <div className="p-player-list">
            {room.players.filter(p => p.connected).map(p => (
              <div key={p.id} className={`p-player-row ${p.id === priv.playerId ? 'me' : ''}`}>
                <Avatar name={p.name} hue={p.hue} shape={p.shape} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="nm small">{p.name}</span>
                  {p.isHost && <span className="badge-host mono">HOST</span>}
                  {p.id === priv.playerId && <span className="badge-you mono">YOU</span>}
                </div>
                <div className="status-led on"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-section flex">
          <div className="eyebrow">CHAT</div>
          <div className="p-chat-stream" ref={ref}>
            {room.chat.slice(-30).map((m, i) => (
              <div key={i} className={`chat-msg ${m.kind === 'system' ? 'system' : ''}`}>
                {m.kind === 'system'
                  ? <div className="what small">— {m.text} —</div>
                  : <>
                    <Avatar name={m.from} hue={m.hue ?? 200} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="who small" style={{ color: m.hue ? `oklch(0.75 0.2 ${m.hue})` : 'var(--ink-dim)' }}>{m.from}</div>
                      <div className="what small">{m.text}</div>
                    </div>
                  </>}
              </div>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={send}>
            <input className="mono chat-input" placeholder="message…"
              value={text} onChange={e => setText(e.target.value)} maxLength={200} />
            <button type="submit" className="btn btn-cyan btn-sm">SEND</button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Trivia ────────────────────────────────────────────────────────────────
  function TriviaQuestion({ room, priv }) {
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const total = room.settings.timePerQuestion;
    const q = room.trivia?.question;
    if (!q) return null;
    const picked = priv.myAnswer?.choice ?? null;
    const locked = !!priv.myAnswer;
    return (
      <div className="p-scene">
        <div className="p-q-head">
          <span className="mono cyan-glow small">{q.category.toUpperCase()}</span>
          <span className="mono ink-mute small">Q {room.trivia.questionNum}/{room.trivia.totalQuestions}</span>
        </div>
        <div className="p-q-card">
          <div className="h-display p-q-text">{q.text}</div>
        </div>
        <div className="row spread p-q-timer">
          <span className="mono ink-mute small">TIME LEFT</span>
          <div className="bignum" style={{
            fontSize: 28,
            color: seconds < 6 ? 'var(--magenta)' : 'var(--cyan)',
            textShadow: seconds < 6 ? 'var(--glow-m)' : 'var(--glow-c)',
          }}>{String(seconds).padStart(2, '0')}s</div>
        </div>
        <div className="p-answers">
          {q.options.map((opt, i) => {
            const cls = ['a', 'b', 'c', 'd'][i];
            const isPicked = picked === i;
            return (
              <button key={i}
                className={`ans p-ans ${cls} ${isPicked ? 'picked' : ''}`}
                disabled={locked}
                onClick={() => QQ.actions.answer(i)}>
                <div className="shape"></div>
                <div style={{ flex: 1, textAlign: 'left' }}>{opt}</div>
                {isPicked && <span className="mono magenta small">✓ LOCKED</span>}
              </button>
            );
          })}
        </div>
        {locked && (
          <div className="mono lime center" style={{ letterSpacing: '0.2em', marginTop: 6 }}>
            ● ANSWER LOCKED · WAITING FOR OTHERS
          </div>
        )}
      </div>
    );
  }

  function TriviaReveal({ room, priv }) {
    const q = room.trivia?.question;
    const myResult = room.trivia?.results?.find(r => r.playerId === priv.playerId);
    const earned = myResult?.points || 0;
    const correct = myResult?.correct;
    const sorted = [...room.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === priv.playerId) + 1;
    return (
      <div className="p-scene center-col">
        <div className={`p-reveal-card ${correct ? 'win' : 'lose'}`}>
          <div className="mono small" style={{
            color: correct ? 'var(--lime)' : 'var(--magenta)',
            letterSpacing: '0.2em',
          }}>{correct ? '✓ CORRECT' : myResult ? '✗ WRONG' : '— NO ANSWER'}</div>
          <div className="h-display" style={{
            fontSize: 44,
            color: correct ? 'var(--lime)' : myResult ? 'var(--magenta)' : 'var(--ink-mute)',
            textShadow: correct ? 'var(--glow-l)' : myResult ? 'var(--glow-m)' : 'none',
            marginTop: 8,
          }}>{correct ? `+${earned}` : '+0'}</div>
          {myResult && <div className="mono ink-dim small" style={{ marginTop: 6 }}>
            locked at {((room.settings.timePerQuestion * 1000 - myResult.timeRemainingMs) / 1000).toFixed(1)}s
          </div>}
        </div>
        {q && <div className="card panel" style={{ padding: 14, marginTop: 12 }}>
          <div className="mono ink-mute small label-min">ANSWER</div>
          <div className="h-display" style={{ fontSize: 22, marginTop: 4 }}>{q.options[q.correct]}</div>
        </div>}
        <div className="row gap" style={{ marginTop: 12 }}>
          <div className="card panel sm-stat">
            <div className="mono ink-mute small label-min">STREAK</div>
            <div className="bignum amber" style={{ fontSize: 22 }}>🔥 {priv.streak}×</div>
          </div>
          <div className="card panel sm-stat">
            <div className="mono ink-mute small label-min">RANK</div>
            <div className="bignum cyan" style={{ fontSize: 22 }}>#{myRank}</div>
          </div>
        </div>
      </div>
    );
  }

  function TriviaLeaderboard({ room, priv }) {
    const sorted = [...room.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === priv.playerId) + 1;
    return (
      <div className="p-scene">
        <div className="card panel" style={{ textAlign: 'center', padding: 14 }}>
          <div className="mono cyan-glow small label-min">YOUR RANK</div>
          <div className="bignum cyan-glow" style={{ fontSize: 44 }}>#{myRank}</div>
          <div className="mono ink-mute">{priv.score.toLocaleString()} pts</div>
        </div>
        <div className="p-section flex">
          <div className="eyebrow">LEADERBOARD</div>
          <div className="p-player-list">
            {sorted.map((p, i) => (
              <div key={p.id} className={`p-lb-row ${p.id === priv.playerId ? 'me' : ''} ${i < 3 ? `top top-${i+1}` : ''}`}>
                <span className="mono small ink-mute" style={{ width: 22 }}>{i + 1}</span>
                <Avatar name={p.name} hue={p.hue} shape={p.shape} size="sm" />
                <div className="nm small" style={{ flex: 1 }}>{p.name}</div>
                <div className="mono lime small">{p.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function TriviaPodium({ room, priv }) {
    const sorted = [...room.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === priv.playerId) + 1;
    const me = sorted.find(p => p.id === priv.playerId);
    if (!me) return null;
    return (
      <div className="p-scene center-col">
        <div className="mono cyan-glow small">YOU FINISHED</div>
        <div className="bignum cyan-glow" style={{ fontSize: 80 }}>#{myRank}</div>
        <Avatar name={me.name} hue={me.hue} shape={me.shape} size="xl" />
        <div className="nm xl">{me.name}</div>
        <div className="bignum lime-glow" style={{ fontSize: 32 }}>{me.score.toLocaleString()}</div>
        <div className="mono ink-dim small">
          {sorted[0]?.name} took the crown.
        </div>
      </div>
    );
  }

  // ─── Impostor ──────────────────────────────────────────────────────────────
  function ImpostorReveal({ room, priv }) {
    const [shown, setShown] = useState(false);
    const role = priv.impostor?.role;
    const word = priv.impostor?.myWord;
    return (
      <div className="p-scene center-col">
        <div className="mono ink-mute small label-min">THEME</div>
        <div className="h-display" style={{ fontSize: 22 }}>{room.impostor.theme}</div>
        <button onClick={() => setShown(s => !s)} className={`reveal-box ${shown ? 'shown' : ''}`}>
          {!shown ? (
            <>
              <div className="mono purple-glow small label-min" style={{ marginBottom: 12 }}>TAP TO REVEAL</div>
              <div className="h-display" style={{ fontSize: 28, color: 'var(--ink-dim)' }}>● ● ● ● ●</div>
              <div className="mono ink-mute small label-min" style={{ marginTop: 12 }}>YOUR SECRET WORD</div>
            </>
          ) : (
            <>
              <div className="mono small label-min" style={{
                color: role === 'impostor' ? 'var(--magenta)' : 'var(--lime)',
                marginBottom: 12,
              }}>
                YOUR ROLE · {role === 'impostor' ? 'IMPOSTOR' : 'CREW'}
              </div>
              <div className="h-display" style={{
                fontSize: 42,
                color: role === 'impostor' ? 'var(--magenta)' : 'var(--lime)',
                textShadow: role === 'impostor' ? 'var(--glow-m)' : 'var(--glow-l)',
                wordBreak: 'break-word',
              }}>{word}</div>
              {role === 'impostor' && <div className="mono ink-mute small" style={{ marginTop: 12 }}>
                Bluff like you have the crew's word.
              </div>}
              {role === 'crew' && <div className="mono ink-mute small" style={{ marginTop: 12 }}>
                Shared with {room.players.filter(p => p.connected).length - 1} others.
              </div>}
            </>
          )}
        </button>
        <div className="mono ink-mute small center" style={{ lineHeight: 1.6 }}>
          Give a 1-word clue when it's your turn.<br />Vague enough to fool the impostor.
        </div>
      </div>
    );
  }

  function ImpostorClues({ room, priv }) {
    const im = room.impostor;
    const isMyTurn = priv.impostor?.isMyTurn;
    const [clue, setClue] = useState('');
    const currentPlayer = room.players.find(p => p.id === im.currentTurnPlayerId);
    const seconds = useCountdown(room.phaseEndsAt) || 0;

    function submit(e) {
      e.preventDefault();
      const w = clue.trim();
      if (!w) return;
      QQ.actions.clue(w);
      setClue('');
    }

    return (
      <div className="p-scene">
        <div className="card panel" style={{ padding: 12 }}>
          <div className="mono ink-mute small label-min">YOUR WORD</div>
          <div className="h-display" style={{
            fontSize: 22,
            color: priv.impostor?.role === 'impostor' ? 'var(--magenta)' : 'var(--lime)',
            textShadow: priv.impostor?.role === 'impostor' ? 'var(--glow-m)' : 'var(--glow-l)',
          }}>{priv.impostor?.myWord}</div>
        </div>

        <div className="p-section">
          <div className="row spread">
            <span className="eyebrow">CLUES ({im.clues.length})</span>
            <span className="mono ink-mute small">{seconds}s</span>
          </div>
          <div className="p-clue-list">
            {im.clues.length === 0 && <div className="mono ink-mute small">No clues yet…</div>}
            {im.clues.map((c, i) => (
              <div key={i} className="p-clue-row">
                <Avatar name={c.name} hue={c.hue} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono ink-mute small">{c.name}</div>
                  <div className="nm">"{c.word}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isMyTurn ? (
          <form className="p-turn-input" onSubmit={submit}>
            <div className="mono magenta-glow small label-min">◆ YOUR TURN — TYPE 1 WORD</div>
            <input value={clue}
              onChange={e => setClue(e.target.value.replace(/\s/g, '').slice(0, 12))}
              className="mono clue-input" autoFocus placeholder="word" />
            <div className="mono ink-mute small" style={{ textAlign: 'right' }}>{clue.length}/12 · NO PHRASES</div>
            <button type="submit" className="btn btn-primary btn-block btn-sm" disabled={!clue.trim()}>DROP CLUE →</button>
          </form>
        ) : (
          <div className="p-turn-wait">
            <div className="mono ink-mute small label-min">WAITING ON</div>
            <div className="nm xl" style={{ marginTop: 6 }}>{currentPlayer?.name || '—'}</div>
            <Soundwave color="#9d5cff" bars={14} />
          </div>
        )}
      </div>
    );
  }

  function ImpostorVote({ room, priv }) {
    const im = room.impostor;
    const myVote = priv.impostor?.myVote;
    const candidates = room.players.filter(p => p.connected && p.id !== priv.playerId);
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    return (
      <div className="p-scene">
        <div className="row spread">
          <div className="eyebrow magenta-glow">VOTE · {seconds}s</div>
          <span className="mono ink-mute small">{im.voteCount}/{room.players.filter(p => p.connected).length} VOTED</span>
        </div>
        <div className="mono ink-mute small">PICK 1 · MAJORITY ELIMINATES</div>
        <div className="p-vote-list">
          {candidates.map(p => {
            const picked = myVote === p.id;
            const myClue = im.clues.find(c => c.playerId === p.id)?.word;
            return (
              <button key={p.id} className={`p-vote-row ${picked ? 'picked' : ''}`}
                onClick={() => QQ.actions.vote(p.id)}>
                <Avatar name={p.name} hue={p.hue} shape={p.shape} size="sm" />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div className="nm">{p.name}</div>
                  <div className="mono ink-mute small">said "{myClue || '—'}"</div>
                </div>
                {picked && <span className="mono magenta small">✓</span>}
              </button>
            );
          })}
        </div>
        {myVote && <div className="mono lime small center" style={{ letterSpacing: '0.2em' }}>
          ● VOTE LOCKED · YOU CAN CHANGE IT
        </div>}
      </div>
    );
  }

  function ImpostorBonus({ room, priv }) {
    const im = room.impostor;
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const amImpostor = priv.impostor?.role === 'impostor';
    const [guess, setGuess] = useState('');
    function submit(e) {
      e.preventDefault();
      const w = guess.trim();
      if (!w) return;
      QQ.actions.bonusGuess(w);
    }
    if (!amImpostor) {
      const impostor = room.players.find(p => p.id === im.impostorId);
      return (
        <div className="p-scene center-col">
          <div className="mono magenta-glow small label-min">BONUS GUESS</div>
          <div className="h-display" style={{ fontSize: 28, lineHeight: 1.2, textAlign: 'center' }}>
            {impostor?.name || 'Impostor'} is<br />guessing your word
          </div>
          <div className="bignum magenta-glow" style={{ fontSize: 64 }}>{seconds}s</div>
          <Soundwave color="#ff2e88" bars={16} />
          <div className="mono ink-mute small center">
            Correct → impostor steals the win.<br />
            Wrong → crew gets bonus points.
          </div>
        </div>
      );
    }
    return (
      <div className="p-scene">
        <div className="mono magenta-glow small label-min">YOU WERE CAUGHT — LAST CHANCE</div>
        <div className="h-display" style={{ fontSize: 22, marginTop: 6 }}>
          Guess the crew's word in {seconds}s
        </div>
        <div className="card panel" style={{ padding: 14, marginTop: 12 }}>
          <div className="mono ink-mute small label-min">YOUR WORD WAS</div>
          <div className="h-display" style={{ fontSize: 22, color: 'var(--magenta)' }}>{priv.impostor?.myWord}</div>
          <div className="mono ink-mute small" style={{ marginTop: 8 }}>Theme: {room.impostor.theme}</div>
        </div>
        <form onSubmit={submit} className="p-turn-input" style={{ marginTop: 12 }}>
          <input value={guess}
            onChange={e => setGuess(e.target.value.toUpperCase().slice(0, 24))}
            className="mono clue-input" autoFocus placeholder="CREW WORD" />
          <button type="submit" className="btn btn-primary btn-block btn-sm" disabled={!guess.trim()}>
            LOCK GUESS →
          </button>
        </form>
      </div>
    );
  }

  function ImpostorResult({ room, priv }) {
    const im = room.impostor;
    const role = priv.impostor?.role;
    const crewWon = im.outcome === 'crew-wins';
    const impostorStole = im.outcome === 'impostor-steals';
    const impostor = room.players.find(p => p.id === im.impostorId);
    const youWon = (role === 'crew' && crewWon) || (role === 'impostor' && (im.outcome === 'impostor-wins' || impostorStole));
    return (
      <div className="p-scene center-col">
        <Confetti />
        <div className="mono small label-min" style={{
          color: youWon ? 'var(--lime)' : 'var(--magenta)',
          textShadow: youWon ? 'var(--glow-l)' : 'var(--glow-m)',
        }}>{youWon ? '✓ YOU WIN' : '✗ YOU LOSE'}</div>
        <div className="h-display" style={{ fontSize: 26, lineHeight: 1.2, textAlign: 'center' }}>
          <span style={{ color: 'var(--magenta)' }}>{impostor?.name}</span> was<br />the impostor
        </div>
        <div className="row gap" style={{ width: '100%' }}>
          <div className="card panel sm-stat" style={{ borderColor: 'var(--lime)' }}>
            <div className="mono ink-mute small label-min">CREW WORD</div>
            <div className="h-display" style={{ fontSize: 18, color: 'var(--lime)' }}>{im.crewWord}</div>
          </div>
          <div className="card panel sm-stat" style={{ borderColor: 'var(--magenta)' }}>
            <div className="mono ink-mute small label-min">IMPOSTOR HAD</div>
            <div className="h-display" style={{ fontSize: 18, color: 'var(--magenta)' }}>{im.impostorWord}</div>
          </div>
        </div>
        <div className="card panel" style={{ width: '100%', padding: 14, borderColor: youWon ? 'var(--lime)' : 'var(--magenta)' }}>
          <div className="mono ink-mute small label-min">YOUR SCORE</div>
          <div className="bignum" style={{
            fontSize: 36,
            color: youWon ? 'var(--lime)' : 'var(--magenta)',
            textShadow: youWon ? 'var(--glow-l)' : 'var(--glow-m)',
          }}>{priv.score.toLocaleString()}</div>
        </div>
        <div className="mono ink-mute small">Waiting for host to continue…</div>
      </div>
    );
  }

  window.QQPlayer = PlayerScreen;
})();
