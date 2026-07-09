import React from 'react';

// Lazy-loaded module components — only loaded when the user navigates to them.
// This prevents all 37 modules from being parsed and executed at app startup.

// Category: Police Operations
const TacticalOps = React.lazy(() => import('./police-ops/TacticalOps'));
const TrafficMgmt = React.lazy(() => import('./police-ops/TrafficMgmt'));
const LiveTacticalMap = React.lazy(() => import('./police-ops/LiveTacticalMap'));
const AntiDrugOps = React.lazy(() => import('./police-ops/AntiDrugOps'));

// Category: Camera View
const BodyCamera = React.lazy(() => import('./camera-view/BodyCamera'));
const Smartphone = React.lazy(() => import('./camera-view/Smartphone'));
const SmartGlass = React.lazy(() => import('./camera-view/SmartGlass'));
const DroneCam = React.lazy(() => import('./camera-view/DroneCam'));
const HqAerialCam = React.lazy(() => import('./camera-view/HqAerialCam'));
const Cctv = React.lazy(() => import('./camera-view/Cctv'));
const RemoteSpyCam = React.lazy(() => import('./camera-view/RemoteSpyCam'));

// Category: Communication
const ERadio = React.lazy(() => import('./communication/ERadio'));
const EMessenger = React.lazy(() => import('./communication/EMessenger'));
const ERecorder = React.lazy(() => import('./communication/ERecorder'));
const EEmail = React.lazy(() => import('./communication/EEmail'));
const Copnet = React.lazy(() => import('./communication/Copnet'));
const EConference = React.lazy(() => import('./communication/EConference'));
const EReport = React.lazy(() => import('./communication/EReport'));

// Category: Google Workspace
const Docs = React.lazy(() => import('./google-workspace/Docs'));
const Sheets = React.lazy(() => import('./google-workspace/Sheets'));
const Slides = React.lazy(() => import('./google-workspace/Slides'));
const Drive = React.lazy(() => import('./google-workspace/Drive'));
const Calendar = React.lazy(() => import('./google-workspace/Calendar'));
const Keep = React.lazy(() => import('./google-workspace/Keep'));

// Category: Investigation & Forensics
const ForensicLab = React.lazy(() => import('./investigation-forensics/ForensicLab'));
const FieldInterview = React.lazy(() => import('./investigation-forensics/FieldInterview'));
const ThreeDComposite = React.lazy(() => import('./investigation-forensics/ThreeDComposite'));
const Biometric = React.lazy(() => import('./investigation-forensics/Biometric'));
const EvidenceLog = React.lazy(() => import('./investigation-forensics/EvidenceLog'));

// Category: Strategic Intelligence
const OfficerAi = React.lazy(() => import('./strategic-intel/OfficerAi'));
const IntelDatabase = React.lazy(() => import('./strategic-intel/IntelDatabase'));
const RoguesGallery = React.lazy(() => import('./strategic-intel/RoguesGallery'));

// Category: Personnel & Records
const DigitalId = React.lazy(() => import('./personnel-records/DigitalId'));
const BulletinBoard = React.lazy(() => import('./personnel-records/BulletinBoard'));
const DigitalLibrary = React.lazy(() => import('./personnel-records/DigitalLibrary'));
const Fitness = React.lazy(() => import('./personnel-records/Fitness'));

// Category: Training
const TrainingAcademy = React.lazy(() => import('./training/TrainingAcademy'));
const Simulators = React.lazy(() => import('./training/Simulators'));

// Category: Community Relations
const FirstAidRescue = React.lazy(() => import('./community-relations/FirstAidRescue'));
const Translator = React.lazy(() => import('./community-relations/Translator'));

// Category: Logistic & Finance
const CopShop = React.lazy(() => import('./logistic-finance/CopShop'));
const DigitalWallet = React.lazy(() => import('./logistic-finance/DigitalWallet'));
const EsaadCard = React.lazy(() => import('./logistic-finance/EsaadCard'));
const Requisition = React.lazy(() => import('./logistic-finance/Requisition'));

// Registry type definition
export const ModuleRegistry: Record<string, React.LazyExoticComponent<React.ComponentType<{ theme: any; isDark: boolean }>>> = {
  // Police Operations
  'tactical-ops': TacticalOps,
  'traffic-mgmt': TrafficMgmt,
  'live-tactical-map': LiveTacticalMap,
  'anti-drug-ops': AntiDrugOps,

  // Camera View
  'body-camera': BodyCamera,
  'smartphone': Smartphone,
  'smart-glass': SmartGlass,
  'drone-cam': DroneCam,
  'hq-aerial-cam': HqAerialCam,
  'cctv': Cctv,
  'remote-spy-cam': RemoteSpyCam,

  // Communication
  'e-radio': ERadio,
  'e-messenger': EMessenger,
  'e-recorder': ERecorder,
  'e-email': EEmail,
  'copnet': Copnet,
  'e-conference': EConference,
  'e-report': EReport,

  // Google Workspace
  'docs': Docs,
  'sheets': Sheets,
  'slides': Slides,
  'drive': Drive,
  'calendar': Calendar,
  'keep': Keep,

  // Investigation & Forensics
  'forensic-lab': ForensicLab,
  'field-interview': FieldInterview,
  '3d-composite': ThreeDComposite,
  'biometric': Biometric,
  'evidence-log': EvidenceLog,

  // Strategic Intelligence
  'officer-ai': OfficerAi,
  'intel-database': IntelDatabase,
  'rogues-gallery': RoguesGallery,

  // Personnel & Records
  'digital-id': DigitalId,
  'bulletin-board': BulletinBoard,
  'digital-library': DigitalLibrary,
  'fitness': Fitness,

  // Training
  'training-academy': TrainingAcademy,
  'simulators': Simulators,

  // Community Relations
  'first-aid-rescue': FirstAidRescue,
  'translator': Translator,

  // Logistic & Finance
  'cop-shop': CopShop,
  'digital-wallet': DigitalWallet,
  'esaad-card': EsaadCard,
  'requisition': Requisition,
};
