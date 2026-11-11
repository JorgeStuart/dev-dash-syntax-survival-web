import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, TERMINAL_DURATION, TERMINAL_COOLDOWN } from '../src/game/engine.js';
import { JS_SPEED_SNIPPETS, JS_MERGE_CHALLENGES } from '../src/coding/js_challenges.js';
import { P2PManager } from '../src/network/p2p_manager.js';

function setup(count = 1) {
  const engine = new GameEngine();
  engine.startNewMatch(Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Dev ${i}`, devClass: 'fullstack' })), false);
  const p = engine.snapshot.players[0];
  const term = engine.snapshot.terminals[0];
  term.x = p.x; term.y = p.y;
  return { engine, p, term, code: JS_SPEED_SNIPPETS.find(s => s.id === term.snippetId).code };
}

test('host rejects remote, occupied, invalid and repeated terminal starts', () => {
  const { engine, p, term } = setup(2);
  assert.equal(engine.setPlayerCoding(p.id, true, -1), false);
  assert.equal(p.isCoding, false);
  term.x += 100;
  assert.equal(engine.setPlayerCoding(p.id, true, term.id), false);
  term.x = p.x;
  assert.equal(engine.setPlayerCoding(p.id, true, term.id), true);
  p.terminalTimeRemaining = 7;
  assert.equal(engine.setPlayerCoding(p.id, true, term.id), false);
  assert.equal(p.terminalTimeRemaining, 7);
  assert.equal(engine.setPlayerCoding('p1', true, term.id), false);
});

test('expiry releases lock, removes protection and enforces cooldown on host', () => {
  const { engine, p, term, code } = setup();
  engine.setPlayerCoding(p.id, true, term.id);
  engine.tickPlayers(TERMINAL_DURATION);
  assert.equal(p.isCoding, false);
  assert.equal(term.lockedByPlayerId, null);
  assert.equal(p.terminalCooldownRemaining, TERMINAL_COOLDOWN);
  assert.equal(engine.completeTerminal(p.id, term.id, code), false);
  term.x = p.x; term.y = p.y;
  assert.equal(engine.setPlayerCoding(p.id, true, term.id), false);
  engine.tickPlayers(TERMINAL_COOLDOWN);
  term.x = p.x; term.y = p.y;
  assert.equal(engine.setPlayerCoding(p.id, true, term.id), true);
});

test('completion requires owned live terminal and matching code; grants reward once', () => {
  const { engine, p, term, code } = setup();
  assert.equal(engine.completeTerminal(p.id, term.id, code), false);
  engine.setPlayerCoding(p.id, true, term.id);
  assert.equal(engine.completeTerminal(p.id, term.id, 'incorrect'), false);
  assert.equal(engine.completeTerminal(p.id, term.id, code), true);
  const score = p.score;
  assert.ok(score > 0);
  assert.equal(engine.completeTerminal(p.id, term.id, code), false);
  assert.equal(p.score, score);
  assert.equal(p.terminalCooldownRemaining, TERMINAL_COOLDOWN);
});

test('exit and merge interruption release reservation; stop cannot cancel merge protection', () => {
  const { engine, p, term } = setup();
  engine.setPlayerCoding(p.id, true, term.id);
  engine.setPlayerCoding(p.id, false);
  assert.equal(term.lockedByPlayerId, null);
  p.terminalCooldownRemaining = 0;
  engine.setPlayerCoding(p.id, true, term.id);
  engine.startMergeConflictEvent();
  assert.equal(term.lockedByPlayerId, null);
  engine.setPlayerCoding(p.id, false);
  assert.equal(p.codingType, 'merge');
});

test('merge rewards every correct answer, without stacking combat upgrades or punishing last', () => {
  const { engine } = setup(3);
  engine.startMergeConflictEvent();
  const answer = JS_MERGE_CHALLENGES[0].correctAnswer;
  engine.completeMergeChallenge('p0', 'wrong');
  assert.deepEqual(engine.snapshot.activeMerge.completedOrder, []);
  engine.completeMergeChallenge('p0', answer);
  engine.completeMergeChallenge('p0', answer);
  engine.completeMergeChallenge('p1', answer);
  engine.completeMergeChallenge('p2', answer);
  assert.deepEqual(engine.snapshot.players.map(p => p.score), [300, 240, 240]);
  assert.deepEqual(engine.snapshot.players.map(p => p.xp), [130, 130, 130]);
  assert.ok(engine.snapshot.players.every(p => p.blasterLevel === 1 && p.orbitalCount === 2 && p.damageMult === 1));
  assert.equal(engine.snapshot.enemies.length, 0);
  assert.equal(engine.snapshot.activeMerge, null);
});

test('merge timeout does not spawn punishment bosses', () => {
  const { engine } = setup(2);
  engine.startMergeConflictEvent();
  engine.finishMergeConflictEvent();
  assert.equal(engine.snapshot.enemies.length, 0);
  assert.ok(engine.snapshot.players.every(p => !p.isCoding));
});

test('bots finish terminals under the same cooldown; final bot merge does not crash tick', () => {
  const { engine, p, term } = setup();
  p.isBot = true;
  engine.setPlayerCoding(p.id, true, term.id);
  engine.tickPlayers(5);
  assert.equal(p.deploysCompleted, 1);
  assert.equal(p.terminalCooldownRemaining, TERMINAL_COOLDOWN);
  engine.startMergeConflictEvent();
  p.mergeProgress = 99.9;
  assert.doesNotThrow(() => engine.tick(0.1));
  assert.equal(engine.snapshot.activeMerge, null);
});

test('new match resets timers and terminal sessions', () => {
  const { engine, p, term } = setup();
  engine.setPlayerCoding(p.id, true, term.id);
  engine.hackerTimer = 1;
  engine.startNewMatch([{ id: 'p0', devClass: 'fullstack' }], false);
  assert.equal(engine.snapshot.players[0].terminalCooldownRemaining, 0);
  assert.equal(engine.snapshot.players[0].terminalId, null);
  assert.equal(engine.hackerTimer, 18);
  assert.ok(engine.snapshot.terminals.every(t => t.lockedByPlayerId === null));
});

test('disconnect during terminal and during merge cleans up reservations and unblocks merge completion', () => {
  const { engine, p, term } = setup(2);
  const p2 = engine.snapshot.players[1];

  // Player 1 locks terminal then disconnects
  assert.equal(engine.setPlayerCoding(p.id, true, term.id), true);
  assert.equal(term.lockedByPlayerId, p.id);
  assert.equal(engine.handlePlayerDisconnect(p.id), true);
  assert.equal(term.lockedByPlayerId, null);
  assert.equal(engine.snapshot.players.length, 1);

  // Two players in Merge: p0 completes, p1 disconnects -> Merge finishes immediately
  const { engine: eng2 } = setup(2);
  eng2.startMergeConflictEvent();
  const ans = JS_MERGE_CHALLENGES[0].correctAnswer;
  assert.equal(eng2.completeMergeChallenge('p0', ans), true);
  assert.ok(eng2.snapshot.activeMerge !== null);
  assert.equal(eng2.handlePlayerDisconnect('p1'), true);
  assert.equal(eng2.snapshot.activeMerge, null);
});

test('host rejects invalid upgrade ids and duplicate upgrade claims', () => {
  const { engine, p } = setup(1);
  p.pendingUpgrades = 1;
  assert.equal(engine.applyUpgrade(p.id, 'invalid_hack'), false);
  assert.equal(p.pendingUpgrades, 1);
  assert.equal(p.score, 0);
  assert.equal(engine.applyUpgrade(p.id, 'blaster'), true);
  assert.equal(p.pendingUpgrades, 0);
  assert.equal(engine.applyUpgrade(p.id, 'blaster'), false);
});

test('P2PManager connects two tabs via local channel fallback even when cloud PeerJS fails', async () => {
  const channels = new Map();
  const createMockChannel = (name) => {
    if (!channels.has(name)) channels.set(name, new Set());
    const peers = channels.get(name);
    const ch = {
      onmessage: null,
      postMessage(data) {
        for (const other of peers) {
          if (other !== ch && other.onmessage) {
            other.onmessage({ data: structuredClone(data) });
          }
        }
      },
      close() {
        peers.delete(ch);
      },
    };
    peers.add(ch);
    return ch;
  };

  // Simula falha do PeerJS Cloud (ex: erro de rede/TLS no servidor público) sem desabilitar TLS
  const failingPeerFactory = () => ({
    on(event, cb) {
      if (event === 'error') setTimeout(() => cb({ type: 'network' }), 0);
    },
    destroy() {},
  });

  const hostP2P = new P2PManager({ peerFactory: failingPeerFactory, channelFactory: createMockChannel });
  const clientP2P = new P2PManager({ peerFactory: failingPeerFactory, channelFactory: createMockChannel });

  const roomCode = await hostP2P.createRoom('HostDev', 'fullstack', '#00e5ff');
  clientP2P.joinRoom(roomCode, 'ClientDev', 'fullstack', '#00e5ff');

  assert.equal(hostP2P.lobbyPlayers.length, 2);
  assert.equal(clientP2P.lobbyPlayers.length, 2);
  // Garante classe e cor exclusivas atribuídas pelo Host
  assert.notEqual(hostP2P.lobbyPlayers[0].devClass, hostP2P.lobbyPlayers[1].devClass);
  assert.notEqual(hostP2P.lobbyPlayers[0].color, hostP2P.lobbyPlayers[1].color);
  assert.equal(clientP2P.connectionState, 'local');

  // Testa início de partida e sincronização de snapshot para 2 jogadores
  const engine = new GameEngine();
  let clientMatchStarted = false;
  clientP2P.onMatchStart = (snap) => {
    clientMatchStarted = snap.players.length === 2;
  };
  engine.startNewMatch(hostP2P.lobbyPlayers, false);
  hostP2P.broadcastMatchStart(engine.snapshot);
  assert.equal(clientMatchStarted, true);

  // Testa desconexão do cliente
  let disconnectedId = null;
  hostP2P.onPlayerDisconnect = (id) => {
    disconnectedId = id;
    engine.handlePlayerDisconnect(id);
  };
  clientP2P.cleanup();
  assert.ok(disconnectedId !== null);
  assert.equal(hostP2P.lobbyPlayers.length, 1);
  assert.equal(engine.snapshot.players.length, 1);
  hostP2P.cleanup();
});
