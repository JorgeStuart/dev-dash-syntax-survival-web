import Peer from 'peerjs';

export const PLAYER_COLORS = ['#00e5ff', '#ff2d95', '#33ff88', '#ffb020', '#a855f7', '#38bdf8', '#f43f5e', '#eab308'];
export const DEV_CLASSES = ['fullstack', 'frontend', 'backend', 'secops'];

export class P2PManager {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.myId = 'local-host';
    this.roomCode = '';
    this.lobbyPlayers = [];
    this.connections = new Map();
    this.hostConn = null;

    this.onLobbyChange = null;
    this.onStatusChange = null;
    this.onMatchStart = null;
    this.onSnapshotReceived = null;
    this.onClientMessage = null;
  }

  pickAvailableClass(preferredClass, excludePlayerId = null) {
    const others = this.lobbyPlayers.filter((p) => p.id !== excludePlayerId);
    const takenClasses = new Set(others.map((p) => p.devClass));
    // Se ainda há bonequinhos inéditos disponíveis (até 4 players), garante 1 de cada sem repetir!
    if (!takenClasses.has(preferredClass)) {
      return preferredClass;
    }
    const freeClass = DEV_CLASSES.find((c) => !takenClasses.has(c));
    // Se todos os 4 bonequinhos já foram pegos (5 a 8 jogadores), permite escolher mas com outra cor exclusiva
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

  createRoom(playerName, devClass, preferredColor = PLAYER_COLORS[0]) {
    return new Promise((resolve) => {
      this.cleanup();
      this.isHost = true;
      const num = Math.floor(1000 + Math.random() * 9000);
      this.roomCode = `DASH-${num}`;
      const peerId = `devdash-syntax-${this.roomCode.toLowerCase()}`;

      // Libera a sala imediatamente na UI (zero espera!)
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
      this.onStatusChange?.(`Sala ${this.roomCode} criada! Sincronizando P2P...`);
      this.onLobbyChange?.(this.lobbyPlayers, this.roomCode);
      resolve(this.roomCode);

      try {
        this.peer = new Peer(peerId);
      } catch {
        this.onStatusChange?.(`Sala Local Pronta (${this.roomCode})`);
        return;
      }

      this.peer.on('open', (id) => {
        this.myId = id;
        if (this.lobbyPlayers[0]) {
          this.lobbyPlayers[0].id = id;
        }
        this.onStatusChange?.(`Sala P2P Online! Código: ${this.roomCode}`);
        this.onLobbyChange?.(this.lobbyPlayers, this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
        });
        conn.on('data', (raw) => {
          const msg = raw;
          if (msg.type === 'join_info') {
            const assignedClass = this.pickAvailableClass(msg.devClass || 'fullstack', conn.peer);
            const assignedColor = this.pickAvailableColor(msg.color, conn.peer);
            this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== conn.peer);
            this.lobbyPlayers.push({
              id: conn.peer,
              name: msg.name || `Dev_${this.lobbyPlayers.length + 1}`,
              devClass: assignedClass,
              color: assignedColor,
              isHost: false,
              isBot: false,
            });
            this.broadcastLobby();
          } else if (msg.type === 'update_profile') {
            const p = this.lobbyPlayers.find((pl) => pl.id === conn.peer);
            if (p) {
              if (msg.name) p.name = msg.name;
              if (msg.devClass) p.devClass = this.pickAvailableClass(msg.devClass, conn.peer);
              if (msg.color) p.color = this.pickAvailableColor(msg.color, conn.peer);
              this.broadcastLobby();
            }
          } else {
            this.onClientMessage?.(conn.peer, msg);
          }
        });
        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== conn.peer);
          this.broadcastLobby();
        });
      });

      this.peer.on('error', () => {
        this.onStatusChange?.(`Modo Local Ativo (${this.roomCode})`);
      });
    });
  }

  joinRoom(roomCodeInput, playerName, devClass, preferredColor) {
    this.cleanup();
    this.isHost = false;
    const cleanCode = roomCodeInput.trim().toUpperCase();
    this.roomCode = cleanCode.startsWith('DASH-') ? cleanCode : `DASH-${cleanCode}`;
    const hostPeerId = `devdash-syntax-${this.roomCode.toLowerCase()}`;

    this.onStatusChange?.(`Conectando à sala ${this.roomCode}...`);
    this.peer = new Peer();

    this.peer.on('open', (id) => {
      this.myId = id;
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.hostConn = conn;

      conn.on('open', () => {
        this.onStatusChange?.(`Conectado à sala ${this.roomCode}!`);
        conn.send({
          type: 'join_info',
          name: playerName || 'Dev_Client',
          devClass,
          color: preferredColor,
        });
      });

      conn.on('data', (raw) => {
        const msg = raw;
        if (msg.type === 'lobby_update') {
          this.lobbyPlayers = msg.players;
          this.roomCode = msg.roomCode;
          this.onLobbyChange?.(this.lobbyPlayers, this.roomCode);
        } else if (msg.type === 'start_match') {
          this.onMatchStart?.(msg.snapshot);
        } else if (msg.type === 'world_snapshot') {
          this.onSnapshotReceived?.(msg.snapshot);
        }
      });

      conn.on('close', () => {
        this.onStatusChange?.('Conexão com o Host encerrada.', true);
      });
    });

    this.peer.on('error', (err) => {
      this.onStatusChange?.(`Erro ao conectar (${err.type}). Verifique o código da sala.`, true);
    });
  }

  updateMyProfile(name, devClass, color) {
    if (this.isHost) {
      const me = this.lobbyPlayers.find((p) => p.id === this.myId) || this.lobbyPlayers[0];
      if (!me) return;
      if (name) me.name = name;
      if (devClass) me.devClass = this.pickAvailableClass(devClass, me.id);
      if (color) me.color = this.pickAvailableColor(color, me.id);
      this.broadcastLobby();
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'update_profile',
        name,
        devClass,
        color,
      });
    }
  }

  broadcastLobby() {
    this.onLobbyChange?.(this.lobbyPlayers, this.roomCode);
    const msg = {
      type: 'lobby_update',
      players: this.lobbyPlayers,
      roomCode: this.roomCode,
    };
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg);
    }
  }

  broadcastMatchStart(snapshot) {
    const msg = { type: 'start_match', snapshot };
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg);
    }
  }

  broadcastSnapshot(snapshot) {
    const msg = { type: 'world_snapshot', snapshot };
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg);
    }
  }

  sendToHost(msg) {
    if (this.isHost) {
      this.onClientMessage?.(this.myId, msg);
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(msg);
    }
  }

  cleanup() {
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
  }
}
