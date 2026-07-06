
import React, { useState, useEffect } from 'react';
import { Search, User, MapPin, AlertTriangle, Shield, X, Printer, Eye, Fingerprint, FileWarning, Filter, Sparkles, Camera, Skull, Box, Accessibility, Play } from 'lucide-react';
import { MOCK_ROGUE_GALLERY } from './constants';
import { Suspect } from './types';

const RogueGalleryView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'WANTED' | 'CAPTURED'>('ALL');
    const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
    const [assetView, setAssetView] = useState<'HEAD' | 'BODY' | '3D'>('HEAD');

    // Reset view when new suspect selected
    useEffect(() => {
        if (selectedSuspect) {
            setAssetView('HEAD');
        }
    }, [selectedSuspect]);

    // Filter Logic
    const filteredSuspects = MOCK_ROGUE_GALLERY.filter(suspect => {
        const matchesSearch = suspect.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              suspect.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              suspect.crime.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (suspect.affiliation && suspect.affiliation.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || 
                              (filterStatus === 'WANTED' && suspect.status !== 'CAPTURED') ||
                              (filterStatus === 'CAPTURED' && suspect.status === 'CAPTURED');
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="p-4 border-b border-slate-800 flex flex-row items-center gap-3 bg-slate-900/50">
                <div className="relative w-1/2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Name, Alias, Offense or Gang..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                    />
                </div>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {['ALL', 'WANTED', 'CAPTURED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as any)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                filterStatus === status 
                                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery Content - Side-by-Side Flex Layout */}
            <div className="flex-none overflow-x-auto p-4 bg-grid-pattern">
                <div className="flex flex-row gap-3 items-start">
                    {filteredSuspects.slice(0, 6).map(suspect => (
                        <div 
                            key={suspect.id}
                            onClick={() => setSelectedSuspect(suspect)}
                            className="group relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden cursor-pointer hover:border-slate-500 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 flex flex-col w-32 shrink-0"
                        >
                            {/* Image Container - Tall Aspect Ratio (1:2), reduced scale */}
                            <div className="aspect-[1/2] bg-slate-950 relative overflow-hidden">
                                {suspect.imageUrl ? (
                                    <img src={suspect.imageUrl} alt={suspect.name} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${suspect.status === 'CAPTURED' ? 'grayscale opacity-50' : ''}`} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                        <User className="w-8 h-8" />
                                    </div>
                                )}
                                
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80"></div>
                                
                                {suspect.status === 'CAPTURED' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                        <div className="border border-green-600 text-green-500 font-black text-[8px] px-1 py-0.5 -rotate-12 tracking-widest uppercase">
                                            CAPTURED
                                        </div>
                                    </div>
                                )}
                                
                                {/* 3D Ready Indicator */}
                                {suspect.threeDModelUrl && (
                                    <div className="absolute top-1 right-2 w-3 h-3 bg-blue-600/80 rounded flex items-center justify-center shadow-lg border border-white/20">
                                        <Box className="w-2 h-2 text-white" />
                                    </div>
                                )}

                                {/* Risk Dot */}
                                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${suspect.riskLevel === 'HIGH' ? 'bg-red-500 animate-pulse' : suspect.riskLevel === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>

                                {/* Source Icon */}
                                <div className="absolute top-1 left-1">
                                    {suspect.imageSource === 'AI_GENERATED' ? (
                                        <Sparkles className="w-2 h-2 text-purple-400 drop-shadow-md" />
                                    ) : (
                                        <Camera className="w-2 h-2 text-blue-400 drop-shadow-md" />
                                    )}
                                </div>

                                {/* Compact Name Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-1 text-center">
                                    <h3 className="font-bold text-white text-[8px] uppercase truncate leading-tight shadow-black drop-shadow-sm">{suspect.name}</h3>
                                    <p className="text-[6px] text-slate-400 font-mono truncate mb-0.5">"{suspect.alias}"</p>
                                    {suspect.affiliation && (
                                        <p className="text-[5px] text-red-400 font-black uppercase tracking-wider bg-black/50 rounded px-1 truncate">
                                            {suspect.affiliation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSuspects.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-bold">No subjects found matching criteria.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedSuspect && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                        
                        {/* LEFT COLUMN: Media Viewer */}
                        <div className="w-full md:w-1/2 bg-black relative shrink-0 flex flex-col">
                            {/* View Controls */}
                            <div className="absolute top-4 left-4 z-20 flex gap-2">
                                <button 
                                    onClick={() => setAssetView('HEAD')}
                                    className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${assetView === 'HEAD' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-black/60 text-slate-300 border-white/20 backdrop-blur-sm'}`}
                                >
                                    <User className="w-4 h-4" /> MUGSHOT
                                </button>
                                <button 
                                    onClick={() => setAssetView('BODY')}
                                    className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${assetView === 'BODY' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-black/60 text-slate-300 border-white/20 backdrop-blur-sm'}`}
                                >
                                    <Accessibility className="w-4 h-4" /> BODY
                                </button>
                                {selectedSuspect.threeDModelUrl && (
                                    <button 
                                        onClick={() => setAssetView('3D')}
                                        className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${assetView === '3D' ? 'bg-purple-600 text-white border-purple-500 shadow-lg' : 'bg-black/60 text-slate-300 border-white/20 backdrop-blur-sm'}`}
                                    >
                                        <Box className="w-4 h-4" /> 3D SCAN
                                    </button>
                                )}
                            </div>

                            {/* Main Media Display */}
                            <div className="flex-1 relative flex items-center justify-center bg-slate-950 overflow-hidden">
                                {assetView === '3D' && selectedSuspect.threeDModelUrl ? (
                                    <div className="w-full h-full relative">
                                        <video 
                                            src={selectedSuspect.threeDModelUrl} 
                                            autoPlay 
                                            loop 
                                            muted 
                                            playsInline 
                                            className="w-full h-full object-contain" 
                                        />
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-purple-900/50 text-purple-300 text-[10px] px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-2 animate-pulse">
                                            <Play className="w-3 h-3 fill-current" /> 3D MODEL ROTATION
                                        </div>
                                    </div>
                                ) : assetView === 'BODY' ? (
                                    selectedSuspect.fullBodyImageUrl ? (
                                        <img src={selectedSuspect.fullBodyImageUrl} alt="Full Body" className="w-full h-full object-contain object-top" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-600">
                                            <Accessibility className="w-16 h-16 mb-2 opacity-20" />
                                            <span className="text-xs">No full body image available</span>
                                        </div>
                                    )
                                ) : (
                                    /* HEADSHOT DEFAULT */
                                    selectedSuspect.imageUrl ? (
                                        <img src={selectedSuspect.imageUrl} alt="Mugshot" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-600">
                                            <User className="w-16 h-16 mb-2 opacity-20" />
                                            <span className="text-xs">No mugshot available</span>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Info Overlay at Bottom */}
                            <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 inset-x-0 pointer-events-none">
                                <div className="font-black text-3xl text-white uppercase leading-none tracking-tighter shadow-black drop-shadow-lg">{selectedSuspect.name}</div>
                                <div className="text-xl text-amber-500 font-mono italic mt-1">"{selectedSuspect.alias}"</div>
                                {selectedSuspect.affiliation && (
                                    <div className="mt-2 flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-sm">
                                        <Skull className="w-4 h-4" /> {selectedSuspect.affiliation}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Dossier */}
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border-l border-slate-800">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                        <Fingerprint className="w-4 h-4 text-blue-500" /> CRIMINAL DOSSIER
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-mono">ID: {selectedSuspect.id}</p>
                                </div>
                                <button onClick={() => setSelectedSuspect(null)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Status Block */}
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</div>
                                        <div className={`text-xl font-black uppercase tracking-wide ${selectedSuspect.status === 'CAPTURED' ? 'text-green-500' : 'text-red-500'}`}>
                                            {selectedSuspect.status}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Risk Level</div>
                                        <div className={`text-xl font-black uppercase tracking-wide ${selectedSuspect.riskLevel === 'HIGH' ? 'text-red-500' : 'text-orange-500'}`}>
                                            {selectedSuspect.riskLevel}
                                        </div>
                                    </div>
                                </div>

                                {/* Affiliation Block */}
                                {selectedSuspect.affiliation && (
                                    <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3">
                                        <Skull className="w-8 h-8 text-red-500 opacity-80" />
                                        <div>
                                            <div className="text-[10px] text-red-400 font-bold uppercase">Affiliation / Gang</div>
                                            <div className="text-lg font-black text-white uppercase tracking-wider">{selectedSuspect.affiliation}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Offense Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" /> Offenses
                                    </h4>
                                    <div className="bg-slate-800/50 p-4 rounded border border-slate-700 text-sm text-slate-200 font-mono leading-relaxed">
                                        {selectedSuspect.crime}
                                    </div>
                                </div>

                                {/* Last Known */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Last Known Location
                                    </h4>
                                    <div className="bg-slate-800/50 p-4 rounded border border-slate-700 flex items-center justify-between">
                                        <span className="text-sm text-slate-200 font-bold">{selectedSuspect.lastSeen || 'Unknown'}</span>
                                        <button className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                                            <Eye className="w-3 h-3" /> LOCATE
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t border-slate-800 bg-slate-850 flex gap-3">
                                <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors">
                                    <Printer className="w-4 h-4" /> PRINT POSTER
                                </button>
                                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors">
                                    <Shield className="w-4 h-4" /> REPORT SIGHTING
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RogueGalleryView;
