import React, { useState } from 'react';
import { Brain, Send, Star, FileText } from 'lucide-react';
import { generateTextResponse } from './services/geminiService';

interface Message {
  sender: 'AI' | 'USER';
  text: string;
  isKeyStatement?: boolean;
}

const WitnessInterviewView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([{
        sender: 'AI',
        text: "I am the Witness Interview AI. I have been initialized to conduct forensic interviews. Please begin questioning the witness."
    }]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        
        const userMsg: Message = { sender: 'USER', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        const prompt = `You are a witness in a crime scene investigation. Respond to the following question. Keep it concise, professional, and slightly distressed as a witness would be.
Question: "${input}"`;

        const response = await generateTextResponse(prompt);
        setMessages(prev => [...prev, { sender: 'AI', text: response }]);
        setIsThinking(false);
    };

    const toggleKeyStatement = (index: number) => {
        setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, isKeyStatement: !msg.isKeyStatement } : msg));
    };

    return (
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
            <h2 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-500" /> AI Witness Interview
            </h2>
            
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-2xl">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`p-4 rounded-lg ${msg.sender === 'AI' ? 'bg-slate-800 text-slate-200' : 'bg-purple-900/30 text-white ml-auto max-w-[80%]'}`}>
                            <p className="text-sm">{msg.text}</p>
                            {msg.sender === 'AI' && (
                                <button onClick={() => toggleKeyStatement(i)} className={`mt-2 flex items-center gap-1 ${msg.isKeyStatement ? 'text-yellow-400' : 'text-slate-500'}`}>
                                    <Star className="w-4 h-4" /> {msg.isKeyStatement ? 'Unpin' : 'Pin as Key Statement'}
                                </button>
                            )}
                        </div>
                    ))}
                    {isThinking && <div className="text-slate-500 text-xs italic">Witness is thinking...</div>}
                </div>
                <div className="flex gap-2">
                    <input 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        className="flex-1 bg-slate-950 p-3 text-white border border-slate-700 rounded-lg text-sm"
                        placeholder="Ask witness a question..."
                    />
                    <button onClick={handleSendMessage} className="bg-purple-600 p-3 rounded-lg"><Send className="w-5 h-5 text-white" /></button>
                </div>
            </div>
        </div>
    );
};

export default WitnessInterviewView;
