
import React from 'react';
import { X, HelpCircle, Book, Info, Shield, Zap, Target, MessageSquare, Map as MapIcon, Camera, FileText, FolderArchive, GraduationCap, Users, HeartPulse, Radio, Languages, ShoppingBag, Bell, Activity, Database, Microscope, Crosshair, Wallet, Plus } from 'lucide-react';
import { ViewState } from './types';
import { motion, AnimatePresence } from 'motion/react';

interface UserManualProps {
  currentView: ViewState;
  isOpen: boolean;
  onClose: () => void;
}

const MANUAL_CONTENT: Partial<Record<ViewState, {
  title: string;
  icon: any;
  sections: { title: string; items: string[] }[];
}>> = {
  [ViewState.HOME]: {
    title: 'Operation Console',
    icon: Shield,
    sections: [
      { title: 'Overview', items: ['Global state monitor for shift activity.', 'Real-time tactical alerts and notification feed.', 'Quick navigation to critical modules.'] },
      { title: 'Alerts', items: ['High-risk events trigger red system overlays.', 'Backup requests from other units appear in the bottom tray.'] }
    ]
  },
  [ViewState.BWC]: {
    title: 'Camera / BWC',
    icon: Camera,
    sections: [
      { title: 'AI Analysis', items: ['Tap "Start AI Analysis" to identify weapons or threats.', 'Detected objects are logged in the tactical HUD.', 'Uses Gemini Vision for real-time scene understanding.'] },
      { title: 'Evidence', items: ['Tap "Capture Photo" or "Save Clip" during active incidents.', 'All captured media is automatically encrypted.'] }
    ]
  },
  [ViewState.REPORTS]: {
    title: 'Report Writer',
    icon: FileText,
    sections: [
      { title: 'AI Assistance', items: ['Select a template (Check Point, Spot Report, etc.).', 'Use "AI Narrative" to draft professional summaries based on captured evidence.'] },
      { title: 'Submission', items: ['Review all fields before final submission.', 'Locked reports can only be modified via official addendums.'] }
    ]
  },
  [ViewState.EVIDENCE]: {
    title: 'Evidence Locker',
    icon: FolderArchive,
    sections: [
      { title: 'Access Control', items: ['Restricted access vault for sensitive captures.', 'View media logs and forensic markers associated with cases.'] }
    ]
  },
  [ViewState.MAP]: {
    title: 'Live Tactical Map',
    icon: MapIcon,
    sections: [
      { title: 'Tracking', items: ['Real-time geolocation of all active patrol units.', 'Tap unit icons to view individual vitals and status.'] },
      { title: 'Hotspots', items: ['Red heatmaps indicate active higher-crime probability zones.'] }
    ]
  },
  [ViewState.BUDDY_CHAT]: {
    title: 'OFFICER AI Assistant',
    icon: MessageSquare,
    sections: [
      { title: 'Voice Interface', items: ['Tap the microphone to speak directly to OFFICER.', 'Ask about legal procedures, PNP manuals, or SOPs.'] },
      { title: 'Intelligence', items: ['OFFICER has direct access to the PNP digital library.', 'He can interpret complex situations and offer tactical advice.'] }
    ]
  },
  [ViewState.REFERENCE]: {
    title: 'Reference Library',
    icon: Book,
    sections: [
      { title: 'Docs', items: ['Searchable database of PNP Rules of Engagement.', 'Includes full text of National Laws and Administrative Orders.', 'Offline access for field reference.'] }
    ]
  },
  [ViewState.COMPOSITE]: {
    title: 'Composite Sketch',
    icon: Zap,
    sections: [
      { title: 'Suspect Artist', items: ['Describe suspect features in the chat box.', 'Select specific eye, nose, or face shapes to refine.', 'Click "Regenerate" to iterate on the AI-generated sketch.'] }
    ]
  },
  [ViewState.COMMUNICATIONS]: {
    title: 'Radio / Messenger',
    icon: Radio,
    sections: [
      { title: 'Channels', items: ['Monitor tactical airwaves and regional broadcasts.', 'Send priority digital messages to and from HQ.'] }
    ]
  },
  [ViewState.FIRST_AID]: {
    title: 'Medical Response',
    icon: HeartPulse,
    sections: [
      { title: 'Field Guides', items: ['Instant access to GSW, trauma, and CPR protocols.', 'Follow step-by-step instructions for emergency stabilization.'] }
    ]
  },
  [ViewState.COP_SHOP]: {
    title: 'Equipment & Gear',
    icon: ShoppingBag,
    sections: [
      { title: 'Inventory', items: ['Manage assigned duty gear and tactical requests.', 'Track ammo consumption and non-lethal equipment status.'] }
    ]
  },
  [ViewState.TRAFFIC]: {
    title: 'Traffic Management',
    icon: Zap,
    sections: [
      { title: 'Enforcement', items: ['ANPR / License plate recognition feed.', 'Digital ticketing and violation history lookups.'] }
    ]
  },
  [ViewState.TRANSLATOR]: {
    title: 'Unit Translator',
    icon: Languages,
    sections: [
      { title: 'Dialects', items: ['Support for multiple local and international dialects.', 'Voice-to-voice translation for smooth field dialogue.'] }
    ]
  },
  [ViewState.FITNESS]: {
    title: 'Wellness Terminal',
    icon: Activity,
    sections: [
      { title: 'Readiness', items: ['Track physical fitness metrics and mental health resources.', 'Daily readiness checks for high-stress duty cycles.'] }
    ]
  },
  [ViewState.BULLETIN]: {
    title: 'Police Bulletin',
    icon: Bell,
    sections: [
      { title: 'Briefing', items: ['Read daily roll-call announcements.', 'Stay updated on BOLO (Be On the Look Out) notices.'] }
    ]
  },
  [ViewState.INTELLIGENCE]: {
    title: 'Intel Analysis',
    icon: Database,
    sections: [
      { title: 'Data Flow', items: ['Visualized crime trends and predictive hotspots.', 'Link analysis between known recurring offenders.'] }
    ]
  },
  [ViewState.DRUG_OPS]: {
    title: 'Narcotics Unit',
    icon: Shield,
    sections: [
      { title: 'Case Tracking', items: ['Chain of custody for illegal substance seizures.', 'Monitoring of high-value targets in narcotics cases.'] }
    ]
  },
  [ViewState.TRAINING]: {
    title: 'Academy Terminal',
    icon: GraduationCap,
    sections: [
      { title: 'E-Learning', items: ['Required quarterly refreshers on law and ethics.', 'Virtual classroom for procedural updates.'] }
    ]
  },
  [ViewState.SIMULATORS]: {
    title: 'Tactical Sim',
    icon: Target,
    sections: [
      { title: 'Practice', items: ['De-escalation simulators and shooting protocols.', 'Decision-making exercises under high-stress conditions.'] }
    ]
  },
  [ViewState.WALLET]: {
    title: 'Credentials',
    icon: Wallet,
    sections: [
      { title: 'Digital ID', items: ['Secure officer identification and duty pass.', 'Authorization tokens for restricted physical zones.'] }
    ]
  },
  [ViewState.TACTICAL_OPS]: {
    title: 'Tactical Planning',
    icon: Crosshair,
    sections: [
      { title: 'Mission', items: ['Coordination hub for SWAT and special operations.', 'Bento-style overview of ongoing high-risk missions.'] }
    ]
  },
  [ViewState.ROGUE_GALLERY]: {
    title: 'Rogue Gallery',
    icon: Users,
    sections: [
      { title: 'POIs', items: ['Database of known fugitives and recurring offenders.', 'AI-matched facial recognition search tools.'] }
    ]
  },
  [ViewState.FORENSICS]: {
    title: 'Forensic Lab',
    icon: Microscope,
    sections: [
      { title: 'Analysis', items: ['AI marker detection for biological and physical evidence.', 'Digitize fingerprints and compare against national databases.'] }
    ]
  }
};

const UserManual: React.FC<UserManualProps> = ({ currentView, isOpen, onClose }) => {
  // Use a safer lookup to avoid crashes if ViewState values mismatch
  const contentKey = String(currentView) as ViewState;
  const content = MANUAL_CONTENT[contentKey];

  // Fallback content if the view is somehow not covered
  const safeContent = content || {
    title: 'Tactical Module',
    icon: Shield,
    sections: [
      { title: 'Overview', items: ['Information for this module is currently restricted.', 'Contact command for operational briefing.'] }
    ]
  };

  const Icon = safeContent.icon || Book;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 inset-y-0 w-full md:w-[450px] bg-slate-950 border-l border-white/10 z-[9999] shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col"
          >
            {/* Header */}
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center border border-cyan-500/30">
                  <Book className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-tech font-bold text-white tracking-widest uppercase">User Manual</h2>
                  <p className="text-[10px] text-cyan-500/70 font-mono tracking-tighter">Buddy Tactical OS v4.2.0</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Icon className="w-8 h-8 text-cyan-400" />
                <div>
                  <h3 className="text-xl font-bold text-white uppercase font-tech tracking-wider">{safeContent.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">Active Module Instructions</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {safeContent.sections.map((section, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-2 text-cyan-500">
                      <HelpCircle className="w-4 h-4" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] font-tech">{section.title}</h4>
                    </div>
                    <ul className="space-y-3">
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex gap-3 text-slate-300 text-sm leading-relaxed mb-2">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0 shadow-[0_0_8px_rgba(8,145,178,0.8)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-tech">Quick Tip</span>
                </div>
                <p className="text-xs text-cyan-100/60 leading-relaxed font-mono italic">
                  Press the SOS button or use voice command "Buddy, request backup" in any critical situation to instantly alert the command center.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-slate-950/50">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] active:scale-95"
              >
                Acknowledge & Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserManual;
