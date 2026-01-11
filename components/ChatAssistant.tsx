import React, { useState, useRef, useEffect } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { sendChatMessage } from "../services/geminiService";
import { ChatMessage, AnalysisResult } from "../types";

interface ChatAssistantProps {
  analysisResult: AnalysisResult | null;
  userPlan: 'free' | 'hustler' | 'manager' | 'owner';
  onUpgrade: () => void;
}

// Fair Usage Limits per Plan
const PLAN_LIMITS = {
  free: 0,
  hustler: 2000,
  manager: 2000,
  owner: 2000
};

const ChatAssistant: React.FC<ChatAssistantProps> = ({ analysisResult, userPlan, onUpgrade }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hello! I am FlipAI Assistant. Need help analyzing a niche or vetting a supplier?', timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Track usage
  const [messageCount, setMessageCount] = useState(() => {
    try {
      const savedCount = localStorage.getItem("flipai_chat_count");
      return savedCount ? parseInt(savedCount, 10) : 0;
    } catch {
      return 0;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if feature is locked for Free Plan
  const isLocked = userPlan === 'free';
  const usageLimit = PLAN_LIMITS[userPlan] || 2000;
  
  // Notify user when context changes
  useEffect(() => {
    if (analysisResult) {
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          role: 'model', 
          text: `I've reviewed the analysis for "${analysisResult.productName}". I can help you evaluate the risks of the ${analysisResult.options.length} sourcing options found.`, 
          timestamp: Date.now() 
        }
      ]);
      if (!isOpen) setIsOpen(true);
    }
  }, [analysisResult]);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLocked) return;

    // Enforce Fair Usage Policy
    if (messageCount >= usageLimit) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `⚠️ Plan Limit Reached. You have used your ${usageLimit.toLocaleString()} messages for this billing cycle. Please renew your plan or wait till the end of the cycle to continue chatting.`,
        timestamp: Date.now()
      }]);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Update Usage Count
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("flipai_chat_count", newCount.toString());

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text, analysisResult);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all z-50 ${
          isOpen 
            ? "bg-red-600 rotate-90 text-white" 
            : isLocked 
              ? "bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-slate-500" 
              : "bg-[#00F0FF] hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : isLocked ? (
           <div className="relative">
             <ChatBubbleLeftRightIcon className="w-6 h-6 opacity-50" />
             <LockClosedIcon className="w-4 h-4 absolute -top-1 -right-1 text-amber-400 drop-shadow-md" />
           </div>
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-[#121212] rounded-2xl shadow-2xl border border-white/10 flex flex-col z-50 overflow-hidden animate-slide-up">
          
          {/* Header */}
          <div className="bg-[#1a1a1a] p-3 text-white border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#00F0FF]" />
              FlipAI Assistant
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a] scrollbar-hide relative">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#00F0FF] text-black rounded-br-none shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-[#1a1a1a] text-slate-200 border border-white/10 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] p-3 rounded-2xl rounded-bl-none text-xs text-slate-500 italic animate-pulse border border-white/5">
                  AI is thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-[#121212] border-t border-white/10 flex gap-2 relative">
            
            {/* Locked Overlay */}
            {isLocked && (
              <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                 <LockClosedIcon className="w-6 h-6 text-slate-500 mb-2" />
                 <p className="text-xs font-bold text-slate-400 mb-4">Upgrade to Hustler plan to unlock AI Assistant.</p>
                 <button 
                   type="button"
                   onClick={onUpgrade}
                   className="bg-[#00F0FF] text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                 >
                   Upgrade Now
                 </button>
              </div>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isLocked ? "Upgrade to unlock..." : "Ask about suppliers..."}
              disabled={isLocked}
              className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-[#00F0FF] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping || isLocked}
              className="p-2 bg-[#00F0FF] text-black rounded-full hover:bg-cyan-300 disabled:opacity-30 disabled:bg-slate-700"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;