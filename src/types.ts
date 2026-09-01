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
  autoArchiveRules?: AutoArchiveRule[];
  exportMacros?: ExportMacro[];
}

export interface HistoryEntry {
  id: string;
  title: string;
  timestamp: string;
  threadCount: number;
  artifactCount: number;
}

export interface AutoArchiveRule {
  id: string;
  condition: 'has_tag' | 'has_category' | 'title_contains' | 'always';
  value: string;
}

export interface ExportMacro {
  id: string;
  name: string;
  icon?: string;
  actions: ('add_tag' | 'set_category' | 'archive' | 'export_md' | 'export_json')[];
  tagValue?: string;
  categoryValue?: string;
}
