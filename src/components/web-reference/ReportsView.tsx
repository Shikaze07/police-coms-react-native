
import React, { useState, useRef } from 'react';
import { FileText, Save, Plus, Camera, BookOpen, Mic, StopCircle, Loader2, Image as ImageIcon, Users } from 'lucide-react';
import { generateTextResponse, transcribeUserAudio } from './services/geminiService';
import { getFormattedReportTemplate } from './knowledgeBase';
import { EvidenceItem, Officer } from './types';
import { MOCK_OFFICERS } from './constants';

interface ReportsViewProps {
    evidenceList?: EvidenceItem[];
    theme?: 'light' | 'dark';
}

// Helper to convert Blob to Base64 (reused from BuddyChat)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]); 
        } else {
            reject(new Error("Failed to convert blob"));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ReportsView: React.FC<ReportsViewProps> = ({ evidenceList = [], theme = 'dark' }) => {
    const [reportType, setReportType] = useState('SPOT');
    const [narrative, setNarrative] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Voice Dictation State
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    // Selected Evidence for Attachment
    const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
    const [assignedOfficer, setAssignedOfficer] = useState<string>('');

    const generateNarrative = async () => {
        setIsGenerating(true);
        // We specifically ask Officer to use the strict format from its training
        const prompt = `Generate a ${reportType} based on standard PNP format. 
        Context: An incident occurred today at [Location] involving [Subject]. 
        Fill in with placeholder data for a realistic police report example. 
        Strictly follow the format: ${getFormattedReportTemplate(reportType).substring(0, 100)}...`;
        
        const text = await generateTextResponse(prompt, 'gemini-3-pro-preview');
        const cleanedText = text ? text.replace(/\*/g, '') : '';
        setNarrative(cleanedText);
        setIsGenerating(false);
    };

    const loadTemplate = () => {
        setNarrative(getFormattedReportTemplate(reportType));
    };

    // --- Dictation Handlers ---
    const toggleRecording = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setIsTranscribing(true);
                
                try {
                    const base64Audio = await blobToBase64(audioBlob);
                    const text = await transcribeUserAudio(base64Audio);
                    if (text) {
                        setNarrative(prev => {
                            // Append text with a space if needed
                            const spacer = prev && !prev.endsWith('\n') && !prev.endsWith(' ') ? ' ' : '';
                            return prev + spacer + text;
                        });
                    }
                } catch (e) {
                    console.error("Transcription failed", e);
                } finally {
                    setIsTranscribing(false);
                }

                // Cleanup tracks
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleAttachment = (id: string) => {
        setSelectedAttachments(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className={`h-full flex flex-col overflow-hidden ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-slate-200'}`}>


            {/* Main Body - Stacks in Portrait, Split 30/70 in Landscape */}
            <div className="flex-1 flex flex-col landscape:flex-row gap-0 landscape:gap-0 min-h-0 overflow-hidden">
                
                {/* Left Panel: Controls (30% in Landscape) */}
                <div className={`landscape:w-[30%] border-b landscape:border-b-0 landscape:border-r flex flex-col gap-4 p-4 shrink-0 h-auto landscape:h-full landscape:overflow-y-auto ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}>
                    {/* Report Type Selector Group */}
                    <div className={`border rounded p-3 ${theme === 'light' ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-950/50'}`}>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                             <FileText className="w-3 h-3 text-cyan-400" /> Selective Template
                        </h3>
                        <label htmlFor="report-type-select" className="sr-only">Choose Report Type</label>
                        <select 
                            id="report-type-select"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className={`w-full border rounded p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                                theme === 'light' 
                                  ? 'bg-white text-slate-900 border-slate-300' 
                                  : 'bg-slate-900 text-slate-200 border-slate-700'
                            }`}
                        >
                            <option value="SPOT">Spot Report</option>
                            <option value="BLOTTER">Police Blotter Entry</option>
                            <option value="IRF">Incident Record Form</option>
                            <option value="INCIDENT">Incident Report</option>
                            <option value="PROGRESS">Progress Report</option>
                            <option value="FINAL_INV">Final Investigation Report</option>
                            <option value="AOR">After-Operation Report</option>
                            <option value="FR_REPORT">First Responder Report</option>
                            <option value="REFERRAL">Case Referral</option>
                            <option value="RETURN_WARRANT">Return of Warrant</option>
                            <option value="AFFIDAVIT_ARREST">Affidavit of Arrest</option>
                            <option value="AFFIDAVIT_COMPLAINT">Affidavit of Complaint</option>
                            <option value="AFFIDAVIT_WITNESS">Affidavit of Witness</option>
                            <option value="JUDICIAL_AFF">Judicial Affidavit</option>
                            <option value="SWORN_STMT">Sworn Statement</option>
                            <option value="MEMO">Memorandum</option>
                            <option value="RADIO">Radio Message</option>
                            <option value="CRIME_SCENE">Crime Scene Report</option>
                            <option value="TRAFFIC_ACCIDENT">Traffic Accident Report</option>
                        </select>
                        <p className="text-[9px] text-slate-500 mt-2">
                            Select a standard police document format, then load its layout or use AI/dictation to complete it.
                        </p>
                    </div>

                    <div className={`border rounded p-3 ${theme === 'light' ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-950/50'}`}>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                             <Users className="w-3 h-3 text-cyan-400" /> Assign Personnel
                        </h3>
                        <select 
                            value={assignedOfficer}
                            onChange={(e) => setAssignedOfficer(e.target.value)}
                            className={`w-full border rounded p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                                theme === 'light' 
                                  ? 'bg-white text-slate-900 border-slate-300' 
                                  : 'bg-slate-900 text-slate-200 border-slate-700'
                            }`}
                        >
                            <option value="">Unassigned</option>
                            {MOCK_OFFICERS.map(officer => (
                                <option key={officer.id} value={officer.id}>{officer.name} ({officer.badge})</option>
                            ))}
                        </select>
                    </div>

                    <div className={`border rounded p-3 ${theme === 'light' ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-800 bg-slate-950/50'}`}>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Camera className="w-3 h-3" /> Attached Media ({selectedAttachments.length})
                        </h3>
                        
                        <div className="flex gap-2 pb-2 no-scrollbar">
                            <div 
                                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center cursor-pointer transition-all shrink-0"
                                title="Attach New Media"
                            >
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                            
                            <div className={`w-12 h-12 rounded border border-dashed flex items-center justify-center shrink-0 ${theme === 'light' ? 'border-slate-300 bg-slate-50' : 'border-slate-700 bg-slate-900'}`}>
                                <ImageIcon className="w-4 h-4 text-slate-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content (70% in Landscape) */}
                <div className={`landscape:w-[70%] flex flex-col h-full ${theme === 'light' ? 'bg-white' : 'bg-slate-950'}`}>
                     <div className={`flex justify-between items-center p-3 border-b shrink-0 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                        <div className="flex gap-2">
                            <button 
                                onClick={toggleRecording}
                                disabled={isGenerating || isTranscribing}
                                className={`text-[9px] flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all ${
                                    isRecording 
                                    ? 'bg-red-900/50 border-red-500 text-red-200 animate-pulse' 
                                    : theme === 'light'
                                        ? 'border-slate-300 text-slate-700 hover:text-black hover:bg-slate-100 bg-white'
                                        : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 bg-slate-900'
                                }`}
                            >
                                {isRecording ? <StopCircle className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                                {isRecording ? 'Stop' : 'Dictate'}
                            </button>
                            <button 
                                onClick={loadTemplate}
                                className={`text-[9px] flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${
                                    theme === 'light'
                                        ? 'border-slate-300 text-slate-700 hover:text-black hover:bg-slate-100 bg-white'
                                        : 'border-slate-700 text-slate-400 hover:text-white bg-slate-900'
                                }`}
                            >
                                <BookOpen className="w-3 h-3" /> Template
                            </button>
                            <button 
                                onClick={generateNarrative}
                                disabled={isGenerating || isRecording}
                                className={`text-[9px] flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
                                    theme === 'light'
                                        ? 'border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50 bg-blue-50/50'
                                        : 'border-blue-900/50 text-blue-400 hover:text-blue-300 bg-blue-900/10'
                                }`}
                            >
                                <Plus className="w-3 h-3" /> Auto-Fill (AI)
                            </button>
                        </div>
                     </div>
                     
                     <div className="relative flex-1">
                         <textarea 
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            className={`w-full h-full bg-transparent border-none p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap resize-none focus:outline-none ${theme === 'light' ? 'text-slate-950 placeholder:text-slate-400' : 'text-slate-300 placeholder:text-slate-600'}`}
                            placeholder="Load a template or dictate to generate report..."
                         />
                         {isGenerating && (
                            <div className={`absolute bottom-4 left-4 right-4 border p-2 rounded flex items-center gap-2 animate-pulse pointer-events-none ${theme === 'light' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-900/90 border-blue-500/30 text-blue-400'}`}>
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <p className="text-[10px] text-blue-400">OFFICER is drafting the report based on PNP standards...</p>
                            </div>
                         )}
                         {isTranscribing && (
                            <div className={`absolute bottom-4 left-4 right-4 border p-2 rounded flex items-center gap-2 animate-pulse pointer-events-none ${theme === 'light' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-900/90 border-purple-500/30 text-purple-400'}`}>
                                <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
                                <p className="text-[10px] text-purple-400">Transcribing audio...</p>
                            </div>
                         )}
                     </div>

                    <div className={`flex justify-end p-3 border-t shrink-0 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                        <button 
                            onClick={() => {
                                if (assignedOfficer) {
                                    alert(`Finalizing report. Assigned to officer ID: ${assignedOfficer}.`);
                                } else {
                                    alert('Finalizing report. No officer assigned.');
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/50 transition-all active:scale-95"
                        >
                            <Save className="w-3 h-3" /> Finalize & Submit
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportsView;
