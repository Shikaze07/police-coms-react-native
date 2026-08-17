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
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
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

type AuthMode = 'LOGIN' | 'SIGNUP' | 'RESET';

const BOOT_STEPS = [
  'Samsung Knox Verification...',
  'Checking Kernel Integrity...',
  'Secure Bootloader: LOCKED',
  'Middleware Integrity Check: PASS',
  'Initializing Secure Workspace...',
];

export default function HQDashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // App Authentication & Onboarding Gate States
  const [hasKey, setHasKey] = useState(false);
  const [phase, setPhase] = useState<'BOOT' | 'AUTH'>('BOOT');
  const [bootStep, setBootStep] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hide drawer header (and burger menu) during onboarding & auth phase
  useEffect(() => {
    navigation.setOptions({
      headerShown: isAuthenticated,
    });
  }, [navigation, isAuthenticated]);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('hq.officer@pnp.gov.ph');
  const [password, setPassword] = useState('KNOX-SECURE-99');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('01-KNOX');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

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

  // Handle Logout Param
  useEffect(() => {
    if (params?.logout === 'true') {
      setIsAuthenticated(false);
      setHasKey(false);
      setPhase('BOOT');
      setBootStep(0);
    }
  }, [params?.logout]);

  // Knox Boot Sequence Timer
  useEffect(() => {
    if (hasKey && phase === 'BOOT') {
      let current = 0;
      const interval = setInterval(() => {
        current++;
        setBootStep(current);
        if (current >= BOOT_STEPS.length) {
          clearInterval(interval);
          setTimeout(() => setPhase('AUTH'), 800);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [hasKey, phase]);

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
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  const handleConnectKey = () => {
    setHasKey(true);
    setPhase('BOOT');
    setBootStep(0);
  };

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

  // 1. STEP 1: ONBOARDING SYSTEM ACCESS GATE SCREEN (!hasKey)
  if (!hasKey) {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop' }}
        style={styles.fullScreenBg}
      >
        <View style={styles.darkOverlay}>
          <View style={styles.onboardingCard}>
            <View style={styles.logoBadgeCircle}>
              <Text style={styles.logoBadgeText}>P</Text>
            </View>
            <Text style={styles.onboardingTitle}>SYSTEM  ACCESS</Text>
            <Text style={styles.onboardingDesc}>
              Authentication required for secure police network access. Valid API credentials needed for AI modules.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.authButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleConnectKey}
            >
              <Feather name="key" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.authButtonText}>AUTHENTICATE</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // 2. STEP 2: KNOX SECURITY BOOT SEQUENCE (hasKey && phase === 'BOOT')
  if (phase === 'BOOT') {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop' }}
        style={styles.fullScreenBg}
      >
        <View style={styles.darkOverlay}>
          <View style={styles.bootCard}>
            <View style={styles.cpuIconCircle}>
              <Feather name="cpu" size={28} color="#22d3ee" />
            </View>
            <Text style={styles.bootTitle}>KNOX SECURITY GATE</Text>
            <Text style={styles.bootSub}>SECURE BOOTLOADER VERIFICATION</Text>

            <View style={styles.bootLogsContainer}>
              {BOOT_STEPS.slice(0, bootStep).map((stepText, idx) => (
                <View key={idx} style={styles.bootLogRow}>
                  {idx < bootStep - 1 ? (
                    <Feather name="check-circle" size={14} color="#34d399" style={{ marginRight: 8 }} />
                  ) : (
                    <ActivityIndicator size="small" color="#22d3ee" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.bootLogText}>{stepText}</Text>
                </View>
              ))}
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(bootStep / BOOT_STEPS.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // 3. STEP 3: SECURE AUTHENTICATION & REGISTRATION FORM (hasKey && phase === 'AUTH' && !isAuthenticated)
  if (!isAuthenticated) {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop' }}
        style={styles.fullScreenBg}
      >
        <View style={styles.darkOverlay}>
          <View style={styles.authCard}>
            <View style={styles.shieldIconContainer}>
              <Feather name="shield" size={28} color="#60a5fa" />
            </View>
            <Text style={styles.authFormTitle}>
              {authMode === 'LOGIN' ? 'SECURE AUTH' : authMode === 'SIGNUP' ? 'REGISTRATION' : 'RESET COMMS'}
            </Text>
            <View style={styles.accentDivider} />

            {authError ? (
              <View style={styles.errorAlert}>
                <Feather name="alert-circle" size={14} color="#f87171" style={{ marginRight: 6 }} />
                <Text style={styles.errorAlertText}>{authError}</Text>
              </View>
            ) : null}

            {authMessage ? (
              <View style={styles.messageAlert}>
                <ActivityIndicator size="small" color="#34d399" style={{ marginRight: 6 }} />
                <Text style={styles.messageAlertText}>{authMessage}</Text>
              </View>
            ) : null}

            {authMode === 'SIGNUP' && (
              <>
                <View style={styles.inputContainer}>
                  <Feather name="user" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    placeholder="FULL NAME"
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={setName}
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Feather name="briefcase" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    placeholder="UNIT / PRECINCT"
                    placeholderTextColor="#475569"
                    value={unit}
                    onChangeText={setUnit}
                    style={styles.textInput}
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Feather name="mail" size={14} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="ENCRYPTED EMAIL"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>

            {authMode !== 'RESET' && (
              <View style={styles.inputContainer}>
                <Feather name="lock" size={14} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  placeholder="SECURE PIN / PASS"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.textInput}
                />
              </View>
            )}

            <Pressable
              style={styles.submitButton}
              onPress={() => {
                setAuthLoading(true);
                setAuthError(null);
                setAuthMessage(null);
                setTimeout(() => {
                  setAuthLoading(false);
                  setIsAuthenticated(true);
                }, 600);
              }}
            >
              {authLoading ? (
                <ActivityIndicator color="#60a5fa" />
              ) : (
                <View style={styles.submitButtonRow}>
                  <Text style={styles.submitButtonText}>
                    {authMode === 'LOGIN' ? 'AUTHENTICATE' : authMode === 'SIGNUP' ? 'ENROLL AGENT' : 'REQUEST RESET'}
                  </Text>
                  <Feather name="cpu" size={16} color="#60a5fa" />
                </View>
              )}
            </Pressable>

            {authMode === 'LOGIN' && (
              <Pressable
                style={styles.bypassButton}
                onPress={() => {
                  setAuthLoading(true);
                  setAuthMessage("Initiating Secure Biometric Bypass...");
                  setTimeout(() => {
                    setAuthLoading(false);
                    setIsAuthenticated(true);
                  }, 600);
                }}
              >
                <Feather name="shield" size={14} color="#34d399" style={{ marginRight: 6 }} />
                <Text style={styles.bypassButtonText}>TACTICAL BYPASS (DEMO GUEST)</Text>
              </Pressable>
            )}

            <View style={styles.footerNavRow}>
              {authMode === 'LOGIN' ? (
                <>
                  <Pressable onPress={() => setAuthMode('SIGNUP')}>
                    <Text style={styles.footerNavText}>REGISTER</Text>
                  </Pressable>
                  <Pressable onPress={() => setAuthMode('RESET')}>
                    <Text style={styles.footerNavText}>RESET COMMS</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={() => setAuthMode('LOGIN')}>
                  <Text style={styles.footerNavText}>← AUTH_RETURN</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Select a few premium modules for shortcuts on dashboard
  const shortcuts = [
    { id: 'body-camera', name: 'Body Camera', icon: 'camera', category: 'camera-view' },
    { id: 'e-radio', name: 'E-Radio', icon: 'mic', category: 'communication' },
    { id: 'live-tactical-map', name: 'Tactical Map', icon: 'map', category: 'police-ops' },
    { id: 'biometric', name: 'Biometrics', icon: 'pocket', category: 'investigation-forensics' },
    { id: 'officer-ai', name: 'Officer AI', icon: 'zap', category: 'strategic-intel' },
    { id: 'digital-id', name: 'Digital ID', icon: 'credit-card', category: 'personnel-records' },
  ];

  // 4. STEP 4: MAIN HQ COMMAND CENTER DASHBOARD (hasKey && phase === 'AUTH' && isAuthenticated)
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
  fullScreenBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(4, 11, 25, 0.94)',
    borderRadius: 26,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 225, 0.35)',
    shadowColor: '#00d2f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  logoBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(4, 40, 65, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 180, 216, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#00b4d8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  logoBadgeText: {
    color: '#00d2f1',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  onboardingDesc: {
    fontSize: 13,
    color: '#8fa0b5',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  authButton: {
    width: '100%',
    backgroundColor: '#0093b8',
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d2f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  authButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.5,
  },

  // Boot Gate Styles
  bootCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  cpuIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bootTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  bootSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#22d3ee',
    letterSpacing: 2,
    marginBottom: 20,
  },
  bootLogsContainer: {
    width: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 20,
  },
  bootLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  bootLogText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06b6d4',
  },

  // Auth Card Styles
  authCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  shieldIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  authFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  accentDivider: {
    height: 3,
    width: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 20,
  },
  errorAlert: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  errorAlertText: {
    color: '#fca5a5',
    fontSize: 11,
    flex: 1,
  },
  messageAlert: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  messageAlertText: {
    color: '#6ee7b7',
    fontSize: 11,
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  submitButton: {
    width: '100%',
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  bypassButton: {
    width: '100%',
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bypassButtonText: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  footerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.6)',
  },
  footerNavText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },

  // Main Dashboard Styles
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
