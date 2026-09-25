/**
 * editions/hisaab/p2p/trystero.mjs — the WebRTC transport, over trystero (MIT, npm `trystero`).
 *
 * Why trystero: it is a browser-only library that brokers the WebRTC handshake over PUBLIC
 * infrastructure (its default strategy signals over public Nostr relays, then peers talk directly on
 * an RTCDataChannel), so a static GitHub Pages site gets two-device play with no server of ours. The
 * room password (the room code) encrypts the session descriptions it posts to the relays. Caveats a
 * screen must be honest about: it needs both browsers to reach at least one public relay, and a
 * direct peer connection; strict corporate or carrier NATs can block it (no TURN relay is configured,
 * because that would be a server). The library is loaded lazily, only when a friend duel starts.
 *
 * `createTrysteroTransport(code)` implements the transport contract in transport.mjs. The first peer
 * to appear in the room becomes the partner; any later peer is ignored.
 */
export const TRYSTERO_APP_ID = 'hisaab-do.duel.v1';

/**
 * @param {string} code the room code (both players type the same one)
 * @param {{ appId?: string, relayUrls?: string[], joinRoom?: Function }} [options]
 *   `joinRoom` swaps the library entry point (tests); `relayUrls` pins the Nostr relays.
 */
export async function createTrysteroTransport(code, { appId = TRYSTERO_APP_ID, relayUrls, joinRoom } = {}) {
  const join = joinRoom ?? (await import('trystero')).joinRoom;
  const room = join(
    { appId, password: String(code), ...(relayUrls ? { relayConfig: { urls: relayUrls } } : {}) },
    `duel-${String(code).toUpperCase()}`,
  );
  const action = room.makeAction('duel');
  const messages = new Set(),
    peers = new Set();
  let partner = null,
    open = true;
  const emit = (set, value) => {
    for (const fn of [...set]) fn(value);
  };
  room.onPeerJoin = (peerId) => {
    if (partner) return;
    partner = peerId;
    emit(peers, 'join');
  };
  room.onPeerLeave = (peerId) => {
    if (peerId !== partner) return;
    partner = null;
    emit(peers, 'leave');
  };
  action.onMessage = (data, context) => {
    if (open && context?.peerId === partner) emit(messages, data);
  };
  return {
    kind: 'webrtc',
    send(message) {
      if (open && partner) void action.send(message, { target: partner }).catch(() => {});
    },
    onMessage(fn) {
      messages.add(fn);
      return () => messages.delete(fn);
    },
    onPeer(fn) {
      peers.add(fn);
      if (partner) setTimeout(() => open && partner && fn('join'));
      return () => peers.delete(fn);
    },
    async close() {
      if (!open) return;
      open = false;
      partner = null;
      await room.leave();
    },
  };
}
