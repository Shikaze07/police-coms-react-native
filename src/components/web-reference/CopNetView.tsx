
import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { Users, Calendar, Megaphone, Newspaper, ShoppingBag, ThumbsUp, MessageSquare, Share2, PlusCircle, Image as ImageIcon, Video, Search, Bell, X, Heart, Laugh, ThumbsDown, Flag } from 'lucide-react';

// Mock data structures
interface Comment {
    id: number;
    author: string;
    text: string;
    reactions: Record<string, number>;
    replies: Comment[];
}

interface Post {
    id: number;
    author: string;
    time: string;
    content: string;
    reactions: Record<string, number>;
    comments: Comment[];
    media: { url: string; type: 'image' | 'video' } | null;
}

const MOCK_POSTS: Post[] = [
    { 
        id: 1, 
        author: 'Sovereign Administrator', 
        time: 'Just now', 
        content: 'System fully deployed. Welcome to the POLICECOMS AI Super App. All secure tactical channels are now online and synchronized.', 
        reactions: { like: 0, support: 0, acknowledge: 0 }, 
        media: null,
        comments: []
    }
];

const MOCK_NEWS = [
    { title: 'POLICECOMS AI Super App Version 3.1 Live', source: 'System Announcement', thumb: 'https://ui-avatars.com/api/?name=POLICECOMS&background=0f172a&color=22d3ee', category: 'Operational' }
];

const CommentComponent: React.FC<{ comment: Comment }> = ({ comment }) => {
    const [showReply, setShowReply] = useState(false);

    return (
        <div className="space-y-2 mt-3 pl-4 border-l border-slate-800">
            <div className="bg-slate-900 p-3 rounded-lg">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300">{comment.author}</span>
                </div>
                <p className="text-sm text-slate-200">{comment.text}</p>
                
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex gap-2">
                        <button className="text-slate-500 hover:text-cyan-400"><ThumbsUp className="w-3 h-3" /></button>
                        <button className="text-slate-500 hover:text-red-400"><Heart className="w-3 h-3" /></button>
                        <button className="text-slate-500 hover:text-yellow-400"><Laugh className="w-3 h-3" /></button>
                        <button className="text-slate-500 hover:text-slate-200"><ThumbsDown className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => setShowReply(!showReply)} className="text-[10px] text-slate-500 hover:text-cyan-400">Reply</button>
                </div>

                {showReply && (
                    <input className="w-full mt-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs" placeholder="Write a reply..." />
                )}
            </div>
            
            {comment.replies.map(reply => (
                <CommentComponent key={reply.id} comment={reply} />
            ))}
        </div>
    );
};

const RESTRICTED_KEYWORDS = ['bullying', 'pornography', 'anti-government', 'racist'];

const isContentAppropriate = (content: string) => {
    return !RESTRICTED_KEYWORDS.some(keyword => content.toLowerCase().includes(keyword));
};

const CopNetView: React.FC = () => {
    const [likesEnabled, setLikesEnabled] = useState(true);
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filter, setFilter] = useState<'ALL' | 'NEWS' | 'EVENTS'>('ALL');
    const [newsFilter, setNewsFilter] = useState<'ALL' | 'Operational' | 'General' | 'Community'>('ALL');
    
    // MODERATION PIPELINE
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [moderationQueue, setModerationQueue] = useState<Post[]>([]);
    const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
    
    // Toggle comments visibility
    const toggleComments = (postId: number) => {
        setExpandedPosts(prev => {
            const next = new Set(prev);
            if (next.has(postId)) {
                next.delete(postId);
            } else {
                next.add(postId);
            }
            return next;
        });
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'ALL') return true;
        // Assuming some logic to map post type/category to filter
        // Just keeping it simple based on the existing filter state
        return true; 
    });

    const handlePost = () => {
        const content = (document.querySelector('input[placeholder="Post an update for the precinct..."]') as HTMLInputElement)?.value;
        if (!content) return;
        
        const newPost: Post = {
            id: Date.now(),
            author: 'Current Officer',
            time: 'Just now',
            content,
            reactions: { like: 0, support: 0, acknowledge: 0 },
            comments: [],
            media: selectedMedia
        };

        if (isContentAppropriate(content)) {
            setPosts([newPost, ...posts]);
            setSelectedMedia(null);
            (document.querySelector('input[placeholder="Post an update for the precinct..."]') as HTMLInputElement).value = '';
        } else {
            setModerationQueue([newPost, ...moderationQueue]);
            alert('Violation detected! Post flagged and forwarded to the Command Center moderation queue.');
        }
    };
    
    const handleMediaSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const url = URL.createObjectURL(file);
        setSelectedMedia({ url, type });
    };

    return (
        <div className="h-full w-full bg-slate-950 text-slate-200 overflow-y-auto p-4 md:p-6 font-sans">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Sidebar Left */}
                <div className="md:col-span-3 space-y-4">
                    <div className="glass-panel p-4 rounded-xl border border-white/5 shadow-lg shadow-black/50">
                        <h3 className="text-xs font-bold text-slate-500 mb-3 tracking-wider">NAVIGATOR</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                             <div className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer"><Users className="w-4 h-4 text-cyan-600" /> Friends</div>
                             <div className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer"><Calendar className="w-4 h-4 text-cyan-600" /> Events</div>
                             <div className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer"><ShoppingBag className="w-4 h-4 text-cyan-600" /> Marketplace</div>
                             <div className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer"><ImageIcon className="w-4 h-4 text-cyan-600" /> Albums</div>
                        </div>
                    </div>
                    
                    <div className="glass-panel p-4 rounded-xl border border-white/5 shadow-lg shadow-black/50">
                        <h3 className="text-xs font-bold text-slate-500 mb-3 tracking-wider flex items-center gap-2"><Bell className="w-4 h-4"/> NOTIFICATIONS</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <label className="flex flex-col cursor-pointer gap-1">
                                <span className="text-slate-300">New Likes</span>
                                <input type="checkbox" checked={likesEnabled} onChange={e => setLikesEnabled(e.target.checked)} className="accent-cyan-600" />
                            </label>
                            <label className="flex flex-col cursor-pointer gap-1">
                                <span className="text-slate-300">New Comments</span>
                                <input type="checkbox" checked={commentsEnabled} onChange={e => setCommentsEnabled(e.target.checked)} className="accent-cyan-600" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Feed Center */}
                <div className="md:col-span-6 space-y-6">
                    {/* Post Filter */}
                     <div className="flex gap-2">
                        {(['ALL', 'NEWS', 'EVENTS'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-900 text-slate-500'}`}>{f}</button>
                        ))}
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-3">
                        <div className='flex gap-3'>
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"></div>
                            <input className="flex-1 bg-slate-900 border border-white/10 rounded-full px-4 text-sm" placeholder="Post an update for the precinct..." />
                        </div>
                        {selectedMedia && (
                            <div className="relative w-full h-32 rounded-lg mt-2 overflow-hidden border border-white/10">
                                {selectedMedia.type === 'image' ? (
                                    <img src={selectedMedia.url} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={selectedMedia.url} className="w-full h-full object-cover" muted />
                                )}
                                <button onClick={() => setSelectedMedia(null)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"><X className="w-4 h-4 text-white" /></button>
                            </div>
                        )}
                        <div className='flex justify-between items-center'>
                            <input type="file" ref={fileInputRef} onChange={handleMediaSelection} className="hidden" accept="image/*,video/*" />
                            <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-xs">
                                <ImageIcon className="w-4 h-4" /> Add Photo/Video
                            </button>
                            <button onClick={handlePost} className="bg-cyan-700 hover:bg-cyan-600 px-4 py-2 rounded-full text-xs font-bold font-tech flex items-center gap-2"><PlusCircle className="w-4 h-4" /> POST</button>
                        </div>
                    </div>

                    {filteredPosts.map(post => (
                        <motion.div key={post.id} whileHover={{ scale: 1.01 }} className="bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <div className='flex items-center gap-3'>
                                    <div className="w-10 h-10 rounded-full bg-slate-800"></div>
                                    <span className="text-sm font-semibold text-slate-200">{post.author}</span>
                                </div>
                                <span className="text-[10px] text-slate-500">{post.time}</span>
                            </div>
                            <div className="text-sm text-slate-300 leading-relaxed [&>strong]:font-bold [&>em]:italic">
                                <ReactMarkdown>{post.content}</ReactMarkdown>
                            </div>
                            {post.media && post.media.type === 'image' && (
                                <img 
                                    src={post.media.url} 
                                    alt="post-media" 
                                    className="rounded-xl w-full h-64 object-cover border border-white/5" 
                                />
                            )}
                            {post.media && post.media.type === 'video' && (
                                <video 
                                    src={post.media.url} 
                                    className="rounded-xl w-full h-64 object-cover border border-white/5" 
                                    controls
                                />
                            )}
                            <div className="flex gap-4 pt-3 border-t border-slate-800 text-slate-500 text-xs flex-wrap">
                                <button className="flex items-center gap-1 hover:text-cyan-400 font-bold"><ThumbsUp className="w-4 h-4" /> ({post.reactions.like || 0})</button>
                                <button className="flex items-center gap-1 hover:text-green-400 font-bold"><Heart className="w-4 h-4" /> ({post.reactions.support || 0})</button>
                                <button className="flex items-center gap-1 hover:text-blue-400 font-bold"><Megaphone className="w-4 h-4" /> ({post.reactions.acknowledge || 0})</button>
                                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 hover:text-cyan-400 font-bold ml-auto"><MessageSquare className="w-4 h-4" /> ({post.comments.length})</button>
                                <button className="flex items-center gap-1 hover:text-cyan-400 font-bold"><Share2 className="w-4 h-4" /> Share</button>
                                <button onClick={() => alert('Post flagged for moderation.')} className="flex items-center gap-1 hover:text-red-500 font-bold"><Flag className="w-4 h-4" /> Report</button>
                            </div>
                            
                            {/* Comments Thread */}
                            {expandedPosts.has(post.id) && post.comments.length > 0 && (
                                <div className="pt-2 border-t border-slate-800">
                                    {post.comments.map(comment => (
                                        <CommentComponent key={comment.id} comment={comment} />
                                    ))}
                                </div>
                            )}
                             {/* Moderation Footer */}
                            <div className="px-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-600">
                                <span>CopNet Secure Feed</span>
                                <span className='text-amber-600'>Moderated for compliance</span>
                            </div>
                        </motion.div>
                    ))}
                </div>


                {/* Rightbar News/Ads */}
                <div className="md:col-span-3 space-y-6">
                    <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 tracking-wider"><Newspaper className="w-4 h-4" /> NATIONAL NEWS</h3>
                        </div>
                        <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
                            {(['ALL', 'Operational', 'General', 'Community'] as const).map(c => (
                                <button key={c} onClick={() => setNewsFilter(c)} className={`px-2 py-1 rounded-full font-medium ${newsFilter === c ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-500'}`}>{c}</button>
                            ))}
                        </div>
                        {MOCK_NEWS.filter(n => newsFilter === 'ALL' || n.category === newsFilter).map((n, i) => (
                            <div key={i} className="flex gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition">
                                <img src={n.thumb} alt="thumb" className="w-12 h-12 rounded object-cover" />
                                <div className='flex-1'>
                                    <p className="text-xs font-semibold text-slate-200 leading-snug">{n.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{n.source}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="glass-panel p-4 rounded-xl border border-white/5">
                        <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-3 tracking-wider"><Megaphone className="w-4 h-4" /> SPONSORED</h3>
                        <div className="text-xs text-slate-400">Exclusive Tactical Gear Discount for all verified PNP Personnel.</div>
                        <button className="mt-4 w-full bg-slate-800 py-2 rounded text-xs hover:bg-slate-700">View Offers</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CopNetView;
