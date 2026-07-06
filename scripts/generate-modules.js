const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'src', 'components', 'modules');

// Helper to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(baseDir);

const categories = [
  {
    id: 'police-ops',
    dir: 'police-ops',
    modules: [
      { id: 'tactical-ops', name: 'Tactical OPS', icon: 'crosshair', desc: 'Real-time SWAT deployment, unit allocations, and crisis operations.' },
      { id: 'traffic-mgmt', name: 'Traffic MGMT', icon: 'activity', desc: 'Metropolitan traffic controls, speed logs, and speed camera monitors.' },
      { id: 'live-tactical-map', name: 'Live Tactical Map', icon: 'map', desc: 'Real-time GPS tracking of active dispatch officers and field assets.', custom: true },
      { id: 'anti-drug-ops', name: 'Anti-Drug OPS', icon: 'alert-triangle', desc: 'Narcotics enforcement, drug registry logs, and seizure reporting.' },
    ],
  },
  {
    id: 'camera-view',
    dir: 'camera-view',
    modules: [
      { id: 'body-camera', name: 'Body Camera', icon: 'camera', desc: 'Live body-worn camera feeds and recorded incident video archive.', custom: true },
      { id: 'smartphone', name: 'Smartphone', icon: 'smartphone', desc: 'Secure mobile capture feeds, upload logs, and on-field live feeds.' },
      { id: 'smart-glass', name: 'Smart Glass', icon: 'eye', desc: 'Augmented reality heads-up overlays for patrol officers.' },
      { id: 'drone-cam', name: 'Drone Cam', icon: 'navigation', desc: 'Airborne surveillance drone camera streams and altitude stats.' },
      { id: 'hq-aerial-cam', name: 'HQ Aerial Cam', icon: 'globe', desc: 'Command center high-altitude satellite map overlays.' },
      { id: 'cctv', name: 'CCTV', icon: 'monitor', desc: 'City center closed-circuit street surveillance arrays.' },
      { id: 'remote-spy-cam', name: 'Remote / Spy Cam', icon: 'aperture', desc: 'Discreet intelligence sensors, optical taps, and covert audio nodes.' },
    ],
  },
  {
    id: 'communication',
    dir: 'communication',
    modules: [
      { id: 'e-radio', name: 'E-Radio', icon: 'mic', desc: 'Encrypted multi-band radio channels and push-to-talk broadcast.', custom: true },
      { id: 'e-messenger', name: 'E-Messenger', icon: 'message-circle', desc: 'Secure tactical chat logs and immediate incident report dispatches.' },
      { id: 'e-recorder', name: 'E-Recorder', icon: 'volume-2', desc: 'On-scene audio recording with AI transcript generating.' },
      { id: 'e-email', name: 'E-Email', icon: 'mail', desc: 'Internal department emails and confidential file sharing.' },
      { id: 'copnet', name: 'CopNet', icon: 'share-2', desc: 'Inter-agency communication gateway and database link.' },
      { id: 'e-conference', name: 'E-Conference', icon: 'video', desc: 'Encrypted tactical video conferences for precinct commanders.' },
      { id: 'e-report', name: 'E-Report', icon: 'file-text', desc: 'Digital arrest, incident, and vehicle crash reports.' },
    ],
  },
  {
    id: 'google-workspace',
    dir: 'google-workspace',
    modules: [
      { id: 'docs', name: 'Docs', icon: 'file', desc: 'Department rules, standard operating procedures, and reports.' },
      { id: 'sheets', name: 'Sheets', icon: 'grid', desc: 'Fleet logs, division budgets, and physical fitness metrics.' },
      { id: 'slides', name: 'Slides', icon: 'tv', desc: 'Precinct briefings and public press-release slides.' },
      { id: 'drive', name: 'Drive', icon: 'hard-drive', desc: 'Encrypted cloud storage for evidence media and documents.' },
      { id: 'calendar', name: 'Calendar', icon: 'calendar', desc: 'Roster shifts, court dates, and inter-precinct events.' },
      { id: 'keep', name: 'Keep', icon: 'clipboard', desc: 'Officer notepad logs, checklist, and reminder memos.' },
    ],
  },
  {
    id: 'investigation-forensics',
    dir: 'investigation-forensics',
    modules: [
      { id: 'forensic-lab', name: 'Forensic Lab', icon: 'database', desc: 'DNA catalog matching, toxicological results, and chemical records.' },
      { id: 'field-interview', name: 'Field Interview', icon: 'users', desc: 'On-scene witness interviews, suspect profiles, and logs.', custom: true },
      { id: '3d-composite', name: '3D Composite', icon: 'image', desc: 'Suspect portrait sketching and 3D skull reconstruction.' },
      { id: 'biometric', name: 'Biometric', icon: 'pocket', desc: 'Fingerprint, iris pattern, and facial match database.', custom: true },
      { id: 'evidence-log', name: 'Evidence Log', icon: 'archive', desc: 'Chain-of-custody lockers and barcode trackers.' },
    ],
  },
  {
    id: 'strategic-intel',
    dir: 'strategic-intel',
    modules: [
      { id: 'officer-ai', name: 'Officer AI', icon: 'zap', desc: 'Command advisor algorithm, dispatch log analytics, and law consultation.', custom: true },
      { id: 'intel-database', name: 'Intel Database', icon: 'server', desc: 'Threat indexes, classified records, and federal warnings.' },
      { id: 'rogues-gallery', name: 'Rogues Gallery', icon: 'user-x', desc: 'Most wanted Mugshots, active warrants, and offender aliases.' },
    ],
  },
  {
    id: 'personnel-records',
    dir: 'personnel-records',
    modules: [
      { id: 'digital-id', name: 'Digital ID', icon: 'credit-card', desc: 'Digital official police badge, credentials, and scan code.', custom: true },
      { id: 'bulletin-board', name: 'Bulletin Board', icon: 'list', desc: 'Command notices, precinct announcements, and promotion logs.' },
      { id: 'digital-library', name: 'Digital Library', icon: 'book-open', desc: 'Penal codes, municipal regulations, and legal textbooks.' },
      { id: 'fitness', name: 'Fitness', icon: 'heart', desc: 'Officer health tracking, physical assessment timers, and tips.' },
    ],
  },
  {
    id: 'training',
    dir: 'training',
    modules: [
      { id: 'training-academy', name: 'Training Academy', icon: 'book', desc: 'Officer e-courses, protocols tests, and certification logs.' },
      { id: 'simulators', name: 'Simulators', icon: 'layers', desc: 'VR training feedback, shootout decision simulations, and practice metrics.' },
    ],
  },
  {
    id: 'community-relations',
    dir: 'community-relations',
    modules: [
      { id: 'first-aid-rescue', name: 'First Aid & Rescue', icon: 'life-buoy', desc: 'Field triage checklists, CPR instructions, and local shelters.' },
      { id: 'translator', name: 'Translator', icon: 'message-square', desc: 'Speech-to-speech voice translator for community support.' },
    ],
  },
  {
    id: 'logistic-finance',
    dir: 'logistic-finance',
    modules: [
      { id: 'cop-shop', name: 'Cop Shop', icon: 'shopping-bag', desc: 'Uniform and badge requisitions, ammo refills, and field gear shop.' },
      { id: 'digital-wallet', name: 'Digital Wallet', icon: 'dollar-sign', desc: 'Precinct allowance balance, travel expense sheets, and pay stub logs.' },
      { id: 'esaad-card', name: 'ESAAD Card', icon: 'gift', desc: 'Special ESAAD discount offers and wellness benefits portal.' },
      { id: 'requisition', name: 'Requisition', icon: 'truck', desc: 'Vehicle pool scheduler, garage service sheets, and device request tracker.' },
    ],
  },
];

// Helper to convert string to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
    .replace('3d', 'ThreeD');
}

// Map category folders and files
categories.forEach((cat) => {
  const catPath = path.join(baseDir, cat.dir);
  ensureDir(catPath);

  cat.modules.forEach((mod) => {
    const compName = toPascalCase(mod.id);
    const filePath = path.join(catPath, `${compName}.tsx`);

    if (mod.custom) {
      // Custom High-Fidelity code will be written separately, or in this script
      console.log(`Setting up custom module structure for: ${compName}`);
    } else {
      // Generate clean visual mockups specific to each module's domain
      let specificMarkup = '';
      
      if (cat.id === 'google-workspace') {
        specificMarkup = `
      <Text style={[styles.sectionTitle, { color: theme.text }]}>WORK DOCUMENT FEED</Text>
      <View style={[styles.box, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Feather name="file-text" size={14} color={theme.primary} />
          <Text style={[styles.val, { color: theme.text, marginLeft: 8 }]}>HQ_Operational_Directives_2026.doc</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Feather name="file-text" size={14} color={theme.primary} />
          <Text style={[styles.val, { color: theme.text, marginLeft: 8 }]}>Shift_B_Roster_Schedules.xls</Text>
        </View>
      </View>
        `;
      } else if (cat.id === 'logistic-finance') {
        specificMarkup = `
      <Text style={[styles.sectionTitle, { color: theme.text }]}>TRANS-LINK LOGS</Text>
      <View style={[styles.box, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>CREDIT ALLOCATION</Text>
          <Text style={[styles.val, { color: theme.success }]}>$4,890.00 / SECURED</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>ACTIVE REQUISITIONS</Text>
          <Text style={[styles.val, { color: theme.text }]}>3 Pending Admin</Text>
        </View>
      </View>
        `;
      } else {
        specificMarkup = `
      <Text style={[styles.sectionTitle, { color: theme.text }]}>SYSTEM DIAGNOSTICS</Text>
      <View style={[styles.box, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>LINK CONNECTION</Text>
          <Text style={[styles.val, { color: theme.success }]}>ACTIVE (SECURED)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>SYSTEM HEALTH</Text>
          <Text style={[styles.val, { color: theme.text }]}>98.9% STABLE</Text>
        </View>
      </View>
        `;
      }

      const content = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '../../../constants/theme';

export default function ${compName}({ theme }: { theme: any; isDark: boolean }) {
  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>OPERATIONAL LOGS</Text>
      <View style={[styles.consoleContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.consoleLine, { color: theme.text }]}>[13:10:01] Loaded nodes for ${mod.name}...</Text>
        <Text style={[styles.consoleLine, { color: theme.text }]}>[13:10:02] Connected successfully to HQ link.</Text>
        <Text style={[styles.consoleLine, { color: theme.primary }]}>[13:10:03] State: IDLE & MONITORING.</Text>
      </View>

      ${specificMarkup}
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
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
  box: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  val: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
});
`;
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
});

console.log('Finished writing base files!');
