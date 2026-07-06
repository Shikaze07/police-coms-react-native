import React, { useState } from 'react';
import { Mic, FileText, Brain, Zap, Clock, MessageSquare, Video, Radio } from 'lucide-react';
import { User } from './types';

interface ERecorderViewProps {
  currentUser: User | null;
}

const ERecorderView: React.FC<ERecorderViewProps> = ({ currentUser }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string>('');

  return (
    <div className="h-full w-full p-6 bg-slate-950 text-slate-200 overflow-y-auto">
        <div className="flex items-center justify-end mb-8 pb-4 border-b border-white/10">
            <button 
                onClick={() => setIsRecording(!isRecording)}
                className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'}`}
            >
                {isRecording ? <><Zap className="w-4 h-4" /> STOP RECORDING</> : <><Mic className="w-4 h-4" /> START RECORDING</>}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 glass rounded-2xl p-6 border border-white/5 shadow-xl">
                 <h3 className="text-sm uppercase font-bold text-slate-400 mb-4 tracking-widest font-tech">LIVE TRANSCRIPTION</h3>
                 <div className="bg-black/40 p-4 rounded-xl h-96 overflow-y-auto font-mono text-sm leading-relaxed text-slate-300">
                     {transcription || "Transcription will appear here..."}
                 </div>
             </div>

             <div className="flex flex-col gap-6">
                 <div className="glass rounded-2xl p-6 border border-white/5">
                     <h3 className="text-sm uppercase font-bold text-slate-400 mb-4 tracking-widest font-tech">AI ANALYSIS</h3>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-4 rounded-xl text-center">
                            <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <div className="text-[10px] text-slate-400">MINUTES</div>
                         </div>
                         <div className="bg-white/5 p-4 rounded-xl text-center">
                            <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <div className="text-[10px] text-slate-400">MINDMAP</div>
                         </div>
                     </div>
                 </div>
                 
                 <div className="glass rounded-2xl p-6 border border-white/5">
                     <h3 className="text-sm uppercase font-bold text-slate-400 mb-4 tracking-widest font-tech">INTEGRATIONS</h3>
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg"><Radio className="w-4 h-4 text-slate-400" />E-RADIO</div>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg"><MessageSquare className="w-4 h-4 text-slate-400" />E-MESSENGER</div>
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg"><Video className="w-4 h-4 text-slate-400" />E-CONFERENCE</div>
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default ERecorderView;
