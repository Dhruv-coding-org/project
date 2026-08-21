import { useRef, useEffect, useCallback, useState } from 'react';
import { socket } from '../socket';

interface UseWebRTCOptions {
  isHost: boolean;
  hostId: string | null;
  localStream: MediaStream | null;
  onVoiceStatusChange?: (isMuted: boolean, isDeafened: boolean) => void;
}

const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  } else {
    // Fallback to the free metered TURN server if no env vars are provided
    servers.push({
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    });
  }
  
  return servers;
};

const peerConfig: RTCConfiguration = {
  iceServers: getIceServers(),
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

  const pendingPeers = useRef<Set<string>>(new Set());

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

  const localStreamRef = useRef<MediaStream | null>(localStream);
  useEffect(() => {
    localStreamRef.current = localStream;

    if (isHost && localStream && localStream.getTracks().length > 0) {
      // 1. Fulfill any pending peer requests
      if (pendingPeers.current.size > 0) {
        pendingPeers.current.forEach(peerId => {
          createHostPeer(peerId, localStream);
        });
        pendingPeers.current.clear();
      }

      // 2. Update tracks for existing peers
      if (peers.current.size > 0) {
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
    }
  }, [localStream, isHost, renegotiate, createHostPeer]);

  const setOnRemoteStream = useCallback((cb: (stream: MediaStream) => void) => {
    onRemoteStreamRef.current = cb;
  }, []);

  // Guest Peer Creation

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

  const voiceStreamRef = useRef<MediaStream | null>(null);

  const createVoicePeer = useCallback((peerId: string, isInitiator: boolean, stream: MediaStream) => {
    let pc = voicePeers.current.get(peerId);
    if (pc) {
      pc.close();
      voicePeers.current.delete(peerId);
    }
    pc = new RTCPeerConnection(peerConfig);
    voicePeers.current.set(peerId, pc);

    stream.getTracks().forEach(track => pc!.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('voice-ice-candidate', { targetId: peerId, candidate });
    };

    pc.ontrack = (e) => {
      const audioId = `voice-audio-${peerId}`;
      let audioEl = document.getElementById(audioId) as HTMLAudioElement;
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = audioId;
        audioEl.className = 'voice-audio-elem';
        audioEl.autoplay = true;
        audioEl.muted = isDeafened;
        document.body.appendChild(audioEl);
      }
      if (e.streams && e.streams[0]) {
        audioEl.srcObject = e.streams[0];
      } else {
        const tempStream = new MediaStream();
        tempStream.addTrack(e.track);
        audioEl.srcObject = tempStream;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === 'failed' || pc!.connectionState === 'closed') {
        pc!.close();
        voicePeers.current.delete(peerId);
        const el = document.getElementById(`voice-audio-${peerId}`);
        if (el) el.remove();
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc!.createOffer();
          await pc!.setLocalDescription(offer);
          socket.emit('voice-offer', { targetId: peerId, offer });
        } catch (err) {
          console.warn('[VoiceChat] Negotiation failed:', err);
        }
      };
    }
    return pc;
  }, [isDeafened]);

  const joinVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setVoiceStream(stream);
      voiceStreamRef.current = stream;
      setVoiceActive(true);
      setIsMuted(false);
      setIsDeafened(false);
      if (onVoiceStatusChange) onVoiceStatusChange(false, false);
      
      socket.emit('voice-join');
    } catch (err) {
      console.warn('[VoiceChat] Microphone permission denied or unavailable:', err);
    }
  }, [onVoiceStatusChange]);

  const leaveVoice = useCallback(() => {
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(t => t.stop());
      voiceStreamRef.current = null;
      setVoiceStream(null);
    }
    voicePeers.current.forEach((pc, peerId) => {
      pc.close();
      const el = document.getElementById(`voice-audio-${peerId}`);
      if (el) el.remove();
    });
    voicePeers.current.clear();
    setVoiceActive(false);
    setIsMuted(true);
    if (onVoiceStatusChange) onVoiceStatusChange(true, isDeafened);
  }, [isDeafened, onVoiceStatusChange]);

  // Video Socket signaling listeners
  useEffect(() => {
    socket.on('peer-needs-stream', async ({ peerId }: { peerId: string }) => {
      if (!isHost) return;
      const stream = localStreamRef.current;
      if (!stream || stream.getTracks().length === 0) {
        pendingPeers.current.add(peerId);
        return;
      }
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

    socket.on('voice-joined', async ({ senderId }: { senderId: string }) => {
      if (voiceStreamRef.current) {
        createVoicePeer(senderId, true, voiceStreamRef.current);
      }
    });

    socket.on('voice-offer', async ({ senderId, offer }: { senderId: string; offer: RTCSessionDescriptionInit }) => {
      if (!voiceStreamRef.current) return;
      let pc = voicePeers.current.get(senderId);
      if (!pc || pc.signalingState === 'closed') {
        pc = createVoicePeer(senderId, false, voiceStreamRef.current);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice-answer', { targetId: senderId, answer });
    });

    socket.on('voice-answer', async ({ senderId, answer }: { senderId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = voicePeers.current.get(senderId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('voice-ice-candidate', async ({ senderId, candidate }: { senderId: string; candidate: RTCIceCandidateInit }) => {
      const pc = voicePeers.current.get(senderId);
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
      socket.off('voice-joined');
      socket.off('voice-offer');
      socket.off('voice-answer');
      socket.off('voice-ice-candidate');
    };
  }, [isHost, createHostPeer, createGuestPeer, createVoicePeer]);

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
