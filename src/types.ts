export interface SpaceData {
  title: string;
  url: string;
  timestamp: string;
  instructions?: string;
  rawHtml?: string;
  threads: Thread[];
  artifacts: Artifact[];
  apps: any[];
  isArchived?: boolean;
  category?: string;
  tags?: string[];
}

export interface Thread {
  title: string;
  url?: string;
  content: string;
}

export interface Artifact {
  title: string;
  url?: string;
  content: string;
}

export type ExtractionStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export interface MappingRules {
  includeInstructions: boolean;
  includeThreads: boolean;
  includeArtifacts: boolean;
  truncateLength: number;
}

export interface HistoryEntry {
  id: string;
  title: string;
  timestamp: string;
  threadCount: number;
  artifactCount: number;
}
