import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, MoreVertical, MessageSquare, Users, Info, Sparkles, ChevronRight, X } from 'lucide-react';

export const VideoConferenceView: React.FC = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isAINotesOpen, setIsAINotesOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const participants = [
        { id: 1, name: 'You', color: 'bg-slate-800' },
        { id: 2, name: 'Officer Rodriguez', color: 'bg-slate-800' },
        { id: 3, name: 'Dispatch', color: 'bg-slate-800' },
        { id: 4, name: 'Alpha Capt', color: 'bg-slate-800' },
    ];

    if (!isOnboarded) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-sm">
                    <h2 className="text-2xl font-bold mb-4">Tactical Briefing Room</h2>
                    <p className="text-slate-400 mb-6">Secure, low-latency communication channel. Please ensure your equipment is functional before joining.</p>
                    <button onClick={() => setIsOnboarded(true)} className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-500 transition">
                        Join Secure Channel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
            {/* Main Stage & Panels */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
                <div className="flex-1 flex flex-col min-w-0" onClick={() => setShowControls(prev => !prev)}>
                    {/* Stage Content */}
                    {isScreenSharing ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="aspect-video w-full max-h-full bg-black rounded-lg border border-slate-700 flex flex-col items-center justify-center">
                                <span className="text-4xl text-slate-500 font-bold">Presentation Screen</span>
                            </div>
                        </div>
                    ) : (
                        /* Grid */
                        <div className="flex-1 grid grid-cols-2 gap-2 p-2 min-h-0">
                            {participants.map((p) => (
                                <div key={p.id} className={`${p.color} relative rounded-lg flex items-center justify-center border border-slate-700`}>
                                    <span className="text-xl font-bold text-slate-500">{p.name[0]}</span>
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-slate-300">{p.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Side Panels */}
                {isChatOpen && (
                    <div className="w-full md:w-1/3 bg-slate-900/80 backdrop-blur-md border-l border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800 font-bold flex justify-between items-center">
                            <span>Chat</span>
                            <button onClick={() => setIsChatOpen(false)}><X size={16}/></button>
                        </div>
                        <div className="flex-1 p-4 text-sm text-slate-400 overflow-y-auto">Tactical Chat...</div>
                        <div className="p-4 border-t border-slate-800">
                           <input className="w-full bg-slate-800 p-2 rounded text-sm outline-none"/>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Control Bar */}
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 px-6 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 transition-transform duration-300 ${showControls ? '' : 'translate-y-32'}`}>
                <div className="text-sm px-4 border-r border-slate-700 hidden md:block">
                    <span className="font-bold text-white">Tactical Briefing</span>
                </div>
                
                <div className="flex gap-2 md:gap-4">
                    <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full ${isMuted ? 'bg-red-900 text-red-200' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-900 text-red-200' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                        <ScreenShare size={20} />
                    </button>
                    <button onClick={() => setIsOnboarded(false)} className="p-3 rounded-full bg-red-700 hover:bg-red-600 text-white">
                        <PhoneOff size={20} />
                    </button>
                </div>

                <div className="flex gap-3 text-slate-400 pl-4 border-l border-slate-700">
                    <button onClick={() => setIsAINotesOpen(!isAINotesOpen)} className={`hover:text-white ${isAINotesOpen ? 'text-white' : ''}`} title="AI Notes"><Sparkles size={20} /></button>
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className={`hover:text-white ${isChatOpen ? 'text-white' : ''}`}><MessageSquare size={20} /></button>
                </div>
            </div>
        </div>
    );
};
export default VideoConferenceView;