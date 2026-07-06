import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, X, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QuickNoteWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('quick-note-content');
        if (saved) setContent(saved);
    }, []);

    const saveNote = (newContent: string) => {
        setContent(newContent);
        localStorage.setItem('quick-note-content', newContent);
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="relative z-[5000]">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`absolute top-12 right-0 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col ${isCollapsed ? 'h-12 w-64' : 'h-64 w-72'}`}
                    >
                        <div className="bg-slate-950 p-3 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                                <StickyNote className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Quick Note</span>
                                {isSaving && <Save className="w-3 h-3 text-emerald-500 animate-pulse" />}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-500 hover:text-white">
                                    {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-red-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {!isCollapsed && (
                            <textarea
                                value={content}
                                onChange={(e) => saveNote(e.target.value)}
                                className="flex-1 w-full bg-slate-900 p-3 text-xs text-slate-300 resize-none focus:outline-none placeholder-slate-600 border-none"
                                placeholder="Jot down observations..."
                            />
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>
            
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title="Quick Note"
            >
                <StickyNote className="w-5 h-5" />
            </button>
        </div>
    );
};
