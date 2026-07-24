import './App.css';
import { useState, useEffect } from 'react';
import { useRoom } from './hooks/useRoom';
import { Lobby } from './components/Lobby/Lobby';
import { Room } from './components/Room/Room';
import { SplashScreen } from './components/Skeleton/Skeleton';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  const {
    state,
    createRoom,
    joinRoom,
    updateUserProfile,
    leaveRoom,
    sendChat,
    sendReaction,
    updatePlaylist,
    playNextInPlaylist,
    updateVoiceStatus,
    changeSource,
    changeSubtitles,
    togglePermissions,
    emitPlay,
    emitPause,
    emitSeek,
  } = useRoom();

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => setShowSplash(false), 400);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  async function handleCreateRoom(username: string, avatar?: string, statusMessage?: string) {
    await createRoom({ username, avatar, statusMessage });
  }

  async function handleJoinRoom(username: string, roomCode: string, avatar?: string, statusMessage?: string) {
    await joinRoom({ username, roomCode, avatar, statusMessage });
  }

  if (showSplash) {
    return (
      <div className={splashFading ? 'splash-screen fade-out' : ''}>
        <SplashScreen />
      </div>
    );
  }

  if (state.roomCode) {
    return (
      <Room
        state={state}
        onLeave={leaveRoom}
        onSendChat={sendChat}
        onSendReaction={sendReaction}
        onUpdatePlaylist={updatePlaylist}
        onPlayNextInPlaylist={playNextInPlaylist}
        onUpdateVoiceStatus={updateVoiceStatus}
        onUpdateUserProfile={updateUserProfile}
        onChangeSource={changeSource}
        onChangeSubtitles={changeSubtitles}
        onTogglePermissions={togglePermissions}
        onEmitPlay={emitPlay}
        onEmitPause={emitPause}
        onEmitSeek={emitSeek}
      />
    );
  }

  return (
    <Lobby
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
}

export default App;
