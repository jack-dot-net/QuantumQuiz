// Shared components: avatars, QR pattern, timer ring, etc.
// Globals: window.QQShared = {...}

(function() {

  // ===== Avatar — procedural geometric shape + initial =====
  function Avatar({ name, hue = 200, size = 'md', shape = 0 }) {
    const initial = (name || '?').slice(0, 1).toUpperCase();
    const cls = `avatar ${size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : size === 'xl' ? 'xl' : ''}`;
    // pick a shape variant by hash of name if shape=0
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
          opacity: 0.7
        }}></div>
        {/* "Pixel face" - two eye dots */}
        <div className="avatar-shape" style={{ pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute',
            top: '38%', left: '28%',
            width: '12%', height: '12%',
            background: '#0a0818',
            borderRadius: '50%',
          }}></div>
          <div style={{
            position: 'absolute',
            top: '38%', right: '28%',
            width: '12%', height: '12%',
            background: '#0a0818',
            borderRadius: '50%',
          }}></div>
        </div>
        <span className="avatar-letter">{initial}</span>
      </div>
    );
  }

  // ===== QR Code — fake pixel pattern (looks real, isn't) =====
  function QR({ seed = 'XJ7K2P', size = 200 }) {
    // 21x21 grid (QR v1 size)
    // We hard-code corner finder patterns and fill the rest with a deterministic noise from seed
    const N = 21;
    const cells = [];
    const isFinder = (r, c) => {
      const inBox = (r0, c0) =>
        r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7 &&
        (r === r0 || r === r0 + 6 || c === c0 || c === c0 + 6 ||
         (r >= r0 + 2 && r <= r0 + 4 && c >= c0 + 2 && c <= c0 + 4));
      return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
    };
    const isFinderArea = (r, c) =>
      (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);

    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const rand = (r, c) => {
      let x = (r * 73856093) ^ (c * 19349663) ^ h;
      x = (x * 2654435761) >>> 0;
      return (x % 100) / 100;
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let on = false;
        if (isFinder(r, c)) on = true;
        else if (!isFinderArea(r, c)) on = rand(r, c) > 0.52;
        cells.push(
          <div key={`${r}-${c}`} className={`qr-cell ${on ? 'on' : ''}`} />
        );
      }
    }
    return <div className="qr" style={{ width: size, height: size }}>{cells}</div>;
  }

  // ===== Timer ring =====
  function TimerRing({ seconds, total = 15, size = 120, color = 'cyan' }) {
    const r = 48;
    const C = 2 * Math.PI * r;
    const offset = C * (1 - seconds / total);
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
            style={{ filter: `drop-shadow(0 0 8px ${stroke})`, transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="num" style={{ color: stroke }}>{seconds}</div>
      </div>
    );
  }

  // ===== Bar (for vote distribution / answer breakdown) =====
  function Bar({ value, max = 8, color = 'magenta', height = 24, label }) {
    const w = Math.max(2, (value / Math.max(max, 1)) * 100);
    const c = ({ magenta: '#ff2e88', cyan: '#00e6ff', lime: '#c8ff2b', purple: '#9d5cff', red: '#ff3550' })[color] || color;
    return (
      <div style={{ position: 'relative', height, background: '#1c1638', overflow: 'hidden', border: '1px solid #2e2455' }}>
        <div style={{
          width: `${w}%`, height: '100%',
          background: `linear-gradient(90deg, ${c}, ${c}aa)`,
          boxShadow: `0 0 12px ${c}55, inset 0 0 0 1px ${c}`,
          transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
        }}></div>
        {label && <div className="mono" style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 10px', fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)'
        }}>{label}</div>}
      </div>
    );
  }

  // ===== Soundwave (chunky bars) =====
  function Soundwave({ bars = 12, color = '#ff2e88' }) {
    return (
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 18 }}>
        {Array.from({ length: bars }).map((_, i) => (
          <div key={i} style={{
            width: 3, height: `${30 + Math.sin(i * 0.9) * 30 + (i % 3) * 12}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: `wave 0.8s ${i * 0.05}s infinite alternate ease-in-out`
          }}></div>
        ))}
        <style>{`@keyframes wave { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1); } }`}</style>
      </div>
    );
  }

  // ===== StageScaler =====
  function StageScaler({ width = 1600, height = 1000, children }) {
    const calc = () => {
      if (typeof window === 'undefined') return 1;
      return Math.min(window.innerWidth / width, window.innerHeight / height);
    };
    const [scale, setScale] = React.useState(calc);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    React.useLayoutEffect(() => {
      const fit = () => {
        const s = calc();
        setScale(s);
        setOffset({
          x: (window.innerWidth - width * s) / 2,
          y: (window.innerHeight - height * s) / 2,
        });
      };
      fit();
      window.addEventListener('resize', fit);
      return () => window.removeEventListener('resize', fit);
    }, [width, height]);
    return (
      <div className="stage-wrap">
        <div className="stage" style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
        }}>
          {children}
        </div>
      </div>
    );
  }

  // ===== Eyebrow label =====
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

  window.QQShared = { Avatar, QR, TimerRing, Bar, Soundwave, StageScaler, Label };
})();
