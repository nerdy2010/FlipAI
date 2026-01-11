import JSZip from 'jszip';
import { FileSystemNode, ProjectData } from '../types';

export const processZipFile = async (file: File): Promise<ProjectData> => {
  const zip = await JSZip.loadAsync(file);
  const filesMap: Record<string, string> = {};
  const paths: string[] = [];

  // 1. Extract files
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    const entry = zipEntry as any;
    if (!entry.dir) {
      // Basic binary check (skip images/etc for performance/rendering safety if needed, 
      // but for now we try to load everything as string to recover code)
      try {
        const content = await entry.async('string');
        filesMap[relativePath] = content;
        paths.push(relativePath);
      } catch (e) {
        console.warn(`Could not read ${relativePath}`, e);
        filesMap[relativePath] = "// [Binary or Unreadable File]";
        paths.push(relativePath);
      }
    }
  }

  // 2. Build Tree
  const root: FileSystemNode[] = [];

  paths.forEach(path => {
    const parts = path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Find existing node at this level
      let node = currentLevel.find(n => n.name === part);

      if (!node) {
        node = {
          id: currentPath,
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          children: isFile ? undefined : [],
          isOpen: false // Default closed
        };
        currentLevel.push(node);
      }

      if (!isFile) {
        currentLevel = node.children!;
      }
    });
  });

  // Sort: Folders first, then files, alphabetical
  const sortNodes = (nodes: FileSystemNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    nodes.forEach(node => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);

  return {
    name: file.name,
    root,
    files: filesMap
  };
};