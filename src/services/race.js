/**
 * Local multiplayer — same-browser ghost race.
 *
 * Two KeyFlow tabs can race the same text in real time using a
 * BroadcastChannel. Each tab is one racer. A "host" generates the
 * text, starts the race, and broadcasts a "tick" every animation
 * frame with its current cursor; the "guest" mirrors that and
 * sends its own. Each tab paints a racer strip showing both
 * racers' progress, so the local user feels the pressure.
 *
 * Why no real network?
 *   - The first version was network-multiplayer. The infra is
 *     non-trivial (matchmaking, auth, abuse) and the marginal value
 *     of two anonymous people racing the same paragraph is small.
 *   - BroadcastChannel is honest. Two tabs on the same machine is a
 *     genuinely multiplayer experience and shows the same mechanics
 *     the network version would, without a backend.
 *
 * Protocol (BroadcastChannel 'kf-race'):
 *   { kind: 'lobby-open',   room: 'abc123' }
 *   { kind: 'lobby-join',   room: 'abc123', name: 'host' }
 *   { kind: 'start',        room: 'abc123', text: '...', duration: 30 }
 *   { kind: 'tick',         room: 'abc123', cursor: 42, wpm: 67 }
 *   { kind: 'finish',       room: 'abc123', wpm: 80, accuracy: 95 }
 */
const CHANNEL = 'kf-race';

const racers = new Map(); // room -> { host, guest, text, startedAt, finished }

export const createRace = ({ name = 'Player' } = {}) => {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  let listeners = [];
  let state = {
    role: 'idle', // idle | host | guest
    room: '',
    text: '',
    duration: 30,
    racer: { name, cursor: 0, wpm: 0, accuracy: 100, finished: false },
    opponent: { name: 'Opponent', cursor: 0, wpm: 0, finished: false },
    startedAt: 0,
  };

  const emit = () => listeners.forEach((fn) => fn(state));

  const send = (msg) => {
    if (channel && state.room) {
      try { channel.postMessage({ ...msg, room: state.room }); } catch {}
    }
  };

  const startAsHost = ({ text, duration, room }) => {
    state = {
      ...state,
      role: 'host',
      room: room || makeRoomCode(),
      text,
      duration,
      startedAt: 0,
      racer: { name, cursor: 0, wpm: 0, accuracy: 100, finished: false },
      opponent: null,
    };
    racers.set(state.room, { host: name });
    send({ kind: 'lobby-open' });
    emit();
  };

  const joinRoom = (room) => {
    state = {
      ...state,
      role: 'guest',
      room,
      text: '',
      duration: 30,
      startedAt: 0,
      racer: { name, cursor: 0, wpm: 0, accuracy: 100, finished: false },
      opponent: { name: 'Host', cursor: 0, wpm: 0, finished: false },
    };
    send({ kind: 'lobby-join', name });
    emit();
  };

  const leave = () => {
    if (state.room) {
      racers.delete(state.room);
      send({ kind: 'leave' });
    }
    state = { ...state, role: 'idle', room: '', opponent: null };
    emit();
  };

  const startCountdown = () => {
    if (state.role !== 'host') return;
    state.startedAt = performance.now();
    send({ kind: 'start', text: state.text, duration: state.duration });
    emit();
  };

  const tickRacer = ({ cursor, wpm, accuracy }) => {
    state.racer = { ...state.racer, cursor, wpm, accuracy };
    send({ kind: 'tick', cursor, wpm, name });
    emit();
  };

  const finishRacer = ({ wpm, accuracy }) => {
    state.racer = { ...state.racer, finished: true, wpm, accuracy };
    send({ kind: 'finish', wpm, accuracy, name });
    emit();
  };

  if (channel) {
    channel.addEventListener('message', (e) => {
      const msg = e.data;
      if (!msg || msg.room !== state.room) return;
      if (msg.kind === 'lobby-open' && state.role === 'host') {
        // A second tab joined: tell it the room text and the player list.
        send({ kind: 'lobby-state', text: state.text, duration: state.duration, hostName: name });
      }
      if (msg.kind === 'lobby-join' && state.role === 'host') {
        state.opponent = { name: msg.name || 'Guest', cursor: 0, wpm: 0, finished: false };
        emit();
      }
      if (msg.kind === 'lobby-state' && state.role === 'guest') {
        state.text = msg.text;
        state.duration = msg.duration;
        state.opponent = { name: msg.hostName || 'Host', cursor: 0, wpm: 0, finished: false };
        emit();
      }
      if (msg.kind === 'start' && state.role === 'guest') {
        state.text = msg.text;
        state.duration = msg.duration;
        state.startedAt = performance.now();
        emit();
      }
      if (msg.kind === 'tick' && msg.name !== name) {
        state.opponent = { ...state.opponent, name: msg.name, cursor: msg.cursor, wpm: msg.wpm };
        emit();
      }
      if (msg.kind === 'finish' && msg.name !== name) {
        state.opponent = { ...state.opponent, name: msg.name, finished: true, wpm: msg.wpm };
        emit();
      }
    });
  }

  return {
    getState: () => state,
    on: (fn) => { listeners.push(fn); fn(state); return () => { listeners = listeners.filter((l) => l !== fn); }; },
    startAsHost,
    joinRoom,
    leave,
    startCountdown,
    tickRacer,
    finishRacer,
  };
};

const makeRoomCode = () => {
  const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
};
