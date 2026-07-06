import React from 'react';
import { X } from 'lucide-react';
import { helpContent } from './helpContent';
import { ViewState } from './types';

interface HelpOverlayProps {
  view: ViewState;
  onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ view, onClose }) => {
  const content = helpContent[view];

  if (!content) {
    return (
      <div className="absolute inset-0 z-[5000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-white">
          <p>No help available for this view.</p>
          <button onClick={onClose} className="mt-4 p-2 bg-slate-700 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[5000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-cyan-500/30 p-8 rounded-3xl shadow-2xl max-w-2xl w-full relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold font-tech text-white mb-4">{content.title}</h2>
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed overflow-y-auto no-scrollbar pr-2">
          <p>{content.description}</p>
          
          <h3 className="text-cyan-400 font-bold font-tech mt-4">Key Features</h3>
          <ul className="list-disc pl-5 space-y-1">
            {content.keyFeatures.map((feat, i) => <li key={i}>{feat}</li>)}
          </ul>

          <h3 className="text-cyan-400 font-bold font-tech mt-6">Controls & How-to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.controls.map((ctrl, i) => (
              <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 flex items-start gap-3">
                <ctrl.icon className="text-cyan-400 w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-yellow-400 text-xs">{ctrl.label}</p>
                  <p className="text-[10px]">{ctrl.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <h3 className="text-cyan-400 font-bold font-tech mt-6">Operational Scenarios</h3>
          <ul className="list-decimal pl-5 space-y-2 text-xs">
            {content.scenarios.map((s, i) => (
              <li key={i}><strong>{s.title}:</strong> {s.description}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
