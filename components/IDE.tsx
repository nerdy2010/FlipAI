import React, { useState } from 'react';
import { ProjectData, FileSystemNode } from '../types';
import FileTree from './FileTree';
import CodeViewer from './CodeViewer';
import { FolderGit2, Search, X, Database, FileText, Copy, Check } from 'lucide-react';

interface IDEProps {
  project: ProjectData;
  onCloseProject: () => void;
}

const IDE: React.FC<IDEProps> = ({ project, onCloseProject }) => {
  const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-select first file if nothing selected
  React.useEffect(() => {
    if (!selectedFile) {
        // Simple BFS to find first file
        const queue = [...project.root];
        while(queue.length > 0) {
            const node = queue.shift();
            if (node?.type === 'file') {
                setSelectedFile(node);
                break;
            }
            if (node?.children) {
                queue.push(...node.children);
            }
        }
    }
  }, [project, selectedFile]);

  const fileContent = selectedFile && project.files[selectedFile.path] 
    ? project.files[selectedFile.path] 
    : "// Select a file to view its content";

  const handleCopyAll = () => {
    const allCode = Object.entries(project.files)
      .map(([path, content]) => `--- START OF FILE ${path} ---\n${content}\n--- END OF FILE ${path} ---\n`)
      .join('\n');
    
    navigator.clipboard.writeText(allCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 overflow-hidden relative">
      {/* Activity Bar */}
      <div className="w-12 border-r border-slate-800 bg-slate-950 flex flex-col items-center py-4 gap-4 z-20 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
            <FolderGit2 className="w-5 h-5 text-white" />
        </div>
        <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${sidebarOpen ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
            title="Toggle Explorer"
        >
            <FolderGit2 className="w-5 h-5" />
        </button>
        <button 
            onClick={() => setShowExport(true)}
            className={`p-2 rounded-lg transition-colors ${showExport ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
            title="Export All Code"
        >
            <FileText className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button onClick={onCloseProject} className="p-2 text-slate-500 hover:text-red-400" title="Close Project">
            <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar - Explorer */}
      {sidebarOpen && (
        <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col flex-shrink-0 animate-in slide-in-from-left-5 duration-200">
            <div className="h-12 flex items-center px-4 font-medium text-xs tracking-wider text-slate-500 uppercase">
                Explorer
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
                <div className="px-4 mb-2">
                    <div className="font-bold text-slate-200 text-sm truncate mb-2">{project.name}</div>
                </div>
                <FileTree 
                    nodes={project.root} 
                    onSelect={setSelectedFile} 
                    selectedId={selectedFile?.id} 
                />
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {selectedFile ? (
            <CodeViewer filename={selectedFile.name} content={fileContent} />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <Database className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a file to view content</p>
            </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Export Project Code</h2>
                        <p className="text-slate-400 text-sm">Copy all files to clipboard in a single click.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCopyAll}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 
                                ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy All to Clipboard'}
                        </button>
                        <button 
                            onClick={() => setShowExport(false)} 
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-0 bg-slate-950">
                    <div className="p-6">
                        {Object.entries(project.files).map(([path, content]) => (
                            <div key={path} className="mb-8 font-mono text-sm group">
                                <div className="flex items-center gap-2 text-blue-400 font-bold mb-3 pb-2 border-b border-slate-800 group-hover:border-slate-700 transition-colors">
                                    <FileText className="w-4 h-4" />
                                    <span>{path}</span>
                                </div>
                                <pre className="text-slate-300 whitespace-pre-wrap pl-4 border-l-2 border-slate-800">{content}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default IDE;