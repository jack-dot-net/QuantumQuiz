// QuantumQuiz — Player phone screen scenes
// window.QQPlayer = PlayerScreen({ scene, state, dispatch })

(function() {
  const { Avatar, TimerRing, Bar, Soundwave, Label } = window.QQShared;
  const { players, question, chat, impostor } = window.QQ_DATA;

  function PlayerScreen({ scene, state, dispatch }) {
    const time = new Date();
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    return (
      <div className="phone-col">
        <Label color="cyan">PLAYER · MOBILE</Label>
        <div className="phone">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-notch"></div>
              <div className="phone-status">
                <span>{hh}:{mm}</span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', gap: 2, alignItems: 'flex-end' }}>
                    <span style={{ width: 3, height: 4, background: 'var(--ink)' }}></span>
                    <span style={{ width: 3, height: 6, background: 'var(--ink)' }}></span>
                    <span style={{ width: 3, height: 8, background: 'var(--ink)' }}></span>
                    <span style={{ width: 3, height: 10, background: 'var(--ink)' }}></span>
                  </span>
                  <span style={{ fontSize: 10 }}>5G</span>
                  <span style={{ width: 22, height: 11, border: '1px solid var(--ink)', position: 'relative' }}>
                    <span style={{ position: 'absolute', inset: 1, width: '80%', background: 'var(--lime)' }}></span>
                  </span>
                </span>
              </div>
              <div className="phone-inner">
                <PScene scene={scene} state={state} dispatch={dispatch} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function PScene({ scene, state, dispatch }) {
    switch (scene) {
      case 'landing':           return <PIdle title="WAITING TO PLAY" tag="Open qq.games on your phone to join a lobby." />;
      case 'host-create':       return <PHostMirror dispatch={dispatch} />;
      case 'player-join':       return <PJoin state={state} dispatch={dispatch} />;
      case 'lobby':             return <PLobby state={state} dispatch={dispatch} />;
      case 'trivia-question':   return <PTriviaQuestion state={state} dispatch={dispatch} />;
      case 'trivia-reveal':     return <PTriviaReveal state={state} dispatch={dispatch} />;
      case 'trivia-leaderboard':return <PTriviaLeaderboard state={state} />;
      case 'trivia-podium':     return <PTriviaPodium state={state} />;
      case 'impostor-reveal':   return <PImpostorReveal state={state} dispatch={dispatch} />;
      case 'impostor-clues':    return <PImpostorClues state={state} dispatch={dispatch} />;
      case 'impostor-vote':     return <PImpostorVote state={state} dispatch={dispatch} />;
      case 'impostor-result':   return <PImpostorResult state={state} />;
      default: return null;
    }
  }

  // ===== generic helpers =====
  function PHeader({ left, right }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>{left}</span>
        {right && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.18em' }}>{right}</span>}
      </div>
    );
  }

  function PIdle({ title, tag }) {
    return (
      <>
        <PHeader left="QUANTUMQUIZ" right="OFFLINE" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, var(--magenta), var(--purple))', clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)', display: 'grid', placeItems: 'center', color: '#0a0814', fontWeight: 700, fontSize: 32, fontFamily: 'Space Grotesk' }}>Q</div>
          <div className="h-display" style={{ fontSize: 22 }}>{title}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6, maxWidth: 220 }}>{tag}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <Soundwave color="#9d5cff" bars={14} />
        </div>
      </>
    );
  }

  // Mirror view while host is setting up
  function PHostMirror({ dispatch }) {
    return (
      <>
        <PHeader left="QUANTUMQUIZ" right="HOST MODE" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--magenta)', letterSpacing: '0.18em' }}>◆ YOU ARE HOSTING</div>
          <div className="h-display" style={{ fontSize: 26, lineHeight: 1.1 }}>Set up on the<br/>big screen.</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            Configure mode, time, and categories. Your phone becomes a remote once the lobby is open.
          </div>
          <div style={{ padding: 12, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>QUICK ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <button className="mono" style={{ padding: 8, fontSize: 11, background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink)', textAlign: 'left' }}>▸ Skip & start now</button>
              <button className="mono" style={{ padding: 8, fontSize: 11, background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink)', textAlign: 'left' }}>▸ Mute sound</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== JOIN FLOW =====
  function PJoin({ state, dispatch }) {
    const [step, setStep] = React.useState('code'); // code | name | avatar | ready
    const [code, setCode] = React.useState('XJ7K2P');
    const [name, setName] = React.useState('PIXEL');
    const [hue, setHue] = React.useState(190);

    if (step === 'code') {
      return (
        <>
          <PHeader left="JOIN A GAME" right="STEP 1/3" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>ROOM CODE</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {code.split('').map((ch, i) => (
                  <div key={i} className="bignum" style={{
                    width: 38, height: 52,
                    display: 'grid', placeItems: 'center',
                    fontSize: 26, color: 'var(--cyan)',
                    background: 'var(--panel-2)',
                    border: '1px solid var(--cyan)',
                    boxShadow: 'var(--glow-c)',
                  }}>{ch}</div>
                ))}
              </div>
            </div>
            <Keypad onPress={(k) => {
              if (k === '⌫') setCode(c => c.slice(0, -1));
              else if (k === 'OK') setStep('name');
              else if (code.length < 6) setCode(c => c + k);
            }} />
          </div>
          <button className="btn btn-cyan btn-block btn-sm" onClick={() => setStep('name')}>CONTINUE →</button>
        </>
      );
    }

    if (step === 'name') {
      return (
        <>
          <PHeader left="PICK A NICK" right="STEP 2/3" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar name={name} hue={hue} size="xl" />
            </div>
            <input value={name} onChange={e => setName(e.target.value.toUpperCase().slice(0, 10))}
              className="mono"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--panel-2)',
                border: '2px solid var(--magenta)',
                boxShadow: 'var(--glow-m)',
                color: 'var(--ink)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textAlign: 'center',
              }} />
            <div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.22em', marginBottom: 6 }}>SUGGESTIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['BLAZE', 'PIXEL', 'NEON', 'VOID', 'GLITCH', 'AURA'].map(s => (
                  <button key={s} onClick={() => setName(s)} className="mono"
                    style={{ padding: '4px 8px', fontSize: 10, background: name === s ? 'var(--cyan)' : 'transparent', color: name === s ? '#001820' : 'var(--ink-dim)', border: '1px solid var(--line)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep('code')}>BACK</button>
            <button className="btn btn-cyan btn-sm btn-block" style={{ flex: 1 }} onClick={() => setStep('avatar')}>NEXT →</button>
          </div>
        </>
      );
    }

    if (step === 'avatar') {
      const hues = [340, 190, 80, 270, 30, 220, 310, 150];
      return (
        <>
          <PHeader left="PICK YOUR LOOK" right="STEP 3/3" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar name={name} hue={hue} size="xl" />
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.22em', textAlign: 'center' }}>COLOR</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {hues.map(h => (
                <button key={h} onClick={() => setHue(h)}
                  style={{
                    aspectRatio: '1',
                    background: `oklch(0.68 0.2 ${h})`,
                    border: `2px solid ${h === hue ? 'var(--ink)' : 'transparent'}`,
                    boxShadow: h === hue ? `0 0 12px oklch(0.7 0.2 ${h})` : 'none',
                    cursor: 'pointer',
                  }}></button>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.22em', textAlign: 'center' }}>SHAPE</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 6 }}>
              {[1, 2, 3, 0].map((s, i) => (
                <div key={i} style={{ padding: 6, border: '1px solid var(--line)', cursor: 'pointer' }}>
                  <Avatar name={name} hue={hue} size="sm" shape={s} />
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-lime btn-block btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'lobby' })}>
            ▶ JOIN AS {name}
          </button>
        </>
      );
    }
    return null;
  }

  function Keypad({ onPress }) {
    const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','OK'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {keys.map(k => (
          <button key={k} onClick={() => onPress(k)}
            className="mono"
            style={{
              padding: '14px 0', fontSize: 18, fontWeight: 700,
              background: k === 'OK' ? 'var(--magenta)' : k === '⌫' ? 'transparent' : 'var(--panel-2)',
              color: k === 'OK' ? '#1a0210' : k === '⌫' ? 'var(--ink-dim)' : 'var(--ink)',
              border: '1px solid var(--line)',
              borderColor: k === 'OK' ? 'var(--magenta)' : 'var(--line)',
            }}>{k}</button>
        ))}
      </div>
    );
  }

  // ===== Lobby (player view) =====
  function PLobby({ state, dispatch }) {
    const me = state.players.find(p => p.isYou) || state.players[1];
    return (
      <>
        <PHeader left={`ROOM · ${state.roomCode}`} right="● LIVE" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Avatar name={me.name} hue={me.hue} size="lg" />
          <div style={{ fontWeight: 700, fontSize: 18 }}>{me.name}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--lime)', letterSpacing: '0.2em' }}>● READY · WAITING ON HOST</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>LOBBY · {state.players.filter(p => p.connected).length}/12</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {state.players.filter(p => p.connected).slice(0, 7).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: p.id === me.id ? 'rgba(0,230,255,0.08)' : 'transparent', borderLeft: p.id === me.id ? '2px solid var(--cyan)' : '2px solid transparent' }}>
                <Avatar name={p.name} hue={p.hue} size="sm" />
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{p.name}{p.isYou && <span className="mono" style={{ marginLeft: 6, fontSize: 9, color: 'var(--cyan)' }}>YOU</span>}</div>
                <div style={{ width: 6, height: 6, background: 'var(--lime)' }}></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: 8, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
          <input className="mono" placeholder="message..." style={{
            flex: 1, background: 'transparent', border: 'none', color: 'var(--ink)', fontSize: 11, padding: '4px 6px',
            outline: 'none'
          }} />
          <button className="mono" style={{ padding: '4px 10px', fontSize: 10, background: 'var(--cyan)', color: '#001820', fontWeight: 700 }}>SEND</button>
        </div>
      </>
    );
  }

  // ===== Trivia: question (answer panel) =====
  function PTriviaQuestion({ state, dispatch }) {
    const [picked, setPicked] = React.useState(null);
    return (
      <>
        <PHeader left={`Q ${state.questionNum}/12`} right={`◆ ${question.difficulty}`} />
        <div style={{ background: 'var(--panel)', border: '1px solid var(--cyan)', padding: 12, marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.2em', marginBottom: 6 }}>SCIENCE & NATURE</div>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }} className="h-display">{question.text}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.15em' }}>TIME LEFT</span>
          <div className="bignum" style={{ fontSize: 24, color: state.timer < 6 ? 'var(--magenta)' : 'var(--cyan)', textShadow: state.timer < 6 ? 'var(--glow-m)' : 'var(--glow-c)' }}>
            {String(state.timer).padStart(2, '0')}s
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {question.options.map((opt, i) => {
            const cls = ['a','b','c','d'][i];
            const isPicked = picked === i;
            return (
              <button key={i} className={`ans ${cls}`} onClick={() => setPicked(i)}
                style={{
                  fontSize: 14, padding: '12px 14px',
                  borderColor: isPicked ? 'var(--magenta)' : undefined,
                  background: isPicked ? 'rgba(255,46,136,0.15)' : undefined,
                  boxShadow: isPicked ? 'var(--glow-m)' : undefined,
                  transform: 'none',
                }}>
                <div className="shape" style={{ width: 22, height: 22 }}></div>
                <div style={{ flex: 1, textAlign: 'left' }}>{opt}</div>
                {isPicked && <span className="mono" style={{ fontSize: 9, color: 'var(--magenta)' }}>✓ LOCKED</span>}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mono" style={{ fontSize: 9, color: 'var(--lime)', textAlign: 'center', letterSpacing: '0.2em', marginTop: 8 }}>
            ● ANSWER LOCKED · WAITING FOR OTHERS
          </div>
        )}
      </>
    );
  }

  function PTriviaReveal({ state, dispatch }) {
    return (
      <>
        <PHeader left={`Q ${state.questionNum}/12`} right="REVEAL" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
          <div style={{
            padding: 18,
            background: 'linear-gradient(180deg, rgba(200,255,43,0.2), transparent)',
            border: '2px solid var(--lime)',
            boxShadow: 'var(--glow-l)',
          }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--lime)', letterSpacing: '0.2em' }}>✓ CORRECT</div>
            <div className="h-display" style={{ fontSize: 36, color: 'var(--lime)', textShadow: 'var(--glow-l)', marginTop: 6 }}>
              +840
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 4 }}>locked at 3.1s</div>
          </div>
          <div style={{ padding: 12, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>ANSWER</div>
            <div className="h-display" style={{ fontSize: 22, marginTop: 4 }}>{question.options[question.correct]}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: 10, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>STREAK</div>
              <div className="bignum" style={{ fontSize: 20, color: 'var(--amber)' }}>🔥 2×</div>
            </div>
            <div style={{ flex: 1, padding: 10, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>RANK</div>
              <div className="bignum" style={{ fontSize: 20, color: 'var(--cyan)' }}>#2</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  function PTriviaLeaderboard({ state }) {
    const sorted = [...state.players].filter(p => p.connected).sort((a, b) => b.score - a.score);
    const me = state.players.find(p => p.isYou);
    const myRank = sorted.findIndex(p => p.id === me.id) + 1;
    return (
      <>
        <PHeader left="LEADERBOARD" right={`Q ${state.questionNum}/12`} />
        <div style={{ textAlign: 'center', padding: '12px 0', background: 'var(--panel)', border: '1px solid var(--cyan)', marginBottom: 10 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.2em' }}>YOUR RANK</div>
          <div className="bignum" style={{ fontSize: 36, color: 'var(--cyan)', textShadow: 'var(--glow-c)' }}>#{myRank}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{me.score.toLocaleString()} pts</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sorted.slice(0, 8).map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              background: p.id === me.id ? 'rgba(0,230,255,0.1)' : i < 3 ? 'var(--panel-2)' : 'transparent',
              borderLeft: i === 0 ? '2px solid var(--amber)' : i === 1 ? '2px solid #c0c0d8' : i === 2 ? '2px solid #c97c4e' : '2px solid transparent',
            }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-mute)', width: 18 }}>{i + 1}</span>
              <Avatar name={p.name} hue={p.hue} size="sm" />
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{p.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--lime)', fontWeight: 700 }}>{p.score.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', textAlign: 'center', letterSpacing: '0.2em', marginTop: 8 }}>
          NEXT QUESTION IN 05s
        </div>
      </>
    );
  }

  function PTriviaPodium({ state }) {
    const me = state.players.find(p => p.isYou);
    return (
      <>
        <PHeader left="GAME OVER" right="◆" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.22em' }}>YOU FINISHED</div>
          <div className="h-display" style={{ fontSize: 72, color: 'var(--cyan)', textShadow: 'var(--glow-c)' }}>#2</div>
          <Avatar name={me.name} hue={me.hue} size="xl" />
          <div className="bignum" style={{ fontSize: 28, color: 'var(--lime)', textShadow: 'var(--glow-l)' }}>{me.score.toLocaleString()}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.15em' }}>
            7 CORRECT · 1.4s FASTEST · 🔥 4 STREAK
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="btn btn-primary btn-block btn-sm">▶ PLAY AGAIN</button>
          <button className="btn btn-ghost btn-sm btn-block">SHARE STATS</button>
        </div>
      </>
    );
  }

  // ===== Impostor: reveal =====
  function PImpostorReveal({ state, dispatch }) {
    const [shown, setShown] = React.useState(false);
    const me = state.players.find(p => p.isYou);
    const isImpostor = false; // PIXEL (you) is crew in this scenario
    return (
      <>
        <PHeader left="IMPOSTOR · R1" right="SECRET" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>THEME</div>
          <div className="h-display" style={{ fontSize: 22 }}>{impostor.theme}</div>

          <button onClick={() => setShown(s => !s)}
            style={{
              padding: '40px 16px',
              background: shown
                ? 'linear-gradient(180deg, rgba(200,255,43,0.15), transparent)'
                : 'linear-gradient(180deg, var(--panel-2), var(--panel))',
              border: `2px solid ${shown ? 'var(--lime)' : 'var(--purple)'}`,
              boxShadow: shown ? 'var(--glow-l)' : 'var(--glow-p)',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontFamily: 'inherit',
            }}>
            {!shown ? (
              <>
                <div className="mono" style={{ fontSize: 11, color: 'var(--purple)', letterSpacing: '0.22em', marginBottom: 12 }}>TAP & HOLD</div>
                <div className="h-display" style={{ fontSize: 28, color: 'var(--ink-dim)' }}>● ● ● ● ●</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.18em', marginTop: 12 }}>YOUR SECRET WORD</div>
              </>
            ) : (
              <>
                <div className="mono" style={{ fontSize: 11, color: 'var(--lime)', letterSpacing: '0.22em', marginBottom: 12 }}>YOUR ROLE · CREW</div>
                <div className="h-display" style={{ fontSize: 40, color: 'var(--lime)', textShadow: 'var(--glow-l)' }}>
                  {impostor.crewWord}
                </div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.18em', marginTop: 12 }}>SHARED WITH 6 OTHERS</div>
              </>
            )}
          </button>

          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
            Give a 1-word clue when it's your turn.<br/>Vague enough to fool the impostor.
          </div>
        </div>
        <button className="btn btn-cyan btn-block btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-clues' })}>
          I'M READY
        </button>
      </>
    );
  }

  // ===== Impostor: clue submission =====
  function PImpostorClues({ state, dispatch }) {
    const [clue, setClue] = React.useState('crust');
    const myTurn = true;
    return (
      <>
        <PHeader left="YOUR CLUE" right="R1 · TURN 2/8" />
        <div style={{ padding: 10, background: 'var(--panel-2)', border: '1px solid var(--line)', marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.2em' }}>YOUR WORD</div>
          <div className="h-display" style={{ fontSize: 22, color: 'var(--lime)', textShadow: 'var(--glow-l)', marginTop: 2 }}>{impostor.crewWord}</div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 8 }}>OTHERS HAVE SAID</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
          {impostor.clues.slice(0, 2).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 6, background: 'var(--panel-2)', border: '1px solid var(--line)' }}>
              <Avatar name={c.who} hue={c.hue} size="sm" />
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{c.who}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>"{c.word}"</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}></div>

        <div style={{
          padding: 14,
          background: 'linear-gradient(180deg, rgba(255,46,136,0.1), transparent)',
          border: '2px solid var(--magenta)',
          boxShadow: 'var(--glow-m)',
          marginBottom: 10,
        }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--magenta)', letterSpacing: '0.2em', marginBottom: 8 }}>◆ YOUR TURN — TYPE 1 WORD</div>
          <input value={clue} onChange={e => setClue(e.target.value.replace(/\s/g, '').slice(0, 12))}
            className="mono"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--panel)',
              border: '1px solid var(--magenta)',
              color: 'var(--ink)',
              fontSize: 22, fontWeight: 700,
              letterSpacing: '0.05em',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono',
            }} />
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.15em', marginTop: 6, textAlign: 'right' }}>
            {clue.length}/12 · NO PHRASES
          </div>
        </div>
        <button className="btn btn-primary btn-block btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-vote' })}>
          DROP CLUE →
        </button>
      </>
    );
  }

  // ===== Impostor: vote =====
  function PImpostorVote({ state, dispatch }) {
    const [pick, setPick] = React.useState('p3');
    const candidates = state.players.filter(p => p.connected && !p.isYou).slice(0, 7);
    return (
      <>
        <PHeader left="VOTE" right="12s" />
        <div className="eyebrow" style={{ marginBottom: 6 }}>WHO IS THE IMPOSTOR?</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.15em', marginBottom: 12 }}>
          PICK 1 · MAJORITY ELIMINATES
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
          {candidates.map(p => (
            <button key={p.id} onClick={() => setPick(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 8,
                background: pick === p.id ? 'rgba(255,46,136,0.15)' : 'var(--panel-2)',
                border: `2px solid ${pick === p.id ? 'var(--magenta)' : 'var(--line)'}`,
                boxShadow: pick === p.id ? 'var(--glow-m)' : 'none',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}>
              <Avatar name={p.name} hue={p.hue} size="sm" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>
                  said "{impostor.clues.find(c => c.who === p.name)?.word || '—'}"
                </div>
              </div>
              {pick === p.id && <span className="mono" style={{ fontSize: 10, color: 'var(--magenta)', fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-block btn-sm" onClick={() => dispatch({ type: 'goto', scene: 'impostor-result' })} style={{ marginTop: 8 }}>
          LOCK VOTE
        </button>
      </>
    );
  }

  function PImpostorResult({ state }) {
    return (
      <>
        <PHeader left="RESULT" right="CREW WINS" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--lime)', letterSpacing: '0.22em' }}>✓ YOU VOTED CORRECTLY</div>
          <div className="h-display" style={{ fontSize: 28, lineHeight: 1.1 }}>
            <span style={{ color: 'var(--magenta)' }}>NEON</span> was the<br/>impostor.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: 10, background: 'var(--panel-2)', border: '1px solid var(--lime)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>CREW WORD</div>
              <div className="h-display" style={{ fontSize: 16, color: 'var(--lime)' }}>{impostor.crewWord}</div>
            </div>
            <div style={{ flex: 1, padding: 10, background: 'var(--panel-2)', border: '1px solid var(--magenta)' }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>IMPOSTOR HAD</div>
              <div className="h-display" style={{ fontSize: 16, color: 'var(--magenta)' }}>{impostor.impostorWord}</div>
            </div>
          </div>
          <div style={{ padding: 14, background: 'linear-gradient(180deg, rgba(200,255,43,0.12), transparent)', border: '1px solid var(--lime)' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--lime)', letterSpacing: '0.2em' }}>YOU EARNED</div>
            <div className="bignum" style={{ fontSize: 36, color: 'var(--lime)', textShadow: 'var(--glow-l)', marginTop: 4 }}>+500</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 4 }}>crew win + bonus failed</div>
          </div>
        </div>
        <button className="btn btn-cyan btn-block btn-sm">NEXT ROUND →</button>
      </>
    );
  }

  window.QQPlayer = PlayerScreen;
})();
