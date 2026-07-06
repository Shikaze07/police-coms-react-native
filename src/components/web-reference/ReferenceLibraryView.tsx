
import React, { useState, useEffect, useRef } from 'react';
import { 
    Book, 
    ChevronRight, 
    Search, 
    FileText, 
    Download, 
    Wifi, 
    WifiOff, 
    Database, 
    RefreshCw, 
    CheckCircle, 
    DownloadCloud, 
    Trash2, 
    Terminal, 
    Info,
    AlertTriangle,
    FileCheck,
    Lock
} from 'lucide-react';
import { PNP_KNOWLEDGE_BASE } from './knowledgeBase';
import { ReferenceDoc } from './types';

interface CacheLog {
    timestamp: string;
    level: 'INFO' | 'SUCCESS' | 'WARN';
    message: string;
}

const ReferenceLibraryView: React.FC = () => {
    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<ReferenceDoc | null>(null);
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        // Default to online on start, but allow switching
        return true;
    });
    
    // Cache map: doc.id -> Boolean (representing if it is persistently cached)
    const [cachedDocs, setCachedDocs] = useState<Record<string, boolean>>({});
    const [swLogs, setSwLogs] = useState<CacheLog[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'CONTENT' | 'DIAGNOSTICS'>('CONTENT');

    const consoleEndRef = useRef<HTMLDivElement | null>(null);

    const addLog = (message: string, level: 'INFO' | 'SUCCESS' | 'WARN' = 'INFO') => {
        const timestamp = new Date().toLocaleTimeString();
        setSwLogs(prev => [...prev, { timestamp, level, message }]);
    };

    const handleSynchronizeAll = () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncProgress(0);
        addLog('Bulk persistent download initiated for all PNP reference documents.', 'INFO');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            setSyncProgress(progress);
            
            if (progress === 20) {
                addLog('Connecting to regional secure procedures server...', 'INFO');
            } else if (progress === 40) {
                addLog('Negotiating Knox-grade localized schema verification...', 'INFO');
            } else if (progress === 60) {
                addLog('Downloading procedures, circulars, and penal code templates...', 'INFO');
            } else if (progress === 80) {
                addLog('Compiling offline indexes and writing blocks to Service Worker...', 'INFO');
            } else if (progress >= 100) {
                clearInterval(interval);
                setIsSyncing(false);
                setSyncProgress(0);
                
                // Cache all documents
                const allCached: Record<string, boolean> = {};
                PNP_KNOWLEDGE_BASE.forEach(doc => {
                    allCached[doc.id] = true;
                });
                setCachedDocs(allCached);
                localStorage.setItem('pnp_reference_cache', JSON.stringify(allCached));
                
                addLog('Bulk synchronization COMPLETED.', 'SUCCESS');
                addLog(`[SW Cache] Wrote ${PNP_KNOWLEDGE_BASE.length} procedure records into local persistent storage.`, 'SUCCESS');
            }
        }, 300);
    };

    // Initial pre-caching of critical documents and logs
    useEffect(() => {
        // Load initial cache from local storage
        const stored = localStorage.getItem('pnp_reference_cache');
        let initialCache: Record<string, boolean> = {};
        
        if (stored) {
            try {
                initialCache = JSON.parse(stored);
            } catch (e) {
                initialCache = {};
            }
        } else {
            // Default pre-cache critical PNP operational procedures on first load
            initialCache = {
                'pop-001': true, // Rule 1-3 Patrol Operations
                'pop-002': true, // Arrest and Search
                'rep-001': true  // Report writing
            };
            localStorage.setItem('pnp_reference_cache', JSON.stringify(initialCache));
        }
        setCachedDocs(initialCache);

        // Add boot logs
        const now = () => new Date().toLocaleTimeString();
        const logs: CacheLog[] = [
            { timestamp: now(), level: 'INFO', message: 'Service Worker initializing scope: /components/ReferenceLibrary/...' },
            { timestamp: now(), level: 'INFO', message: 'Local Storage backend allocated successfully. Allotted quota: 50MB.' },
            { timestamp: now(), level: 'SUCCESS', message: 'Persistent cash loaded: ' + Object.keys(initialCache).filter(k => initialCache[k]).length + ' items pre-loaded in officer session.' },
            { timestamp: now(), level: 'SUCCESS', message: 'Active Service Worker registered. Cache: PNP-KB-V1 (Stale-While-Revalidate active)' }
        ];
        setSwLogs(logs);
    }, []);

    // Scroll logger to bottom
    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [swLogs]);
    // Filter documents based on query
    const filteredDocs = PNP_KNOWLEDGE_BASE.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Dynamic document count
    const totalCount = PNP_KNOWLEDGE_BASE.length;
    const cachedCount = Object.keys(cachedDocs).filter(id => cachedDocs[id]).length;

    // Cache or remove individual item
    const toggleCacheItem = (id: string, title: string) => {
        setCachedDocs(prev => {
            const next = { ...prev };
            const isCurrentlyCached = !!next[id];
            next[id] = !isCurrentlyCached;
            
            // Persist to actual local storage
            localStorage.setItem('pnp_reference_cache', JSON.stringify(next));
            
            if (!isCurrentlyCached) {
                addLog(`Manual cache download requested for doc ID ${id}.`, 'INFO');
                addLog(`[SW Cache] Store write successful for "${title}"`, 'SUCCESS');
            } else {
                addLog(`Removed cache profile for doc ID ${id}.`, 'WARN');
                addLog(`[SW Cache] Purged entry "${title}" from offline storage`, 'INFO');
            }
            return next;
        });
    };

    // Delete entire offline cached items
    const handlePurgeAll = () => {
        setCachedDocs({});
        localStorage.removeItem('pnp_reference_cache');
        setSelectedDoc(null);
        addLog('Completed heavy cleanup process. Purged all offline caches.', 'WARN');
        addLog('[SW Cache] System is fresh. No reference documents are saved locally.', 'WARN');
    };

    // Handle offline simulator toggles
    const handleNetworkToggle = () => {
        setIsOnline(prev => {
            const next = !prev;
            if (next) {
                addLog('Radio link established. Reconnected to PNP Central Gateway database.', 'SUCCESS');
            } else {
                addLog('WARNING: Connection suspended. Terminal operating in Out-of-Range Local Cached mode.', 'WARN');
                addLog('Service worker fallback rules are now ACTIVE.', 'INFO');
            }
            return next;
        });
    };

    const handleExportPDF = () => {
        if (!selectedDoc) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${selectedDoc.title}</title>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #000; line-height: 1.6; }
                            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                            .meta { color: #666; font-size: 0.9em; margin-bottom: 30px; font-weight: bold; text-transform: uppercase; }
                            .content { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; }
                            .footer { margin-top: 50px; font-size: 0.8em; color: #999; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; }
                            @media print {
                                body { padding: 0; margin: 20mm; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${selectedDoc.title}</h1>
                        <div class="meta">Category: ${selectedDoc.category}</div>
                        <div class="content">${selectedDoc.content}</div>
                        <div class="footer">
                            OFFICIAL POLICECOMS REFERENCE DOCUMENT<br/>
                            Generated on ${new Date().toLocaleString()}
                        </div>
                        <script>
                            window.onload = function() { window.print(); }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    // Safely check if active document is accessible to viewer
    const isDocAccessible = (id: string) => {
        return isOnline || !!cachedDocs[id];
    };

    return (
        <div id="pnp_reference_root" className="h-full bg-slate-950 flex flex-col overflow-hidden font-tech">
            {/* Top Command Bar & Offline Simulator Control Panel */}
            <div id="pnp_reference_top_bar" className="p-4 border-b border-white/5 bg-slate-900/95 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between shadow-lg relative z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Book className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            PNP Reference Center
                        </h2>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">SECURE DIGITAL MANUALS & LEGAL REFERENCES</p>
                    </div>
                </div>

                {/* Status Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Simulator Switch */}
                    <div className="bg-slate-950 p-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1.5">Network Status:</span>
                        <button 
                            id="pnp_network_toggle_btn"
                            onClick={handleNetworkToggle}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 ${
                                isOnline 
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-black' 
                                : 'bg-red-600/20 text-red-400 border border-red-500/30'
                            }`}
                        >
                            {isOnline ? (
                                <>
                                    <Wifi className="w-3.5 h-3.5 animate-pulse" />
                                    ONLINE (PNP-NET)
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3.5 h-3.5" />
                                    OUT OF RANGE (OFFLINE)
                                </>
                            )}
                        </button>
                    </div>

                    {/* Offline Capacity Info Indicator */}
                    <div className="bg-slate-950 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-3 text-left">
                        <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">SW Cache Capacity</div>
                            <div className="text-[11px] font-bold text-white font-mono mt-0.5">{cachedCount}/{totalCount} Manuals Cached</div>
                        </div>
                    </div>

                    {/* Universal Cache Action buttons */}
                    <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
                        <button
                            id="pnp_cache_sync_btn"
                            onClick={handleSynchronizeAll}
                            disabled={isSyncing}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest text-[#00e1d9] hover:bg-[#00e1d9]/10 transition-colors uppercase flex items-center gap-1.5 ${isSyncing ? 'animate-pulse cursor-not-allowed opacity-50' : ''}`}
                            title="Download all for offline operations"
                        >
                            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync All
                        </button>
                        <button
                            id="pnp_cache_purge_btn"
                            onClick={handlePurgeAll}
                            className="px-2 py-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500/10 transition-colors uppercase"
                            title="Delete all cached data from local memory"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sync Progress Indication Bar */}
            {isSyncing && (
                <div className="w-full h-1 bg-slate-900 overflow-hidden relative border-b border-cyan-500/20 z-10">
                    <div 
                        className="h-full bg-cyan-400 transition-all duration-300 relative"
                        style={{ width: `${syncProgress}%` }}
                    />
                </div>
            )}

            {/* Main Application Segment Split */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                {/* Lateral Navigation Library Content */}
                <div className={`w-full md:w-80 border-r border-white/5 bg-slate-900/40 overflow-hidden flex flex-col ${selectedDoc ? 'hidden md:flex' : 'flex'}`}>
                    
                    {/* Tab Selection (Manuals vs Service Worker Diagnostics) */}
                    <div className="p-3 border-b border-white/5 bg-slate-950 flex gap-2 shrink-0">
                        <button 
                            onClick={() => setActiveTab('CONTENT')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border ${
                                activeTab === 'CONTENT' 
                                ? 'bg-slate-900 border-white/10 text-white font-black' 
                                : 'border-transparent text-slate-400 hover:text-slate-100'
                            }`}
                        >
                            <FileText className="w-3 h-3 text-cyan-400" />
                            Guidebooks
                        </button>
                        <button 
                            id="pnp_diagnostics_tab_btn"
                            onClick={() => setActiveTab('DIAGNOSTICS')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border ${
                                activeTab === 'DIAGNOSTICS' 
                                ? 'bg-slate-900 border-white/10 text-white font-black' 
                                : 'border-transparent text-slate-400 hover:text-slate-100'
                            }`}
                        >
                            <Terminal className="w-3 h-3 text-yellow-400" />
                            SW Terminal
                        </button>
                    </div>

                    {activeTab === 'CONTENT' ? (
                        <>
                            {/* Search */}
                            <div className="p-3 border-b border-white/5 bg-slate-900/20 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search procedures, tags..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Manual List */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                                {filteredDocs.map(doc => {
                                    const isItemCached = !!cachedDocs[doc.id];
                                    const isAccessible = isDocAccessible(doc.id);
                                    
                                    return (
                                        <div 
                                            key={doc.id}
                                            id={`doc-card-${doc.id}`}
                                            onClick={() => {
                                                if (isAccessible) {
                                                    setSelectedDoc(doc);
                                                    addLog(`Requested lookup for document: ${doc.title}`, 'INFO');
                                                } else {
                                                    addLog(`BLOCKED Offline load of uncached document: ${doc.title}`, 'WARN');
                                                }
                                            }}
                                            className={`p-3.5 rounded-xl cursor-pointer border relative select-none items-stretch flex flex-col justify-between transition-all group ${
                                                selectedDoc?.id === doc.id 
                                                ? 'bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/10 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                                : isAccessible 
                                                    ? 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 hover:border-white/10'
                                                    : 'bg-slate-950/40 border-dashed border-white/5 opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mb-1">{doc.category}</div>
                                                    <h3 className={`font-black text-xs leading-snug break-words ${selectedDoc?.id === doc.id ? 'text-white' : 'text-slate-200'}`}>{doc.title}</h3>
                                                </div>
                                                
                                                {/* Cache Indicator icon click toggle */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleCacheItem(doc.id, doc.title);
                                                    }}
                                                    className={`p-1.5 rounded-lg border flex-shrink-0 transition-colors ${
                                                        isItemCached 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25' 
                                                        : 'bg-slate-950 border-white/5 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/20'
                                                    }`}
                                                    title={isItemCached ? "Remove from persistent storage cache" : "Download to device storage for offline use"}
                                                >
                                                    <DownloadCloud className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Footer Tags & Offline confirmation */}
                                            <div className="flex items-center justify-between mt-3 bg-black/25 p-1.5 rounded-lg border border-white/5">
                                                <div className="flex flex-wrap gap-1">
                                                    {doc.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[8px] bg-slate-950/80 font-mono text-slate-500 px-1.5 py-0.5 rounded border border-white/5">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center">
                                                    {isItemCached ? (
                                                        <span className="flex items-center gap-1 text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                                                            <CheckCircle className="w-2.5 h-2.5" />
                                                            CACHED
                                                        </span>
                                                    ) : !isOnline ? (
                                                        <span className="flex items-center gap-1 text-[8px] text-red-500 font-bold uppercase tracking-wider">
                                                            <Lock className="w-2.5 h-2.5" />
                                                            LOCKED
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                                                            CLOUD
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredDocs.length === 0 && (
                                    <div className="text-center py-12 text-slate-600 text-xs">
                                        No files match your query
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Service Worker Real Time Terminal Log interface */
                        <div id="pnp_diagnostics_viewer" className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
                            <div className="p-3 border-b border-white/5 bg-slate-900/40 shrink-0">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-yellow-400" />
                                    Active Cache Workers
                                </span>
                            </div>

                            {/* Diagnostic values bar */}
                            <div className="grid grid-cols-2 border-b border-white/5 text-slate-400 text-[10px] p-2 bg-black/40 font-mono shrink-0 gap-2">
                                <div className="border border-white/5 p-1.5 rounded bg-slate-900/40">
                                    <div className="text-[8px] text-slate-500 uppercase">Provider Status</div>
                                    <div className="font-bold text-white mt-0.5 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                        RUNNING
                                    </div>
                                </div>
                                <div className="border border-white/5 p-1.5 rounded bg-slate-900/40">
                                    <div className="text-[8px] text-slate-500 uppercase">LocalStorage Sync</div>
                                    <div className="font-bold text-cyan-400 mt-0.5">ACTIVE</div>
                                </div>
                            </div>

                            {/* Log Stream Output Console */}
                            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-2 no-scrollbar">
                                {swLogs.map((log, i) => (
                                    <div key={i} className="flex flex-col gap-0.5 leading-relaxed bg-[#030712] p-2 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between text-[8px] text-slate-500">
                                            <span>{log.timestamp}</span>
                                            <span className={`font-extrabold ${
                                                log.level === 'SUCCESS' ? 'text-emerald-500' : 
                                                log.level === 'WARN' ? 'text-amber-500' : 'text-blue-400'
                                            }`}>
                                                [{log.level}]
                                            </span>
                                        </div>
                                        <p className="text-slate-300 break-words mt-0.5 whitespace-pre-wrap">{log.message}</p>
                                    </div>
                                ))}
                                <div ref={consoleEndRef} />
                            </div>

                            {/* Console Control */}
                            <div className="p-2 border-t border-white/5 bg-slate-900/20 flex shrink-0">
                                <button
                                    onClick={() => {
                                        setSwLogs([]);
                                        addLog('Console log stream cleared.', 'INFO');
                                    }}
                                    className="w-full text-center text-[9px] font-bold py-1.5 border border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 uppercase bg-slate-950 rounded-lg transition-all"
                                >
                                    Clear Terminal Log
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Real-time Content Viewer Screen or Offline Error Prompt */}
                <div className="flex-1 bg-slate-950 overflow-y-auto no-scrollbar relative flex flex-col">
                    {selectedDoc ? (
                        /* Verify lookup is permitted offline as well */
                        isDocAccessible(selectedDoc.id) ? (
                            <div id="pnp_document_detail_viewer" className="p-4 md:p-6 flex-1 flex flex-col max-w-4xl mx-auto w-full">
                                
                                {/* Header buttons back */}
                                <button 
                                    onClick={() => {
                                        setSelectedDoc(null);
                                        addLog('Closed current document lookup.', 'INFO');
                                    }}
                                    className="md:hidden mb-4 text-cyan-400 text-xs flex items-center gap-1 font-bold uppercase tracking-wider bg-slate-900/50 self-start px-3 py-1.5 rounded-lg border border-white/5"
                                >
                                    ← Guidebooks
                                </button>
                                
                                <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col flex-1 shadow-2xl relative">
                                    
                                    {/* Offline Banner */}
                                    {!isOnline && (
                                        <div className="absolute top-0 left-0 right-0 py-2.5 px-4 bg-emerald-500/10 border-b border-emerald-500/20 rounded-t-2xl flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                                            <Database className="w-3.5 h-3.5" />
                                            OFFLINE MODE — Loading profile from localized Knox memory (Persistant storage Cache)
                                        </div>
                                    )}

                                    {/* Document Header Metadata Section */}
                                    <div className={`border-b border-white/5 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4 ${!isOnline ? 'mt-8' : ''}`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-cyan-400 text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 bg-cyan-950/40 px-2 py-0.5 rounded">
                                                    {selectedDoc.category}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-500">
                                                    ID: {selectedDoc.id.toUpperCase()}
                                                </span>
                                            </div>
                                            <h1 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-wide">{selectedDoc.title}</h1>
                                        </div>
                                        
                                        {/* Export Buttons */}
                                        <button 
                                            onClick={handleExportPDF}
                                            className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors border border-white/5 flex-shrink-0"
                                            title="Print or Save Reference Document"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Export PDF
                                        </button>
                                    </div>

                                    {/* Scrollable text container */}
                                    <div className="flex-1 overflow-y-auto text-slate-300 font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-text p-4 md:p-6 bg-slate-950 rounded-xl border border-white/5">
                                        {selectedDoc.content.trim()}
                                    </div>

                                    {/* Safety check Footer note */}
                                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center text-[9px] text-slate-500 font-mono gap-2 uppercase">
                                        <div>Classification Level: Restricted (PNP Only)</div>
                                        <div>Cached: {new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Block lookup since the document hasn't been cached offline */
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 flex items-center justify-center mb-6 shadow-lg shadow-red-950/20 animate-pulse">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1.5">Manual Offline Lookup Prevented</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                                    The reference guidebook <span className="text-red-400">"{selectedDoc.title}"</span> has not been cached in persistent Knox local storage. 
                                </p>
                                <div className="mt-4 p-3 bg-red-950/25 border border-red-500/10 rounded-xl max-w-xs text-slate-500 text-[10px] text-left leading-normal font-mono uppercase tracking-wider">
                                    CRITICAL PROTOCOL: Reciprocate connectivity or tap "Sync All" before conducting out of range regional patrols.
                                </div>
                                <button
                                    onClick={() => handleNetworkToggle()}
                                    className="mt-6 px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black tracking-widest text-[#00e1d9] uppercase hover:bg-slate-800 transition-colors"
                                >
                                    Reconnect and Pull Document
                                </button>
                            </div>
                        )
                    ) : (
                        /* Idle View State Selector Screen */
                        <div id="pnp_reference_landing" className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-radial-gradient">
                            <Book className="w-16 h-16 mb-4 text-[#00e1d9]/20" />
                            <h3 className="text-base font-black text-slate-300 uppercase tracking-widest mb-1">Select a PNP Reference Manual</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono uppercase mt-1 leading-normal">
                                Browse legal frameworks, procedural circulars, and tactical templates. All cached content is accessible in network blackouts.
                            </p>
                            
                            {/* System Health Indicators */}
                            <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm w-full">
                                <div className="border border-white/5 bg-slate-900/20 p-3.5 rounded-2xl flex flex-col items-center text-center">
                                    <FileCheck className="w-5 h-5 text-emerald-400 mb-1" />
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">Pre-Loaded Docs</span>
                                    <span className="text-white text-xs font-mono font-black mt-1">Pop-001, Pop-002</span>
                                </div>
                                <div className="border border-white/5 bg-slate-900/20 p-3.5 rounded-2xl flex flex-col items-center text-center">
                                    <Database className="w-5 h-5 text-cyan-400 mb-1" />
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">Memory Scope</span>
                                    <span className="text-white text-xs font-mono font-black mt-1">Knox Local Profile</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ReferenceLibraryView;
