import React, { useState, useRef, useEffect } from "react";
import { PhotoIcon, LinkIcon, DocumentTextIcon, MagnifyingGlassIcon, ClipboardDocumentCheckIcon, GlobeAltIcon, CpuChipIcon, CloudArrowUpIcon, XCircleIcon, CurrencyDollarIcon, EyeIcon } from "@heroicons/react/24/outline";

interface InputSectionProps {
  onAnalyze: (image: string | null, text: string, url: string, price: string) => void;
  isAnalyzing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps reflecting the Canonical Reference strategy
  const analysisSteps = [
    { text: "Analyzing visual fingerprint...", icon: CpuChipIcon },
    { text: "Global Search: Locating canonical reference image...", icon: GlobeAltIcon },
    { text: "Visual Engine: Executing Deep Search...", icon: EyeIcon }, 
    { text: "AI Agent: Verifying exact model matches...", icon: ClipboardDocumentCheckIcon },
    { text: "Finalizing supplier comparison...", icon: CurrencyDollarIcon },
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
      }, 4000); 
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(",")[1];
        setPreviewImage(base64Content);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(previewImage, description, url, price);
  };

  return (
    <div className="bg-[#121212] rounded-2xl shadow-xl p-6 md:p-10 border border-white/10 relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-[#00F0FF] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Product Evidence</h2>
          <p className="text-sm text-slate-400 mt-1">We use <strong>Advanced AI Vision</strong> to find exact visual matches.</p>
        </div>
        {!isAnalyzing && (
          <span className="text-xs font-bold text-[#00F0FF] bg-cyan-950/30 px-3 py-1 rounded-full border border-[#00F0FF]/30 uppercase tracking-wider flex items-center shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <EyeIcon className="w-3 h-3 mr-1" />
            Visual Engine Ready
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loading State UI */}
        {isAnalyzing ? (
          <div className="py-12 flex flex-col items-center justify-center animate-fade-in" key="loading">
            <div className="w-full max-w-md space-y-6">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-400 mb-2">
                <span>Visual sourcing in progress...</span>
                <span>{Math.min((loadingStep + 1) * 20, 95)}%</span>
              </div>
              
              <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden border border-white/5">
                <div 
                  className="bg-[#00F0FF] h-2 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_10px_#00F0FF]" 
                  style={{ width: `${((loadingStep + 1) / analysisSteps.length) * 100}%` }}
                ></div>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/10 shadow-inner">
                {analysisSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === loadingStep;
                  const isDone = index < loadingStep;
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-3 mb-4 last:mb-0 transition-opacity duration-500 ${
                        isActive ? "opacity-100 scale-105" : isDone ? "opacity-40" : "opacity-20"
                      }`}
                    >
                      <div className={`p-2 rounded-full ${isActive ? "bg-cyan-950 text-[#00F0FF] border border-[#00F0FF]/30" : "bg-[#1a1a1a] text-slate-500"}`}>
                        {isDone ? (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                           <Icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
                        )}
                      </div>
                      <span className={`font-medium ${isActive ? "text-[#00F0FF]" : "text-slate-500"}`}>
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-500 animate-pulse">
                Accessing Global Product Database...
              </p>
            </div>
          </div>
        ) : (
          /* Combined Form UI */
          <div className="animate-fade-in" key="form">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Image (Visual Fingerprint) */}
              <div className="lg:col-span-5">
                <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center">
                  <PhotoIcon className="w-4 h-4 mr-2 text-[#00F0FF]" />
                  Step 1: Upload Photo
                  <span className="ml-auto text-xs font-normal text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">Supports Vision</span>
                </label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl h-64 lg:h-80 flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                    previewImage 
                      ? "border-emerald-500/50 bg-emerald-900/10" 
                      : "border-slate-700 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5"
                  }`}
                >
                  {previewImage ? (
                    <>
                      <img 
                        src={`data:image/jpeg;base64,${previewImage}`} 
                        alt="Preview" 
                        className="absolute inset-0 w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                      <button 
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full text-white hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <XCircleIcon className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center p-6 text-center">
                      <div className="w-14 h-14 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg border border-white/5 group-hover:border-[#00F0FF]/30 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                        <CloudArrowUpIcon className="w-7 h-7 text-slate-400 group-hover:text-[#00F0FF]" />
                      </div>
                      <p className="text-white font-bold group-hover:text-[#00F0FF] transition-colors">Click to Upload</p>
                      <p className="text-slate-500 text-xs mt-2 px-4">
                        We will find a proxy URL for this image to enable Visual Search.
                      </p>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Right Column: Data Points */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* URL Input */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2 text-[#00F0FF]" />
                      Step 2: Reference Link
                      <span className="ml-2 text-xs font-normal text-emerald-400 bg-emerald-900/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">Best Accuracy</span>
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://amazon.com/product..."
                        className="w-full rounded-xl bg-[#0a0a0a] border-slate-700 border p-3 pl-10 focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none text-white placeholder:text-slate-600 transition-shadow"
                      />
                      <GlobeAltIcon className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  {/* Price Input (Found Price) */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2 text-[#00F0FF]" />
                      Found Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Price you found it for"
                        className="w-full rounded-xl bg-[#0a0a0a] border-slate-700 border p-3 pl-8 focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none text-white placeholder:text-slate-600 transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                {/* Description Input */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <label className="block text-sm font-bold text-slate-300 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2 text-[#00F0FF]" />
                      Step 3: Product Description
                    </label>
                  </div>
                  
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Copy-paste the description from the supplier where you found your product..."
                    className="w-full rounded-lg bg-[#0a0a0a] border-slate-700 border p-3 focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none transition-shadow text-sm min-h-[100px] text-white placeholder:text-slate-600"
                  />
                </div>

              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
               <button
                type="submit"
                disabled={isAnalyzing || (!previewImage && !url && !description)}
                className={`w-full py-4 rounded-xl text-black font-bold text-lg shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                  isAnalyzing || (!previewImage && !url && !description)
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-[#00F0FF] hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <MagnifyingGlassIcon className="w-6 h-6" />
                  <span>Start Searching</span>
                </span>
              </button>
            </div>

          </div>
        )}
      </form>
    </div>
  );
};

export default InputSection;