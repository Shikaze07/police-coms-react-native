import React, { useState, useRef, useEffect } from 'react';
import { Camera, Box, Rotate3d, RefreshCw, X, Zap, UploadCloud, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TacticalScannerViewProps {
  onAddEvidence?: (item: any) => void;
}

const TacticalScannerView: React.FC<TacticalScannerViewProps> = ({ onAddEvidence }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'PROCESSING' | 'GENERATED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("Scanner camera failed", e);
        setScanState('ERROR');
        setErrorMessage("Camera access denied or unavailable.");
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleScan = () => {
    setScanState('SCANNING');
    // Simulated scanning activity
    setTimeout(() => {
      setScanState('PROCESSING');
      setTimeout(() => {
        setGeneratedModel('https://example.com/simulated-3d-model.mp4'); // Placeholder
        setScanState('GENERATED');
      }, 3000);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
      {/* Camera View */}
      {scanState === 'ERROR' ? (
        <div className="flex-1 flex items-center justify-center text-red-500 font-mono text-center p-6">
            <div><AlertTriangle className="w-16 h-16 mx-auto mb-4" />{errorMessage}</div>
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
      )}
      
      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-lg border border-cyan-500/30">
                <div className="text-[9px] text-cyan-400 font-bold mb-1">TACTICAL 3D SCANNER</div>
                <div className="text-xs text-white font-mono flex items-center gap-2">
                    <Zap className="w-3 h-3 text-yellow-400" /> {scanState === 'ERROR' ? 'OFFLINE' : 'READY'}
                </div>
            </div>
            <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-lg border border-purple-500/30 text-[10px] text-purple-400 font-bold uppercase">
                Gaussian Splatting: ON
            </div>
        </div>

        <div className="flex items-center justify-center">
            {scanState === 'IDLE' && (
                <button onClick={handleScan} className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full border-4 border-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    <Camera className="w-8 h-8 text-white" />
                </button>
            )}
            {scanState === 'SCANNING' && (
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mb-2" />
                    <div className="text-xs text-cyan-400 font-black uppercase tracking-widest animate-pulse">Capturing Geometry...</div>
                </div>
            )}
            {scanState === 'PROCESSING' && (
                 <div className="text-center">
                    <Box className="w-12 h-12 text-purple-400 animate-bounce mb-2" />
                    <div className="text-xs text-purple-400 font-black uppercase tracking-widest">Generating 3D Mesh...</div>
                 </div>
            )}
        </div>
      </div>

      {/* Result Preview */}
      <AnimatePresence>
        {scanState === 'GENERATED' && generatedModel && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 w-full h-1/2 bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6 flex flex-col pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-black text-lg flex items-center gap-2"><Rotate3d className="w-5 h-5 text-purple-400" /> SCAN COMPLETE</h3>
                <button onClick={() => { setScanState('IDLE'); setGeneratedModel(null); }} className="p-2 text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
            </div>
            <div className="flex-1 bg-black rounded-xl border border-slate-800 flex items-center justify-center mb-4">
              <span className="text-slate-600 font-mono text-xs uppercase">3D Preview Field</span>
            </div>
            <div className="flex gap-4">
                <button onClick={() => onAddEvidence?.({ type: 'FORENSIC', label: 'New Scan', description: 'Generated 3D Model' })} className="flex-1 py-3 bg-purple-600 text-white font-black rounded-xl">SAVE TO CASE</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TacticalScannerView;
