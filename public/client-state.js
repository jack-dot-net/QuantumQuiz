// client-state.js — Socket.IO client + tiny store + React hook.
// All client-side state lives in `state`; components subscribe via useStore().

window.QQ = (function () {
  const SESSION_KEY = 'qq.session.v1';

  const initialState = {
    view: 'landing',        // landing | host-create | join | host | player
    connection: 'connecting',// connecting | connected | disconnected
    room: null,             // public room state (from server)
    private: null,          // private per-player state
    self: null,             // { code, playerId, token, hostToken, role, name, hue, shape }
    error: null,
    notice: null,           // transient toast text
    joinCodePrefill: null,  // from ?code= URL param
  };

  let state = { ...initialState };
  const subs = new Set();
  function emit() { for (const fn of subs) fn(state); }
  function setState(patch) { state = { ...state, ...patch }; emit(); }
  function getState() { return state; }

  // ─── Session persistence ───────────────────────────────────────────────────
  function saveSession() {
    if (!state.self) {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.self));
    } catch (e) {}
  }
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    setState({ self: null, room: null, private: null });
  }

  // ─── Socket setup ──────────────────────────────────────────────────────────
  const socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  });

  socket.on('connect', () => {
    setState({ connection: 'connected', error: null });
    const saved = loadSession();
    if (saved && saved.code && saved.playerId && saved.token) {
      socket.emit('player:reconnect', {
        code: saved.code,
        playerId: saved.playerId,
        token: saved.token,
      }, (resp) => {
        if (resp?.ok) {
          setState({
            self: {
              ...saved,
              hostToken: resp.hostToken || saved.hostToken || null,
            },
            view: saved.role === 'host' ? 'host' : 'player',
          });
        } else {
          // Stale session
          clearSession();
        }
      });
    }
  });

  socket.on('disconnect', () => setState({ connection: 'disconnected' }));
  socket.on('connect_error', () => setState({ connection: 'disconnected' }));

  socket.on('room:state', (room) => setState({ room }));
  socket.on('room:private', (priv) => setState({ private: priv }));

  socket.on('kicked', () => {
    clearSession();
    setState({ view: 'landing', notice: 'You were removed from the room.' });
  });
  socket.on('host:promoted', ({ hostToken }) => {
    if (state.self) {
      setState({
        self: { ...state.self, hostToken, role: 'host' },
        view: 'host',
      });
      saveSession();
      flash('You were promoted to host.');
    }
  });

  // ─── Toast helper ──────────────────────────────────────────────────────────
  let noticeTimer = null;
  function flash(text, ms = 2500) {
    setState({ notice: text });
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => setState({ notice: null }), ms);
  }

  // ─── URL handling for join links ───────────────────────────────────────────
  (function readUrl() {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        setState({ joinCodePrefill: code.toUpperCase(), view: 'join' });
      }
    } catch (e) {}
  })();

  // ─── Actions ───────────────────────────────────────────────────────────────
  function emitAck(event, payload) {
    return new Promise((resolve) => {
      socket.emit(event, payload, (resp) => resolve(resp || { ok: false, error: 'no-response' }));
    });
  }

  async function createRoom({ name, hue, shape }) {
    const resp = await emitAck('host:create', { name, hue, shape });
    if (!resp.ok) {
      flash(resp.error || 'Could not create room');
      return false;
    }
    const self = {
      code: resp.code,
      playerId: resp.playerId,
      token: resp.token,
      hostToken: resp.hostToken,
      role: 'host',
      name, hue, shape,
    };
    setState({ self, view: 'host', error: null });
    saveSession();
    return true;
  }

  async function joinRoom({ code, name, hue, shape }) {
    const resp = await emitAck('player:join', {
      code: String(code || '').toUpperCase(),
      name, hue, shape,
    });
    if (!resp.ok) {
      flash(resp.error || 'Could not join');
      return false;
    }
    const self = {
      code: resp.code,
      playerId: resp.playerId,
      token: resp.token,
      hostToken: null,
      role: 'player',
      name, hue, shape,
    };
    setState({ self, view: 'player', error: null });
    saveSession();
    return true;
  }

  function leave() {
    socket.disconnect();
    clearSession();
    setState({ view: 'landing', joinCodePrefill: null });
    setTimeout(() => socket.connect(), 100);
  }

  function hostToken() { return state.self?.hostToken; }

  function updateSettings(patch) {
    socket.emit('host:settings', { hostToken: hostToken(), settings: patch });
  }
  function startGame() {
    socket.emit('host:start', { hostToken: hostToken() }, (resp) => {
      if (!resp?.ok) flash(resp?.error || 'Could not start');
    });
  }
  function advancePhase() {
    socket.emit('host:next', { hostToken: hostToken() });
  }
  function resetGame() {
    socket.emit('host:reset', { hostToken: hostToken() });
  }
  function kickPlayer(playerId) {
    socket.emit('host:kick', { hostToken: hostToken(), playerId });
  }
  function answer(choice) {
    socket.emit('player:answer', { choice });
  }
  function clue(word) {
    socket.emit('player:clue', { word });
  }
  function vote(suspectId) {
    socket.emit('player:vote', { suspectId });
  }
  function bonusGuess(word) {
    socket.emit('player:guess', { word });
  }
  function chat(text) {
    socket.emit('chat:send', { text });
  }
  function goTo(view) {
    setState({ view });
  }

  // ─── React hook ────────────────────────────────────────────────────────────
  function useStore() {
    const [s, setS] = React.useState(state);
    React.useEffect(() => {
      const fn = (next) => setS(next);
      subs.add(fn);
      // Re-sync in case state changed between mount and effect
      setS(state);
      return () => subs.delete(fn);
    }, []);
    return s;
  }

  return {
    useStore,
    getState,
    actions: {
      createRoom, joinRoom, leave, updateSettings,
      startGame, advancePhase, resetGame, kickPlayer,
      answer, clue, vote, bonusGuess, chat, goTo, flash,
    },
  };
})();
