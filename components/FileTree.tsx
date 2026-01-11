import React from 'react';
import { FileSystemNode } from '../types';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileJson, FileText, FileImage, File } from 'lucide-react';

interface FileTreeProps {
  nodes: FileSystemNode[];
  onSelect: (node: FileSystemNode) => void;
  selectedId?: string;
  depth?: number;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-400" />;
    case 'css':
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-slate-400" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <FileImage className="w-4 h-4 text-purple-400" />;
    default:
      return <File className="w-4 h-4 text-slate-500" />;
  }
};

const FileTree: React.FC<FileTreeProps> = ({ nodes, onSelect, selectedId, depth = 0 }) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggleFolder = (node: FileSystemNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [node.id]: !prev[node.id] }));
  };

  // Initially expand root level folders
  React.useEffect(() => {
    if (depth === 0) {
      const initial: Record<string, boolean> = {};
      nodes.forEach(n => {
        if (n.type === 'folder') initial[n.id] = true;
      });
      setExpanded(prev => ({ ...prev, ...initial }));
    }
  }, [nodes, depth]);

  return (
    <ul className="pl-2">
      {nodes.map(node => (
        <li key={node.id}>
          <div 
            onClick={(e) => {
              if (node.type === 'folder') toggleFolder(node, e);
              else onSelect(node);
            }}
            className={`
              flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer select-none transition-colors text-sm
              ${selectedId === node.id 
                ? 'bg-blue-600/20 text-blue-300' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
            `}
            style={{ paddingLeft: `${depth * 8 + 8}px` }}
          >
            {node.type === 'folder' && (
              <span className="text-slate-500">
                {expanded[node.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
            
            {node.type === 'folder' ? (
              expanded[node.id] ? <FolderOpen className="w-4 h-4 text-indigo-400" /> : <Folder className="w-4 h-4 text-indigo-400" />
            ) : (
              getFileIcon(node.name)
            )}
            
            <span className="truncate">{node.name}</span>
          </div>

          {node.type === 'folder' && expanded[node.id] && node.children && (
            <FileTree 
              nodes={node.children} 
              onSelect={onSelect} 
              selectedId={selectedId} 
              depth={depth + 1} 
            />
          )}
        </li>
      ))}
    </ul>
  );
};

export default FileTree;