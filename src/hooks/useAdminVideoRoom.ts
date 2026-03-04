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

interface UseAdminVideoRoomOptions {
  roomId?: string;
  userId?: string;
  displayName?: string;
  enabled: boolean;
}

export const useAdminVideoRoom = ({
  roomId,
  userId,
  displayName,
  enabled,
}: UseAdminVideoRoomOptions) => {
  const [room, setRoom] = useState<VideoRoomRecord | null>(null);
  const [participants, setParticipants] = useState<VideoParticipantRecord[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteVideoStream[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const channelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const initiatedPeersRef = useRef<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const joinedRef = useRef(false);

  const activeParticipants = useMemo(
    () => participants.filter((participant) => participant.is_active && !participant.left_at),
    [participants]
  );

  const getParticipantLabel = useCallback(
    (participantId: string) => {
      const participant = participants.find((entry) => entry.user_id === participantId);
      return participant?.display_name || 'Administrateur';
    },
    [participants]
  );

  const loadRoom = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await db
      .from('video_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      throw error;
    }

    setRoom(data as VideoRoomRecord);
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
    const existing = peerConnectionsRef.current.get(participantId);
    if (existing) {
      existing.onicecandidate = null;
      existing.ontrack = null;
      existing.onconnectionstatechange = null;
      existing.close();
      peerConnectionsRef.current.delete(participantId);
    }

    initiatedPeersRef.current.delete(participantId);
    setRemoteStreams((current) => current.filter((entry) => entry.userId !== participantId));
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
        const { connectionState } = connection;
        if (connectionState === 'failed' || connectionState === 'closed' || connectionState === 'disconnected') {
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
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        await sendSignal('answer', answer, signal.sender_id);
      }

      if (signal.signal_type === 'answer') {
        await connection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
      }

      if (signal.signal_type === 'ice-candidate') {
        try {
          await connection.addIceCandidate(signal.payload as RTCIceCandidateInit);
        } catch (error) {
          console.warn('[video-room] ICE candidate ignored', error);
        }
      }

      await db.from('video_room_signals').delete().eq('id', signal.id);
    },
    [createPeerConnection, sendSignal, userId]
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

  const joinRoom = useCallback(async () => {
    if (!roomId || !userId) return;

    await db.from('video_rooms').update({ status: 'live', updated_at: new Date().toISOString() }).eq('id', roomId);

    const { error } = await db.from('video_room_participants').upsert(
      {
        room_id: roomId,
        user_id: userId,
        display_name: displayName || 'Administrateur',
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
    if (!roomId) return;

    await db
      .from('video_rooms')
      .update({ status: 'ended', updated_at: new Date().toISOString() })
      .eq('id', roomId);

    await db
      .from('video_room_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('room_id', roomId);
  }, [roomId]);

  const toggleMicrophone = useCallback(() => {
    const audioTracks = localStreamRef.current?.getAudioTracks() || [];
    const nextValue = !micEnabled;
    audioTracks.forEach((track) => {
      track.enabled = nextValue;
    });
    setMicEnabled(nextValue);
  }, [micEnabled]);

  const toggleCamera = useCallback(() => {
    const videoTracks = localStreamRef.current?.getVideoTracks() || [];
    const nextValue = !cameraEnabled;
    videoTracks.forEach((track) => {
      track.enabled = nextValue;
    });
    setCameraEnabled(nextValue);
  }, [cameraEnabled]);

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
        await loadRoom();

        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!active) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = media;
        setLocalStream(media);
        setMicEnabled(true);
        setCameraEnabled(true);

        await joinRoom();
        await loadParticipants();

        const channel = db
          .channel(`video-room-${roomId}`)
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
          setMediaError("Impossible d'activer la caméra ou le micro pour cette salle.");
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
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      peerConnectionsRef.current.forEach((connection) => connection.close());
      peerConnectionsRef.current.clear();
      initiatedPeersRef.current.clear();
      setRemoteStreams([]);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    };
  }, [enabled, handleIncomingSignal, joinRoom, leaveRoom, loadParticipants, loadRoom, roomId, userId]);

  useEffect(() => {
    if (!enabled || !localStreamRef.current) return;
    void syncPeers();
  }, [activeParticipants, enabled, syncPeers]);

  return {
    room,
    participants: activeParticipants,
    remoteStreams,
    localStream,
    loading,
    mediaError,
    micEnabled,
    cameraEnabled,
    toggleMicrophone,
    toggleCamera,
    leaveRoom,
    endRoom,
  };
};
