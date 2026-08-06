import { useRef, useEffect, useCallback, useState } from 'react';
import { socket } from '../socket';

interface UseWebRTCOptions {
  isHost: boolean;
  hostId: string | null;
  localStream: MediaStream | null;
  onVoiceStatusChange?: (isMuted: boolean, isDeafened: boolean) => void;
}

const peerConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
};

const MAX_VIDEO_BITRATE_BPS = 1500 * 1000; // 1.5 Mbps

async function applyBitrateLimit(pc: RTCPeerConnection, maxBitrateBps: number) {
  try {
    const senders = pc.getSenders();
    for (const sender of senders) {
      if (sender.track && sender.track.kind === 'video') {
        const parameters = sender.getParameters();
        if (!parameters.encodings || parameters.encodings.length === 0) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = maxBitrateBps;
        await sender.setParameters(parameters);
      }
    }
  } catch (err) {
    console.warn('[WebRTC] Failed to set RTCRtpSender parameters:', err);
  }
}

export function useWebRTC({ isHost, hostId, localStream, onVoiceStatusChange }: UseWebRTCOptions) {
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const voicePeers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStream = useRef<MediaStream | null>(null);
  const onRemoteStreamRef = useRef<((stream: MediaStream) => void) | null>(null);

  // Voice & Video Chat states
  const [voiceActive, setVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null);

  const toggleMic = useCallback(() => {
    if (voiceStream) {
      const audioTrack = voiceStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsMuted(newMuted);
        if (onVoiceStatusChange) onVoiceStatusChange(newMuted, isDeafened);
      }
    }
  }, [voiceStream, isDeafened, onVoiceStatusChange]);

  const toggleCamera = useCallback(async () => {
    if (!voiceStream) return;
    const existingVideo = voiceStream.getVideoTracks()[0];
    if (existingVideo) {
      existingVideo.enabled = !existingVideo.enabled;
      setIsCameraActive(existingVideo.enabled);
    } else {
      try {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, frameRate: 30 }
        });
        const vTrack = webcamStream.getVideoTracks()[0];
        if (vTrack) {
          voiceStream.addTrack(vTrack);
          setIsCameraActive(true);
        }
      } catch (err) {
        console.warn('[WebRTC] Webcam capture failed:', err);
      }
    }
  }, [voiceStream]);

  const renegotiate = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await applyBitrateLimit(pc, MAX_VIDEO_BITRATE_BPS);
      socket.emit('webrtc-offer', { targetId: peerId, offer });
    } catch (err) {
      console.warn('[WebRTC] Re-negotiation failed:', err);
    }
  }, []);

  const localStreamRef = useRef<MediaStream | null>(localStream);
  useEffect(() => {
    localStreamRef.current = localStream;

    if (isHost && localStream && peers.current.size > 0) {
      const peerIds = Array.from(peers.current.keys());
      for (const peerId of peerIds) {
        const pc = peers.current.get(peerId);
        if (!pc) continue;
        
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
          const existingSender = senders.find(s => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track).catch(err => {
              console.warn('[WebRTC] Failed to replace track:', err);
            });
          } else {
            pc.addTrack(track, localStream);
          }
        });

        applyBitrateLimit(pc, MAX_VIDEO_BITRATE_BPS);

        const newTrackCount = localStream.getTracks().length;
        const senderCount = senders.filter(s => s.track).length;
        if (newTrackCount > senderCount) {
          renegotiate(peerId, pc);
        }
      }
    }
  }, [localStream, isHost, renegotiate]);

  const setOnRemoteStream = useCallback((cb: (stream: MediaStream) => void) => {
    onRemoteStreamRef.current = cb;
  }, []);

  // Video Peer Creation
  const createHostPeer = useCallback(async (peerId: string, stream: MediaStream) => {
    const existing = peers.current.get(peerId);
    if (existing) { existing.close(); peers.current.delete(peerId); }

    const pc = new RTCPeerConnection(peerConfig);
    peers.current.set(peerId, pc);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('webrtc-ice-candidate', { targetId: peerId, candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.close();
        peers.current.delete(peerId);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        await applyBitrateLimit(pc, MAX_VIDEO_BITRATE_BPS);
        socket.emit('webrtc-offer', { targetId: peerId, offer });
      } catch (err) {
        console.warn('[WebRTC] onnegotiationneeded failed:', err);
      }
    };

    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  }, []);

  const createGuestPeer = useCallback((senderId: string) => {
    const existing = peers.current.get(senderId);
    if (existing) { existing.close(); peers.current.delete(senderId); }

    const pc = new RTCPeerConnection(peerConfig);
    peers.current.set(senderId, pc);

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        remoteStream.current = e.streams[0];
      } else {
        if (!remoteStream.current) remoteStream.current = new MediaStream();
        remoteStream.current.addTrack(e.track);
      }
      if (onRemoteStreamRef.current && remoteStream.current) {
        onRemoteStreamRef.current(remoteStream.current);
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('webrtc-ice-candidate', { targetId: senderId, candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.close();
        peers.current.delete(senderId);
      }
    };

    return pc;
  }, []);

  // Voice Chat Signaling & Controls
  const toggleDeafen = useCallback(() => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    if (onVoiceStatusChange) onVoiceStatusChange(isMuted, newDeafened);

    // Mute/unmute all incoming audio elements from voice peers
    document.querySelectorAll('.voice-audio-elem').forEach((elem) => {
      (elem as HTMLAudioElement).muted = newDeafened;
    });
  }, [isDeafened, isMuted, onVoiceStatusChange]);

  const joinVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setVoiceStream(stream);
      setVoiceActive(true);
      setIsMuted(false);
      setIsDeafened(false);
      if (onVoiceStatusChange) onVoiceStatusChange(false, false);
    } catch (err) {
      console.warn('[VoiceChat] Microphone permission denied or unavailable:', err);
    }
  }, [onVoiceStatusChange]);

  const leaveVoice = useCallback(() => {
    if (voiceStream) {
      voiceStream.getTracks().forEach(t => t.stop());
      setVoiceStream(null);
    }
    voicePeers.current.forEach(pc => pc.close());
    voicePeers.current.clear();
    setVoiceActive(false);
    setIsMuted(true);
    if (onVoiceStatusChange) onVoiceStatusChange(true, isDeafened);
  }, [voiceStream, isDeafened, onVoiceStatusChange]);

  // Video Socket signaling listeners
  useEffect(() => {
    socket.on('peer-needs-stream', async ({ peerId }: { peerId: string }) => {
      if (!isHost) return;
      const stream = localStreamRef.current;
      if (!stream || stream.getTracks().length === 0) return;
      await createHostPeer(peerId, stream);
    });

    socket.on('webrtc-offer', async ({ senderId, offer }: { senderId: string; offer: RTCSessionDescriptionInit }) => {
      if (isHost) return;
      let pc = peers.current.get(senderId);
      if (pc && pc.signalingState !== 'closed') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { targetId: senderId, answer });
          return;
        } catch (err) {
          console.warn('[WebRTC] Re-negotiation failed, creating new peer:', err);
        }
      }
      pc = createGuestPeer(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { targetId: senderId, answer });
    });

    socket.on('webrtc-answer', async ({ senderId, answer }: { senderId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peers.current.get(senderId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('webrtc-ice-candidate', async ({ senderId, candidate }: { senderId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peers.current.get(senderId);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch { /* ignore */ }
      }
    });

    return () => {
      socket.off('peer-needs-stream');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
    };
  }, [isHost, createHostPeer, createGuestPeer]);

  const requestStream = useCallback(() => {
    if (!isHost && hostId) {
      socket.emit('request-stream');
    }
  }, [isHost, hostId]);

  useEffect(() => {
    const currentPeers = peers.current;
    const currentVoicePeers = voicePeers.current;
    return () => {
      currentPeers.forEach(pc => pc.close());
      currentPeers.clear();
      currentVoicePeers.forEach(pc => pc.close());
      currentVoicePeers.clear();
    };
  }, []);

  return {
    requestStream,
    setOnRemoteStream,
    remoteStream,
    voiceActive,
    isMuted,
    isDeafened,
    isCameraActive,
    joinVoice,
    leaveVoice,
    toggleMic,
    toggleCamera,
    toggleDeafen
  };
}
