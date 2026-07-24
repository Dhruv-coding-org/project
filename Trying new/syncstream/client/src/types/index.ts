export interface RoomUser {
  socketId: string;
  username: string;
  isHost: boolean;
}

export interface VideoSource {
  sourceType: 'url' | 'file';
  url: string;
  subtitleText?: string;
  subtitleName?: string;
}

export interface PlaybackState {
  playing: boolean;
  currentTime: number;
  serverTimestamp?: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  senderId: string;
  isMine: boolean;
}

export interface RoomState {
  roomCode: string | null;
  username: string;
  isHost: boolean;
  users: RoomUser[];
  hostId: string | null;
  videoSource: VideoSource | null;
  playbackState: PlaybackState;
  chatMessages: ChatMessage[];
  connected: boolean;
  error: string | null;
  subtitleText: string | null;
  controlsOpen: boolean;
}
