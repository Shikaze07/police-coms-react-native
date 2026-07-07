import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { io } from 'socket.io-client';
import { Fonts, Spacing } from '../../../constants/theme';

// ─── Color constants (mirrors web slate palette) ────────────────────────────
const C = {
  bg950:    '#020617',
  bg900:    '#0f172a',
  bg800:    '#1e293b',
  bg700:    '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  blue600:  '#2563eb',
  blue500:  '#3b82f6',
  blue400:  '#60a5fa',
  blue900b: 'rgba(30,58,138,0.15)',
  green500: '#22c55e',
  green600: '#16a34a',
  yellow500: '#eab308',
  red500:   '#ef4444',
  white:    '#ffffff',
  border:   '#1e293b',
  emerald500: '#10b981',
};

// ─── Socket URL ──────────────────────────────────────────────────────────────
const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return `http://${window.location.hostname}:3000`;
    }
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) return `http://${debuggerHost.split(':')[0]}:3000`;
  return 'http://localhost:3000';
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Channel {
  id: string;
  name: string;
  members: number;
  status: 'ACTIVE' | 'IDLE' | 'OFFLINE';
  frequency: string;
  isSecure?: boolean;
}

interface RadioMessage {
  id: string;
  sender: string;
  senderId: string;
  type: 'TEXT' | 'AUDIO';
  content: string;
  timestamp: Date;
  duration?: number;
  audioUrl?: string; // data URL for web audio playback
}

// ─── Static Data ─────────────────────────────────────────────────────────────
const CHANNELS: Channel[] = [
  { id: '1', name: 'Alpha Team (Tactical)', members: 4,  status: 'ACTIVE',  frequency: '462.5625', isSecure: true },
  { id: '2', name: 'Command Center',        members: 12, status: 'IDLE',    frequency: '462.6125', isSecure: true },
  { id: '3', name: 'Traffic Enforcers',     members: 8,  status: 'IDLE',    frequency: '462.6625' },
  { id: '4', name: 'District 1 All-Call',   members: 45, status: 'OFFLINE', frequency: '467.5625' },
];

// Map channel id → socket channel name
const chanToSocket = (id: string) => {
  const map: Record<string, string> = {
    '1': '#dispatch',
    '2': '#tactical-1',
    '3': '#tactical-1',
    '4': '#intel-ops',
  };
  return map[id] || '#dispatch';
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ERadio({ theme, isDark }: { theme: any; isDark: boolean }) {
  const socketRef        = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const scrollViewRef    = useRef<ScrollView>(null);
  // Map of messageId → HTMLAudioElement (web only)
  const audioElementsRef = useRef<Record<string, any>>({});
  // IDs of messages we sent ourselves (to ignore server echo-back)
  const sentMsgIds = useRef<Set<string>>(new Set());

  const [connected,      setConnected]      = useState(false);
  const [networkLatency, setNetworkLatency] = useState(12);
  const [callsign,       setCallsign]       = useState('');

  const [channels,       setChannels]       = useState<Channel[]>(CHANNELS);
  const [activeChannel,  setActiveChannel]  = useState<Channel>(CHANNELS[0]);
  const [messages,       setMessages]       = useState<RadioMessage[]>([
    {
      id: 'm0',
      sender: 'DISPATCH',
      senderId: 'dispatch',
      type: 'TEXT',
      content: 'Secure tactical datalink established.',
      timestamp: new Date(),
    },
  ]);

  const [isPTTActive,    setIsPTTActive]    = useState(false);
  const [pttPosition,    setPttPosition]    = useState<'left' | 'right'>('right');
  const [inputText,      setInputText]      = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [signalBars,     setSignalBars]     = useState(4);
  const [networkLat,     setNetworkLat]     = useState(12);
  // Track which audio message is currently playing
  const [playingMsgId,   setPlayingMsgId]   = useState<string | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');

  useEffect(() => {
    if (isLargeScreen) setMobileView('chat');
  }, [isLargeScreen]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const serverUrl = getSocketUrl();
    const socket = io(serverUrl, { transports: ['websocket'], forceNew: true, reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      const pttCall = `WT-${(socket.id || 'stub').substring(0, 4).toUpperCase()}`;
      setCallsign(pttCall);
      socket.emit('register', { callsign: pttCall });
      socket.emit('join_channel', chanToSocket(activeChannel.id));

      const start = Date.now();
      socket.emit('ping');
      socket.once('pong', () => setNetworkLat(Date.now() - start));
    });

    // Incoming text messages from other users
    socket.on('message', (msg: any) => {
      // Skip messages we sent ourselves (already added optimistically)
      if (sentMsgIds.current.has(msg.id)) {
        sentMsgIds.current.delete(msg.id); // clean up
        return;
      }
      // Also skip system messages — they show in EMessenger, not here
      if (msg.isSystem) return;
      const incoming: RadioMessage = {
        id: msg.id || Date.now().toString(),
        sender: msg.sender || 'UNIT',
        senderId: 'remote',
        type: 'TEXT',
        content: msg.text || '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, incoming]);
    });

    socket.on('voice_transmit', (data: { sender: string; audio: string }) => {
      playVoiceBroadcast(data.audio, data.sender);
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    const latTimer = setInterval(() => {
      setNetworkLat(10 + Math.floor(Math.random() * 8));
    }, 5000);

    return () => { clearInterval(latTimer); socket.disconnect(); };
  }, []);

  // Update channel on socket when active channel changes
  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_channel', chanToSocket(activeChannel.id));
    }
  }, [activeChannel]);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (isPTTActive) return;
    if (Platform.OS !== 'web') { setIsPTTActive(true); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setIsPTTActive(true); return; }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new (window as any).MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e: any) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioDataUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(',')[1];
          socketRef.current?.emit('voice_transmit', { audio: b64, sender: callsign });
        };
        stream.getTracks().forEach(t => t.stop());

        const msgId = Date.now().toString();
        // Store the audio element for playback
        if (Platform.OS === 'web') {
          const audioEl = new (window as any).Audio(audioDataUrl);
          audioEl.onended = () => setPlayingMsgId(null);
          audioElementsRef.current[msgId] = audioEl;
        }

        const newMsg: RadioMessage = {
          id: msgId,
          sender: callsign || 'ME',
          senderId: 'me',
          type: 'AUDIO',
          content: 'ptt_audio',
          timestamp: new Date(),
          duration: 0, // will be updated after audio loads
          audioUrl: audioDataUrl,
        };
        setMessages(prev => [...prev, newMsg]);
      };

      mr.start();
      setIsPTTActive(true);
      setSignalBars(5);
    } catch { setIsPTTActive(true); }
  };

  const stopRecording = () => {
    if (!isPTTActive) return;
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setIsPTTActive(false);
    setSignalBars(4);
  };

  const playVoiceBroadcast = (base64Audio: string, sender: string) => {
    if (Platform.OS !== 'web') return;
    try {
      const dataUrl = `data:audio/webm;base64,${base64Audio}`;
      const msgId = Date.now().toString();

      // Build Audio element and store it
      const audioEl = new (window as any).Audio(dataUrl);
      audioEl.onended = () => setPlayingMsgId(null);
      audioElementsRef.current[msgId] = audioEl;

      // Auto-play incoming voice broadcast
      audioEl.play().catch(console.warn);
      setPlayingMsgId(msgId);

      const incomingMsg: RadioMessage = {
        id: msgId,
        sender: sender || 'UNIT',
        senderId: 'remote',
        type: 'AUDIO',
        content: 'ptt_incoming',
        timestamp: new Date(),
        duration: 0,
        audioUrl: dataUrl,
      };
      setMessages(prev => [...prev, incomingMsg]);
    } catch { /* noop */ }
  };

  // ── Audio playback toggle ─────────────────────────────────────────────────
  const toggleAudioPlayback = (msg: RadioMessage) => {
    if (Platform.OS !== 'web') return;
    const audioEl = audioElementsRef.current[msg.id];
    if (!audioEl) return;

    if (playingMsgId === msg.id) {
      // Currently playing → pause
      audioEl.pause();
      setPlayingMsgId(null);
    } else {
      // Stop any currently playing audio
      if (playingMsgId && audioElementsRef.current[playingMsgId]) {
        audioElementsRef.current[playingMsgId].pause();
        audioElementsRef.current[playingMsgId].currentTime = 0;
      }
      audioEl.currentTime = 0;
      audioEl.play().catch(console.warn);
      setPlayingMsgId(msg.id);
    }
  };

  // ── Send text ─────────────────────────────────────────────────────────────
  const handleSendText = () => {
    if (!inputText.trim()) return;
    const msgId = Date.now().toString();
    const msgTimestamp = new Date().toTimeString().split(' ')[0];
    const socketChannel = chanToSocket(activeChannel.id);

    // Optimistically add to local state
    const msg: RadioMessage = {
      id: msgId,
      sender: callsign || 'ME',
      senderId: 'me',
      type: 'TEXT',
      content: inputText.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);

    // Emit over socket so other users receive it
    if (connected && socketRef.current) {
      // Register ID first so the server echo-back is ignored by the listener
      sentMsgIds.current.add(msgId);
      socketRef.current.emit('send_message', {
        id: msgId,
        sender: callsign || 'ME',
        text: inputText.trim(),
        channel: socketChannel,
        timestamp: msgTimestamp,
        isSystem: false,
      });
    }

    setInputText('');
  };

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  SIDEBAR – Channel List
  // ─────────────────────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Profile Header */}
      <View style={styles.sidebarProfile}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{callsign ? callsign.charAt(0) : 'W'}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{callsign || 'OFFICER'}</Text>
          <Text style={styles.profileRole}>FIELD OFFICER</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={13} color={C.slate500} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter channels..."
            placeholderTextColor={C.slate500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Channel List */}
      <ScrollView style={styles.channelList}>
        <View style={{ padding: 8, gap: 4 }}>
          {filteredChannels.map(channel => {
            const isActive = activeChannel.id === channel.id;
            return (
              <Pressable
                key={channel.id}
                onPress={() => {
                  setActiveChannel(channel);
                  if (!isLargeScreen) setMobileView('chat');
                }}
                style={[styles.channelItem, isActive && styles.channelItemActive]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.channelNameRow}>
                    <Text
                      numberOfLines={1}
                      style={[styles.channelName, isActive && styles.channelNameActive]}
                    >
                      {channel.name}
                    </Text>
                    {channel.isSecure && (
                      <Feather name="lock" size={10} color={C.emerald500} style={{ opacity: 0.7 }} />
                    )}
                  </View>
                  <Text style={styles.channelFreq}>{channel.frequency} MHz</Text>
                </View>
                <View style={styles.channelRight}>
                  <View style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        channel.status === 'ACTIVE'  ? C.green500 :
                        channel.status === 'IDLE'    ? C.yellow500 : C.slate500,
                    }
                  ]} />
                  <View style={styles.memberRow}>
                    <Feather name="users" size={10} color={C.slate500} />
                    <Text style={styles.memberCount}>{channel.members}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN CONTENT – Message feed + Footer + PTT sidebar
  // ─────────────────────────────────────────────────────────────────────────
  const renderChatArea = () => (
    <View style={styles.chatArea}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          {!isLargeScreen && (
            <Pressable onPress={() => setMobileView('sidebar')} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color={C.blue400} />
            </Pressable>
          )}
          {/* Radio icon box */}
          <View style={styles.radioIconBox}>
            <Feather name="radio" size={18} color={C.blue400} />
          </View>
          <View>
            <View style={styles.channelNameRow}>
              <Text style={styles.headerChannelName} numberOfLines={1}>{activeChannel.name}</Text>
              {activeChannel.status === 'ACTIVE' && (
                <View style={[styles.activeDot]} />
              )}
              {activeChannel.isSecure && (
                <Feather name="lock" size={11} color={C.emerald500} />
              )}
            </View>
            <View style={styles.headerSubRow}>
              <Feather name="wifi" size={10} color={C.emerald500} />
              <Text style={styles.headerSubText}>5G/LTE  ·  {networkLat}ms  ·  {connected ? 'LINKED' : 'OFFLINE'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chatHeaderRight}>
          <Pressable style={styles.headerIconBtn}>
            <Feather name="more-vertical" size={18} color={C.slate400} />
          </Pressable>
        </View>
      </View>

      {/* Inner row: messages + PTT panel */}
      <View style={[styles.innerRow, pttPosition === 'left' && { flexDirection: 'row-reverse' }]}>

        {/* Message Feed + Footer */}
        <View style={styles.feedWrapper}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageScroll}
            contentContainerStyle={styles.messageContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(msg => (
              <View
                key={msg.id}
                style={[styles.msgWrapper, msg.senderId === 'me' ? styles.msgRight : styles.msgLeft]}
              >
                {/* Sender + time header */}
                <View style={styles.msgMeta}>
                  <Text style={[
                    styles.msgSender,
                    msg.senderId === 'me'       ? { color: C.blue400 }  :
                    msg.senderId === 'dispatch' ? { color: '#f97316' }  : { color: '#f97316' }
                  ]}>
                    {msg.sender.toUpperCase()} {'<'}{msg.senderId}{'>'}
                  </Text>
                  <Text style={styles.msgTime}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Radio-style message card (left border) */}
                <View style={[
                  styles.radioBubble,
                  msg.senderId === 'me'
                    ? styles.radioBubbleSelf
                    : styles.radioBubbleOther,
                ]}>
                  {msg.type === 'TEXT' && (
                    <Text style={styles.radioBubbleText}>{msg.content}</Text>
                  )}

                  {msg.type === 'AUDIO' && (
                    <View style={styles.audioRow}>
                      <Pressable
                        onPress={() => toggleAudioPlayback(msg)}
                        style={[
                          styles.audioPlayBtn,
                          playingMsgId === msg.id && styles.audioPlayBtnActive,
                        ]}
                      >
                        <Feather
                          name={playingMsgId === msg.id ? 'pause' : 'play'}
                          size={14}
                          color={playingMsgId === msg.id ? C.white : C.slate400}
                        />
                      </Pressable>
                      {/* Waveform bars */}
                      <View style={[
                        styles.waveformRow,
                        playingMsgId === msg.id && { opacity: 1 },
                      ]}>
                        {[...Array(18)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.waveBar,
                              { height: Math.max(4, Math.floor(Math.random() * 20)) },
                              playingMsgId === msg.id && { backgroundColor: C.blue400 },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.audioDuration}>
                        {msg.duration && msg.duration > 0 ? `${msg.duration.toFixed(1)}s` : '···'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer Input */}
          <View style={styles.footer}>
            <View style={styles.footerInputRow}>
              <Pressable style={styles.attachBtn}>
                <Feather name="paperclip" size={16} color={C.slate400} />
              </Pressable>
              <TextInput
                style={styles.footerInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type tactical message..."
                placeholderTextColor={C.slate500}
                onSubmitEditing={handleSendText}
                returnKeyType="send"
              />
              <Pressable
                onPress={handleSendText}
                style={[styles.sendBtn, { backgroundColor: C.blue600 }]}
              >
                <Feather name="send" size={14} color={C.white} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* PTT Sidebar */}
        <View style={[
          styles.pttSidebar,
          pttPosition === 'left' ? styles.pttSidebarLeft : styles.pttSidebarRight,
        ]}>
          {/* Label */}
          <View style={styles.pttLabel}>
            <Feather name="radio" size={14} color={C.slate500} />
            <Text style={styles.pttLabelText}>PTT{'\n'}LINK</Text>
          </View>

          {/* Large PTT Button */}
          <Pressable
            style={[styles.pttButton, isPTTActive && styles.pttButtonActive]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            {/* Ping dot */}
            <View style={[styles.pttPingDot, isPTTActive && styles.pttPingDotActive]} />

            {/* Vertical "PRESS TO TALK" text */}
            <View style={styles.pttVertTextWrapper}>
              {'PRESS TO TALK'.split('').map((ch, i) => (
                <Text key={i} style={[styles.pttVertChar, isPTTActive && { color: C.white }]}>
                  {ch === ' ' ? '\n' : ch}
                </Text>
              ))}
            </View>

            <Feather
              name="mic"
              size={22}
              color={isPTTActive ? C.white : C.slate500}
              style={{ opacity: isPTTActive ? 1 : 0.4 }}
            />
          </Pressable>

          {/* Position toggle */}
          <Pressable
            onPress={() => setPttPosition(p => p === 'left' ? 'right' : 'left')}
            style={styles.pttToggleBtn}
          >
            <Feather name={pttPosition === 'left' ? 'chevron-right' : 'chevron-left'} size={14} color={C.slate400} />
          </Pressable>

          {/* Volume icon */}
          <Pressable style={styles.pttToggleBtn}>
            <Feather name="volume-2" size={14} color={C.slate400} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  ROOT
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        {isLargeScreen ? (
          <>
            {renderSidebar()}
            {renderChatArea()}
          </>
        ) : (
          mobileView === 'sidebar' ? renderSidebar() : renderChatArea()
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: 600,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg950,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Sidebar ─────────────────────────────────────────────────────────────
  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: C.bg900,
    borderRightWidth: 1,
    borderRightColor: C.border,
    flexDirection: 'column',
  },
  sidebarProfile: {
    padding: 16,
    backgroundColor: C.bg950,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.blue600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: C.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.white,
  },
  profileRole: {
    fontSize: 9,
    color: C.blue400,
    fontFamily: Fonts?.mono || 'monospace',
    fontWeight: 'bold',
  },

  searchRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    height: 34,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: C.slate200,
    fontWeight: '500',
  },

  channelList: {
    flex: 1,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: C.bg900,
  },
  channelItemActive: {
    backgroundColor: C.blue900b,
    borderColor: 'rgba(37,99,235,0.4)',
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
    flexShrink: 1,
  },
  channelName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.slate200,
    flexShrink: 1,
  },
  channelNameActive: {
    color: C.blue400,
  },
  channelFreq: {
    fontSize: 10,
    color: C.slate500,
    fontFamily: Fonts?.mono || 'monospace',
    marginTop: 2,
    opacity: 0.7,
  },
  channelRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  memberCount: {
    fontSize: 9,
    color: C.slate500,
  },

  // ── Chat Area ────────────────────────────────────────────────────────────
  chatArea: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: C.bg950,
  },
  chatHeader: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    marginRight: 2,
    padding: 4,
  },
  radioIconBox: {
    width: 40,
    height: 40,
    backgroundColor: C.bg800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.bg700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerChannelName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: C.slate200,
    flexShrink: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red500,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  headerSubText: {
    fontSize: 9,
    color: C.slate500,
    fontFamily: Fonts?.mono || 'monospace',
    fontWeight: '600',
  },
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
  },

  // Inner row (messages + PTT)
  innerRow: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  feedWrapper: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // ── Message Feed ─────────────────────────────────────────────────────────
  messageScroll: {
    flex: 1,
    backgroundColor: C.bg950,
  },
  messageContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  msgWrapper: {
    maxWidth: '80%',
  },
  msgLeft: {
    alignSelf: 'flex-start',
  },
  msgRight: {
    alignSelf: 'flex-end',
  },
  msgMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
    paddingHorizontal: 2,
  },
  msgSender: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Fonts?.mono || 'monospace',
    letterSpacing: 0.4,
  },
  msgTime: {
    fontSize: 9,
    color: C.slate600,
    fontFamily: Fonts?.mono || 'monospace',
  },

  // Radio-style card with left border
  radioBubble: {
    padding: 10,
    borderRadius: 2,
    borderLeftWidth: 2,
  },
  radioBubbleSelf: {
    backgroundColor: C.blue900b,
    borderLeftColor: C.blue500,
  },
  radioBubbleOther: {
    backgroundColor: C.bg800,
    borderLeftColor: C.slate600,
  },
  radioBubbleText: {
    fontSize: 11,
    fontFamily: Fonts?.mono || 'monospace',
    color: C.slate200,
    lineHeight: 17,
  },

  // Audio inside bubble
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlayBtnActive: {
    backgroundColor: C.blue600,
    borderColor: C.blue500,
    shadowColor: C.blue500,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  waveformRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    opacity: 0.5,
  },
  waveBar: {
    width: 3,
    backgroundColor: C.slate400,
    borderRadius: 1.5,
  },
  audioDuration: {
    fontSize: 9,
    color: C.slate500,
    fontFamily: Fonts?.mono || 'monospace',
  },

  // ── Footer Input ─────────────────────────────────────────────────────────
  footer: {
    backgroundColor: C.bg900,
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 10,
  },
  footerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg950,
    borderWidth: 1,
    borderColor: C.bg700,
    borderRadius: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  attachBtn: {
    padding: 10,
    backgroundColor: C.bg800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.bg700,
    margin: 2,
  },
  footerInput: {
    flex: 1,
    fontSize: 11,
    color: C.white,
    fontFamily: Fonts?.mono || 'monospace',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    shadowColor: C.blue600,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── PTT Sidebar ──────────────────────────────────────────────────────────
  pttSidebar: {
    width: 88,
    height: '100%',
    backgroundColor: C.bg900,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  pttSidebarLeft: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  pttSidebarRight: {
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  pttLabel: {
    alignItems: 'center',
    gap: 3,
    opacity: 0.5,
  },
  pttLabelText: {
    fontSize: 8,
    fontFamily: Fonts?.mono || 'monospace',
    color: C.slate500,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: 'bold',
    lineHeight: 11,
  },

  // Large PTT button
  pttButton: {
    flex: 1,
    width: 68,
    borderRadius: 34,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.bg800,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 8,
    borderBottomColor: C.bg950,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    // prevent text selection on long press
    // @ts-ignore
    userSelect: 'none',
  },
  pttButtonActive: {
    backgroundColor: C.green600,
    borderColor: C.green500,
    borderBottomColor: C.green600,
    shadowColor: C.green500,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  pttPingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.slate600,
  },
  pttPingDotActive: {
    backgroundColor: C.white,
  },
  pttVertTextWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pttVertChar: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: C.yellow500,
    lineHeight: 13,
  },

  pttToggleBtn: {
    padding: 8,
    backgroundColor: C.bg800,
    borderRadius: 8,
  },
});
