import api from '@/lib/api'
import type {
  EditorSession,
  DraftData,
  FlagResponse,
  SubmitResponse,
} from '@/types/editor'

// POST /editor/:resultId/session
export async function openSession(resultId: string): Promise<EditorSession> {
  const res = await api.post<EditorSession>(`/editor/${resultId}/session`)
  return res.data
}

// GET /editor/:resultId/session
export async function getSession(resultId: string): Promise<EditorSession> {
  const res = await api.get<EditorSession>(`/editor/${resultId}/session`)
  return res.data
}

// DELETE /editor/:resultId/session
export async function closeSession(resultId: string): Promise<void> {
  await api.delete(`/editor/${resultId}/session`)
}

// POST /editor/:resultId/draft
export async function saveDraft(
  resultId:  string,
  draft:     DraftData,
  patientId: string,
): Promise<void> {
  await api.post(`/editor/${resultId}/draft`, { draft, patientId })
}

// POST /editor/:resultId/heartbeat
export async function sendHeartbeat(resultId: string): Promise<void> {
  await api.post(`/editor/${resultId}/heartbeat`)
}

// POST /editor/:resultId/flag
export async function flagField(
  resultId:  string,
  fieldId:   string,
  value:     unknown,
  patientId: string,
): Promise<FlagResponse> {
  const res = await api.post<FlagResponse>(`/editor/${resultId}/flag`, {
    fieldId, value, patientId,
  })
  return res.data
}

// POST /editor/:resultId/calculate
export async function calculateFields(
  resultId:  string,
  draft:     DraftData,
  patientId: string,
): Promise<DraftData> {
  const res = await api.post<{ draft: DraftData }>(
    `/editor/${resultId}/calculate`,
    { draft, patientId },
  )
  return res.data.draft
}

// POST /editor/:resultId/submit
export async function submitResult(
  resultId:       string,
  draft:          DraftData,
  patientId:      string,
  interpretation?: string,
): Promise<SubmitResponse> {
  const res = await api.post<SubmitResponse>(`/editor/${resultId}/submit`, {
    draft, patientId, interpretation,
  })
  return res.data
}