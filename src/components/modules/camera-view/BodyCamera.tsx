import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

export default function BodyCamera({ theme, isDark }: { theme: any; isDark: boolean }) {
  const [isRecording, setIsRecording] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[05:01:00] Camera initial boot sequence finished.', '[05:01:03] Live recording started.']);
  const [time, setTime] = useState('');
  const [latFluctuation, setLatFluctuation] = useState(25.1972);

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setTime(d.toLocaleTimeString());
      setLatFluctuation(25.1972 + (Math.random() - 0.5) * 0.0005);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addLog = (msg: string) => {
    const timePrefix = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timePrefix}] ${msg}`, ...prev]);
  };

  const toggleRecording = () => {
    const nextState = !isRecording;
    setIsRecording(nextState);
    addLog(nextState ? 'Recording resumed.' : 'Recording paused by officer command.');
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    addLog(nextState ? 'Audio microphone disabled.' : 'Audio microphone enabled.');
  };

  const captureSnapshot = () => {
    const randId = Math.floor(1000 + Math.random() * 9000);
    Alert.alert('📸 SNAPSHOT COMPLETE', `Snapshot frame DSC_${randId}.jpg uploaded securely to evidence drive.`);
    addLog(`Snapshot captured: DSC_${randId}.jpg (GeoTagged).`);
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>LIVE FEED VIEWFINDER</Text>
      
      {/* Viewfinder Window */}
      <View style={[styles.viewfinder, { backgroundColor: '#000000', borderColor: isRecording ? theme.danger : theme.border }]}>
        {/* Blinking REC indicator */}
        <View style={styles.viewfinderOverlayTop}>
          <View style={styles.recContainer}>
            <View style={[styles.recIndicator, { backgroundColor: isRecording ? theme.danger : '#555555' }]} />
            <Text style={styles.recText}>{isRecording ? 'REC' : 'STBY'}</Text>
          </View>
          <Text style={styles.viewfinderMeta}>1080P @ 60FPS</Text>
        </View>

        {/* Dynamic ticking values */}
        <View style={styles.viewfinderOverlayCenter}>
          <Feather name="plus" size={24} color="rgba(255,255,255,0.3)" />
        </View>

        <View style={styles.viewfinderOverlayBottom}>
          <View>
            <Text style={styles.viewfinderCoords}>LAT: {latFluctuation.toFixed(5)}° N</Text>
            <Text style={styles.viewfinderCoords}>LNG: 55.2744° E</Text>
          </View>
          <Text style={styles.viewfinderTime}>{time || 'CONNECTING...'}</Text>
        </View>

        {/* Static lines mock overlay */}
        <View style={styles.staticOverlay} pointerEvents="none" />
      </View>

      {/* Camera Controls */}
      <View style={styles.cameraControlsRow}>
        <Pressable
          style={[styles.cameraBtn, { backgroundColor: isRecording ? 'rgba(255,77,77,0.15)' : theme.primaryGlow, borderColor: isRecording ? theme.danger : theme.primary }]}
          onPress={toggleRecording}
        >
          <Feather name={isRecording ? "pause" : "play"} size={16} color={isRecording ? theme.danger : theme.primary} />
          <Text style={[styles.cameraBtnText, { color: isRecording ? theme.danger : theme.primary }]}>
            {isRecording ? 'PAUSE REC' : 'RESUME REC'}
          </Text>
        </Pressable>

        <Pressable style={[styles.cameraBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]} onPress={captureSnapshot}>
          <Feather name="camera" size={16} color={theme.text} />
          <Text style={[styles.cameraBtnText, { color: theme.text }]}>SNAP PHOTO</Text>
        </Pressable>

        <Pressable
          style={[styles.cameraBtn, { backgroundColor: isMuted ? 'rgba(255,159,67,0.15)' : theme.backgroundElement, borderColor: isMuted ? theme.warning : theme.border }]}
          onPress={toggleMute}
        >
          <Feather name={isMuted ? "mic-off" : "mic"} size={16} color={isMuted ? theme.warning : theme.text} />
          <Text style={[styles.cameraBtnText, { color: isMuted ? theme.warning : theme.text }]}>
            {isMuted ? 'UNMUTE' : 'MUTE AUDIO'}
          </Text>
        </Pressable>
      </View>

      {/* Log Feed */}
      <Text style={[styles.innerSectionTitle, { color: theme.text }]}>UNIT LOG SYSTEM</Text>
      <View style={[styles.consoleContainer, { backgroundColor: isDark ? '#06070a' : '#eceff1', borderColor: theme.border }]}>
        {logs.map((log, index) => (
          <Text key={index} style={[styles.consoleLine, { color: theme.text }]} numberOfLines={1}>
            {log}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  innerSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  viewfinder: {
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  viewfinderOverlayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  recText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  viewfinderMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8.5,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  viewfinderOverlayCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderOverlayBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 4,
    borderRadius: 4,
  },
  viewfinderCoords: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  viewfinderTime: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  staticOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.08,
    backgroundColor: '#ffffff',
  },
  cameraControlsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  cameraBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  consoleContainer: {
    borderRadius: 6,
    borderWidth: 1,
    padding: Spacing.two,
  },
  consoleLine: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    lineHeight: 14,
  },
});
