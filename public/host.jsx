// QuantumQuiz — Host TV screen scenes
// window.QQHost = HostScreen({ scene, state, dispatch })

(function() {
  const { Avatar, QR, TimerRing, Bar, Soundwave, Label } = window.QQShared;
  const { players, question, answerDistribution, chat, impostor, voteResults } = window.QQ_DATA;

  function HostScreen({ scene, state, dispatch }) {
    return (
      <div className="host-col">
        <Label color="magenta">HOST DISPLAY · BIG SCREEN</Label>
        <div className="tv">
          <div className="tv-screen">
            <div className="tv-inner">
              <SceneSwitcher scene={scene} state={state} dispatch={dispatch} />
            </div>
          </div>
          <div className="tv-foot">
            <span className="tv-foot-dot"></span>
            <span>QUANTUMQUIZ // HOST v1.0</span>
            <span style={{ marginLeft: 'auto' }}>ROOM · {state.roomCode}</span>
            <span>{state.players.filter(p => p.connected).length}/12 PLAYERS</span>
          </div>
        </div>
      </div>
    );
  }

  function SceneSwitcher({ scene, state, dispatch }) {
    switch (scene) {
      case 'landing':       return <Landing dispatch={dispatch} />;
      case 'host-create':   return <HostCreate dispatch={dispatch} state={state} />;
      case 'player-join':   return <Lobby state={state} dispatch={dispatch} compact />;
      case 'lobby':         return <Lobby state={state} dispatch={dispatch} />;
      case 'trivia-question':   return <TriviaQuestion state={state} dispatch={dispatch} />;
      case 'trivia-reveal':     return <TriviaReveal state={state} dispatch={dispatch} />;
      case 'trivia-leaderboard':return <TriviaLeaderboard state={state} dispatch={dispatch} />;
      case 'trivia-podium':     return <TriviaPodium state={state} dispatch={dispatch} />;
      case 'impostor-reveal':   return <ImpostorReveal state={state} dispatch={dispatch} />;
      case 'impostor-clues':    return <ImpostorClues state={state} dispatch={dispatch} />;
      case 'impostor-vote':     return <ImpostorVote state={state} dispatch={dispatch} />;
      case 'impostor-result':   return <ImpostorResult state={state} dispatch={dispatch} />;
      default: return null;
    }
  }

  // =====================
  // 1. LANDING
  // =====================
  function Landing({ dispatch }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>
            ▸ INSERT_COIN · PRESS_START · MULTIPLAYER_READY
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.2em' }}>
            SYS.v1.0 · ONLINE
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--cyan)', textShadow: 'var(--glow-c)', marginBottom: 24 }}>
            ◆ A REAL-TIME PARTY GAME ◆
          </div>
          <h1 className="h-display flicker" style={{
            fontSize: 144,
            margin: 0,
            background: 'linear-gradient(180deg, #fff 0%, #ff2e88 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(255,46,136,0.3)',
            letterSpacing: '-0.05em',
          }}>
            QUANTUM<br/>
            <span style={{
              background: 'linear-gradient(180deg, #00e6ff 0%, #9d5cff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>QUIZ</span>
          </h1>
          <div className="mono" style={{ fontSize: 14, color: 'var(--ink-dim)', letterSpacing: '0.3em', marginTop: 20 }}>
            TRIVIA × SOCIAL DEDUCTION × CHAOS
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'goto', scene: 'host-create' })}>
            ▶ HOST A GAME
          </button>
          <button className="btn btn-cyan" onClick={() => dispatch({ type: 'goto', scene: 'player-join' })}>
            JOIN A GAME
          </button>
          <button className="btn btn-ghost">HOW TO PLAY</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>
            © 2026 QQ.GAMES · OPEN_SOURCE · MIT
          </div>
          <Soundwave color="#00e6ff" bars={20} />
        </div>
      </div>
    );
  }

  // =====================
  // 2. HOST CREATE LOBBY
  // =====================
  function HostCreate({ dispatch, state }) {
    const [mode, setMode] = React.useState('trivia');
    const [rounds, setRounds] = React.useState(12);
    const [time, setTime] = React.useState(20);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>STEP 01 / 02 · CONFIGURE</div>
            <h2 className="h-display" style={{ fontSize: 48, margin: 0 }}>New lobby</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'landing' })}>← BACK</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, flex: 1, minHeight: 0 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>① GAME MODE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { id: 'trivia', name: 'TRIVIA', tag: 'Fast-paced quiz · 500+ questions', color: 'magenta' },
                { id: 'impostor', name: 'IMPOSTOR', tag: 'Social deduction · word bluffing', color: 'cyan' },
                { id: 'mixed', name: 'MIXED', tag: '3 trivia rounds → 1 impostor round → repeat', color: 'lime' },
              ].map(m => (
                <button key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: 16, textAlign: 'left',
                    background: mode === m.id ? 'var(--panel-2)' : 'var(--panel)',
                    border: `2px solid ${mode === m.id ? `var(--${m.color})` : 'var(--line)'}`,
                    boxShadow: mode === m.id ? `var(--glow-${m.color[0]})` : 'none',
                    cursor: 'pointer',
                  }}>
                  <div style={{ width: 36, height: 36, background: `var(--${m.color})`, boxShadow: mode === m.id ? `var(--glow-${m.color[0]})` : 'none' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>{m.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{m.tag}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: mode === m.id ? `var(--${m.color})` : 'var(--ink-mute)' }}>
                    {mode === m.id ? '◉ ACTIVE' : '○ SELECT'}
                  </div>
                </button>
              ))}
            </div>

            <div className="eyebrow" style={{ margin: '24px 0 14px' }}>② CATEGORIES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['General', 'Science', 'History', 'Geography', 'Film/TV', 'Music', 'Sports', 'Games', 'Lit', 'Tech', 'Food'].map((c, i) => (
                <span key={c} className="mono" style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  background: i === 8 || i === 6 ? 'transparent' : 'var(--panel-2)',
                  border: `1px solid ${i === 8 || i === 6 ? 'var(--line)' : 'var(--cyan)'}`,
                  color: i === 8 || i === 6 ? 'var(--ink-mute)' : 'var(--cyan)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>{c}{(!(i === 8 || i === 6)) && ' ✓'}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>③ TIMING & ROUNDS</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <Stat label="ROUNDS" value={rounds} unit="" color="magenta" />
              <Stat label="TIME/QUESTION" value={time} unit="s" color="cyan" />
              <Stat label="MAX PLAYERS" value="12" unit="" color="lime" />
            </div>

            <div className="eyebrow" style={{ marginBottom: 14 }}>④ DIFFICULTY MIX</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <DiffPill label="EASY" pct={30} color="lime" />
              <DiffPill label="MEDIUM" pct={50} color="cyan" active />
              <DiffPill label="HARD" pct={20} color="magenta" />
            </div>

            <div className="eyebrow" style={{ marginBottom: 14 }}>⑤ EXTRAS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Toggle label="STREAK BONUSES" on />
              <Toggle label="TYPE-THE-ANSWER ON HARD" on />
              <Toggle label="HOST MUSIC" on />
              <Toggle label="ALLOW LATE JOIN" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>
            ROOM CODE WILL BE GENERATED ON CREATE
          </div>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'goto', scene: 'lobby' })}>
            CREATE LOBBY →
          </button>
        </div>
      </div>
    );
  }

  function Stat({ label, value, unit, color }) {
    return (
      <div style={{ flex: 1, padding: '14px 16px', background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>{label}</div>
        <div className="bignum" style={{ fontSize: 36, color: `var(--${color})`, textShadow: `var(--glow-${color[0]})`, marginTop: 4 }}>
          {value}<span style={{ fontSize: 18, color: 'var(--ink-mute)' }}>{unit}</span>
        </div>
      </div>
    );
  }

  function DiffPill({ label, pct, color, active }) {
    return (
      <div style={{
        flex: pct / 10,
        padding: '10px 14px',
        background: active ? `linear-gradient(90deg, var(--${color}) 0%, transparent 200%)` : 'var(--panel-2)',
        border: `1px solid ${active ? `var(--${color})` : 'var(--line)'}`,
      }}>
        <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: active ? '#0a0814' : 'var(--ink-dim)' }}>{label}</div>
        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: active ? '#0a0814' : 'var(--ink)', marginTop: 2 }}>{pct}%</div>
      </div>
    );
  }

  function Toggle({ label, on }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--panel-2)',
        border: '1px solid var(--line)',
      }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.08em' }}>{label}</span>
        <div style={{
          width: 36, height: 18,
          background: on ? 'var(--lime)' : 'var(--panel-3)',
          boxShadow: on ? 'var(--glow-l)' : 'none',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: on ? 20 : 2,
            width: 14, height: 14, background: on ? '#0a1400' : 'var(--ink-mute)',
            transition: 'left 0.15s',
          }}></div>
        </div>
      </div>
    );
  }

  // =====================
  // 3-4. LOBBY (also used for player-join with `compact`)
  // =====================
  function Lobby({ state, dispatch, compact }) {
    const connected = state.players.filter(p => p.connected);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>LOBBY · WAITING FOR PLAYERS</div>
            <h2 className="h-display" style={{ fontSize: 38, margin: 0, whiteSpace: 'nowrap' }}>Tap in. Pick a name.</h2>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost btn-sm">⚙ SETTINGS</button>
            <button className="btn btn-primary btn-sm" disabled={connected.length < 2}
              onClick={() => dispatch({ type: 'goto', scene: 'trivia-question' })}>
              ▶ START GAME
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>
          {/* QR + Code */}
          <div className="bracket m" style={{ padding: 24, background: 'var(--panel)', border: '1px solid var(--magenta)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--magenta)', letterSpacing: '0.22em' }}>SCAN OR ENTER</div>
            <QR seed={state.roomCode} size={200} />
            <div style={{ textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>ROOM CODE</div>
              <div className="bignum" style={{ fontSize: 44, color: 'var(--magenta)', textShadow: 'var(--glow-m)', letterSpacing: '0.04em', marginTop: 2 }}>
                {state.roomCode}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', textAlign: 'center', letterSpacing: '0.18em' }}>
              QQ.GAMES/J · 60s RECONNECT
            </div>
          </div>

          {/* Player grid */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="eyebrow">CONNECTED · {connected.length}/12</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--lime)' }}>● LIVE</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'start' }}>
              {state.players.map(p => (
                <div key={p.id} className="player-chip" style={{
                  opacity: p.connected ? 1 : 0.35,
                  borderColor: p.isHost ? 'var(--magenta)' : 'var(--line)',
                }}>
                  <Avatar name={p.name} hue={p.hue} size="md" />
                  <div style={{ flex: 1 }}>
                    <div className="nm">{p.name}{p.isHost && <span className="mono" style={{ marginLeft: 8, fontSize: 10, color: 'var(--magenta)' }}>HOST</span>}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.12em' }}>
                      {p.connected ? 'READY' : 'WAITING···'}
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, background: p.connected ? 'var(--lime)' : 'var(--ink-mute)', boxShadow: p.connected ? 'var(--glow-l)' : 'none' }}></div>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 8 - state.players.length) }).slice(0, 4).map((_, i) => (
                <div key={`e${i}`} className="player-chip" style={{ borderStyle: 'dashed', opacity: 0.4 }}>
                  <div style={{ width: 44, height: 44, border: '1px dashed var(--ink-mute)' }}></div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>SLOT {state.players.length + i + 1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--panel)', border: '1px solid var(--line)', minHeight: 0 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow">LOBBY CHAT</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{chat.length} MSGS</span>
            </div>
            <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
              {chat.map((m, i) => (
                <div key={i} className={`chat-msg ${m.kind === 'system' ? 'system' : ''}`}>
                  {m.kind === 'system' ? (
                    <div className="what">— {m.what} —</div>
                  ) : (
                    <>
                      <Avatar name={m.who} hue={m.hue} size="sm" />
                      <div style={{ flex: 1 }}>
                        <div className="who" style={{ color: `oklch(0.75 0.2 ${m.hue})` }}>{m.who}</div>
                        <div className="what">{m.what}</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: 10, borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
              <input className="mono" placeholder="say something..." style={{
                flex: 1, background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink)',
                padding: '8px 12px', fontSize: 12, letterSpacing: '0.04em'
              }} />
              <button className="btn btn-cyan btn-sm">SEND</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // 5. TRIVIA QUESTION
  // =====================
  function TriviaQuestion({ state, dispatch }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="mono" style={{
              padding: '6px 12px', fontSize: 11, fontWeight: 700,
              background: 'var(--cyan)', color: '#001820', letterSpacing: '0.15em'
            }}>{question.category}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.15em' }}>
              ◆ {question.difficulty}
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>
              QUESTION {state.questionNum}/12
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <TimerRing seconds={state.timer} total={20} size={84} color={state.timer < 6 ? 'magenta' : 'cyan'} />
          </div>
        </div>

        {/* Question */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, minHeight: 0 }}>
          <h2 className="h-display" style={{
            fontSize: 44, margin: 0, textAlign: 'center', lineHeight: 1.1,
            textWrap: 'pretty', maxWidth: 880, alignSelf: 'center'
          }}>
            {question.text}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 880, alignSelf: 'center', width: '100%' }}>
            {question.options.map((opt, i) => (
              <div key={i} className={`ans ${['a','b','c','d'][i]}`} style={{ pointerEvents: 'none' }}>
                <div className="shape">{['A','B','C','D'][i]}</div>
                <div style={{ flex: 1 }}>{opt}</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{['A','B','C','D'][i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>
            ◆ {state.players.filter(p => p.connected).length - state.answered} STILL ANSWERING · {state.answered} LOCKED IN
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'trivia-reveal' })}>SKIP TO REVEAL →</button>
        </div>
      </div>
    );
  }

  // =====================
  // 6. TRIVIA REVEAL
  // =====================
  function TriviaReveal({ state, dispatch }) {
    const total = answerDistribution.reduce((a, b) => a + b, 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span className="mono" style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, background: 'var(--cyan)', color: '#001820', letterSpacing: '0.15em' }}>{question.category}</span>
          <div className="eyebrow" style={{ color: 'var(--lime)', textShadow: 'var(--glow-l)' }}>◆ ANSWER REVEAL</div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>QUESTION {state.questionNum}/12</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>CORRECT ANSWER</div>
            <h2 className="h-display" style={{ fontSize: 72, margin: 0, color: 'var(--lime)', textShadow: 'var(--glow-l)' }}>
              {question.options[question.correct]}
            </h2>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', letterSpacing: '0.18em', marginTop: 12 }}>
              ✓ {question.source}
            </div>
          </div>

          <div style={{ maxWidth: 900, alignSelf: 'center', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {question.options.map((opt, i) => {
              const correct = i === question.correct;
              return (
                <div key={i} className={`ans ${['a','b','c','d'][i]} ${correct ? 'correct' : answerDistribution[i] > 0 ? 'wrong' : ''}`}>
                  <div className="shape">{['A','B','C','D'][i]}</div>
                  <div style={{ flex: 1 }}>{opt}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: correct ? 'var(--lime)' : 'var(--ink-mute)' }}>
                    {answerDistribution[i]}/{total}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ maxWidth: 900, alignSelf: 'center', width: '100%' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>FASTEST CORRECT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--panel-2)', border: '1px solid var(--lime)', boxShadow: 'var(--glow-l)' }}>
              <Avatar name="BLAZE" hue={340} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>BLAZE</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>locked at 2.3s · +940 pts · 🔥 4 STREAK</div>
              </div>
              <div className="bignum" style={{ fontSize: 32, color: 'var(--lime)', textShadow: 'var(--glow-l)' }}>+940</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 18 }}>
          <button className="btn btn-cyan btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'trivia-leaderboard' })}>LEADERBOARD →</button>
        </div>
      </div>
    );
  }

  // =====================
  // 7. TRIVIA LEADERBOARD
  // =====================
  function TriviaLeaderboard({ state, dispatch }) {
    const sorted = [...state.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const max = sorted[0]?.score || 1;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="eyebrow">AFTER QUESTION {state.questionNum} / 12</div>
            <h2 className="h-display" style={{ fontSize: 44, margin: '6px 0 0' }}>Leaderboard</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>NEXT IN</span>
            <span className="bignum" style={{ fontSize: 32, color: 'var(--cyan)', textShadow: 'var(--glow-c)' }}>05</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {sorted.map((p, i) => {
            const w = (p.score / max) * 100;
            const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            return (
              <div key={p.id} className={`lb-row ${rankCls}`} style={{ background: i === 0 ? 'linear-gradient(90deg, rgba(255,176,32,0.12), transparent)' : undefined }}>
                <span className="rank">#{i + 1}</span>
                <Avatar name={p.name} hue={p.hue} size="md" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.02em' }}>
                    {p.name}
                    {p.streak >= 3 && <span className="mono" style={{ marginLeft: 10, fontSize: 11, color: 'var(--amber)' }}>🔥 {p.streak} STREAK</span>}
                  </div>
                  <div style={{ marginTop: 6, height: 6, background: 'var(--panel-3)', position: 'relative' }}>
                    <div style={{
                      width: `${w}%`, height: '100%',
                      background: i === 0 ? 'var(--amber)' : i === 1 ? '#c0c0d8' : i === 2 ? '#c97c4e' : 'var(--cyan)',
                      boxShadow: `0 0 8px ${i === 0 ? 'rgba(255,176,32,0.6)' : 'rgba(0,230,255,0.4)'}`,
                      transition: 'width 0.8s'
                    }}></div>
                  </div>
                </div>
                <span className="score">
                  {p.score.toLocaleString()}
                  <span className="delta">+{(Math.floor(Math.random() * 600) + 200)}</span>
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 12, borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>
            ◆ NEXT CATEGORY · ENTERTAINMENT
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'trivia-podium' })}>SKIP TO PODIUM</button>
            <button className="btn btn-cyan btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'trivia-question' })}>NEXT QUESTION →</button>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // 8. TRIVIA PODIUM
  // =====================
  function TriviaPodium({ state, dispatch }) {
    const sorted = [...state.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);
    const order = [1, 0, 2]; // silver, gold, bronze visual order
    const heights = { 0: 240, 1: 180, 2: 130 };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <Confetti />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="eyebrow flicker" style={{ color: 'var(--amber)', textShadow: '0 0 12px rgba(255,176,32,0.5)' }}>
            ◆ GAME OVER · CHAMPION ◆
          </div>
          <h2 className="h-display" style={{ fontSize: 52, margin: '6px 0 0',
            background: 'linear-gradient(180deg, #ffd270, #ff2e88)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
          }}>
            {top3[0].name} WINS
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 28, flex: 1, minHeight: 0, paddingBottom: 0 }}>
          {order.map(idx => {
            const p = top3[idx];
            if (!p) return null;
            const h = heights[idx];
            const color = idx === 0 ? 'var(--amber)' : idx === 1 ? '#c0c0d8' : '#c97c4e';
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: -22, zIndex: 2, position: 'relative' }}>
                  <Avatar name={p.name} hue={p.hue} size="md" />
                </div>
                <div style={{
                  width: 180, height: h,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}22 100%)`,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 20px ${color}55, inset 0 0 30px ${color}44`,
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  paddingTop: 18,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.02em', color: '#fff' }}>{p.name}</div>
                  <div className="bignum" style={{ fontSize: 22, color: '#fff', textShadow: `0 0 12px ${color}`, marginTop: 4 }}>
                    {p.score.toLocaleString()}
                  </div>
                  <span className="bignum" style={{
                    position: 'absolute', bottom: 6, fontSize: 64,
                    color: '#06040e', opacity: 0.35, lineHeight: 1, fontWeight: 700,
                  }}>{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '16px 0 0', borderTop: '1px solid var(--line)', marginTop: 16 }}>
          <StatTile label="FASTEST ANSWER" value="1.4s" who="PIXEL" color="cyan" />
          <StatTile label="LONGEST STREAK" value="7×" who="BLAZE" color="magenta" />
          <StatTile label="SCIENCE MVP" value="9/9" who="NEON" color="lime" />
          <StatTile label="COMEBACK KING" value="+3.1k" who="GLITCH" color="purple" />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
          <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'reset' })}>▶ PLAY AGAIN</button>
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-reveal' })}>SWITCH TO IMPOSTOR →</button>
        </div>
      </div>
    );
  }

  function StatTile({ label, value, who, color }) {
    return (
      <div style={{ padding: 14, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>{label}</div>
        <div className="bignum" style={{ fontSize: 28, color: `var(--${color})`, textShadow: `var(--glow-${color[0]})`, marginTop: 4 }}>{value}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 4 }}>{who}</div>
      </div>
    );
  }

  function Confetti() {
    const bits = React.useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 80,
      hue: [340, 190, 80, 270, 30][Math.floor(Math.random() * 5)],
      size: 4 + Math.random() * 8,
      delay: Math.random() * 2,
      dur: 1.4 + Math.random() * 1.4,
      rot: Math.random() * 360,
    })), []);
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {bits.map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${b.left}%`, top: `${b.top}%`,
            width: b.size, height: b.size,
            background: `oklch(0.7 0.2 ${b.hue})`,
            boxShadow: `0 0 6px oklch(0.7 0.2 ${b.hue})`,
            transform: `rotate(${b.rot}deg)`,
            animation: `confetti-fall ${b.dur}s ${b.delay}s infinite ease-in`
          }}></div>
        ))}
        <style>{`@keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
        }`}</style>
      </div>
    );
  }

  // =====================
  // 9. IMPOSTOR REVEAL
  // =====================
  function ImpostorReveal({ state, dispatch }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--purple)' }}>◆ MODE: IMPOSTOR · ROUND 01</div>
            <h2 className="h-display" style={{ fontSize: 40, margin: '6px 0 0', whiteSpace: 'nowrap' }}>Words have been dealt</h2>
          </div>
          <div className="bignum" style={{ fontSize: 64, color: 'var(--purple)', textShadow: 'var(--glow-p)' }}>
            08
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 16, color: 'var(--ink-dim)' }}>
            CHECK YOUR PHONE · DO NOT SHOW OTHERS
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 40, padding: '32px 48px',
            background: 'var(--panel)', border: '1px solid var(--purple)', boxShadow: 'var(--glow-p)' }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>THEME</div>
              <div className="h-display" style={{ fontSize: 36, marginTop: 4 }}>{impostor.theme}</div>
            </div>
            <div style={{ width: 1, height: 60, background: 'var(--purple)', boxShadow: 'var(--glow-p)' }}></div>
            <div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>YOUR ROLE</div>
              <div className="mono" style={{ fontSize: 18, marginTop: 4, color: 'var(--cyan)' }}>SECRET · UNIQUE PER PLAYER</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {state.players.filter(p => p.connected).slice(0, 8).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
              <Avatar name={p.name} hue={p.hue} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '0.18em' }}>● READ</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>
            ◆ 1 IMPOSTOR HIDDEN AMONG 8 · WORD PAIR FROM 150+ BANK
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-clues' })}>BEGIN CLUES →</button>
        </div>
      </div>
    );
  }

  // =====================
  // 10. IMPOSTOR CLUES
  // =====================
  function ImpostorClues({ state, dispatch }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--purple)' }}>◆ CLUE PHASE · ROUND 1/2</div>
            <h2 className="h-display" style={{ fontSize: 38, margin: '6px 0 0', whiteSpace: 'nowrap' }}>Drop your hint</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>NOW UP</div>
            <div className="h-display" style={{ fontSize: 28, color: 'var(--magenta)' }}>RETRO</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>
          {/* Clue stream */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>CLUES GIVEN · {impostor.clues.length}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {impostor.clues.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-mute)', width: 28 }}>0{i + 1}</span>
                  <Avatar name={c.who} hue={c.hue} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>{c.who} SAYS</div>
                    <div className="h-display" style={{ fontSize: 24, marginTop: 2 }}>"{c.word}"</div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>0.{8 + i}s</div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--panel-2)', border: '2px dashed var(--magenta)' }}>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--magenta)', width: 28 }}>07</span>
                <Avatar name="RETRO" hue={220} size="sm" />
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--magenta)', letterSpacing: '0.15em' }}>RETRO IS TYPING…</div>
                  <Soundwave color="#ff2e88" bars={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Turn order + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 18, background: 'var(--panel)', border: '1px solid var(--line)' }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>TURN ORDER</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['BLAZE', 'PIXEL', 'NEON', 'VOID', 'GLITCH', 'RETRO', 'AURA', 'ZAP'].map((n, i) => {
                  const done = i < 6;
                  const now = i === 5;
                  return (
                    <div key={n} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px',
                      background: now ? 'var(--magenta)' : done ? 'transparent' : 'var(--panel-2)',
                      color: now ? '#1a0210' : done ? 'var(--ink-mute)' : 'var(--ink)',
                      border: '1px solid var(--line)',
                    }}>
                      <span className="mono" style={{ fontSize: 11, width: 18 }}>{done ? '✓' : now ? '▸' : '○'}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{n}</span>
                      <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{done ? 'DONE' : now ? 'NOW' : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: 18, background: 'var(--panel)', border: '1px solid var(--purple)', boxShadow: 'var(--glow-p)' }}>
              <div className="eyebrow" style={{ color: 'var(--purple)', marginBottom: 8 }}>RULES</div>
              <ul className="mono" style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.8, letterSpacing: '0.02em' }}>
                <li>▸ One word only. No phrases.</li>
                <li>▸ Vague to fool the impostor.</li>
                <li>▸ Clear enough so crew knows.</li>
                <li>▸ 2 rounds, then vote.</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14 }}>
          <button className="btn btn-cyan btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-vote' })}>BEGIN VOTE →</button>
        </div>
      </div>
    );
  }

  // =====================
  // 11. IMPOSTOR VOTE
  // =====================
  function ImpostorVote({ state, dispatch }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--magenta)' }}>◆ VOTE PHASE</div>
            <h2 className="h-display" style={{ fontSize: 40, margin: '6px 0 0', whiteSpace: 'nowrap' }}>Who's the impostor?</h2>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 6, letterSpacing: '0.1em' }}>
              REVIEW THE CLUES · CAST ON YOUR PHONE · MAJORITY DECIDES
            </div>
          </div>
          <TimerRing seconds={12} total={20} size={84} color="magenta" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {voteResults.concat(state.players.filter(p => p.connected && !voteResults.find(v => v.id === p.id))).slice(0, 8).map(p => {
            const votes = p.votes ?? 0;
            return (
              <div key={p.id} className="vote-tile" style={{ borderColor: votes > 0 ? 'var(--magenta)' : 'var(--line)' }}>
                <Avatar name={p.name} hue={p.hue} size="lg" />
                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.02em' }}>{p.name}</div>
                <div style={{ width: '100%', display: 'flex', gap: 3, justifyContent: 'center' }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      width: 8, height: 14,
                      background: i < votes ? 'var(--magenta)' : 'var(--panel-3)',
                      boxShadow: i < votes ? 'var(--glow-m)' : 'none',
                    }}></div>
                  ))}
                </div>
                <div className="mono" style={{ fontSize: 11, color: votes > 0 ? 'var(--magenta)' : 'var(--ink-mute)' }}>
                  {votes} VOTE{votes !== 1 ? 'S' : ''}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
          <div className="eyebrow">CLUE RECAP · ROUND 1</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {impostor.clues.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: 'var(--panel-2)',
                border: `1px solid ${c.role === 'impostor' ? 'var(--magenta)' : 'var(--line)'}`,
              }}>
                <Avatar name={c.who} hue={c.hue} size="sm" />
                <div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>{c.who}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>"{c.word}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>
            ◆ 6/8 VOTED · WAITING FOR AURA, ZAP
          </div>
          <button className="btn btn-magenta btn-primary btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-result' })}>LOCK VOTE →</button>
        </div>
      </div>
    );
  }

  // =====================
  // 12. IMPOSTOR RESULT
  // =====================
  function ImpostorResult({ state, dispatch }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <Confetti />
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div className="eyebrow" style={{ color: 'var(--lime)', textShadow: 'var(--glow-l)', marginBottom: 8 }}>
            ◆ THE CREW WINS — IMPOSTOR FOUND ◆
          </div>
          <h2 className="h-display" style={{
            fontSize: 64, margin: 0,
            background: 'linear-gradient(180deg, #c8ff2b, #00e6ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            NEON was the impostor
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1, minHeight: 0 }}>
          {/* Word pair reveal */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--cyan)', boxShadow: 'var(--glow-c)', padding: 24 }}>
            <div className="eyebrow" style={{ color: 'var(--cyan)', marginBottom: 16 }}>WORD PAIR · {impostor.theme}</div>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              <div style={{ flex: 1, padding: '20px 24px', background: 'var(--panel-2)', borderLeft: '4px solid var(--lime)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>CREW WORD</div>
                <div className="h-display" style={{ fontSize: 44, color: 'var(--lime)', textShadow: 'var(--glow-l)', marginTop: 6 }}>
                  {impostor.crewWord}
                </div>
              </div>
              <div style={{ width: 40, display: 'grid', placeItems: 'center', color: 'var(--ink-mute)', fontFamily: 'JetBrains Mono', fontSize: 18 }}>vs</div>
              <div style={{ flex: 1, padding: '20px 24px', background: 'var(--panel-2)', borderLeft: '4px solid var(--magenta)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>IMPOSTOR WORD</div>
                <div className="h-display" style={{ fontSize: 44, color: 'var(--magenta)', textShadow: 'var(--glow-m)', marginTop: 6 }}>
                  {impostor.impostorWord}
                </div>
              </div>
            </div>

            <div className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>FINAL VOTE TALLY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {voteResults.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={v.name} hue={v.hue} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{v.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{v.votes} votes</span>
                    </div>
                    <Bar value={v.votes} max={6} color={v.id === impostor.impostorId ? 'lime' : 'magenta'} height={10} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus guess */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--magenta)', boxShadow: 'var(--glow-m)', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow" style={{ color: 'var(--magenta)', marginBottom: 12 }}>BONUS · IMPOSTOR'S LAST CHANCE</div>
            <p className="h-display" style={{ fontSize: 22, margin: 0, lineHeight: 1.25 }}>
              NEON gets one guess at the crew's word.<br/>
              <span style={{ color: 'var(--ink-mute)' }}>Correct → steals the win.</span>
            </p>

            <div style={{ marginTop: 20, padding: 20, background: 'var(--panel-2)', border: '1px dashed var(--magenta)' }}>
              <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--magenta)' }}>NEON IS GUESSING…</div>
              <div className="h-display" style={{ fontSize: 36 }}>
                "RAVIOLI<span className="flicker">_</span>"
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(180deg, rgba(200,255,43,0.1), transparent)', border: '1px solid var(--lime)' }}>
              <div className="eyebrow" style={{ color: 'var(--lime)', marginBottom: 6 }}>RESULT</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Wrong! Crew word was <span style={{ color: 'var(--lime)' }}>{impostor.crewWord}</span>.</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 6 }}>+200 pts to every surviving crew member.</div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'lobby' })}>BACK TO LOBBY</button>
              <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-reveal' })}>NEXT ROUND →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.QQHost = HostScreen;
})();
