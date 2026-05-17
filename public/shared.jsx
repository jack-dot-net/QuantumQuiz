// Shared visual components — Avatar, real QR, TimerRing, Bar, Soundwave, Label.
// Globals: window.QQShared = {...}

(function () {

  function Avatar({ name, hue = 200, size = 'md', shape = 0 }) {
    const initial = (name || '?').slice(0, 1).toUpperCase();
    const cls = `avatar ${size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : size === 'xl' ? 'xl' : size === 'xxl' ? 'xxl' : ''}`;
    const s = shape || ((name?.charCodeAt(0) || 0) % 4);
    const bg = `oklch(0.68 0.2 ${hue})`;
    const bg2 = `oklch(0.45 0.22 ${(hue + 40) % 360})`;
    let clip = 'inset(0)';
    if (s === 1) clip = 'circle(50% at 50% 50%)';
    if (s === 2) clip = 'polygon(50% 0, 100% 35%, 82% 100%, 18% 100%, 0 35%)';
    if (s === 3) clip = 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)';
    return (
      <div className={cls}>
        <div className="avatar-shape" style={{ background: bg, clipPath: clip }}></div>
        <div className="avatar-shape" style={{
          background: bg2,
          clipPath: 'polygon(0 100%, 100% 100%, 100% 60%, 0 75%)',
          mixBlendMode: 'multiply',
          opacity: 0.7,
        }}></div>
        <div className="avatar-shape" style={{ pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '38%', left: '28%', width: '12%', height: '12%', background: '#0a0818', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', top: '38%', right: '28%', width: '12%', height: '12%', background: '#0a0818', borderRadius: '50%' }}></div>
        </div>
        <span className="avatar-letter">{initial}</span>
      </div>
    );
  }

  // Real QR code via the `qrcode` browser lib loaded in index.html.
  function QR({ text, size = 220 }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (!ref.current || !window.QRCode) return;
      window.QRCode.toCanvas(ref.current, text, {
        width: size,
        margin: 1,
        color: { dark: '#06040e', light: '#ffffff' },
      }, () => {});
    }, [text, size]);
    return (
      <div className="qr-wrap" style={{ width: size, height: size }}>
        <canvas ref={ref} width={size} height={size} style={{ display: 'block' }} />
      </div>
    );
  }

  function useCountdown(endsAt) {
    const [now, setNow] = React.useState(() => Date.now());
    React.useEffect(() => {
      if (!endsAt) return;
      const id = setInterval(() => setNow(Date.now()), 250);
      return () => clearInterval(id);
    }, [endsAt]);
    if (!endsAt) return null;
    return Math.max(0, Math.ceil((endsAt - now) / 1000));
  }

  function TimerRing({ seconds, total = 20, size = 120, color = 'cyan' }) {
    const safeSeconds = seconds == null ? 0 : seconds;
    const r = 48;
    const C = 2 * Math.PI * r;
    const ratio = total > 0 ? Math.max(0, Math.min(1, safeSeconds / total)) : 0;
    const offset = C * (1 - ratio);
    const stroke = color === 'magenta' ? '#ff2e88' : color === 'lime' ? '#c8ff2b' : '#00e6ff';
    return (
      <div className="timer-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#2a214f" strokeWidth="6" />
          <circle cx="60" cy="60" r={r} fill="none"
            stroke={stroke} strokeWidth="6"
            strokeDasharray={C}
            strokeDashoffset={offset}
            strokeLinecap="square"
            style={{ filter: `drop-shadow(0 0 8px ${stroke})`, transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="num" style={{ color: stroke, fontSize: size < 80 ? 24 : 42 }}>{safeSeconds}</div>
      </div>
    );
  }

  function Bar({ value, max = 8, color = 'magenta', height = 24, label }) {
    const w = Math.max(2, (value / Math.max(max, 1)) * 100);
    const palette = { magenta: '#ff2e88', cyan: '#00e6ff', lime: '#c8ff2b', purple: '#9d5cff', red: '#ff3550' };
    const c = palette[color] || color;
    return (
      <div style={{ position: 'relative', height, background: '#1c1638', overflow: 'hidden', border: '1px solid #2e2455' }}>
        <div style={{
          width: `${w}%`, height: '100%',
          background: `linear-gradient(90deg, ${c}, ${c}aa)`,
          boxShadow: `0 0 12px ${c}55, inset 0 0 0 1px ${c}`,
          transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}></div>
        {label && <div className="mono" style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 10px', fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}>{label}</div>}
      </div>
    );
  }

  function Soundwave({ bars = 12, color = '#ff2e88' }) {
    return (
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 18 }}>
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} style={{
            width: 3, height: `${30 + Math.sin(i * 0.9) * 30 + (i % 3) * 12}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: `wave 0.8s ${i * 0.05}s infinite alternate ease-in-out`,
          }}></div>
        ))}
        <style>{`@keyframes wave { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1); } }`}</style>
      </div>
    );
  }

  function Confetti() {
    const bits = React.useMemo(() => Array.from({ length: 60 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 80,
      hue: [340, 190, 80, 270, 30][Math.floor(Math.random() * 5)],
      size: 4 + Math.random() * 8,
      delay: Math.random() * 2,
      dur: 1.6 + Math.random() * 1.6,
      rot: Math.random() * 360,
    })), []);
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
        {bits.map((b, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${b.left}%`, top: `${b.top}%`,
            width: b.size, height: b.size,
            background: `oklch(0.7 0.2 ${b.hue})`,
            boxShadow: `0 0 6px oklch(0.7 0.2 ${b.hue})`,
            transform: `rotate(${b.rot}deg)`,
            animation: `confetti-fall ${b.dur}s ${b.delay}s infinite ease-in`,
          }}></div>
        ))}
        <style>{`@keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(800px) rotate(720deg); opacity: 0; }
        }`}</style>
      </div>
    );
  }

  function Label({ children, color = 'cyan' }) {
    return (
      <div className="label">
        <span className={`swatch ${color === 'magenta' ? 'm' : ''}`} style={
          color === 'lime' ? { background: 'var(--lime)', boxShadow: 'var(--glow-l)' } :
            color === 'purple' ? { background: 'var(--purple)', boxShadow: 'var(--glow-p)' } : {}
        }></span>
        {children}
      </div>
    );
  }

  function ConnectionBanner({ connection }) {
    if (connection === 'connected') return null;
    return (
      <div className="conn-banner" data-state={connection}>
        {connection === 'connecting' && 'Connecting…'}
        {connection === 'disconnected' && 'Reconnecting…'}
      </div>
    );
  }

  function Toast({ message }) {
    if (!message) return null;
    return <div className="toast">{message}</div>;
  }

  window.QQShared = {
    Avatar, QR, TimerRing, Bar, Soundwave, Confetti, Label,
    ConnectionBanner, Toast, useCountdown,
  };
})();
