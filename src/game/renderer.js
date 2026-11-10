import { JS_SPEED_SNIPPETS } from '../coding/js_challenges.js';
import { ARENA_HALF, SERVER_RACKS, TERMINAL_DURATION, TERMINAL_RANGE } from './engine.js';

const KEY_GLOW_COLORS = ['#ff2626', '#26ff59', '#2659ff'];

const DEV_SKINS = {
  fullstack: {
    hairColor: '#331a0d',
    hairHighlight: '#472917',
    shirtColor: '#171a21',
    pantsColor: '#2e4270',
    pantsHighlight: '#40598c',
    skinColor: '#f2c7a6',
    hasHoodie: false,
    hasHeadset: false,
    hasBeard: false,
  },
  frontend: {
    hairColor: '#1e1b4b',
    hairHighlight: '#ec4899',
    shirtColor: '#1e162b',
    pantsColor: '#273659',
    pantsHighlight: '#3b4f80',
    skinColor: '#f5d0b5',
    hasHoodie: false,
    hasHeadset: true,
    hasBeard: false,
  },
  backend: {
    hairColor: '#261710',
    hairHighlight: '#3d251a',
    shirtColor: '#111c18',
    pantsColor: '#24385c',
    pantsHighlight: '#344e7d',
    skinColor: '#eab68f',
    hasHoodie: false,
    hasHeadset: true,
    hasBeard: true,
  },
  secops: {
    hairColor: '#14141f',
    hairHighlight: '#29293d',
    shirtColor: '#18181b',
    pantsColor: '#1e293b',
    pantsHighlight: '#334155',
    skinColor: '#f0c4a2',
    hasHoodie: true,
    hasHeadset: false,
    hasBeard: false,
  },
};

/**
 * Desenha o bonequinho original do DevDash ("Desenvolvedor de Óculos + Crachá + Camiseta </> + Teclado Mecânico RGB")
 * Portado diretamente de TerminalVisual.gd com variações visuais por stack e cor neon.
 */
export function drawDeveloperCharacter(ctx, { devClass = 'fullstack', color = '#00e5ff', walkCycle = 0, facing = 1, isMe = false }) {
  const skin = DEV_SKINS[devClass] || DEV_SKINS.fullstack;
  const isWalking = walkCycle > 0.01;
  const bounce = isWalking ? Math.abs(Math.sin(walkCycle * 2.0)) * 2.2 : 0;
  const tilt = isWalking ? Math.sin(walkCycle) * 0.05 : 0;
  const legSwing = isWalking ? Math.sin(walkCycle * 2.0) * 2.2 : 0;

  ctx.save();

  // Sombra de contato suave no chão (não sobe junto com o pulo)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 23, 15, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 23, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Aplica pulinho de caminhada, leve inclinação e direção (esquerda/direita)
  ctx.translate(0, -bounce);
  ctx.rotate(tilt);
  ctx.scale(facing < 0 ? -1 : 1, 1);

  // Contorno neon sutil (aura de escudo/terminal cibernético do TerminalVisual.gd)
  ctx.strokeStyle = isMe ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 230, 255, 0.14)';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-12, -22, 24, 45);

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-11, -21, 22, 43);
  ctx.globalAlpha = 1.0;

  // Calça Jeans com animação de passos
  ctx.fillStyle = skin.pantsColor;
  ctx.fillRect(-8, 8 + legSwing * 0.5, 7, 14);
  ctx.fillRect(1, 8 - legSwing * 0.5, 7, 14);

  // Highlight da calça jeans
  ctx.fillStyle = skin.pantsHighlight;
  ctx.fillRect(-8, 8 + legSwing * 0.5, 2, 14);
  ctx.fillRect(1, 8 - legSwing * 0.5, 2, 14);

  // Tênis / Sapatos de dev
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-9, 20 + legSwing * 0.5, 8, 3);
  ctx.fillRect(1, 20 - legSwing * 0.5, 8, 3);
  ctx.fillStyle = color;
  ctx.fillRect(-9, 22 + legSwing * 0.5, 8, 1);
  ctx.fillRect(1, 22 - legSwing * 0.5, 8, 1);

  // Tronco (Camiseta preta de dev com logo neon)
  ctx.fillStyle = skin.shirtColor;
  ctx.fillRect(-10, -6, 20, 16);

  // Detalhe lateral da cor do player na camiseta
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(-10, -6, 2, 15);
  ctx.fillRect(8, -6, 2, 15);
  ctx.globalAlpha = 1.0;

  // Estampa </> no peito
  ctx.fillStyle = color;
  ctx.font = '800 6px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('</>', 0, 1);

  // Braços e Mãos segurando o teclado
  ctx.fillStyle = skin.skinColor;
  ctx.fillRect(-14, -4, 4, 12);
  ctx.fillRect(10, -4, 4, 12);

  // Crachá de Empresa (Cordão na cor do Dev + cartão branco com chip)
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.lineTo(0, 2);
  ctx.moveTo(5, -6);
  ctx.lineTo(0, 2);
  ctx.stroke();

  ctx.fillStyle = '#ebeff5';
  ctx.fillRect(-3, 2, 6, 8);
  ctx.fillStyle = color;
  ctx.fillRect(-2, 3, 4, 3);

  // Capuz traseiro (se for SecOps Hacker)
  if (skin.hasHoodie) {
    ctx.fillStyle = '#181824';
    ctx.fillRect(-9, -21, 18, 15);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(-9, -21, 18, 15);
  }

  // Rosto / Cabeça
  ctx.fillStyle = skin.skinColor;
  ctx.fillRect(-7, -18, 14, 12);

  // Barba estilo Dev Sênior (se for Backend Tank)
  if (skin.hasBeard) {
    ctx.fillStyle = skin.hairColor;
    ctx.fillRect(-7, -9, 14, 3);
    ctx.fillRect(-5, -10, 10, 2);
  }

  // Cabelo arrumado (Castanho escuro com volume do TerminalVisual.gd)
  ctx.fillStyle = skin.hairColor;
  ctx.fillRect(-8, -20, 16, 5);
  ctx.fillRect(-8, -17, 3, 4);
  ctx.fillStyle = skin.hairHighlight;
  ctx.fillRect(-6, -21, 12, 2);

  // Headset Gamer / Dev (para Frontend / Backend)
  if (skin.hasHeadset) {
    ctx.fillStyle = color;
    ctx.fillRect(-9, -15, 2, 6);
    ctx.fillRect(7, -15, 2, 6);
    ctx.fillRect(-8, -22, 16, 1.5);
  }

  // Óculos de armação neon (marca registrada do DevDash original!)
  ctx.fillStyle = 'rgba(0, 235, 255, 0.45)';
  ctx.fillRect(-6, -14, 5, 4);
  ctx.fillRect(1, -14, 5, 4);

  // Brilho da lente do óculos
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillRect(-5, -13, 2, 1.5);
  ctx.fillRect(2, -13, 2, 1.5);

  // Armação do óculos na cor neon do Dev
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-6, -14, 5, 4);
  ctx.strokeRect(1, -14, 5, 4);

  // Ponte do óculos
  ctx.beginPath();
  ctx.moveTo(-1, -12);
  ctx.lineTo(1, -12);
  ctx.stroke();

  // Teclado Mecânico RGB com glow aprimorado nas mãos do Dev
  ctx.fillStyle = 'rgba(0, 230, 255, 0.16)';
  ctx.fillRect(-19, 1, 38, 14);
  ctx.fillStyle = 'rgba(25, 255, 128, 0.22)';
  ctx.fillRect(-17.5, 2.5, 35, 11);

  // Corpo do teclado mecânico
  ctx.fillStyle = '#1f2129';
  ctx.fillRect(-16, 4, 32, 8);
  ctx.fillStyle = '#333842';
  ctx.fillRect(-14, 5, 28, 6);

  // Teclas RGB iluminadas (Vermelho, Verde barra de espaço, Azul)
  const keyRects = [
    { x: -12, y: 6, w: 4, h: 4 },
    { x: -6, y: 6, w: 12, h: 4 },
    { x: 8, y: 6, w: 4, h: 4 },
  ];
  for (let i = 0; i < keyRects.length; i++) {
    const k = keyRects[i];
    const gCol = KEY_GLOW_COLORS[i];
    ctx.fillStyle = gCol;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(k.x - 1, k.y - 1, k.w + 2, k.h + 2);
    ctx.globalAlpha = 1.0;
    ctx.fillRect(k.x, k.y, k.w, k.h);
  }

  ctx.restore();
}

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camX = 0;
    this.camY = 0;
    this.orbitalPhase = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render(snapshot, myPlayerId, dt) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.orbitalPhase += dt * 3.4;

    const me = snapshot.players.find((p) => p.id === myPlayerId) || snapshot.players[0];
    if (me) {
      this.camX += (me.x - this.camX) * Math.min(1, dt * 10);
      this.camY += (me.y - this.camY) * Math.min(1, dt * 10);
    }

    // 1. Fundo Data Center
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 - this.camX, h / 2 - this.camY);

    this.drawDataCenterFloor(ctx, w, h);
    this.drawArenaBorders(ctx);

    // 2. Terminais de Código JS
    for (const term of snapshot.terminals) {
      if (term.active) {
        this.drawCodeTerminal(ctx, term, me);
      }
    }

    // 3. Cristais de XP (Data Packets)
    for (const gem of snapshot.gems) {
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.fillStyle = gem.color;
      ctx.shadowColor = gem.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Server Racks (portado de ServerRackVisual.gd)
    const blinkPhase = Math.floor(performance.now() / 450) % 6;
    for (const rack of SERVER_RACKS) {
      this.drawServerRack(ctx, rack.x, rack.y, blinkPhase);
    }

    // 5. Inimigos (Bugs, Hackers e Bosses)
    for (const enemy of snapshot.enemies) {
      this.drawEnemy(ctx, enemy);
    }

    // 6. Jogadores (Devs)
    for (const player of snapshot.players) {
      this.drawPlayer(ctx, player, player.id === myPlayerId);
    }

    // 7. Projéteis
    for (const proj of snapshot.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. Textos Flutuantes
    for (const ft of snapshot.floatingTexts) {
      ctx.save();
      ctx.font = '800 13px "JetBrains Mono", monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // 9. Minimapa / Radar da Arena Compartilhada
    this.drawMinimap(ctx, snapshot, myPlayerId);
  }

  drawDataCenterFloor(ctx, viewW, viewH) {
    const tileSize = 110;
    const startX = Math.max(-ARENA_HALF, Math.floor((this.camX - viewW / 2) / tileSize) * tileSize);
    const endX = Math.min(ARENA_HALF, Math.ceil((this.camX + viewW / 2) / tileSize) * tileSize);
    const startY = Math.max(-ARENA_HALF, Math.floor((this.camY - viewH / 2) / tileSize) * tileSize);
    const endY = Math.min(ARENA_HALF, Math.ceil((this.camY + viewH / 2) / tileSize) * tileSize);

    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        const isAlt = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        ctx.fillStyle = isAlt ? '#0c0f16' : '#0f131c';
        ctx.fillRect(x, y, tileSize - 2, tileSize - 2);

        // Pontos de parafuso do piso elevado
        ctx.fillStyle = '#1e2430';
        ctx.fillRect(x + 6, y + 6, 3, 3);
        ctx.fillRect(x + tileSize - 11, y + tileSize - 11, 3, 3);
      }
    }
  }

  drawArenaBorders(ctx) {
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 16;
    ctx.strokeRect(-ARENA_HALF, -ARENA_HALF, ARENA_HALF * 2, ARENA_HALF * 2);
    ctx.restore();
  }

  drawServerRack(ctx, x, y, blinkPhase) {
    ctx.save();
    ctx.translate(x, y);

    // Sombra suave e glow azulado no chão
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 38, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 128, 204, 0.08)';
    ctx.beginPath();
    ctx.arc(0, 36, 34, 0, Math.PI * 2);
    ctx.fill();

    // Gabinete metálico
    ctx.fillStyle = '#191c24';
    ctx.fillRect(-22, -46, 44, 92);
    ctx.fillStyle = '#262b36';
    ctx.fillRect(-20, -44, 40, 88);
    ctx.fillStyle = 'rgba(15, 18, 26, 0.96)';
    ctx.fillRect(-19, -43, 38, 86);

    // Baias de servidor e LEDs piscantes
    for (let i = 0; i < 6; i++) {
      const yOff = -36 + i * 13;
      ctx.fillStyle = '#1f242d';
      ctx.fillRect(-15, yOff, 30, 9);

      const pattern = (i + blinkPhase) % 3;
      ctx.fillStyle = pattern === 0 ? '#00e64d' : pattern === 1 ? '#e6261a' : '#3399ff';
      ctx.beginPath();
      ctx.arc(-10, yOff + 4.5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3399ff';
      ctx.beginPath();
      ctx.arc(-4, yOff + 4.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCodeTerminal(ctx, term, me) {
    const pulse = 0.8 + Math.sin(performance.now() * 0.006) * 0.2;
    ctx.save();
    ctx.translate(term.x, term.y);

    // Círculo de ativação no chão
    ctx.strokeStyle = term.lockedByPlayerId ? '#ffb020' : '#33ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 38 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = term.lockedByPlayerId ? 'rgba(255, 176, 32, 0.12)' : 'rgba(51, 255, 136, 0.12)';
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    // Totem do Terminal JS
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#33ff88';
    ctx.lineWidth = 2;
    ctx.fillRect(-18, -22, 36, 28);
    ctx.strokeRect(-18, -22, 36, 28);

    ctx.fillStyle = '#33ff88';
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('JS>_', 0, -4);

    if (me && Math.hypot(me.x - term.x, me.y - term.y) < 110 && !me.isCoding) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px "JetBrains Mono", monospace';
      const snippet = JS_SPEED_SNIPPETS.find((s) => s.id === term.snippetId);
      const bonus = me.devClass === 'secops' ? 1.25 : 1;
      const label = term.lockedByPlayerId ? 'EM USO' : me.terminalCooldownRemaining > 0
        ? `RECARGA: ${Math.ceil(me.terminalCooldownRemaining)}s`
        : Math.hypot(me.x - term.x, me.y - term.y) > TERMINAL_RANGE
          ? 'APROXIME-SE PARA CODAR' : `[E] CODAR • FOCO ${TERMINAL_DURATION}s`;
      ctx.fillText(label, 0, 26);
      if (snippet) ctx.fillText(`+${Math.round(snippet.commitsReward * bonus)} COMMITS / +${Math.round(snippet.xpReward * bonus)} XP`, 0, 42);
    }

    ctx.restore();
  }

  drawEnemy(ctx, e) {
    ctx.save();
    const bounce = Math.abs(Math.sin(e.walkCycle * 2)) * 2.5;
    ctx.translate(e.x, e.y - bounce);
    ctx.scale(e.scale, e.scale);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (e.kind === 'hacker') {
      // Hacker Visual (Capuz + Faixa Vermelha + Olhos Brilhantes + Laptop Verde)
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#12131a';
      ctx.beginPath();
      ctx.arc(0, -10, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#242630';
      ctx.fillRect(-12, -2, 24, 16);

      // Faixa vermelha (Obi)
      ctx.fillStyle = '#d91a26';
      ctx.fillRect(-12, 7, 24, 4);

      // Olhos vermelhos brilhantes
      ctx.fillStyle = '#ff3340';
      ctx.beginPath();
      ctx.arc(-4, -10, 2, 0, Math.PI * 2);
      ctx.arc(4, -10, 2, 0, Math.PI * 2);
      ctx.fill();

      // Laptop hacker
      ctx.fillStyle = '#00e680';
      ctx.fillRect(6, -1, 10, 7);
    } else if (e.kind === 'boss') {
      // Boss de Merge Conflict / Raid
      const bossColor =
        e.bossType === 'blue_screen'
          ? '#0066ff'
          : e.bossType === 'memory_leak'
          ? '#33ff88'
          : e.bossType === 'stack_overflow'
          ? '#ffb020'
          : '#ff2d55';

      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#161922';
      ctx.strokeStyle = bossColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Olhos compostos
      ctx.fillStyle = bossColor;
      ctx.beginPath();
      ctx.arc(-6, -3, 3.5, 0, Math.PI * 2);
      ctx.arc(6, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '800 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText((e.bossType || 'BOSS').replace('_', ' ').toUpperCase(), 0, -22);
    } else {
      // Inseto / Syntax Bug (Tier 1 a 4)
      const bugColors = ['#ff3355', '#ff9920', '#b833ff', '#00f0ff'];
      const col = e.hitFlash > 0 ? '#ffffff' : bugColors[(e.tier - 1) % bugColors.length];

      // Pernas articuladas
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        for (let leg = -1; leg <= 1; leg++) {
          const swing = Math.sin(e.walkCycle + leg) * 3;
          ctx.beginPath();
          ctx.moveTo(side * 8, leg * 4);
          ctx.lineTo(side * 15, leg * 6 + swing);
          ctx.stroke();
        }
      }

      // Carapaça
      ctx.fillStyle = '#141824';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Olhos brilhantes
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(-4, -6, 2.3, 0, Math.PI * 2);
      ctx.arc(4, -6, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Barra de HP do inimigo se estiver ferido ou for Boss
    if (e.hp < e.maxHp || e.kind === 'boss') {
      const bw = 24;
      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-bw / 2, -19, bw, 3.5);
      ctx.fillStyle = e.kind === 'boss' ? '#ff2d95' : '#ff3344';
      ctx.fillRect(-bw / 2, -19, bw * pct, 3.5);
    }

    ctx.restore();
  }

  drawPlayer(ctx, p, isMe) {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.respawnTimer > 0) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ff3344';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`REDEPLOY EM ${p.respawnTimer.toFixed(1)}s`, 0, -28);
    }

    // 1. Firewall Aura
    if (p.firewallLevel > 0 && p.respawnTimer <= 0) {
      const auraR = 85 + p.firewallLevel * 18;
      ctx.strokeStyle = 'rgba(255, 110, 40, 0.32)';
      ctx.fillStyle = 'rgba(255, 80, 20, 0.06)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. Git Orbitals
    if (p.orbitalCount > 0 && p.respawnTimer <= 0) {
      const orbR = 74;
      for (let i = 0; i < p.orbitalCount; i++) {
        const ang = this.orbitalPhase + (i / p.orbitalCount) * Math.PI * 2;
        const ox = Math.cos(ang) * orbR;
        const oy = Math.sin(ang) * orbR;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ox, oy, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // 3. ESCUDO DE FOCO (Piloto Automático + Invulnerável enquanto coda!)
    if (p.isCoding && p.respawnTimer <= 0) {
      const pulse = 32 + Math.sin(performance.now() * 0.01) * 3;
      ctx.save();
      ctx.strokeStyle = '#33ff88';
      ctx.fillStyle = 'rgba(51, 255, 136, 0.16)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#33ff88';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#33ff88';
      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ CODANDO JS (IMUNE)', 0, -46);
    }

    // Bonequinho original do DevDash (Desenvolvedor de Óculos + Crachá + Camiseta </> + Teclado RGB)
    drawDeveloperCharacter(ctx, {
      devClass: p.devClass,
      color: p.color,
      walkCycle: p.walkCycle,
      facing: p.facing || 1,
      isMe,
    });

    // Nome, Level e Barra de HP acima do boneco
    const bounce = p.walkCycle > 0.01 ? Math.abs(Math.sin(p.walkCycle * 2.0)) * 2.2 : 0;
    ctx.translate(0, -bounce);
    ctx.font = '800 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isMe ? '#ffffff' : p.color;
    ctx.fillText(`${p.name} [L${p.level}]`, 0, -34);

    const hpW = 34;
    const hpPct = Math.max(0, p.hp / p.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-hpW / 2, -29, hpW, 4.5);
    ctx.fillStyle = p.isCoding ? '#33ff88' : p.color;
    ctx.fillRect(-hpW / 2, -29, hpW * hpPct, 4.5);

    ctx.restore();
  }

  drawMinimap(ctx, snapshot, myPlayerId) {
    const size = 148;
    const pad = 16;
    const mx = this.canvas.width - size - pad;
    const my = this.canvas.height - size - pad;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 20, 0.86)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(mx, my, size, size);
    ctx.strokeRect(mx, my, size, size);

    const scale = size / (ARENA_HALF * 2);
    const cx = mx + size / 2;
    const cy = my + size / 2;

    // Terminais JS (pontos verdes)
    for (const t of snapshot.terminals) {
      if (!t.active) continue;
      ctx.fillStyle = '#33ff88';
      ctx.fillRect(cx + t.x * scale - 2, cy + t.y * scale - 2, 4, 4);
    }

    // Bosses (pontos vermelhos maiores)
    for (const e of snapshot.enemies) {
      if (e.kind !== 'boss') continue;
      ctx.fillStyle = '#ff3344';
      ctx.beginPath();
      ctx.arc(cx + e.x * scale, cy + e.y * scale, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Jogadores
    for (const p of snapshot.players) {
      ctx.fillStyle = p.id === myPlayerId ? '#ffffff' : p.color;
      ctx.beginPath();
      ctx.arc(cx + p.x * scale, cy + p.y * scale, p.id === myPlayerId ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 9px "JetBrains Mono", monospace';
    ctx.fillText('RADAR DATA CENTER', mx + 8, my + 13);
    ctx.restore();
  }
}
