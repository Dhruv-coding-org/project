# 🎥 SyncStream

> **SyncStream** is a high-performance, synchronized watch party platform built for Desktop (Electron) and Web/Mobile. Enjoy synchronized video playback, zero-RAM HTTP range streaming, real-time chat, interactive emoji reactions, and VLC player integration.

---

## ✨ Features

- ⚡ **Sub-Second Realtime Synchronization**: Automatic synchronization of Play, Pause, Seek, and Playback Speed across all connected room participants via Socket.IO.
- 🖥️ **Cross-Platform Desktop App**: Native Electron application with custom frameless window styling, window controls, and keyboard shortcuts.
- 🎬 **Advanced Video Player (Plyr)**: Custom-themed video player supporting local files, remote URLs, direct streams, auto-extracted subtitles (VTT), and multiple audio tracks.
- 🚀 **Zero-RAM HTTP Range Streaming**: Built-in streaming backend using HTTP 206 range requests with `fluent-ffmpeg` and `@ffmpeg-installer/ffmpeg` to stream 4GB+ files effortlessly with minimal memory usage.
- 📺 **VLC Remote Sync**: Sync playback directly with local VLC Media Player via its built-in HTTP API.
- 💬 **Live In-Room Chat**: Integrated real-time room chat with markdown support, member presence, and avatar personalization.
- 🎉 **Interactive Floating Emoji Reactions**: Synced floating emoji animations that pop across participant screens in real time.
- 🌐 **Remote Tunneling Ready**: Auto-generates a secure LocalTunnel URL on server startup to allow mobile apps / remote friends to connect instantly.
- 🐳 **Production & Docker Ready**: Includes Docker Compose and PM2 configurations for seamless self-hosting.

---

## 🛠️ Tech Stack

| Area | Technologies |
| :--- | :--- |
| **Frontend / Client** | React 19, TypeScript, Vite, Plyr, Socket.IO Client, Lucide Icons, Capacitor |
| **Backend / Server** | Node.js, Express, Socket.IO, Fluent-FFmpeg, LocalTunnel |
| **Desktop Shell** | Electron 30, Electron Builder |
| **Styling** | Modern Vanilla CSS, Glassmorphism, CSS Custom Properties |

---

## 📂 Project Structure

```text
syncstream/
├── client/                 # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/     # UI Components (Player, Chat, Lobby, Playlist, Reactions, etc.)
│   │   ├── hooks/          # Custom hooks (useRoom, useSync, useSocket, etc.)
│   │   ├── utils/          # Helpers & formatters
│   │   ├── socket.ts       # Socket.IO connection client
│   │   └── index.css       # Global design system & theme tokens
│   └── vite.config.ts      # Vite configuration
├── server/                 # Node.js + Express + Socket.IO signaling backend
│   ├── src/
│   │   ├── handlers/       # WebSocket & HTTP stream handlers (chat, room, sync, vlc, webrtc)
│   │   ├── services/       # Room manager and state coordination
│   │   └── config/         # Server configuration & constants
│   └── server.js           # Server entry point & tunnel initialization
├── electron/               # Electron main process
│   └── main.js             # Window management & IPC bridges
├── docker-compose.yml      # Containerized deployment config
├── ecosystem.config.js     # PM2 process configuration
└── package.json            # Root workspaces and build scripts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [FFmpeg](https://ffmpeg.org/) (bundled automatically via `@ffmpeg-installer/ffmpeg`)

---

### Installation

1. Clone or navigate to the repository:
   ```bash
   cd "Trying new/syncstream"
   ```

2. Install root and sub-project dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

---

### Running the Application

#### 1. Full Desktop Development Mode (Single Command)
```bash
npm run electron:dev
```
*This automatically starts the backend server, Vite client, and Electron desktop window concurrently.*

#### 2. Web Development Mode (Single Command)
```bash
npm run dev
```
*This starts both the backend server and Vite web client concurrently. Visit `http://localhost:5173` in your browser.*

---

### 📦 Building for Production

Build the standalone Windows installer / desktop executable:
```bash
npm run dist
```
The compiled installer will be generated in the `dist-desktop/` folder. When running the installed desktop application or `npm start`, the app **automatically launches the embedded backend server on startup with zero configuration required**.

---

## ⚙️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run electron:dev` | **All-in-one desktop dev**: Launches backend server, Vite client, and Electron desktop shell with live reload |
| `npm run dev` | **All-in-one web dev**: Launches backend server and Vite web client concurrently |
| `npm run start` | Launches the Electron desktop app (automatically spins up the embedded backend server) |
| `npm run dist` | Builds client assets and packages the standalone Windows installer (`.exe`) |
| `npm run dev:server` | Starts only the Node.js signaling and streaming server on port `3001` |
| `npm run dev:client` | Starts only the Vite development server for the web interface |
| `npm run server:start` | Starts the server in background via PM2 (`ecosystem.config.js`) |
| `npm run server:stop` | Stops the PM2 background server process |
| `npm run server:status` | Checks PM2 process status |

---

## 🔒 Configuration

- **Default Server Port**: `3001`
- **Default Client Port**: `5173`
- **Remote Server URL Override**: Configure `VITE_SERVER_URL` in `client/.env` or enter your custom tunnel/IP directly in the app settings.

---

## 📄 License

MIT License © SyncStream
