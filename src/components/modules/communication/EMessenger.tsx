import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Resolve backend server URL dynamically
const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return `http://${hostname}:3000`;
    }
  }
  // Native devices / simulators need mapping to Metro server host IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://localhost:3000';
};

interface Message {
  id: string;
  sender: string;
  text: string;
  channel: string;
  timestamp: string;
  isSystem: boolean;
  isSimulated?: boolean;
}

interface User {
  callsign: string;
  channel: string;
  isSimulated: boolean;
  status: string;
}

export default function EMessenger({ theme, isDark }: { theme: any; isDark: boolean }) {
  const socketRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [latency, setLatency] = useState(0);
  const [callsign, setCallsign] = useState('');
  const [tempCallsign, setTempCallsign] = useState('');
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [activeChannel, setActiveChannel] = useState('#dispatch');
  const [channels, setChannels] = useState<string[]>(['#dispatch', '#tactical-1', '#intel-ops']);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Split view states
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);

  // Sync mobile view on screen resizing
  useEffect(() => {
    if (isLargeScreen) {
      setMobileView('chat');
    }
  }, [isLargeScreen]);

  // Connect to socket.io server
  useEffect(() => {
    const serverUrl = getSocketUrl();
    console.log('[EMessenger] Connecting to:', serverUrl);
    setConnecting(true);

    const socket = io(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      console.log('[EMessenger] Connected successfully');
      
      // Measure connection latency
      const start = Date.now();
      socket.emit('ping');
      socket.once('pong', () => {
        setLatency(Date.now() - start);
      });
    });

    // Periodically update latency (ping/pong check)
    const latencyInterval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping');
        socket.once('pong', () => {
          setLatency(Date.now() - start);
        });
      }
    }, 10000);

    socket.on('init', (data: { defaultCallsign: string; channels: string[]; activeChannel: string }) => {
      setChannels(data.channels);
      setActiveChannel(data.activeChannel);
      // Random callsign received from server
      const defaultCall = data.defaultCallsign;
      setCallsign(defaultCall);
      setTempCallsign(defaultCall);
      
      // Register our connection with this callsign
      socket.emit('register', { callsign: defaultCall });
    });

    socket.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_list', (userList: User[]) => {
      setUsers(userList);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setConnecting(false);
      console.log('[EMessenger] Disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setConnecting(false);
      console.log('[EMessenger] Connection error:', err.message);
    });

    return () => {
      clearInterval(latencyInterval);
      socket.disconnect();
    };
  }, []);

  // Load history from Firebase Firestore
  useEffect(() => {
    const loadHistory = async () => {
      try {
        console.log('[EMessenger] Fetching history from Firestore...');
        // Query last 100 messages overall to bypass index requirement
        const q = query(
          collection(db, 'messages'),
          orderBy('createdAt', 'asc'),
          limit(100)
        );
        const querySnapshot = await getDocs(q);
        const hist = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              sender: data.sender || '',
              text: data.text || '',
              channel: data.channel || '',
              timestamp: data.timestamp || '',
              isSystem: data.isSystem || false,
              isSimulated: data.isSimulated || false,
            };
          })
          .filter((m) => m.channel === activeChannel && !m.isSimulated);

        setMessages(hist);
      } catch (e) {
        console.warn('[EMessenger] Firestore history load error:', e);
      }
    };

    if (connected) {
      loadHistory();
    }
  }, [activeChannel, connected]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle setting/changing callsign
  const handleUpdateCallsign = () => {
    if (!tempCallsign.trim()) return;
    const formatted = tempCallsign.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCallsign(formatted);
    setIsEditingCallsign(false);
    if (socketRef.current) {
      socketRef.current.emit('register', { callsign: formatted });
    }
  };

  // Switch chat channels
  const handleSelectChannel = (channel: string) => {
    if (channel === activeChannel) return;
    setActiveChannel(channel);
    setMessages([]); // Clear chat feed for the new channel
    if (socketRef.current) {
      socketRef.current.emit('join_channel', channel);
    }
    if (!isLargeScreen) {
      setMobileView('chat');
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const finalTxt = textToSend || inputText;
    if (!finalTxt.trim() || !connected) return;

    const msgTimestamp = new Date().toTimeString().split(' ')[0];
    const msgData = {
      sender: callsign,
      text: finalTxt.trim(),
      channel: activeChannel,
      timestamp: msgTimestamp,
      isSystem: false,
      createdAt: Date.now(),
    };

    try {
      // 1. Save to Firebase Firestore
      const docRef = await addDoc(collection(db, 'messages'), msgData);
      
      // 2. Broadcast via Socket.io
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          id: docRef.id,
          ...msgData
        });
      }

      if (!textToSend) {
        setInputText('');
      }
    } catch (e) {
      console.error('[EMessenger] Save to Firestore failed:', e);
      // Fallback: send via socket
      if (socketRef.current) {
        socketRef.current.emit('send_message', { text: finalTxt.trim() });
      }
      if (!textToSend) {
        setInputText('');
      }
    }
  };

  // Quick tactical codes to send instantly
  const QUICK_CODES = [
    { label: '10-4 (ACK)', val: '10-4 Acknowledged.' },
    { label: '10-20 (LOC)', val: 'Requesting 10-20 (Location check).' },
    { label: '10-78 (NEED ASSIST)', val: '10-78 - Officer requests assistance immediately.' },
    { label: 'SECURE', val: 'Area secured. No active threats.' },
    { label: 'EN ROUTE', val: 'En route to location.' },
  ];

  // Helper: Retrieve last message info for sidebar channel view
  const getLastMessage = (channelName: string) => {
    const chanMsgs = messages.filter(m => m.channel === channelName);
    if (chanMsgs.length === 0) return 'No broadcasts yet';
    const last = chanMsgs[chanMsgs.length - 1];
    if (last.isSystem) return last.text;
    return `${last.sender}: ${last.text}`;
  };

  const getLastMessageTime = (channelName: string) => {
    const chanMsgs = messages.filter(m => m.channel === channelName);
    if (chanMsgs.length === 0) return '';
    const last = chanMsgs[chanMsgs.length - 1];
    if (last.timestamp) {
      const parts = last.timestamp.split(':');
      if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
      return last.timestamp;
    }
    return '';
  };

  // Filter messages for current channel
  const filteredMessages = messages.filter((m) => m.channel === activeChannel);

  // Group consecutive messages by sender and render them
  const renderMessageList = () => {
    return filteredMessages.map((msg, index) => {
      if (msg.isSystem) {
        return (
          <View key={msg.id} style={styles.systemMsgContainer}>
            <Text style={[styles.systemLogText, { color: theme.textSecondary }]}>
              {`[${msg.timestamp}] *** ${msg.text}`}
            </Text>
          </View>
        );
      }

      const isSelf = msg.sender === callsign;
      
      const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
      const nextMsg = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;
      
      const isConsecutivePrev = prevMsg && !prevMsg.isSystem && prevMsg.sender === msg.sender;
      const isConsecutiveNext = nextMsg && !nextMsg.isSystem && nextMsg.sender === msg.sender;

      return (
        <View
          key={msg.id}
          style={[
            styles.messageBubbleWrapper,
            isSelf ? styles.msgRight : styles.msgLeft,
            isConsecutivePrev && { marginTop: 2 }
          ]}
        >
          {!isConsecutivePrev && (
            <View style={styles.msgHeader}>
              <Text style={[
                styles.msgSender, 
                { color: isSelf ? theme.primary : (msg.isSimulated ? theme.warning : theme.accent) }
              ]}>
                {msg.sender}
              </Text>
              <Text style={[styles.msgTime, { color: theme.textSecondary }]}>
                {msg.timestamp}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            {!isSelf && (
              <View style={[styles.avatarCircle, { backgroundColor: msg.isSimulated ? theme.warningGlow : theme.accentGlow }]}>
                {!isConsecutiveNext ? (
                  <Text style={[styles.avatarText, { color: msg.isSimulated ? theme.warning : theme.accent }]}>
                    {msg.sender.substring(0, 2)}
                  </Text>
                ) : (
                  <View style={{ width: 24 }} />
                )}
              </View>
            )}

            <View style={[
              styles.messageBubble,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              isSelf && { 
                borderColor: theme.primary, 
                backgroundColor: theme.primary,
              },
              isSelf && styles.bubbleSelf,
              !isSelf && styles.bubbleOther,
              isSelf && isConsecutivePrev && { borderTopRightRadius: 4 },
              isSelf && isConsecutiveNext && { borderBottomRightRadius: 4 },
              !isSelf && isConsecutivePrev && { borderTopLeftRadius: 4 },
              !isSelf && isConsecutiveNext && { borderBottomLeftRadius: 4 },
              msg.isSimulated && { borderColor: theme.warning + '50' }
            ]}>
              <Text style={[
                styles.messageText, 
                { color: theme.text },
                isSelf && { color: '#ffffff' }
              ]}>
                {msg.text}
              </Text>
            </View>
          </View>
        </View>
      );
    });
  };

  // Left Sidebar: Channels & Roster List
  const renderSidebar = () => {
    return (
      <View style={[styles.sidebarContainer, { backgroundColor: isDark ? '#0d1117' : '#f5f6f8', borderColor: theme.border }]}>
        <View style={styles.sidebarHeader}>
          <Text style={[styles.sidebarTitle, { color: theme.text }]}>Tactical Comms</Text>
          <Pressable 
            style={[styles.callsignBadge, { backgroundColor: theme.primaryGlow, borderColor: theme.primary }]}
            onPress={() => setIsEditingCallsign(!isEditingCallsign)}
          >
            <Feather name="edit-2" size={10} color={theme.primary} />
            <Text style={[styles.callsignBadgeText, { color: theme.primary }]}> {callsign}</Text>
          </Pressable>
        </View>

        {isEditingCallsign && (
          <View style={[styles.callsignEditorDropdown, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <TextInput
              style={[styles.callsignInput, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#0d1117' : '#ffffff' }]}
              value={tempCallsign}
              onChangeText={setTempCallsign}
              placeholder="CALLSIGN (e.g. K9-1)"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              maxLength={12}
            />
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <Pressable style={[styles.inlineSaveBtn, { backgroundColor: theme.primary }]} onPress={handleUpdateCallsign}>
                <Text style={styles.inlineBtnText}>SAVE</Text>
              </Pressable>
              <Pressable style={[styles.inlineCancelBtn, { borderColor: theme.border }]} onPress={() => setIsEditingCallsign(false)}>
                <Text style={[styles.inlineCancelBtnText, { color: theme.textSecondary }]}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.activeUsersSection}>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>ONLINE UNITS ({users.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeUsersRow}>
            {users.map((u, i) => (
              <View key={`${u.callsign}-${i}`} style={styles.activeUserBubble}>
                <View style={[styles.avatarCircleLarge, { backgroundColor: u.isSimulated ? theme.warningGlow : theme.successGlow }]}>
                  <Text style={[styles.avatarCircleTextLarge, { color: u.isSimulated ? theme.warning : theme.success }]}>
                    {u.callsign.substring(0, 2)}
                  </Text>
                  <View style={[styles.statusDotActive, { backgroundColor: u.isSimulated ? theme.textSecondary : theme.success }]} />
                </View>
                <Text numberOfLines={1} style={[styles.activeUserCallsign, { color: theme.text }]}>{u.callsign}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, paddingLeft: 16, marginBottom: 4 }]}>CHANNELS</Text>
        <ScrollView style={styles.sidebarList}>
          {channels.map((chan) => {
            const isActive = activeChannel === chan;
            const lastMsg = getLastMessage(chan);
            const lastMsgTime = getLastMessageTime(chan);
            
            return (
              <Pressable
                key={chan}
                style={[
                  styles.channelItem,
                  isActive && { backgroundColor: isDark ? '#1f242c' : '#e4e6eb' }
                ]}
                onPress={() => handleSelectChannel(chan)}
              >
                <View style={[styles.channelIconContainer, { backgroundColor: isActive ? theme.primary : (isDark ? '#21262d' : '#e4e6eb') }]}>
                  <Feather name={chan === '#dispatch' ? 'shield' : chan === '#tactical-1' ? 'crosshair' : 'activity'} size={14} color={isActive ? '#ffffff' : theme.text} />
                </View>
                <View style={styles.channelInfo}>
                  <View style={styles.channelInfoTop}>
                    <Text numberOfLines={1} style={[styles.channelNameText, { color: theme.text }, isActive && { fontWeight: 'bold' }]}>
                      {chan.toUpperCase()}
                    </Text>
                    <Text style={[styles.channelTimeText, { color: theme.textSecondary }]}>{lastMsgTime}</Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.channelLastMsgText, { color: theme.textSecondary }, isActive && { color: theme.text }]}>
                    {lastMsg}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Main Chat Pane: Log, Input & Action triggers
  const renderChatArea = () => {
    return (
      <View style={styles.chatAreaContainer}>
        <View style={[styles.chatHeader, { backgroundColor: isDark ? '#0d1117' : '#ffffff', borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {!isLargeScreen && (
              <Pressable onPress={() => setMobileView('sidebar')} style={styles.backButton}>
                <Feather name="chevron-left" size={24} color={theme.primary} />
              </Pressable>
            )}
            <View style={[styles.headerAvatar, { backgroundColor: theme.primaryGlow }]}>
              <Feather name={activeChannel === '#dispatch' ? 'shield' : activeChannel === '#tactical-1' ? 'crosshair' : 'activity'} size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.headerChannelName, { color: theme.text }]}>{activeChannel.toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[styles.indicatorDot, { backgroundColor: connected ? theme.success : theme.danger, width: 6, height: 6, borderRadius: 3 }]} />
                <Text style={[styles.headerStatusText, { color: theme.textSecondary }]}>
                  {connected ? 'SECURE COM LINK' : 'LINK OFFLINE'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable style={styles.headerIconBtn}>
              <Feather name="phone" size={18} color={theme.primary} />
            </Pressable>
            <Pressable style={styles.headerIconBtn}>
              <Feather name="video" size={18} color={theme.primary} />
            </Pressable>
            {isLargeScreen && (
              <Pressable onPress={() => setShowInfoSidebar(!showInfoSidebar)} style={styles.headerIconBtn}>
                <Feather name="info" size={18} color={showInfoSidebar ? theme.primary : theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.chatFeedContainer, { backgroundColor: isDark ? '#08090d' : '#f5f6f8' }]}>
          {connecting && messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.systemLogText, { color: theme.textSecondary, marginTop: Spacing.two }]}>
                INITIALIZING SECURE COM CHANNELS...
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageScroll}
              contentContainerStyle={styles.messageContent}
              nestedScrollEnabled={true}
            >
              {filteredMessages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="message-square" size={32} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    COM CHANNEL SECURED // NO BROADCASTS YET
                  </Text>
                </View>
              ) : (
                renderMessageList()
              )}
            </ScrollView>
          )}
        </View>

        <View style={[styles.bottomControlsContainer, { backgroundColor: isDark ? '#0d1117' : '#ffffff', borderColor: theme.border }]}>
          <View style={styles.quickKeysWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickKeysScroll}>
              {QUICK_CODES.map((code, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.quickKeyBadge, { backgroundColor: isDark ? '#21262d' : '#e4e6eb' }]}
                  onPress={() => handleSendMessage(code.val)}
                  disabled={!connected}
                >
                  <Text style={[styles.quickKeyBadgeText, { color: theme.text }]}>{code.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputControlsRow}>
            <Pressable style={styles.inputUtilityBtn}>
              <Feather name="plus-circle" size={20} color={theme.primary} />
            </Pressable>
            <Pressable style={styles.inputUtilityBtn}>
              <Feather name="image" size={20} color={theme.primary} />
            </Pressable>
            <View style={[styles.textInputWrapper, { backgroundColor: isDark ? '#1f242c' : '#f0f2f5' }]}>
              <TextInput
                style={[styles.textInputMain, { color: theme.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={connected ? `Message ${activeChannel}...` : "Connecting..."}
                placeholderTextColor={theme.textSecondary}
                editable={connected}
                onSubmitEditing={() => handleSendMessage()}
                returnKeyType="send"
              />
              <Pressable style={styles.emojiBtn}>
                <Feather name="smile" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.mainSendBtn, { backgroundColor: connected ? theme.primary : theme.border }]}
              onPress={() => handleSendMessage()}
              disabled={!connected}
            >
              <Feather name="send" size={14} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Right Sidebar: Channel Profile, Active Users roster, Network Parameters
  const renderDetailsSidebar = () => {
    const activeUnitsInChannel = users.filter((u) => u.channel === activeChannel || u.channel === 'all');
    
    return (
      <View style={[styles.detailsSidebar, { backgroundColor: isDark ? '#0d1117' : '#f5f6f8', borderColor: theme.border }]}>
        <ScrollView contentContainerStyle={styles.detailsScrollContent}>
          <View style={styles.detailsHeader}>
            <View style={[styles.detailsAvatarCircle, { backgroundColor: theme.primaryGlow }]}>
              <Feather name="users" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.detailsChannelName, { color: theme.text }]}>{activeChannel.toUpperCase()}</Text>
            <Text style={[styles.detailsChannelSub, { color: theme.textSecondary }]}>Encrypted Tactical Channel</Text>
          </View>

          <View style={styles.detailsSection}>
            <Text style={[styles.detailsSectionTitle, { color: theme.textSecondary }]}>NETWORK SECURITY</Text>
            <View style={[styles.detailsStatRow, { borderColor: theme.border }]}>
              <Text style={[styles.detailsStatLabel, { color: theme.textSecondary }]}>COM LINK</Text>
              <Text style={[styles.detailsStatVal, { color: connected ? theme.success : theme.danger }]}>
                {connected ? 'SECURE' : 'DISCONNECTED'}
              </Text>
            </View>
            <View style={[styles.detailsStatRow, { borderColor: theme.border }]}>
              <Text style={[styles.detailsStatLabel, { color: theme.textSecondary }]}>LATENCY</Text>
              <Text style={[styles.detailsStatVal, { color: theme.text }]}>{latency}ms</Text>
            </View>
            <View style={[styles.detailsStatRow, { borderColor: theme.border }]}>
              <Text style={[styles.detailsStatLabel, { color: theme.textSecondary }]}>ACTIVE CALLSIGN</Text>
              <Text style={[styles.detailsStatVal, { color: theme.primary }]}>{callsign}</Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={[styles.detailsSectionTitle, { color: theme.textSecondary }]}>ACTIVE UNITS ({activeUnitsInChannel.length})</Text>
            {activeUnitsInChannel.map((u, i) => (
              <View key={`${u.callsign}-${i}`} style={styles.detailsUserItem}>
                <View style={[styles.statusDotActive, { position: 'relative', marginRight: 8, bottom: 0, right: 0, backgroundColor: u.isSimulated ? theme.textSecondary : theme.success }]} />
                <Text numberOfLines={1} style={[styles.detailsUserCallsign, { color: theme.text }]}>{u.callsign}</Text>
                <Text style={[styles.detailsUserStatus, { color: u.isSimulated ? theme.textSecondary : theme.success }]}>{u.status}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.cardContainer, { height: 600, overflow: 'hidden', borderWidth: 1, borderRadius: 12, borderColor: theme.border }]}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {isLargeScreen ? (
          <>
            {renderSidebar()}
            {renderChatArea()}
            {showInfoSidebar && renderDetailsSidebar()}
          </>
        ) : (
          <>
            {mobileView === 'sidebar' ? renderSidebar() : renderChatArea()}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
  },
  sidebarContainer: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  callsignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  callsignBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeUsersSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  activeUsersRow: {
    paddingHorizontal: 12,
    gap: 12,
    flexDirection: 'row',
  },
  activeUserBubble: {
    alignItems: 'center',
    width: 55,
  },
  avatarCircleLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarCircleTextLarge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#0d1117',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  activeUserCallsign: {
    fontSize: 8.5,
    marginTop: 4,
    textAlign: 'center',
  },
  sidebarList: {
    flex: 1,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
    gap: 10,
  },
  channelIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  channelInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  channelNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  channelTimeText: {
    fontSize: 9,
  },
  channelLastMsgText: {
    fontSize: 10,
  },
  chatAreaContainer: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
  },
  chatHeader: {
    height: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerChannelName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  headerIconBtn: {
    padding: 6,
  },
  backButton: {
    padding: 4,
    marginRight: -4,
  },
  chatFeedContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageScroll: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 10,
    textAlign: 'center',
  },
  systemMsgContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  systemLogText: {
    fontSize: 9,
    fontFamily: Fonts?.mono || 'monospace',
    textAlign: 'center',
  },
  messageBubbleWrapper: {
    marginBottom: 6,
    maxWidth: '75%',
  },
  msgLeft: {
    alignSelf: 'flex-start',
  },
  msgRight: {
    alignSelf: 'flex-end',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
    marginLeft: 32,
    gap: 6,
  },
  msgSender: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Fonts?.mono || 'monospace',
  },
  msgTime: {
    fontSize: 8,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '100%',
  },
  bubbleSelf: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  bottomControlsContainer: {
    borderTopWidth: 1,
    padding: 10,
    flexDirection: 'column',
  },
  quickKeysWrapper: {
    marginBottom: 8,
  },
  quickKeysScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  quickKeyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quickKeyBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  inputControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputUtilityBtn: {
    padding: 4,
  },
  textInputWrapper: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInputMain: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 0,
  },
  emojiBtn: {
    padding: 2,
  },
  mainSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSidebar: {
    width: 250,
    height: '100%',
    borderLeftWidth: 1,
  },
  detailsScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  detailsHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  detailsAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsChannelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsChannelSub: {
    fontSize: 10,
    marginTop: 2,
  },
  detailsSection: {
    width: '100%',
    marginTop: 16,
  },
  detailsSectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailsStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailsStatLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailsStatVal: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsUserCallsign: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  detailsUserStatus: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  callsignEditorDropdown: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'column',
  },
  callsignInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: Fonts?.mono || 'monospace',
  },
  inlineSaveBtn: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inlineCancelBtn: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineCancelBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

