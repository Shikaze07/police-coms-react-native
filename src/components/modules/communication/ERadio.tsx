import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing, Fonts } from '../../../constants/theme';
import { io } from 'socket.io-client';
import Constants from 'expo-constants';

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

export default function ERadio({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [selectedChannel, setSelectedChannel] = useState('TAC-1');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [networkLatency, setNetworkLatency] = useState(12);
  const [signalBars, setSignalBars] = useState(4);
  const [micSignal, setMicSignal] = useState(0);
  const [hasAlertedMic, setHasAlertedMic] = useState(false);

  const socketRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const channels = [
    { id: 'TAC-1', label: 'Precinct Command', freq: '462.5625 MHz' },
    { id: 'TAC-2', label: 'Field Patrol Dispatch', freq: '462.6125 MHz' },
    { id: 'TAC-3', label: 'SWAT Operations Team', freq: '462.6625 MHz' },
    { id: 'TAC-4', label: 'Air Support Team', freq: '467.5625 MHz' },
  ];

  const currentChannelInfo = channels.find((c) => c.id === selectedChannel);

  // Map local TAC channels to standard backend channels for socket synchronization
  const mapTacToServerChan = (tacChan: string) => {
    switch (tacChan) {
      case 'TAC-1': return '#dispatch';
      case 'TAC-2': return '#tactical-1';
      case 'TAC-3': return '#intel-ops';
      case 'TAC-4': return '#intel-ops'; // fallback to intel-ops
      default: return '#dispatch';
    }
  };

  // Socket connection & incoming audio listeners
  useEffect(() => {
    const serverUrl = getSocketUrl();
    console.log('[ERadio] Connecting to socket:', serverUrl);

    const socket = io(serverUrl, {
      transports: ['websocket'],
      forceNew: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[ERadio] Socket connected');
      const pttCallsign = `WT-${(socket.id || 'stub').substring(0, 4).toUpperCase()}`;
      socket.emit('register', { callsign: pttCallsign });
      
      const initialServerChan = mapTacToServerChan(selectedChannel);
      socket.emit('join_channel', initialServerChan);
    });

    socket.on('voice_transmit', (data: { sender: string; audio: string }) => {
      console.log('[ERadio] Received voice transmission from:', data.sender);
      playVoiceBroadcast(data.audio);
    });

    // Fluctuating network latency simulator
    const timer = setInterval(() => {
      setNetworkLatency(10 + Math.floor(Math.random() * 8));
    }, 3000);

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  // Update socket channel when selected channel changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      const serverChan = mapTacToServerChan(selectedChannel);
      socketRef.current.emit('join_channel', serverChan);
      console.log('[ERadio] Joined socket channel:', serverChan);
    }
  }, [selectedChannel]);

  // Audio recording trigger
  const startRecording = async () => {
    if (Platform.OS !== 'web') {
      console.log('[ERadio] Audio recording is only supported on Web in this module.');
      return;
    }

    console.log('[ERadio] context info - isSecureContext:', typeof window !== 'undefined' ? window.isSecureContext : 'unknown', 'mediaDevices:', !!navigator.mediaDevices, 'getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[ERadio] Microphone access not available (requires HTTPS or localhost). Operating in simulation mode.');
      if (!hasAlertedMic) {
        setHasAlertedMic(true);
        alert(
          "Microphone Permission Blocked by Browser!\n\n" +
          "For security, browsers only allow microphone access on SECURE contexts:\n" +
          "1. Open localhost: http://localhost:8081\n" +
          "2. Or launch Expo with a secure tunnel: 'npx expo start --tunnel'\n" +
          "3. Or enable Chrome's unsafely-treat-insecure-origin-as-secure flag."
        );
      }
      return;
    }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new (window as any).MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          const base64Audio = base64Data.split(',')[1];
          
          if (socketRef.current && socketRef.current.connected) {
            console.log('[ERadio] Broadcasting voice transmission...');
            socketRef.current.emit('voice_transmit', { audio: base64Audio });
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      console.log('[ERadio] Recording started');
    } catch (err) {
      console.warn('[ERadio] Microphone access failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('[ERadio] Recording stopped');
    }
  };

  // Play voice broadcasts from other units
  const playVoiceBroadcast = (base64Audio: string) => {
    if (Platform.OS !== 'web') return;
    try {
      const audioUrl = `data:audio/webm;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      
      let interval: any;
      setSignalBars(5);
      
      audio.onplay = () => {
        setIsTransmitting(false); // Put back to receiving mode if we were simulating PTT
        interval = setInterval(() => {
          setMicSignal(Math.floor(Math.random() * 50) + 10);
        }, 150);
      };

      audio.onended = () => {
        clearInterval(interval);
        setMicSignal(0);
        setSignalBars(4);
      };

      audio.play().catch(err => {
        console.warn('[ERadio] Voice playback failed:', err);
        clearInterval(interval);
        setMicSignal(0);
        setSignalBars(4);
      });
    } catch (err) {
      console.warn('[ERadio] Playback initialization failed:', err);
    }
  };

  // Fluctuate microphone input signal level and lock signal bars during transmission
  useEffect(() => {
    let interval: any;
    if (isTransmitting) {
      // Start actual audio recording on PTT press
      startRecording();
      
      interval = setInterval(() => {
        setMicSignal(Math.floor(Math.random() * 60) + 40); // 40% - 100% fluctuation
        setSignalBars(5);
      }, 150);
    } else {
      // Stop actual recording on PTT release
      stopRecording();
      
      setMicSignal(0);
      setSignalBars(4);
    }
    return () => clearInterval(interval);
  }, [isTransmitting]);

  // Channel navigation triggers
  const nextChannel = () => {
    const idx = channels.findIndex(c => c.id === selectedChannel);
    const nextIdx = (idx + 1) % channels.length;
    setSelectedChannel(channels[nextIdx].id);
  };

  const prevChannel = () => {
    const idx = channels.findIndex(c => c.id === selectedChannel);
    const prevIdx = (idx - 1 + channels.length) % channels.length;
    setSelectedChannel(channels[prevIdx].id);
  };

  // Generate visual signal bars indicator
  const renderSignalIndicator = () => {
    const bars = [];
    for (let i = 1; i <= 5; i++) {
      bars.push(
        <View 
          key={i} 
          style={[
            styles.signalBarDot, 
            { backgroundColor: i <= signalBars ? '#4af626' : 'rgba(74, 246, 38, 0.15)' },
            { height: i * 3 + 2 }
          ]} 
        />
      );
    }
    return <View style={styles.signalBarsRow}>{bars}</View>;
  };

  // Generate visual voice wave levels during transmit
  const renderVoiceMeter = () => {
    const elementsCount = 8;
    const waveElements = [];
    const isActive = isTransmitting || micSignal > 0;
    
    for (let i = 0; i < elementsCount; i++) {
      const factor = isActive ? Math.sin((i / (elementsCount - 1)) * Math.PI) : 0.1;
      const computedHeight = isActive 
        ? Math.max(3, Math.floor((micSignal / 100) * 16 * factor) + (Math.random() * 4))
        : 3;
        
      waveElements.push(
        <View 
          key={i}
          style={[
            styles.waveBar,
            { height: computedHeight, backgroundColor: isActive ? '#4af626' : 'rgba(74, 246, 38, 0.2)' }
          ]}
        />
      );
    }
    return <View style={styles.voiceWaveContainer}>{waveElements}</View>;
  };

  return (
    <View style={styles.outerContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>SECURE VOICE TRANSCEIVER</Text>
      
      {/* Walkie-Talkie Device Chassis View */}
      <View style={styles.walkieWrapper}>
        
        {/* Hardware Antennas & Dials (Positioned absolutely relative to wrapper) */}
        <View style={styles.antennaBase}>
          <View style={styles.antennaPole} />
          <View style={styles.antennaCap} />
        </View>

        <View style={styles.dialKnobChannel}>
          <View style={styles.dialGroove} />
          <View style={styles.dialGroove} />
          <View style={styles.dialGroove} />
        </View>

        <View style={styles.dialKnobVolume}>
          <View style={styles.dialGroove} />
          <View style={styles.dialGroove} />
        </View>

        {/* Walkie-Talkie Physical Body */}
        <View style={[styles.walkieBody, { backgroundColor: isDark ? '#1e222b' : '#3c4043', borderColor: isDark ? '#11141a' : '#202124' }]}>
          
          {/* Simulated Case Screws */}
          <View style={[styles.screw, styles.screwTL]} />
          <View style={[styles.screw, styles.screwTR]} />
          <View style={[styles.screw, styles.screwBL]} />
          <View style={[styles.screw, styles.screwBR]} />

          {/* LED Status Bar & Brand Stamp */}
          <View style={styles.brandRow}>
            <Text style={styles.brandLabel}>POLICECOMS RF-88</Text>
            <View style={styles.ledIndicatorGroup}>
              <View 
                style={[
                  styles.statusLedDot, 
                  { backgroundColor: isTransmitting ? '#ff2a2a' : '#2ad573' }
                ]} 
              />
              <Text style={styles.statusLedText}>{isTransmitting ? 'TX' : 'STBY'}</Text>
            </View>
          </View>

          {/* Retro Glowing LCD Screen bezel */}
          <View style={styles.lcdBezel}>
            <View style={styles.lcdScreen}>
              
              {/* LCD Display Header Row */}
              <View style={styles.lcdHeader}>
                <View style={styles.lcdHeaderLeft}>
                  {renderSignalIndicator()}
                  <Text style={styles.lcdPingText}>{networkLatency}ms</Text>
                </View>
                <View style={styles.lcdHeaderRight}>
                  <Text style={styles.lcdSecText}>AES-256</Text>
                  <Feather name="battery" size={10} color="#4af626" />
                </View>
              </View>

              {/* LCD Display Center (Frequency & Channel Code) */}
              <View style={styles.lcdDisplayBody}>
                <Text style={styles.lcdFrequencyText}>
                  {currentChannelInfo?.freq.split(' ')[0]}
                </Text>
                <View style={styles.lcdSubRow}>
                  <Text numberOfLines={1} style={styles.lcdChannelText}>
                    CH: {selectedChannel} // {currentChannelInfo?.label.toUpperCase()}
                  </Text>
                  <Text style={styles.lcdUnitText}>MHz</Text>
                </View>
              </View>

              {/* LCD Display Footer Row (Standby Status & Wave Visualizer) */}
              <View style={styles.lcdFooter}>
                <Text style={styles.lcdModeText}>
                  {isTransmitting ? 'BROADCAST' : 'RECEIVING'}
                </Text>
                {renderVoiceMeter()}
              </View>
              
            </View>
          </View>

          {/* Rugged Textured Speaker Mesh */}
          <View style={styles.speakerGrid}>
            <View style={styles.speakerSlot} />
            <View style={styles.speakerSlot} />
            <View style={styles.speakerSlot} />
            <View style={styles.speakerSlot} />
            <View style={styles.speakerSlot} />
            <View style={styles.speakerSlot} />
            <View style={styles.speakerSlot} />
          </View>

          {/* Tactical Control Panel */}
          <View style={styles.tacticalControls}>
            {/* Rotary/Up-Down togglers */}
            <View style={styles.channelScrollRow}>
              <Pressable style={styles.arrowButton} onPress={prevChannel}>
                <Feather name="chevron-left" size={16} color="#ffffff" />
                <Text style={styles.arrowBtnLabel}>CH-</Text>
              </Pressable>
              
              <View style={styles.channelBadgeCenter}>
                <Text style={styles.channelBadgeText}>{selectedChannel}</Text>
              </View>
              
              <Pressable style={styles.arrowButton} onPress={nextChannel}>
                <Text style={styles.arrowBtnLabel}>CH+</Text>
                <Feather name="chevron-right" size={16} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {/* Rugged Push-to-Talk Action Plate */}
          <View style={styles.pttPlate}>
            <Pressable
              {...({
                style: [
                  styles.walkiePttBtn,
                  isTransmitting && styles.walkiePttBtnActive
                ],
                onPressIn: () => setIsTransmitting(true),
                onPressOut: () => setIsTransmitting(false),
                onContextMenu: (e: any) => {
                  if (Platform.OS === 'web') e.preventDefault();
                }
              } as any)}
            >
              <View style={[styles.pttInnerCircle, isTransmitting && styles.pttInnerCircleActive]}>
                <Feather name={isTransmitting ? 'mic' : 'mic-off'} size={24} color="#ffffff" />
              </View>
              <Text style={styles.pttText}>
                {isTransmitting ? 'TRANSMITTING VOICE' : 'PUSH TO TALK (PTT)'}
              </Text>
            </Pressable>
          </View>

        </View>

        {/* Outer rubber grip stripes decoration on sides */}
        <View style={[styles.sideStripe, styles.sideStripeLeft, { top: 120 }]} />
        <View style={[styles.sideStripe, styles.sideStripeLeft, { top: 160 }]} />
        <View style={[styles.sideStripe, styles.sideStripeLeft, { top: 200 }]} />
        <View style={[styles.sideStripe, styles.sideStripeRight, { top: 120 }]} />
        <View style={[styles.sideStripe, styles.sideStripeRight, { top: 160 }]} />
        <View style={[styles.sideStripe, styles.sideStripeRight, { top: 200 }]} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  walkieWrapper: {
    width: 290,
    position: 'relative',
    marginTop: 80, // Reservation for antenna height
    marginBottom: Spacing.two,
  },
  
  // Hardware elements protruding from the top
  antennaBase: {
    width: 20,
    height: 15,
    backgroundColor: '#11141a',
    position: 'absolute',
    top: -15,
    left: 45,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    alignItems: 'center',
  },
  antennaPole: {
    width: 12,
    height: 70,
    backgroundColor: '#0d1117',
    position: 'absolute',
    top: -70,
    left: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  antennaCap: {
    width: 16,
    height: 10,
    backgroundColor: '#1c2029',
    position: 'absolute',
    top: -80,
    left: 2,
    borderRadius: 3,
  },
  dialKnobChannel: {
    width: 32,
    height: 12,
    backgroundColor: '#11141a',
    position: 'absolute',
    top: -12,
    left: 115,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 2,
  },
  dialKnobVolume: {
    width: 26,
    height: 10,
    backgroundColor: '#11141a',
    position: 'absolute',
    top: -10,
    right: 55,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 2,
  },
  dialGroove: {
    width: 2,
    height: '100%',
    backgroundColor: '#272c35',
  },

  // Main rugged walkie-talkie body
  walkieBody: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 5,
    padding: 16,
    paddingTop: 18,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderLeftWidth: 8, // Thicker left/right borders to simulate rugged side bumpers
    borderRightWidth: 8,
  },

  // Screws on chassis corners
  screw: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#11141a',
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#4e5564',
  },
  screwTL: { top: 12, left: 12 },
  screwTR: { top: 12, right: 12 },
  screwBL: { bottom: 12, left: 12 },
  screwBR: { bottom: 12, right: 12 },

  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9ba4b4',
    fontFamily: Fonts?.mono || 'monospace',
    letterSpacing: 0.5,
  },
  ledIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    shadowColor: '#ffffff',
  },
  statusLedText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#9ba4b4',
    fontFamily: Fonts?.mono || 'monospace',
  },

  // Glowing LCD bezel and screen
  lcdBezel: {
    width: '100%',
    backgroundColor: '#11141a',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1.5,
    borderColor: '#2e3440',
    marginBottom: 16,
  },
  lcdScreen: {
    backgroundColor: '#0a1d12', // matrix-like dark green LCD backdrop
    borderRadius: 8,
    padding: 8,
    borderColor: '#11141a',
    borderWidth: 1,
    overflow: 'hidden',
  },
  lcdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(74, 246, 38, 0.2)',
    paddingBottom: 4,
    marginBottom: 4,
  },
  lcdHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
  },
  signalBarDot: {
    width: 2.5,
    borderRadius: 0.5,
  },
  lcdPingText: {
    fontSize: 7.5,
    fontFamily: Fonts?.mono || 'monospace',
    color: '#4af626',
    fontWeight: 'bold',
  },
  lcdHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lcdSecText: {
    fontSize: 7.5,
    fontFamily: Fonts?.mono || 'monospace',
    color: '#4af626',
    fontWeight: 'bold',
  },
  lcdDisplayBody: {
    alignItems: 'center',
    marginVertical: 4,
  },
  lcdFrequencyText: {
    fontSize: 28,
    fontFamily: Fonts?.mono || 'monospace',
    color: '#4af626',
    fontWeight: 'bold',
    letterSpacing: 1,
    lineHeight: 30,
    textShadowColor: 'rgba(74, 246, 38, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  lcdSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'baseline',
    marginTop: 2,
  },
  lcdChannelText: {
    fontSize: 8.5,
    fontFamily: Fonts?.mono || 'monospace',
    color: '#4af626',
    fontWeight: 'bold',
    flex: 1,
  },
  lcdUnitText: {
    fontSize: 8,
    fontFamily: Fonts?.mono || 'monospace',
    color: '#4af626',
    fontWeight: '900',
  },
  lcdFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(74, 246, 38, 0.2)',
    paddingTop: 4,
    marginTop: 4,
  },
  lcdModeText: {
    fontSize: 7.5,
    fontFamily: Fonts?.mono || 'monospace',
    color: '#4af626',
    fontWeight: 'bold',
  },
  voiceWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 16,
    justifyContent: 'flex-end',
  },
  waveBar: {
    width: 2.5,
    borderRadius: 1,
  },

  // Dotted/slotted physical speaker grid mockup
  speakerGrid: {
    width: '90%',
    alignItems: 'center',
    gap: 3.5,
    marginBottom: 16,
    opacity: 0.9,
  },
  speakerSlot: {
    width: '75%',
    height: 3,
    backgroundColor: '#11141a',
    borderRadius: 1.5,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.15,
    shadowRadius: 0.5,
  },

  // Tactical Controls & Keypad
  tacticalControls: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  channelScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    backgroundColor: '#11141a',
    borderRadius: 8,
    padding: 3,
  },
  arrowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#2e3440',
    gap: 2,
  },
  arrowBtnLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  channelBadgeCenter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#2e3440',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4c566a',
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#88c0d0',
    fontFamily: Fonts?.mono || 'monospace',
  },

  // Rugged bottom Push-to-Talk action
  pttPlate: {
    width: '95%',
    backgroundColor: '#11141a',
    borderRadius: 14,
    padding: 5,
    borderWidth: 1.5,
    borderColor: '#2e3440',
  },
  walkiePttBtn: {
    width: '100%',
    backgroundColor: '#ff4f4f',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#ff2a2a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    // Prevent mobile touch scrolling & text highlights from interrupting long press
    // @ts-ignore
    touchAction: 'none',
    userSelect: 'none',
  },
  walkiePttBtnActive: {
    backgroundColor: '#d81b1b',
    shadowOpacity: 0.1,
  },
  pttInnerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pttInnerCircleActive: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pttText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Rubber grip lines on side
  sideStripe: {
    width: 6,
    height: 16,
    backgroundColor: '#11141a',
    position: 'absolute',
    borderRadius: 2,
  },
  sideStripeLeft: {
    left: -1,
  },
  sideStripeRight: {
    right: -1,
  },
});
