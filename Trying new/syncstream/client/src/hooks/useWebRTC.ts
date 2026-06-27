import { useRef, useEffect, useCallback } from 'react';
import { socket } from '../socket';

interface UseWebRTCOptions {
  isHost: boolean;
  hostId: string | null;
  localStream: MediaStream | null;
}

const peerConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC({ isHost, hostId, localStream }: UseWebRTCOptions) {
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStream = useRef<MediaStream | null>(null);
  const onRemoteStreamRef = useRef<((stream: MediaStream) => void) | null>(null);

  // ── Keep a ref to localStream that's always current ──────────────
  const localStreamRef = useRef<MediaStream | null>(localStream);
  useEffect(() => {
    localStreamRef.current = localStream;

    // If stream changes and we have existing peers, re-negotiate with new stream
    if (isHost && localStream && peers.current.size > 0) {
      console.log('[WebRTC] Stream updated — re-negotiating with existing peers');
      const peerIds = Array.from(peers.current.keys());
      for (const peerId of peerIds) {
        const pc = peers.current.get(peerId);
        if (!pc) continue;
        
        // Replace tracks on existing peer connection
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
          const existingSender = senders.find(s => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track).catch(err => {
              console.warn('[WebRTC] Failed to replace track:', err);
            });
          } else {
            // New track type (e.g., audio track arriving late) — add it
            pc.addTrack(track, localStream);
            console.log('[WebRTC] Added new', track.kind, 'track to existing peer', peerId);
          }
        });

        // If new tracks were added, we need to re-negotiate
        const newTrackCount = localStream.getTracks().length;
        const senderCount = senders.filter(s => s.track).length;
        if (newTrackCount > senderCount) {
          renegotiate(peerId, pc);
        }
      }
    }
  }, [localStream, isHost]);

  // Re-negotiate a peer connection after adding new tracks
  async function renegotiate(peerId: string, pc: RTCPeerConnection) {
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { targetId: peerId, offer });
      console.log('[WebRTC] Re-negotiation offer sent to', peerId);
    } catch (err) {
      console.warn('[WebRTC] Re-negotiation failed:', err);
    }
  }

  const setOnRemoteStream = useCallback((cb: (stream: MediaStream) => void) => {
    onRemoteStreamRef.current = cb;
  }, []);

  // ── Create peer for the host (sending side) ──────────────────────
  const createHostPeer = useCallback(async (peerId: string, stream: MediaStream) => {
    // Close any existing peer for this user
    const existing = peers.current.get(peerId);
    if (existing) { existing.close(); peers.current.delete(peerId); }

    const pc = new RTCPeerConnection(peerConfig);
    peers.current.set(peerId, pc);

    // Add all tracks (video + audio)
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc-ice-candidate', { targetId: peerId, candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.close();
        peers.current.delete(peerId);
      }
    };

    // Handle re-negotiation from remote side
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { targetId: peerId, offer });
      } catch (err) {
        console.warn('[WebRTC] onnegotiationneeded failed:', err);
      }
    };

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    socket.emit('webrtc-offer', { targetId: peerId, offer });
  }, []);

  // ── Create peer for the guest (receiving side) ───────────────────
  const createGuestPeer = useCallback((senderId: string) => {
    const existing = peers.current.get(senderId);
    if (existing) { existing.close(); peers.current.delete(senderId); }

    const pc = new RTCPeerConnection(peerConfig);
    peers.current.set(senderId, pc);

    // Use the streams from the event — preserves audio+video together
    pc.ontrack = (e) => {
      console.log('[WebRTC] Received track:', e.track.kind, 'from', senderId);
      if (e.streams && e.streams[0]) {
        remoteStream.current = e.streams[0];
      } else {
        // Fallback: build our own stream from tracks
        if (!remoteStream.current) remoteStream.current = new MediaStream();
        remoteStream.current.addTrack(e.track);
      }
      if (onRemoteStreamRef.current && remoteStream.current) {
        onRemoteStreamRef.current(remoteStream.current);
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc-ice-candidate', { targetId: senderId, candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.close();
        peers.current.delete(senderId);
      }
    };

    return pc;
  }, []);

  // ── Socket signaling listeners ────────────────────────────────────
  useEffect(() => {
    // Host: a guest wants the stream
    socket.on('peer-needs-stream', async ({ peerId }: { peerId: string }) => {
      if (!isHost) return;
      const stream = localStreamRef.current;
      if (!stream || stream.getTracks().length === 0) {
        console.warn('[WebRTC] Host has no stream yet — guest will retry');
        return;
      }
      console.log('[WebRTC] Sending stream to peer', peerId, '| tracks:', stream.getTracks().map(t => t.kind));
      await createHostPeer(peerId, stream);
    });

    // Guest: receiving offer from host (initial or re-negotiation)
    socket.on('webrtc-offer', async ({ senderId, offer }: { senderId: string; offer: RTCSessionDescriptionInit }) => {
      if (isHost) return;
      console.log('[WebRTC] Received offer from', senderId);

      // Check if we already have a peer — if so, just update the description (re-negotiation)
      let pc = peers.current.get(senderId);
      if (pc && pc.signalingState !== 'closed') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { targetId: senderId, answer });
          console.log('[WebRTC] Re-negotiation answer sent');
          return;
        } catch (err) {
          console.warn('[WebRTC] Re-negotiation failed, creating new peer:', err);
        }
      }

      // Create new guest peer
      pc = createGuestPeer(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { targetId: senderId, answer });
    });

    // Host: receiving answer from guest
    socket.on('webrtc-answer', async ({ senderId, answer }: { senderId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peers.current.get(senderId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Both: ICE candidates
    socket.on('webrtc-ice-candidate', async ({ senderId, candidate }: { senderId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peers.current.get(senderId);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch { /* ignore stale candidates */ }
      }
    });

    return () => {
      socket.off('peer-needs-stream');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
    };
  // Only re-register if role changes — localStream is now via ref, no stale closure
  }, [isHost, createHostPeer, createGuestPeer]);

  // ── Request stream when guest needs file content ─────────────────
  const requestStream = useCallback(() => {
    if (!isHost && hostId) {
      console.log('[WebRTC] Guest requesting stream from host');
      socket.emit('request-stream');
    }
  }, [isHost, hostId]);

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    const currentPeers = peers.current;
    return () => {
      currentPeers.forEach(pc => pc.close());
      currentPeers.clear();
    };
  }, []);

  return { requestStream, setOnRemoteStream, remoteStream };
}
