import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, TERMINAL_DURATION, TERMINAL_COOLDOWN } from '../src/game/engine.js';
import { JS_SPEED_SNIPPETS, JS_MERGE_CHALLENGES } from '../src/coding/js_challenges.js';

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
