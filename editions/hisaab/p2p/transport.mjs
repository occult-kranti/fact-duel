/**
 * editions/hisaab/p2p/transport.mjs — how two browsers exchange duel messages, without a server of ours.
 *
 * A transport joins exactly two peers and carries JSON-serialisable messages between them:
 *
 *   {
 *     kind: 'memory' | 'broadcast' | 'webrtc',
 *     send(message): void,                       // to the other peer; dropped while there is none
 *     onMessage(fn: (message) => void): () => void,
 *     onPeer(fn: (event: 'join' | 'leave') => void): () => void,
 *     close(): Promise<void> | void,
 *   }
 *
 * The protocol (protocol.mjs) re-sends its hello on every 'join', so a message sent before the other
 * side arrived costs nothing. Three implementations:
 *   - createMemoryPair()           two ends in one JS realm (tests, the dev shell's self-test)
 *   - createBroadcastTransport()   two tabs on one device (BroadcastChannel; same origin)
 *   - createTrysteroTransport()    two devices over WebRTC (trystero.mjs; public signalling)
 */
import { STORAGE } from '../../../lib/storage-names.mjs';

/** A message as it would arrive off a wire: a deep copy, never the sender's object. */
const wire = (message) => JSON.parse(JSON.stringify(message));

function emitter() {
  const set = new Set();
  return {
    on(fn) {
      set.add(fn);
      return () => set.delete(fn);
    },
    emit(value) {
      for (const fn of [...set]) {
        try {
          fn(value);
        } catch (error) {
          // A listener's bug must not stop delivery to the others; surface it asynchronously.
          setTimeout(() => {
            throw error;
          });
        }
      }
    },
    get size() {
      return set.size;
    },
  };
}

/**
 * Two connected ends in one realm. Delivery is asynchronous (a macrotask, plus `latencyMs`), in order,
 * and by copy, so code tested over it cannot depend on synchronous or shared-object delivery.
 * `drop(fn)` lets a test lose chosen messages.
 */
export function createMemoryPair({ latencyMs = 0 } = {}) {
  const ends = [0, 1].map(() => ({ messages: emitter(), peers: emitter(), open: true }));
  let drop = () => false;
  const make = (self, other) => ({
    kind: 'memory',
    send(message) {
      if (!ends[self].open || !ends[other].open) return;
      const copy = wire(message);
      if (drop(copy, self)) return;
      setTimeout(() => {
        if (ends[other].open) ends[other].messages.emit(copy);
      }, latencyMs);
    },
    onMessage: (fn) => ends[self].messages.on(fn),
    onPeer(fn) {
      const off = ends[self].peers.on(fn);
      // Both ends exist from the start: a late subscriber still hears the join.
      setTimeout(() => {
        if (ends[self].open && ends[other].open) fn('join');
      });
      return off;
    },
    close() {
      if (!ends[self].open) return;
      ends[self].open = false;
      setTimeout(() => ends[other].open && ends[other].peers.emit('leave'), latencyMs);
    },
  });
  const pair = [make(0, 1), make(1, 0)];
  return Object.assign(pair, {
    /** Test hook: `fn(message, fromEnd)` returning true drops that message. */
    drop(fn) {
      drop = fn;
    },
  });
}

const randomId = () =>
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Two tabs of this site on one device, over a BroadcastChannel named for the room code (and
 * namespaced per edition through lib/storage-names.mjs). The first other tab to answer becomes the
 * peer; any third tab is ignored. Same-origin only, which is exactly "same device, same site".
 */
export function createBroadcastTransport(code, { Channel = globalThis.BroadcastChannel } = {}) {
  if (typeof Channel !== 'function') throw new Error('BroadcastChannel is not available in this browser.');
  const self = randomId();
  const channel = new Channel(`${STORAGE.p2pChannel}${String(code).toUpperCase()}`);
  const messages = emitter(),
    peers = emitter();
  let peer = null,
    open = true;
  const post = (type, body, to = peer) => {
    if (open) channel.postMessage({ type, from: self, to, body });
  };
  channel.onmessage = (event) => {
    const m = event?.data;
    if (!m || typeof m !== 'object' || m.from === self) return;
    if (m.to && m.to !== self) return;
    if (m.type === 'announce' || m.type === 'announce-reply') {
      if (peer && peer !== m.from) return;
      const fresh = !peer;
      peer = m.from;
      if (m.type === 'announce') post('announce-reply', null, m.from);
      if (fresh) peers.emit('join');
    } else if (m.type === 'bye' && m.from === peer) {
      peer = null;
      peers.emit('leave');
    } else if (m.type === 'data' && m.from === peer) messages.emit(m.body);
  };
  post('announce', null, null);
  return {
    kind: 'broadcast',
    send(message) {
      if (peer) post('data', wire(message));
    },
    onMessage: (fn) => messages.on(fn),
    onPeer: (fn) => peers.on(fn),
    close() {
      if (!open) return;
      post('bye', null);
      open = false;
      channel.close();
    },
  };
}

export { createTrysteroTransport, TRYSTERO_APP_ID } from './trystero.mjs';
