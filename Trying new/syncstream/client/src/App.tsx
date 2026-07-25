import './App.css';
import { useState, useEffect } from 'react';
import { useRoom, getActiveSession } from './hooks/useRoom';
import { Lobby } from './components/Lobby/Lobby';
import { Room } from './components/Room/Room';
import { ProfilePage } from './components/Profile/ProfilePage';
import { SplashScreen } from './components/Skeleton/Skeleton';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(false);

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
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-session recovery on page refresh (F5 Guard)
  useEffect(() => {
    const session = getActiveSession();
    if (session && session.roomCode && session.username && !state.roomCode) {
      console.log('[App] Restoring session from sessionStorage:', session.roomCode);
      joinRoom({ username: session.username, roomCode: session.roomCode, avatar: session.avatar }).catch(() => {});
    }
  }, [joinRoom, state.roomCode]);

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

  if (viewingProfile) {
    return (
      <ProfilePage
        onBack={() => setViewingProfile(false)}
        onLaunchVideo={(source) => {
          changeSource(source);
          setViewingProfile(false);
        }}
      />
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
      onOpenProfile={() => setViewingProfile(true)}
    />
  );
}

export default App;
