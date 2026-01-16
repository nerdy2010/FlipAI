import React, { useState, useEffect } from "react";
import { KeyIcon, XMarkIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, GlobeAltIcon } from "@heroicons/react/24/solid";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState("");
  const [serpApiKey, setSerpApiKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showSerp, setShowSerp] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem("flipai_gemini_key") || "AIzaSyDaWfbisNtD8P48sRrs9vSZgfmuLhzOMG4");
      // Use Golden Key as default placeholder if empty
      setSerpApiKey(localStorage.getItem("flipai_serpapi_key") || "6356977b9b475b6cbcf836afd7b153556f1f706c8eb709d5d4427b3bbbcac870");
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("flipai_gemini_key", geminiKey);
    localStorage.setItem("flipai_serpapi_key", serpApiKey);
    
    // Explicitly clean up old providers if they exist
    localStorage.removeItem("flipai_valueserp_key");
    
    window.dispatchEvent(new Event("storage"));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#121212] border border-[#00F0FF]/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,240,255,0.1)] relative overflow-hidden">
        
        {/* Decorative Header Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-[#00F0FF]" />
              System Configuration
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Gemini Key Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Core AI API Key (Required)
              </label>
              <div className="relative group">
                <input
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter API Key..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] outline-none transition-all font-mono text-sm"
                />
                <button
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                  {showGemini ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* SerpApi Key Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    SerpApi Key
                    <span className="text-[#00F0FF] text-[10px] bg-cyan-950/50 px-2 py-0.5 rounded border border-[#00F0FF]/20">ACTIVE</span>
                 </label>
                 <a 
                   href="https://serpapi.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-[10px] text-[#00F0FF] hover:underline flex items-center gap-1"
                 >
                    Get Key <GlobeAltIcon className="w-3 h-3" />
                 </a>
              </div>
              <div className="relative group">
                <input
                  type={showSerp ? "text" : "password"}
                  value={serpApiKey}
                  onChange={(e) => setSerpApiKey(e.target.value)}
                  placeholder="Enter SerpApi Key..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] outline-none transition-all font-mono text-sm"
                />
                <button
                  onClick={() => setShowSerp(!showSerp)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                  {showSerp ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Using SerpApi for Global Search and Lens capabilities.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2 ${
                saved 
                  ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                  : "bg-[#00F0FF] hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
              }`}
            >
              {saved ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Configuration Saved
                </>
              ) : (
                "Save Keys"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;