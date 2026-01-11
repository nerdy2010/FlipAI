import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, Loader2, AlertCircle } from 'lucide-react';
import { processZipFile } from '../utils/zipUtils';
import { ProjectData } from '../types';

interface RestoreScreenProps {
  onProjectLoaded: (data: ProjectData) => void;
}

const RestoreScreen: React.FC<RestoreScreenProps> = ({ onProjectLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError("Please upload a .zip file");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const projectData = await processZipFile(file);
      onProjectLoaded(projectData);
    } catch (err) {
      console.error(err);
      setError("Failed to parse ZIP file. It might be corrupted.");
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-xl w-full z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Project Recovery</h1>
          <p className="text-slate-400 text-lg">Upload your lost project's ZIP file to inspect and recover your code.</p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`
            relative group border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer
            ${dragActive 
              ? 'border-blue-500 bg-blue-500/10 scale-102 shadow-2xl shadow-blue-900/20' 
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            className="hidden" 
            accept=".zip" 
            onChange={handleFileSelect} 
          />

          {isProcessing ? (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
              <h3 className="text-xl font-medium text-white">Extracting Files...</h3>
              <p className="text-slate-500 mt-2">Reconstructing your project structure</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                <UploadCloud className={`w-10 h-10 ${dragActive ? 'text-blue-400' : 'text-slate-300'}`} />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Drop your .zip file here</h3>
              <p className="text-slate-400 mb-8">or click to browse from your computer</p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 uppercase tracking-widest font-semibold">
                 <FileArchive className="w-4 h-4" />
                 <span>Secure Client-Side Extraction</span>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestoreScreen;