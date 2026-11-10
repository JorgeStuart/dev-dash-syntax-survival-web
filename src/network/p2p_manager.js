import Peer from 'peerjs';

const PLAYER_COLORS = ['#00e5ff', '#ff2d95', '#33ff88', '#ffb020', '#a855f7', '#38bdf8', '#f43f5e', '#eab308'];

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

  createRoom(playerName, devClass) {
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
          devClass,
          color: PLAYER_COLORS[0],
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
            const colorIdx = this.lobbyPlayers.length % PLAYER_COLORS.length;
            this.lobbyPlayers.push({
              id: conn.peer,
              name: msg.name || `Dev_${this.lobbyPlayers.length + 1}`,
              devClass: msg.devClass,
              color: PLAYER_COLORS[colorIdx],
              isHost: false,
              isBot: false,
            });
            this.broadcastLobby();
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

  joinRoom(roomCodeInput, playerName, devClass) {
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

  updateHostProfile(name, devClass) {
    if (!this.isHost || this.lobbyPlayers.length === 0) return;
    this.lobbyPlayers[0].name = name;
    this.lobbyPlayers[0].devClass = devClass;
    this.broadcastLobby();
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
