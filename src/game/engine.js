import {
  ARENA_EFFECT_TYPES,
  isEquivalentJsAnswer,
  JS_MERGE_CHALLENGES,
  JS_SPEED_SNIPPETS,
  normalizeCode,
} from '../coding/js_challenges.js';
import {
  getBossStats,
  getBugStats,
  getHackerStats,
  getPowerupThreshold,
} from './types.js';

export const ARENA_HALF = 1100; // Arena 2200x2200 (-1100 a +1100)
export const SPRINT_DURATION = 300; // 5 minutos (300s)
export const TERMINAL_DURATION = 18;
export const TERMINAL_COOLDOWN = 6;
export const TERMINAL_RANGE = 60;
export const MERGE_INTERVAL = 75; // A cada 75s toca a sirene de Merge Conflict

// Posições determinísticas de Racks no Data Center
export const SERVER_RACKS = [];
for (let gx = -850; gx <= 850; gx += 340) {
  for (let gy = -850; gy <= 850; gy += 340) {
    if (Math.abs(gx) < 200 && Math.abs(gy) < 200) continue; // Centro livre para spawn
    SERVER_RACKS.push({ x: gx, y: gy });
  }
}

export const UPGRADE_OPTIONS = [
  { id: 'blaster', title: '⚡ Syntax Blaster +1', desc: '+1 projétil de código e +22% dano base' },
  { id: 'orbital', title: '🌀 Git Orbital +1', desc: 'Adiciona um satélite Git giratório ao redor do Dev' },
  { id: 'lightning', title: '🌩️ Regex Lightning +1', desc: 'Raios automáticos atingem inimigos próximos (+Dano)' },
  { id: 'firewall', title: '🔥 Firewall Aura +1', desc: 'Aura térmica que queima bugs ao redor continuamente' },
  { id: 'haste', title: '🚀 Overclock CPU', desc: '+18% Velocidade de Disparo, +12% Move Speed e +35 HP' },
  { id: 'magnet', title: '🧲 Garbage Collector', desc: '+65% Raio de coleta de XP e +120 Commits na hora' },
];

const BOT_PROFILES = [
  { name: 'Full_Felipe', devClass: 'fullstack', color: '#00e5ff' },
  { name: 'Async_Ana', devClass: 'frontend', color: '#ff2d95' },
  { name: 'Rust_Rob', devClass: 'backend', color: '#33ff88' },
  { name: 'Sec_Samuca', devClass: 'secops', color: '#ffb020' },
];
const FALLBACK_COLORS = ['#00e5ff', '#ff2d95', '#33ff88', '#ffb020', '#a855f7', '#38bdf8', '#f43f5e', '#eab308'];

export class GameEngine {
  constructor() {
    this.inputs = new Map();
    this.fireTimers = new Map();
    this.lightningTimers = new Map();
    this.botTerminalTimers = new Map();
    this.nextEntityId = 1;
    this.spawnTimer = 0;
    this.hackerTimer = 18;
    this.terminalSpawnTimer = 4;
    this.mergeChallengeIdx = 0;
    this.orbitalAngle = 0;
    this.usedTerminalIds = new Set();
    this.usedMergeIds = new Set();
    this.roomSettings = { mode: 'casual', botDifficulty: 'normal' };
    this.snapshot = this.createEmptySnapshot();
  }

  createEmptySnapshot() {
    return {
      sprintTimeRemaining: SPRINT_DURATION,
      nextMergeTimer: MERGE_INTERVAL,
      matchEnded: false,
      roomSettings: { ...this.roomSettings },
      players: [],
      enemies: [],
      projectiles: [],
      gems: [],
      terminals: [],
      floatingTexts: [],
      arenaEffects: [],
      collectiveBoss: null,
      activeMerge: null,
      bannerMessage: null,
      bannerTimer: 0,
    };
  }

  startNewMatch(lobbyPlayers, fillBots, roomSettings = null) {
    if (roomSettings) {
      this.roomSettings = { ...this.roomSettings, ...roomSettings };
    }
    this.snapshot = this.createEmptySnapshot();
    this.spawnTimer = 0;
    this.hackerTimer = 18;
    this.terminalSpawnTimer = 4;
    this.mergeChallengeIdx = 0;
    this.usedTerminalIds.clear();
    this.usedMergeIds.clear();
    this.inputs.clear();
    this.fireTimers.clear();
    this.lightningTimers.clear();
    this.botTerminalTimers.clear();

    const allParticipants = [...lobbyPlayers];
    if (fillBots && allParticipants.length < 4) {
      const needed = 4 - allParticipants.length;
      const usedClasses = new Set(allParticipants.map((p) => p.devClass));
      const usedColors = new Set(allParticipants.map((p) => p.color));
      const availableBots = BOT_PROFILES.filter((b) => !usedClasses.has(b.devClass));

      for (let i = 0; i < needed; i++) {
        const b = availableBots[i] || BOT_PROFILES[i % BOT_PROFILES.length];
        usedClasses.add(b.devClass);
        const botColor = !usedColors.has(b.color)
          ? b.color
          : FALLBACK_COLORS.find((c) => !usedColors.has(c)) || b.color;
        usedColors.add(botColor);

        allParticipants.push({
          id: `bot-${i + 1}`,
          name: b.name,
          devClass: b.devClass,
          color: botColor,
          isHost: false,
          isBot: true,
        });
      }
    }

    allParticipants.forEach((p, idx) => {
      const angle = (idx / allParticipants.length) * Math.PI * 2;
      const spawnX = Math.cos(angle) * 110;
      const spawnY = Math.sin(angle) * 110;
      this.snapshot.players.push(this.createPlayerState(p, spawnX, spawnY));
    });

    // Já nasce com 4 terminais de código espalhados no Data Center
    for (let i = 0; i < 4; i++) {
      this.spawnCodeTerminal();
    }

    this.showBanner('🚀 SPRINT INICIADA! COLETE XP, HACKEIE TERMINAIS JS E LIDERE OS COMMITS!', 4.5);
  }

  createPlayerState(info, x, y) {
    const isTank = info.devClass === 'backend';
    const isSpeed = info.devClass === 'frontend';
    const isSec = info.devClass === 'secops';

    const maxHp = isTank ? 145 : 100;
    return {
      id: info.id,
      name: info.name,
      devClass: info.devClass,
      color: info.color,
      isBot: info.isBot,
      x,
      y,
      vx: 0,
      vy: 0,
      hp: maxHp,
      maxHp,
      xp: 0,
      level: 1,
      upgradesDone: 0,
      pendingUpgrades: 0,
      score: 0,
      kills: 0,
      deploysCompleted: 0,
      challengesAttempted: 0,
      challengesCorrect: 0,
      collectiveContribution: 0,
      lastExplanation: null,
      activeBuffs: {
        async_overclock: 0,
        memory_gc: 0,
        logic_firewall: 0,
      },
      isCoding: false,
      codingType: 'none',
      terminalId: null,
      terminalTimeRemaining: 0,
      terminalCooldownRemaining: 0,
      mergeProgress: 0,
      mergeFinishedRank: 0,
      respawnTimer: 0,
      moveSpeed: isSpeed ? 245 : 200,
      damageMult: 1.0,
      fireRateMult: isSpeed ? 1.2 : 1.0,
      blasterLevel: 1,
      orbitalCount: info.devClass === 'fullstack' ? 2 : 1,
      lightningLevel: isSec ? 1 : 0,
      firewallLevel: isTank ? 1 : 0,
      magnetRadius: 115,
      walkCycle: 0,
      facing: 1,
    };
  }

  setPlayerInput(playerId, input) {
    this.inputs.set(playerId, input);
  }

  releaseTerminal(p) {
    for (const term of this.snapshot.terminals) {
      if (term.lockedByPlayerId === p.id) term.lockedByPlayerId = null;
    }
    this.botTerminalTimers.delete(p.id);
    p.terminalId = null;
    p.terminalTimeRemaining = 0;
    p.isCoding = false;
    p.codingType = 'none';
    p.terminalCooldownRemaining = TERMINAL_COOLDOWN;
  }

  handlePlayerDisconnect(playerId) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p) return false;
    if (p.codingType === 'terminal' || p.terminalId !== null) {
      this.releaseTerminal(p);
    }
    this.inputs.delete(playerId);
    this.fireTimers.delete(playerId);
    this.lightningTimers.delete(playerId);
    this.botTerminalTimers.delete(playerId);
    this.snapshot.players = this.snapshot.players.filter((pl) => pl.id !== playerId);

    const merge = this.snapshot.activeMerge;
    if (merge) {
      merge.completedOrder = merge.completedOrder.filter((id) =>
        this.snapshot.players.some((pl) => pl.id === id)
      );
      if (
        this.snapshot.players.length > 0 &&
        this.snapshot.players.every((pl) => merge.completedOrder.includes(pl.id))
      ) {
        this.finishMergeConflictEvent();
      }
    }
    return true;
  }

  getBotTerminalDuration() {
    const diff = this.roomSettings?.botDifficulty || 'normal';
    if (diff === 'facil') {
      const errDelay = Math.random() < 0.35 ? 2.2 : 0;
      return 7.2 + errDelay;
    }
    if (diff === 'dificil') {
      const errDelay = Math.random() < 0.05 ? 0.4 : 0;
      return 3.0 + errDelay;
    }
    // normal: <= 4.8s para manter o ritmo padrão e compatibilidade com os testes
    const errDelay = Math.random() < 0.15 ? 0.5 : 0;
    return 4.2 + errDelay;
  }

  setPlayerCoding(playerId, isCoding, terminalId = null) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || p.respawnTimer > 0 || this.snapshot.matchEnded || this.snapshot.activeMerge) return false;
    if (!isCoding) {
      if (p.codingType === 'terminal') this.releaseTerminal(p);
      return true;
    }
    if (p.isCoding || p.terminalCooldownRemaining > 0) return false;
    const term = this.snapshot.terminals.find((t) => t.id === terminalId && t.active);
    if (!term || term.lockedByPlayerId || Math.hypot(term.x - p.x, term.y - p.y) > TERMINAL_RANGE) return false;
    term.lockedByPlayerId = p.id;
    p.isCoding = true;
    p.codingType = 'terminal';
    p.terminalId = term.id;
    p.terminalTimeRemaining = TERMINAL_DURATION;
    if (p.isBot) this.botTerminalTimers.set(p.id, this.getBotTerminalDuration());
    return true;
  }

  applyTerminalArenaEffect(p, effectType = 'filter_purge') {
    if (!p.activeBuffs) {
      p.activeBuffs = { async_overclock: 0, memory_gc: 0, logic_firewall: 0 };
    }
    const effectMeta = ARENA_EFFECT_TYPES[effectType] || ARENA_EFFECT_TYPES.filter_purge;

    switch (effectMeta.id) {
      case 'filter_purge': {
        // Elimina até 4 bugs próximos na arena (ou causa alto dano a inimigos maiores)
        const nearby = [...this.snapshot.enemies]
          .filter((e) => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) <= 360)
          .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))
          .slice(0, 4);

        let purged = 0;
        for (const e of nearby) {
          if (e.kind === 'bug') {
            this.damageEnemy(e, e.hp + 999, p);
            purged += 1;
          } else {
            this.damageEnemy(e, 140 * p.damageMult, p);
          }
        }
        this.snapshot.arenaEffects.push({
          id: this.nextEntityId++,
          type: 'filter_purge',
          x: p.x,
          y: p.y,
          radius: 340,
          color: '#00e5ff',
          life: 0.65,
          maxLife: 0.65,
        });
        this.addFloatingText(
          p.x,
          p.y - 52,
          purged > 0 ? `💥 FILTER PURGE! ${purged} BUGS ELIMINADOS` : '💥 FILTER PURGE ATIVO!',
          '#00e5ff'
        );
        break;
      }
      case 'async_overclock': {
        // Acelera disparos temporariamente (+45% fireRate), com duração limitada a 14s
        p.activeBuffs.async_overclock = Math.min(14, (p.activeBuffs.async_overclock || 0) + 10);
        this.snapshot.arenaEffects.push({
          id: this.nextEntityId++,
          type: 'async_overclock',
          x: p.x,
          y: p.y,
          radius: 150,
          color: '#ffb020',
          life: 0.55,
          maxLife: 0.55,
        });
        this.addFloatingText(p.x, p.y - 52, '⚡ ASYNC OVERCLOCK! +45% CADÊNCIA (10s)', '#ffb020');
        break;
      }
      case 'memory_gc': {
        // Recupera vida adicional (+35 HP) e amplia raio de coleta de XP (+120px) por até 16s
        p.hp = Math.min(p.maxHp, p.hp + 35);
        p.activeBuffs.memory_gc = Math.min(16, (p.activeBuffs.memory_gc || 0) + 12);
        this.snapshot.arenaEffects.push({
          id: this.nextEntityId++,
          type: 'memory_gc',
          x: p.x,
          y: p.y,
          radius: 250,
          color: '#33ff88',
          life: 0.65,
          maxLife: 0.65,
        });
        this.addFloatingText(p.x, p.y - 52, '🧲 GARBAGE COLLECTOR! +35 HP & ÍMÃ XP', '#33ff88');
        break;
      }
      case 'logic_firewall':
      default: {
        // Pulso térmico imediato nos inimigos próximos + bônus temporário de +25% dano (teto 14s)
        p.activeBuffs.logic_firewall = Math.min(14, (p.activeBuffs.logic_firewall || 0) + 10);
        const nearby = [...this.snapshot.enemies].filter(
          (e) => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) <= 230
        );
        for (const e of nearby) {
          this.damageEnemy(e, 75 * p.damageMult, p);
        }
        this.snapshot.arenaEffects.push({
          id: this.nextEntityId++,
          type: 'logic_firewall',
          x: p.x,
          y: p.y,
          radius: 230,
          color: '#ff2d95',
          life: 0.65,
          maxLife: 0.65,
        });
        this.addFloatingText(p.x, p.y - 52, '🔥 LOGIC FIREWALL! PULSO & +25% DANO', '#ff2d95');
        break;
      }
    }

    // Se houver um Boss Coletivo ativo na arena, concluir um terminal também envia um pulso de código nele!
    if (this.snapshot.collectiveBoss && this.snapshot.collectiveBoss.hp > 0) {
      this.applyCodingStrikeToCollectiveBoss(p, 'terminal');
    }
  }

  completeTerminal(playerId, terminalId, code) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || this.snapshot.matchEnded || this.snapshot.activeMerge || p.respawnTimer > 0 ||
        p.codingType !== 'terminal' || p.terminalId !== terminalId || p.terminalTimeRemaining <= 0) return false;
    const term = this.snapshot.terminals.find((t) => t.id === terminalId && t.active && t.lockedByPlayerId === playerId);
    const snippet = JS_SPEED_SNIPPETS.find((s) => s.id === term?.snippetId);
    if (!snippet) return false;
    p.challengesAttempted = (p.challengesAttempted || 0) + 1;
    if (!p.isBot && !isEquivalentJsAnswer(code, snippet)) return false;

    p.challengesCorrect = (p.challengesCorrect || 0) + 1;
    const effectMeta = ARENA_EFFECT_TYPES[snippet.effectType] || ARENA_EFFECT_TYPES.filter_purge;
    p.lastExplanation = {
      id: snippet.id,
      title: `${snippet.topic.toUpperCase()} • ${snippet.difficulty.toUpperCase()} (${effectMeta.shortTag})`,
      text: snippet.explanation,
      code: snippet.code,
    };

    this.releaseTerminal(p);
    this.snapshot.terminals = this.snapshot.terminals.filter((t) => t.id !== terminalId);
    p.deploysCompleted += 1;
    const secBonus = p.devClass === 'secops' ? 1.25 : 1.0;
    const commitsGain = Math.round(snippet.commitsReward * secBonus);
    const xpGain = Math.round(snippet.xpReward * secBonus);
    p.score += commitsGain;
    p.hp = Math.min(p.maxHp, p.hp + 25);
    this.giveXp(p, xpGain);
    this.applyTerminalArenaEffect(p, snippet.effectType);
    this.addFloatingText(p.x, p.y - 35, `💻 DEPLOY OK! +${commitsGain} COMMITS`, '#33ff88');
    return true;
  }

  updateMergeProgress(playerId, progress) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || !this.snapshot.activeMerge) return;
    p.mergeProgress = Math.max(p.mergeProgress, Math.min(99, progress));
  }

  completeMergeChallenge(playerId, answer) {
    const merge = this.snapshot.activeMerge;
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!merge || !p || this.snapshot.matchEnded || merge.timeRemaining <= 0 || merge.completedOrder.includes(playerId)) return false;
    const challenge = JS_MERGE_CHALLENGES.find((c) => c.id === merge.challengeId);
    if (!challenge) return false;
    p.challengesAttempted = (p.challengesAttempted || 0) + 1;
    if (!p.isBot && !isEquivalentJsAnswer(answer, challenge)) return false;

    p.challengesCorrect = (p.challengesCorrect || 0) + 1;
    p.lastExplanation = {
      id: challenge.id,
      title: challenge.title,
      text: challenge.explanation,
      code: challenge.correctAnswer,
    };

    merge.completedOrder.push(playerId);
    const rank = merge.completedOrder.length;
    p.mergeFinishedRank = rank;
    p.mergeProgress = 100;
    p.deploysCompleted += 1;
    p.isCoding = false;
    p.codingType = 'none';

    const commits = rank === 1 ? 300 : 240;
    p.score += commits;
    this.giveXp(p, 130);
    this.applyCodingStrikeToCollectiveBoss(p, 'merge');
    this.addFloatingText(p.x, p.y - 40, `✅ MERGE #${rank}! +${commits} COMMITS`, '#33ff88');
    if (rank === 1) {
      this.showBanner(`🏆 ${p.name} FEZ O 1º PUSH! +300 COMMITS. TODOS OS ACERTOS VALEM +240!`, 4);
    }

    // Se todos os jogadores já terminaram, encerra o evento imediatamente
    if (merge.completedOrder.length >= this.snapshot.players.length) {
      this.finishMergeConflictEvent();
    }
    return true;
  }

  applyUpgrade(playerId, upgradeId) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || p.pendingUpgrades <= 0) return false;
    if (!UPGRADE_OPTIONS.some((u) => u.id === upgradeId)) return false;

    p.pendingUpgrades -= 1;
    p.upgradesDone += 1;
    p.score += 40;

    switch (upgradeId) {
      case 'blaster':
        p.blasterLevel += 1;
        p.damageMult += 0.22;
        break;
      case 'orbital':
        p.orbitalCount += 1;
        break;
      case 'lightning':
        p.lightningLevel += 1;
        break;
      case 'firewall':
        p.firewallLevel += 1;
        break;
      case 'haste':
        p.fireRateMult += 0.18;
        p.moveSpeed += 22;
        p.maxHp += 35;
        p.hp = Math.min(p.maxHp, p.hp + 35);
        break;
      case 'magnet':
        p.magnetRadius += 70;
        p.score += 120;
        break;
    }

    this.addFloatingText(p.x, p.y - 30, `⬆️ UPGRADE: ${upgradeId.toUpperCase()}`, '#00e5ff');
    return true;
  }

  tick(dt) {
    if (this.snapshot.matchEnded) return;

    this.orbitalAngle += dt * 3.4;

    // Timer de 5 minutos da Sprint
    this.snapshot.sprintTimeRemaining = Math.max(0, this.snapshot.sprintTimeRemaining - dt);
    if (this.snapshot.sprintTimeRemaining <= 0) {
      this.snapshot.matchEnded = true;
      this.snapshot.activeMerge = null;
      for (const p of this.snapshot.players) {
        if (p.codingType === 'terminal') this.releaseTerminal(p);
        p.isCoding = false;
        p.codingType = 'none';
      }
      return;
    }

    if (this.snapshot.bannerTimer > 0) {
      this.snapshot.bannerTimer -= dt;
      if (this.snapshot.bannerTimer <= 0) {
        this.snapshot.bannerMessage = null;
      }
    }

    // Gerenciamento do Evento Global de Merge Conflict
    if (this.snapshot.activeMerge) {
      this.snapshot.activeMerge.timeRemaining -= dt;
      this.tickBotsInMerge(dt);
      if (this.snapshot.activeMerge && this.snapshot.activeMerge.timeRemaining <= 0) {
        this.finishMergeConflictEvent();
      }
    } else {
      this.snapshot.nextMergeTimer -= dt;
      if (this.snapshot.nextMergeTimer <= 0) {
        this.startMergeConflictEvent();
      }
    }

    // Spawns de Terminais JS
    this.terminalSpawnTimer -= dt;
    if (this.terminalSpawnTimer <= 0) {
      this.terminalSpawnTimer = 14;
      if (this.snapshot.terminals.length < 6) {
        this.spawnCodeTerminal();
      }
    }

    // Spawns de Hordas de Bugs e Hackers
    this.tickEnemySpawns(dt);

    // Atualiza Devs (Jogadores + Piloto Automático quando Codando + Bots)
    this.tickPlayers(dt);

    // Atualiza Inimigos e Boss Coletivo
    this.tickEnemies(dt);
    this.tickCollectiveBoss(dt);

    // Atualiza Projéteis
    this.tickProjectiles(dt);

    // Atualiza Cristais de XP
    this.tickGems(dt);

    // Atualiza Efeitos Visuais de Arena
    if (this.snapshot.arenaEffects) {
      for (const ef of this.snapshot.arenaEffects) {
        ef.life -= dt;
      }
      this.snapshot.arenaEffects = this.snapshot.arenaEffects.filter((ef) => ef.life > 0);
    }

    // Textos flutuantes
    for (const ft of this.snapshot.floatingTexts) {
      ft.y -= 28 * dt;
      ft.life -= dt;
    }
    this.snapshot.floatingTexts = this.snapshot.floatingTexts.filter((f) => f.life > 0);
  }

  pickUniqueMergeChallenge() {
    const pool =
      this.roomSettings?.mode === 'avancada'
        ? JS_MERGE_CHALLENGES
        : JS_MERGE_CHALLENGES;
    let unused = pool.filter((c) => !this.usedMergeIds.has(c.id));
    if (unused.length === 0) {
      this.usedMergeIds.clear();
      unused = [...pool];
    }
    const chosen =
      this.mergeChallengeIdx === 0
        ? unused[0]
        : unused[Math.floor(Math.random() * unused.length)];
    this.usedMergeIds.add(chosen.id);
    this.mergeChallengeIdx += 1;
    return chosen;
  }

  startMergeConflictEvent() {
    const challenge = this.pickUniqueMergeChallenge();

    this.snapshot.activeMerge = {
      challengeId: challenge.id,
      timeRemaining: this.roomSettings?.mode === 'casual' ? 26 : 24,
      completedOrder: [],
    };
    this.snapshot.nextMergeTimer = MERGE_INTERVAL;

    for (const p of this.snapshot.players) {
      if (p.codingType === 'terminal') this.releaseTerminal(p);
      p.isCoding = true;
      p.codingType = 'merge';
      p.mergeProgress = 0;
      p.mergeFinishedRank = 0;
    }

    this.spawnOrRefreshCollectiveBoss();
    this.showBanner(`⚠️ MERGE CONFLICT DETECTADO: ${challenge.title}! CORRIJA O BUG E ENFRAQUEÇA O MONÓLITO!`, 5.0);
  }

  spawnOrRefreshCollectiveBoss() {
    const humans = this.snapshot.players.filter((p) => !p.isBot).length;
    const bots = this.snapshot.players.filter((p) => p.isBot).length;
    const avgLvl =
      this.snapshot.players.reduce((acc, p) => acc + p.level, 0) /
      Math.max(1, this.snapshot.players.length);
    // Escala suavemente com número de jogadores humanos (peso 1.0) e bots (peso 0.55)
    const teamScale = Math.max(1, humans * 1.0 + bots * 0.55);
    const maxHp = Math.round((560 + avgLvl * 95) * teamScale);

    this.snapshot.collectiveBoss = {
      id: this.nextEntityId++,
      name: 'MONÓLITO DE CONFLITO GIT',
      x: 0,
      y: -140,
      vx: 0,
      vy: 0,
      hp: maxHp,
      maxHp,
      speed: 74,
      scale: 2.35,
      weakenStacks: 0,
      codingStrikes: 0,
      contributors: {},
      rewardClaimed: false,
      hitFlash: 0,
      walkCycle: 0,
    };
  }

  applyCodingStrikeToCollectiveBoss(p, source = 'merge') {
    const boss = this.snapshot.collectiveBoss;
    if (!boss || boss.hp <= 0) return;

    boss.weakenStacks = Math.min(6, (boss.weakenStacks || 0) + 1);
    boss.codingStrikes = (boss.codingStrikes || 0) + 1;
    const pct = source === 'merge' ? 0.22 : 0.12;
    const strikeDmg = Math.round(boss.maxHp * pct);
    // Acertos de programação enfraquecem até 85% do HP máximo; o golpe final vem das armas na arena
    const minRemainingHp = Math.max(1, Math.ceil(boss.maxHp * 0.15));
    const prevHp = boss.hp;
    boss.hp = Math.max(minRemainingHp, boss.hp - strikeDmg);
    const actualReduced = Math.max(30, prevHp - boss.hp);
    boss.hitFlash = 1.0;

    const contribPoints = source === 'merge' ? 120 : 65;
    p.collectiveContribution = (p.collectiveContribution || 0) + contribPoints;
    boss.contributors[p.id] = (boss.contributors[p.id] || 0) + contribPoints;

    this.addFloatingText(
      boss.x,
      boss.y - 48,
      `⚡ PATCH DE ${p.name.toUpperCase()}! -${actualReduced} HP (VULNERÁVEL x${boss.weakenStacks})`,
      '#00e5ff'
    );
  }

  damageCollectiveBoss(dmg, attacker) {
    const boss = this.snapshot.collectiveBoss;
    if (!boss || boss.hp <= 0) return;

    const vulnMult = 1 + (boss.weakenStacks || 0) * 0.2;
    const finalDmg = dmg * vulnMult;
    boss.hp = Math.max(0, boss.hp - finalDmg);
    boss.hitFlash = 1.0;

    if (attacker) {
      const pts = Math.max(1, Math.round(finalDmg * 0.18));
      attacker.collectiveContribution = (attacker.collectiveContribution || 0) + pts;
      boss.contributors[attacker.id] = (boss.contributors[attacker.id] || 0) + pts;
    }

    if (boss.hp <= 0 && !boss.rewardClaimed) {
      this.defeatCollectiveBoss();
    }
  }

  defeatCollectiveBoss() {
    const boss = this.snapshot.collectiveBoss;
    if (!boss || boss.rewardClaimed) return;
    boss.rewardClaimed = true;
    boss.hp = 0;

    for (const p of this.snapshot.players) {
      const contrib = boss.contributors[p.id] || 0;
      // Recompensa coletiva base para toda a equipe (+150 Commits, +90 XP, +30 HP)
      // + Bônus proporcional de participação (+70 Commits) para quem contribuiu em código ou combate
      const bonusCommits = 150 + (contrib > 0 ? 70 : 0);
      p.score += bonusCommits;
      p.hp = Math.min(p.maxHp, p.hp + 30);
      this.giveXp(p, 90);
      this.addFloatingText(p.x, p.y - 45, `🤝 BOSS COLETIVO DERROTADO! +${bonusCommits} COMMITS`, '#33ff88');
    }

    this.showBanner('🎉 MONÓLITO DE CONFLITO DERROTADO PELA EQUIPE! BÔNUS COLETIVO DISTRIBUÍDO!', 4.5);
    this.snapshot.collectiveBoss = null;
  }

  tickCollectiveBoss(dt) {
    const boss = this.snapshot.collectiveBoss;
    if (!boss || boss.hp <= 0) return;

    if (boss.hitFlash > 0) boss.hitFlash = Math.max(0, boss.hitFlash - dt * 5);

    const alivePlayers = this.snapshot.players.filter((p) => p.respawnTimer <= 0);
    if (alivePlayers.length === 0) return;

    let target = null;
    let minDist = Infinity;
    for (const p of alivePlayers) {
      const d = Math.hypot(p.x - boss.x, p.y - boss.y);
      if (d < minDist) {
        minDist = d;
        target = p;
      }
    }

    if (target) {
      const dx = target.x - boss.x;
      const dy = target.y - boss.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        boss.vx = (dx / dist) * boss.speed;
        boss.vy = (dy / dist) * boss.speed;
        boss.x += boss.vx * dt;
        boss.y += boss.vy * dt;
        boss.walkCycle += dt * 8;
      }

      for (const p of alivePlayers) {
        const pDist = Math.hypot(p.x - boss.x, p.y - boss.y);
        const hitRadius = 24 + 16 * boss.scale;
        if (pDist < hitRadius) {
          if (p.isCoding) {
            if (pDist > 0.1) {
              boss.x -= ((p.x - boss.x) / pDist) * 90 * dt;
              boss.y -= ((p.y - boss.y) / pDist) * 90 * dt;
            }
          } else {
            p.hp -= 24 * dt;
            if (p.hp <= 0) {
              this.handlePlayerDown(p);
            }
          }
        }
      }
    }
  }

  finishMergeConflictEvent() {
    const merge = this.snapshot.activeMerge;
    if (!merge) return;

    // O evento recompensa acertos sem penalizar quem está aprendendo.
    for (const p of this.snapshot.players) {
      p.isCoding = false;
      p.codingType = 'none';
    }

    this.snapshot.activeMerge = null;
  }

  tickBotsInMerge(dt) {
    const merge = this.snapshot.activeMerge;
    if (!merge) return;

    const diff = this.roomSettings?.botDifficulty || 'normal';
    const speedBase = diff === 'facil' ? 5.2 : diff === 'dificil' ? 11.2 : 7.8;

    for (const p of this.snapshot.players) {
      if (!p.isBot || merge.completedOrder.includes(p.id)) continue;
      const speed = speedBase + (p.level % 4) * 1.4;
      p.mergeProgress = Math.min(100, p.mergeProgress + speed * dt);
      if (p.mergeProgress >= 100) {
        // Chance de tropeço/erro do bot antes de acertar (Fácil: 28%, Normal: 12%, Difícil: 4%)
        const errChance = diff === 'facil' ? 0.28 : diff === 'dificil' ? 0.04 : 0.12;
        if (!p._mergeStumbled && Math.random() < errChance) {
          p._mergeStumbled = true;
          p.challengesAttempted = (p.challengesAttempted || 0) + 1;
          p.mergeProgress = 68;
          continue;
        }
        p._mergeStumbled = false;
        this.completeMergeChallenge(p.id);
      }
    }
  }

  tickPlayers(dt) {
    for (const p of this.snapshot.players) {
      p.terminalCooldownRemaining = Math.max(0, p.terminalCooldownRemaining - dt);
      if (p.activeBuffs) {
        for (const k of Object.keys(p.activeBuffs)) {
          p.activeBuffs[k] = Math.max(0, (p.activeBuffs[k] || 0) - dt);
        }
      }
      if (p.codingType === 'terminal') {
        p.terminalTimeRemaining = Math.max(0, p.terminalTimeRemaining - dt);
        if (p.terminalTimeRemaining <= 0) {
          this.releaseTerminal(p);
          this.addFloatingText(p.x, p.y - 35, 'TEMPO ESGOTADO! VOLTE À ARENA', '#ffb020');
        } else if (p.isBot) {
          const remaining = (this.botTerminalTimers.get(p.id) || 0) - dt;
          this.botTerminalTimers.set(p.id, remaining);
          if (remaining <= 0) this.completeTerminal(p.id, p.terminalId);
        }
      }
      if (p.respawnTimer > 0) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.respawnTimer = 0;
          p.hp = p.maxHp;
          p.x = (Math.random() - 0.5) * 400;
          p.y = (Math.random() - 0.5) * 400;
          this.addFloatingText(p.x, p.y - 30, '🔄 REDEPLOY CONCLUÍDO!', '#00e5ff');
        }
        continue;
      }

      // Se for Bot e tiver upgrade pendente, escolhe automaticamente
      if (p.isBot && p.pendingUpgrades > 0) {
        const pick = UPGRADE_OPTIONS[Math.floor(Math.random() * UPGRADE_OPTIONS.length)];
        this.applyUpgrade(p.id, pick.id);
      }

      let moveX = 0;
      let moveY = 0;
      let speedMult = 1.0;

      if (p.isCoding) {
        // ESCUDO DE FOCO ATIVO: Boneco fica parado no terminal, invulnerável (zero dano) e focado no código!
        moveX = 0;
        moveY = 0;
        speedMult = 0;
      } else if (p.isBot) {
        const botVec = this.computeBotVector(p, dt);
        moveX = botVec.x;
        moveY = botVec.y;
      } else {
        const inp = this.inputs.get(p.id) || { dx: 0, dy: 0 };
        moveX = inp.dx;
        moveY = inp.dy;
      }

      const len = Math.hypot(moveX, moveY);
      if (len > 0.01) {
        moveX /= len;
        moveY /= len;
        p.vx = moveX * p.moveSpeed * speedMult;
        p.vy = moveY * p.moveSpeed * speedMult;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.walkCycle += dt * 13;
        if (p.vx < -5) p.facing = -1;
        else if (p.vx > 5) p.facing = 1;
      } else {
        p.vx = 0;
        p.vy = 0;
        p.walkCycle = 0;
      }

      // Limites da Arena e colisão leve com Server Racks
      p.x = Math.max(-ARENA_HALF + 35, Math.min(ARENA_HALF - 35, p.x));
      p.y = Math.max(-ARENA_HALF + 35, Math.min(ARENA_HALF - 35, p.y));

      for (const rack of SERVER_RACKS) {
        const dx = p.x - rack.x;
        const dy = p.y - rack.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 46;
        if (dist < minDist && dist > 0.001) {
          p.x = rack.x + (dx / dist) * minDist;
          p.y = rack.y + (dy / dist) * minDist;
        }
      }

      // Armas automáticas continuam atirando mesmo durante o Piloto Automático!
      this.tickPlayerWeapons(p, dt);
    }
  }

  computeAutoPilotVector(p) {
    let repelX = 0;
    let repelY = 0;

    for (const e of this.snapshot.enemies) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d < 240 && d > 1) {
        const weight = (240 - d) / 240;
        repelX += (dx / d) * weight * 2.2;
        repelY += (dy / d) * weight * 2.2;
      }
    }

    // Atrai levemente para o centro se estiver perto da parede
    repelX += (-p.x / ARENA_HALF) * 0.65;
    repelY += (-p.y / ARENA_HALF) * 0.65;

    if (Math.hypot(repelX, repelY) < 0.15) {
      // Movimento circular suave de patrulha enquanto coda
      const t = performance.now() * 0.0015;
      return { x: Math.cos(t + p.id.length), y: Math.sin(t + p.id.length) };
    }
    return { x: repelX, y: repelY };
  }

  computeBotVector(p, dt) {
    const baseVec = this.computeAutoPilotVector(p);

    // Procura terminal livre ou gema de XP próxima
    let targetX = 0;
    let targetY = 0;
    let foundTarget = false;

    for (const term of this.snapshot.terminals) {
      if (!term.active || (term.lockedByPlayerId && term.lockedByPlayerId !== p.id)) continue;
      const d = Math.hypot(term.x - p.x, term.y - p.y);
      if (d < 420) {
        targetX = (term.x - p.x) / Math.max(1, d);
        targetY = (term.y - p.y) / Math.max(1, d);
        foundTarget = true;
        if (d < 46) this.setPlayerCoding(p.id, true, term.id);
        break;
      }
    }

    if (!foundTarget) {
      for (const g of this.snapshot.gems) {
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < 300) {
          targetX = (g.x - p.x) / Math.max(1, d);
          targetY = (g.y - p.y) / Math.max(1, d);
          break;
        }
      }
    }

    return {
      x: baseVec.x * 1.1 + targetX * 0.9,
      y: baseVec.y * 1.1 + targetY * 0.9,
    };
  }

  tickPlayerWeapons(p, dt) {
    const overclockBonus = (p.activeBuffs?.async_overclock || 0) > 0 ? 1.45 : 1.0;
    const firewallBuffDmg = (p.activeBuffs?.logic_firewall || 0) > 0 ? 1.25 : 1.0;
    const effFireRate = p.fireRateMult * overclockBonus;
    const effDamageMult = p.damageMult * firewallBuffDmg;
    const cBoss = this.snapshot.collectiveBoss && this.snapshot.collectiveBoss.hp > 0 ? this.snapshot.collectiveBoss : null;

    // 1. Syntax Blaster (projéteis automáticos no inimigo mais próximo)
    const fireCd = Math.max(0.15, 0.58 / effFireRate);
    const curTimer = (this.fireTimers.get(p.id) || 0) - dt;
    if (curTimer <= 0) {
      const nearest = this.findNearestEnemy(p.x, p.y, 470);
      if (nearest) {
        this.fireTimers.set(p.id, fireCd);
        const baseAngle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
        const count = Math.min(5, p.blasterLevel);
        const spread = 0.14;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spread;
          const ang = baseAngle + offset;
          this.snapshot.projectiles.push({
            id: this.nextEntityId++,
            ownerId: p.id,
            x: p.x + Math.cos(ang) * 18,
            y: p.y + Math.sin(ang) * 18,
            vx: Math.cos(ang) * 560,
            vy: Math.sin(ang) * 560,
            damage: (24 + p.blasterLevel * 7) * effDamageMult,
            color: p.color,
            radius: 5,
            life: 1.15,
          });
        }
      } else {
        this.fireTimers.set(p.id, 0.15);
      }
    } else {
      this.fireTimers.set(p.id, curTimer);
    }

    // 2. Git Orbitals (dano por contato ao girar ao redor do Dev)
    if (p.orbitalCount > 0) {
      const orbRadius = 74;
      for (let i = 0; i < p.orbitalCount; i++) {
        const ang = this.orbitalAngle + (i / p.orbitalCount) * Math.PI * 2;
        const ox = p.x + Math.cos(ang) * orbRadius;
        const oy = p.y + Math.sin(ang) * orbRadius;
        for (const e of this.snapshot.enemies) {
          if (Math.hypot(e.x - ox, e.y - oy) < 22 * e.scale) {
            this.damageEnemy(e, (45 + p.orbitalCount * 10) * effDamageMult * dt, p);
          }
        }
        if (cBoss && Math.hypot(cBoss.x - ox, cBoss.y - oy) < 24 * cBoss.scale) {
          this.damageCollectiveBoss((45 + p.orbitalCount * 10) * effDamageMult * dt, p);
        }
      }
    }

    // 3. Firewall Aura (queima inimigos próximos)
    if (p.firewallLevel > 0) {
      const auraRadius = 85 + p.firewallLevel * 18;
      for (const e of this.snapshot.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) <= auraRadius) {
          this.damageEnemy(e, (26 + p.firewallLevel * 12) * effDamageMult * dt, p);
        }
      }
      if (cBoss && Math.hypot(cBoss.x - p.x, cBoss.y - p.y) <= auraRadius + 15) {
        this.damageCollectiveBoss((26 + p.firewallLevel * 12) * effDamageMult * dt, p);
      }
    }

    // 4. Regex Lightning (raio instantâneo a cada 1.6s)
    if (p.lightningLevel > 0) {
      const lTimer = (this.lightningTimers.get(p.id) || 0) - dt;
      if (lTimer <= 0) {
        this.lightningTimers.set(p.id, 1.55);
        const targets = this.snapshot.enemies
          .filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < 340)
          .slice(0, 1 + p.lightningLevel);
        for (const t of targets) {
          this.damageEnemy(t, (42 + p.lightningLevel * 18) * effDamageMult, p);
          this.addFloatingText(t.x, t.y - 20, '⚡ REGEX!', '#ffb020');
        }
        if (cBoss && Math.hypot(cBoss.x - p.x, cBoss.y - p.y) < 360) {
          this.damageCollectiveBoss((42 + p.lightningLevel * 18) * effDamageMult, p);
          this.addFloatingText(cBoss.x, cBoss.y - 30, '⚡ REGEX!', '#ffb020');
        }
      } else {
        this.lightningTimers.set(p.id, lTimer);
      }
    }
  }

  tickEnemySpawns(dt) {
    const elapsed = SPRINT_DURATION - this.snapshot.sprintTimeRemaining;
    const avgLevel =
      this.snapshot.players.reduce((acc, p) => acc + p.level, 0) / Math.max(1, this.snapshot.players.length);
    const scalingLvl = Math.max(1, Math.floor(avgLevel + elapsed / 40));

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.45, 1.35 - elapsed * 0.0025);
      const maxEnemies = 38 + this.snapshot.players.length * 10;
      if (this.snapshot.enemies.length < maxEnemies) {
        const alivePlayers = this.snapshot.players.filter((p) => p.respawnTimer <= 0);
        if (alivePlayers.length > 0) {
          const anchor = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          const ang = Math.random() * Math.PI * 2;
          const dist = 460 + Math.random() * 180;
          const sx = Math.max(-ARENA_HALF + 40, Math.min(ARENA_HALF - 40, anchor.x + Math.cos(ang) * dist));
          const sy = Math.max(-ARENA_HALF + 40, Math.min(ARENA_HALF - 40, anchor.y + Math.sin(ang) * dist));

          const roll = Math.random();
          const tier = elapsed > 180 && roll > 0.78 ? 3 : elapsed > 60 && roll > 0.55 ? 2 : 1;
          const stats = getBugStats(tier, scalingLvl);

          this.snapshot.enemies.push({
            id: this.nextEntityId++,
            kind: 'bug',
            tier,
            x: sx,
            y: sy,
            vx: 0,
            vy: 0,
            hp: stats.hp,
            maxHp: stats.hp,
            speed: stats.speed * 0.72,
            scale: stats.scale,
            xpReward: stats.xp,
            walkCycle: Math.random() * 6,
            hitFlash: 0,
          });
        }
      }
    }

    // Onda de Hackers periódica
    this.hackerTimer -= dt;
    if (this.hackerTimer <= 0) {
      this.hackerTimer = 24;
      const alive = this.snapshot.players.filter((p) => p.respawnTimer <= 0);
      if (alive.length > 0) {
        const anchor = alive[Math.floor(Math.random() * alive.length)];
        const hStats = getHackerStats(scalingLvl);
        const ang = Math.random() * Math.PI * 2;
        this.snapshot.enemies.push({
          id: this.nextEntityId++,
          kind: 'hacker',
          tier: 2,
          x: anchor.x + Math.cos(ang) * 480,
          y: anchor.y + Math.sin(ang) * 480,
          vx: 0,
          vy: 0,
          hp: hStats.hp,
          maxHp: hStats.hp,
          speed: hStats.speed * 0.76,
          scale: hStats.scale,
          xpReward: hStats.xp,
          walkCycle: 0,
          hitFlash: 0,
        });
      }
    }
  }

  spawnBossNearPlayer(target, bossType) {
    const bStats = getBossStats(bossType, target.level, 1);
    const ang = Math.random() * Math.PI * 2;
    this.snapshot.enemies.push({
      id: this.nextEntityId++,
      kind: 'boss',
      tier: 4,
      bossType,
      targetPlayerId: target.id,
      x: Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, target.x + Math.cos(ang) * 320)),
      y: Math.max(-ARENA_HALF + 60, Math.min(ARENA_HALF - 60, target.y + Math.sin(ang) * 320)),
      vx: 0,
      vy: 0,
      hp: bStats.hp,
      maxHp: bStats.hp,
      speed: bStats.speed * 0.85,
      scale: bStats.scale,
      xpReward: bStats.xp,
      walkCycle: 0,
      hitFlash: 0,
    });
  }

  pickUniqueTerminalSnippet() {
    const activeIds = new Set(this.snapshot.terminals.map((t) => t.snippetId));
    const preferredPool =
      this.roomSettings?.mode === 'casual'
        ? JS_SPEED_SNIPPETS.filter((s) => s.difficulty !== 'avancado')
        : JS_SPEED_SNIPPETS;

    let candidates = preferredPool.filter((s) => !this.usedTerminalIds.has(s.id) && !activeIds.has(s.id));
    if (candidates.length === 0) {
      candidates = JS_SPEED_SNIPPETS.filter((s) => !this.usedTerminalIds.has(s.id) && !activeIds.has(s.id));
    }
    if (candidates.length === 0) {
      this.usedTerminalIds.clear();
      candidates = JS_SPEED_SNIPPETS.filter((s) => !activeIds.has(s.id));
      if (candidates.length === 0) candidates = JS_SPEED_SNIPPETS;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.usedTerminalIds.add(chosen.id);
    return chosen;
  }

  spawnCodeTerminal() {
    const snippet = this.pickUniqueTerminalSnippet();
    const x = (Math.random() - 0.5) * (ARENA_HALF * 1.45);
    const y = (Math.random() - 0.5) * (ARENA_HALF * 1.45);
    this.snapshot.terminals.push({
      id: this.nextEntityId++,
      x,
      y,
      snippetId: snippet.id,
      mode: snippet.mode || 'typing',
      topic: snippet.topic || 'arrays',
      difficulty: snippet.difficulty || 'iniciante',
      effectType: snippet.effectType || 'filter_purge',
      active: true,
      lockedByPlayerId: null,
    });
  }

  tickEnemies(dt) {
    const alivePlayers = this.snapshot.players.filter((p) => p.respawnTimer <= 0);
    if (alivePlayers.length === 0) return;

    for (const e of this.snapshot.enemies) {
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt * 5);

      // Escolhe alvo (se tiver targetPlayerId vivo, foca nele; senão o dev mais próximo)
      let target = alivePlayers.find((p) => p.id === e.targetPlayerId);
      if (!target) {
        let minDist = Infinity;
        for (const p of alivePlayers) {
          const d = Math.hypot(p.x - e.x, p.y - e.y);
          if (d < minDist) {
            minDist = d;
            target = p;
          }
        }
      }

      if (target) {
        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          e.vx = (dx / dist) * e.speed;
          e.vy = (dy / dist) * e.speed;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          e.walkCycle += dt * 12;
        }

        // Colisão com jogadores (apenas quem NÃO está com Escudo de Foco / isCoding!)
        for (const p of alivePlayers) {
          const pDist = Math.hypot(p.x - e.x, p.y - e.y);
          const hitRadius = 18 + 14 * e.scale;
          if (pDist < hitRadius) {
            if (p.isCoding) {
              // Escudo de Foco repele o monstro sem causar nenhum dano ao jogador!
              if (pDist > 0.1) {
                e.x -= ((p.x - e.x) / pDist) * 85 * dt;
                e.y -= ((p.y - e.y) / pDist) * 85 * dt;
              }
            } else {
              const dps = e.kind === 'boss' ? 34 : e.kind === 'hacker' ? 22 : 14 + e.tier * 4;
              p.hp -= dps * dt;
              if (p.hp <= 0) {
                this.handlePlayerDown(p);
              }
            }
          }
        }
      }
    }
  }

  handlePlayerDown(p) {
    if (p.codingType === 'terminal') this.releaseTerminal(p);
    p.hp = 0;
    p.respawnTimer = 4.5;
    p.isCoding = false;
    p.codingType = 'none';
    const penalty = Math.floor(p.score * 0.12);
    p.score = Math.max(0, p.score - penalty);
    this.addFloatingText(p.x, p.y - 25, `💥 CRASH! -${penalty} COMMITS (4.5s Respawn)`, '#ff3344');
  }

  tickProjectiles(dt) {
    const cBoss =
      this.snapshot.collectiveBoss && this.snapshot.collectiveBoss.hp > 0
        ? this.snapshot.collectiveBoss
        : null;

    for (const proj of this.snapshot.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (proj.life <= 0) continue;

      if (cBoss) {
        const bDist = Math.hypot(cBoss.x - proj.x, cBoss.y - proj.y);
        if (bDist < 22 * cBoss.scale + proj.radius) {
          const owner = this.snapshot.players.find((p) => p.id === proj.ownerId);
          this.damageCollectiveBoss(proj.damage, owner);
          proj.life = 0;
          continue;
        }
      }

      for (const e of this.snapshot.enemies) {
        if (e.hp <= 0) continue;
        const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
        if (dist < 18 * e.scale + proj.radius) {
          const owner = this.snapshot.players.find((p) => p.id === proj.ownerId);
          this.damageEnemy(e, proj.damage, owner);
          proj.life = 0;
          break;
        }
      }
    }
    this.snapshot.projectiles = this.snapshot.projectiles.filter((pr) => pr.life > 0);
  }

  damageEnemy(e, dmg, attacker) {
    if (e.hp <= 0) return;
    e.hp -= dmg;
    e.hitFlash = 1.0;

    if (e.hp <= 0) {
      if (attacker) {
        attacker.kills += 1;
        const scoreGain = e.kind === 'boss' ? 220 : e.kind === 'hacker' ? 35 : 10 * e.tier;
        attacker.score += scoreGain;
      }

      // Dropa gema de XP no chão da Arena compartilhada!
      this.snapshot.gems.push({
        id: this.nextEntityId++,
        x: e.x,
        y: e.y,
        value: e.xpReward,
        color: e.kind === 'boss' ? '#ff2d95' : e.kind === 'hacker' ? '#ffb020' : '#00e5ff',
      });
    }
    this.snapshot.enemies = this.snapshot.enemies.filter((en) => en.hp > 0);
  }

  tickGems(dt) {
    for (const g of this.snapshot.gems) {
      let collector = null;
      let minDist = Infinity;

      for (const p of this.snapshot.players) {
        if (p.respawnTimer > 0) continue;
        const gcBonus = (p.activeBuffs?.memory_gc || 0) > 0 ? 120 : 0;
        const effMagnet = p.magnetRadius + gcBonus;
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < effMagnet && d < minDist) {
          minDist = d;
          collector = p;
        }
      }

      if (collector) {
        const dx = collector.x - g.x;
        const dy = collector.y - g.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        g.x += (dx / d) * 440 * dt;
        g.y += (dy / d) * 440 * dt;

        if (d < 24) {
          this.giveXp(collector, g.value);
          collector.score += Math.round(g.value * 0.35);
          g.value = 0;
        }
      }
    }
    this.snapshot.gems = this.snapshot.gems.filter((g) => g.value > 0);
  }

  giveXp(p, amount) {
    p.xp += amount;
    let threshold = getPowerupThreshold(p.level - 1);
    while (p.xp >= threshold) {
      p.level += 1;
      p.pendingUpgrades += 1;
      p.maxHp += 12;
      p.hp = Math.min(p.maxHp, p.hp + 25);
      this.addFloatingText(p.x, p.y - 35, `🎉 LEVEL ${p.level}!`, '#00e5ff');
      threshold = getPowerupThreshold(p.level - 1);
    }
  }

  findNearestEnemy(x, y, maxRange) {
    let best = null;
    let minDist = maxRange;
    for (const e of this.snapshot.enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) {
        minDist = d;
        best = e;
      }
    }
    const cBoss = this.snapshot.collectiveBoss;
    if (cBoss && cBoss.hp > 0) {
      const bd = Math.hypot(cBoss.x - x, cBoss.y - y);
      if (bd < minDist) {
        minDist = bd;
        best = cBoss;
      }
    }
    return best;
  }

  addFloatingText(x, y, text, color) {
    this.snapshot.floatingTexts.push({
      id: this.nextEntityId++,
      x,
      y,
      text,
      color,
      life: 1.35,
    });
  }

  showBanner(msg, duration = 4.0) {
    this.snapshot.bannerMessage = msg;
    this.snapshot.bannerTimer = duration;
  }
}
