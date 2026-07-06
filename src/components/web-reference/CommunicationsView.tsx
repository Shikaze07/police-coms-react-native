
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Image as ImageIcon, Paperclip, Users, Radio, Play, Pause, MoreVertical, Search, Volume2, FileText, Loader2, Captions, MessageSquare, Phone, Video, Check, CheckCheck, Menu, X, Signal, File, Download, Shield, Plus, Trash2, BellRing, Lock, ShieldAlert, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { HelpOverlay } from './HelpOverlay';
import { ViewState } from './types';
import { transcribeUserAudio } from './services/geminiService';
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';

// --- PROPS ---
interface CommunicationsViewProps {
    currentUser: User;
    initialRecipient?: string | null;
    forcedMode?: CommMode;
}

// --- TYPES ---
type CommMode = 'RADIO' | 'MESSAGING';

interface Channel {
    id: string;
    name: string;
    members: number;
    status: 'ACTIVE' | 'IDLE' | 'OFFLINE';
    frequency: string;
    type: 'RADIO';
    isSecure?: boolean;
}

interface ChatContact {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    type: 'CHAT';
}

interface CommMessage {
    id: string;
    sender: string;
    senderId: string;
    type: 'AUDIO' | 'TEXT' | 'IMAGE' | 'FILE';
    content: string; // Text content or Base64/Blob URL
    fileName?: string;
    fileSize?: string;
    timestamp: Date;
    duration?: number; // For audio
    played?: boolean;
    transcription?: string;
    isTranscribing?: boolean;
    showTranscription?: boolean;
    readReceipt?: 'SENT' | 'DELIVERED' | 'READ'; // For messaging
}

// --- MOCK DATA ---
const MOCK_CHANNELS: Channel[] = [
    { id: '1', name: 'Alpha Team (Tactical)', members: 4, status: 'ACTIVE', frequency: '462.5625', type: 'RADIO', isSecure: true },
    { id: '2', name: 'Command Center', members: 12, status: 'IDLE', frequency: '462.6125', type: 'RADIO', isSecure: true },
    { id: '3', name: 'Traffic Enforcers', members: 8, status: 'IDLE', frequency: '462.6625', type: 'RADIO' },
    { id: '4', name: 'District 1 All-Call', members: 45, status: 'OFFLINE', frequency: '467.5625', type: 'RADIO' },
];

const MOCK_CHATS: ChatContact[] = [
    { id: 'c1', name: 'Sovereign Command Center', avatar: 'https://ui-avatars.com/api/?name=Sovereign+Command&background=0f172a&color=22d3ee', lastMessage: 'System online.', time: 'NOW', unread: 0, status: 'ONLINE', type: 'CHAT' }
];

const MOCK_MESSAGES: CommMessage[] = [
    { id: 'm1', sender: 'Sovereign Dispatch', senderId: 'dispatch', type: 'TEXT', content: 'Secure tactical datalink established.', timestamp: new Date(), readReceipt: 'READ' }
];

// Helper to convert Blob to Base64
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

const CommunicationsView: React.FC<CommunicationsViewProps> = ({ currentUser, initialRecipient, forcedMode }) => {
    const mode = forcedMode || (initialRecipient ? 'MESSAGING' : 'RADIO');
    
    // Data State
    const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
    const [chats, setChats] = useState<ChatContact[]>(MOCK_CHATS);
    const [activeChannel, setActiveChannel] = useState<Channel>(MOCK_CHANNELS[0]);
    const [activeChat, setActiveChat] = useState<ChatContact>(() => {
        if (initialRecipient) {
            const foundChat = MOCK_CHATS.find(c => c.name.toLowerCase().includes(initialRecipient.toLowerCase()));
            if (foundChat) return foundChat;
        }
        return MOCK_CHATS[0];
    });
    const [messages, setMessages] = useState<CommMessage[]>(MOCK_MESSAGES);
    
    // UI State
    const [isPTTActive, setIsPTTActive] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [pttPosition, setPttPosition] = useState<'left' | 'right'>('right');
    const [inputText, setInputText] = useState('');
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [transcribingId, setTranscribingId] = useState<string | null>(null);
    
    // File Upload Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter lists
    const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, mode]);

    // --- ADMIN ACTIONS ---
    const handleRemoveChannel = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentUser.role !== 'ADMIN') return;
        if (confirm('ADMIN OVERRIDE: Are you sure you want to decommission this frequency?')) {
            setChannels(prev => prev.filter(c => c.id !== id));
            if (activeChannel.id === id && channels.length > 1) setActiveChannel(channels[0]);
        }
    };

    const handleRemoveContact = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentUser.role !== 'ADMIN') return;
        if (confirm('ADMIN OVERRIDE: Remove this contact from the secure network?')) {
            setChats(prev => prev.filter(c => c.id !== id));
            if (activeChat.id === id && chats.length > 1) setActiveChat(chats[0]);
        }
    };

    const handleAddChannel = () => {
        if (currentUser.role !== 'ADMIN') return;
        const name = prompt("Enter new Channel Name:");
        if (name) {
            const newChannel: Channel = {
                id: Date.now().toString(),
                name: name,
                members: 0,
                status: 'IDLE',
                frequency: (460 + Math.random() * 10).toFixed(4),
                type: 'RADIO',
                isSecure: true
            };
            setChannels(prev => [...prev, newChannel]);
        }
    };

    const handleSendBroadcast = () => {
        if (!broadcastMessage.trim()) return;
        
        // Mock Push Notification System
        alert(`BROADCAST SENT TO ALL UNITS:\n"${broadcastMessage}"\n\nPriority: HIGH\nSender: ${currentUser.name} (ADMIN)`);
        
        setShowBroadcastModal(false);
        setBroadcastMessage('');
        
        // Log it locally
        const newMsg: CommMessage = {
            id: Date.now().toString(),
            sender: 'HQ BROADCAST',
            senderId: 'admin',
            type: 'TEXT',
            content: `🚨 ALL POINTS BULLETIN: ${broadcastMessage}`,
            timestamp: new Date(),
            readReceipt: 'READ'
        };
        setMessages(prev => [...prev, newMsg]);
    };

    // --- AUDIO HANDLING ---
    const startRecording = async () => {
        try {
            if (isPTTActive || mediaRecorderRef.current?.state === 'recording') return;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const newMsg: CommMessage = {
                    id: Date.now().toString(),
                    sender: 'Me',
                    senderId: 'me',
                    type: 'AUDIO',
                    content: audioUrl,
                    duration: Math.random() * 5 + 1,
                    timestamp: new Date(),
                    readReceipt: 'SENT'
                };
                setMessages(prev => [...prev, newMsg]);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsPTTActive(true);
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (e) {
            console.error("Mic Error", e);
            alert("Microphone access is required.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsPTTActive(false);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }
    };

    const playAudio = (msg: CommMessage) => {
        if (msg.type !== 'AUDIO') return;
        if (playingAudioId === msg.id) {
            setPlayingAudioId(null); // Stop if playing
            return;
        }
        setPlayingAudioId(msg.id);
        
        // Mock playback for placeholder
        if (msg.content === 'audio_placeholder') {
             setTimeout(() => setPlayingAudioId(null), (msg.duration || 2) * 1000);
             return;
        }

        if (msg.content.startsWith('blob:')) {
            const audio = new Audio(msg.content);
            audio.onended = () => setPlayingAudioId(null);
            audio.play().catch(err => {
                console.error("Audio play failed:", err);
                setPlayingAudioId(null);
            });
        }
    };

    const handleTranscribe = async (msg: CommMessage) => {
        if (msg.transcription || transcribingId === msg.id) {
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, showTranscription: !m.showTranscription } : m));
            return;
        }

        setTranscribingId(msg.id);

        try {
            let text = "";
            if (msg.content === 'audio_placeholder') {
                 await new Promise(r => setTimeout(r, 1000));
                 text = "Roger that dispatch. Proceeding to location.";
            } else if (msg.content.startsWith('blob:')) {
                const response = await fetch(msg.content);
                const blob = await response.blob();
                const base64 = await blobToBase64(blob);
                text = await transcribeUserAudio(base64);
            }
            
            setMessages(prev => prev.map(m => m.id === msg.id ? { 
                ...m, 
                transcription: text || "No speech detected.", 
                showTranscription: true 
            } : m));
        } catch (e) {
            console.error("Transcription failed", e);
        } finally {
            setTranscribingId(null);
        }
    };

    const handleSendText = () => {
        if (!inputText.trim()) return;
        const newMsg: CommMessage = {
            id: Date.now().toString(),
            sender: 'Me',
            senderId: 'me',
            type: 'TEXT',
            content: inputText,
            timestamp: new Date(),
            readReceipt: 'SENT'
        };
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const isImage = file.type.startsWith('image/');
            
            const newMsg: CommMessage = {
                id: Date.now().toString(),
                sender: 'Me',
                senderId: 'me',
                type: isImage ? 'IMAGE' : 'FILE',
                content: url,
                fileName: file.name,
                fileSize: (file.size / 1024).toFixed(1) + ' KB',
                timestamp: new Date(),
                readReceipt: 'SENT'
            };
            setMessages(prev => [...prev, newMsg]);
            
            // Clear input so same file can be selected again
            e.target.value = '';
        }
    };

    return (
        <div className="h-full bg-slate-950 flex relative overflow-hidden">
            
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[25] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* 1. SIDEBAR (Fixed Left / Sliding Mobile) */}
            <motion.div 
                initial={false}
                animate={{ 
                    x: isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 0 : pttPosition === 'right' ? '-100%' : '100%',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`w-80 bg-slate-900 ${pttPosition === 'right' ? 'border-r left-0' : 'border-l right-0'} border-slate-800 flex flex-col shrink-0 z-30 absolute inset-y-0 md:relative md:translate-x-0 h-full`}
            >
                {/* Floating Mobile Toggle Button (Attached to Panel) */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`md:hidden absolute ${pttPosition === 'right' ? 'right-[-25px]' : 'left-[-25px]'} top-[60%] -translate-y-1/2 w-[25px] h-[90px] bg-blue-600 hover:bg-blue-500 text-white ${pttPosition === 'right' ? 'rounded-r-xl' : 'rounded-l-xl'} flex flex-col items-center justify-center z-[100] shadow-[4px_0_15px_rgba(37,99,235,0.4)] border ${pttPosition === 'right' ? 'border-l-0' : 'border-r-0'} border-blue-400/30 transition-all active:scale-95 text-[7px] font-bold`}
                    title={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                    {isSidebarOpen ? pttPosition === 'right' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" /> : <>{pttPosition === 'right' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />} <span className="vertical-text text-[13px]">{mode === 'RADIO' ? 'CHANNEL' : 'CONTACTS'}</span></>}
                </button>

                {/* USER PROFILE & ROLE INDICATOR */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${currentUser.role === 'ADMIN' ? 'bg-red-600' : 'bg-blue-600'}`}>
                            {currentUser.name.charAt(0)}
                        </div>
                        {currentUser.role === 'ADMIN' && (
                            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-slate-900" title="Administrator">
                                <Shield className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-white font-bold">{currentUser.name}</div>
                        <div className={`text-[10px] font-mono ${currentUser.role === 'ADMIN' ? 'text-red-400' : 'text-blue-400'}`}>
                            {currentUser.role === 'ADMIN' ? 'SYS ADMIN' : 'FIELD OFFICER'}
                        </div>
                    </div>
                </div>

                <div className="p-3 border-b border-slate-800 bg-slate-900 space-y-3">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1 group">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                             <input 
                                type="text" 
                                placeholder={mode === 'RADIO' ? "Filter channels..." : "Search contacts..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all font-medium" 
                             />
                        </div>
                        {currentUser.role === 'ADMIN' && (
                             <button 
                                 onClick={handleAddChannel}
                                 className="h-[34px] w-[34px] bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-md shrink-0"
                                 title="Add frequency"
                             >
                                 <Plus className="w-4 h-4" />
                             </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto relative">
                    {mode === 'RADIO' ? (
                        // CHANNEL LIST
                        <div className="p-2 space-y-1">
                            {filteredChannels.map(channel => (
                                <div 
                                    key={channel.id}
                                    onClick={() => setActiveChannel(channel)}
                                    className={`p-3 rounded-lg cursor-pointer flex items-center justify-between border transition-all group ${
                                        activeChannel.id === channel.id 
                                        ? 'bg-blue-900/20 border-blue-500/50' 
                                        : 'bg-slate-900 border-transparent hover:bg-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div>
                                        <div className={`font-bold text-sm flex items-center gap-1 ${activeChannel.id === channel.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                            {channel.name}
                                            {channel.isSecure && <Lock className="w-3 h-3 text-emerald-500/70" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] opacity-70 font-mono text-slate-400">
                                            {channel.frequency} MHz
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`w-2 h-2 rounded-full ${channel.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : channel.status === 'IDLE' ? 'bg-yellow-500' : 'bg-slate-500'}`}></div>
                                            <div className="flex items-center text-[10px] gap-1 text-slate-500">
                                                <Users className="w-3 h-3" /> {channel.members}
                                            </div>
                                        </div>
                                        
                                        {/* ADMIN ONLY: Remove Button */}
                                        {currentUser.role === 'ADMIN' && (
                                            <button 
                                                onClick={(e) => handleRemoveChannel(channel.id, e)}
                                                className="p-1.5 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Decommission Channel"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // CHAT LIST
                        <div className="divide-y divide-slate-800">
                            {filteredChats.map(chat => (
                                <div 
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors flex gap-3 group ${activeChat.id === chat.id ? 'bg-slate-800' : ''}`}
                                >
                                    <div className="relative shrink-0">
                                        <img src={chat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                            chat.status === 'ONLINE' ? 'bg-emerald-500' : 
                                            chat.status === 'BUSY' ? 'bg-red-500' : 'bg-slate-500'
                                        }`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className={`font-bold text-sm truncate ${activeChat.id === chat.id ? 'text-emerald-400' : 'text-slate-200'}`}>{chat.name}</h4>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-slate-500">{chat.time}</span>
                                                {/* ADMIN ONLY: Remove Contact */}
                                                {currentUser.role === 'ADMIN' && (
                                                    <button 
                                                        onClick={(e) => handleRemoveContact(chat.id, e)}
                                                        className="p-1 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-slate-400 truncate pr-2">{chat.lastMessage}</p>
                                            {chat.unread > 0 && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center">
                                                    {chat.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* 2. MAIN CONTENT AREA (Right) */}
            <div className="flex-1 flex flex-col relative w-full h-full min-w-0 bg-slate-950 z-10">
                
                {/* Header */}
                <div className={`min-h-16 h-auto border-b border-slate-700 flex justify-between items-center px-4 py-2 shrink-0 transition-colors z-10 gap-4 ${mode === 'RADIO' ? 'bg-slate-900' : 'bg-slate-900'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => setShowHelp(true)} className="text-slate-400 hover:text-white">
                           <HelpCircle className="w-5 h-5" />
                        </button>
                        {mode === 'RADIO' ? (
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-600 shrink-0">
                                    <Radio className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="font-bold text-slate-100 flex items-center gap-2 truncate">
                                        <span className="truncate">{activeChannel.name}</span>
                                        {activeChannel.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
                                        {activeChannel.isSecure && <Lock className="w-3 h-3 text-emerald-500 shrink-0" />}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1 truncate">
                                        <Signal className="w-3 h-3 shrink-0 text-emerald-500" /> <span className="truncate">5G/LTE</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <img src={activeChat.avatar} className="w-10 h-10 rounded-full border border-slate-600 object-cover" alt="" />
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${activeChat.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-sm truncate">{activeChat.name}</div>
                                    <div className="text-[10px] text-emerald-400 font-medium truncate">{activeChat.status === 'ONLINE' ? 'Active Now' : 'Offline'}</div>
                                </div>
                            </div>
                        )}
                        {/* Help Overlay */}
                        {showHelp && <HelpOverlay view={ViewState.ERADIO} onClose={() => setShowHelp(false)} />}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* ADMIN ONLY: Broadcast Button */}
                        {currentUser.role === 'ADMIN' && (
                            <button 
                                onClick={() => setShowBroadcastModal(true)}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-900/30 text-red-400 border border-red-500/50 rounded-lg text-[10px] font-bold hover:bg-red-900/50 transition-all mr-2"
                            >
                                <BellRing className="w-3 h-3" /> BROADCAST ALERT
                            </button>
                        )}

                        {mode === 'MESSAGING' && (
                            <>
                                <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><Phone className="w-5 h-5" /></button>
                                <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><Video className="w-5 h-5" /></button>
                            </>
                        )}
                        <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Integrated Message/Control Area with Optional Right PTT Sidebar */}
                <div className={`flex-1 flex overflow-hidden relative h-full w-full ${pttPosition === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-1 flex flex-col overflow-hidden relative h-full min-w-0">
                        {/* Message List */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 w-full ${mode === 'RADIO' ? 'bg-slate-950 bg-grid-pattern' : 'bg-slate-950'}`}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex flex-col max-w-[85%] md:max-w-[60%]`}>
                                {/* Radio Mode: Technical Look | Messaging Mode: Bubble Look */}
                                {mode === 'RADIO' ? (
                                    <>
                                        <div className="flex justify-between items-end mb-1 px-1">
                                            <span className={`text-[9px] font-bold font-mono tracking-wider ${msg.senderId === 'me' ? 'text-blue-400' : msg.senderId === 'admin' ? 'text-red-500' : 'text-orange-400'}`}>
                                                {msg.sender.toUpperCase()} &lt;{msg.senderId}&gt;
                                            </span>
                                            <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className={`p-3 rounded-sm border-l-2 relative ${
                                            msg.senderId === 'me' 
                                            ? 'bg-blue-900/10 border-blue-500 text-blue-100' 
                                            : msg.senderId === 'admin'
                                            ? 'bg-red-900/10 border-red-500 text-red-100'
                                            : 'bg-slate-800 border-slate-600 text-slate-200'
                                        }`}>
                                            {msg.type === 'TEXT' && <p className="text-xs font-mono leading-relaxed">{msg.content}</p>}
                                            
                                            {msg.type === 'AUDIO' && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => playAudio(msg)} className="cursor-pointer p-2 bg-slate-700/50 rounded hover:bg-slate-600 transition-colors">
                                                            {playingAudioId === msg.id ? <Pause className="w-4 h-4 text-green-400" /> : <Play className="w-4 h-4 text-slate-400" />}
                                                        </button>
                                                        {/* Waveform Visual */}
                                                        <div className="h-6 flex items-center gap-0.5 opacity-50 flex-1">
                                                            {[...Array(20)].map((_, i) => (
                                                                <div key={i} className={`w-1 bg-current rounded-full ${playingAudioId === msg.id ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 100}%` }}></div>
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-mono opacity-50">{msg.duration?.toFixed(1)}s</span>
                                                    </div>
                                                    
                                                    {/* Transcription */}
                                                    <div className="border-t border-slate-700/50 pt-2 mt-1">
                                                        {msg.showTranscription ? (
                                                            <p className="text-[10px] text-slate-300 font-sans italic">"{msg.transcription}"</p>
                                                        ) : (
                                                            <button onClick={() => handleTranscribe(msg)} className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300">
                                                                {transcribingId === msg.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Captions className="w-3 h-3" />}
                                                                {transcribingId === msg.id ? 'Transcribing...' : 'Show Transcript'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
 
                                            {msg.type === 'IMAGE' && (
                                                <div className="mt-1">
                                                    <img src={msg.content} className="max-w-[200px] rounded border border-slate-600/50" alt="Attachment" />
                                                    <div className="text-[9px] text-slate-500 mt-1 font-mono flex items-center gap-1"><Paperclip className="w-3 h-3"/> IMG_DATA</div>
                                                </div>
                                            )}
 
                                            {msg.type === 'FILE' && (
                                                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-700 mt-1">
                                                    <div className="p-2 bg-slate-800 rounded">
                                                        <File className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="text-xs font-bold text-slate-300 truncate">{msg.fileName}</div>
                                                        <div className="text-[9px] text-slate-500 font-mono">{msg.fileSize}</div>
                                                    </div>
                                                    <a href={msg.content} download={msg.fileName} className="ml-auto p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* MESSAGING BUBBLE */}
                                        <div className={`p-3 rounded-2xl shadow-sm text-sm relative ${
                                            msg.senderId === 'me' 
                                            ? 'bg-emerald-600 text-white rounded-br-none' 
                                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                        }`}>
                                            {msg.type === 'TEXT' && <p className="leading-relaxed">{msg.content}</p>}
                                            
                                            {msg.type === 'AUDIO' && (
                                                <div className="flex items-center gap-2 min-w-[160px]">
                                                    <button onClick={() => playAudio(msg)} className="p-2 bg-black/20 rounded-full hover:bg-black/30 transition-colors">
                                                        {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </button>
                                                    <div className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden">
                                                        <div className={`h-full bg-white/80 ${playingAudioId === msg.id ? 'w-full transition-all duration-[4000ms]' : 'w-0'}`}></div>
                                                    </div>
                                                    <span className="text-[10px] opacity-80">{msg.duration?.toFixed(0)}s</span>
                                                </div>
                                            )}
 
                                            {msg.type === 'IMAGE' && (
                                                <img src={msg.content} className="rounded-lg max-w-full" alt="Attachment" />
                                            )}
 
                                            {msg.type === 'FILE' && (
                                                <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg min-w-[180px]">
                                                    <div className="p-2 bg-white/10 rounded-lg">
                                                        <File className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-xs font-bold truncate">{msg.fileName}</div>
                                                        <div className="text-[9px] opacity-70">{msg.fileSize}</div>
                                                    </div>
                                                    <a href={msg.content} download={msg.fileName} className="p-1 hover:bg-black/20 rounded">
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            )}
                                            
                                            <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${msg.senderId === 'me' ? 'text-emerald-200' : 'text-slate-400'}`}>
                                                {msg.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                {msg.senderId === 'me' && (
                                                    <span>
                                                        {msg.readReceipt === 'READ' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
 
                        {/* Footer Controls */}
                        <div className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0 z-10 w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
                            
                            {/* Hidden File Input */}
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
 
                            {mode === 'RADIO' ? (
                                /* RADIO TEXT CONTROLS */
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-1 shadow-inner w-full max-w-2xl mx-auto">
                                    <button 
                                        onClick={triggerFileSelect}
                                        className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
                                        title="Attach File"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>
                                    <input 
                                        type="text" 
                                        value={inputText} 
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Type tactical message..."
                                        className="flex-1 bg-transparent border-none text-xs px-2 py-3 text-white focus:outline-none font-mono transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                    />
                                    <button onClick={handleSendText} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shrink-0 shadow-lg">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                /* MESSAGING CONTROLS */
                                <div className="flex items-end gap-2 w-full max-w-3xl mx-auto">
                                    <button 
                                        onClick={triggerFileSelect}
                                        className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors mb-0.5"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 bg-slate-800 rounded-2xl flex items-center px-4 border border-slate-700 focus-within:border-emerald-500 transition-colors">
                                        <textarea 
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendText())}
                                            placeholder="Message..." 
                                            className="flex-1 bg-transparent py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 resize-none max-h-24 break-words"
                                            rows={1}
                                        />
                                        <button 
                                            onClick={triggerFileSelect}
                                            className="p-2 text-slate-400 hover:text-emerald-400"
                                        >
                                            <ImageIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                    {inputText ? (
                                        <button onClick={handleSendText} className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 mb-0.5">
                                            <Send className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button 
                                            onMouseDown={startRecording}
                                            onMouseUp={stopRecording}
                                            className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 mb-0.5 ${isPTTActive ? 'bg-green-600 text-white' : 'bg-slate-800 text-emerald-500 hover:bg-slate-700'}`}
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
 
                    {/* 3. PTT SIDEBAR (Radio Mode Only) */}
                    {mode === 'RADIO' && (
                        <div className={`w-[100px] h-full ${pttPosition === 'left' ? 'border-r' : 'border-l'} border-slate-800 bg-slate-900 flex flex-col items-center py-4 gap-4 shadow-2xl z-50`}>
                            <div className="flex flex-col items-center gap-1 opacity-50">
                                <Radio className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">PTT LINK</span>
                            </div>
                            
                            {/* LARGE VERTICAL PTT BUTTON */}
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording}
                                onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                                className={`
                                    flex-[2] w-[80px] rounded-full flex flex-col items-center justify-center gap-4 transition-all touch-none select-none border-t border-x relative z-50
                                    ${isPTTActive 
                                        ? 'bg-green-600 text-white shadow-[0_0_60px_rgba(22,163,74,0.9)] border-green-400 ring-4 ring-green-500/30' 
                                        : 'bg-slate-800 text-slate-400 border-b-[8px] border-slate-950 hover:bg-slate-700 hover:text-white border-white/10 shadow-2xl'
                                    }
                                `}
                            >
                                <div className={`w-3 h-3 rounded-full ${isPTTActive ? 'bg-white animate-ping' : 'bg-slate-600'}`} />
                                <span className="vertical-text font-black text-xs tracking-widest uppercase py-4 text-yellow-500">
                                    PRESS TO TALK
                                </span>
                                <Mic className={`w-6 h-6 ${isPTTActive ? 'animate-pulse' : 'opacity-30'}`} />
                            </button>
                            
                            <button
                                onClick={() => setPttPosition(pttPosition === 'left' ? 'right' : 'left')}
                                className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50"
                                title="Toggle PTT position"
                            >
                                {pttPosition === 'left' ? <ChevronRight /> : <ChevronLeft />}
                            </button>


                        </div>
                    )}
                </div>
            </div>

            {/* BROADCAST MODAL (ADMIN ONLY) */}
            {showBroadcastModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-900 border border-red-500 rounded-xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <ShieldAlert className="w-8 h-8" />
                            <div>
                                <h3 className="text-lg font-black uppercase">Priority Broadcast</h3>
                                <p className="text-[10px] font-mono text-red-400">PUSH NOTIFICATION TO ALL ACTIVE UNITS</p>
                            </div>
                        </div>
                        
                        <textarea 
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            className="w-full bg-black border border-red-900/50 rounded-lg p-3 text-red-100 placeholder:text-red-900/50 outline-none focus:border-red-500 min-h-[120px] mb-4 font-mono text-sm"
                            placeholder="ENTER ALERT MESSAGE..."
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowBroadcastModal(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-bold text-sm"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={handleSendBroadcast}
                                disabled={!broadcastMessage}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                SEND ALERT <BellRing className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CommunicationsView;
