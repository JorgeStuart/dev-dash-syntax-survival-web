import { JS_MERGE_CHALLENGES, JS_SPEED_SNIPPETS } from '../coding/js_challenges.js';
import {
  getBossStats,
  getBugStats,
  getHackerStats,
  getPowerupThreshold,
} from './types.js';

export const ARENA_HALF = 1100; // Arena 2200x2200 (-1100 a +1100)
export const SPRINT_DURATION = 300; // 5 minutos (300s)
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
    this.snapshot = this.createEmptySnapshot();
  }

  createEmptySnapshot() {
    return {
      sprintTimeRemaining: SPRINT_DURATION,
      nextMergeTimer: MERGE_INTERVAL,
      matchEnded: false,
      players: [],
      enemies: [],
      projectiles: [],
      gems: [],
      terminals: [],
      floatingTexts: [],
      activeMerge: null,
      bannerMessage: null,
      bannerTimer: 0,
    };
  }

  startNewMatch(lobbyPlayers, fillBots) {
    this.snapshot = this.createEmptySnapshot();
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
      isCoding: false,
      codingType: 'none',
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

  setPlayerCoding(playerId, isCoding, terminalId = null) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || p.respawnTimer > 0) return;

    if (this.snapshot.activeMerge) {
      p.isCoding = true;
      p.codingType = 'merge';
      return;
    }

    p.isCoding = isCoding;
    p.codingType = isCoding ? 'terminal' : 'none';

    if (isCoding && terminalId !== null) {
      const term = this.snapshot.terminals.find((t) => t.id === terminalId && t.active);
      if (term && (!term.lockedByPlayerId || term.lockedByPlayerId === playerId)) {
        term.lockedByPlayerId = playerId;
      }
    } else if (!isCoding) {
      for (const t of this.snapshot.terminals) {
        if (t.lockedByPlayerId === playerId) {
          t.lockedByPlayerId = null;
        }
      }
    }
  }

  completeTerminal(playerId, terminalId) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p) return;

    const term = this.snapshot.terminals.find((t) => t.id === terminalId && t.active);
    const snippet = JS_SPEED_SNIPPETS.find((s) => s.id === term?.snippetId) ?? JS_SPEED_SNIPPETS[0];

    if (term) {
      term.active = false;
      this.snapshot.terminals = this.snapshot.terminals.filter((t) => t.id !== terminalId);
    }

    p.isCoding = false;
    p.codingType = 'none';
    p.deploysCompleted += 1;

    const secBonus = p.devClass === 'secops' ? 1.25 : 1.0;
    const commitsGain = Math.round(snippet.commitsReward * secBonus);
    const xpGain = Math.round(snippet.xpReward * secBonus);

    p.score += commitsGain;
    p.hp = Math.min(p.maxHp, p.hp + 25);
    this.giveXp(p, xpGain);

    this.addFloatingText(p.x, p.y - 35, `💻 DEPLOY OK! +${commitsGain} COMMITS`, '#33ff88');
  }

  updateMergeProgress(playerId, progress) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || !this.snapshot.activeMerge) return;
    p.mergeProgress = Math.max(p.mergeProgress, Math.min(99, progress));
  }

  completeMergeChallenge(playerId) {
    const merge = this.snapshot.activeMerge;
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!merge || !p || merge.completedOrder.includes(playerId)) return;

    merge.completedOrder.push(playerId);
    const rank = merge.completedOrder.length;
    p.mergeFinishedRank = rank;
    p.mergeProgress = 100;
    p.deploysCompleted += 1;
    p.isCoding = false;
    p.codingType = 'none';

    if (rank === 1) {
      // 1º Lugar: Grande vencedor do Merge Conflict!
      p.score += 450;
      this.giveXp(p, 240);
      p.blasterLevel += 1;
      p.orbitalCount += 1;
      p.damageMult += 0.25;
      p.hp = p.maxHp;
      this.addFloatingText(p.x, p.y - 45, `🏆 1º PUSH! +450 COMMITS & EVOLUÇÃO!`, '#00e5ff');
      this.showBanner(`🏆 ${p.name} FEZ O 1º GIT PUSH NO MERGE CONFLICT! (+450 COMMITS)`, 4.0);
    } else {
      const commits = Math.max(120, 320 - (rank - 1) * 70);
      p.score += commits;
      this.giveXp(p, 110);
      this.addFloatingText(p.x, p.y - 40, `✅ MERGE #${rank}! +${commits} COMMITS`, '#33ff88');
    }

    // Se todos os jogadores já terminaram, encerra o evento imediatamente
    if (merge.completedOrder.length >= this.snapshot.players.length) {
      this.finishMergeConflictEvent();
    }
  }

  applyUpgrade(playerId, upgradeId) {
    const p = this.snapshot.players.find((pl) => pl.id === playerId);
    if (!p || p.pendingUpgrades <= 0) return;

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
  }

  tick(dt) {
    if (this.snapshot.matchEnded) return;

    this.orbitalAngle += dt * 3.4;

    // Timer de 5 minutos da Sprint
    this.snapshot.sprintTimeRemaining = Math.max(0, this.snapshot.sprintTimeRemaining - dt);
    if (this.snapshot.sprintTimeRemaining <= 0) {
      this.snapshot.matchEnded = true;
      this.snapshot.activeMerge = null;
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
      if (this.snapshot.activeMerge.timeRemaining <= 0) {
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

    // Atualiza Inimigos
    this.tickEnemies(dt);

    // Atualiza Projéteis
    this.tickProjectiles(dt);

    // Atualiza Cristais de XP
    this.tickGems(dt);

    // Textos flutuantes
    for (const ft of this.snapshot.floatingTexts) {
      ft.y -= 28 * dt;
      ft.life -= dt;
    }
    this.snapshot.floatingTexts = this.snapshot.floatingTexts.filter((f) => f.life > 0);
  }

  startMergeConflictEvent() {
    const challenge = JS_MERGE_CHALLENGES[this.mergeChallengeIdx % JS_MERGE_CHALLENGES.length];
    this.mergeChallengeIdx += 1;

    this.snapshot.activeMerge = {
      challengeId: challenge.id,
      timeRemaining: 24,
      completedOrder: [],
    };
    this.snapshot.nextMergeTimer = MERGE_INTERVAL;

    for (const p of this.snapshot.players) {
      p.isCoding = true;
      p.codingType = 'merge';
      p.mergeProgress = 0;
      p.mergeFinishedRank = 0;
    }

    this.showBanner(`⚠️ MERGE CONFLICT DETECTADO: ${challenge.title}! CORRIJA O BUG JS!`, 5.0);
  }

  finishMergeConflictEvent() {
    const merge = this.snapshot.activeMerge;
    if (!merge) return;

    // Quem não terminou (ou ficou por último com mais de 1 jogador) recebe um Boss/Elite na cabeça!
    const bossTypes = ['kernel_panic', 'stack_overflow', 'memory_leak', 'blue_screen'];
    const lastCompletedId = merge.completedOrder[merge.completedOrder.length - 1];

    for (const p of this.snapshot.players) {
      const didNotFinish = !merge.completedOrder.includes(p.id);
      const isLastPlace =
        this.snapshot.players.length > 1 &&
        p.id === lastCompletedId &&
        merge.completedOrder.length === this.snapshot.players.length;

      if (didNotFinish || isLastPlace) {
        const bType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        this.spawnBossNearPlayer(p, bType);
        this.addFloatingText(p.x, p.y - 40, `💀 MERGE REJECTED! BOSS ${bType.toUpperCase()}!`, '#ff3344');
      }

      p.isCoding = false;
      p.codingType = 'none';
    }

    this.snapshot.activeMerge = null;
  }

  tickBotsInMerge(dt) {
    const merge = this.snapshot.activeMerge;
    if (!merge) return;

    for (const p of this.snapshot.players) {
      if (!p.isBot || merge.completedOrder.includes(p.id)) continue;
      // Bots avançam entre 7% e 13% por segundo (levam ~9 a 14s para resolver)
      const speed = 7.5 + (p.level % 4) * 1.5;
      p.mergeProgress = Math.min(100, p.mergeProgress + speed * dt);
      if (p.mergeProgress >= 100) {
        this.completeMergeChallenge(p.id);
      }
    }
  }

  tickPlayers(dt) {
    for (const p of this.snapshot.players) {
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
        // ESCUDO DE FOCO ATIVO: Piloto Automático inteligente + Invulnerável (Zero Dano)!
        const autoVec = this.computeAutoPilotVector(p);
        moveX = autoVec.x;
        moveY = autoVec.y;
        speedMult = 0.78;
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
    // Bot simula hackear terminal se estiver perto de um
    const activeTimer = this.botTerminalTimers.get(p.id) || 0;
    if (activeTimer > 0) {
      const nextT = activeTimer - dt;
      if (nextT <= 0) {
        this.botTerminalTimers.delete(p.id);
        const lockedTerm = this.snapshot.terminals.find((t) => t.lockedByPlayerId === p.id);
        if (lockedTerm) {
          this.completeTerminal(p.id, lockedTerm.id);
        } else {
          p.isCoding = false;
          p.codingType = 'none';
        }
      } else {
        this.botTerminalTimers.set(p.id, nextT);
      }
      return this.computeAutoPilotVector(p);
    }

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
        if (d < 46) {
          this.setPlayerCoding(p.id, true, term.id);
          this.botTerminalTimers.set(p.id, 4.8);
        }
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
    // 1. Syntax Blaster (projéteis automáticos no inimigo mais próximo)
    const fireCd = Math.max(0.2, 0.58 / p.fireRateMult);
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
            damage: (24 + p.blasterLevel * 7) * p.damageMult,
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
            this.damageEnemy(e, (45 + p.orbitalCount * 10) * p.damageMult * dt, p);
          }
        }
      }
    }

    // 3. Firewall Aura (queima inimigos próximos)
    if (p.firewallLevel > 0) {
      const auraRadius = 85 + p.firewallLevel * 18;
      for (const e of this.snapshot.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) <= auraRadius) {
          this.damageEnemy(e, (26 + p.firewallLevel * 12) * p.damageMult * dt, p);
        }
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
          this.damageEnemy(t, (42 + p.lightningLevel * 18) * p.damageMult, p);
          this.addFloatingText(t.x, t.y - 20, '⚡ REGEX!', '#ffb020');
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

  spawnCodeTerminal() {
    const snippet = JS_SPEED_SNIPPETS[Math.floor(Math.random() * JS_SPEED_SNIPPETS.length)];
    const x = (Math.random() - 0.5) * (ARENA_HALF * 1.45);
    const y = (Math.random() - 0.5) * (ARENA_HALF * 1.45);
    this.snapshot.terminals.push({
      id: this.nextEntityId++,
      x,
      y,
      snippetId: snippet.id,
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
    p.hp = 0;
    p.respawnTimer = 4.5;
    p.isCoding = false;
    p.codingType = 'none';
    const penalty = Math.floor(p.score * 0.12);
    p.score = Math.max(0, p.score - penalty);
    this.addFloatingText(p.x, p.y - 25, `💥 CRASH! -${penalty} COMMITS (4.5s Respawn)`, '#ff3344');
  }

  tickProjectiles(dt) {
    for (const proj of this.snapshot.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (proj.life <= 0) continue;

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
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < p.magnetRadius && d < minDist) {
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
