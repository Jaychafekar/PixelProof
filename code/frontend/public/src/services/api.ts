import type {
  AnalysisResult,
  ApiAnalysisResult,
  ApiReportVerificationResponse,
  HistoryItem,
} from '../types/analysis'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''

interface AnalysisFileDescriptor {
  name: string
  type?: string
  size?: number
}

interface ApiStoredAnalysisRecord {
  id: string
  file_name: string
  file_type: string
  file_size_bytes: number
  file_sha256?: string
  media_type?: 'image' | 'video'
  timestamp: string
  result: 'Real' | 'Fake'
  confidence: number
  payload?: ApiAnalysisResult
}

interface ApiAnalysisHistoryResponse {
  items: ApiStoredAnalysisRecord[]
  count: number
  limit: number
}

export function getApiOrigin() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://127.0.0.1:8000'
}

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return configuredApiBaseUrl ? `${configuredApiBaseUrl}${normalizedPath}` : normalizedPath
}

function inferMediaType(fileDescriptor: AnalysisFileDescriptor, apiResult?: ApiAnalysisResult) {
  if (apiResult?.media_type === 'video' || fileDescriptor.type?.startsWith('video')) {
    return 'video'
  }

  return 'image'
}

async function readErrorMessage(res: Response) {
  try {
    const payload = await res.json()
    if (typeof payload?.detail === 'string' && payload.detail.trim()) {
      return payload.detail
    }
    if (Array.isArray(payload?.detail)) {
      return payload.detail
        .map((item) => item?.msg || item?.message || JSON.stringify(item))
        .filter(Boolean)
        .join('; ')
    }
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message
    }
  } catch {
    // Fall back to status text below when the response is not JSON.
  }

  return `${res.status} ${res.statusText || 'Request failed'}`
}

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(getApiUrl(path), init)
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return res.json()
}

export async function analyzeMedia(file: File): Promise<ApiAnalysisResult> {
  const formData = new FormData()
  formData.append("file", file)

  return readJson<ApiAnalysisResult>("/analyze", {
    method: "POST",
    body: formData,
  })
}

function buildDerivedSignals(mediaType: 'image' | 'video', label: 'Real' | 'Fake') {
  const isFake = label === 'Fake'

  return {
    facialArtifacts: isFake ? 'Detected' : 'None observed',
    audioSync: mediaType === 'video' ? (isFake ? 'Review recommended' : 'No obvious mismatch') : 'Not applicable',
    noisePatterns: isFake ? 'Potential anomalies' : 'Natural-looking',
    compression: 'Within expected range',
  }
}

export function buildAnalysisResult(file: File, apiResult: ApiAnalysisResult): AnalysisResult {
  return buildAnalysisResultFromDescriptor(
    {
      name: file.name,
      type: file.type,
      size: file.size,
    },
    apiResult
  )
}

export function buildAnalysisResultFromDescriptor(
  fileDescriptor: AnalysisFileDescriptor,
  apiResult: ApiAnalysisResult
): AnalysisResult {
  const mediaType = inferMediaType(fileDescriptor, apiResult)

  return {
    analysisId: apiResult.analysis_id,
    fileName: fileDescriptor.name,
    fileType: fileDescriptor.type || apiResult.content_type || 'application/octet-stream',
    fileSize: fileDescriptor.size ?? 0,
    mediaType,
    label: apiResult.label,
    confidence: apiResult.confidence * 100,
    timestamp: apiResult.created_at ?? new Date().toISOString(),
    processingMs: apiResult.processing_ms,
    scores: apiResult.scores,
    warnings: apiResult.warnings ?? [],
    model: apiResult.model
      ? {
          name: apiResult.model.name,
          source: apiResult.model.source,
          inputSize: apiResult.model.input_size,
          fakeThreshold: apiResult.model.fake_threshold,
        }
      : undefined,
    details: apiResult.details,
    report: apiResult.report,
    analysis: buildDerivedSignals(mediaType, apiResult.label),
  }
}

export function buildHistoryItemFromStoredRecord(record: ApiStoredAnalysisRecord): HistoryItem {
  const payload = record.payload
    ? buildAnalysisResultFromDescriptor(
        {
          name: record.file_name,
          type: record.file_type,
          size: record.file_size_bytes,
        },
        record.payload
      )
    : undefined

  return {
    id: record.id,
    fileName: record.file_name,
    fileType: record.file_type || 'application/octet-stream',
    timestamp: record.timestamp,
    result: record.result,
    confidence: record.confidence,
    payload,
  }
}

export async function fetchAnalysisHistory(limit = 50): Promise<HistoryItem[]> {
  const response = await readJson<ApiAnalysisHistoryResponse>(`/analyses?limit=${limit}`)
  return response.items.map(buildHistoryItemFromStoredRecord)
}

export async function deleteStoredAnalysis(id: string): Promise<void> {
  await readJson<{ deleted: boolean }>(`/analyses/${id}`, {
    method: 'DELETE',
  })
}

export async function verifySignedReport(report: unknown): Promise<ApiReportVerificationResponse> {
  return readJson<ApiReportVerificationResponse>('/verify-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
  })
}
