export interface ProductOption {
  tier: string; // "Cheapest Option", "Best Value", "Premium"
  vendor: string;
  price: number;
  currency: string;
  url: string;
  image?: string; // URL of the product thumbnail
  description: string;
  probableFlaws: string; // Specific analysis of why it might be bad
  qualityScore: number; // 1-10
  confidenceScore: number;
}

export interface MarketAnalysis {
  averageMarketPrice: string;
  honestyScore: number;
  uncertaintyReason: string;
}

export interface AnalysisResult {
  productName: string;
  identifiedModel: string;
  originalEstimatedPrice: number;
  marketAnalysis: MarketAnalysis;
  options: ProductOption[];
  searchImageUsed?: string; // The canonical image URL found and used for the search
  visualAnalysis?: string; // The text description of the 'Visual DNA' extracted by Gemini Vision
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileSystemNode[];
  isOpen?: boolean;
}

export interface ProjectData {
  name: string;
  root: FileSystemNode[];
  files: Record<string, string>;
}