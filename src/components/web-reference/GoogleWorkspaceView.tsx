import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Table, Presentation, Folder, Calendar, StickyNote, 
  Search, Plus, Trash, LogOut, LogIn, Loader2, Check, Edit3, 
  Sparkles, RefreshCw, FileWarning, ExternalLink, ShieldAlert,
  ChevronRight, Brain, Send, Save, ArrowLeft, Clock, UserCheck,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { generateTextResponse } from './services/geminiService';

// Module-level cache to persist Google access token and user profile between workspace views/parent renders
let cachedGoogleToken: string | null = null;
let cachedGoogleUser: any = null;

interface GoogleDocItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

// Preset PNP Document Templates to help officers streamline field administrative reporting
const TACTICAL_TEMPLATES = [
  {
    id: 'incident-report',
    title: 'Incident Report',
    description: 'Official document summarizing details of an offense, police call, or security incident.',
    defaultTitle: 'INCIDENT_REPORT_SEC_4',
    content: `DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT
PHILIPPINE NATIONAL POLICE
TACTICAL OPERATIONS AND SECURITY DEPLOYMENT DIVISION

OFFICIAL INCIDENT REPORT
CASE REF ID: INC-2026-N99
DATE OF INCIDENT: ${new Date().toISOString().split('T')[0]}

1. INCIDENT OUTLINE:
   - Location Coordinates: Tacloban Sector District 4 Alpha Grid
   - Incident Type: Unauthorized Tactical Signal Broadcast / Security Interference
   - Status: ACTIVE INVESTIGATION

2. SUSPECT(S) PROFILE:
   - Full Name / Alias: Unknown Person of Interest (POI "Boy Tattoo")
   - Physical Description: Male, approx 5'10", dark tactical wear and boots

3. CORE OBSERVATIONS & NARRATIVE:
   - Patrol Sector 4 observed an unusual assembly of tactical micro-transmitters near the high-voltage substation.
   - Initial BWC footage suggests potential hardware-assisted signal spoofing setup.
   - Physical security perimeters have been successfully deployed.

4. RESPONSE & RECONNAISSANCE ACTION:
   - Unit 01-Knox neutralized interference.
   - Evidence logged into secure physical containment vault.

REPORTING OFFICER: Sgt. John Carter, OIC`
  },
  {
    id: 'witness-statement',
    title: 'Witness Statement',
    description: 'Sworn testimony record of a witness or victim detailing on-scene observations.',
    defaultTitle: 'WITNESS_STATEMENT_CASE_MAIN',
    content: `PHILIPPINE NATIONAL POLICE
INVESTIGATION AND DETECTIVE MANAGEMENT DIVISION

SWORN WITNESS STATEMENT RECORD
DATE OF STATEMENT: ${new Date().toISOString().split('T')[0]}
INVESTIGATING OFFICER: Sgt. John Carter, PNP

I, the undersigned witness, hereby solemnly declare the following facts regarding the incident under investigation:

1. WITNESS INFORMATION:
   - Full Name: Maria Santos
   - Age: 34
   - Occupation: Logistics and Warehouse Operations Supervisor
   - Contact Info: m.santos@local-logistics.ph

2. WITNESS ACCOUNT & TIMELINE:
   - Time of Occurrence: Approx 2245H - 2315H
   - Location: Loading Dock Segment B, Sector 4 Alpha Grid

3. SWORN TESTIMONY:
   "I was completing the end-of-shift inventory audit in the main dock office when I noticed a silver sedan (Plate #ABC-1234) parking with headlights off near the high-voltage substation fence. Two individuals wearing civilian clothing exited the vehicle. One was carrying a flat-pack diagnostic case and an antenna. They stayed near the perimeter gate for 10-15 minutes doing something with the wiring and then drove off quickly when a patrol siren was heard in the distance."

I certify that the above statement is true, accurate, and voluntarily provided.

WITNESS SIGNATURE: _______________________
RECORDED BY: Sgt. John Carter, PNP`
  },
  {
    id: 'arrest-affidavit',
    title: 'Arrest Affidavit',
    description: 'Legal sworn affidavit establishing probable cause for tactical field arrests.',
    defaultTitle: 'ARREST_AFFIDAVIT_PROBABLE_CAUSE',
    content: `REPUBLIC OF THE PHILIPPINES
DEPARTMENT OF JUSTICE
OFFICE OF THE PROSECUTOR

SWORN ARREST AFFIDAVIT
DATE OF ARREST: ${new Date().toISOString().split('T')[0]}

I, Sgt. John Carter, of legal age, Filipino, and an active member of the Philippine National Police, currently assigned to the Tacloban Sector, under oath, declare:

1. BASIS FOR COMMAND:
   - Subject Arrested: POI "Boy Tattoo" / Unknown Male (Ref: FaceMatch DB Entry #504)
   - Date and Time: ${new Date().toISOString().split('T')[0]} at 0130H
   - Geolocation: Boundary Checkpoint 4, Highway Sector 4

2. STATEMENT OF PROBABLE CAUSE:
   The affiant was conducting static tactical surveillance when the target silver sedan (Plate #ABC-1234) approached. Automated license plate matching flagged the vehicle's involvement in a coordinate security interference incident earlier that evening. 
   
   Upon executing a lawful stop-and-inspect procedure, the driver was observed trying to conceal a military-tier multi-sensor signal jammer on the floorboards. The suspect matching physical characteristics of the substation POI was immediately apprehended under secure PNP warrantless arrest guidelines.

3. PHYSICAL EVIDENCE SEIZED:
   - Item Ref: E-WPN-002 | Portable Multi-Sensor Signal Jammer
   - Item Ref: E-VEH-010 | Silver Sedan, Plate #ABC-1234

I declare under penalty of law that the foregoing is true and correct.

AFFIANT/ARRESTING OFFICER: Sgt. John Carter, PNP`
  },
  {
    id: 'intel-assessment',
    title: 'Tactical Intelligence Assessment',
    description: 'High-reliability analysis regarding localized logistics or network nodes.',
    defaultTitle: 'INTEL_ASSESSMENT_LOGISTICS_S4',
    content: `KNOX SECURE INTELLIGENCE CENTER
TACTICAL OPERATIONS PORTAL V3.1

SUBJECT: CLASSIFIED LOGISTICAL CO-DEPENDENCE VECTOR
CONFIDENTIALITY STATUS: CLASSIFIED // SATELLITE DISPATCH

SUMMARY: Link network analysis reports high-frequency late-night distribution vectors intersecting Highway Segment 4. Key coordination hub has been geolocated to a tactical warehouse block.

METRICS & DATA NODES:
- Central Hub Node: Alias "Boy Tattoo"
- Activity Spike times: 0100H - 0300H PST
- Risk Coefficient: HIGH

POLICE STRATEGY ACTIONABLE:
Deploy localized static cover. Maintain active signal telemetry. Synchronize drone and checkpoint camera sensors for immediate License Plate Recognition (LPR).`
  },
  {
    id: 'evidence-manifest',
    title: 'Sovereign Case Evidence Ledger',
    description: 'Immature chain of custody logging for incident items.',
    defaultTitle: 'CASE_EVIDENCE_LEDGER_MAIN',
    content: `POLICE DISTRICT COURT CASE LEDGER
PNP FORENSIC LOGS & CONTROL RECORD

CASE REFERENCE ID: CR-2026-N99
INCIDENT TYPE: SECURITY COUNTERMEASURES

IMMUTABLE LEDGER ENTRIES:
- ITEM ID: E-DOC-001 | 3D Spatial Room Photogrammetry Model | Source: UAV-Drone Mapping
- ITEM ID: E-WPN-002 | Suspect Handheld Multi-sensor Jammer | Source: Foot Patrol Stop Check
- ITEM ID: E-IMG-003 | Body Worn Camera Automated Scan Snap | Source: BWC Operational Stream

CHAIN OF CUSTODY AUTHENTICATION:
All items entered are registered under cryptographic hardware containment vault signatures. Debris, metadata, and timestamps confirmed immutable.`
  }
];

interface GoogleWorkspaceViewProps {
  view: string;
}

const GoogleWorkspaceView: React.FC<GoogleWorkspaceViewProps> = ({ view }) => {
  const [token, setToken] = useState<string | null>(cachedGoogleToken);
  const [googleUser, setGoogleUser] = useState<any>(cachedGoogleUser);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Documents state
  const [docsList, setDocsList] = useState<GoogleDocItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDoc, setActiveDoc] = useState<GoogleDocItem | null>(null);
  const [activeDocContent, setActiveDocContent] = useState<string>('');
  const [docContentLoading, setDocContentLoading] = useState<boolean>(false);
  
  // Editor state
  const [appendToDocText, setAppendToDocText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Creator state
  const [isCreatingDocs, setIsCreatingDocs] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('incident-report');
  const [customDocTitle, setCustomDocTitle] = useState<string>('');
  const [customDocText, setCustomDocText] = useState<string>('');
  
  // AI Analyst state
  const [aiChatInput, setAiChatInput] = useState<string>('');
  const [aiChatLogs, setAiChatLogs] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'TACTICAL INTEL ASSISTANT ONLINE. Please select a document to analyze or write custom audit requests below.' }
  ]);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  
  // Custom delete model confirmation status
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Clear tokens if overall firebase session ends
        cachedGoogleToken = null;
        cachedGoogleUser = null;
        setToken(null);
        setGoogleUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch documents automatically when authenticated
  useEffect(() => {
    if (token && view === 'GOOGLE_DOCS') {
      fetchGoogleDocs();
    }
  }, [token, view]);

  // Load custom template defaults when selections change
  useEffect(() => {
    const template = TACTICAL_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      setCustomDocTitle(template.defaultTitle);
      setCustomDocText(template.content);
    }
  }, [selectedTemplate]);

  const authorizeGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      // Add requested Google Docs and Google Drive scopes
      provider.addScope('https://www.googleapis.com/auth/documents');
      provider.addScope('https://www.googleapis.com/auth/documents.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Authorized successfully but failed to extract the access token payload.');
      }

      // Cache token and user profiles
      cachedGoogleToken = accessToken;
      cachedGoogleUser = {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        uid: result.user.uid
      };

      setToken(accessToken);
      setGoogleUser(cachedGoogleUser);
    } catch (err: any) {
      console.error('Google Workspace Authentication Failed:', err);
      setErrorMsg(err.message || 'Authentication sequence failed. Verify network connection and developer console setups.');
      
      // Fallback demo environment setup if OAuth is blocked by local sandbox limitations
      setupMockEnvironment();
    } finally {
      setLoading(false);
    }
  };

  const setupMockEnvironment = () => {
    console.log("Loading Tactical Offline-First Google Sandbox...");
    const mockToken = "MOCK_SESSION_TOKEN_SATELLITE_LINK_ACTIVE";
    const mockUser = {
      displayName: "Sgt. John Carter (Offline Mode)",
      email: "hq.officer@pnp.gov.ph",
      photoURL: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
      uid: "mock-uid-777"
    };

    cachedGoogleToken = mockToken;
    cachedGoogleUser = mockUser;
    setToken(mockToken);
    setGoogleUser(mockUser);

    // Initial default mock documents
    setDocsList([
      { id: 'mock-doc-1', name: 'SPOT_REPORT_INCIDENT_SEC_4_MOCK', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date().toISOString() },
      { id: 'mock-doc-2', name: 'INTEL_ASSESSMENT_LOGISTICS_S4_MOCK', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date(Date.now() - 3600000).toISOString() },
      { id: 'mock-doc-3', name: 'CASE_EVIDENCE_LEDGER_MAIN_MOCK', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date(Date.now() - 7200000).toISOString() }
    ]);
  };

  const disconnectGoogle = () => {
    cachedGoogleToken = null;
    cachedGoogleUser = null;
    setToken(null);
    setGoogleUser(null);
    setDocsList([]);
    setActiveDoc(null);
    setActiveDocContent('');
  };

  const fetchGoogleDocs = async (queryInput: string = searchQuery) => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);

    // Handle Mock Sandbox scenario
    if (token.startsWith('MOCK_')) {
      setTimeout(() => {
        let list = [
          { id: 'mock-doc-1', name: 'SPOT_REPORT_INCIDENT_SEC_4_MOCK', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date().toISOString() },
          { id: 'mock-doc-2', name: 'INTEL_ASSESSMENT_LOGISTICS_S4_MOCK', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date(Date.now() - 3600000).toISOString() },
          { id: 'mock-doc-3', name: 'CASE_EVIDENCE_LEDGER_MAIN_MOCK', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date(Date.now() - 7200000).toISOString() }
        ];
        if (queryInput) {
          list = list.filter(d => d.name.toLowerCase().includes(queryInput.toLowerCase()));
        }
        setDocsList(list);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      let q = "mimeType='application/vnd.google-apps.document'";
      if (queryInput) {
        // Avoid simple inject formatting errors, escape quotes safely
        const escapedQuery = queryInput.replace(/'/g, "\\'");
        q += ` and name contains '${escapedQuery}'`;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Drive fetch returned status: ${response.status}`);
      }

      const data = await response.json();
      setDocsList(data.files || []);
    } catch (err: any) {
      console.error('Error listing Google Docs:', err);
      setErrorMsg('Failed to browse Google Docs. Downlink communication error or expired token logic.');
    } finally {
      setLoading(false);
    }
  };

  // Extract structured documents content safely using custom walking logic
  const extractTextFromDoc = (docData: any): string => {
    if (!docData || !docData.body || !docData.body.content) return '';
    let extractedText = '';

    const walkElement = (element: any) => {
      if (element.paragraph && element.paragraph.elements) {
        for (const el of element.paragraph.elements) {
          if (el.textRun && el.textRun.content) {
            extractedText += el.textRun.content;
          }
        }
      } else if (element.table && element.table.tableRows) {
        for (const row of element.table.tableRows) {
          if (row.tableCells) {
            for (const cell of row.tableCells) {
              if (cell.content) {
                for (const cellBlock of cell.content) {
                  walkElement(cellBlock);
                }
              }
            }
          }
        }
      }
    };

    for (const block of docData.body.content) {
      walkElement(block);
    }
    return extractedText;
  };

  const inspectDoc = async (docItem: GoogleDocItem) => {
    setActiveDoc(docItem);
    setDocContentLoading(true);
    setErrorMsg(null);
    setActiveDocContent('');
    
    // Clear previous AI chat context except system initializer
    setAiChatLogs([
      { role: 'model', text: `SECURITY ANALYST ONLINE FOR DOCUMENT: "${docItem.name}". Select a quick action command or inquire directly.` }
    ]);

    if (token?.startsWith('MOCK_')) {
      setTimeout(() => {
        const foundTemplate = TACTICAL_TEMPLATES.find(t => docItem.name.includes(t.defaultTitle));
        if (foundTemplate) {
          setActiveDocContent(foundTemplate.content);
        } else {
          setActiveDocContent(`TACTICAL MANUAL EXPORT REPORT:\nID: ${docItem.id}\nFILENAME: ${docItem.name}\nMODIFIED: ${docItem.modifiedTime}\n\nSECURE SYSTEM DATA BLOCK FALLBACK. NO OFFLINE SIMULATION CONFIGURED FOR THIS FILE.`);
        }
        setDocContentLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${docItem.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Google Docs API returned status ${response.status}`);
      }

      const data = await response.json();
      const documentText = extractTextFromDoc(data);
      setActiveDocContent(documentText || 'This document has no readable body text elements.');
    } catch (err: any) {
      console.error('Failed reading doc content:', err);
      setErrorMsg('Failed downloading Google Docs schema. Ensure appropriate access credentials.');
      // Load fallback demo content so user is never stuck in empty state
      setActiveDocContent(`DOCUMENT ACQUISITION COMPROMISED.\n\nRaw metadata info:\n- Document Name: ${docItem.name}\n- API Target Ref: documents/${docItem.id}\n\nPlease verify network rules.`);
    } finally {
      setDocContentLoading(false);
    }
  };

  const createTacticalDoc = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);

    const docName = customDocTitle.trim() || 'TACTICAL_警務INCIDENT';
    const docBody = customDocText;

    if (token.startsWith('MOCK_')) {
      setTimeout(() => {
        const mockNewDoc: GoogleDocItem = {
          id: `mock-doc-${Date.now()}`,
          name: docName,
          mimeType: 'application/vnd.google-apps.document',
          modifiedTime: new Date().toISOString()
        };
        setDocsList(prev => [mockNewDoc, ...prev]);
        setIsCreatingDocs(false);
        setLoading(false);
        setActiveDoc(mockNewDoc);
        setActiveDocContent(docBody);
      }, 800);
      return;
    }

    try {
      // 1. Create the base doc using the Google Docs API
      const response = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: docName
        })
      });

      if (!response.ok) {
        throw new Error(`Create call failed: ${response.statusText}`);
      }

      const docDetails = await response.json();
      const documentId = docDetails.documentId;

      // 2. Populating with initial template content via batchUpdate
      if (docBody.trim()) {
        const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: docBody,
                  location: { index: 1 }
                }
              }
            ]
          })
        });

        if (!updateResponse.ok) {
          console.warn('Failed to insert initial template texts, doc is empty.');
        }
      }

      // Success alerts and list synchronizations
      setIsCreatingDocs(false);
      await fetchGoogleDocs();
      
      const newDocObj: GoogleDocItem = {
        id: documentId,
        name: docName,
        mimeType: 'application/vnd.google-apps.document',
        modifiedTime: new Date().toISOString()
      };
      
      setActiveDoc(newDocObj);
      setActiveDocContent(docBody);
    } catch (err: any) {
      console.error('Error creating Google Document:', err);
      setErrorMsg(err.message || 'Doc creation exception. Check Google API service limitations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppendChanges = async () => {
    if (!token || !activeDoc || !appendToDocText.trim()) return;
    setIsSaving(true);
    setErrorMsg(null);

    const txtToInsert = appendToDocText + '\n';

    if (token.startsWith('MOCK_')) {
      setTimeout(() => {
        setActiveDocContent(prev => prev + '\n' + txtToInsert);
        setAppendToDocText('');
        setIsSaving(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch(`https://docs.googleapis.com/v1/documents/${activeDoc.id}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: txtToInsert,
                endOfSegmentLocation: {}  // Insert text efficiently at the exact end of doc
              }
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Batch update returned status: ${response.status}`);
      }

      setActiveDocContent(prev => prev + '\n' + txtToInsert);
      setAppendToDocText('');
    } catch (err: any) {
      console.error('Failed updating doc:', err);
      setErrorMsg('Failed committing updates back to the sovereign document stream.');
    } finally {
      setIsSaving(false);
    }
  };

  // MANDATORY USER CONFIRMATION OVERLAY FOR DESTRUCTIVE ACTION (MimeType Delete)
  const handleDeleteTrigger = (docItem: GoogleDocItem) => {
    setConfirmDeleteId(docItem.id);
  };

  const executeDeleteDocument = async () => {
    if (!token || !confirmDeleteId) return;
    setLoading(true);
    setErrorMsg(null);

    const fileId = confirmDeleteId;
    setConfirmDeleteId(null); // Clear trigger

    if (token.startsWith('MOCK_')) {
      setTimeout(() => {
        setDocsList(prev => prev.filter(d => d.id !== fileId));
        if (activeDoc?.id === fileId) {
          setActiveDoc(null);
          setActiveDocContent('');
        }
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Drive delete returned status: ${response.status}`);
      }

      setDocsList(prev => prev.filter(d => d.id !== fileId));
      if (activeDoc?.id === fileId) {
        setActiveDoc(null);
        setActiveDocContent('');
      }
    } catch (err: any) {
      console.error('Failed to delete user document:', err);
      setErrorMsg('Failed deleting requested document file from GDrive. Check permissions.');
    } finally {
      setLoading(false);
    }
  };

  // GEMINI AI INTEGRATIONS (COGNITIVE TACTICAL ANALYST ON DOCUMENT BODY)
  const handleAISmartRequest = async (analysisType: 'SUMMARIZE' | 'COMPLIANCE' | 'EXTRACT') => {
    if (!activeDocContent) return;
    setAiAnalyzing(true);
    
    let promptCommand = '';
    if (analysisType === 'SUMMARIZE') {
      promptCommand = `Analyze and summarize the following tactical text file using precise operational brief outlines. Return key actions and risk ratings:\n\n${activeDocContent}`;
    } else if (analysisType === 'COMPLIANCE') {
      promptCommand = `Review this report against the PNP Standard Operating Procedures criteria (maintain tactical distance, activate body camera BWC, report coords first, preserve chain-of-custody). State violations or score compliance:\n\n${activeDocContent}`;
    } else if (analysisType === 'EXTRACT') {
      promptCommand = `Scan the following document text and extract any mentioned suspects, aliases, vehicle license plates, geolocation coordinates, and evidentiary items. Return the results in an easy-to-read list:\n\n${activeDocContent}`;
    }

    setAiChatLogs(prev => [...prev, { role: 'user', text: `Execute AI: ${analysisType}` }]);

    try {
      const aiResponse = await generateTextResponse(promptCommand);
      setAiChatLogs(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (err) {
      console.error('Gemini call failed:', err);
      setAiChatLogs(prev => [...prev, { role: 'model', text: `ERROR: Satellite telemetry lost. Unable to run remote Gemini Analysis.` }]);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const submitCustomAIChatMsg = async () => {
    if (!aiChatInput.trim() || !activeDocContent) return;
    const msg = aiChatInput;
    setAiChatInput('');
    setAiAnalyzing(true);

    setAiChatLogs(prev => [...prev, { role: 'user', text: msg }]);

    const fullContextPrompt = `You are the POLICECOMS AI tactical supervisor. You are analyzing the document titled "${activeDoc?.name}".
Here is the document contents:
----START DOCUMENT----
${activeDocContent}
----END DOCUMENT----

An officer asks: "${msg}"
Provide a brief, tactical, direct intelligence evaluation. Max 150 words.`;

    try {
      const aiResponse = await generateTextResponse(fullContextPrompt);
      setAiChatLogs(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (err) {
      setAiChatLogs(prev => [...prev, { role: 'model', text: 'Error connecting to PNP Sovereign AI Cluster. Retry coordinate dispatch.' }]);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const getToolDisplayName = () => {
    switch (view) {
      case 'GOOGLE_DOCS': return 'Google Docs Workspace';
      case 'GOOGLE_SHEETS': return 'Google Sheets Workspace';
      case 'GOOGLE_SLIDES': return 'Google Slides Workspace';
      case 'GOOGLE_DRIVE': return 'Google Drive File Vault';
      case 'GOOGLE_CALENDAR': return 'Google Dispatch Calendar';
      case 'GOOGLE_KEEP': return 'Sovereign Case Keep';
      default: return 'Google Workspace Tools';
    }
  };

  // Render non-docs as a premium connected portal screen (focus on DOCTS request)
  if (view !== 'GOOGLE_DOCS') {
    return (
      <div className="h-full w-full p-4 md:p-6 bg-slate-950 text-slate-200 overflow-y-auto flex flex-col justify-between">
        <div className="glass p-6 md:p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center max-w-xl mx-auto my-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400">
            {view === 'GOOGLE_SHEETS' && <Table className="w-8 h-8" />}
            {view === 'GOOGLE_SLIDES' && <Presentation className="w-8 h-8" />}
            {view === 'GOOGLE_DRIVE' && <Folder className="w-8 h-8" />}
            {view === 'GOOGLE_CALENDAR' && <Calendar className="w-8 h-8" />}
            {view === 'GOOGLE_KEEP' && <StickyNote className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold font-tech uppercase tracking-wider text-white mb-2">{getToolDisplayName()}</h2>
          <p className="text-xs font-mono text-cyan-400/80 mb-6 uppercase tracking-widest">Sovereign Encryption Node</p>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Secure tactical integrations for {getToolDisplayName()} are fully configured. Authorization scopes are cryptographically bound to the PNP silicon chip layer.
          </p>

          {token ? (
            <div className="space-y-4 w-full">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center gap-3 text-left">
                {googleUser?.photoURL ? (
                  <img src={googleUser.photoURL} alt="Google AV" className="w-8 h-8 rounded-full border border-cyan-500/40" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-800 text-xs flex items-center justify-center font-bold">PNP</div>
                )}
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{googleUser?.displayName}</div>
                  <div className="text-[10px] font-mono text-cyan-400/80 leading-tight">{googleUser?.email}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.open('https://workspace.google.com', '_blank')}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-tech text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Launch Terminal Portal
                </button>
                <button 
                  onClick={disconnectGoogle}
                  className="px-4 py-2.5 bg-slate-900 border border-red-500/30 hover:border-red-500/50 text-red-400 font-bold font-tech text-xs uppercase rounded-xl transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={authorizeGoogle}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-tech tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <LogIn className="w-4 h-4" /> Authenticate Google Link
            </button>
          )}
        </div>
      </div>
    );
  }

  // Google Docs Workspace layout view
  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-sans">
      {/* Header bar */}
      <div className="p-4 bg-slate-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-tech text-white uppercase tracking-wider">TACTICAL CASE DOCUMENTS</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">SOVEREIGN SATELLITE LINKS: ONLINE</span>
            </div>
          </div>
        </div>

        {/* Auth details & sign in */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 pr-3 rounded-2xl border border-white/5">
              {googleUser?.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt="Auth User Avatar" 
                  className="w-7 h-7 rounded-full border border-cyan-500/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-400/30 flex items-center justify-center font-tech font-bold text-xs text-cyan-400 uppercase">
                  {googleUser?.displayName?.charAt(0) || 'P'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-[10px] font-bold text-white leading-tight font-tech">{googleUser?.displayName}</div>
                <div className="text-[9px] font-mono text-cyan-400/80 leading-tight">{googleUser?.email}</div>
              </div>
              <button 
                onClick={disconnectGoogle}
                title="Disconnect Account Link"
                className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                id="gwork-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={authorizeGoogle}
              className="gsi-material-button text-xs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#cbd5e1',
                color: '#1e293b',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              id="gwork-login-btn"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '16px', height: '16px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>CONNECT GOOGLE SUITE</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-red-950/20 border-b border-red-500/20 flex items-center gap-2 text-xs text-red-300 font-mono shrink-0">
          <FileWarning className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Container Workspace */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col md:flex-row relative">
        {!token ? (
          /* Empty Unauth State rendering */
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="max-w-md glass p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 font-tech flex items-center justify-center mx-auto text-cyan-400 relative">
                <FileText className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-tech uppercase text-white tracking-widest">SOVEREIGN WORKSPACE LOCK</h3>
                <p className="text-xs text-cyan-400/60 font-mono uppercase tracking-widest">SOCIETY CLOUD DATA COMPLIANCE</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your secure Google Account below to browse, edit, and formulate Philippine National Police standard reports directly onto Google Docs cloud servers with military-tier device signatures.
              </p>
              
              <button 
                onClick={authorizeGoogle}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-tech tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <LogIn className="w-4 h-4" /> AUTHORIZE SATELLITE ENTRY
              </button>

              <button 
                onClick={setupMockEnvironment}
                className="text-[10px] font-mono text-cyan-400 hover:underline block mx-auto py-1"
              >
                * OVERRIDE SYSTEM GATEWAY (OFFLINE PATROL BLOCK)
              </button>
            </div>
          </div>
        ) : (
          /* Document Dashboard + Working workstation space */
          <>
            {/* Left Hand: Docs Explorer Section */}
            <div className={`w-full md:w-80 border-r border-white/5 flex flex-col transition-all duration-300 shrink-0 ${activeDoc ? 'hidden md:flex' : 'flex'}`}>
              
              {/* Search & Actions strip */}
              <div className="p-3 bg-slate-900/20 border-b border-white/5 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search PNP Case Files..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchGoogleDocs(e.target.value);
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950/60 border border-white/5 rounded-xl text-xs text-slate-100 placeholder-slate-500 font-mono focus:border-cyan-500/50 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingDocs(true);
                      setActiveDoc(null);
                    }}
                    className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-tech text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                    id="gwork-new-doc-btn"
                  >
                    <Plus className="w-3.5 h-3.5" /> NEW CASE REPORT
                  </button>
                  <button
                    onClick={() => fetchGoogleDocs()}
                    disabled={loading}
                    className="px-2.5 py-1.5 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Document List and Loaders */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {loading && docsList.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Acquiring Files index...</span>
                  </div>
                ) : docsList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-1">
                    <p>No PNP case reports mapped.</p>
                    <button 
                      onClick={() => setIsCreatingDocs(true)} 
                      className="text-cyan-400 underline text-[10px] hover:text-cyan-300"
                    >
                      Draft immediate report
                    </button>
                  </div>
                ) : (
                  docsList.map((docItem) => {
                    const isActive = activeDoc?.id === docItem.id;
                    return (
                      <div
                        key={docItem.id}
                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                            : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/80 hover:border-cyan-500/20'
                        }`}
                        onClick={() => {
                          setIsCreatingDocs(false);
                          inspectDoc(docItem);
                        }}
                      >
                        <div className="flex items-start gap-2.5 pr-6">
                          <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate leading-snug">
                              {docItem.name}
                            </h4>
                            <p className="text-[9px] font-mono text-slate-500 leading-tight mt-0.5">
                              {docItem.modifiedTime 
                                ? new Date(docItem.modifiedTime).toLocaleDateString() 
                                : 'Offline Cache'}
                            </p>
                          </div>
                        </div>

                        {/* Deletion tool with confirmation trigger */}
                        <div className="absolute right-2.5 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrigger(docItem);
                            }}
                            className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                            title="Delete Document"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Hand: Workspace workspace layout area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
              <AnimatePresence mode="wait">
                {/* 1. DOCUMENT CREATOR AREA */}
                {isCreatingDocs && (
                  <motion.div
                    key="creator-editor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-bold font-tech uppercase text-white tracking-widest">PNP Case Document Formatter</h3>
                      </div>
                      <button
                        onClick={() => setIsCreatingDocs(false)}
                        className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Template select */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Select Bureau SOP Format</label>
                          <div className="space-y-2">
                            {TACTICAL_TEMPLATES.map((tmpl) => (
                              <div
                                key={tmpl.id}
                                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                                  selectedTemplate === tmpl.id
                                    ? 'bg-cyan-950/20 border-cyan-500/30'
                                    : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/80 hover:border-cyan-500/10'
                                }`}
                                onClick={() => setSelectedTemplate(tmpl.id)}
                              >
                                <h5 className="text-xs font-bold text-white select-none">{tmpl.title}</h5>
                                <p className="text-[10px] text-slate-400 select-none mt-1 leading-snug">{tmpl.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Title & Content form */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Document Title (Automatic Identifier)</label>
                          <input
                            type="text"
                            value={customDocTitle}
                            onChange={(e) => setCustomDocTitle(e.target.value)}
                            placeholder="e.g. SPOT_REPORT_SEC_4"
                            className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-500/50"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Document Text (Tactical Body Details)</label>
                          <textarea
                            value={customDocText}
                            onChange={(e) => setCustomDocText(e.target.value)}
                            rows={12}
                            placeholder="Enter case telemetry..."
                            className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-4 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={createTacticalDoc}
                            disabled={loading || !customDocTitle.trim()}
                            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold font-tech text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Create & Upload to Drive
                          </button>
                          <button
                            onClick={() => setIsCreatingDocs(false)}
                            className="px-6 py-3 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 font-bold font-tech text-xs uppercase rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. ACTIVE FILE INSPECTOR WORKSTATION OVERLAY */}
                {activeDoc && !isCreatingDocs && (
                  <motion.div
                    key="active-inspector"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex-1 flex flex-col md:flex-row overflow-hidden h-full min-h-0"
                  >
                    {/* Left Panel: Active Content Reader and Editor */}
                    <div className="flex-1 border-r border-white/5 flex flex-col min-w-0">
                      <div className="p-4 bg-slate-900/20 border-b border-white/5 flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => setActiveDoc(null)}
                            className="md:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-white truncate font-tech leading-tight">{activeDoc.name}</h3>
                            <p className="text-[8px] font-mono text-cyan-400/60 truncate leading-tight mt-0.5">FILE REF: {activeDoc.id}</p>
                          </div>
                        </div>

                        {/* Download link or launcher */}
                        {activeDoc.webViewLink && (
                          <a 
                            href={activeDoc.webViewLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-[10px] font-mono text-slate-300 hover:text-cyan-400 flex items-center gap-1 shrink-0 transition-colors"
                          >
                            Open raw <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Doc content reader */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {docContentLoading ? (
                          <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-2">
                            <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                            <span className="text-xs font-mono uppercase tracking-widest">Downloading Secure Block content...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/40 shadow-inner max-w-full">
                              <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">SECURE READER OUTLINE</h4>
                              <pre className="text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-text text-left">
                                {activeDocContent}
                              </pre>
                            </div>

                            {/* Append Text box panel */}
                            <div className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl text-left space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>APPEND TELEMETRY UPDATE</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[9px] font-mono text-slate-500 uppercase">LOAD FORM:</span>
                                  {TACTICAL_TEMPLATES.map((tmpl) => (
                                    <button
                                      key={tmpl.id}
                                      onClick={() => setAppendToDocText(tmpl.content)}
                                      className="px-2 py-0.5 bg-slate-950 hover:bg-cyan-950 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 hover:text-cyan-300 rounded transition-colors"
                                      title={`Load ${tmpl.title} template`}
                                    >
                                      {tmpl.title}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                value={appendToDocText}
                                onChange={(e) => setAppendToDocText(e.target.value)}
                                rows={8}
                                placeholder="Write additional field notes or event updates list here. Click Commit to update Google Doc..."
                                className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-cyan-500/40 resize-none leading-relaxed"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={handleAppendChanges}
                                  disabled={isSaving || !appendToDocText.trim()}
                                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold font-tech text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                >
                                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  Commit Update
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Integrated Tactical AI workspace (Gemini powered) */}
                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 flex flex-col shrink-0 h-64 md:h-full">
                      {/* Section header */}
                      <div className="p-3 bg-slate-900/30 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">TACTICAL INTEL AI ASSIST</h4>
                        </div>
                        {aiAnalyzing && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />}
                      </div>

                      {/* Presets and quick analyst cues */}
                      <div className="p-2 border-b border-white/5 grid grid-cols-3 gap-1 shrink-0">
                        <button
                          onClick={() => handleAISmartRequest('SUMMARIZE')}
                          disabled={aiAnalyzing || !activeDocContent}
                          className="py-1 bg-slate-900 hover:bg-cyan-950/30 border border-cyan-500/10 rounded text-[9px] font-mono font-bold text-cyan-400 uppercase transition-all disabled:opacity-50"
                        >
                          Summarize
                        </button>
                        <button
                          onClick={() => handleAISmartRequest('COMPLIANCE')}
                          disabled={aiAnalyzing || !activeDocContent}
                          className="py-1 bg-slate-900 hover:bg-cyan-950/30 border border-cyan-500/10 rounded text-[9px] font-mono font-bold text-cyan-400 uppercase transition-all disabled:opacity-50"
                        >
                          SOP Check
                        </button>
                        <button
                          onClick={() => handleAISmartRequest('EXTRACT')}
                          disabled={aiAnalyzing || !activeDocContent}
                          className="py-1 bg-slate-900 hover:bg-cyan-950/30 border border-cyan-500/10 rounded text-[9px] font-mono font-bold text-cyan-400 uppercase transition-all disabled:opacity-50"
                        >
                          Extract
                        </button>
                      </div>

                      {/* Chat messages */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-950/20 text-left">
                        {aiChatLogs.map((chat, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-xl border max-w-[90%] text-left whitespace-pre-wrap text-[10px] font-mono leading-normal ${
                              chat.role === 'user' 
                                ? 'ml-auto bg-cyan-950/10 border-cyan-500/20 text-cyan-100' 
                                : 'mr-auto bg-slate-900/60 border-white/5 text-slate-300'
                            }`}
                          >
                            <span className="font-bold block uppercase mb-1 border-b border-white/5 pb-0.5 text-[8px] text-cyan-400/80">
                              {chat.role === 'user' ? 'OFFICER' : 'COGNITIVE INTEL'}
                            </span>
                            {chat.text}
                          </div>
                        ))}
                      </div>

                      {/* Interactive prompt form */}
                      <div className="p-2 border-t border-white/5 bg-slate-950 shrink-0 flex gap-1.5">
                        <input
                          type="text"
                          value={aiChatInput}
                          onChange={(e) => setAiChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitCustomAIChatMsg(); }}
                          disabled={aiAnalyzing || !activeDocContent}
                          placeholder="Inquire about document details..."
                          className="flex-1 bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-mono text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500/50 disabled:opacity-50"
                        />
                        <button
                          onClick={submitCustomAIChatMsg}
                          disabled={aiAnalyzing || !aiChatInput.trim() || !activeDocContent}
                          className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg transition-colors flex items-center justify-center disabled:bg-slate-800 disabled:text-slate-500"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. WELCOME AREA BEFORE ANY DOCUMENT PREVIEW IS MOUNTED */}
                {!activeDoc && !isCreatingDocs && (
                  <motion.div
                    key="unselected-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="max-w-sm space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                        <FileText className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold font-tech uppercase text-white tracking-widest">Tactical Document Terminal</h4>
                        <p className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider">Acquisition and AI Processing Center</p>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mx-auto">
                        Select an existing Google Doc case report from the sidebar directory, or initialize a clean incident reporting format from standard templates.
                      </p>
                      
                      <button
                        onClick={() => setIsCreatingDocs(true)}
                        className="py-2.5 px-5 bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-950/20 text-xs font-bold font-tech tracking-wider uppercase rounded-xl transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Create Incident Document
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* MANDATORY USER WARNING DIALOG OVERLAY (Google Workspace deletion warning) */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full text-left space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-8 h-8 shrink-0 text-red-500 animate-bounce" />
                <div>
                  <h4 className="text-sm font-bold font-tech uppercase text-white tracking-wider">MUTATIVE ACTIONS ALERT!</h4>
                  <p className="text-[9px] font-mono text-red-400 uppercase tracking-widest">Sovereign Cloud Directive</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-300 leading-normal">
                  You are about to execute a **DESTRUCTIVE TERMINATION** command on GDrive.
                </p>
                <div className="p-3 bg-red-950/20 rounded-xl border border-red-500/15">
                  <p className="text-[10px] font-mono text-red-300 break-all leading-normal">
                    Target File ID: {confirmDeleteId}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Note: Deleting this Google Document is irreversible and immediately propagates across sovereign Google accounts.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={executeDeleteDocument}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold font-tech text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg"
                  id="gwork-confirm-delete-btn"
                >
                  DESTRUCTIVE PURGE
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-tech text-xs uppercase rounded-xl transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleWorkspaceView;
