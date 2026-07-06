
export enum AppMode {
  MOBILE = 'MOBILE',
  COMMAND = 'COMMAND'
}

export enum ViewState {
  HOME = 'HOME',
  BWC = 'CAMERA',
  CAMERA_SMARTPHONE = 'CAMERA_SMARTPHONE',
  CAMERA_SMARTGLASS = 'CAMERA_SMARTGLASS',
  CAMERA_DRONE = 'CAMERA_DRONE',
  CAMERA_HQ_DRONE = 'CAMERA_HQ_DRONE',
  CAMERA_CCTV = 'CAMERA_CCTV',
  CAMERA_REMOTE_SPY = 'CAMERA_REMOTE_SPY',
  REPORTS = 'REPORTS',
  E_REPORT = 'E_REPORT',
  EVIDENCE = 'EVIDENCE',
  MAP = 'MAP',
  BUDDY_CHAT = 'BUDDY_CHAT',
  REFERENCE = 'REFERENCE',
  COMPOSITE = 'COMPOSITE',
  BIOMETRIC = 'BIOMETRIC',
  ERADIO = 'ERADIO',
  EMESSENGER = 'EMESSENGER',
  EMAIL = 'EMAIL',
  E_CONFERENCE = 'E_CONFERENCE',
  FIRST_AID = 'FIRST_AID',
  COP_SHOP = 'COP_SHOP',
  REQUISITION = 'REQUISITION',
  TRAFFIC = 'TRAFFIC',
  TRANSLATOR = 'TRANSLATOR',
  FITNESS = 'FITNESS',
  BULLETIN = 'BULLETIN',
  INTELLIGENCE = 'INTELLIGENCE',
  DRUG_OPS = 'DRUG_OPS',
  TRAINING = 'TRAINING',
  SIMULATORS = 'SIMULATORS',
  WALLET = 'WALLET',
  TACTICAL_OPS = 'TACTICAL_OPS',
  ROGUE_GALLERY = 'ROGUE_GALLERY',
  FORENSICS = 'FORENSICS',
  ERECORDER = 'ERECORDER',
  GOOGLE_DOCS = 'GOOGLE_DOCS',
  GOOGLE_SHEETS = 'GOOGLE_SHEETS',
  GOOGLE_SLIDES = 'GOOGLE_SLIDES',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  GOOGLE_CALENDAR = 'GOOGLE_CALENDAR',
  GOOGLE_KEEP = 'GOOGLE_KEEP',
  ESAAD_CARD = 'ESAAD_CARD',
  SETTINGS = 'SETTINGS',
  POCKET_INTERROGATOR = 'POCKET_INTERROGATOR',
  COPNET = 'COPNET',
  DIGITAL_ID = 'DIGITAL_ID',
  COMMUNICATIONS = 'COMMUNICATIONS'
}

export interface User {
  id: string;
  name: string;
  username?: string;
  role: 'ADMIN' | 'OFFICER';
  unit: string;
  rank: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: { lat: number; lng: number; address: string };
  timestamp: string;
  officerId: string;
  description: string;
  status: 'OPEN' | 'RESOLVED' | 'IN_PROGRESS';
}

export interface Officer {
  id: string;
  name: string;
  badge: string;
  status: 'ON_DUTY' | 'BUSY' | 'OFFLINE' | 'DANGER';
  location: { lat: number; lng: number };
  battery: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface EvidenceItem {
  id: string;
  type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'FORENSIC';
  timestamp: string;
  location: string;
  officer: string;
  tags: string[];
  chainOfCustody: { action: string; user: string; time: string }[];
  content?: string; // Base64 or URL
  description?: string; // AI Description
  forensicType?: 'PATTERN' | 'OBJECT' | 'BIOLOGICAL';
}

export interface ReferenceDoc {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
}

export interface Suspect {
  id: string;
  name: string;
  alias: string;
  crime: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  imageUrl: string;
  fullBodyImageUrl?: string; // For full body composites
  threeDModelUrl?: string;   // For generated 3D video rotation
  status: 'WANTED' | 'CAPTURED' | 'SURVEILLANCE';
  lastSeen?: string;
  imageSource?: 'ACTUAL' | 'AI_GENERATED';
  affiliation?: string;
}