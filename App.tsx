import React, { useState, useEffect } from "react";
import InputSection from "./components/InputSection";
import ResultsDisplay from "./components/ResultsDisplay";
import ChatAssistant from "./components/ChatAssistant";
import PricingSection from "./components/PricingSection";
import { Logo } from "./components/Logo"; 
import { findCheaperProducts } from "./services/geminiService";
import { AnalysisResult } from "./types";
import { ArrowPathIcon, ShieldCheckIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for Plans and Credits with Persistence
  const [userPlan, setUserPlan] = useState<'free' | 'hustler' | 'manager' | 'owner'>(() => {
    return (localStorage.getItem("flipai_user_plan") as any) || 'free';
  });
  
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem("flipai_credits");
    return saved ? parseInt(saved, 10) : 3;
  });
  
  const [currentView, setCurrentView] = useState<'home' | 'pricing'>('home');

  // Check Subscription Expiry on Mount
  useEffect(() => {
    const checkSubscriptionStatus = () => {
      const planStartStr = localStorage.getItem("flipai_plan_start_date");
      if (userPlan !== 'free' && planStartStr) {
        const planStart = parseInt(planStartStr, 10);
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        if (now - planStart > thirtyDaysMs) {
          setUserPlan('free');
          localStorage.setItem("flipai_user_plan", 'free');
        }
      }
    };
    checkSubscriptionStatus();
  }, [userPlan]);

  // Persist credits & plan
  useEffect(() => { localStorage.setItem("flipai_credits", credits.toString()); }, [credits]);
  useEffect(() => { localStorage.setItem("flipai_user_plan", userPlan); }, [userPlan]);

  const handleAnalyze = async (image: string | null, text: string, url: string, price: string) => {
    if (credits <= 0) {
      setError("You are out of credits. Please upgrade your plan.");
      setCurrentView('pricing');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Direct call to reconstructed service
      const result = await findCheaperProducts(image, text, url, price);
      
      if (!result.options || result.options.length === 0) {
        throw new Error("No suppliers found. Try adding more details or a clearer image.");
      }

      setAnalysisResult(result);
      setCredits(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlanSelect = (newCredits: number, planIdOrName: string) => {
    setCredits(newCredits);
    let selectedPlan: 'free' | 'hustler' | 'manager' | 'owner' = 'free';
    const input = planIdOrName.toLowerCase();

    if (input.includes("hustler")) selectedPlan = 'hustler';
    else if (input.includes("manager")) selectedPlan = 'manager';
    else if (input.includes("owner")) selectedPlan = 'owner';
    else selectedPlan = 'free';

    setUserPlan(selectedPlan);
    if (selectedPlan !== 'free') {
        const now = Date.now();
        localStorage.setItem("flipai_plan_start_date", now.toString());
    }
    setError(null);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans text-slate-200">
      
      {/* Header */}
      <header className="bg-[#050505]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="flex items-center gap-3">
                <Logo className="h-10 w-10 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                <span className="text-xl font-bold tracking-tighter text-white">
                  Flip<span className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">AI</span>
                </span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div onClick={() => setCurrentView('pricing')} className="hidden sm:flex items-center space-x-4 cursor-pointer group">
               <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Plan</div>
                  <div className="text-sm font-bold text-[#00F0FF] capitalize">{userPlan}</div>
               </div>
               <div className="h-8 w-px bg-white/10"></div>
               <div className="flex items-center space-x-2 bg-[#121212] px-4 py-1.5 rounded-full border border-white/10 group-hover:border-[#00F0FF]/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${credits > 0 ? 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-semibold text-slate-300">{credits} Credits</span>
               </div>
            </div>
            <button onClick={() => setCurrentView('pricing')} className="text-sm font-bold text-black bg-[#00F0FF] px-4 py-2 rounded-lg hover:bg-cyan-300 transition-colors flex items-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <CurrencyDollarIcon className="w-4 h-4 mr-1" />
              Pricing
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {currentView === 'pricing' ? (
          <PricingSection onSelectPlan={handlePlanSelect} onClose={() => setCurrentView('home')} />
        ) : (
          <div className="max-w-4xl mx-auto">
            {!analysisResult && (
              <div className="text-center mb-12">
                <div className="inline-flex items-center space-x-2 bg-cyan-950/30 text-[#00F0FF] px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-[#00F0FF]/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Powered by Neural Vision & Deep Search</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                  Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-cyan-500">Factory.</span> Cut the Cost.
                </h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Upload any product image. Our AI will identify the exact model and find the direct factory suppliers instantly.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center animate-fade-in">
                 <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            {!analysisResult ? (
              <InputSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
            ) : (
              <div className="space-y-6">
                 <button 
                   onClick={() => setAnalysisResult(null)}
                   className="flex items-center text-sm font-bold text-slate-500 hover:text-[#00F0FF] transition-colors"
                 >
                   <ArrowPathIcon className="w-4 h-4 mr-1" />
                   New Search
                 </button>
                 <ResultsDisplay result={analysisResult} />
              </div>
            )}
          </div>
        )}
      </main>

      <ChatAssistant 
        analysisResult={analysisResult} 
        userPlan={userPlan} 
        onUpgrade={() => setCurrentView('pricing')}
      />

    </div>
  );
};

export default App;