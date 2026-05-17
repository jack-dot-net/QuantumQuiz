// QuantumQuiz — top-level router + landing/join/host-create flows.

const { useState, useEffect, useRef } = React;
const { Avatar, ConnectionBanner, Toast, Soundwave } = window.QQShared;

const HUE_PALETTE = [340, 190, 80, 270, 30, 220, 310, 150];
const NAME_SUGGESTIONS = ['BLAZE', 'PIXEL', 'NEON', 'VOID', 'GLITCH', 'AURA', 'RETRO', 'ZAP', 'NOVA', 'BYTE'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function App() {
  const s = QQ.useStore();
  // Hide boot splash once mounted
  useEffect(() => {
    const splash = document.querySelector('.boot-splash');
    if (splash) splash.remove();
  }, []);

  let scene;
  if (s.view === 'host-create') scene = <HostCreate />;
  else if (s.view === 'join') scene = <PlayerJoin prefill={s.joinCodePrefill} />;
  else if (s.view === 'host' && s.room) scene = <window.QQHost store={s} />;
  else if (s.view === 'player' && s.room) scene = <window.QQPlayer store={s} />;
  else scene = <Landing />;

  return (
    <div className="qq-root">
      <ConnectionBanner connection={s.connection} />
      <Toast message={s.notice} />
      {scene}
    </div>
  );
}

// ─── Landing ────────────────────────────────────────────────────────────────
function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="landing-meta top">
          <span className="mono">▸ INSERT_COIN · MULTIPLAYER_READY</span>
          <span className="mono cyan">SYS.v1.0 · ONLINE</span>
        </div>

        <div className="landing-hero">
          <div className="eyebrow cyan-glow">◆ A REAL-TIME PARTY GAME ◆</div>
          <h1 className="qq-logo flicker">
            QUANTUM<br />
            <span className="alt">QUIZ</span>
          </h1>
          <div className="mono ink-dim landing-tag">TRIVIA × SOCIAL DEDUCTION × CHAOS</div>
        </div>

        <div className="landing-actions">
          <button className="btn btn-primary" onClick={() => QQ.actions.goTo('host-create')}>
            ▶ HOST A GAME
          </button>
          <button className="btn btn-cyan" onClick={() => QQ.actions.goTo('join')}>
            JOIN A GAME
          </button>
        </div>

        <div className="landing-meta bottom">
          <span className="mono">
            © 2026 JDNSoftware ·{' '}
            <a href="https://jdnsoftware.onrender.com/" target="_blank" rel="noopener noreferrer">
              jdnsoftware.onrender.com
            </a>
          </span>
          <Soundwave color="#00e6ff" bars={20} />
        </div>
      </div>
    </div>
  );
}

// ─── Host Create ─────────────────────────────────────────────────────────────
function HostCreate() {
  const [name, setName] = useState(() => randomFrom(NAME_SUGGESTIONS));
  const [hue, setHue] = useState(() => randomFrom(HUE_PALETTE));
  const [shape, setShape] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function create() {
    if (submitting) return;
    setSubmitting(true);
    const ok = await QQ.actions.createRoom({ name, hue, shape });
    if (!ok) setSubmitting(false);
  }

  return (
    <div className="setup">
      <div className="setup-card bracket m">
        <button className="back-btn" onClick={() => QQ.actions.goTo('landing')}>← BACK</button>
        <div className="eyebrow magenta-glow">◆ HOST A GAME</div>
        <h2 className="setup-title">Pick your host avatar</h2>
        <div className="setup-avatar">
          <Avatar name={name} hue={hue} size="xxl" shape={shape} />
        </div>
        <NameInput value={name} onChange={setName} />
        <PalettePicker hue={hue} onHue={setHue} shape={shape} onShape={setShape} />
        <button className="btn btn-primary btn-block" onClick={create} disabled={submitting || !name.trim()}>
          {submitting ? 'CREATING…' : 'CREATE LOBBY →'}
        </button>
        <div className="setup-hint mono">
          You'll get a room code and QR for players to join.
        </div>
      </div>
    </div>
  );
}

// ─── Player Join ─────────────────────────────────────────────────────────────
function PlayerJoin({ prefill }) {
  const [step, setStep] = useState(prefill ? 'name' : 'code');
  const [code, setCode] = useState(prefill || '');
  const [name, setName] = useState(() => randomFrom(NAME_SUGGESTIONS));
  const [hue, setHue] = useState(() => randomFrom(HUE_PALETTE));
  const [shape, setShape] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  function pressKey(k) {
    if (k === '⌫') { setCode(c => c.slice(0, -1)); return; }
    if (k === 'OK') { if (code.length === 6) setStep('name'); return; }
    if (code.length < 6) setCode(c => (c + k).toUpperCase());
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    const ok = await QQ.actions.joinRoom({ code, name, hue, shape });
    if (!ok) setSubmitting(false);
  }

  if (step === 'code') {
    return (
      <div className="setup">
        <div className="setup-card bracket">
          <button className="back-btn" onClick={() => QQ.actions.goTo('landing')}>← BACK</button>
          <div className="eyebrow cyan-glow">◆ JOIN A GAME</div>
          <h2 className="setup-title">Enter room code</h2>
          <div className="code-display">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`code-cell ${code[i] ? 'filled' : ''}`}>{code[i] || ''}</div>
            ))}
          </div>
          <Keypad onPress={pressKey} alphanumeric />
          <button className="btn btn-cyan btn-block" disabled={code.length !== 6} onClick={() => setStep('name')}>
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup">
      <div className="setup-card bracket">
        <button className="back-btn" onClick={() => setStep('code')}>← BACK</button>
        <div className="eyebrow cyan-glow">◆ ROOM {code}</div>
        <h2 className="setup-title">Pick your look</h2>
        <div className="setup-avatar">
          <Avatar name={name} hue={hue} size="xxl" shape={shape} />
        </div>
        <NameInput value={name} onChange={setName} />
        <PalettePicker hue={hue} onHue={setHue} shape={shape} onShape={setShape} />
        <button className="btn btn-lime btn-block" onClick={submit} disabled={submitting || !name.trim()}>
          {submitting ? 'JOINING…' : `▶ JOIN AS ${name || '…'}`}
        </button>
      </div>
    </div>
  );
}

// ─── Re-usable setup widgets ────────────────────────────────────────────────
function NameInput({ value, onChange }) {
  return (
    <div className="setup-field">
      <label className="eyebrow">NICKNAME</label>
      <input
        className="setup-input mono"
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
        placeholder="PIXEL"
        maxLength={10}
        autoCapitalize="characters"
      />
      <div className="setup-suggestions">
        {NAME_SUGGESTIONS.slice(0, 6).map(n => (
          <button key={n}
            className={`chip ${value === n ? 'active' : ''}`}
            onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function PalettePicker({ hue, onHue, shape, onShape }) {
  return (
    <>
      <div className="setup-field">
        <label className="eyebrow">COLOR</label>
        <div className="palette">
          {HUE_PALETTE.map(h => (
            <button key={h} className={`swatch-btn ${h === hue ? 'on' : ''}`}
              style={{ background: `oklch(0.68 0.2 ${h})`, '--glow': `oklch(0.7 0.2 ${h})` }}
              onClick={() => onHue(h)} aria-label={`color ${h}`} />
          ))}
        </div>
      </div>
      <div className="setup-field">
        <label className="eyebrow">SHAPE</label>
        <div className="shape-row">
          {[0, 1, 2, 3].map(s => (
            <button key={s} className={`shape-btn ${s === shape ? 'on' : ''}`} onClick={() => onShape(s)}>
              <Avatar name="A" hue={hue} size="sm" shape={s || 4} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Keypad({ onPress, alphanumeric }) {
  const keys = alphanumeric
    ? ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
       'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
       'Z', 'X', 'C', 'V', 'B', 'N', 'M',
       '2', '3', '4', '5', '6', '7', '8', '9', '⌫']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];
  return (
    <div className={`keypad ${alphanumeric ? 'alpha' : ''}`}>
      {keys.map(k => (
        <button key={k} onClick={() => onPress(k)} className={`key ${k === '⌫' || k === 'OK' ? 'k-special' : ''}`}>
          {k}
        </button>
      ))}
    </div>
  );
}

window.QQApp = App;
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
