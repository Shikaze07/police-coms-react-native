export interface ModuleItem {
  id: string;
  name: string;
  category: string;
  icon: string; // Feather icon name
  description: string;
}

export interface ModuleCategory {
  id: string;
  name: string;
  icon: string; // Feather icon name
  modules: ModuleItem[];
}

export interface ModuleItem {
  id: string;
  name: string;
  category: string;
  icon: string; // Feather icon name
  description: string;
}

export interface ModuleCategory {
  id: string;
  name: string;
  icon: string; // Feather icon name
  modules: ModuleItem[];
}

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: 'police-ops',
    name: 'POLICE OPERATIONS',
    icon: 'shield',
    modules: [
      { id: 'tactical-ops', name: 'TACTICAL OPS', category: 'police-ops', icon: 'crosshair', description: 'Real-time SWAT deployment, unit allocations, and crisis operations.' },
      { id: 'traffic-mgmt', name: 'TRAFFIC MGMT', category: 'police-ops', icon: 'truck', description: 'Metropolitan traffic controls, speed logs, and speed camera monitors.' },
      { id: 'live-tactical-map', name: 'LIVE TACTICAL MAP', category: 'police-ops', icon: 'map', description: 'Real-time GPS tracking of active dispatch officers and field assets.' },
      { id: 'anti-drug-ops', name: 'ANTI-DRUG OPS', category: 'police-ops', icon: 'slash', description: 'Narcotics enforcement, drug registry logs, and seizure reporting.' },
    ],
  },
  {
    id: 'camera-view',
    name: 'CAMERA VIEW',
    icon: 'camera',
    modules: [
      { id: 'body-camera', name: 'BODY CAMERA', category: 'camera-view', icon: 'camera', description: 'Live body-worn camera feeds and recorded incident video archive.' },
      { id: 'smartphone', name: 'SMARTPHONE', category: 'camera-view', icon: 'smartphone', description: 'Secure mobile capture feeds, upload logs, and on-field live feeds.' },
      { id: 'smart-glass', name: 'SMARTGLASS', category: 'camera-view', icon: 'eye', description: 'Augmented reality heads-up overlays for patrol officers.' },
      { id: 'drone-cam', name: 'DRONE CAM', category: 'camera-view', icon: 'zap', description: 'Airborne surveillance drone camera streams and altitude stats.' },
      { id: 'hq-aerial-cam', name: 'HQ AERIAL CAM', category: 'camera-view', icon: 'globe', description: 'Command center high-altitude satellite map overlays.' },
      { id: 'cctv', name: 'CCTV', category: 'camera-view', icon: 'monitor', description: 'City center closed-circuit street surveillance arrays.' },
      { id: 'remote-spy-cam', name: 'REMOTE / SPY CAM', category: 'camera-view', icon: 'eye-off', description: 'Discreet intelligence sensors, optical taps, and covert audio nodes.' },
    ],
  },
  {
    id: 'communication',
    name: 'COMMUNICATION',
    icon: 'radio',
    modules: [
      { id: 'e-radio', name: 'E-RADIO', category: 'communication', icon: 'radio', description: 'Encrypted multi-band radio channels and push-to-talk broadcast.' },
      { id: 'e-messenger', name: 'E-MESSENGER', category: 'communication', icon: 'message-square', description: 'Secure tactical chat logs and immediate incident report dispatches.' },
      { id: 'e-recorder', name: 'E-RECORDER', category: 'communication', icon: 'mic', description: 'On-scene audio recording with AI transcript generating.' },
      { id: 'e-email', name: 'E-MAIL', category: 'communication', icon: 'mail', description: 'Internal department emails and confidential file sharing.' },
      { id: 'copnet', name: 'COPNET', category: 'communication', icon: 'users', description: 'Inter-agency communication gateway and database link.' },
      { id: 'e-conference', name: 'E-CONFERENCE', category: 'communication', icon: 'video', description: 'Encrypted tactical video conferences for precinct commanders.' },
      { id: 'e-report', name: 'E-REPORT', category: 'communication', icon: 'file-text', description: 'Digital arrest, incident, and vehicle crash reports.' },
    ],
  },
  {
    id: 'google-workspace',
    name: 'GOOGLE WORKSPACE',
    icon: 'grid',
    modules: [
      { id: 'docs', name: 'DOCS', category: 'google-workspace', icon: 'file-text', description: 'Department rules, standard operating procedures, and reports.' },
      { id: 'sheets', name: 'SHEETS', category: 'google-workspace', icon: 'grid', description: 'Fleet logs, division budgets, and physical fitness metrics.' },
      { id: 'slides', name: 'SLIDES', category: 'google-workspace', icon: 'tv', description: 'Precinct briefings and public press-release slides.' },
      { id: 'drive', name: 'DRIVE', category: 'google-workspace', icon: 'folder', description: 'Encrypted cloud storage for evidence media and documents.' },
      { id: 'calendar', name: 'CALENDAR', category: 'google-workspace', icon: 'calendar', description: 'Roster shifts, court dates, and inter-precinct events.' },
      { id: 'keep', name: 'KEEP', category: 'google-workspace', icon: 'file', description: 'Officer notepad logs, checklist, and reminder memos.' },
    ],
  },
  {
    id: 'investigation-forensics',
    name: 'INVESTIGATION & FORENSICS',
    icon: 'database',
    modules: [
      { id: 'forensic-lab', name: 'FORENSIC LAB', category: 'investigation-forensics', icon: 'database', description: 'DNA catalog matching, toxicological results, and chemical records.' },
      { id: 'field-interview', name: 'FIELD INTERVIEW', category: 'investigation-forensics', icon: 'message-square', description: 'On-scene witness interviews, suspect profiles, and logs.' },
      { id: '3d-composite', name: '3D COMPOSITE', category: 'investigation-forensics', icon: 'edit-3', description: 'Suspect portrait sketching and 3D skull reconstruction.' },
      { id: 'biometric', name: 'BIOMETRIC', category: 'investigation-forensics', icon: 'cpu', description: 'Fingerprint, iris pattern, and facial match database.' },
      { id: 'evidence-log', name: 'EVIDENCE LOG', category: 'investigation-forensics', icon: 'archive', description: 'Chain-of-custody lockers and barcode trackers.' },
    ],
  },
  {
    id: 'strategic-intel',
    name: 'STRATEGIC INTELLIGENCE',
    icon: 'eye',
    modules: [
      { id: 'officer-ai', name: 'OFFICER AI', category: 'strategic-intel', icon: 'cpu', description: 'Command advisor algorithm, dispatch log analytics, and law consultation.' },
      { id: 'intel-database', name: 'INTEL DATABASE', category: 'strategic-intel', icon: 'eye', description: 'Threat indexes, classified records, and federal warnings.' },
      { id: 'rogues-gallery', name: 'ROGUES GALLERY', category: 'strategic-intel', icon: 'user-x', description: 'Most wanted Mugshots, active warrants, and offender aliases.' },
    ],
  },
  {
    id: 'personnel-records',
    name: 'PERSONNEL & RECORDS',
    icon: 'users',
    modules: [
      { id: 'digital-id', name: 'DIGITAL ID', category: 'personnel-records', icon: 'credit-card', description: 'Digital official police badge, credentials, and scan code.' },
      { id: 'bulletin-board', name: 'BULLETIN BOARD', category: 'personnel-records', icon: 'volume-2', description: 'Command notices, precinct announcements, and promotion logs.' },
      { id: 'digital-library', name: 'DIGITAL LIBRARY', category: 'personnel-records', icon: 'book-open', description: 'Penal codes, municipal regulations, and legal textbooks.' },
      { id: 'fitness', name: 'FITNESS', category: 'personnel-records', icon: 'activity', description: 'Officer health tracking, physical assessment timers, and tips.' },
    ],
  },
  {
    id: 'training',
    name: 'TRAINING',
    icon: 'award',
    modules: [
      { id: 'training-academy', name: 'TRAINING ACADEMY', category: 'training', icon: 'award', description: 'Officer e-courses, protocols tests, and certification logs.' },
      { id: 'simulators', name: 'SIMULATORS', category: 'training', icon: 'laptop', description: 'VR training feedback, shootout decision simulations, and practice metrics.' },
    ],
  },
  {
    id: 'community-relations',
    name: 'COMMUNITY RELATIONS',
    icon: 'heart',
    modules: [
      { id: 'first-aid-rescue', name: 'FIRST AID & RESCUE', category: 'community-relations', icon: 'heart', description: 'Field triage checklists, CPR instructions, and local shelters.' },
      { id: 'translator', name: 'TRANSLATOR', category: 'community-relations', icon: 'globe', description: 'Speech-to-speech voice translator for community support.' },
    ],
  },
  {
    id: 'logistic-finance',
    name: 'LOGISTICS & FINANCE',
    icon: 'shopping-bag',
    modules: [
      { id: 'cop-shop', name: 'COP SHOP', category: 'logistic-finance', icon: 'shopping-bag', description: 'Uniform and badge requisitions, ammo refills, and field gear shop.' },
      { id: 'digital-wallet', name: 'DIGITAL WALLET', category: 'logistic-finance', icon: 'credit-card', description: 'Precinct allowance balance, travel expense sheets, and pay stub logs.' },
      { id: 'esaad-card', name: 'ESAAD CARD', category: 'logistic-finance', icon: 'credit-card', description: 'Special ESAAD discount offers and wellness benefits portal.' },
      { id: 'requisition', name: 'REQUISITION', category: 'logistic-finance', icon: 'download', description: 'Vehicle pool scheduler, garage service sheets, and device request tracker.' },
    ],
  },
];
