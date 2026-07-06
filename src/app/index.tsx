import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Fonts } from '../constants/theme';
import { MODULE_CATEGORIES } from '../constants/modules';

interface IncidentLog {
  id: string;
  time: string;
  code: string;
  message: string;
  status: 'DISPATCHED' | 'STANDBY' | 'RESOLVED' | 'CRITICAL';
}

interface ShiftNote {
  id: string;
  time: string;
  text: string;
}

export default function HQDashboard() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [noteText, setNoteText] = useState('');
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([
    { id: '1', time: '08:30 AM', text: 'Checked out squad vehicle #402. Fleet check complete.' },
    { id: '2', time: '10:15 AM', text: 'Completed patrol route Sector-4. Speed check on Oak St.' },
  ]);

  const [incidentLogs, setIncidentLogs] = useState<IncidentLog[]>([
    { id: '1', time: '13:01:15', code: '10-33', message: 'Silent alarm triggered at Bank of Metropolis', status: 'CRITICAL' },
    { id: '2', time: '12:58:40', code: '10-50', message: 'Traffic collision reported on I-95 North, lanes blocked', status: 'DISPATCHED' },
    { id: '3', time: '12:45:10', code: '10-15', message: 'Suspect in custody for narcotics violation at Sector-2', status: 'RESOLVED' },
    { id: '4', time: '12:30:22', code: '10-43', message: 'Crowd control support requested near Arena Plaza', status: 'DISPATCHED' },
    { id: '5', time: '12:15:00', code: '10-74', message: 'Scheduled perimeter security sweep completed', status: 'STANDBY' },
  ]);

  // Ref to simulate real-time log updates
  const logIndexRef = useRef(0);
  const mockMessages = [
    { code: '10-96', message: 'Mental health assessment officer dispatched to 5th Ave', status: 'DISPATCHED' },
    { code: '10-10', message: 'Fight in progress reported at Downtown Sports Bar', status: 'CRITICAL' },
    { code: '10-70', message: 'Fire alarm sounding at High School chemistry lab', status: 'DISPATCHED' },
    { code: '10-31', message: 'Suspicious vehicle reported idling in alleyway near Bank', status: 'STANDBY' },
    { code: '10-15', message: 'Suspect processed under Badge #7419', status: 'RESOLVED' },
  ] as const;

  // Add mock logs periodically to make the screen feel alive
  useEffect(() => {
    const timer = setInterval(() => {
      const date = new Date();
      const timeStr = date.toTimeString().split(' ')[0];
      const mockLog = mockMessages[logIndexRef.current % mockMessages.length];
      logIndexRef.current += 1;

      setIncidentLogs((prev) => [
        {
          id: String(date.getTime()),
          time: timeStr,
          code: mockLog.code,
          message: mockLog.message,
          status: mockLog.status,
        },
        ...prev.slice(0, 7), // Keep only top 8 items
      ]);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const addShiftNote = () => {
    if (!noteText.trim()) return;
    const date = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNote: ShiftNote = {
      id: String(date.getTime()),
      time: timeStr,
      text: noteText.trim(),
    };
    setShiftNotes((prev) => [newNote, ...prev]);
    setNoteText('');
  };

  const getStatusColor = (status: IncidentLog['status']) => {
    switch (status) {
      case 'CRITICAL':
        return theme.danger;
      case 'DISPATCHED':
        return theme.warning;
      case 'RESOLVED':
        return theme.success;
      default:
        return theme.textSecondary;
    }
  };

  // Select a few premium modules for shortcuts on dashboard
  const shortcuts = [
    { id: 'body-camera', name: 'Body Camera', icon: 'camera', category: 'camera-view' },
    { id: 'e-radio', name: 'E-Radio', icon: 'mic', category: 'communication' },
    { id: 'live-tactical-map', name: 'Tactical Map', icon: 'map', category: 'police-ops' },
    { id: 'biometric', name: 'Biometrics', icon: 'pocket', category: 'investigation-forensics' },
    { id: 'officer-ai', name: 'Officer AI', icon: 'zap', category: 'strategic-intel' },
    { id: 'digital-id', name: 'Digital ID', icon: 'credit-card', category: 'personnel-records' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {/* Top Banner Status */}
      <View style={[styles.statusBanner, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.bannerRow}>
          <View style={styles.statusLabelContainer}>
            <View style={[styles.pulseDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.bannerLabel, { color: theme.success }]}>TACTICAL SYSTEM: ONLINE</Text>
          </View>
          <Text style={[styles.bannerMeta, { color: theme.textSecondary }]}>TAC-LINK-4890 SECURED</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerRow}>
          <Text style={[styles.bannerMetaText, { color: theme.text }]}>
            THREAT LEVEL: <Text style={{ color: theme.warning, fontWeight: 'bold' }}>MODERATE (AMBER)</Text>
          </Text>
          <Text style={[styles.bannerMetaText, { color: theme.textSecondary }]}>GEO-REF: 25.1972° N, 55.2744° E</Text>
        </View>
      </View>

      {/* Grid of Key Statistics */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Feather name="alert-circle" size={18} color={theme.warning} />
          <Text style={[styles.statValue, { color: theme.text }]}>12</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Active Dispatch</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Feather name="navigation" size={18} color={theme.success} />
          <Text style={[styles.statValue, { color: theme.text }]}>47</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Patrol Units</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Feather name="shield" size={18} color={theme.danger} />
          <Text style={[styles.statValue, { color: theme.text }]}>8</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>High-Pri Cases</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Feather name="archive" size={18} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>1,248</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Logged Evidence</Text>
        </View>
      </View>

      {/* Live Dispatch Feed Terminal */}
      <View style={styles.sectionHeader}>
        <Feather name="terminal" size={18} color={theme.primary} style={{ marginRight: Spacing.one }} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>LIVE DISPATCH CONSOLE</Text>
      </View>

      <View style={[styles.terminalContainer, { backgroundColor: isDark ? '#06070a' : '#eceff1', borderColor: theme.border }]}>
        <FlatList
          data={incidentLogs}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.terminalRow}>
              <Text style={[styles.terminalTime, { color: theme.textSecondary }]}>[{item.time}]</Text>
              <Text style={[styles.terminalCode, { color: getStatusColor(item.status) }]}>{item.code}</Text>
              <Text style={[styles.terminalMessage, { color: theme.text }]} numberOfLines={1}>
                {item.message}
              </Text>
              <View style={[styles.terminalBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
                <Text style={[styles.terminalBadgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* Quick Action Module Shortcuts */}
      <View style={styles.sectionHeader}>
        <Feather name="grid" size={18} color={theme.primary} style={{ marginRight: Spacing.one }} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>OPERATIONAL SHORTCUTS</Text>
      </View>

      <View style={styles.shortcutsGrid}>
        {shortcuts.map((shortcut) => (
          <Pressable
            key={shortcut.id}
            style={[styles.shortcutCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => router.push(`/module/${shortcut.id}` as any)}
          >
            <View style={[styles.shortcutIconContainer, { backgroundColor: theme.primaryGlow }]}>
              <Feather name={shortcut.icon as any} size={20} color={theme.primary} />
            </View>
            <Text style={[styles.shortcutName, { color: theme.text }]} numberOfLines={1}>{shortcut.name}</Text>
            <Text style={[styles.shortcutSub, { color: theme.textSecondary }]} numberOfLines={1}>
              Launch Module
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Shift Notes Logger */}
      <View style={styles.sectionHeader}>
        <Feather name="edit-3" size={18} color={theme.primary} style={{ marginRight: Spacing.one }} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>SHIFT NOTES RECORDER</Text>
      </View>

      <View style={[styles.notesContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.notesInputRow}>
          <TextInput
            placeholder="Log shift events, vehicle checks, patrols..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.notesInput, { color: theme.text, borderColor: theme.border }]}
            value={noteText}
            onChangeText={setNoteText}
          />
          <Pressable style={[styles.notesAddBtn, { backgroundColor: theme.primary }]} onPress={addShiftNote}>
            <Feather name="plus" size={18} color="#ffffff" />
          </Pressable>
        </View>

        <FlatList
          data={shiftNotes}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ marginTop: Spacing.two }}
          renderItem={({ item }) => (
            <View style={[styles.noteRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.noteTime, { color: theme.primary, fontFamily: Fonts?.mono }]}>{item.time}</Text>
              <Text style={[styles.noteText, { color: theme.text }]}>{item.text}</Text>
            </View>
          )}
        />
      </View>

      <View style={{ height: Spacing.six }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
  },
  statusBanner: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.one,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bannerMeta: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  bannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  bannerMetaText: {
    fontSize: 9.5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statTitle: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  terminalContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  terminalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  terminalTime: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    marginRight: Spacing.one,
  },
  terminalCode: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    fontWeight: 'bold',
    marginRight: Spacing.one,
    width: 40,
  },
  terminalMessage: {
    fontSize: 10.5,
    flex: 1,
    marginRight: Spacing.one,
  },
  terminalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  terminalBadgeText: {
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  shortcutCard: {
    flex: 1,
    minWidth: '30%',
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  shortcutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  shortcutName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shortcutSub: {
    fontSize: 8.5,
    marginTop: 2,
    textAlign: 'center',
  },
  notesContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: Spacing.three,
  },
  notesInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  notesInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 12,
  },
  notesAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  noteTime: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 70,
  },
  noteText: {
    fontSize: 11.5,
    flex: 1,
  },
});
