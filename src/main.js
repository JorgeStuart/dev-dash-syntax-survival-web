import { sfx } from './audio/synth.js';
import {
  JS_MERGE_CHALLENGES,
  JS_SPEED_SNIPPETS,
  normalizeCode,
} from './coding/js_challenges.js';
import { GameEngine, UPGRADE_OPTIONS, TERMINAL_COOLDOWN, TERMINAL_RANGE } from './game/engine.js';
import { drawDeveloperCharacter, GameRenderer } from './game/renderer.js';
import { getPowerupThreshold } from './game/types.js';
import { DEV_CLASSES, P2PManager, PLAYER_COLORS } from './network/p2p_manager.js';

const canvas = document.getElementById('game-canvas');
const renderer = new GameRenderer(canvas);
const engine = new GameEngine();
const p2p = new P2PManager();

// Elementos DOM — Lobby
const lobbyScreen = document.getElementById('lobby-screen');
const playerNameInput = document.getElementById('player-name-input');
const classCards = document.querySelectorAll('.class-card');
const colorSelectorEl = document.getElementById('color-selector');
const connectionStatus = document.getElementById('connection-status');
const btnCreateRoom = document.getElementById('btn-create-room');
const roomCodeInput = document.getElementById('room-code-input');
const btnJoinRoom = document.getElementById('btn-join-room');
const roomLobbyBox = document.getElementById('room-lobby-box');
const activeRoomCodeEl = document.getElementById('active-room-code');
const btnCopyLink = document.getElementById('btn-copy-link');
const lobbyPlayerCount = document.getElementById('lobby-player-count');
const lobbyPlayersList = document.getElementById('lobby-players-list');
const hostControls = document.getElementById('host-controls');
const clientWaitMsg = document.getElementById('client-wait-msg');
const chkFillBots = document.getElementById('chk-fill-bots');
const btnStartMatch = document.getElementById('btn-start-match');

// Elementos DOM — HUD
const gameHud = document.getElementById('game-hud');
const hudPlayerName = document.getElementById('hud-player-name');
const hudLevel = document.getElementById('hud-level');
const hudHpFill = document.getElementById('hud-hp-fill');
const hudHpText = document.getElementById('hud-hp-text');
const hudXpFill = document.getElementById('hud-xp-fill');
const hudXpText = document.getElementById('hud-xp-text');
const hudShieldBadge = document.getElementById('hud-shield-badge');
const hudTimer = document.getElementById('hud-timer');
const hudMergeTimer = document.getElementById('hud-merge-timer');
const hudRoomTag = document.getElementById('hud-room-tag');
const hudLeaderboard = document.getElementById('hud-leaderboard');
const eventBanner = document.getElementById('event-banner');
const upgradeDrawer = document.getElementById('upgrade-drawer');
const upgradeCardsEl = document.getElementById('upgrade-cards');

// Elementos DOM — Terminal Speed Typing Modal
const terminalModal = document.getElementById('terminal-modal');
const terminalPromptDesc = document.getElementById('terminal-prompt-desc');
const terminalProgressPct = document.getElementById('terminal-progress-pct');
const terminalTargetCode = document.getElementById('terminal-target-code');
const terminalHiddenInput = document.getElementById('terminal-hidden-input');
const btnCloseTerminal = document.getElementById('btn-close-terminal');

// Elementos DOM — Merge Conflict Modal
const mergeModal = document.getElementById('merge-modal');
const mergeTitle = document.getElementById('merge-title');
const mergeCountdown = document.getElementById('merge-countdown');
const mergeDescription = document.getElementById('merge-description');
const mergeBuggyCode = document.getElementById('merge-buggy-code');
const mergeOptionsEl = document.getElementById('merge-options');
const mergeCustomInput = document.getElementById('merge-custom-input');
const btnSubmitMerge = document.getElementById('btn-submit-merge');
const mergeFeedback = document.getElementById('merge-feedback');
const mergeRaceList = document.getElementById('merge-race-list');

// Elementos DOM — Podium
const podiumScreen = document.getElementById('podium-screen');
const podiumWinnerBanner = document.getElementById('podium-winner-banner');
const podiumTbody = document.getElementById('podium-tbody');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnBackLobby = document.getElementById('btn-back-lobby');

let selectedClass = 'fullstack';
let selectedColor = PLAYER_COLORS[0];
let isPlaying = false;
let currentSnapshot = engine.snapshot;
let previewWalkPhase = 0;

// Controle de Teclado (WASD / Setas)
const keysDown = new Set();
let activeTerminalId = null;
let activeSnippet = null;
let terminalCooldownUntil = 0;
let terminalRequestedAt = 0;

let activeMergeChallengeId = null;
let currentMergeChallenge = null;
let mergePenaltyUntil = 0;
let lastRenderedPendingUpgrades = 0;

// Inicializa seletor de cores neon
function renderColorSwatches() {
  if (!colorSelectorEl) return;
  const others = p2p.lobbyPlayers.filter((p) => p.id !== p2p.myId);
  const takenColors = new Map(others.map((p) => [p.color, p.name]));

  colorSelectorEl.innerHTML = PLAYER_COLORS.map((col) => {
    const ownerName = takenColors.get(col);
    const isTaken = Boolean(ownerName);
    const isSelected = col === selectedColor;
    const title = isTaken ? `Cor em uso por ${ownerName}` : `Selecionar cor ${col}`;
    return `<button type="button" class="color-swatch-btn ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}" data-color="${col}" title="${escapeHtml(title)}" style="background:${col}; color:${col}"></button>`;
  }).join('');

  colorSelectorEl.querySelectorAll('.color-swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.color;
      if (!col || btn.classList.contains('taken')) {
        sfx.keyError();
        connectionStatus.textContent = 'Essa cor neon já está em uso por outro Dev na sala!';
        connectionStatus.style.color = '#ff3344';
        return;
      }
      selectedColor = col;
      sfx.keyHit();
      syncLobbySelectionUI();
      p2p.updateMyProfile(playerNameInput.value.trim() || 'Dev_Master', selectedClass, selectedColor);
    });
  });
}

function syncLobbySelectionUI() {
  const others = p2p.lobbyPlayers.filter((p) => p.id !== p2p.myId);
  const takenClasses = new Map();
  for (const p of others) {
    if (!takenClasses.has(p.devClass)) {
      takenClasses.set(p.devClass, p.name);
    }
  }
  const allFourClassesTakenByOthers = DEV_CLASSES.every((c) => takenClasses.has(c));

  classCards.forEach((card) => {
    const cName = card.dataset.class || 'fullstack';
    const statusTag = card.querySelector('.class-status-tag');
    const ownerName = takenClasses.get(cName);
    const isSelected = cName === selectedClass;
    const isLocked = Boolean(ownerName) && !allFourClassesTakenByOthers;

    card.classList.toggle('selected', isSelected);
    card.classList.toggle('taken', isLocked);

    if (statusTag) {
      if (isSelected) {
        statusTag.textContent = 'SEU DEV';
      } else if (isLocked) {
        statusTag.textContent = `EM USO (${ownerName})`;
      } else if (ownerName && allFourClassesTakenByOthers) {
        statusTag.textContent = 'DISPONÍVEL (OUTRA COR)';
      } else {
        statusTag.textContent = 'LIVRE';
      }
    }
  });

  renderColorSwatches();
  renderAllCharacterPreviews();
}

function renderAllCharacterPreviews() {
  const others = p2p.lobbyPlayers.filter((p) => p.id !== p2p.myId);
  const classOwnerColor = new Map(others.map((p) => [p.devClass, p.color]));

  document.querySelectorAll('.dev-preview-canvas').forEach((cnv) => {
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    const cName = cnv.dataset.previewClass || 'fullstack';
    const card = cnv.closest('.class-card');
    const defaultCol = card?.dataset.defaultColor || '#00e5ff';
    const isSelected = cName === selectedClass;
    const displayColor = isSelected
      ? selectedColor
      : classOwnerColor.get(cName) || defaultCol;

    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.save();
    ctx.translate(cnv.width / 2, cnv.height / 2 + 3);
    ctx.scale(1.08, 1.08);
    drawDeveloperCharacter(ctx, {
      devClass: cName,
      color: displayColor,
      walkCycle: isSelected ? previewWalkPhase : 0,
      facing: 1,
      isMe: isSelected,
    });
    ctx.restore();
  });
}

// 1. Seleção de Boneco / Classe no Lobby
classCards.forEach((card) => {
  card.addEventListener('click', () => {
    const candidateClass = card.dataset.class || 'fullstack';
    if (card.classList.contains('taken')) {
      sfx.keyError();
      connectionStatus.textContent = 'Esse boneco já foi escolhido na sala! Escolha um dos livres.';
      connectionStatus.style.color = '#ff3344';
      return;
    }

    selectedClass = candidateClass;
    // Se não estiver em sala ainda (ou se a cor padrão da classe estiver livre), sugere a cor temática
    const defaultCol = card.dataset.defaultColor;
    const others = p2p.lobbyPlayers.filter((p) => p.id !== p2p.myId);
    const takenColors = new Set(others.map((p) => p.color));
    if (defaultCol && !takenColors.has(defaultCol)) {
      selectedColor = defaultCol;
    } else if (takenColors.has(selectedColor)) {
      selectedColor = PLAYER_COLORS.find((c) => !takenColors.has(c)) || selectedColor;
    }

    sfx.keyHit();
    syncLobbySelectionUI();
    p2p.updateMyProfile(playerNameInput.value.trim() || 'Dev_Master', selectedClass, selectedColor);
  });
});

playerNameInput.addEventListener('input', () => {
  p2p.updateMyProfile(playerNameInput.value.trim() || 'Dev_Master', selectedClass, selectedColor);
});

syncLobbySelectionUI();

// 2. Callbacks P2P
p2p.onStatusChange = (status, isErr) => {
  connectionStatus.textContent = status;
  connectionStatus.style.color = isErr ? '#ff3344' : '#33ff88';
};

p2p.onLobbyChange = (players, roomCode) => {
  roomLobbyBox.classList.remove('hidden');
  activeRoomCodeEl.textContent = roomCode;
  lobbyPlayerCount.textContent = String(players.length);

  // Sincroniza o bonequinho e a cor atribuídos a mim pelo Host (evita duplicatas!)
  const meInLobby = players.find((p) => p.id === p2p.myId);
  if (meInLobby) {
    selectedClass = meInLobby.devClass;
    selectedColor = meInLobby.color;
  }

  syncLobbySelectionUI();

  lobbyPlayersList.innerHTML = players
    .map(
      (p) => `
      <li>
        <span style="display:flex; align-items:center; gap:8px; color:${p.color}; font-weight:800">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${p.color}; box-shadow:0 0 6px ${p.color}"></span>
          ${escapeHtml(p.name)} ${p.isHost ? '👑' : ''}
        </span>
        <span style="color:#94a3b8; font-size:11px">${p.devClass.toUpperCase()}</span>
      </li>`
    )
    .join('');

  if (p2p.isHost) {
    hostControls.classList.remove('hidden');
    clientWaitMsg.classList.add('hidden');
  } else {
    hostControls.classList.add('hidden');
    clientWaitMsg.classList.remove('hidden');
  }
};

p2p.onClientMessage = (playerId, msg) => {
  if (!p2p.isHost) return;
  switch (msg.type) {
    case 'player_input':
      engine.setPlayerInput(playerId, msg.input);
      break;
    case 'start_coding':
      engine.setPlayerCoding(playerId, true, msg.terminalId);
      break;
    case 'stop_coding':
      engine.setPlayerCoding(playerId, false, null);
      break;
    case 'complete_terminal':
      engine.completeTerminal(playerId, msg.terminalId, msg.code);
      break;
    case 'merge_progress':
      engine.updateMergeProgress(playerId, msg.progress);
      break;
    case 'complete_merge':
      engine.completeMergeChallenge(playerId, msg.answer);
      break;
    case 'choose_upgrade':
      engine.applyUpgrade(playerId, msg.upgradeId);
      break;
  }
};

p2p.onMatchStart = (initialSnapshot) => {
  currentSnapshot = initialSnapshot;
  enterMatchUI();
};

p2p.onSnapshotReceived = (snapshot) => {
  currentSnapshot = snapshot;
};

// Botões de Sala
btnCreateRoom.addEventListener('click', async () => {
  const name = playerNameInput.value.trim() || 'Dev_Master';
  await p2p.createRoom(name, selectedClass, selectedColor);
});

btnJoinRoom.addEventListener('click', () => {
  const code = roomCodeInput.value.trim();
  if (!code) {
    connectionStatus.textContent = 'Digite o código da sala do seu amigo!';
    return;
  }
  const name = playerNameInput.value.trim() || 'Dev_Client';
  p2p.joinRoom(code, name, selectedClass, selectedColor);
});

btnCopyLink.addEventListener('click', () => {
  const url = `${window.location.origin}${window.location.pathname}?room=${p2p.roomCode}`;
  navigator.clipboard.writeText(url).then(() => {
    btnCopyLink.textContent = '✅ Link Copiado!';
    setTimeout(() => {
      btnCopyLink.textContent = '📋 Copiar Link';
    }, 2000);
  });
});

btnStartMatch.addEventListener('click', () => {
  if (!p2p.isHost) return;
  engine.startNewMatch(p2p.lobbyPlayers, chkFillBots.checked);
  currentSnapshot = engine.snapshot;
  p2p.broadcastMatchStart(currentSnapshot);
  enterMatchUI();
});

function enterMatchUI() {
  isPlaying = true;
  activeTerminalId = null;
  activeSnippet = null;
  terminalCooldownUntil = 0;
  keysDown.clear();
  terminalModal.classList.add('hidden');
  mergeModal.classList.add('hidden');
  activeMergeChallengeId = null;
  lobbyScreen.classList.add('hidden');
  podiumScreen.classList.add('hidden');
  gameHud.classList.remove('hidden');
  hudRoomTag.textContent = p2p.roomCode || 'SOLO';
  sfx.levelUp();
}

// 3. Inputs de Movimento e Atalhos
window.addEventListener('keydown', (e) => {
  if (!isPlaying) return;

  if (e.key === 'Escape' && activeTerminalId !== null) {
    closeTerminalModal();
    return;
  }

  // Se estiver com modal de código aberto, não captura WASD como movimento
  if (activeTerminalId !== null || !mergeModal.classList.contains('hidden')) {
    return;
  }

  if (e.key.toLowerCase() === 'e' && !e.repeat) {
    const me = currentSnapshot.players.find((p) => p.id === p2p.myId);
    if (me) checkTerminalProximity(me.x, me.y, currentSnapshot.terminals, true);
    return;
  }

  // Atalhos 1, 2, 3 para escolher upgrade rápido sem parar de andar
  const me = currentSnapshot.players.find((p) => p.id === p2p.myId) || currentSnapshot.players[0];
  if (me && me.pendingUpgrades > 0 && ['1', '2', '3'].includes(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    const cards = upgradeCardsEl.querySelectorAll('.upgrade-card-btn');
    if (cards[idx]) cards[idx].click();
    return;
  }

  keysDown.add(e.key.toLowerCase());
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.key.toLowerCase());
});

function computeLocalInput() {
  if (activeTerminalId !== null || !mergeModal.classList.contains('hidden')) {
    return { dx: 0, dy: 0 };
  }
  let dx = 0;
  let dy = 0;
  if (keysDown.has('w') || keysDown.has('arrowup')) dy -= 1;
  if (keysDown.has('s') || keysDown.has('arrowdown')) dy += 1;
  if (keysDown.has('a') || keysDown.has('arrowleft')) dx -= 1;
  if (keysDown.has('d') || keysDown.has('arrowright')) dx += 1;
  return { dx, dy };
}

// 4. Modal 1: Terminal Speed Typing (JavaScript)
function checkTerminalProximity(meX, meY, terminals, interact = false) {
  const me = currentSnapshot.players.find((p) => p.id === p2p.myId);
  if (!interact || !me || me.respawnTimer > 0 || me.terminalCooldownRemaining > 0 || currentSnapshot.matchEnded) return;
  if (activeTerminalId !== null || currentSnapshot.activeMerge) return;
  if (performance.now() < terminalCooldownUntil) return;

  for (const term of terminals) {
    if (!term.active) continue;
    if (term.lockedByPlayerId && term.lockedByPlayerId !== p2p.myId) continue;
    const d = Math.hypot(term.x - meX, term.y - meY);
    if (d <= TERMINAL_RANGE) {
      openTerminalModal(term);
      break;
    }
  }
}

function openTerminalModal(term) {
  document.getElementById('terminal-focus-timer').textContent = '🛡️ RESERVANDO TERMINAL...';
  terminalRequestedAt = performance.now();
  keysDown.clear();
  activeTerminalId = term.id;
  activeSnippet = JS_SPEED_SNIPPETS.find((s) => s.id === term.snippetId) ?? JS_SPEED_SNIPPETS[0];

  const bonus = currentSnapshot.players.find((p) => p.id === p2p.myId)?.devClass === 'secops' ? 1.25 : 1;
  terminalPromptDesc.innerHTML = `${activeSnippet.desc} <strong style="color:#33ff88">(+${Math.round(activeSnippet.commitsReward * bonus)} Commits & +${Math.round(activeSnippet.xpReward * bonus)} XP)</strong>`;
  terminalHiddenInput.value = '';
  renderSnippetHighlight('');
  terminalModal.classList.remove('hidden');
  setTimeout(() => terminalHiddenInput.focus(), 20);

  p2p.sendToHost({ type: 'start_coding', terminalId: term.id });
}

function renderSnippetHighlight(typed) {
  if (!activeSnippet) return;
  const target = activeSnippet.code;
  let html = '';
  let correctCount = 0;

  for (let i = 0; i < target.length; i++) {
    const ch = target[i] === ' ' ? '&nbsp;' : escapeHtml(target[i]);
    if (i < typed.length) {
      if (typed[i] === target[i]) {
        html += `<span class="char-correct">${ch}</span>`;
        correctCount++;
      } else {
        html += `<span class="char-wrong">${ch}</span>`;
      }
    } else if (i === typed.length) {
      html += `<span class="char-current">${ch}</span>`;
    } else {
      html += `<span class="char-pending">${ch}</span>`;
    }
  }

  terminalTargetCode.innerHTML = html;
  const pct = Math.floor((correctCount / target.length) * 100);
  terminalProgressPct.textContent = `${pct}%`;
}

terminalHiddenInput.addEventListener('input', () => {
  if (!activeSnippet || activeTerminalId === null) return;
  const typed = terminalHiddenInput.value;
  const target = activeSnippet.code;

  const lastIdx = typed.length - 1;
  if (lastIdx >= 0) {
    if (typed[lastIdx] === target[lastIdx]) {
      sfx.keyHit();
    } else {
      sfx.keyError();
    }
  }

  renderSnippetHighlight(typed);

  if (typed === target) {
    const completedId = activeTerminalId;
    activeTerminalId = null;
    activeSnippet = null;
    terminalCooldownUntil = performance.now() + TERMINAL_COOLDOWN * 1000;
    terminalModal.classList.add('hidden');
    sfx.terminalSuccess();
    p2p.sendToHost({ type: 'complete_terminal', terminalId: completedId, code: typed });
  }
});

function closeTerminalModal() {
  activeTerminalId = null;
  activeSnippet = null;
  terminalCooldownUntil = performance.now() + TERMINAL_COOLDOWN * 1000;
  terminalModal.classList.add('hidden');
  p2p.sendToHost({ type: 'stop_coding' });
}

btnCloseTerminal.addEventListener('click', () => closeTerminalModal());

// 5. Modal 2: Sirene Global de Merge Conflict (PvP Fix-the-Bug JS)
function syncMergeConflictModal() {
  const activeMerge = currentSnapshot.activeMerge;
  if (!activeMerge) {
    if (activeMergeChallengeId !== null) {
      activeMergeChallengeId = null;
      mergeModal.classList.add('hidden');
    }
    return;
  }

  const alreadyFinished = activeMerge.completedOrder.includes(p2p.myId);
  if (alreadyFinished) {
    mergeModal.classList.add('hidden');
    return;
  }

  // Se acabou de começar um novo Merge Conflict, abre o modal PvP!
  if (activeMergeChallengeId !== activeMerge.challengeId) {
    activeMergeChallengeId = activeMerge.challengeId;
    if (activeTerminalId !== null) {
      activeTerminalId = null;
      activeSnippet = null;
      terminalModal.classList.add('hidden');
    }

    currentMergeChallenge =
      JS_MERGE_CHALLENGES.find((c) => c.id === activeMerge.challengeId) ?? JS_MERGE_CHALLENGES[0];

    mergeTitle.textContent = currentMergeChallenge.title;
    mergeDescription.textContent = currentMergeChallenge.description;
    mergeBuggyCode.textContent = currentMergeChallenge.buggyCode;
    mergeCustomInput.value = '';
    mergeFeedback.textContent = '';

    // Embaralha opções
    const shuffled = [...currentMergeChallenge.options].sort(() => Math.random() - 0.5);
    mergeOptionsEl.innerHTML = shuffled
      .map(
        (opt) =>
          `<button class="merge-opt-btn" data-ans="${escapeHtml(opt)}"><code>${escapeHtml(opt)}</code></button>`
      )
      .join('');

    mergeOptionsEl.querySelectorAll('.merge-opt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        attemptMergeFix(btn.dataset.ans || '');
      });
    });

    mergeModal.classList.remove('hidden');
    sfx.mergeSiren();
  }

  mergeCountdown.textContent = String(Math.ceil(activeMerge.timeRemaining));

  // Atualiza corrida de deploy ao vivo de todos os jogadores da sala
  mergeRaceList.innerHTML = currentSnapshot.players
    .map((p) => {
      const rankBadge = p.mergeFinishedRank > 0 ? `🏆 #${p.mergeFinishedRank} PUSH!` : `${Math.floor(p.mergeProgress)}%`;
      return `
      <li class="race-item">
        <div class="race-item-top">
          <strong style="color:${p.color}">${escapeHtml(p.name)}</strong>
          <span>${rankBadge}</span>
        </div>
        <div class="race-bar-bg">
          <div class="race-bar-fill" style="width:${p.mergeProgress}%"></div>
        </div>
      </li>`;
    })
    .join('');
}

function attemptMergeFix(candidate) {
  if (!currentMergeChallenge) return;
  if (performance.now() < mergePenaltyUntil) return;

  const normCandidate = normalizeCode(candidate);
  const isCorrect =
    normCandidate === normalizeCode(currentMergeChallenge.correctAnswer) ||
    currentMergeChallenge.acceptedAliases.some((a) => normalizeCode(a) === normCandidate);

  if (isCorrect) {
    sfx.terminalSuccess();
    mergeFeedback.style.color = '#33ff88';
    mergeFeedback.textContent = '✅ TESTS PASSED! Dando git push...';
    p2p.sendToHost({ type: 'complete_merge', answer: candidate });
    setTimeout(() => {
      mergeModal.classList.add('hidden');
    }, 350);
  } else {
    sfx.keyError();
    mergePenaltyUntil = performance.now() + 1600;
    mergeFeedback.style.color = '#ff3344';
    mergeFeedback.textContent = '❌ SYNTAX / LOGIC ERROR! Testes falharam (aguarde 1.6s)...';
  }
}

mergeCustomInput.addEventListener('input', () => {
  if (!currentMergeChallenge) return;
  const pct = Math.min(90, Math.floor((mergeCustomInput.value.length / currentMergeChallenge.correctAnswer.length) * 90));
  p2p.sendToHost({ type: 'merge_progress', progress: pct });
});

mergeCustomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    attemptMergeFix(mergeCustomInput.value);
  }
});

btnSubmitMerge.addEventListener('click', () => {
  attemptMergeFix(mergeCustomInput.value);
});

// 6. Atualização do HUD, Leaderboard e Pódio
function updateHUD() {
  const me = currentSnapshot.players.find((p) => p.id === p2p.myId) || currentSnapshot.players[0];
  if (!me) return;

  hudPlayerName.textContent = `${me.name} (${me.devClass.toUpperCase()})`;
  hudLevel.textContent = `LVL ${me.level}`;

  const hpPct = Math.max(0, Math.min(100, (me.hp / me.maxHp) * 100));
  hudHpFill.style.width = `${hpPct}%`;
  hudHpText.textContent = `${Math.ceil(me.hp)} / ${me.maxHp} HP`;

  const prevThreshold = me.level > 1 ? getPowerupThreshold(me.level - 2) : 0;
  const nextThreshold = getPowerupThreshold(me.level - 1);
  const xpInLevel = Math.max(0, me.xp - prevThreshold);
  const xpNeeded = Math.max(1, nextThreshold - prevThreshold);
  const xpPct = Math.max(0, Math.min(100, (xpInLevel / xpNeeded) * 100));
  hudXpFill.style.width = `${xpPct}%`;
  hudXpText.textContent = `${Math.floor(me.xp)} / ${nextThreshold} XP`;

  if (me.isCoding) {
    hudShieldBadge.classList.remove('hidden');
    hudShieldBadge.textContent = me.codingType === 'terminal'
      ? `🛡️ FOCO: ${Math.ceil(me.terminalTimeRemaining)}s • ESC PARA SAIR`
      : '🛡️ MERGE CONFLICT: PROTEÇÃO ATIVA';
  } else {
    hudShieldBadge.classList.add('hidden');
  }

  hudTimer.textContent = formatSeconds(currentSnapshot.sprintTimeRemaining);
  hudMergeTimer.textContent = currentSnapshot.activeMerge
    ? 'EM ANDAMENTO!'
    : formatSeconds(currentSnapshot.nextMergeTimer);

  // Ranking ao vivo ordenado por Score (Commits)
  const sorted = [...currentSnapshot.players].sort((a, b) => b.score - a.score);
  hudLeaderboard.innerHTML = sorted
    .map(
      (p, idx) => `
      <li class="${p.id === me.id ? 'is-me' : ''}">
        <span style="color:${p.color}">${idx + 1}. ${escapeHtml(p.name)} ${p.isCoding ? '🛡️' : ''}</span>
        <strong>${p.score} <small style="color:#94a3b8">commits</small></strong>
      </li>`
    )
    .join('');

  // Banner de eventos
  if (currentSnapshot.bannerMessage) {
    eventBanner.textContent = currentSnapshot.bannerMessage;
    eventBanner.classList.remove('hidden');
  } else {
    eventBanner.classList.add('hidden');
  }

  // Upgrade Drawer
  if (me.pendingUpgrades > 0) {
    upgradeDrawer.classList.remove('hidden');
    if (lastRenderedPendingUpgrades !== me.pendingUpgrades) {
      lastRenderedPendingUpgrades = me.pendingUpgrades;
      renderUpgradeChoices();
    }
  } else {
    lastRenderedPendingUpgrades = 0;
    upgradeDrawer.classList.add('hidden');
  }

  // O host controla o prazo e confirma a reserva do terminal.
  if (activeTerminalId !== null && !currentSnapshot.activeMerge) {
    if (me.codingType === 'terminal' && me.terminalId === activeTerminalId) {
      const seconds = Math.ceil(me.terminalTimeRemaining);
      const timer = document.getElementById('terminal-focus-timer');
      timer.textContent = `🛡️ ${seconds}s DE FOCO • AO TERMINAR, VOCÊ VOLTA À ARENA`;
      timer.style.color = seconds <= 5 ? '#ffb020' : '';
    } else if (performance.now() - terminalRequestedAt > 1200) {
      closeTerminalModal();
    }
  }

  // Sincroniza Modal de Merge Conflict
  syncMergeConflictModal();

  // Checa Fim da Sprint (Pódio)
  if (currentSnapshot.matchEnded) {
    showPodium(sorted);
  }
}

function renderUpgradeChoices() {
  const picks = [...UPGRADE_OPTIONS].sort(() => Math.random() - 0.5).slice(0, 3);
  upgradeCardsEl.innerHTML = picks
    .map(
      (u, idx) => `
      <button class="upgrade-card-btn" data-upg="${u.id}">
        <strong>[${idx + 1}] ${u.title}</strong>
        <span>${u.desc}</span>
      </button>`
    )
    .join('');

  upgradeCardsEl.querySelectorAll('.upgrade-card-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const upgId = btn.dataset.upg;
      sfx.levelUp();
      p2p.sendToHost({ type: 'choose_upgrade', upgradeId: upgId });
      lastRenderedPendingUpgrades = 0;
    });
  });
}

function showPodium(sortedPlayers) {
  isPlaying = false;
  terminalModal.classList.add('hidden');
  mergeModal.classList.add('hidden');
  podiumScreen.classList.remove('hidden');

  const winner = sortedPlayers[0];
  podiumWinnerBanner.innerHTML = winner
    ? `🏆 <strong style="color:${winner.color}">${escapeHtml(winner.name)}</strong> VENCEU A SPRINT COM <strong>${winner.score} COMMITS</strong>!`
    : 'Sprint encerrada!';

  podiumTbody.innerHTML = sortedPlayers
    .map(
      (p, i) => `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td style="color:${p.color}; font-weight:800">${escapeHtml(p.name)}</td>
        <td>LVL ${p.level}</td>
        <td>${p.kills}</td>
        <td>${p.deploysCompleted} deploys</td>
        <td><strong style="color:#33ff88">${p.score}</strong></td>
      </tr>`
    )
    .join('');
}

btnPlayAgain.addEventListener('click', () => {
  if (p2p.isHost) {
    engine.startNewMatch(p2p.lobbyPlayers, chkFillBots.checked);
    currentSnapshot = engine.snapshot;
    p2p.broadcastMatchStart(currentSnapshot);
    enterMatchUI();
  }
});

btnBackLobby.addEventListener('click', () => {
  podiumScreen.classList.add('hidden');
  gameHud.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
});

// 7. Loop Principal (60 FPS + Broadcast P2P a 25Hz)
let lastTime = performance.now();
let netSyncAccum = 0;

function gameLoop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (isPlaying) {
    const localInput = computeLocalInput();
    p2p.sendToHost({ type: 'player_input', input: localInput });

    if (p2p.isHost) {
      engine.tick(dt);
      currentSnapshot = engine.snapshot;

      netSyncAccum += dt;
      if (netSyncAccum >= 0.04) {
        netSyncAccum = 0;
        p2p.broadcastSnapshot(currentSnapshot);
      }
    }

    renderer.render(currentSnapshot, p2p.myId, dt);
    updateHUD();
  } else {
    // Fundo animado e preview animado do bonequinho selecionado no lobby
    previewWalkPhase += dt * 7.5;
    renderAllCharacterPreviews();
    renderer.render(currentSnapshot, p2p.myId, dt);
  }

  requestAnimationFrame(gameLoop);
}

function formatSeconds(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Auto-preenche código da sala se vier via link ?room=DASH-XXXX
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  roomCodeInput.value = roomParam.toUpperCase();
  connectionStatus.textContent = `Convite detectado para a sala ${roomParam.toUpperCase()}! Clique em ENTRAR.`;
}

requestAnimationFrame(gameLoop);
