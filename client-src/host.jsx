// QuantumQuiz — Host display. Big-screen TV-style view of the live room state.
// Renders whichever scene the server says we're in.

(function () {
  const { Avatar, QR, TimerRing, Bar, Soundwave, Label, Confetti, useCountdown } = window.QQShared;
  const { useState, useEffect, useMemo } = React;

  function HostScreen({ store }) {
    const { room, self, private: priv } = store;
    if (!room) return null;
    const joinUrl = useMemo(() => {
      const u = new URL(window.location.origin + '/');
      u.searchParams.set('code', room.code);
      return u.toString();
    }, [room.code]);

    return (
      <div className="host-shell">
        <HostTopBar room={room} self={self} />
        <div className="host-stage tv-screen">
          <div className="tv-inner">
            <HostSwitch room={room} self={self} priv={priv} joinUrl={joinUrl} />
          </div>
        </div>
        <HostFootBar room={room} />
      </div>
    );
  }

  function HostTopBar({ room, self }) {
    const connected = room.players.filter(p => p.connected).length;
    return (
      <div className="host-topbar">
        <div className="brand">
          <div className="brand-mark"></div>
          <div>
            <div className="brand-name">QUANTUM<span className="accent">QUIZ</span></div>
            <div className="brand-tag">HOST DISPLAY · BIG SCREEN</div>
          </div>
        </div>
        <div className="topbar-status">
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>LIVE</span>
          </div>
          <div className="status-pill">
            <span>ROOM</span>
            <span style={{ color: 'var(--magenta)', fontWeight: 700, marginLeft: 6 }}>{room.code}</span>
          </div>
          <div className="status-pill"><span>{connected}/12</span></div>
          <button className="status-pill btn-ghostpill" onClick={() => {
            if (confirm('Leave room? The game will end if you are the only host.')) {
              QQ.actions.leave();
            }
          }}>LEAVE</button>
        </div>
      </div>
    );
  }

  function HostFootBar({ room }) {
    const connected = room.players.filter(p => p.connected).length;
    return (
      <div className="host-footbar mono">
        <span className="tv-foot-dot"></span>
        <span>QUANTUMQUIZ // HOST v1.0</span>
        <span style={{ marginLeft: 'auto' }}>ROOM · {room.code}</span>
        <span>{connected}/12 PLAYERS</span>
      </div>
    );
  }

  function HostSwitch({ room, self, priv, joinUrl }) {
    switch (room.state) {
      case 'lobby':                return <Lobby room={room} self={self} joinUrl={joinUrl} />;
      case 'trivia-question':      return <TriviaQuestion room={room} self={self} priv={priv} />;
      case 'trivia-reveal':        return <TriviaReveal room={room} self={self} priv={priv} />;
      case 'trivia-leaderboard':   return <TriviaLeaderboard room={room} />;
      case 'trivia-podium':        return <TriviaPodium room={room} />;
      case 'impostor-reveal':      return <ImpostorReveal room={room} priv={priv} />;
      case 'impostor-clues':       return <ImpostorClues room={room} priv={priv} />;
      case 'impostor-vote':        return <ImpostorVote room={room} priv={priv} />;
      case 'impostor-bonus':       return <ImpostorBonus room={room} priv={priv} />;
      case 'impostor-result':      return <ImpostorResult room={room} />;
      default:                     return <div className="mono ink-dim">unknown state: {room.state}</div>;
    }
  }

  // ─── Lobby ─────────────────────────────────────────────────────────────────
  function Lobby({ room, self, joinUrl }) {
    const connected = room.players.filter(p => p.connected);
    const canStart = connected.length >= (room.settings.mode === 'impostor' ? 3 : 2);
    const [showSettings, setShowSettings] = useState(false);
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div>
            <div className="eyebrow">LOBBY · WAITING FOR PLAYERS</div>
            <h2 className="h-display lobby-title">Tap in. Pick a name.</h2>
          </div>
          <div className="row gap">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(s => !s)}>⚙ SETTINGS</button>
            <button className="btn btn-primary btn-sm" disabled={!canStart}
              onClick={() => QQ.actions.startGame()}>▶ START GAME</button>
          </div>
        </div>

        <div className="lobby-grid">
          <div className="bracket m lobby-join">
            <div className="mono magenta-lbl">SCAN OR ENTER</div>
            <QR text={joinUrl} size={220} />
            <div className="lobby-code">
              <div className="mono ink-mute label-min">ROOM CODE</div>
              <div className="bignum lobby-code-text">{room.code}</div>
            </div>
            <div className="mono ink-mute join-url">{joinUrl.replace(/^https?:\/\//, '')}</div>
          </div>

          <div className="lobby-players">
            <div className="row spread">
              <div className="eyebrow">CONNECTED · {connected.length}/12</div>
              <div className="mono lime">● LIVE</div>
            </div>
            <div className="player-grid">
              {room.players.map(p => (
                <PlayerChip key={p.id} player={p} self={self} canKick={self?.role === 'host' && p.id !== self.playerId} />
              ))}
              {Array.from({ length: Math.max(0, 8 - room.players.length) }).slice(0, 4).map((_, i) => (
                <div key={`e${i}`} className="player-chip empty">
                  <div className="empty-av"></div>
                  <div className="mono ink-mute">SLOT {room.players.length + i + 1}</div>
                </div>
              ))}
            </div>
            {showSettings && <SettingsPanel settings={room.settings} />}
          </div>

          <LobbyChat room={room} self={self} />
        </div>
      </div>
    );
  }

  function PlayerChip({ player, self, canKick }) {
    return (
      <div className="player-chip" style={{
        opacity: player.connected ? 1 : 0.35,
        borderColor: player.isHost ? 'var(--magenta)' : 'var(--line)',
      }}>
        <Avatar name={player.name} hue={player.hue} shape={player.shape} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nm">
            {player.name}
            {player.isHost && <span className="badge-host mono">HOST</span>}
            {self?.playerId === player.id && <span className="badge-you mono">YOU</span>}
          </div>
          <div className="mono ink-mute small">{player.connected ? 'READY' : 'WAITING…'}</div>
        </div>
        {canKick
          ? <button className="kick-btn mono" onClick={() => {
              if (confirm(`Kick ${player.name}?`)) QQ.actions.kickPlayer(player.id);
            }}>✕</button>
          : <div className={`status-led ${player.connected ? 'on' : ''}`}></div>}
      </div>
    );
  }

  function SettingsPanel({ settings }) {
    return (
      <div className="settings-panel">
        <div className="eyebrow" style={{ marginBottom: 10 }}>GAME SETTINGS</div>
        <SettingRow label="MODE">
          {['trivia', 'impostor'].map(m => (
            <button key={m} className={`chip ${settings.mode === m ? 'active' : ''}`}
              onClick={() => QQ.actions.updateSettings({ mode: m })}>{m.toUpperCase()}</button>
          ))}
        </SettingRow>
        {settings.mode === 'trivia' && (
          <>
            <SettingRow label="ROUNDS">
              {[5, 10, 15, 20].map(n => (
                <button key={n} className={`chip ${settings.rounds === n ? 'active' : ''}`}
                  onClick={() => QQ.actions.updateSettings({ rounds: n })}>{n}</button>
              ))}
            </SettingRow>
            <SettingRow label="TIME">
              {[10, 15, 20, 30].map(n => (
                <button key={n} className={`chip ${settings.timePerQuestion === n ? 'active' : ''}`}
                  onClick={() => QQ.actions.updateSettings({ timePerQuestion: n })}>{n}s</button>
              ))}
            </SettingRow>
            <SettingRow label="DIFFICULTY">
              {['easy', 'medium', 'hard', 'mixed'].map(d => (
                <button key={d} className={`chip ${settings.difficulty === d ? 'active' : ''}`}
                  onClick={() => QQ.actions.updateSettings({ difficulty: d })}>{d.toUpperCase()}</button>
              ))}
            </SettingRow>
          </>
        )}
        {settings.mode === 'impostor' && (
          <SettingRow label="CLUES PER PLAYER">
            {[1, 2, 3].map(n => (
              <button key={n} className={`chip ${settings.cluesPerPlayer === n ? 'active' : ''}`}
                onClick={() => QQ.actions.updateSettings({ cluesPerPlayer: n })}>{n}</button>
            ))}
          </SettingRow>
        )}
      </div>
    );
  }

  function SettingRow({ label, children }) {
    return (
      <div className="setting-row">
        <span className="mono ink-mute">{label}</span>
        <div className="row gap-sm">{children}</div>
      </div>
    );
  }

  function LobbyChat({ room, self }) {
    const [text, setText] = useState('');
    const ref = React.useRef(null);
    useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [room.chat.length]);
    function send(e) {
      e.preventDefault();
      const t = text.trim();
      if (!t) return;
      QQ.actions.chat(t);
      setText('');
    }
    return (
      <div className="lobby-chat">
        <div className="row spread chat-head">
          <span className="eyebrow">LOBBY CHAT</span>
          <span className="mono ink-mute">{room.chat.length} MSGS</span>
        </div>
        <div className="chat-stream" ref={ref}>
          {room.chat.map((m, i) => (
            <div key={i} className={`chat-msg ${m.kind === 'system' ? 'system' : ''}`}>
              {m.kind === 'system'
                ? <div className="what">— {m.text} —</div>
                : <>
                  <Avatar name={m.from} hue={m.hue ?? 200} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="who" style={{ color: m.hue ? `oklch(0.75 0.2 ${m.hue})` : 'var(--ink-dim)' }}>{m.from}</div>
                    <div className="what">{m.text}</div>
                  </div>
                </>}
            </div>
          ))}
        </div>
        <form className="chat-input-row" onSubmit={send}>
          <input className="mono chat-input" placeholder="say something…"
            value={text} onChange={e => setText(e.target.value)} maxLength={200} />
          <button type="submit" className="btn btn-cyan btn-sm">SEND</button>
        </form>
      </div>
    );
  }

  // ─── Trivia ────────────────────────────────────────────────────────────────
  function TriviaQuestion({ room, priv }) {
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const total = room.settings.timePerQuestion;
    const q = room.trivia?.question;
    if (!q) return null;
    const answered = room.trivia.answeredCount;
    const totalPlayers = room.players.filter(p => p.connected).length;
    const picked = priv?.myAnswer?.choice ?? null;
    const locked = !!priv?.myAnswer;
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div className="row gap">
            <span className="cat-pill mono">{q.category.toUpperCase()}</span>
            <span className="mono ink-dim">◆ {q.difficulty.toUpperCase()}</span>
            <span className="mono ink-mute">QUESTION {room.trivia.questionNum}/{room.trivia.totalQuestions}</span>
          </div>
          <TimerRing seconds={seconds} total={total} size={92} color={seconds < 6 ? 'magenta' : 'cyan'} />
        </div>
        <div className="trivia-question-body">
          <h2 className="h-display trivia-q-text">{q.text}</h2>
          <div className="trivia-options">
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              return (
                <button
                  key={i}
                  className={`ans ${['a','b','c','d'][i]} ${isPicked ? 'picked' : ''}`}
                  disabled={locked}
                  onClick={() => QQ.actions.answer(i)}
                  style={{
                    borderColor: isPicked ? 'var(--magenta)' : undefined,
                    background: isPicked ? 'rgba(255,46,136,0.15)' : undefined,
                    boxShadow: isPicked ? 'var(--glow-m)' : undefined,
                    cursor: locked ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="shape">{['A','B','C','D'][i]}</div>
                  <div style={{ flex: 1 }}>{opt}</div>
                  {isPicked
                    ? <span className="mono magenta small">✓ LOCKED</span>
                    : <span className="mono ink-mute">{['A','B','C','D'][i]}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="scene-foot">
          <div className="mono ink-mute">
            ◆ {totalPlayers - answered} STILL ANSWERING · {answered} LOCKED IN
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => QQ.actions.advancePhase()}>SKIP →</button>
        </div>
      </div>
    );
  }

  function TriviaReveal({ room }) {
    const q = room.trivia?.question;
    if (!q) return null;
    const dist = room.trivia.distribution || [0, 0, 0, 0];
    const total = dist.reduce((a, b) => a + b, 0);
    const results = room.trivia.results || [];
    const fastest = results
      .filter(r => r.correct)
      .sort((a, b) => b.timeRemainingMs - a.timeRemainingMs)[0];
    const fastPlayer = fastest && room.players.find(p => p.id === fastest.playerId);
    return (
      <div className="scene-full">
        <div className="scene-head">
          <span className="cat-pill mono">{q.category.toUpperCase()}</span>
          <div className="eyebrow lime-glow">◆ ANSWER REVEAL</div>
          <span className="mono ink-mute">Q {room.trivia.questionNum}/{room.trivia.totalQuestions}</span>
        </div>
        <div className="reveal-body">
          <div className="reveal-correct">
            <div className="eyebrow">CORRECT ANSWER</div>
            <h2 className="h-display reveal-text">{q.options[q.correct]}</h2>
          </div>
          <div className="reveal-options">
            {q.options.map((opt, i) => {
              const correct = i === q.correct;
              return (
                <div key={i} className={`ans ${['a','b','c','d'][i]} ${correct ? 'correct' : dist[i] > 0 ? 'wrong' : ''}`}>
                  <div className="shape">{['A','B','C','D'][i]}</div>
                  <div style={{ flex: 1 }}>{opt}</div>
                  <div className="mono" style={{ fontWeight: 700, color: correct ? 'var(--lime)' : 'var(--ink-mute)' }}>
                    {dist[i]}/{total}
                  </div>
                </div>
              );
            })}
          </div>
          {fastPlayer && (
            <div className="reveal-fastest">
              <div className="eyebrow">FASTEST CORRECT</div>
              <div className="fastest-row">
                <Avatar name={fastPlayer.name} hue={fastPlayer.hue} size="md" />
                <div style={{ flex: 1 }}>
                  <div className="nm">{fastPlayer.name}</div>
                  <div className="mono ink-mute">locked at {((room.settings.timePerQuestion * 1000 - fastest.timeRemainingMs) / 1000).toFixed(1)}s · +{fastest.points} pts</div>
                </div>
                <div className="bignum lime">+{fastest.points}</div>
              </div>
            </div>
          )}
        </div>
        <div className="scene-foot end">
          <button className="btn btn-cyan btn-sm" onClick={() => QQ.actions.advancePhase()}>LEADERBOARD →</button>
        </div>
      </div>
    );
  }

  function TriviaLeaderboard({ room }) {
    const seconds = useCountdown(room.phaseEndsAt);
    const sorted = [...room.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const max = sorted[0]?.score || 1;
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div>
            <div className="eyebrow">AFTER Q {room.trivia.questionNum} / {room.trivia.totalQuestions}</div>
            <h2 className="h-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '6px 0 0' }}>Leaderboard</h2>
          </div>
          {seconds != null && (
            <div className="row gap">
              <span className="mono ink-mute">NEXT IN</span>
              <span className="bignum cyan-glow" style={{ fontSize: 32 }}>{String(seconds).padStart(2, '0')}</span>
            </div>
          )}
        </div>
        <div className="leaderboard">
          {sorted.map((p, i) => {
            const w = (p.score / max) * 100;
            const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const lastAnswer = room.trivia.results?.find(r => r.playerId === p.id);
            return (
              <div key={p.id} className={`lb-row ${rankCls}`}>
                <span className="rank">#{i + 1}</span>
                <Avatar name={p.name} hue={p.hue} shape={p.shape} size="md" />
                <div>
                  <div className="nm">
                    {p.name}
                    {p.streak >= 3 && <span className="mono amber" style={{ marginLeft: 10, fontSize: 11 }}>🔥 {p.streak} STREAK</span>}
                  </div>
                  <div className="lb-bar"><div className="lb-bar-fill" style={{ width: `${w}%`, background: rankColor(i) }}></div></div>
                </div>
                <span className="score">
                  {p.score.toLocaleString()}
                  {lastAnswer?.points > 0 && <span className="delta">+{lastAnswer.points}</span>}
                </span>
              </div>
            );
          })}
        </div>
        <div className="scene-foot end">
          <button className="btn btn-cyan btn-sm" onClick={() => QQ.actions.advancePhase()}>NEXT →</button>
        </div>
      </div>
    );
  }

  function rankColor(i) {
    return i === 0 ? 'var(--amber)' : i === 1 ? '#c0c0d8' : i === 2 ? '#c97c4e' : 'var(--cyan)';
  }

  function TriviaPodium({ room }) {
    const sorted = [...room.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);
    const order = [1, 0, 2];
    const heights = { 0: 260, 1: 200, 2: 150 };
    return (
      <div className="scene-full podium-scene">
        <Confetti />
        <div className="podium-head">
          <div className="eyebrow flicker amber-glow">◆ GAME OVER · CHAMPION ◆</div>
          <h2 className="h-display podium-winner">{top3[0]?.name || 'NO ONE'} WINS</h2>
        </div>
        <div className="podium-row">
          {order.map(idx => {
            const p = top3[idx];
            if (!p) return null;
            const color = idx === 0 ? 'var(--amber)' : idx === 1 ? '#c0c0d8' : '#c97c4e';
            return (
              <div key={p.id} className="podium-col">
                <div className="podium-av">
                  <Avatar name={p.name} hue={p.hue} shape={p.shape} size="lg" />
                </div>
                <div className="podium-block" style={{
                  height: heights[idx],
                  '--podium-color': color,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}22 100%)`,
                  borderColor: color,
                  boxShadow: `0 0 20px ${color}55, inset 0 0 30px ${color}44`,
                }}>
                  <div className="podium-name">{p.name}</div>
                  <div className="bignum podium-score">{p.score.toLocaleString()}</div>
                  <span className="bignum podium-num">{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="podium-actions">
          <button className="btn btn-primary btn-sm" onClick={() => QQ.actions.resetGame()}>▶ BACK TO LOBBY</button>
        </div>
      </div>
    );
  }

  // ─── Impostor ──────────────────────────────────────────────────────────────
  function ImpostorReveal({ room, priv }) {
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const [shown, setShown] = useState(false);
    const role = priv?.impostor?.role;
    const word = priv?.impostor?.myWord;
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div>
            <div className="eyebrow purple">◆ MODE: IMPOSTOR</div>
            <h2 className="h-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '6px 0 0' }}>Words have been dealt</h2>
          </div>
          <div className="bignum purple-glow" style={{ fontSize: 64 }}>{String(seconds).padStart(2, '0')}</div>
        </div>
        <div className="impostor-reveal-body">
          <div className="eyebrow ink-dim">YOUR WORD IS PRIVATE · DO NOT SHOW OTHERS</div>
          <div className="theme-card purple-glow">
            <div>
              <div className="mono ink-mute label-min">THEME</div>
              <div className="h-display" style={{ fontSize: 36 }}>{room.impostor.theme}</div>
            </div>
            <div className="theme-divider"></div>
            <div>
              <div className="mono ink-mute label-min">YOUR ROLE</div>
              <div className="mono cyan" style={{ fontSize: 18, marginTop: 4 }}>
                {shown ? (role === 'impostor' ? 'IMPOSTOR' : 'CREW') : 'SECRET'}
              </div>
            </div>
          </div>
          {word && (
            <button onClick={() => setShown(s => !s)} className={`reveal-box ${shown ? 'shown' : ''}`}
              style={{ maxWidth: 480, width: '100%' }}>
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
                </>
              )}
            </button>
          )}
          <div className="impostor-grid">
            {room.players.filter(p => p.connected).map(p => (
              <div key={p.id} className="player-chip mini">
                <Avatar name={p.name} hue={p.hue} shape={p.shape} size="sm" />
                <div style={{ flex: 1 }}>
                  <div className="nm small">{p.name}</div>
                  <div className="mono lime small">● READ</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="scene-foot end">
          <button className="btn btn-primary btn-sm" onClick={() => QQ.actions.advancePhase()}>BEGIN CLUES →</button>
        </div>
      </div>
    );
  }

  function ImpostorClues({ room, priv }) {
    const im = room.impostor;
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const currentPlayer = room.players.find(p => p.id === im.currentTurnPlayerId);
    const total = im.turnOrder.length * im.cluesPerPlayer;
    const isMyTurn = priv?.impostor?.isMyTurn;
    const [clue, setClue] = useState('');
    function submitClue(e) {
      e.preventDefault();
      const w = clue.trim();
      if (!w) return;
      QQ.actions.clue(w);
      setClue('');
    }
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div>
            <div className="eyebrow purple">◆ CLUE PHASE</div>
            <h2 className="h-display" style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', margin: '6px 0 0' }}>Drop your hint</h2>
            {priv?.impostor?.myWord && (
              <div className="mono ink-mute small" style={{ marginTop: 8 }}>
                YOUR WORD ·{' '}
                <span style={{
                  color: priv.impostor.role === 'impostor' ? 'var(--magenta)' : 'var(--lime)',
                  fontWeight: 700,
                }}>{priv.impostor.myWord}</span>
              </div>
            )}
          </div>
          <div className="row gap" style={{ alignItems: 'center' }}>
            {currentPlayer && (
              <div className="now-up">
                <div className="mono ink-mute small">NOW UP</div>
                <div className="h-display" style={{ fontSize: 26, color: 'var(--magenta)' }}>{currentPlayer.name}</div>
              </div>
            )}
            <TimerRing seconds={seconds} total={25} size={72} color="magenta" />
          </div>
        </div>
        {isMyTurn && (
          <form className="p-turn-input" onSubmit={submitClue} style={{ maxWidth: 480, alignSelf: 'center', width: '100%' }}>
            <div className="mono magenta-glow small label-min">◆ YOUR TURN — TYPE 1 WORD</div>
            <input value={clue}
              onChange={e => setClue(e.target.value.replace(/\s/g, '').slice(0, 12))}
              className="mono clue-input" autoFocus placeholder="word" />
            <div className="mono ink-mute small" style={{ textAlign: 'right' }}>{clue.length}/12 · NO PHRASES</div>
            <button type="submit" className="btn btn-primary btn-block btn-sm" disabled={!clue.trim()}>DROP CLUE →</button>
          </form>
        )}
        <div className="impostor-clues-grid">
          <div className="card panel">
            <div className="eyebrow" style={{ marginBottom: 14 }}>CLUES GIVEN · {im.clues.length}/{total}</div>
            <div className="clue-stream">
              {im.clues.map((c, i) => (
                <div key={i} className="clue-row">
                  <span className="mono ink-mute clue-num">0{i + 1}</span>
                  <Avatar name={c.name} hue={c.hue} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono ink-mute small">{c.name} SAYS</div>
                    <div className="h-display" style={{ fontSize: 22, marginTop: 2 }}>"{c.word}"</div>
                  </div>
                </div>
              ))}
              {currentPlayer && (
                <div className="clue-row typing">
                  <span className="mono magenta clue-num">{String(im.clues.length + 1).padStart(2, '0')}</span>
                  <Avatar name={currentPlayer.name} hue={currentPlayer.hue} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div className="mono magenta small">{currentPlayer.name} IS TYPING…</div>
                    <Soundwave color="#ff2e88" bars={14} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="card panel">
            <div className="eyebrow" style={{ marginBottom: 12 }}>TURN ORDER</div>
            <div className="turn-order">
              {im.turnOrder.map((pid, i) => {
                const p = room.players.find(x => x.id === pid);
                const done = i < im.currentTurnIndex;
                const now = i === im.currentTurnIndex;
                return (
                  <div key={pid + i} className={`turn-row ${now ? 'now' : ''} ${done ? 'done' : ''}`}>
                    <span className="mono small">{done ? '✓' : now ? '▸' : '○'}</span>
                    <span className="nm small" style={{ flex: 1 }}>{p?.name || '?'}</span>
                    <span className="mono small ink-mute">{done ? 'DONE' : now ? 'NOW' : '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="scene-foot end">
          <button className="btn btn-ghost btn-sm" onClick={() => QQ.actions.advancePhase()}>SKIP TO VOTE →</button>
        </div>
      </div>
    );
  }

  function ImpostorVote({ room, priv }) {
    const im = room.impostor;
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const connected = room.players.filter(p => p.connected);
    const totalVotes = im.voteCount;
    const myVote = priv?.impostor?.myVote;
    const myId = priv?.playerId;
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div>
            <div className="eyebrow magenta-glow">◆ VOTE PHASE</div>
            <h2 className="h-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '6px 0 0' }}>Who's the impostor?</h2>
            <div className="mono ink-mute small" style={{ marginTop: 6 }}>
              REVIEW THE CLUES · TAP A SUSPECT · MAJORITY DECIDES
            </div>
          </div>
          <TimerRing seconds={seconds} total={30} size={84} color="magenta" />
        </div>
        <div className="vote-grid">
          {connected.map(p => {
            const isSelf = p.id === myId;
            const isPicked = myVote === p.id;
            return (
              <button key={p.id}
                className={`vote-tile ${isPicked ? 'selected' : ''}`}
                disabled={isSelf}
                onClick={() => !isSelf && QQ.actions.vote(p.id)}
                style={{
                  borderColor: isPicked ? 'var(--magenta)' : 'var(--line)',
                  boxShadow: isPicked ? 'var(--glow-m)' : 'none',
                  background: isPicked ? 'rgba(255,46,136,0.15)' : 'var(--panel-2)',
                  opacity: isSelf ? 0.45 : 1,
                  cursor: isSelf ? 'not-allowed' : 'pointer',
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}>
                <Avatar name={p.name} hue={p.hue} shape={p.shape} size="lg" />
                <div className="nm small">{p.name}</div>
                <div className="mono small" style={{ color: isPicked ? 'var(--magenta)' : 'var(--ink-mute)' }}>
                  {isSelf ? 'YOU' : isPicked ? '✓ VOTED' : 'TAP TO VOTE'}
                </div>
              </button>
            );
          })}
        </div>
        <div className="card panel" style={{ marginTop: 12 }}>
          <div className="eyebrow">CLUE RECAP</div>
          <div className="row wrap gap" style={{ marginTop: 10 }}>
            {im.clues.map((c, i) => (
              <div key={i} className="clue-recap">
                <Avatar name={c.name} hue={c.hue} size="sm" />
                <div>
                  <div className="mono ink-mute small">{c.name}</div>
                  <div className="nm">"{c.word}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="scene-foot">
          <div className="mono ink-mute">◆ {totalVotes}/{connected.length} VOTED</div>
          <button className="btn btn-primary btn-sm" onClick={() => QQ.actions.advancePhase()}>LOCK VOTES →</button>
        </div>
      </div>
    );
  }

  function ImpostorBonus({ room, priv }) {
    const seconds = useCountdown(room.phaseEndsAt) || 0;
    const im = room.impostor;
    const impostor = room.players.find(p => p.id === im.impostorId);
    const amImpostor = priv?.impostor?.role === 'impostor';
    const [guess, setGuess] = useState('');
    function submitGuess(e) {
      e.preventDefault();
      const w = guess.trim();
      if (!w) return;
      QQ.actions.bonusGuess(w);
    }
    return (
      <div className="scene-full">
        <div className="scene-head">
          <div>
            <div className="eyebrow magenta-glow">◆ BONUS · IMPOSTOR'S LAST CHANCE</div>
            <h2 className="h-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '6px 0 0' }}>
              {amImpostor
                ? 'You were caught — guess the crew word'
                : `${impostor ? impostor.name : 'Impostor'} guesses the crew's word`}
            </h2>
          </div>
          <TimerRing seconds={seconds} total={25} size={84} color="magenta" />
        </div>
        <div className="bonus-body">
          {amImpostor ? (
            <form onSubmit={submitGuess} className="card panel bracket m"
              style={{ padding: 28, maxWidth: 560, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="mono ink-mute label-min">CORRECT → STEALS THE WIN · WRONG → CREW BONUS</div>
              <div className="mono ink-mute small">
                Theme: <span className="ink-dim">{im.theme}</span> · Your word was{' '}
                <span style={{ color: 'var(--magenta)' }}>{priv?.impostor?.myWord}</span>
              </div>
              <input value={guess}
                onChange={e => setGuess(e.target.value.toUpperCase().slice(0, 30))}
                className="mono clue-input" autoFocus placeholder="CREW WORD"
                style={{ fontSize: 28 }} />
              <button type="submit" className="btn btn-primary btn-block" disabled={!guess.trim()}>
                LOCK GUESS →
              </button>
            </form>
          ) : (
            <div className="card panel bracket m" style={{ padding: 32 }}>
              <div className="mono ink-mute label-min">CORRECT → STEALS THE WIN · WRONG → CREW BONUS</div>
              <div className="h-display" style={{ fontSize: 60, color: 'var(--magenta)', textShadow: 'var(--glow-m)', marginTop: 16 }}>
                "<span className="flicker">_</span>"
              </div>
              <div className="mono ink-mute" style={{ marginTop: 14 }}>Watching the impostor's phone…</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function ImpostorResult({ room }) {
    const im = room.impostor;
    const impostor = room.players.find(p => p.id === im.impostorId);
    const eliminated = room.players.find(p => p.id === im.eliminatedId);
    const crewWon = im.outcome === 'crew-wins';
    return (
      <div className="scene-full">
        <Confetti />
        <div className="scene-head center">
          <div className="eyebrow lime-glow">◆ {im.outcome === 'crew-wins' ? 'THE CREW WINS' : im.outcome === 'impostor-wins' ? 'IMPOSTOR ESCAPES' : 'IMPOSTOR STEALS THE WIN'} ◆</div>
          <h2 className="h-display result-headline">
            {impostor?.name || '?'} was the impostor
          </h2>
        </div>
        <div className="impostor-result-grid">
          <div className="card panel cyan-border">
            <div className="eyebrow cyan-glow">WORD PAIR · {room.impostor.theme}</div>
            <div className="word-pair">
              <div className="word-side crew">
                <div className="mono ink-mute label-min">CREW WORD</div>
                <div className="h-display lime-text">{im.crewWord}</div>
              </div>
              <div className="word-vs mono">vs</div>
              <div className="word-side impostor">
                <div className="mono ink-mute label-min">IMPOSTOR WORD</div>
                <div className="h-display magenta-text">{im.impostorWord}</div>
              </div>
            </div>
            <div className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>FINAL VOTE TALLY</div>
            <div className="vote-tally">
              {Object.entries(im.tally || {}).map(([pid, n]) => {
                const p = room.players.find(x => x.id === pid);
                if (!p) return null;
                return (
                  <div key={pid} className="vote-tally-row">
                    <Avatar name={p.name} hue={p.hue} size="sm" />
                    <div style={{ flex: 1 }}>
                      <div className="row spread">
                        <span className="nm small">{p.name}{pid === im.impostorId && <span className="mono magenta small"> · IMPOSTOR</span>}</span>
                        <span className="mono ink-mute small">{n} votes</span>
                      </div>
                      <Bar value={n} max={Math.max(1, ...Object.values(im.tally || { _: 1 }))}
                        color={pid === im.impostorId ? 'lime' : 'magenta'} height={8} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card panel magenta-border">
            <div className="eyebrow magenta-glow">BONUS GUESS</div>
            {im.bonusGuess ? (
              <>
                <div className="mono ink-mute" style={{ marginTop: 12 }}>{impostor?.name || 'Impostor'} guessed</div>
                <div className="h-display" style={{ fontSize: 44, marginTop: 6 }}>"{im.bonusGuess.word}"</div>
                <div className="card panel" style={{
                  marginTop: 16, padding: 14,
                  background: im.bonusGuess.correct
                    ? 'linear-gradient(180deg, rgba(255,46,136,0.2), transparent)'
                    : 'linear-gradient(180deg, rgba(200,255,43,0.15), transparent)',
                  border: im.bonusGuess.correct ? '1px solid var(--magenta)' : '1px solid var(--lime)',
                }}>
                  <div className="eyebrow" style={{ color: im.bonusGuess.correct ? 'var(--magenta)' : 'var(--lime)' }}>RESULT</div>
                  <div className="nm" style={{ marginTop: 6 }}>
                    {im.bonusGuess.correct
                      ? `Correct! Impostor stole the win.`
                      : `Wrong! Crew word was ${im.crewWord}.`}
                  </div>
                  <div className="mono ink-mute small" style={{ marginTop: 6 }}>
                    {im.bonusGuess.correct
                      ? `+750 to ${impostor?.name}`
                      : `+500 crew win · +200 bonus to surviving crew`}
                  </div>
                </div>
              </>
            ) : crewWon ? (
              <div className="mono ink-mute" style={{ marginTop: 12 }}>No bonus guess submitted in time.</div>
            ) : (
              <div className="mono ink-mute" style={{ marginTop: 12 }}>
                The impostor was not caught. No bonus.<br />
                +1000 to {impostor?.name}.
              </div>
            )}
            <div className="row gap end" style={{ marginTop: 'auto', paddingTop: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => QQ.actions.resetGame()}>BACK TO LOBBY</button>
              <button className="btn btn-primary btn-sm" onClick={() => QQ.actions.advancePhase()}>NEXT ROUND →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.QQHost = HostScreen;
})();
