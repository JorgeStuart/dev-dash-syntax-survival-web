import Peer from 'peerjs';

export const PLAYER_COLORS = ['#00e5ff', '#ff2d95', '#33ff88', '#ffb020', '#a855f7', '#38bdf8', '#f43f5e', '#eab308'];
export const DEV_CLASSES = ['fullstack', 'frontend', 'backend', 'secops'];

export class P2PManager {
  constructor(options = {}) {
    this.peer = null;
    this.peerFactory = options.peerFactory || ((id, cfg) => (id ? new Peer(id, cfg) : new Peer(cfg)));
    this.channelFactory =
      options.channelFactory ||
      ((name) => (typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(name) : null));
    this.localChannel = null;
    this.isHost = false;
    this.myId = 'local-host';
    this.roomCode = '';
    this.connectionState = 'desconectado'; // 'desconectado' | 'conectando' | 'online' | 'local'
    this.lobbyPlayers = [];
    this.roomSettings = {
      mode: 'casual', // 'casual' | 'avancada'
      botDifficulty: 'normal', // 'facil' | 'normal' | 'dificil'
    };
    this.connections = new Map();
    this.localPeers = new Set();
    this.hostConn = null;
    this.connectedViaLocal = false;

    this.onLobbyChange = null;
    this.onStatusChange = null;
    this.onMatchStart = null;
    this.onSnapshotReceived = null;
    this.onClientMessage = null;
    this.onPlayerDisconnect = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  setStatus(message, isErr = false, state = this.connectionState) {
    this.connectionState = state;
    this.onStatusChange?.(message, isErr, state);
  }

  pickAvailableClass(preferredClass, excludePlayerId = null) {
    const others = this.lobbyPlayers.filter((p) => p.id !== excludePlayerId);
    const takenClasses = new Set(others.map((p) => p.devClass));
    if (!takenClasses.has(preferredClass)) {
      return preferredClass;
    }
    const freeClass = DEV_CLASSES.find((c) => !takenClasses.has(c));
    return freeClass || preferredClass;
  }

  pickAvailableColor(preferredColor, excludePlayerId = null) {
    const others = this.lobbyPlayers.filter((p) => p.id !== excludePlayerId);
    const takenColors = new Set(others.map((p) => p.color));
    if (preferredColor && !takenColors.has(preferredColor)) {
      return preferredColor;
    }
    return PLAYER_COLORS.find((c) => !takenColors.has(c)) || PLAYER_COLORS[others.length % PLAYER_COLORS.length];
  }

  handleIncomingClientMessage(peerId, msg) {
    if (!this.isHost || !msg || typeof msg !== 'object') return;
    if (msg.type === 'join_info') {
      const assignedClass = this.pickAvailableClass(msg.devClass || 'fullstack', peerId);
      const assignedColor = this.pickAvailableColor(msg.color, peerId);
      this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== peerId);
      this.lobbyPlayers.push({
        id: peerId,
        name: String(msg.name || `Dev_${this.lobbyPlayers.length + 1}`).slice(0, 16),
        devClass: assignedClass,
        color: assignedColor,
        isHost: false,
        isBot: false,
      });
      this.broadcastLobby();
    } else if (msg.type === 'update_profile') {
      const p = this.lobbyPlayers.find((pl) => pl.id === peerId);
      if (p) {
        if (msg.name) p.name = String(msg.name).slice(0, 16);
        if (msg.devClass) p.devClass = this.pickAvailableClass(msg.devClass, peerId);
        if (msg.color) p.color = this.pickAvailableColor(msg.color, peerId);
        this.broadcastLobby();
      }
    } else if (msg.type === 'peer_disconnect') {
      this.removeClientPeer(peerId);
    } else {
      this.onClientMessage?.(peerId, msg);
    }
  }

  removeClientPeer(peerId) {
    const existed = this.lobbyPlayers.some((p) => p.id === peerId);
    this.connections.delete(peerId);
    this.localPeers.delete(peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== peerId);
    if (existed) {
      this.onPlayerDisconnect?.(peerId);
      this.broadcastLobby();
    }
  }

  setupLocalChannel(roomCode) {
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }
    const ch = this.channelFactory(`devdash-p2p-${roomCode.toUpperCase()}`);
    if (!ch) return;
    this.localChannel = ch;
    ch.onmessage = (ev) => {
      const packet = ev.data;
      if (!packet || packet.__from === this.myId) return;
      if (this.isHost && (packet.__to === 'host' || packet.__to === this.myId)) {
        this.localPeers.add(packet.__from);
        this.handleIncomingClientMessage(packet.__from, packet.payload);
      } else if (!this.isHost && (packet.__to === 'all' || packet.__to === this.myId)) {
        if (!this.connectedViaLocal && !(this.hostConn && this.hostConn.open)) {
          this.connectedViaLocal = true;
          this.setStatus(`Conectado em Modo Local Multi-Abas (${this.roomCode})!`, false, 'local');
        }
        this.handleIncomingHostMessage(packet.payload);
      }
    };
  }

  handleIncomingHostMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'lobby_update') {
      this.lobbyPlayers = msg.players || [];
      this.roomCode = msg.roomCode || this.roomCode;
      if (msg.roomSettings) {
        this.roomSettings = { ...this.roomSettings, ...msg.roomSettings };
      }
      this.onLobbyChange?.(this.lobbyPlayers, this.roomCode, this.roomSettings);
    } else if (msg.type === 'start_match') {
      if (msg.roomSettings) {
        this.roomSettings = { ...this.roomSettings, ...msg.roomSettings };
      }
      this.onMatchStart?.(msg.snapshot, this.roomSettings);
    } else if (msg.type === 'world_snapshot') {
      this.onSnapshotReceived?.(msg.snapshot);
    } else if (msg.type === 'host_closed') {
      this.setStatus('Conexão com o Host encerrada.', true, 'desconectado');
    }
  }

  createRoom(playerName, devClass, preferredColor = PLAYER_COLORS[0], customCode = null) {
    return new Promise((resolve) => {
      this.cleanup();
      this.isHost = true;
      const num = Math.floor(1000 + Math.random() * 9000);
      this.roomCode = customCode ? customCode.toUpperCase() : `DASH-${num}`;
      const peerId = `devdash-syntax-${this.roomCode.toLowerCase()}`;

      this.myId = peerId;
      this.lobbyPlayers = [
        {
          id: this.myId,
          name: playerName || 'Dev_Host',
          devClass: devClass || 'fullstack',
          color: preferredColor || PLAYER_COLORS[0],
          isHost: true,
          isBot: false,
        },
      ];

      this.setupLocalChannel(this.roomCode);
      this.setStatus(`Sala ${this.roomCode} criada! Sincronizando P2P...`, false, 'conectando');
      this.onLobbyChange?.(this.lobbyPlayers, this.roomCode, this.roomSettings);
      resolve(this.roomCode);

      try {
        const peerCfg = typeof window !== 'undefined' && window.DEVDASH_PEER_CONFIG ? window.DEVDASH_PEER_CONFIG : undefined;
        this.peer = this.peerFactory(peerId, peerCfg);
      } catch {
        this.setStatus(`Modo Local Multi-Abas Ativo (${this.roomCode})`, false, 'local');
        return;
      }

      if (!this.peer || typeof this.peer.on !== 'function') {
        this.setStatus(`Modo Local Multi-Abas Ativo (${this.roomCode})`, false, 'local');
        return;
      }

      this.peer.on('open', (id) => {
        this.myId = id;
        if (this.lobbyPlayers[0]) {
          this.lobbyPlayers[0].id = id;
        }
        this.setStatus(`Sala P2P Online! Código: ${this.roomCode}`, false, 'online');
        this.onLobbyChange?.(this.lobbyPlayers, this.roomCode, this.roomSettings);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
        });
        conn.on('data', (raw) => {
          this.handleIncomingClientMessage(conn.peer, raw);
        });
        conn.on('close', () => {
          this.removeClientPeer(conn.peer);
        });
      });

      this.peer.on('error', () => {
        // Sem desabilitar verificação TLS: se o servidor cloud PeerJS falhar por rede/TLS,
        // opera com segurança via BroadcastChannel local ou aguarda reconexão.
        this.setStatus(`Modo Local Multi-Abas Ativo (${this.roomCode})`, false, 'local');
      });
    });
  }

  joinRoom(roomCodeInput, playerName, devClass, preferredColor) {
    this.cleanup();
    this.isHost = false;
    this.connectedViaLocal = false;
    const cleanCode = roomCodeInput.trim().toUpperCase();
    this.roomCode = cleanCode.startsWith('DASH-') ? cleanCode : `DASH-${cleanCode}`;
    const hostPeerId = `devdash-syntax-${this.roomCode.toLowerCase()}`;

    this.myId = `client-${Math.random().toString(36).slice(2, 9)}`;
    this.setupLocalChannel(this.roomCode);
    this.setStatus(`Conectando à sala ${this.roomCode}...`, false, 'conectando');

    // Tenta pareamento imediato via BroadcastChannel (permite duas abas na mesma máquina sem depender da nuvem PeerJS)
    if (this.localChannel) {
      this.localChannel.postMessage({
        __from: this.myId,
        __to: 'host',
        payload: {
          type: 'join_info',
          name: playerName || 'Dev_Client',
          devClass,
          color: preferredColor,
        },
      });
    }

    try {
      const peerCfg = typeof window !== 'undefined' && window.DEVDASH_PEER_CONFIG ? window.DEVDASH_PEER_CONFIG : undefined;
      this.peer = this.peerFactory(null, peerCfg);
    } catch {
      return;
    }

    if (!this.peer || typeof this.peer.on !== 'function') return;

    this.peer.on('open', (id) => {
      if (this.connectedViaLocal) return;
      this.myId = id;
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConn = conn;

      conn.on('open', () => {
        this.setStatus(`Conectado à sala ${this.roomCode}!`, false, 'online');
        conn.send({
          type: 'join_info',
          name: playerName || 'Dev_Client',
          devClass,
          color: preferredColor,
        });
      });

      conn.on('data', (raw) => {
        this.handleIncomingHostMessage(raw);
      });

      conn.on('close', () => {
        if (!this.connectedViaLocal) {
          this.setStatus('Conexão com o Host encerrada.', true, 'desconectado');
        }
      });
    });

    this.peer.on('error', (err) => {
      if (this.connectedViaLocal) {
        // Já conectado via BroadcastChannel local, mantém sessão ativa sem erro bloqueante
        return;
      }
      this.setStatus(`Erro ao conectar na nuvem (${err?.type || 'rede'}). Verifique o código ou use abas no mesmo navegador.`, true, 'desconectado');
    });
  }

  updateRoomSettings(partialSettings) {
    if (!this.isHost) return;
    this.roomSettings = { ...this.roomSettings, ...partialSettings };
    this.broadcastLobby();
  }

  updateMyProfile(name, devClass, color) {
    if (this.isHost) {
      const me = this.lobbyPlayers.find((p) => p.id === this.myId) || this.lobbyPlayers[0];
      if (!me) return;
      if (name) me.name = String(name).slice(0, 16);
      if (devClass) me.devClass = this.pickAvailableClass(devClass, me.id);
      if (color) me.color = this.pickAvailableColor(color, me.id);
      this.broadcastLobby();
    } else {
      this.sendToHost({
        type: 'update_profile',
        name,
        devClass,
        color,
      });
    }
  }

  broadcastLobby() {
    this.onLobbyChange?.(this.lobbyPlayers, this.roomCode, this.roomSettings);
    const msg = {
      type: 'lobby_update',
      players: this.lobbyPlayers,
      roomCode: this.roomCode,
      roomSettings: this.roomSettings,
    };
    this.broadcastToClients(msg);
  }

  broadcastMatchStart(snapshot) {
    const msg = {
      type: 'start_match',
      snapshot,
      roomSettings: this.roomSettings,
    };
    this.broadcastToClients(msg);
  }

  broadcastSnapshot(snapshot) {
    const msg = { type: 'world_snapshot', snapshot };
    this.broadcastToClients(msg);
  }

  broadcastToClients(msg) {
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg);
    }
    if (this.localChannel && this.localPeers.size > 0) {
      this.localChannel.postMessage({
        __from: this.myId,
        __to: 'all',
        payload: msg,
      });
    }
  }

  sendToHost(msg) {
    if (this.isHost) {
      this.onClientMessage?.(this.myId, msg);
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(msg);
    } else if (this.localChannel && this.connectedViaLocal) {
      this.localChannel.postMessage({
        __from: this.myId,
        __to: 'host',
        payload: msg,
      });
    }
  }

  cleanup() {
    if (this.localChannel) {
      try {
        if (this.isHost) {
          this.localChannel.postMessage({
            __from: this.myId,
            __to: 'all',
            payload: { type: 'host_closed' },
          });
        } else {
          this.localChannel.postMessage({
            __from: this.myId,
            __to: 'host',
            payload: { type: 'peer_disconnect' },
          });
        }
        this.localChannel.close();
      } catch {
        // ignore close errors
      }
      this.localChannel = null;
    }
    this.localPeers.clear();
    this.connectedViaLocal = false;

    for (const c of this.connections.values()) {
      c.close();
    }
    this.connections.clear();
    if (this.hostConn) {
      this.hostConn.close();
      this.hostConn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connectionState = 'desconectado';
  }
}
