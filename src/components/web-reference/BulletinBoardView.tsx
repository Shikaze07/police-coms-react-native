
import React, { useState } from 'react';
import { Pin, Calendar as CalendarIcon, FileText, Search, Plus, Filter, Megaphone, AlertCircle, CheckCircle, Clock, MapPin, Tag, MoreHorizontal, ChevronLeft, ChevronRight, Bell, Trash2 } from 'lucide-react';

// --- TYPES ---
type NoticeCategory = 'ORDER' | 'ANNOUNCEMENT' | 'TRAINING' | 'LOST_FOUND' | 'EVENT';

interface BulletinNotice {
    id: string;
    title: string;
    content: string;
    author: string;
    date: string;
    category: NoticeCategory;
    isPinned?: boolean;
    acknowledged?: boolean;
    location?: string;
}

interface CalendarEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time: string;
    type: 'HQ' | 'PERSONAL';
    details?: string;
}

// --- MOCK DATA ---
const MOCK_NOTICES: BulletinNotice[] = [
    {
        id: 'n1',
        title: 'FULL ALERT STATUS: TYPHOON PREPARATION',
        content: 'All units are directed to be on standby for disaster response operations. Inspect all SAR equipment immediately. No leaves allowed effectively 1800H.',
        author: 'Chief of Police',
        date: 'Today, 08:00 AM',
        category: 'ORDER',
        isPinned: true,
        acknowledged: false
    },
    {
        id: 'n2',
        title: 'Annual Physical Fitness Test (PFT)',
        content: 'Schedule for 1st District personnel is moved to next Tuesday at Grandstand. Wear proper athletic uniform.',
        author: 'HRDD Admin',
        date: 'Yesterday, 14:30 PM',
        category: 'TRAINING',
        isPinned: true,
        acknowledged: true
    },
    {
        id: 'n3',
        title: 'Found: Black Leather Wallet',
        content: 'Recovered at City Hall checkpoint. Contains ID named "Juan Dela Cruz". Turn over to evidence custodian if claimed.',
        author: 'Patrolman Santos',
        date: 'Today, 10:15 AM',
        category: 'LOST_FOUND',
        location: 'Evidence Room B',
        acknowledged: false
    },
    {
        id: 'n4',
        title: 'Thanksgiving Mass',
        content: 'To be held at the station chapel this Friday. Attendance is encouraged but optional for duty personnel.',
        author: 'Chaplain Service',
        date: '2 Days Ago',
        category: 'EVENT',
        acknowledged: false
    },
    {
        id: 'n5',
        title: 'New Radio Protocols',
        content: 'Effective immediately, use the new 10-codes distributed in the briefing. Old codes regarding traffic stops are deprecated.',
        author: 'Comms Division',
        date: '3 Days Ago',
        category: 'ANNOUNCEMENT',
        acknowledged: false
    },
    {
        id: 'n6',
        title: 'Vehicle Maintenance Schedule',
        content: 'Mobile cars 10, 12, and 15 are scheduled for PMS this Thursday. Turn over keys to Motorpool.',
        author: 'Logistics',
        date: '4 Days Ago',
        category: 'ANNOUNCEMENT',
        acknowledged: false
    },
    {
        id: 'n7',
        title: 'Firearms Proficiency Test',
        content: 'Mandatory for all field personnel. Range is open 0800-1700H next week.',
        author: 'Training Div',
        date: '5 Days Ago',
        category: 'TRAINING',
        acknowledged: false
    }
];

const INITIAL_EVENTS: CalendarEvent[] = [
    { id: 'e1', title: 'Command Conference', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'HQ', details: 'Mandatory for all Section Chiefs' },
    { id: 'e2', title: 'Firearms Inspection', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '08:00', type: 'HQ', details: ' Logistics Office' },
    { id: 'e3', title: 'Court Hearing (Branch 12)', date: new Date(Date.now() + 172800000).toISOString().split('T')[0], time: '13:30', type: 'PERSONAL', details: 'Witness Duty' },
];

const CATEGORY_STYLES: Record<NoticeCategory, { color: string, bg: string, label: string, border: string }> = {
    'ORDER': { color: 'text-red-400', bg: 'bg-red-900/10', label: 'ORDER', border: 'border-red-500/50' },
    'ANNOUNCEMENT': { color: 'text-blue-400', bg: 'bg-blue-900/10', label: 'INFO', border: 'border-blue-500/50' },
    'TRAINING': { color: 'text-green-400', bg: 'bg-green-900/10', label: 'TRAINING', border: 'border-green-500/50' },
    'LOST_FOUND': { color: 'text-yellow-400', bg: 'bg-yellow-900/10', label: 'FOUND', border: 'border-yellow-500/50' },
    'EVENT': { color: 'text-purple-400', bg: 'bg-purple-900/10', label: 'EVENT', border: 'border-purple-500/50' },
};

// --- NOTICE CARD COMPONENT ---
const NoticeCard: React.FC<{ notice: BulletinNotice, onAcknowledge: (id: string, e: React.MouseEvent) => void }> = ({ notice, onAcknowledge }) => {
    const style = CATEGORY_STYLES[notice.category];
    return (
        <div className={`
            relative flex flex-col bg-slate-800 rounded-lg border transition-all hover:bg-slate-750 group
            ${notice.isPinned ? 'border-l-4 border-l-red-500 border-y-slate-700 border-r-slate-700 bg-slate-800/80' : 'border-slate-700'}
            ${notice.acknowledged ? 'opacity-70' : 'opacity-100'}
        `}>
            <div className="flex justify-between items-start p-3 pb-1">
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border ${style.bg} ${style.color} ${style.border}`}>
                        {style.label}
                    </span>
                    {notice.isPinned && <Pin className="w-3 h-3 text-red-500 fill-current" />}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                    {notice.date}
                </div>
            </div>
            <div className="px-3 py-1 flex-1">
                <h3 className={`font-bold text-xs mb-1 leading-snug ${notice.isPinned ? 'text-white' : 'text-slate-200'}`}>
                    {notice.title}
                </h3>
                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                    {notice.content}
                </p>
            </div>
            <div className="mt-2 p-3 pt-2 flex justify-between items-center border-t border-slate-700/50">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> {notice.author}
                    </span>
                </div>
                {notice.category === 'ORDER' ? (
                    <button 
                        onClick={(e) => onAcknowledge(notice.id, e)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold transition-colors border ${
                            notice.acknowledged 
                            ? 'bg-green-900/20 text-green-400 border-green-500/30' 
                            : 'bg-red-900/20 text-red-400 border-red-500/30 hover:bg-red-900/40'
                        }`}
                    >
                        {notice.acknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                    </button>
                ) : (
                    <button className="text-slate-500 hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

const BulletinBoardView: React.FC = () => {
    // Bulletin State
    const [filter, setFilter] = useState<NoticeCategory | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [notices, setNotices] = useState<BulletinNotice[]>(MOCK_NOTICES);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('08:00');

    // --- NOTICE HELPERS ---
    const toggleAcknowledge = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotices(prev => prev.map(n => n.id === id ? { ...n, acknowledged: !n.acknowledged } : n));
    };

    const filteredNotices = notices.filter(n => {
        const matchFilter = filter === 'ALL' || n.category === filter;
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    }).sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

    // --- CALENDAR HELPERS ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    const handleAddEvent = () => {
        if (!newEventTitle) return;
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title: newEventTitle,
            date: formatDateKey(selectedDate),
            time: newEventTime,
            type: 'PERSONAL',
            details: 'User added reminder'
        };
        setEvents([...events, newEvent]);
        setShowAddEvent(false);
        setNewEventTitle('');
    };

    const deleteEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 md:h-10 border border-slate-800/50 bg-slate-900/30"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const dateKey = formatDateKey(date);
            const dayEvents = events.filter(e => e.date === dateKey);
            const isSelected = formatDateKey(selectedDate) === dateKey;
            const isToday = formatDateKey(new Date()) === dateKey;

            days.push(
                <div 
                    key={d} 
                    onClick={() => setSelectedDate(date)}
                    className={`h-8 md:h-10 border border-slate-800 relative cursor-pointer hover:bg-slate-800 transition-colors flex flex-col items-center justify-center
                        ${isSelected ? 'bg-blue-900/20 shadow-inner' : 'bg-slate-900'}
                    `}
                >
                    <span className={`text-xs font-mono z-10 ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : isSelected ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                        {d}
                    </span>
                    
                    {/* Event Dots */}
                    <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                            <div 
                                key={i} 
                                className={`w-1 h-1 rounded-full ${ev.type === 'HQ' ? 'bg-purple-500' : 'bg-green-500'}`} 
                            />
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    const selectedDayEvents = events.filter(e => e.date === formatDateKey(selectedDate)).sort((a, b) => a.time.localeCompare(b.time));

    return (
        <div className="h-full bg-slate-950 flex flex-col md:flex-row overflow-hidden">
            
            {/* --- LEFT PANEL: NOTICES (70%) --- */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950 order-2 md:order-1">
                {/* Header */}
                <div className="bg-slate-900 border-b border-slate-800 p-2 md:p-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500/20 text-purple-500 rounded-lg flex items-center justify-center border border-purple-500/30">
                            <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="font-black text-white text-sm tracking-tight">POLICE BLOTTER</h1>
                            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Official Notices</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 max-w-xs mx-4 relative hidden md:block">
                        <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search notices..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-7 pr-4 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all">
                        <Plus className="w-3 h-3" /> <span className="hidden sm:inline">POST</span>
                    </button>
                </div>

                {/* Filter Chips */}
                <div className="bg-slate-900/50 border-b border-slate-800 px-2 py-1 overflow-x-auto shrink-0 no-scrollbar">
                    <div className="flex gap-1.5 min-w-max">
                        {(['ALL', 'ORDER', 'ANNOUNCEMENT', 'TRAINING', 'LOST_FOUND', 'EVENT'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all border ${
                                    filter === cat 
                                    ? 'bg-slate-200 text-slate-900 border-white' 
                                    : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-600 hover:text-slate-300'
                                }`}
                            >
                                {cat.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Tiled Grid - Notices */}
                <div className="flex-1 overflow-y-auto p-3 bg-grid-pattern">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
                        {filteredNotices.map(notice => (
                            <NoticeCard key={notice.id} notice={notice} onAcknowledge={toggleAcknowledge} />
                        ))}
                        
                        <button className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-colors gap-2 min-h-[120px]">
                            <Plus className="w-6 h-6 opacity-50" />
                            <span className="text-[10px] font-bold uppercase">New Entry</span>
                        </button>
                    </div>

                    {filteredNotices.length === 0 && (
                        <div className="text-center py-20 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-xs">No notices found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT PANEL: CALENDAR (30%) --- */}
            <div className="w-full md:w-[30%] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-full shrink-0 order-1 md:order-2">
                {/* Calendar Header */}
                <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-850">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-sm text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-2">
                    <div className="grid grid-cols-7 mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-[10px] font-bold text-center text-slate-500">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 border-t border-l border-slate-800">
                        {renderCalendarGrid()}
                    </div>
                </div>

                {/* Schedule List */}
                <div className="flex-1 flex flex-col border-t border-slate-800 min-h-0">
                    <div className="p-3 bg-slate-900/50 flex justify-between items-center border-b border-slate-800">
                        <div className="text-xs font-bold text-slate-400 uppercase">
                            {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <button 
                            onClick={() => setShowAddEvent(true)}
                            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 font-bold"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-950">
                        {selectedDayEvents.length === 0 && (
                            <div className="text-center py-8 text-slate-600 italic text-xs">No scheduled activities</div>
                        )}
                        {selectedDayEvents.map(event => (
                            <div key={event.id} className={`p-2 rounded border-l-2 flex gap-3 group ${event.type === 'HQ' ? 'bg-purple-900/10 border-purple-500' : 'bg-green-900/10 border-green-500'}`}>
                                <div className="flex flex-col items-center justify-center px-1">
                                    <span className="text-[10px] font-mono text-slate-400">{event.time}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <div className={`text-xs font-bold truncate ${event.type === 'HQ' ? 'text-purple-300' : 'text-green-300'}`}>
                                            {event.title}
                                        </div>
                                        {event.type === 'PERSONAL' && (
                                            <button onClick={() => deleteEvent(event.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-slate-500 truncate flex items-center gap-1">
                                        {event.type === 'HQ' ? <Megaphone className="w-2.5 h-2.5" /> : <Bell className="w-2.5 h-2.5" />}
                                        {event.type === 'HQ' ? 'HQ Pushed' : 'Personal Reminder'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Event Modal Overlay */}
                {showAddEvent && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 w-full max-w-xs shadow-2xl">
                            <h3 className="text-sm font-bold text-white mb-3">Add Personal Event</h3>
                            <input 
                                type="text" 
                                placeholder="Event Title" 
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white mb-2 focus:border-blue-500 outline-none"
                                autoFocus
                            />
                            <input 
                                type="time" 
                                value={newEventTime}
                                onChange={(e) => setNewEventTime(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white mb-4 focus:border-blue-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowAddEvent(false)} className="flex-1 bg-slate-700 text-slate-300 py-1.5 rounded text-xs font-bold">Cancel</button>
                                <button onClick={handleAddEvent} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default BulletinBoardView;
