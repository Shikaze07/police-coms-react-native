import React, { useState, useRef } from 'react';
import { Inbox, Send, FileText, Trash2, Search, Plus, Star, ChevronLeft, X, Sparkles, Wand2, Menu, Paperclip } from 'lucide-react';
import { generateTextResponse } from './services/geminiService';

type Email = {
    id: string;
    sender: string;
    time: string;
    subject: string;
    snippet: string;
    unread: boolean;
    folder: 'inbox' | 'sent' | 'drafts' | 'trash';
    body?: string;
};

const INITIAL_EMAILS: Email[] = [
    { id: '1', sender: 'Dispatch', time: '10:45 AM', subject: 'Tactical Update: District 1', snippet: 'All units, please be advised of the upcoming tactical...', unread: true, folder: 'inbox', body: 'The upcoming tactical operation for District 1 has been scheduled for tomorrow at 06:00. All units must be briefed by 05:45 at the precinct. Ensure all equipment is checked and ready.' },
    { id: '2', sender: 'Forensic Lab', time: '09:20 AM', subject: 'Evidence Report: #FC-992', snippet: 'The analysis for the recovered item is complete. Please...', unread: false, folder: 'inbox', body: 'The analysis for the recovered item #FC-992 is complete. Preliminary results suggest a connection to recent vehicle thefts. Please refer to the attached detailed report for full findings.' },
    { id: '3', sender: 'HR Dept', time: 'Yesterday', subject: 'Training Schedule', snippet: 'Your training modules for next quarter have been...', unread: false, folder: 'sent', body: 'Your training modules for the next quarter have been finalized. Please ensure that you complete the mandatory coursework by the end of the month.' },
];

export const EmailView: React.FC = () => {
    const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
    const [activeFolder, setActiveFolder] = useState<Email['folder']>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    
    // AI State
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [draftBody, setDraftBody] = useState('');
    const [isImproving, setIsImproving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleSummarize = async () => {
        if (!selectedEmail?.body) return;
        setIsSummarizing(true);
        const result = await generateTextResponse(`Summarize the following email briefly:\n\n${selectedEmail.body}`);
        setSummary(result);
        setIsSummarizing(false);
    };

    const handleImproveDraft = async () => {
        setIsImproving(true);
        const result = await generateTextResponse(`Improve the tone and clarity of this email draft:\n\n${draftBody}`);
        setDraftBody(result);
        setIsImproving(false);
    };

    const filteredEmails = emails.filter(email => 
        email.folder === activeFolder && 
        (email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
         email.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleReadStatus = (id: string) => {
        setEmails(emails.map(e => e.id === id ? { ...e, unread: !e.unread } : e));
    };

    const deleteEmail = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEmails(emails.map(e => e.id === id ? { ...e, folder: 'trash' } : e));
        if (selectedEmail?.id === id) setSelectedEmail(null);
    };

    return (
        <div className="h-full flex text-slate-200">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-8 transform transition-transform duration-300 md:relative md:translate-x-0 md:top-0 top-16 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button onClick={() => setIsComposeOpen(true)} className="flex items-center gap-3 bg-blue-600/10 text-blue-400 w-full py-4 px-6 rounded-2xl font-semibold text-sm shadow-md hover:bg-blue-600/20 transition duration-200">
                    <Plus className="w-5 h-5" /> Compose
                </button>
                <nav className="space-y-1">
                    {[ {id: 'inbox', Icon: Inbox, label: 'Inbox', count: emails.filter(e => e.folder === 'inbox' && e.unread).length}, {id: 'sent', Icon: Send, label: 'Sent'}, {id: 'drafts', Icon: FileText, label: 'Drafts'}, {id: 'trash', Icon: Trash2, label: 'Trash'} ].map(item => (
                        <button key={item.id} onClick={() => { setActiveFolder(item.id as Email['folder']); setSelectedEmail(null); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center justify-between py-3 px-6 rounded-r-full text-sm transition-colors ${activeFolder === item.id ? 'bg-blue-900/40 text-blue-300 font-medium' : 'hover:bg-slate-800/50 text-slate-300'}`}>
                            <div className="flex items-center gap-4">
                                <item.Icon className="w-5 h-5" /> {item.label}
                            </div>
                            {item.count ? <span className="font-bold">{item.count}</span> : null}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Overlay for Mobile sidebar */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
            )}


            {/* Email List or Reader */}
            <div className="flex-1 flex flex-col bg-slate-950">
                <div className="h-20 border-b border-slate-800 flex items-center px-4 md:px-8 gap-4">
                    <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setIsMobileSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4 flex-1 bg-slate-900 rounded-full px-6 py-3 border border-slate-800 focus-within:border-blue-500 transition-colors shadow-inner">
                        <Search className="w-5 h-5 text-slate-500" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search mail" className="bg-transparent text-sm w-full outline-none" />
                    </div>
                </div>
                
                {selectedEmail ? (
                    <div className="p-10 max-w-4xl">
                        <div className="flex justify-between items-center mb-8">
                            <button onClick={() => setSelectedEmail(null)} className="flex items-center text-sm text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" /> Back to List
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => toggleReadStatus(selectedEmail.id)} className="text-sm px-4 py-2 rounded-full hover:bg-slate-800 transition">{selectedEmail.unread ? 'Mark as Read' : 'Mark as Unread'}</button>
                                <button onClick={(e) => deleteEmail(selectedEmail.id, e)} className="p-2 hover:bg-slate-800 rounded-full text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">{selectedEmail.subject}</h2>
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-10 border-b border-slate-800 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center font-bold text-lg text-blue-200">
                                    {selectedEmail.sender[0]}
                                </div>
                                <div>
                                    <strong className="text-white block text-base">{selectedEmail.sender}</strong>
                                    <span className="text-xs">to me</span>
                                </div>
                            </div>
                            <span>{selectedEmail.time}</span>
                        </div>
                        <div className="prose prose-invert max-w-none text-slate-300 text-lg leading-relaxed">
                            {selectedEmail.body}
                        </div>
                        
                        <div className="mt-12 border-t border-slate-800 pt-8">
                             <button onClick={handleSummarize} disabled={isSummarizing} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                 <Sparkles className="w-4 h-4" /> {isSummarizing ? 'Summarizing...' : 'Summarize with AI'}
                             </button>
                             {summary && (
                                 <div className="mt-6 p-6 bg-slate-900/50 rounded-2xl text-sm text-slate-300 border border-slate-800">
                                     <p className="font-bold text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-500" /> AI Summary:</p>
                                     {summary}
                                 </div>
                             )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {filteredEmails.length > 0 ? (
                            filteredEmails.map(email => (
                                <div key={email.id} className={`flex items-center border-b border-slate-800 px-4 md:px-8 py-4 cursor-pointer hover:bg-slate-900/50 group transition-colors ${email.unread ? 'bg-slate-900/30' : ''}`} onClick={() => { setSelectedEmail(email); if(email.unread) toggleReadStatus(email.id); }}>
                                    <Star className={`w-5 h-5 mr-4 md:mr-8 flex-shrink-0 ${email.unread ? 'text-yellow-500' : 'text-slate-600'}`} />
                                    <div className="flex flex-1 items-center gap-4 md:gap-8 min-w-0">
                                        <span className={`w-24 md:w-40 font-bold truncate ${email.unread ? 'text-white' : 'text-slate-400'}`}>{email.sender}</span>
                                        <span className={`flex-1 truncate ${email.unread ? 'text-white font-semibold' : 'text-slate-400'}`}>
                                            {email.subject} <span className="text-slate-500 font-normal hidden md:inline"> - {email.snippet}</span>
                                        </span>
                                    </div>
                                    <span className="text-sm text-slate-500 flex items-center gap-2 md:gap-6 flex-shrink-0">
                                        {email.time}
                                        <button onClick={(e) => deleteEmail(email.id, e)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"><Trash2 className="w-5 h-5" /></button>
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-slate-500">No emails found in this folder.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed top-16 inset-x-0 bottom-0 z-50 md:absolute md:inset-auto md:bottom-0 md:right-10 md:w-[500px] md:h-[550px] bg-slate-900 border-t md:border border-slate-700 shadow-2xl md:rounded-t-2xl flex flex-col overflow-hidden">
                    <div className="bg-white p-3 flex justify-between items-center md:rounded-t-2xl">
                        <span className="font-semibold text-slate-800 text-sm">New Message</span>
                        <button onClick={() => setIsComposeOpen(false)} className="text-slate-500 hover:text-slate-800"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 flex flex-col gap-4 flex-1">
                        <input type="text" placeholder="Recipients" className="w-full bg-transparent border-b border-slate-700 pb-2 text-sm focus:outline-none" />
                        <input type="text" placeholder="Subject" className="w-full bg-transparent border-b border-slate-700 pb-2 text-sm focus:outline-none" />
                        <textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} className="flex-1 bg-transparent resize-none outline-none text-sm" placeholder="Message body..." />
                        
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">
                                        {file.name}
                                        <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                            <div className="flex items-center gap-4">
                                <button onClick={handleImproveDraft} disabled={isImproving} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    <Wand2 className="w-4 h-4" /> {isImproving ? 'Improving...' : 'AI Assist'}
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-white">
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                            </div>
                            <button className="bg-blue-600 px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-500 transition-colors">Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default EmailView;