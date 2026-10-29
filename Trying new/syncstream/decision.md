# Decision Record & Architecture Guide: SyncStream

## 1. Overview & Purpose
**SyncStream** is a real-time collaborative watch-party platform available as both a native desktop application (via Electron) and a web client. It enables groups of users to watch videos simultaneously with millisecond-accurate playback synchronization, integrated WebRTC voice/video calls, live text chat with flying emoji reactions, multi-source playlist queues, and subtitle support.

---

## 2. Architecture & Component Guide

### 2.1 Monorepo / Multi-Tier Structure
```
syncstream/
├── client/           # React 18 + Vite + TypeScript frontend
├── server/           # Node.js + Express + Socket.IO real-time backend
├── electron/         # Electron 30 desktop wrapper and native windowing
└── dist-desktop/     # Packaged Windows installer (NSIS executable)
```

### 2.2 Server Architecture (`server/`)
- **[server.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/server.js)**: Central HTTP & WebSocket server. Runs on port `3001` or as a background service via PM2 / Docker.
- **[src/services/roomManager.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/src/services/roomManager.js)**:
  - Manages active watch party rooms, host permissions, participant lists, and playlist state.
  - Automatically reclaims memory by cleaning up empty rooms after grace periods.
- **[src/handlers/syncHandler.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/src/handlers/syncHandler.js)**:
  - Handles `video:play`, `video:pause`, `video:seek`, and `video:rate` broadcasts.
  - Employs a drift-compensation algorithm that synchronizes client timestamps without stutter.
- **[src/handlers/roomHandler.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/src/handlers/roomHandler.js)**: Room creation using 6-character room codes, host control locks (permitting or restricting guest seeking), and user join/leave lifecycles.
- **[src/handlers/chatHandler.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/src/handlers/chatHandler.js)**: Delivers chat messages, system alerts, and real-time floating emoji bursts.
- **[src/handlers/webrtcHandler.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/src/handlers/webrtcHandler.js)**: Acts as the WebRTC signaling exchange (SDP offers/answers and ICE candidates) for voice/video mesh rooms.
- **[src/handlers/vlcHandler.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/server/src/handlers/vlcHandler.js)**: Remote control bridge for local VLC media players.

### 2.3 Client Architecture (`client/src/`)
- **[components/VideoPlayer/VideoPlayer.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/client/src/components/VideoPlayer/VideoPlayer.tsx)**:
  - Multi-source player supporting direct MP4/WebM/HLS URLs, YouTube embeds, and local files.
  - Custom subtitle engine supporting SRT, VTT, and native YouTube CC track switching.
  - Subtitle parser ([subtitleParser.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/client/src/utils/subtitleParser.ts)) with subtitle synchronization offset adjustment.
  - YouTube embed restriction bypass that leverages Electron headers or smart fallback in browsers.
- **[components/Playlist/PlaylistModal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/client/src/components/Playlist/PlaylistModal.tsx)**:
  - Collaborative queue with drag-and-drop reordering.
  - Auto-plays the next queued video upon current video completion.
- **[components/Lobby/Lobby.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/client/src/components/Lobby/Lobby.tsx)**: Modern room creation and joining interface.
- **[components/ServerConfig/ServerConfigModal.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/client/src/components/ServerConfig/ServerConfigModal.tsx)**: Allows switching between cloud server URLs and local dev servers.
- **[components/ThemeToggle/ThemeToggle.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/client/src/components/ThemeToggle/ThemeToggle.tsx)**: Switch between fiery and dark/light UI modes.

### 2.4 Desktop Wrapper (`electron/`)
- **[electron/main.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/electron/main.js)**: Electron runtime setting up browser windows, handling user-agent modifications to avoid YouTube "Sign-in required to confirm you're not a bot" embed blocks, and registering hardware acceleration.
- **[electron/preload.js](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/syncstream/electron/preload.js)**: Context isolation bridge providing safe IPC access for desktop features.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `d374753` & `4e511fc` | Theme modernization | Replaced purple neon scheme with elegant aurora green and polished dark/light mode toggles. |
| `6c5487a` | Lobby visual clean-up | Removed cluttered emojis from Create Room and Join Room tabs for a sleek, premium look. |
| `d5bf94c` | Cloud & Desktop Backend Unification | Connected desktop and browser clients to the shared cloud backend so users can join the same rooms regardless of platform. |
| `460c218` | YouTube embed restriction bypass | Modified headers in Electron and implemented fallback players for restricted YouTube videos. |
| `54d5201` | YouTube subtitle toggling & CC track picker | Added closed-caption track selection directly inside the synced player interface. |
| `2e0d5e0` | Guest subtitle controls & queue autoplay | Allowed participants to toggle subtitles independently when unlocked and added automatic playback of the next queued video. |
| `716bd96` | Strict typing in VideoPlayer | Eliminated implicit and explicit `any` types to prevent runtime errors during media event handling. |
| `280f57d` | Render loop fix in `ServerConfigModal` | Eliminated cascading `setState` calls in `useEffect` hook that caused high CPU usage. |
| `c840b77` | Theme update | Introduced dynamic fiery accent effects across the UI. |
| `c4a262f`, `052b3ff`, `5290eb4` | Video playback & sync engine stabilization | Fixed sync race conditions, seek jitter, and video pause event synchronization across multiple peers. |
| Hardening & Polish | Keyboard Accessibility & Connection Resilience | Added modifier key collision safeguards, keyboard seeking (Left/Right 5s, J/L 10s), volume up/down shortcuts (5%), ARIA player region semantics, updated shortcuts documentation, and handled socket connection error resilience in `useRoom.ts`. |

---

## 4. Usage & Running Instructions

### Running Locally (Web + Server)
```bash
cd "Trying new/syncstream"
# Start both client and server concurrently:
npm run dev
```
- Client runs on `http://localhost:5173`.
- Server runs on `http://localhost:3001`.

### Running Desktop App (Electron)
```bash
npm run electron:dev
```

### Packaging Windows Installer
```bash
npm run dist
```
Generates NSIS installer executable under `dist-desktop/`.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `syncstream`:
1. Document changes in the **Key Architectural Decisions & Change History** table.
2. If new Socket.IO events or sync properties are added, update both `server/src/handlers/syncHandler.js` and `client/src/socket.ts` / `useRoom.ts`.
3. Test that changes function across both the browser web app and the Electron desktop application.
