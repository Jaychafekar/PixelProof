export interface ApiSignedReportPayload {
  analysis_id?: string;
  created_at?: string;
  media_type?: string;
  filename?: string;
  content_type?: string;
  label: 'Real' | 'Fake';
  confidence: number;
  scores?: {
    fake: number;
    real: number;
  };
  processing_ms?: number;
  model?: {
    name?: string;
    source?: string;
    input_size?: number[];
    fake_threshold?: number;
  };
  details?: Record<string, unknown>;
  warnings?: string[];
}

export interface ApiSignedReport {
  version: number;
  algorithm: string;
  signature: string;
  verify_endpoint?: string;
  payload: ApiSignedReportPayload;
}

export interface ApiReportVerificationResponse {
  valid: boolean;
  reason?: string | null;
  algorithm?: string;
  verify_endpoint?: string;
  analysis_id?: string;
  label?: 'Real' | 'Fake';
}

export interface ApiAnalysisResult {
  analysis_id?: string;
  created_at?: string;
  media_type?: string;
  filename?: string;
  content_type?: string;
  label: 'Real' | 'Fake';
  confidence: number;
  processing_ms?: number;
  scores?: {
    fake: number;
    real: number;
  };
  model?: {
    name?: string;
    source?: string;
    input_size?: number[];
    fake_threshold?: number;
  };
  details?: Record<string, unknown>;
  warnings?: string[];
  report?: ApiSignedReport;
}

export interface AnalysisSignals {
  facialArtifacts: string;
  audioSync: string;
  noisePatterns: string;
  compression: string;
}

export interface AnalysisResult {
  analysisId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  sourceObjectUrl?: string;
  mediaType: 'image' | 'video';
  label: 'Real' | 'Fake';
  confidence: number;
  timestamp: string;
  processingMs?: number;
  scores?: {
    fake: number;
    real: number;
  };
  warnings: string[];
  model?: {
    name?: string;
    source?: string;
    inputSize?: number[];
    fakeThreshold?: number;
  };
  details?: Record<string, unknown>;
  report?: ApiSignedReport;
  analysis: AnalysisSignals;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  timestamp: string;
  result: 'Real' | 'Fake';
  confidence: number;
  payload?: AnalysisResult;
}
