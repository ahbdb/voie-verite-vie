import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
  ],
};

export interface VideoRoomRecord {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  status: string;
  room_type: 'video' | 'audio' | string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoParticipantRecord {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string | null;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
}

interface VideoSignalRecord {
  id: string;
  room_id: string;
  sender_id: string;
  recipient_id: string | null;
  signal_type: 'offer' | 'answer' | 'ice-candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

export interface RemoteVideoStream {
  userId: string;
  displayName: string;
  stream: MediaStream;
}

export interface VideoRoomMessageRecord {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface VideoMessageReactionRecord {
  id: string;
  message_id: string;
  room_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface UseAdminVideoRoomOptions {
  roomId?: string;
  userId?: string;
  displayName?: string;
  enabled: boolean;
  canManageRoom?: boolean;
}

export const useAdminVideoRoom = ({
  roomId,
  userId,
  displayName,
  enabled,
  canManageRoom = false,
}: UseAdminVideoRoomOptions) => {
  const [room, setRoom] = useState<VideoRoomRecord | null>(null);
  const [participants, setParticipants] = useState<VideoParticipantRecord[]>([]);
  const [messages, setMessages] = useState<VideoRoomMessageRecord[]>([]);
  const [reactions, setReactions] = useState<VideoMessageReactionRecord[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteVideoStream[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const channelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const initiatedPeersRef = useRef<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const joinedRef = useRef(false);
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const participantsRef = useRef<VideoParticipantRecord[]>([]);
  const disconnectTimersRef = useRef<Map<string, number>>(new Map());

  const roomType = room?.room_type ?? 'video';
  const canShareScreen =
    roomType !== 'audio' && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia);

  const activeParticipants = useMemo(
    () => participants.filter((participant) => participant.is_active && !participant.left_at),
    [participants]
  );

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const getParticipantLabel = useCallback((participantId: string) => {
    const participant = participantsRef.current.find((entry) => entry.user_id === participantId);
    return participant?.display_name || 'Participant';
  }, []);

  const loadRoom = useCallback(async () => {
    if (!roomId) return null;

    const { data, error } = await db.from('video_rooms').select('*').eq('id', roomId).single();

    if (error) {
      throw error;
    }

    setRoom(data as VideoRoomRecord);
    return data as VideoRoomRecord;
  }, [roomId]);

  const loadParticipants = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await db
      .from('video_room_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw error;
    }

    setParticipants((data || []) as VideoParticipantRecord[]);
  }, [roomId]);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await db
      .from('video_room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    setMessages((data || []) as VideoRoomMessageRecord[]);
  }, [roomId]);

  const loadReactions = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await db
      .from('video_message_reactions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    setReactions((data || []) as VideoMessageReactionRecord[]);
  }, [roomId]);

  const sendSignal = useCallback(
    async (
      signalType: VideoSignalRecord['signal_type'],
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit,
      recipientId?: string
    ) => {
      if (!roomId || !userId) return;

      const { error } = await db.from('video_room_signals').insert({
        room_id: roomId,
        sender_id: userId,
        recipient_id: recipientId ?? null,
        signal_type: signalType,
        payload,
      });

      if (error) {
        console.error('[video-room] Failed to send signal', error);
      }
    },
    [roomId, userId]
  );

  const upsertRemoteStream = useCallback(
    (participantId: string, stream: MediaStream) => {
      setRemoteStreams((current) => {
        const label = getParticipantLabel(participantId);
        const existing = current.find((entry) => entry.userId === participantId);

        if (existing) {
          return current.map((entry) =>
            entry.userId === participantId ? { ...entry, stream, displayName: label } : entry
          );
        }

        return [
          ...current,
          {
            userId: participantId,
            displayName: label,
            stream,
          },
        ];
      });
    },
    [getParticipantLabel]
  );

  const removePeer = useCallback((participantId: string) => {
    const disconnectTimer = disconnectTimersRef.current.get(participantId);
    if (disconnectTimer) {
      window.clearTimeout(disconnectTimer);
      disconnectTimersRef.current.delete(participantId);
    }

    const existing = peerConnectionsRef.current.get(participantId);
    if (existing) {
      existing.onicecandidate = null;
      existing.ontrack = null;
      existing.onconnectionstatechange = null;
      existing.close();
      peerConnectionsRef.current.delete(participantId);
    }

    pendingIceCandidatesRef.current.delete(participantId);
    initiatedPeersRef.current.delete(participantId);
    setRemoteStreams((current) => current.filter((entry) => entry.userId !== participantId));
  }, []);

  const flushPendingIceCandidates = useCallback(async (participantId: string, connection: RTCPeerConnection) => {
    const pending = pendingIceCandidatesRef.current.get(participantId) || [];

    if (pending.length === 0 || !connection.remoteDescription) {
      return;
    }

    for (const candidate of pending) {
      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        console.warn('[video-room] Failed to flush ICE candidate', error);
      }
    }

    pendingIceCandidatesRef.current.delete(participantId);
  }, []);

  const createPeerConnection = useCallback(
    (participantId: string) => {
      const existing = peerConnectionsRef.current.get(participantId);
      if (existing) {
        return existing;
      }

      const connection = new RTCPeerConnection(RTC_CONFIGURATION);

      localStreamRef.current?.getTracks().forEach((track) => {
        connection.addTrack(track, localStreamRef.current as MediaStream);
      });

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          void sendSignal('ice-candidate', event.candidate.toJSON(), participantId);
        }
      };

      connection.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          upsertRemoteStream(participantId, stream);
        }
      };

      connection.onconnectionstatechange = () => {
        const state = connection.connectionState;
        const existingTimer = disconnectTimersRef.current.get(participantId);

        if (state === 'connected') {
          if (existingTimer) {
            window.clearTimeout(existingTimer);
            disconnectTimersRef.current.delete(participantId);
          }
          return;
        }

        if (state === 'disconnected') {
          if (!existingTimer) {
            const timeoutId = window.setTimeout(() => {
              if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
                removePeer(participantId);
              }
              disconnectTimersRef.current.delete(participantId);
            }, 6000);

            disconnectTimersRef.current.set(participantId, timeoutId);
          }
          return;
        }

        if (state === 'failed' || state === 'closed') {
          if (existingTimer) {
            window.clearTimeout(existingTimer);
            disconnectTimersRef.current.delete(participantId);
          }
          removePeer(participantId);
        }
      };

      peerConnectionsRef.current.set(participantId, connection);
      return connection;
    },
    [removePeer, sendSignal, upsertRemoteStream]
  );

  const createOfferForParticipant = useCallback(
    async (participantId: string) => {
      const connection = createPeerConnection(participantId);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      await sendSignal('offer', offer, participantId);
      initiatedPeersRef.current.add(participantId);
    },
    [createPeerConnection, sendSignal]
  );

  const replaceOutgoingVideoTrack = useCallback(async (track: MediaStreamTrack | null) => {
    const updates = Array.from(peerConnectionsRef.current.values()).map(async (connection) => {
      const sender = connection.getSenders().find((entry) => entry.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(track);
      }
    });

    await Promise.all(updates);
  }, []);

  const rebuildLocalStream = useCallback((videoTrack: MediaStreamTrack | null) => {
    const stream = new MediaStream();
    const audioTracks = localStreamRef.current?.getAudioTracks() || [];

    audioTracks.forEach((track) => stream.addTrack(track));
    if (videoTrack) {
      stream.addTrack(videoTrack);
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (!isScreenSharing) return;

    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    setIsScreenSharing(false);

    await replaceOutgoingVideoTrack(originalVideoTrackRef.current);
    rebuildLocalStream(originalVideoTrackRef.current);
    setCameraEnabled(Boolean(originalVideoTrackRef.current?.enabled));
  }, [isScreenSharing, rebuildLocalStream, replaceOutgoingVideoTrack]);

  const startScreenShare = useCallback(async () => {
    if (roomType === 'audio') {
      throw new Error('Partage d’écran indisponible pendant un appel audio.');
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Partage d’écran indisponible sur cet appareil.');
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const [screenTrack] = screenStream.getVideoTracks();

    if (!screenTrack) {
      throw new Error('Aucun flux écran détecté.');
    }

    screenTrackRef.current = screenTrack;
    setIsScreenSharing(true);
    await replaceOutgoingVideoTrack(screenTrack);
    rebuildLocalStream(screenTrack);
    setCameraEnabled(true);

    screenTrack.onended = () => {
      void stopScreenShare();
    };
  }, [rebuildLocalStream, replaceOutgoingVideoTrack, roomType, stopScreenShare]);

  const handleIncomingSignal = useCallback(
    async (signal: VideoSignalRecord) => {
      if (!userId || signal.sender_id === userId) {
        return;
      }

      if (signal.recipient_id && signal.recipient_id !== userId) {
        return;
      }

      const connection = createPeerConnection(signal.sender_id);

      if (signal.signal_type === 'offer') {
        await connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        await flushPendingIceCandidates(signal.sender_id, connection);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await sendSignal('answer', answer, signal.sender_id);
      }

      if (signal.signal_type === 'answer') {
        await connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        await flushPendingIceCandidates(signal.sender_id, connection);
      }

      if (signal.signal_type === 'ice-candidate') {
        const candidate = signal.payload as RTCIceCandidateInit;

        if (!connection.remoteDescription) {
          const queue = pendingIceCandidatesRef.current.get(signal.sender_id) || [];
          queue.push(candidate);
          pendingIceCandidatesRef.current.set(signal.sender_id, queue);
        } else {
          try {
            await connection.addIceCandidate(candidate);
          } catch (error) {
            console.warn('[video-room] ICE candidate ignored', error);
          }
        }
      }

      await db.from('video_room_signals').delete().eq('id', signal.id);
    },
    [createPeerConnection, flushPendingIceCandidates, sendSignal, userId]
  );

  const syncPeers = useCallback(async () => {
    if (!userId || !localStreamRef.current) return;

    const otherParticipants = activeParticipants.filter((participant) => participant.user_id !== userId);
    const activeIds = new Set(otherParticipants.map((participant) => participant.user_id));

    peerConnectionsRef.current.forEach((_, participantId) => {
      if (!activeIds.has(participantId)) {
        removePeer(participantId);
      }
    });

    for (const participant of otherParticipants) {
      if (!peerConnectionsRef.current.has(participant.user_id)) {
        createPeerConnection(participant.user_id);
      }

      const shouldInitiate = userId.localeCompare(participant.user_id) < 0;
      if (shouldInitiate && !initiatedPeersRef.current.has(participant.user_id)) {
        await createOfferForParticipant(participant.user_id);
      }
    }
  }, [activeParticipants, createOfferForParticipant, createPeerConnection, removePeer, userId]);

  const activateRoom = useCallback(
    async (currentRoom: VideoRoomRecord) => {
      if (!roomId || !canManageRoom) {
        return currentRoom;
      }

      const { data, error } = await db
        .from('video_rooms')
        .update({
          status: 'live',
          started_at: currentRoom.started_at || new Date().toISOString(),
          ended_at: null,
        })
        .eq('id', roomId)
        .select('*')
        .single();

      if (!error && data) {
        setRoom(data as VideoRoomRecord);
        return data as VideoRoomRecord;
      }

      return currentRoom;
    },
    [canManageRoom, roomId]
  );

  const joinRoom = useCallback(async () => {
    if (!roomId || !userId) return;

    const { error } = await db.from('video_room_participants').upsert(
      {
        room_id: roomId,
        user_id: userId,
        display_name: displayName || 'Participant',
        is_active: true,
        joined_at: new Date().toISOString(),
        left_at: null,
      },
      { onConflict: 'room_id,user_id' }
    );

    if (error) {
      throw error;
    }

    joinedRef.current = true;
  }, [displayName, roomId, userId]);

  const leaveRoom = useCallback(async () => {
    if (!roomId || !userId || !joinedRef.current) return;

    await db
      .from('video_room_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    joinedRef.current = false;
  }, [roomId, userId]);

  const endRoom = useCallback(async () => {
    if (!roomId || !canManageRoom) return;

    await db
      .from('video_rooms')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    await db
      .from('video_room_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('room_id', roomId);
  }, [canManageRoom, roomId]);

  const toggleMicrophone = useCallback(() => {
    const audioTracks = localStreamRef.current?.getAudioTracks() || [];
    const nextValue = !micEnabled;
    audioTracks.forEach((track) => {
      track.enabled = nextValue;
    });
    setMicEnabled(nextValue);
  }, [micEnabled]);

  const toggleCamera = useCallback(() => {
    if (roomType === 'audio') return;

    const videoTrack = originalVideoTrackRef.current;
    if (!videoTrack) return;

    const nextValue = !cameraEnabled;
    videoTrack.enabled = nextValue;
    if (!isScreenSharing) {
      const liveVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (liveVideoTrack) {
        liveVideoTrack.enabled = nextValue;
      }
    }
    setCameraEnabled(nextValue);
  }, [cameraEnabled, isScreenSharing, roomType]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId || !userId || !content.trim()) return;

      const { error } = await db.from('video_room_messages').insert({
        room_id: roomId,
        user_id: userId,
        display_name: displayName || 'Participant',
        content: content.trim(),
      });

      if (error) {
        throw error;
      }
    },
    [displayName, roomId, userId]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!roomId || !userId) return;

      const existing = reactions.find(
        (reaction) =>
          reaction.message_id === messageId && reaction.user_id === userId && reaction.emoji === emoji
      );

      if (existing) {
        const { error } = await db.from('video_message_reactions').delete().eq('id', existing.id);
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await db.from('video_message_reactions').insert({
        room_id: roomId,
        message_id: messageId,
        user_id: userId,
        emoji,
      });

      if (error) {
        throw error;
      }
    },
    [reactions, roomId, userId]
  );

  useEffect(() => {
    if (!enabled || !roomId || !userId) {
      setLoading(false);
      return;
    }

    let active = true;

    const startRoom = async () => {
      setLoading(true);
      setMediaError(null);

      try {
        const currentRoom = await loadRoom();
        if (!currentRoom) {
          throw new Error('Salle introuvable.');
        }

        let media: MediaStream;

        try {
          media = await navigator.mediaDevices.getUserMedia({
            video: currentRoom.room_type !== 'audio',
            audio: true,
          });
        } catch (error) {
          if (currentRoom.room_type !== 'audio') {
            media = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setMediaError('Caméra indisponible : connexion basculée en audio uniquement.');
          } else {
            throw error;
          }
        }

        if (!active) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }

        originalVideoTrackRef.current = media.getVideoTracks()[0] || null;
        localStreamRef.current = media;
        setLocalStream(media);
        setMicEnabled(true);
        setCameraEnabled(Boolean(originalVideoTrackRef.current?.enabled));

        await joinRoom();
        await activateRoom(currentRoom);
        await Promise.all([loadParticipants(), loadMessages(), loadReactions()]);

        const channel = db
          .channel(`video-room:${roomId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'video_room_participants',
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              void loadParticipants();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'video_room_signals',
              filter: `room_id=eq.${roomId}`,
            },
            (payload: { new: VideoSignalRecord }) => {
              void handleIncomingSignal(payload.new);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'video_room_messages',
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              void loadMessages();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'video_message_reactions',
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              void loadReactions();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'video_rooms',
              filter: `id=eq.${roomId}`,
            },
            (payload: { new: VideoRoomRecord }) => {
              setRoom(payload.new);
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (error) {
        console.error('[video-room] Failed to start room', error);
        if (active) {
          setMediaError("Impossible d'activer le micro ou la caméra pour cette salle.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void startRoom();

    return () => {
      active = false;
      void leaveRoom();
      if (channelRef.current) {
        db.removeChannel(channelRef.current);
      }
      channelRef.current = null;
      peerConnectionsRef.current.forEach((connection) => connection.close());
      peerConnectionsRef.current.clear();
      initiatedPeersRef.current.clear();
      pendingIceCandidatesRef.current.clear();
      setRemoteStreams([]);
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      originalVideoTrackRef.current = null;
      setLocalStream(null);
      setIsScreenSharing(false);
    };
  }, [
    activateRoom,
    enabled,
    handleIncomingSignal,
    joinRoom,
    leaveRoom,
    loadMessages,
    loadParticipants,
    loadReactions,
    loadRoom,
    roomId,
    userId,
  ]);

  useEffect(() => {
    if (!enabled || !localStreamRef.current) return;
    void syncPeers();
  }, [activeParticipants, enabled, syncPeers]);

  return {
    room,
    roomType,
    participants: activeParticipants,
    remoteStreams,
    messages,
    reactions,
    localStream,
    loading,
    mediaError,
    micEnabled,
    cameraEnabled,
    isScreenSharing,
    canShareScreen,
    toggleMicrophone,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    toggleReaction,
    leaveRoom,
    endRoom,
  };
};
