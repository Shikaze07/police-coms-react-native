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
    name: 'Police Operations',
    icon: 'shield',
    modules: [
      { id: 'tactical-ops', name: 'Tactical OPS', category: 'police-ops', icon: 'crosshair', description: 'Real-time SWAT deployment, unit allocations, and crisis operations.' },
      { id: 'traffic-mgmt', name: 'Traffic MGMT', category: 'police-ops', icon: 'activity', description: 'Metropolitan traffic controls, speed logs, and speed camera monitors.' },
      { id: 'live-tactical-map', name: 'Live Tactical Map', category: 'police-ops', icon: 'map', description: 'Real-time GPS tracking of active dispatch officers and field assets.' },
      { id: 'anti-drug-ops', name: 'Anti-Drug OPS', category: 'police-ops', icon: 'alert-triangle', description: 'Narcotics enforcement, drug registry logs, and seizure reporting.' },
    ],
  },
  {
    id: 'camera-view',
    name: 'Camera View',
    icon: 'video',
    modules: [
      { id: 'body-camera', name: 'Body Camera', category: 'camera-view', icon: 'camera', description: 'Live body-worn camera feeds and recorded incident video archive.' },
      { id: 'smartphone', name: 'Smartphone', category: 'camera-view', icon: 'smartphone', description: 'Secure mobile capture feeds, upload logs, and on-field live feeds.' },
      { id: 'smart-glass', name: 'Smart Glass', category: 'camera-view', icon: 'eye', description: 'Augmented reality heads-up overlays for patrol officers.' },
      { id: 'drone-cam', name: 'Drone Cam', category: 'camera-view', icon: 'navigation', description: 'Airborne surveillance drone camera streams and altitude stats.' },
      { id: 'hq-aerial-cam', name: 'HQ Aerial Cam', category: 'camera-view', icon: 'globe', description: 'Command center high-altitude satellite map overlays.' },
      { id: 'cctv', name: 'CCTV', category: 'camera-view', icon: 'monitor', description: 'City center closed-circuit street surveillance arrays.' },
      { id: 'remote-spy-cam', name: 'Remote / Spy Cam', category: 'camera-view', icon: 'aperture', description: 'Discreet intelligence sensors, optical taps, and covert audio nodes.' },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: 'message-square',
    modules: [
      { id: 'e-radio', name: 'E-Radio', category: 'communication', icon: 'mic', description: 'Encrypted multi-band radio channels and push-to-talk broadcast.' },
      { id: 'e-messenger', name: 'E-Messenger', category: 'communication', icon: 'message-circle', description: 'Secure tactical chat logs and immediate incident report dispatches.' },
      { id: 'e-recorder', name: 'E-Recorder', category: 'communication', icon: 'volume-2', description: 'On-scene audio recording with AI transcript generating.' },
      { id: 'e-email', name: 'E-Email', category: 'communication', icon: 'mail', description: 'Internal department emails and confidential file sharing.' },
      { id: 'copnet', name: 'CopNet', category: 'communication', icon: 'share-2', description: 'Inter-agency communication gateway and database link.' },
      { id: 'e-conference', name: 'E-Conference', category: 'communication', icon: 'video', description: 'Encrypted tactical video conferences for precinct commanders.' },
      { id: 'e-report', name: 'E-Report', category: 'communication', icon: 'file-text', description: 'Digital arrest, incident, and vehicle crash reports.' },
    ],
  },
  {
    id: 'google-workspace',
    name: 'Google WorkSpace',
    icon: 'grid',
    modules: [
      { id: 'docs', name: 'Docs', category: 'google-workspace', icon: 'file', description: 'Department rules, standard operating procedures, and reports.' },
      { id: 'sheets', name: 'Sheets', category: 'google-workspace', icon: 'grid', description: 'Fleet logs, division budgets, and physical fitness metrics.' },
      { id: 'slides', name: 'Slides', category: 'google-workspace', icon: 'tv', description: 'Precinct briefings and public press-release slides.' },
      { id: 'drive', name: 'Drive', category: 'google-workspace', icon: 'hard-drive', description: 'Encrypted cloud storage for evidence media and documents.' },
      { id: 'calendar', name: 'Calendar', category: 'google-workspace', icon: 'calendar', description: 'Roster shifts, court dates, and inter-precinct events.' },
      { id: 'keep', name: 'Keep', category: 'google-workspace', icon: 'clipboard', description: 'Officer notepad logs, checklist, and reminder memos.' },
    ],
  },
  {
    id: 'investigation-forensics',
    name: 'Investigation & Forensics',
    icon: 'search',
    modules: [
      { id: 'forensic-lab', name: 'Forensic Lab', category: 'investigation-forensics', icon: 'database', description: 'DNA catalog matching, toxicological results, and chemical records.' },
      { id: 'field-interview', name: 'Field Interview', category: 'investigation-forensics', icon: 'users', description: 'On-scene witness interviews, suspect profiles, and logs.' },
      { id: '3d-composite', name: '3D Composite', category: 'investigation-forensics', icon: 'image', description: 'Suspect portrait sketching and 3D skull reconstruction.' },
      { id: 'biometric', name: 'Biometric', category: 'investigation-forensics', icon: 'pocket', description: 'Fingerprint, iris pattern, and facial match database.' },
      { id: 'evidence-log', name: 'Evidence Log', category: 'investigation-forensics', icon: 'archive', description: 'Chain-of-custody lockers and barcode trackers.' },
    ],
  },
  {
    id: 'strategic-intel',
    name: 'Strategic Intelligence',
    icon: 'cpu',
    modules: [
      { id: 'officer-ai', name: 'Officer AI', category: 'strategic-intel', icon: 'zap', description: 'Command advisor algorithm, dispatch log analytics, and law consultation.' },
      { id: 'intel-database', name: 'Intel Database', category: 'strategic-intel', icon: 'server', description: 'Threat indexes, classified records, and federal warnings.' },
      { id: 'rogues-gallery', name: 'Rogues Gallery', category: 'strategic-intel', icon: 'user-x', description: 'Most wanted Mugshots, active warrants, and offender aliases.' },
    ],
  },
  {
    id: 'personnel-records',
    name: 'Personnel & Records',
    icon: 'user',
    modules: [
      { id: 'digital-id', name: 'Digital ID', category: 'personnel-records', icon: 'credit-card', description: 'Digital official police badge, credentials, and scan code.' },
      { id: 'bulletin-board', name: 'Bulletin Board', category: 'personnel-records', icon: 'list', description: 'Command notices, precinct announcements, and promotion logs.' },
      { id: 'digital-library', name: 'Digital Library', category: 'personnel-records', icon: 'book-open', description: 'Penal codes, municipal regulations, and legal textbooks.' },
      { id: 'fitness', name: 'Fitness', category: 'personnel-records', icon: 'heart', description: 'Officer health tracking, physical assessment timers, and tips.' },
    ],
  },
  {
    id: 'training',
    name: 'Training',
    icon: 'award',
    modules: [
      { id: 'training-academy', name: 'Training Academy', category: 'training', icon: 'book', description: 'Officer e-courses, protocols tests, and certification logs.' },
      { id: 'simulators', name: 'Simulators', category: 'training', icon: 'layers', description: 'VR training feedback, shootout decision simulations, and practice metrics.' },
    ],
  },
  {
    id: 'community-relations',
    name: 'Community Relations',
    icon: 'heart',
    modules: [
      { id: 'first-aid-rescue', name: 'First Aid & Rescue', category: 'community-relations', icon: 'life-buoy', description: 'Field triage checklists, CPR instructions, and local shelters.' },
      { id: 'translator', name: 'Translator', category: 'community-relations', icon: 'message-square', description: 'Speech-to-speech voice translator for community support.' },
    ],
  },
  {
    id: 'logistic-finance',
    name: 'Logistic & Finance',
    icon: 'shopping-cart',
    modules: [
      { id: 'cop-shop', name: 'Cop Shop', category: 'logistic-finance', icon: 'shopping-bag', description: 'Uniform and badge requisitions, ammo refills, and field gear shop.' },
      { id: 'digital-wallet', name: 'Digital Wallet', category: 'logistic-finance', icon: 'dollar-sign', description: 'Precinct allowance balance, travel expense sheets, and pay stub logs.' },
      { id: 'esaad-card', name: 'ESAAD Card', category: 'logistic-finance', icon: 'gift', description: 'Special ESAAD discount offers and wellness benefits portal.' },
      { id: 'requisition', name: 'Requisition', category: 'logistic-finance', icon: 'truck', description: 'Vehicle pool scheduler, garage service sheets, and device request tracker.' },
    ],
  },
];
