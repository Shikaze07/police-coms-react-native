import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, ArrowRightLeft, Volume2, Copy, X, Send, Loader2, Sparkles, Languages, Activity, History, ChevronDown, ChevronRight, Zap, Globe, Trash2 } from 'lucide-react';
import { generateTextResponse, transcribeUserAudio, generateSpeech } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES = [
    { code: 'English', label: 'English' },
    { code: 'Tagalog', label: 'Tagalog' },
    { code: 'Spanish', label: 'Spanish' },
    { code: 'Mandarin', label: 'Chinese' },
    { code: 'Japanese', label: 'Japanese' },
    { code: 'Arabic', label: 'Arabic' },
    { code: 'French', label: 'French' },
    { code: 'Korean', label: 'Korean' },
    { code: 'Russian', label: 'Russian' },
    { code: 'Hindi', label: 'Hindi' },
];

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to convert"));
            }
        };
        reader.readAsDataURL(blob);
    });
};

interface TranslationHistory {
    id: string;
    source: string;
    target: string;
    sourceText: string;
    translatedText: string;
    timestamp: number;
}

const TranslatorView: React.FC = () => {
    const [sourceLang, setSourceLang] = useState('English');
    const [targetLang, setTargetLang] = useState('Tagalog');
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    
    const [isRecording, setIsRecording] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<'source' | 'target' | null>(null);
    const [history, setHistory] = useState<TranslationHistory[]>([]);
    const [listeningLevel, setListeningLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const debounceRef = useRef<any>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Swap Languages
    const handleSwap = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setInputText(translatedText);
        setTranslatedText(inputText);
    };

    // Translation Logic
    const performTranslation = async (text: string) => {
        if (!text.trim()) {
            setTranslatedText('');
            return;
        }
        
        setIsTranslating(true);
        try {
            const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Return ONLY the translated text without quotes or explanations. Text: "${text}"`;
            const result = await generateTextResponse(prompt);
            setTranslatedText(result);
            
            // Add to history
            if (result && result !== translatedText) {
                const newEntry: TranslationHistory = {
                    id: Date.now().toString(),
                    source: sourceLang,
                    target: targetLang,
                    sourceText: text,
                    translatedText: result,
                    timestamp: Date.now(),
                };
                setHistory(prev => [newEntry, ...prev].slice(0, 50));
            }
        } catch (error) {
            console.error("Translation error", error);
        } finally {
            setIsTranslating(false);
        }
    };

    // Auto-translate on typing (debounced)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (inputText) {
            debounceRef.current = setTimeout(() => {
                performTranslation(inputText);
            }, 1000); // 1s delay
        }
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [inputText]);

    // Audio Playback
    const playAudioData = async (base64Audio: string) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            const int16Data = new Int16Array(bytes.buffer);
            const float32Data = new Float32Array(int16Data.length);
            for (let i=0; i<int16Data.length; i++) float32Data[i] = int16Data[i] / 32768.0;
            const buffer = ctx.createBuffer(1, float32Data.length, 24000);
            buffer.copyToChannel(float32Data, 0);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setIsSpeaking(null);
            source.start();
        } catch (e) { 
            console.error(e); 
            setIsSpeaking(null);
        }
    };

    const handleSpeak = async (text: string, type: 'source' | 'target') => {
        if (!text || isSpeaking) return;
        setIsSpeaking(type);
        try {
            const audio = await generateSpeech(text); 
            if (audio) await playAudioData(audio);
            else setIsSpeaking(null);
        } catch (e) {
            setIsSpeaking(null);
        }
    };

    // Recording Logic with Visualization
    const startVisualizer = (stream: MediaStream) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setListeningLevel(average / 128); // Normalize 0-1
            animationFrameRef.current = requestAnimationFrame(update);
        };
        update();
    };

    const handleRecord = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setListeningLevel(0);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            startVisualizer(stream);

            recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const base64 = await blobToBase64(blob);

                setIsTranslating(true);
                const text = await transcribeUserAudio(base64);
                if (text) {
                    setInputText(text);
                    performTranslation(text);
                } else {
                    setIsTranslating(false);
                }
                
                stream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Mic error", e);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(err => {
            console.error("Clipboard write failed:", err);
        });
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return (
        <div className="h-full bg-[#020617] flex flex-col font-sans overflow-hidden text-slate-200">
            {/* Header: Tactical Branding */}
            <header className="min-h-16 h-auto bg-slate-900/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 py-2 shrink-0 z-20 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <div className="absolute -inset-1 bg-blue-500/20 blur-sm rounded-full animate-pulse"></div>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white truncate">Neural Translator</h2>
                        <p className="text-[8px] text-slate-500 font-mono tracking-wider truncate">BABEL_ENGINE_v4.5</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-slate-400">
                        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span>LATENCY: 18ms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span>NEURAL LOAD: 12%</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Language Selection Bar */}
            <div className="bg-slate-900 border-b border-white/5 flex items-center justify-center p-3 gap-8 shadow-inner relative z-10">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select 
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider text-blue-400 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none pr-8"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.label}>{l.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors pointer-events-none" />
                    </div>

                    <button 
                        onClick={handleSwap} 
                        className="p-2.5 bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-blue-500 transition-all active:scale-90"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                    </button>

                    <div className="relative group">
                        <select 
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider text-blue-400 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none pr-8"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.label}>{l.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Main Interactive Surface */}
            <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden">
                
                {/* SOURCE INTERFACE */}
                <div className="flex-1 flex flex-col bg-slate-900/30 p-8 relative">
                    <div className="absolute top-4 left-8 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Input Terminal</span>
                    </div>
                    
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type or speak to translate..."
                        className="w-full flex-1 bg-transparent text-white text-3xl font-medium resize-none focus:outline-none placeholder:text-slate-800 custom-scrollbar mt-6 leading-tight"
                    />
                    
                    <div className="flex justify-between items-center mt-6">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSpeak(inputText, 'source')}
                                className={`p-3 rounded-xl border transition-all ${isSpeaking === 'source' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-blue-500'}`}
                                disabled={!inputText}
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                            {inputText && (
                                <button onClick={() => { setInputText(''); setTranslatedText(''); }} className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600 tracking-widest uppercase">CHARS: {inputText.length}/1000</div>
                    </div>
                </div>

                {/* TARGET INTERFACE */}
                <div className="flex-1 flex flex-col bg-black/40 p-8 relative">
                    <div className="absolute top-4 left-8 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Neural Output</span>
                    </div>
                    
                    <div className="flex-1 mt-6">
                        {isTranslating ? (
                            <div className="flex items-center gap-3 text-blue-400/60 font-mono text-lg animate-pulse">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="tracking-[0.2em] uppercase text-sm">Synthesizing...</span>
                            </div>
                        ) : (
                            <div className={`text-3xl text-blue-100 font-medium leading-tight whitespace-pre-wrap transition-opacity duration-300 ${!translatedText ? 'opacity-20 italic font-light' : 'opacity-100'}`}>
                                {translatedText || "Awaiting target projection..."}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSpeak(translatedText, 'target')}
                                className={`p-3 rounded-xl border transition-all ${isSpeaking === 'target' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-blue-400 hover:border-blue-500/50'}`}
                                disabled={!translatedText}
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => copyToClipboard(translatedText)}
                                className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
                                disabled={!translatedText}
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 tracking-widest uppercase">
                            MODALITY: TEXT_OBJ
                        </div>
                    </div>
                </div>

                {/* SIDEBAR: History & Settings */}
                <aside className="w-full md:w-80 bg-slate-900 border-l border-white/10 flex flex-col shrink-0 overflow-hidden shadow-2xl z-20">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-b from-slate-800/50 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <History className="w-4 h-4 text-slate-400" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Transaction Log</h2>
                        </div>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-[9px] text-slate-600 hover:text-red-400 uppercase font-black transition-colors flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        <AnimatePresence initial={false}>
                            {history.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-700 opacity-40">
                                    <Globe className="w-8 h-8 mb-4 stroke-[1]" />
                                    <span className="text-[10px] font-mono tracking-widest uppercase text-center px-8">No local translation data available</span>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group"
                                        onClick={() => { setInputText(item.sourceText); setTranslatedText(item.translatedText); }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-mono text-blue-500 uppercase">{item.source}</span>
                                                <ChevronRight className="w-2 h-2 text-slate-600" />
                                                <span className="text-[8px] font-mono text-slate-300 uppercase">{item.target}</span>
                                            </div>
                                            <span className="text-[8px] text-slate-600 font-mono uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 line-clamp-1 mb-1 italic group-hover:text-slate-300 transition-colors">"{item.sourceText}"</p>
                                        <p className="text-[11px] text-blue-100 line-clamp-2 font-medium">"{item.translatedText}"</p>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </aside>
            </div>

            {/* Central Tactical Mic Button */}
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 md:bottom-12 z-30">
                <div className="relative">
                    {/* Pulsing Visualizers */}
                    {isRecording && (
                        <>
                            <div 
                                className="absolute -inset-8 rounded-full border border-blue-500/20 animate-ping opacity-75"
                                style={{ transform: `scale(${1 + listeningLevel * 0.5})` }}
                            ></div>
                            <div 
                                className="absolute -inset-16 rounded-full border border-blue-500/10 animate-ping opacity-40"
                                style={{ animationDelay: '0.5s', transform: `scale(${1 + listeningLevel * 0.8})` }}
                            ></div>
                        </>
                    )}
                    
                    <button
                        onClick={handleRecord}
                        className={`group relative w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all transform hover:scale-110 active:scale-95 z-10 ${
                            isRecording 
                            ? 'bg-red-600 ring-8 ring-red-900/30' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10 rounded-full"></div>
                        {isRecording ? <StopCircle className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10" />}
                        
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                {isRecording ? 'ACTIVE_LISTENING' : 'DEPLOY_MIC'}
                            </span>
                        </div>
                    </button>
                    
                    {/* Visual Audio Bars on sides of the button when recording */}
                    {isRecording && (
                        <div className="absolute top-1/2 -translate-y-1/2 -left-20 flex items-end gap-1 h-12">
                            {[0.2, 0.5, 0.8, 0.4, 0.9, 0.3].map((h, i) => (
                                <div 
                                    key={i} 
                                    className="w-1 bg-blue-500/40 rounded-full transition-all duration-75" 
                                    style={{ height: `${Math.max(10, h * listeningLevel * 100)}%` }}
                                ></div>
                            ))}
                        </div>
                    )}
                    {isRecording && (
                        <div className="absolute top-1/2 -translate-y-1/2 -right-20 flex items-end gap-1 h-12">
                            {[0.3, 0.9, 0.4, 0.8, 0.5, 0.2].map((h, i) => (
                                <div 
                                    key={i} 
                                    className="w-1 bg-blue-500/40 rounded-full transition-all duration-75" 
                                    style={{ height: `${Math.max(10, h * listeningLevel * 100)}%` }}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* HUD Status Bar */}
            <div className="h-8 bg-black/80 flex items-center justify-center px-4 border-t border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{isRecording ? 'SYSTEM_LISTENING' : 'SYSTEM_READY'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslatorView;
