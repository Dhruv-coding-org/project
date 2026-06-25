import './App.css';
import { useRoom } from './hooks/useRoom';
import { Lobby } from './components/Lobby/Lobby';
import { Room } from './components/Room/Room';

function App() {
  const {
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChat,
    changeSource,
    emitPlay,
    emitPause,
    emitSeek,
  } = useRoom();

  async function handleCreateRoom(username: string) {
    await createRoom({ username });
  }

  async function handleJoinRoom(username: string, roomCode: string) {
    await joinRoom({ username, roomCode });
  }

  if (state.roomCode) {
    return (
      <Room
        state={state}
        onLeave={leaveRoom}
        onSendChat={sendChat}
        onChangeSource={changeSource}
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
