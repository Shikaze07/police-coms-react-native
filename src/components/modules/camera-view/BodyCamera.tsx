import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  PermissionsAndroid,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Spacing } from '../../../constants/theme';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../../lib/network';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg950:    '#020617',
  bg900:    '#0f172a',
  bg800:    '#1e293b',
  bg700:    '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  white:    '#ffffff',
  red500:   '#ef4444',
  red400:   '#f87171',
  green500: '#22c55e',
  green600: '#16a34a',
  blue500:  '#3b82f6',
  blue400:  '#60a5fa',
  blue600:  '#2563eb',
  amber500: '#f59e0b',
  border:   '#1e293b',
};

const ACCENT = ['#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#f97316','#84cc16'];

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = 'officer' | 'admin';

interface LiveFeed {
  id: string;
  callsign: string;
  unit: string;
  isRecording: boolean;
  isStreaming: boolean;
  lat: number;
  lng: number;
  battery: number;
  signal: number;
  status: 'ACTIVE' | 'STANDBY' | 'OFFLINE';
  fps: number;
  connectedAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const battColor = (n: number) => n > 60 ? C.green500 : n > 20 ? C.amber500 : C.red500;

function SignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1.5 }}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={{
          width: 3, height: 3 + i * 2, borderRadius: 1,
          backgroundColor: i <= bars ? color : 'rgba(255,255,255,0.15)',
        }} />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function BodyCamera({ theme, isDark }: { theme: any; isDark: boolean }) {
  const socketRef   = useRef<any>(null);
  const videoRef    = useRef<any>(null); // For Web <video>
  const streamRef   = useRef<any>(null); // MediaStream (Web)
  const nativeCameraRef = useRef<CameraView>(null); // For Native CameraView
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // ── Role selection ──────────────────────────────────────────────────────────
  const [role,         setRole]         = useState<Role>('officer');
  const [callsign,     setCallsign]     = useState('');
  const [connected,    setConnected]    = useState(false);
  const [connecting,   setConnecting]   = useState(true);
  const [latency,      setLatency]      = useState(0);

  // ── Officer state ───────────────────────────────────────────────────────────
  const [streaming,    setStreaming]    = useState(false);   // is stream live?
  const [isMuted,      setIsMuted]      = useState(false);
  const [hasVideo,     setHasVideo]     = useState(false);   // camera permission granted
  const [permError,    setPermError]    = useState('');
  const [lat,          setLat]          = useState(25.1972 + (Math.random() - 0.5) * 0.04);
  const [lng,          setLng]          = useState(55.2744 + (Math.random() - 0.5) * 0.04);
  const [battery,      setBattery]      = useState(Math.floor(75 + Math.random() * 25));
  const [signal,       setSignal]       = useState(4);
  const [recSeconds,   setRecSeconds]   = useState(0);
  const [time,         setTime]         = useState('');
  const [logs,         setLogs]         = useState<string[]>(['[BOOT] Camera module loaded.']);

  // ── Admin state ─────────────────────────────────────────────────────────────
  const [liveFeeds,    setLiveFeeds]    = useState<LiveFeed[]>([]);
  const [featuredId,   setFeaturedId]   = useState<string | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [adminTime,    setAdminTime]    = useState('');
  const [tagCount,     setTagCount]     = useState(0);
  const [frames,       setFrames]       = useState<Record<string, string>>({});

  const featured = liveFeeds.find(f => f.id === featuredId) ?? liveFeeds[0] ?? null;

  // ── Connect socket on role change ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    let latTimer: any = null;
    setConnecting(true);

    const connectSocket = async () => {
      const serverUrl = await getSocketUrl();
      if (!isMounted) return;

      const socket = io(serverUrl, {
        transports: ['websocket'],
        forceNew: true,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (!isMounted) return;
        setConnected(true);
        setConnecting(false);
        const cs = `CAM-${(socket.id || '').substring(0, 4).toUpperCase()}`;
        setCallsign(cs);

        // Measure initial latency
        const start = Date.now();
        socket.emit('ping');
        socket.once('pong', () => setLatency(Date.now() - start));

        // Periodic latency ping every 10 s
        latTimer = setInterval(() => {
          if (socket.connected) {
            const t = Date.now();
            socket.emit('ping');
            socket.once('pong', () => setLatency(Date.now() - t));
          }
        }, 10000);

        if (role === 'officer') {
          addLog('Socket linked. Ready to stream.');
          // Don't auto-register — officer must explicitly START STREAM
        } else {
          // Admin: just request current feeds
          socket.emit('camera_get_feeds');
          addLog('Admin monitor connected.');
        }
      });

      socket.on('camera_feeds', (feeds: LiveFeed[]) => {
        if (!isMounted) return;
        // Filter out self (own socket id won't be in feeds if admin, but guard anyway)
        const others = feeds.filter(f => f.id !== socket.id);
        setLiveFeeds(others);
        setFeaturedId(prev => {
          if (prev && others.find(f => f.id === prev)) return prev;
          return others[0]?.id ?? null;
        });
      });

      socket.on('camera_frame', (data: { id: string; frame: string }) => {
        if (!isMounted) return;
        setFrames(prev => ({ ...prev, [data.id]: data.frame }));
      });

      socket.on('disconnect', () => {
        if (!isMounted) return;
        setConnected(false);
        setConnecting(false);
      });
      socket.on('connect_error', () => {
        if (!isMounted) return;
        setConnected(false);
        setConnecting(false);
      });
    };

    void connectSocket();

    return () => {
      isMounted = false;
      if (latTimer) clearInterval(latTimer);
      // Stop media stream on unmount
      stopMediaStream();
      socketRef.current?.disconnect();
    };
  }, [role]);

  // ── Clock / GPS ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
      setAdminTime(now.toLocaleTimeString());
      if (streaming) {
        setRecSeconds(s => s + 1);
        setLat(v => v + (Math.random() - 0.5) * 0.0002);
        setLng(v => v + (Math.random() - 0.5) * 0.0002);
        setBattery(b => Math.max(1, b - (Math.random() > 0.97 ? 1 : 0)));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [streaming]);

  // ── Attach stream to <video> element once it mounts (hasVideo = true triggers render) ──
  useEffect(() => {
    if (hasVideo && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [hasVideo]);

  // ── Send real-time video frames to server (Web only) ──────────────────────
  useEffect(() => {
    if (role !== 'officer' || !streaming || !hasVideo || !connected || Platform.OS !== 'web') return;

    // Create offscreen canvas once
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      if (videoRef.current && ctx) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, 240, 180);
          const frameData = canvas.toDataURL('image/jpeg', 0.45);
          socketRef.current?.emit('camera_frame', { frame: frameData });
        } catch (e) {
          console.warn('Failed to capture local video frame', e);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [streaming, hasVideo, connected, role]);

  // ── Send real-time video frames to server (Native only) ───────────────────
  useEffect(() => {
    if (role !== 'officer' || !streaming || !hasVideo || !connected || Platform.OS === 'web') return;

    const interval = setInterval(async () => {
      if (nativeCameraRef.current) {
        try {
          const photo = await nativeCameraRef.current.takePictureAsync({ skipProcessing: true, shutterSound: false });
          if (photo?.uri) {
            // Downscale image to 240 width (maintaining aspect ratio) to drastically reduce payload size and prevent socket stall
            const manipResult = await manipulateAsync(
              photo.uri,
              [{ resize: { width: 240 } }],
              { compress: 0.5, format: SaveFormat.JPEG, base64: true }
            );
            
            if (manipResult.base64) {
              const frameData = 'data:image/jpeg;base64,' + manipResult.base64;
              socketRef.current?.emit('camera_frame', { frame: frameData });
            }
          }
        } catch (e) {
          console.warn('Failed to capture native video frame', e);
        }
      }
    }, 500); // 2 FPS for native to save bandwidth and battery

    return () => clearInterval(interval);
  }, [streaming, hasVideo, connected, role]);


  // ── Send camera_update when officer state changes ───────────────────────────
  useEffect(() => {
    if (role !== 'officer' || !connected || !streaming) return;
    socketRef.current?.emit('camera_update', {
      isStreaming: streaming,
      isRecording: streaming,
      status: streaming ? 'ACTIVE' : 'STANDBY',
      lat, lng, battery, signal,
    });
  }, [streaming, isMuted, connected]);

  // ── Officer: request camera + mic and start streaming ──────────────────────
  const startStream = async () => {
    setPermError('');
    if (Platform.OS === 'android') {
      const permissionResult = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const denied = Object.values(permissionResult).some(
        (result) => result !== PermissionsAndroid.RESULTS.GRANTED,
      );

      if (denied) {
        const msg = 'Camera and microphone access is required before body-cam streaming can start.';
        setPermError(msg);
        addLog(`[ERROR] ${msg}`);
        Alert.alert('Permissions required', msg);
        return;
      }
    }

    if (Platform.OS !== 'web') {
      // Native using expo-camera
      if (!camPermission?.granted || !micPermission?.granted) {
        const cReq = await requestCamPermission();
        const mReq = await requestMicPermission();
        if (!cReq.granted || !mReq.granted) {
          const msg = 'Camera and microphone access is required before body-cam streaming can start.';
          setPermError(msg);
          addLog(`[ERROR] ${msg}`);
          Alert.alert('Permissions required', msg);
          return;
        }
      }

      setHasVideo(true);
      doRegisterCamera();
      setStreaming(true);
      setRecSeconds(0);
      addLog('Stream started (native CameraView mode).');
      return;
    }

    try {
      addLog('Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setHasVideo(true);
      // srcObject is set via useEffect below, after the <video> element mounts

      doRegisterCamera();
      setStreaming(true);
      setRecSeconds(0);
      addLog('Camera and microphone granted. Stream LIVE.');
    } catch (err: any) {
      // Permission denied or no device
      const msg = err?.name === 'NotAllowedError'
        ? 'Permission denied. Please allow camera and microphone in your browser.'
        : err?.name === 'NotFoundError'
        ? 'No camera/microphone found on this device.'
        : `Media error: ${err?.message}`;
      setPermError(msg);
      addLog(`[ERROR] ${msg}`);

      // Try audio-only fallback
      try {
        addLog('Falling back to audio-only stream...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = audioStream;
        setHasVideo(false);
        doRegisterCamera();
        setStreaming(true);
        setRecSeconds(0);
        addLog('Audio-only stream LIVE.');
      } catch {
        addLog('[ERROR] No media access granted. Cannot stream.');
      }
    }
  };

  const doRegisterCamera = () => {
    socketRef.current?.emit('camera_register', {
      callsign,
      unit: callsign,
      isRecording: true,
      isStreaming: true,
      lat, lng, battery, signal,
      fps: 30,
    });
  };

  const stopStream = () => {
    stopMediaStream();
    socketRef.current?.emit('camera_unregister');
    setStreaming(false);
    setHasVideo(false);
    setPermError('');
    addLog('Stream stopped.');
  };

  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: any) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t: any) => { t.enabled = isMuted; }); // toggle
    }
    const next = !isMuted;
    setIsMuted(next);
    addLog(next ? 'Microphone muted.' : 'Microphone active.');
    if (streaming) socketRef.current?.emit('camera_update', { isMuted: next });
  };

  const captureSnapshot = () => {
    const id = Math.floor(1000 + Math.random() * 9000);
    Alert.alert('📸 SNAPSHOT', `DSC_${id}.jpg saved to evidence drive.`);
    addLog(`Snapshot DSC_${id}.jpg captured.`);
  };

  const addLog = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs(prev => [`[${t}] ${msg}`, ...prev]);
  };

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2,'0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
    const sc = (s % 60).toString().padStart(2,'0');
    return `${h}:${m}:${sc}`;
  };

  // ── Admin helpers ───────────────────────────────────────────────────────────
  const handleTagIncident = () => {
    if (!featured) return;
    const n = tagCount + 1;
    setTagCount(n);
    Alert.alert('🏷️ INCIDENT TAGGED', `Tag #${String(n).padStart(4,'0')} logged on ${featured.callsign} at ${adminTime}.`);
  };

  const filteredFeeds = liveFeeds.filter(f =>
    f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // ══════════════════════════════════════════════════════════════════════════
  //  OFFICER VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (role === 'officer') {
    return (
      <View style={styles.cardContainer}>
        {/* Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>LIVE FEED VIEWFINDER</Text>
            <Text style={styles.callsignLabel}>{callsign || 'CONNECTING...'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {streaming && (
              <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)' }]}>
                <View style={[styles.badgeDot, { backgroundColor: C.red500 }]} />
                <Text style={[styles.badgeText, { color: C.red400 }]}>LIVE</Text>
              </View>
            )}
            {connecting ? (
              <View style={[styles.badge, { backgroundColor: 'rgba(100,116,139,0.07)', borderColor: 'rgba(100,116,139,0.3)' }]}>
                <View style={[styles.badgeDot, { backgroundColor: C.amber500 }]} />
                <Text style={[styles.badgeText, { color: C.amber500 }]}>CONNECTING</Text>
              </View>
            ) : (
              <View style={[styles.badge, {
                backgroundColor: connected ? 'rgba(34,197,94,0.07)' : 'rgba(100,116,139,0.07)',
                borderColor: connected ? 'rgba(34,197,94,0.3)' : 'rgba(100,116,139,0.3)',
              }]}>
                <View style={[styles.badgeDot, { backgroundColor: connected ? C.green500 : C.slate500 }]} />
                <Text style={[styles.badgeText, { color: connected ? C.green500 : C.slate500 }]}>
                  {connected ? `LINKED · ${latency}ms` : 'OFFLINE'}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.roleSwitchBtn}
              onPress={() => setRole('admin')}
            >
              <Feather name="monitor" size={12} color={C.blue400} />
            </Pressable>
          </View>
        </View>

        {/* Viewfinder */}
        <View style={[styles.viewfinder, { borderColor: streaming ? C.red500 : C.slate600 }]}>
          {/* Real camera preview (web only) */}
          {Platform.OS === 'web' && hasVideo && (
            // @ts-ignore – native <video> element on web
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.85,
              }}
            />
          )}

          {/* Real camera preview (native only) */}
          {Platform.OS !== 'web' && hasVideo && (
            <CameraView
              ref={nativeCameraRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}
              facing="back"
              mute={isMuted}
              animateShutter={false}
            />
          )}

          {/* Top HUD */}
          <View style={styles.viewfinderOverlayTop}>
            <View style={styles.recContainer}>
              <View style={[styles.recDot, { backgroundColor: streaming ? C.red500 : C.slate600 }]} />
              <Text style={styles.recText}>{streaming ? 'REC' : 'STBY'}</Text>
            </View>
            <Text style={styles.metaText}>
              {hasVideo ? '1080P @ 30FPS' : streaming ? 'AUDIO ONLY' : 'READY'}
            </Text>
          </View>

          {/* Center crosshair */}
          {!hasVideo && (
            <View style={styles.centerHud}>
              {!streaming ? (
                <View style={styles.noFeedHint}>
                  <Feather name="video-off" size={22} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.noFeedText}>TAP START STREAM</Text>
                </View>
              ) : (
                <Feather name="plus" size={22} color="rgba(255,255,255,0.2)" />
              )}
            </View>
          )}

          {/* Bottom HUD */}
          <View style={styles.viewfinderBottom}>
            <View>
              <Text style={styles.coordText}>LAT: {lat.toFixed(5)}° N</Text>
              <Text style={styles.coordText}>LNG: {lng.toFixed(4)}° E</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.timeText}>{time || '--:--:--'}</Text>
              {streaming && <Text style={[styles.coordText, { color: C.red400 }]}>{fmtTime(recSeconds)}</Text>}
            </View>
          </View>

          {/* LIVE badge top-right */}
          {streaming && (
            <View style={styles.liveBadge}>
              <View style={[styles.recDot, { backgroundColor: C.red500 }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          <View style={{ ...StyleSheet.absoluteFill, opacity: 0.04, backgroundColor: C.white }} pointerEvents="none" />
        </View>

        {/* Permission error */}
        {!!permError && (
          <View style={styles.permError}>
            <Feather name="alert-circle" size={13} color={C.red400} />
            <Text style={styles.permErrorText}>{permError}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/* START / STOP STREAM */}
          <Pressable
            style={[styles.mainBtn, {
              backgroundColor: streaming ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              borderColor: streaming ? C.red500 : C.green500,
              flex: 2,
            }]}
            onPress={streaming ? stopStream : startStream}
          >
            <Feather
              name={streaming ? 'square' : 'play-circle'}
              size={16}
              color={streaming ? C.red500 : C.green500}
            />
            <Text style={[styles.mainBtnText, { color: streaming ? C.red500 : C.green500 }]}>
              {streaming ? 'STOP STREAM' : 'START STREAM'}
            </Text>
          </Pressable>

          {/* MUTE */}
          <Pressable
            style={[styles.mainBtn, {
              backgroundColor: isMuted ? 'rgba(245,158,11,0.12)' : C.bg800,
              borderColor: isMuted ? C.amber500 : C.border,
              opacity: streaming ? 1 : 0.45,
            }]}
            onPress={toggleMute}
            disabled={!streaming}
          >
            <Feather name={isMuted ? 'mic-off' : 'mic'} size={15} color={isMuted ? C.amber500 : C.slate200} />
            <Text style={[styles.mainBtnText, { color: isMuted ? C.amber500 : C.slate200 }]}>
              {isMuted ? 'UNMUTE' : 'MUTE'}
            </Text>
          </Pressable>

          {/* SNAPSHOT */}
          <Pressable
            style={[styles.mainBtn, { backgroundColor: C.bg800, borderColor: C.border, opacity: streaming ? 1 : 0.45 }]}
            onPress={captureSnapshot}
            disabled={!streaming}
          >
            <Feather name="camera" size={15} color={C.slate200} />
            <Text style={[styles.mainBtnText, { color: C.slate200 }]}>SNAP</Text>
          </Pressable>
        </View>

        {/* Admin view shortcut */}
        <Pressable style={styles.adminViewBtn} onPress={() => setRole('admin')}>
          <Feather name="grid" size={13} color={C.blue400} />
          <Text style={styles.adminViewBtnText}>
            ADMIN VIEW — MONITOR ALL FEEDS ({liveFeeds.length} LIVE)
          </Text>
          <Feather name="chevron-right" size={13} color={C.blue400} />
        </Pressable>

        {/* Log */}
        <Text style={[styles.logTitle, { color: theme.text }]}>UNIT LOG</Text>
        <View style={styles.console}>
          {logs.slice(0, 6).map((l, i) => <Text key={i} style={styles.consoleLine} numberOfLines={1}>{l}</Text>)}
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ADMIN VIEW
  // ══════════════════════════════════════════════════════════════════════════
  const activeCount = liveFeeds.filter(f => f.status === 'ACTIVE').length;
  const streamCount = liveFeeds.filter(f => f.isStreaming).length;

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.adminTitle}>COMMAND — BODY CAM FEEDS</Text>
          <Text style={styles.adminSubtitle}>
            {activeCount} ACTIVE · {streamCount} STREAMING · {liveFeeds.length} UNITS
          </Text>
        </View>
        <Pressable style={styles.exitBtn} onPress={() => setRole('officer')}>
          <Feather name="arrow-left" size={13} color={C.slate400} />
          <Text style={styles.exitBtnText}>BACK</Text>
        </Pressable>
      </View>

      {/* Featured feed */}
      {featured ? (
        <View style={[styles.featuredViewfinder, { borderColor: ACCENT[liveFeeds.indexOf(featured) % ACCENT.length] }]}>
          {(() => {
            const accent = ACCENT[liveFeeds.indexOf(featured) % ACCENT.length];
            return (
              <>
                {featured.isStreaming && frames[featured.id] && (
                  <Image
                    source={{ uri: frames[featured.id] }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover',
                      opacity: 0.85,
                    }}
                  />
                )}
                <View style={styles.viewfinderOverlayTop}>
                  <View style={styles.recContainer}>
                    <View style={[styles.recDot, { backgroundColor: featured.isRecording ? C.red500 : C.slate600 }]} />
                    <Text style={styles.recText}>{featured.isRecording ? 'REC' : 'STBY'}</Text>
                  </View>
                  <View style={styles.recContainer}>
                    <Text style={[styles.recText, { color: accent }]}>{featured.callsign}</Text>
                  </View>
                  <Text style={styles.metaText}>{featured.fps > 0 ? `1080P @ ${featured.fps}FPS` : 'OFFLINE'}</Text>
                </View>
                <View style={styles.centerHud}>
                  {featured.status === 'OFFLINE' ? (
                    <View style={styles.noFeedHint}>
                      <Feather name="wifi-off" size={22} color="rgba(255,255,255,0.18)" />
                      <Text style={styles.noFeedText}>NO SIGNAL</Text>
                    </View>
                  ) : (
                    <Feather name="plus" size={24} color="rgba(255,255,255,0.18)" />
                  )}
                </View>
                <View style={styles.viewfinderBottom}>
                  <View>
                    <Text style={styles.coordText}>LAT: {featured.lat.toFixed(5)}° N</Text>
                    <Text style={styles.coordText}>LNG: {featured.lng.toFixed(4)}° E</Text>
                    <Text style={[styles.coordText, { color: accent, marginTop: 2 }]}>{featured.unit} · {featured.status}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.timeText}>{adminTime}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <SignalBars bars={featured.signal} color={accent} />
                      <Text style={[styles.coordText, { color: battColor(featured.battery) }]}>🔋 {featured.battery}%</Text>
                    </View>
                    {featured.connectedAt && <Text style={styles.coordText}>SINCE {featured.connectedAt}</Text>}
                  </View>
                </View>
                {featured.isStreaming && (
                  <View style={styles.liveBadge}>
                    <View style={[styles.recDot, { backgroundColor: C.red500 }]} />
                    <Text style={styles.liveText}>LIVE  {featured.fps}fps</Text>
                  </View>
                )}
                <View style={{ ...StyleSheet.absoluteFill, opacity: 0.04, backgroundColor: C.white }} pointerEvents="none" />
              </>
            );
          })()}
        </View>
      ) : (
        <View style={styles.emptyFeatured}>
          <Feather name="video-off" size={28} color={C.slate600} />
          <Text style={styles.emptyTitle}>NO ACTIVE FEEDS</Text>
          <Text style={styles.emptyDesc}>
            Officers will appear here once they open the Body Camera module and tap "START STREAM".
          </Text>
        </View>
      )}


      {/* Search + tiles */}
      <View style={styles.feedsSection}>
        <View style={styles.feedsHeader}>
          <Text style={styles.feedsSectionTitle}>PERSONNEL FEEDS</Text>
          <View style={styles.searchBox}>
            <Feather name="search" size={11} color={C.slate500} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search callsign..."
              placeholderTextColor={C.slate500}
            />
          </View>
        </View>

        {filteredFeeds.length === 0 ? (
          <View style={styles.emptyFeeds}>
            <Feather name={searchQuery ? 'search' : 'users'} size={20} color={C.slate600} />
            <Text style={styles.emptyFeedsText}>
              {searchQuery
                ? `No units match "${searchQuery}"`
                : 'No officers streaming yet.\nOfficers must open Body Camera → START STREAM.'}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tilesRow}>
            {filteredFeeds.map((feed, idx) => {
              const accent = ACCENT[idx % ACCENT.length];
              const isActive = feed.id === featuredId;
              return (
                <Pressable
                  key={feed.id}
                  onPress={() => setFeaturedId(feed.id)}
                  style={[styles.tile, isActive && { borderColor: accent, backgroundColor: `${accent}18` }]}
                >
                  <View style={[styles.miniVF, { borderColor: isActive ? accent : C.bg700 }]}>
                    {feed.isStreaming && frames[feed.id] && (
                      <Image
                        source={{ uri: frames[feed.id] }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                          opacity: 0.8,
                        }}
                      />
                    )}
                    {feed.status === 'OFFLINE' ? (
                      <View style={styles.miniCenter}>
                        <Feather name="wifi-off" size={13} color="rgba(255,255,255,0.18)" />
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={[styles.recDot, { backgroundColor: feed.isRecording ? C.red500 : C.slate600 }]} />
                          <Text style={[styles.miniRecText, { color: accent }]}>
                            {feed.isStreaming ? 'LIVE' : 'STBY'}
                          </Text>
                        </View>
                        <Feather name="plus" size={11} color="rgba(255,255,255,0.13)" style={{ alignSelf: 'center' }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <SignalBars bars={feed.signal} color={accent} />
                          <Text style={[styles.miniBatt, { color: battColor(feed.battery) }]}>{feed.battery}%</Text>
                        </View>
                      </>
                    )}
                  </View>
                  <Text style={[styles.tileCallsign, isActive && { color: accent }]} numberOfLines={1}>
                    {feed.callsign}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[styles.statusDot, {
                      backgroundColor: feed.status === 'ACTIVE' ? C.green500 : feed.status === 'STANDBY' ? C.amber500 : C.slate600,
                    }]} />
                    <Text style={styles.tileStatus}>{feed.status}</Text>
                  </View>
                  <Pressable
                    style={[styles.viewBtn, { borderColor: accent, opacity: feed.status === 'OFFLINE' ? 0.3 : 1 }]}
                    onPress={() => setFeaturedId(feed.id)}
                    disabled={feed.status === 'OFFLINE'}
                  >
                    <Feather name="eye" size={9} color={accent} />
                    <Text style={[styles.viewBtnText, { color: accent }]}>VIEW</Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Role selector
  roleScreen: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: C.white, letterSpacing: 1.5 },
  roleSubtitle: { fontSize: 11, color: C.slate500, fontFamily: 'monospace', marginBottom: 12 },
  roleCards: { flexDirection: 'row', gap: 16, width: '100%' },
  roleCard: {
    flex: 1,
    backgroundColor: C.bg900,
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  roleCardTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  roleCardDesc: { fontSize: 10, color: C.slate400, fontFamily: 'monospace', textAlign: 'center', lineHeight: 15 },

  // Shared
  cardContainer: { width: '100%' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  cardTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  callsignLabel: { fontSize: 9, color: C.slate500, fontFamily: 'monospace', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 8, fontWeight: 'bold', letterSpacing: 0.4 },
  roleSwitchBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg800,
  },

  // Viewfinder
  viewfinder: {
    height: 210,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
  },
  featuredViewfinder: {
    height: 245,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
  },
  viewfinderOverlayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  recDot: { width: 6, height: 6, borderRadius: 3 },
  recText: { color: C.white, fontSize: 8.5, fontWeight: 'bold', fontFamily: 'monospace' },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8.5,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  centerHud: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noFeedHint: { alignItems: 'center', gap: 6 },
  noFeedText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  viewfinderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 4,
  },
  coordText: { color: C.white, fontSize: 8, fontFamily: 'monospace' },
  timeText: { color: C.white, fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  liveText: { color: C.red400, fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold' },

  // Perm error
  permError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  permErrorText: { color: C.red400, fontSize: 10, fontFamily: 'monospace', flex: 1 },

  // Controls
  controls: { flexDirection: 'row', gap: 8, marginTop: 8 },
  mainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  mainBtnText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.3 },

  adminViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
    backgroundColor: 'rgba(59,130,246,0.07)',
  },
  adminViewBtnText: { color: C.blue400, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.4 },

  logTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: Spacing.three, marginBottom: Spacing.two },
  console: { borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 10 },
  consoleLine: { fontFamily: 'monospace', fontSize: 9.5, lineHeight: 14, color: '#94a3b8' },

  // Admin
  adminTitle: { fontSize: 11, fontWeight: 'bold', color: C.white, letterSpacing: 0.8 },
  adminSubtitle: { fontSize: 9, color: C.slate500, fontFamily: 'monospace', marginTop: 2, letterSpacing: 0.4 },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg800,
  },
  exitBtnText: { color: C.slate400, fontSize: 10, fontWeight: 'bold' },

  emptyFeatured: {
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg900,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    padding: 20,
  },
  emptyTitle: { color: C.slate400, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  emptyDesc: { color: C.slate600, fontSize: 10, fontFamily: 'monospace', textAlign: 'center', lineHeight: 16 },

  adminActions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  actionBtnText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.3 },

  feedsSection: { gap: 10 },
  feedsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedsSectionTitle: { fontSize: 10, fontWeight: 'bold', color: C.slate400, letterSpacing: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.bg800,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 30,
    minWidth: 160,
  },
  searchInput: { flex: 1, fontSize: 11, color: C.slate200, fontFamily: 'monospace' },

  tilesRow: { gap: 10, paddingBottom: 4 },
  tile: {
    width: 130,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.bg700,
    backgroundColor: C.bg900,
    padding: 8,
    gap: 6,
  },
  miniVF: {
    height: 80,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
    padding: 5,
    justifyContent: 'space-between',
  },
  miniCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  miniRecText: { fontSize: 7, fontWeight: 'bold', fontFamily: 'monospace' },
  miniBatt: { fontSize: 7, fontFamily: 'monospace', fontWeight: 'bold' },
  tileCallsign: { fontSize: 10, fontWeight: 'bold', color: C.slate200, fontFamily: 'monospace' },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  tileStatus: { fontSize: 8, color: C.slate500, fontFamily: 'monospace', fontWeight: 'bold' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  viewBtnText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.3 },

  emptyFeeds: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyFeedsText: { color: C.slate500, fontSize: 10, fontFamily: 'monospace', textAlign: 'center', lineHeight: 16 },
});
