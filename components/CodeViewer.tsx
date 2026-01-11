import React from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface CodeViewerProps {
  filename: string;
  content: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ filename, content }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-slate-300 font-mono">{filename}</span>
           <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded">Read-only</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-300 tab-4">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;