import React, { useState } from "react";
import { AnalysisResult, ProductOption } from "../types";
import { 
  ArrowTopRightOnSquareIcon, 
  StarIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/solid";

interface ResultsDisplayProps {
  result: AnalysisResult | null; // Allow null to be safe
}

// CRASH-PROOF PRODUCT CARD
const ProductCard: React.FC<{ option: ProductOption; targetPrice: number }> = ({ option, targetPrice }) => {
  const [imgError, setImgError] = useState(false);

  // Safety Check: If option is somehow null/undefined, return nothing
  if (!option) return null;

  const isDeepSearch = (option.url || "").includes("search") || (option.url || "").includes("wholesale");
  
  // --- SAFE MATH (Crash-Proof) ---
  // 1. Safe Target Parsing
  let target = 0;
  try {
     const rawTarget = targetPrice !== undefined && targetPrice !== null ? String(targetPrice) : '0';
     target = parseFloat(rawTarget.replace(/[^0-9.]/g, '') || '0');
  } catch (e) {
     target = 0;
  }

  // 2. Safe Price Parsing
  let found = 0;
  try {
      if (option.price !== undefined && option.price !== null) {
          const rawPrice = String(option.price);
          found = parseFloat(rawPrice.replace(/[^0-9.]/g, '') || '0');
      }
  } catch (e) {
      found = 0;
  }

  // 3. Calculation
  const profit = target - found;
  const isProfitable = profit > 0;
  const showProfit = target > 0 && found > 0;

  return (
    <div className="bg-[#121212] rounded-xl shadow-lg border border-white/5 overflow-hidden flex flex-col h-full hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:border-[#00F0FF]/40 transition-all duration-300 group">
      
      {/* Clickable Image (Only if URL exists) */}
      {option.url ? (
        <a 
          href={option.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full h-48 overflow-hidden relative bg-[#0a0a0a]"
        >
          {!imgError && option.image ? (
            <img 
              src={option.image} 
              alt={option.description || "Product"} 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-[#0a0a0a]">
               <ShoppingBagIcon className="w-12 h-12 text-slate-800" />
            </div>
          )}
        </a>
      ) : (
         <div className="w-full h-48 overflow-hidden relative bg-[#0a0a0a] flex items-center justify-center">
            {!imgError && option.image ? (
              <img 
                src={option.image} 
                alt={option.description || "Product"} 
                onError={() => setImgError(true)}
                className="w-full h-full object-cover opacity-90" 
              />
            ) : (
              <ShoppingBagIcon className="w-12 h-12 text-slate-800" />
            )}
         </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        
        {/* PRICE DISPLAY */}
        <div className="mb-3">
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-white">
               ${found.toFixed(2)}
             </span>
             <span className="text-xs text-slate-500 font-bold uppercase">USD</span>
           </div>
           
           {/* EXPLICIT PROFIT BADGE - Safe Render */}
           {showProfit && !isNaN(profit) && (
            <div className="mt-2 animate-fade-in">
                {isProfitable ? (
                    <div 
                        className="flex items-center gap-2 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30 w-fit"
                    >
                        <CheckCircleIcon className="w-4 h-4 text-[#00ff00]" />
                        <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '14px' }}>
                           Profit: +${profit.toFixed(2)}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-400 font-bold text-sm bg-red-950/30 px-2 py-1 rounded border border-red-500/20 w-fit">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>Loss: -${Math.abs(profit).toFixed(2)}</span>
                    </div>
                )}
            </div>
           )}
        </div>

        <div className="mb-4 flex-1">
           {option.url ? (
             <a 
               href={option.url}
               target="_blank"
               rel="noopener noreferrer"
               className="text-sm text-slate-300 font-medium line-clamp-2 hover:text-[#00F0FF] hover:underline"
             >
               {option.description || "No description available"}
             </a>
           ) : (
             <span className="text-sm text-slate-300 font-medium line-clamp-2">
               {option.description || "No description available"}
             </span>
           )}
           <p className="text-xs text-slate-500 mt-1 flex items-center">
             <BuildingStorefrontIcon className="w-3 h-3 mr-1" />
             {option.vendor || "Unknown Vendor"}
           </p>
        </div>

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center space-x-1">
             <StarIcon className="w-4 h-4 text-amber-400" />
             <span className="text-xs font-bold text-slate-400">{option.qualityScore || 8}/10</span>
           </div>

           {/* SAFE BUTTON RENDERING */}
           {option.url && (
             <a 
               href={option.url} 
               target="_blank" 
               rel="noopener noreferrer"
               className="bg-[#00F0FF] hover:bg-cyan-300 text-black text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 transition-colors"
             >
               Visit Store <ArrowTopRightOnSquareIcon className="w-3 h-3" />
             </a>
           )}
        </div>
      </div>
    </div>
  );
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  // Safety check for the main result object
  if (!result || !result.options) {
      return (
          <div className="p-8 text-center text-slate-500">
             <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
             <p>No results to display.</p>
          </div>
      );
  }

  const targetPrice = result.originalEstimatedPrice || 0;
  const showVisualVerification = Boolean(result.searchImageUsed && result.searchImageUsed.trim().length > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {showVisualVerification && (
        <div className="bg-[#121212] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-[#00F0FF]/30">
          <div className="flex flex-col items-center text-center relative z-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-[#00F0FF] font-bold uppercase text-xs tracking-wider mb-2">
              <EyeIcon className="w-4 h-4" />
              <span>Visual Verification</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Visual Match Confirmed</h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
                {result.visualAnalysis || "Product visually identified using canonical reference."}
            </p>
          </div>
        </div>
      )}

      {/* Summary Header */}
      <div className="bg-[#121212] rounded-2xl p-6 border border-white/10 flex flex-wrap justify-between items-center gap-4">
         <div>
            <h2 className="text-xl font-bold text-white">{result.productName || "Product Search"}</h2>
            <p className="text-sm text-slate-400">Found {result.options.length} potential suppliers</p>
         </div>
         {targetPrice > 0 && (
            <div className="bg-[#1a1a1a] px-4 py-2 rounded-lg border border-white/5">
                <span className="text-xs text-slate-500 block">Your Target Price</span>
                <span className="text-xl font-bold text-white">${targetPrice.toFixed(2)}</span>
            </div>
         )}
      </div>

      {/* Safe Grid Rendering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {result.options.map((option, idx) => {
            // Extra layer of safety in case array has nulls
            if (!option) return null;
            return <ProductCard key={idx} option={option} targetPrice={targetPrice} />;
        })}
      </div>

    </div>
  );
};

export default ResultsDisplay;