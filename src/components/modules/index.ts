import React from 'react';

// Category: Police Operations
import TacticalOps from './police-ops/TacticalOps';
import TrafficMgmt from './police-ops/TrafficMgmt';
import LiveTacticalMap from './police-ops/LiveTacticalMap';
import AntiDrugOps from './police-ops/AntiDrugOps';

// Category: Camera View
import BodyCamera from './camera-view/BodyCamera';
import Smartphone from './camera-view/Smartphone';
import SmartGlass from './camera-view/SmartGlass';
import DroneCam from './camera-view/DroneCam';
import HqAerialCam from './camera-view/HqAerialCam';
import Cctv from './camera-view/Cctv';
import RemoteSpyCam from './camera-view/RemoteSpyCam';

// Category: Communication
import ERadio from './communication/ERadio';
import EMessenger from './communication/EMessenger';
import ERecorder from './communication/ERecorder';
import EEmail from './communication/EEmail';
import Copnet from './communication/Copnet';
import EConference from './communication/EConference';
import EReport from './communication/EReport';

// Category: Google Workspace
import Docs from './google-workspace/Docs';
import Sheets from './google-workspace/Sheets';
import Slides from './google-workspace/Slides';
import Drive from './google-workspace/Drive';
import Calendar from './google-workspace/Calendar';
import Keep from './google-workspace/Keep';

// Category: Investigation & Forensics
import ForensicLab from './investigation-forensics/ForensicLab';
import FieldInterview from './investigation-forensics/FieldInterview';
import ThreeDComposite from './investigation-forensics/ThreeDComposite';
import Biometric from './investigation-forensics/Biometric';
import EvidenceLog from './investigation-forensics/EvidenceLog';

// Category: Strategic Intelligence
import OfficerAi from './strategic-intel/OfficerAi';
import IntelDatabase from './strategic-intel/IntelDatabase';
import RoguesGallery from './strategic-intel/RoguesGallery';

// Category: Personnel & Records
import DigitalId from './personnel-records/DigitalId';
import BulletinBoard from './personnel-records/BulletinBoard';
import DigitalLibrary from './personnel-records/DigitalLibrary';
import Fitness from './personnel-records/Fitness';

// Category: Training
import TrainingAcademy from './training/TrainingAcademy';
import Simulators from './training/Simulators';

// Category: Community Relations
import FirstAidRescue from './community-relations/FirstAidRescue';
import Translator from './community-relations/Translator';

// Category: Logistic & Finance
import CopShop from './logistic-finance/CopShop';
import DigitalWallet from './logistic-finance/DigitalWallet';
import EsaadCard from './logistic-finance/EsaadCard';
import Requisition from './logistic-finance/Requisition';

// Registry type definition
export const ModuleRegistry: Record<string, React.ComponentType<{ theme: any; isDark: boolean }>> = {
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
