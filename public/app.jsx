// QuantumQuiz — Main app + state + scene rail

const { useState, useEffect, useReducer, useRef } = React;
const { StageScaler } = window.QQShared;

const SCENES = [
  { id: 'landing',           label: 'LANDING',       group: 'INTRO' },
  { id: 'host-create',       label: 'HOST · NEW',    group: 'INTRO' },
  { id: 'player-join',       label: 'PLAYER · JOIN', group: 'INTRO' },
  { id: 'lobby',             label: 'LOBBY',         group: 'INTRO' },
  { id: 'trivia-question',   label: 'QUESTION',      group: 'TRIVIA' },
  { id: 'trivia-reveal',     label: 'REVEAL',        group: 'TRIVIA' },
  { id: 'trivia-leaderboard',label: 'LEADERBOARD',   group: 'TRIVIA' },
  { id: 'trivia-podium',     label: 'PODIUM',        group: 'TRIVIA' },
  { id: 'impostor-reveal',   label: 'WORD',          group: 'IMPOSTOR' },
  { id: 'impostor-clues',    label: 'CLUES',         group: 'IMPOSTOR' },
  { id: 'impostor-vote',     label: 'VOTE',          group: 'IMPOSTOR' },
  { id: 'impostor-result',   label: 'RESULT',        group: 'IMPOSTOR' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "magenta",
  "showScanlines": true,
  "showCRT": true,
  "avatarShape": "auto"
}/*EDITMODE-END*/;

const INITIAL_STATE = {
  scene: 'landing',
  roomCode: 'XJ7K2P',
  questionNum: 7,
  answered: 6,
  timer: 11,
  players: window.QQ_DATA.players.map((p, i) => ({
    ...p,
    connected: i < 8,
    isHost: i === 0,
  })),
};

function reducer(state, action) {
  switch (action.type) {
    case 'goto':
      return { ...state, scene: action.scene };
    case 'reset':
      return INITIAL_STATE;
    case 'tick':
      return { ...state, timer: Math.max(0, state.timer - 1) };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [tweaks, setTweak] = (window.useTweaks || ((d) => [d, () => {}]))(TWEAK_DEFAULTS);

  // Tick timer when on trivia-question
  useEffect(() => {
    if (state.scene === 'trivia-question') {
      const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
      return () => clearInterval(id);
    }
  }, [state.scene]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const idx = SCENES.findIndex(s => s.id === state.scene);
      if (e.key === 'ArrowRight' && idx < SCENES.length - 1) {
        dispatch({ type: 'goto', scene: SCENES[idx + 1].id });
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        dispatch({ type: 'goto', scene: SCENES[idx - 1].id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.scene]);

  const HostScreen = window.QQHost;
  const PlayerScreen = window.QQPlayer;

  return (
    <StageScaler width={1600} height={1000}>
      {/* ===== Top Bar ===== */}
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark"></div>
          <div>
            <div className="brand-name">QUANTUM<span className="accent">QUIZ</span></div>
            <div className="brand-tag">REAL-TIME PARTY GAME · v1.0</div>
          </div>
        </div>
        <div className="topbar-status">
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>SOCKET · STABLE · 28ms</span>
          </div>
          <div className="status-pill">
            <span>ROOM</span>
            <span style={{ color: 'var(--magenta)', fontWeight: 700, marginLeft: 6 }}>{state.roomCode}</span>
          </div>
          <div className="status-pill">
            <span>{state.players.filter(p => p.connected).length}/12 ONLINE</span>
          </div>
        </div>
      </div>

      {/* ===== Main split ===== */}
      <div className="split">
        <HostScreen scene={state.scene} state={state} dispatch={dispatch} />
        <PlayerScreen scene={state.scene} state={state} dispatch={dispatch} />
      </div>

      {/* ===== Scene rail ===== */}
      <div className="scene-rail">
        <div className="scene-rail-label">SCENE ◢</div>
        {SCENES.map((s, i) => {
          const prev = SCENES[i - 1];
          const divider = prev && prev.group !== s.group;
          return (
            <React.Fragment key={s.id}>
              {divider && <span className="scene-chip group-divider">/</span>}
              <button
                className={`scene-chip ${state.scene === s.id ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'goto', scene: s.id })}
                title={s.group + ' · ' + s.label}
              >
                <span style={{ opacity: 0.5 }}>{String(i + 1).padStart(2, '0')}</span> {s.label}
              </button>
            </React.Fragment>
          );
        })}
        <div style={{ display: 'flex', gap: 6, marginLeft: 10 }}>
          <button className="scene-chip" style={{ minWidth: 32 }} onClick={() => {
            const i = SCENES.findIndex(s => s.id === state.scene);
            if (i > 0) dispatch({ type: 'goto', scene: SCENES[i - 1].id });
          }}>◂</button>
          <button className="scene-chip" style={{ minWidth: 32 }} onClick={() => {
            const i = SCENES.findIndex(s => s.id === state.scene);
            if (i < SCENES.length - 1) dispatch({ type: 'goto', scene: SCENES[i + 1].id });
          }}>▸</button>
        </div>
      </div>

      {/* Tweaks panel */}
      {window.TweaksPanel && <window.TweaksPanel title="Tweaks">
        {window.TweakSection && (
          <>
            <window.TweakSection title="Display">
              <window.TweakToggle label="CRT scanlines" value={tweaks.showScanlines}
                onChange={v => setTweak('showScanlines', v)} />
              <window.TweakToggle label="CRT vignette" value={tweaks.showCRT}
                onChange={v => setTweak('showCRT', v)} />
            </window.TweakSection>
          </>
        )}
      </window.TweaksPanel>}

      {/* Apply tweaks via inline style */}
      <style>{`
        ${!tweaks.showScanlines ? `.tv-screen::before, .phone-screen::before, .stage-wrap::before { display: none; }` : ''}
        ${!tweaks.showCRT ? `.tv-screen::after, .stage-wrap::after { display: none; }` : ''}
      `}</style>
    </StageScaler>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
