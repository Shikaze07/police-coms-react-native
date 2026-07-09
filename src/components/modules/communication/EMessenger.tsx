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
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';
import { io } from 'socket.io-client';
import { db } from '../../lib/firebase';
import { getSocketUrl } from '../../lib/network';

// --- Constants ---
const C = {
  bg950: '#020617',
  bg900: '#0f172a',
  bg800: '#1e293b',
  bg700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  emerald600: '#059669',
  emerald500: '#10b981',
  emerald400: '#34d399',
  emerald200: '#a7f3d0',
  white: '#ffffff',
  border: '#1e293b',
};

// --- Types ---
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

interface ChatContact {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
}

// --- Mock Contacts ---
const MOCK_CONTACTS: ChatContact[] = [
  { id: '#dispatch',     name: '#DISPATCH',    initials: 'DS', lastMessage: 'No broadcasts yet', time: '', unread: 0, status: 'ONLINE' },
  { id: '#tactical-1',  name: '#TACTICAL-1',  initials: 'T1', lastMessage: 'No broadcasts yet', time: '', unread: 0, status: 'ONLINE' },
  { id: '#intel-ops',   name: '#INTEL-OPS',   initials: 'IO', lastMessage: 'No broadcasts yet', time: '', unread: 0, status: 'ONLINE' },
];

const QUICK_CODES = [
  { label: '10-4 (ACK)',       val: '10-4 Acknowledged.' },
  { label: '10-20 (LOC)',      val: 'Requesting 10-20 (Location check).' },
  { label: '10-78 (ASSIST)',   val: '10-78 - Officer requests assistance immediately.' },
  { label: 'SECURE',           val: 'Area secured. No active threats.' },
  { label: 'EN ROUTE',         val: 'En route to location.' },
];

export default function EMessenger({ theme, isDark }: { theme: any; isDark: boolean }) {
  const socketRef      = useRef<any>(null);
  const scrollViewRef  = useRef<ScrollView>(null);

  const [connected,          setConnected]          = useState(false);
  const [connecting,         setConnecting]         = useState(true);
  const [latency,            setLatency]            = useState(0);
  const [callsign,           setCallsign]           = useState('');
  const [tempCallsign,       setTempCallsign]       = useState('');
  const [isEditingCallsign,  setIsEditingCallsign]  = useState(false);
  const [activeChannel,      setActiveChannel]      = useState('#dispatch');
  const [channels,           setChannels]           = useState<string[]>(['#dispatch', '#tactical-1', '#intel-ops']);
  const [messages,           setMessages]           = useState<Message[]>([]);
  const [inputText,          setInputText]          = useState('');
  const [users,              setUsers]              = useState<User[]>([]);
  const [searchQuery,        setSearchQuery]        = useState('');

  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');

  // Build contact list from channels state
  const contacts: ChatContact[] = channels.map((ch) => {
    const base = MOCK_CONTACTS.find((c) => c.id === ch);
    const chanMsgs = messages.filter((m) => m.channel === ch);
    const last = chanMsgs.length > 0 ? chanMsgs[chanMsgs.length - 1] : null;
    const lastMsg = last ? (last.isSystem ? last.text : `${last.sender}: ${last.text}`) : 'No broadcasts yet';
    const lastTime = last?.timestamp ? last.timestamp.split(':').slice(0, 2).join(':') : '';
    return {
      id: ch,
      name: ch.toUpperCase(),
      initials: base?.initials || ch.substring(1, 3).toUpperCase(),
      lastMessage: lastMsg,
      time: lastTime,
      unread: 0,
      status: 'ONLINE',
    };
  });

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sync mobile view on resize
  useEffect(() => {
    if (isLargeScreen) setMobileView('chat');
  }, [isLargeScreen]);

  // Socket.io connection
  useEffect(() => {
    let isMounted = true;
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
        setConnected(true);
        setConnecting(false);
        const start = Date.now();
        socket.emit('ping');
        socket.once('pong', () => setLatency(Date.now() - start));
      });

      const latencyInterval = setInterval(() => {
        if (socket.connected) {
          const start = Date.now();
          socket.emit('ping');
          socket.once('pong', () => setLatency(Date.now() - start));
        }
      }, 10000);

      socket.on('init', (data: { defaultCallsign: string; channels: string[]; activeChannel: string }) => {
        setChannels(data.channels);
        setActiveChannel(data.activeChannel);
        setCallsign(data.defaultCallsign);
        setTempCallsign(data.defaultCallsign);
        socket.emit('register', { callsign: data.defaultCallsign, clientType: 'chat' });
      });

      socket.on('message', (msg: Message) => setMessages((prev) => [...prev, msg]));
      socket.on('user_list', (userList: User[]) => setUsers(userList));
      socket.on('disconnect', () => { setConnected(false); setConnecting(false); });
      socket.on('connect_error', () => { setConnected(false); setConnecting(false); });

      return () => {
        clearInterval(latencyInterval);
        socket.disconnect();
      };
    };

    void connectSocket();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Firestore history
  useEffect(() => {
    if (!connected) return;
    const loadHistory = async () => {
      try {
        const snap = await db.collection('messages').orderBy('createdAt', 'asc').limit(100).get();
        const hist = snap.docs
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              sender: d.sender || '',
              text: d.text || '',
              channel: d.channel || '',
              timestamp: d.timestamp || '',
              isSystem: d.isSystem || false,
              isSimulated: d.isSimulated || false,
            };
          })
          .filter((m) => m.channel === activeChannel && !m.isSimulated);
        setMessages(hist);
      } catch (e) {
        console.warn('[EMessenger] Firestore load error:', e);
      }
    };
    loadHistory();
  }, [activeChannel, connected]);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleUpdateCallsign = () => {
    if (!tempCallsign.trim()) return;
    const formatted = tempCallsign.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCallsign(formatted);
    setIsEditingCallsign(false);
    socketRef.current?.emit('register', { callsign: formatted, clientType: 'chat' });
  };

  const handleSelectChannel = (channel: string) => {
    if (channel === activeChannel) return;
    setActiveChannel(channel);
    setMessages([]);
    socketRef.current?.emit('join_channel', channel);
    if (!isLargeScreen) setMobileView('chat');
  };

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
      const docRef = await db.collection('messages').add(msgData);
      socketRef.current?.emit('send_message', { id: docRef.id, ...msgData });
    } catch {
      socketRef.current?.emit('send_message', { text: finalTxt.trim() });
    } finally {
      if (!textToSend) setInputText('');
    }
  };

  const filteredMessages = messages.filter((m) => m.channel === activeChannel);

  // ─────────────────────────────────────────
  //  RENDER: LEFT SIDEBAR (Contacts/Channels)
  // ─────────────────────────────────────────
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Header: profile + callsign */}
      <View style={styles.sidebarProfile}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{callsign ? callsign.charAt(0) : '?'}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{callsign || 'OFFICER'}</Text>
          <Text style={styles.profileRole}>FIELD OFFICER</Text>
        </View>
        <Pressable
          onPress={() => setIsEditingCallsign(!isEditingCallsign)}
          style={styles.editCallsignBtn}
        >
          <Feather name="edit-2" size={12} color={C.emerald400} />
        </Pressable>
      </View>

      {/* Callsign Editor */}
      {isEditingCallsign && (
        <View style={styles.callsignEditor}>
          <TextInput
            style={styles.callsignInput}
            value={tempCallsign}
            onChangeText={setTempCallsign}
            placeholder="CALLSIGN (e.g. K9-1)"
            placeholderTextColor={C.slate500}
            autoCapitalize="characters"
            maxLength={12}
          />
          <View style={styles.callsignBtns}>
            <Pressable style={styles.callsignSave} onPress={handleUpdateCallsign}>
              <Text style={styles.callsignSaveText}>SAVE</Text>
            </Pressable>
            <Pressable style={styles.callsignCancel} onPress={() => setIsEditingCallsign(false)}>
              <Text style={styles.callsignCancelText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={14} color={C.slate500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={C.slate500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Online Units */}
      {users.length > 0 && (
        <View style={styles.onlineSection}>
          <Text style={styles.sectionLabel}>ONLINE UNITS ({users.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onlineRow}>
            {users.map((u, i) => (
              <View key={`${u.callsign}-${i}`} style={styles.onlineBubble}>
                <View style={styles.onlineAvatar}>
                  <Text style={styles.onlineAvatarText}>{u.callsign.substring(0, 2)}</Text>
                  <View style={[styles.onlineDot, { backgroundColor: u.isSimulated ? C.slate500 : C.emerald500 }]} />
                </View>
                <Text numberOfLines={1} style={styles.onlineCallsign}>{u.callsign}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Contact List */}
      <ScrollView style={styles.contactList}>
        {filteredContacts.map((contact) => {
          const isActive = contact.id === activeChannel;
          return (
            <Pressable
              key={contact.id}
              onPress={() => handleSelectChannel(contact.id)}
              style={[styles.contactItem, isActive && styles.contactItemActive]}
            >
              <View style={styles.contactAvatarWrapper}>
                <View style={[styles.contactAvatar, isActive && styles.contactAvatarActive]}>
                  <Text style={[styles.contactAvatarText, isActive && styles.contactAvatarTextActive]}>
                    {contact.initials}
                  </Text>
                </View>
                <View style={[
                  styles.contactStatusDot,
                  { backgroundColor: contact.status === 'ONLINE' ? C.emerald500 : C.slate500 }
                ]} />
              </View>
              <View style={styles.contactInfo}>
                <View style={styles.contactInfoTop}>
                  <Text
                    numberOfLines={1}
                    style={[styles.contactName, isActive && styles.contactNameActive]}
                  >
                    {contact.name}
                  </Text>
                  {contact.time ? (
                    <Text style={styles.contactTime}>{contact.time}</Text>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={styles.contactLastMsg}>{contact.lastMessage}</Text>
              </View>
              {contact.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{contact.unread}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────
  //  RENDER: MAIN CHAT AREA
  // ─────────────────────────────────────────
  const renderChatArea = () => (
    <View style={styles.chatArea}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          {!isLargeScreen && (
            <Pressable onPress={() => setMobileView('sidebar')} style={styles.backBtn}>
              <Feather name="chevron-left" size={22} color={C.emerald400} />
            </Pressable>
          )}
          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatHeaderAvatarText}>
              {activeChannel.substring(1, 3).toUpperCase()}
            </Text>
            <View style={[styles.chatHeaderDot, { backgroundColor: connected ? C.emerald500 : '#ef4444' }]} />
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{activeChannel.toUpperCase()}</Text>
            <View style={styles.chatHeaderStatusRow}>
              <View style={[styles.chatStatusDot, { backgroundColor: connected ? C.emerald500 : '#ef4444' }]} />
              <Text style={styles.chatHeaderStatus}>
                {connected ? 'SECURE COM LINK' : connecting ? 'CONNECTING...' : 'LINK OFFLINE'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.chatHeaderRight}>
          <Pressable style={styles.headerIconBtn}>
            <Feather name="phone" size={18} color={C.slate400} />
          </Pressable>
          <Pressable style={styles.headerIconBtn}>
            <Feather name="video" size={18} color={C.slate400} />
          </Pressable>
          <Pressable style={styles.headerIconBtn}>
            <Feather name="more-vertical" size={18} color={C.slate400} />
          </Pressable>
        </View>
      </View>

      {/* Message Feed */}
      <View style={styles.messageFeed}>
        {connecting && filteredMessages.length === 0 ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={C.emerald500} />
            <Text style={styles.loadingText}>INITIALIZING SECURE COM CHANNELS...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageScroll}
            contentContainerStyle={styles.messageScrollContent}
          >
            {filteredMessages.length === 0 ? (
              <View style={styles.emptyWrapper}>
                <Feather name="message-square" size={32} color={C.slate500} style={{ opacity: 0.4, marginBottom: 12 }} />
                <Text style={styles.emptyText}>COM CHANNEL SECURED{"\n"}NO BROADCASTS YET</Text>
              </View>
            ) : (
              filteredMessages.map((msg, index) => {
                if (msg.isSystem) {
                  return (
                    <View key={`${msg.id}-${index}`} style={styles.systemMsgRow}>
                      <Text style={styles.systemMsgText}>{`[${msg.timestamp}] *** ${msg.text}`}</Text>
                    </View>
                  );
                }

                const isSelf = msg.sender === callsign;
                const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
                const nextMsg = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;
                const isConsecPrev = prevMsg && !prevMsg.isSystem && prevMsg.sender === msg.sender;
                const isConsecNext = nextMsg && !nextMsg.isSystem && nextMsg.sender === msg.sender;

                return (
                  <View
                    key={`${msg.id}-${index}`}
                    style={[
                      styles.msgWrapper,
                      isSelf ? styles.msgWrapperRight : styles.msgWrapperLeft,
                      isConsecPrev && { marginTop: 2 },
                    ]}
                  >
                    {/* Sender name + time (first in group) */}
                    {!isConsecPrev && !isSelf && (
                      <View style={styles.msgMeta}>
                        <Text style={[styles.msgSender, { color: msg.isSimulated ? '#f59e0b' : C.emerald400 }]}>
                          {msg.sender}
                        </Text>
                        <Text style={styles.msgTime}>{msg.timestamp}</Text>
                      </View>
                    )}

                    <View style={styles.msgRow}>
                      {/* Avatar (left side, received messages) */}
                      {!isSelf && (
                        <View style={[
                          styles.msgAvatar,
                          { backgroundColor: msg.isSimulated ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)' }
                        ]}>
                          {!isConsecNext ? (
                            <Text style={[
                              styles.msgAvatarText,
                              { color: msg.isSimulated ? '#f59e0b' : C.emerald400 }
                            ]}>
                              {msg.sender.substring(0, 2)}
                            </Text>
                          ) : null}
                        </View>
                      )}

                      {/* Message Bubble — Messaging style */}
                      <View style={[
                        styles.bubble,
                        isSelf ? styles.bubbleSelf : styles.bubbleOther,
                        isSelf && isConsecPrev && { borderTopRightRadius: 4 },
                        isSelf && isConsecNext && { borderBottomRightRadius: 4 },
                        !isSelf && isConsecPrev && { borderTopLeftRadius: 4 },
                        !isSelf && isConsecNext && { borderBottomLeftRadius: 4 },
                        msg.isSimulated && !isSelf && { borderColor: 'rgba(245,158,11,0.3)' },
                      ]}>
                        <Text style={[styles.bubbleText, isSelf && { color: C.white }]}>
                          {msg.text}
                        </Text>

                        {/* Timestamp + read receipt */}
                        <View style={styles.bubbleFooter}>
                          <Text style={[styles.bubbleTime, isSelf && { color: C.emerald200 }]}>
                            {msg.timestamp ? msg.timestamp.split(':').slice(0, 2).join(':') : ''}
                          </Text>
                          {isSelf && (
                            <Feather name="check-circle" size={10} color={C.emerald200} />
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Quick Code Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickCodesRow}
        >
          {QUICK_CODES.map((code, idx) => (
            <Pressable
              key={idx}
              style={styles.quickCodeChip}
              onPress={() => handleSendMessage(code.val)}
              disabled={!connected}
            >
              <Text style={styles.quickCodeText}>{code.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input Row */}
        <View style={styles.inputRow}>
          <Pressable style={styles.inputUtilBtn}>
            <Feather name="plus-circle" size={22} color={C.slate400} />
          </Pressable>
          <Pressable style={styles.inputUtilBtn}>
            <Feather name="image" size={22} color={C.slate400} />
          </Pressable>

          {/* Text Input */}
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={connected ? `Message ${activeChannel}...` : 'Connecting...'}
              placeholderTextColor={C.slate500}
              editable={connected}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />
            <Pressable style={styles.emojiBtn}>
              <Feather name="smile" size={18} color={C.slate500} />
            </Pressable>
          </View>

          {/* Send Button */}
          <Pressable
            onPress={() => handleSendMessage()}
            disabled={!connected || !inputText.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: connected && inputText.trim() ? C.emerald600 : C.bg800 },
            ]}
          >
            <Feather name="send" size={16} color={connected && inputText.trim() ? C.white : C.slate500} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  // ─────────────────────────────────────────
  //  RENDER: RIGHT DETAILS SIDEBAR
  // ─────────────────────────────────────────
  const renderDetailsSidebar = () => {
    const activeUnits = users.filter((u) => u.channel === activeChannel || u.channel === 'all');
    return (
      <View style={styles.detailsSidebar}>
        <ScrollView contentContainerStyle={styles.detailsContent}>
          {/* Channel Icon */}
          <View style={styles.detailsHeader}>
            <View style={styles.detailsAvatarCircle}>
              <Feather name="users" size={28} color={C.emerald400} />
            </View>
            <Text style={styles.detailsChannelName}>{activeChannel.toUpperCase()}</Text>
            <Text style={styles.detailsChannelSub}>Encrypted Tactical Channel</Text>
          </View>

          {/* Security Stats */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>NETWORK SECURITY</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>COM LINK</Text>
              <Text style={[styles.detailsValue, { color: connected ? C.emerald500 : '#ef4444' }]}>
                {connected ? 'SECURE' : 'DISCONNECTED'}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>LATENCY</Text>
              <Text style={styles.detailsValue}>{latency}ms</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>CALLSIGN</Text>
              <Text style={[styles.detailsValue, { color: C.emerald400 }]}>{callsign}</Text>
            </View>
          </View>

          {/* Active Units */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>ACTIVE UNITS ({activeUnits.length})</Text>
            {activeUnits.map((u, i) => (
              <View key={`${u.callsign}-${i}`} style={styles.detailsUserRow}>
                <View style={[styles.detailsUserDot, { backgroundColor: u.isSimulated ? C.slate500 : C.emerald500 }]} />
                <Text numberOfLines={1} style={styles.detailsUserName}>{u.callsign}</Text>
                <Text style={[styles.detailsUserStatus, { color: u.isSimulated ? C.slate500 : C.emerald500 }]}>
                  {u.status}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────
  //  ROOT RENDER
  // ─────────────────────────────────────────
  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        {isLargeScreen ? (
          <>
            {renderSidebar()}
            {renderChatArea()}
            {renderDetailsSidebar()}
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

// ─────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────
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

  // ── Sidebar ─────────────────────────────
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
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg950,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.emerald600,
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
    color: C.emerald400,
    fontFamily: Fonts?.mono || 'monospace',
    fontWeight: 'bold',
  },
  editCallsignBtn: {
    marginLeft: 'auto',
    padding: 6,
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.2)',
  },

  callsignEditor: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg900,
  },
  callsignInput: {
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 11,
    color: C.slate200,
    borderColor: C.border,
    backgroundColor: C.bg800,
    fontFamily: Fonts?.mono || 'monospace',
  },
  callsignBtns: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  callsignSave: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    backgroundColor: C.emerald600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callsignSaveText: {
    color: C.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  callsignCancel: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callsignCancelText: {
    color: C.slate400,
    fontSize: 10,
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
    height: 36,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: C.slate200,
    fontWeight: '500',
  },

  onlineSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.slate500,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  onlineRow: {
    paddingHorizontal: 12,
    gap: 12,
    flexDirection: 'row',
  },
  onlineBubble: {
    alignItems: 'center',
    width: 55,
  },
  onlineAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.emerald400,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.bg900,
  },
  onlineCallsign: {
    fontSize: 8.5,
    color: C.slate400,
    marginTop: 4,
    textAlign: 'center',
  },

  contactList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  contactItemActive: {
    backgroundColor: C.bg800,
  },
  contactAvatarWrapper: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.bg800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  contactAvatarActive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: C.emerald500,
  },
  contactAvatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: C.slate400,
    fontFamily: Fonts?.mono || 'monospace',
  },
  contactAvatarTextActive: {
    color: C.emerald400,
  },
  contactStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.bg900,
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    color: C.slate200,
    flex: 1,
  },
  contactNameActive: {
    color: C.emerald400,
    fontWeight: 'bold',
  },
  contactTime: {
    fontSize: 9,
    color: C.slate500,
    marginLeft: 4,
  },
  contactLastMsg: {
    fontSize: 10,
    color: C.slate500,
  },
  unreadBadge: {
    backgroundColor: C.emerald500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: C.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // ── Chat Area ────────────────────────────
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
  },
  backBtn: {
    marginRight: 4,
    padding: 4,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  chatHeaderAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.emerald400,
    fontFamily: Fonts?.mono || 'monospace',
  },
  chatHeaderDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.bg900,
  },
  chatHeaderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: C.white,
  },
  chatHeaderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  chatStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chatHeaderStatus: {
    fontSize: 9,
    color: C.slate400,
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

  // ── Message Feed ─────────────────────────
  messageFeed: {
    flex: 1,
    backgroundColor: C.bg950,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 10,
    color: C.slate500,
    fontFamily: Fonts?.mono || 'monospace',
  },
  messageScroll: {
    flex: 1,
  },
  messageScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 10,
    color: C.slate500,
    textAlign: 'center',
    fontFamily: Fonts?.mono || 'monospace',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  systemMsgRow: {
    marginVertical: 8,
    alignItems: 'center',
  },
  systemMsgText: {
    fontSize: 9,
    color: C.slate500,
    fontFamily: Fonts?.mono || 'monospace',
    textAlign: 'center',
  },

  // ── Message Bubble ───────────────────────
  msgWrapper: {
    marginBottom: 6,
    maxWidth: '80%',
  },
  msgWrapperLeft: {
    alignSelf: 'flex-start',
  },
  msgWrapperRight: {
    alignSelf: 'flex-end',
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
    marginLeft: 32,
  },
  msgSender: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: Fonts?.mono || 'monospace',
  },
  msgTime: {
    fontSize: 8,
    color: C.slate500,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgAvatarText: {
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Messaging-style bubbles
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
    borderWidth: 1,
  },
  bubbleSelf: {
    backgroundColor: C.emerald600,
    borderColor: C.emerald600,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: C.bg800,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
    color: C.slate200,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 9,
    color: C.slate500,
  },

  // ── Footer ───────────────────────────────
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg900,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickCodesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  quickCodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: C.bg800,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickCodeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.slate400,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputUtilBtn: {
    padding: 6,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg800,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: C.slate200,
    paddingVertical: 0,
  },
  emojiBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: `0px 2px 8px ${C.emerald600}`,
    elevation: 4,
  },

  // ── Details Sidebar ──────────────────────
  detailsSidebar: {
    width: 220,
    height: '100%',
    backgroundColor: C.bg900,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  detailsContent: {
    padding: 16,
    alignItems: 'center',
  },
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  detailsChannelName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: C.white,
    textAlign: 'center',
  },
  detailsChannelSub: {
    fontSize: 9,
    color: C.slate500,
    marginTop: 2,
    textAlign: 'center',
  },
  detailsSection: {
    width: '100%',
    marginTop: 16,
  },
  detailsSectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: C.slate500,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.slate500,
  },
  detailsValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: C.slate200,
  },
  detailsUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsUserDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  detailsUserName: {
    fontSize: 11,
    fontWeight: '600',
    color: C.slate200,
    flex: 1,
  },
  detailsUserStatus: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});
