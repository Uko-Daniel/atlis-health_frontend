import type { PatientFull } from '@/types/patient'
import type { Result } from '@/types/result'

type RecordWithOptionalResults = PatientFull['records'][number] & {
  results?: Result[]
}

type PatientWithOptionalPayer = PatientFull & {
  payer?: {
    name?: string | null
  } | null
}

interface RecordExport {
  facilityName: string
  generatedAt: string
  patient: {
    name: string
    age: number | null
    gender: string
    dob: string
    phone: string | null
    email: string | null
    payer: string | null
  }
  allergies: Array<{
    substance: string
    reaction: string
    severity: string
  }>
  problemList: Array<{
    name: string
    icdCode: string | null
    status: string
    diagnosedAt: string
  }>
  medications: Array<{
    name: string
    dosage: string
    route: string
    frequency: string
    startDate: string
    status: string
  }>
  encounters: Array<{
    type: string
    date: string
    chiefComplaint: string | null
    vitals: string
    diagnoses: string[]
  }>
  recentResults: Array<{
    name: string
    date: string
    status: string
  }>
}

export function compileMedicalRecord(
  patient: PatientFull,
  facilityName = 'Atlis Health',
): RecordExport {
  const records = (patient.records ?? []) as RecordWithOptionalResults[]
  const payer = (patient as PatientWithOptionalPayer).payer
  const age = patient.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  const problemList = (patient.encounters ?? [])
    .flatMap((e) => e.diagnoses ?? [])
    .filter((d, i, arr) => arr.findIndex((x) => (x.icdCode ?? x.name) === (d.icdCode ?? d.name)) === i)

  const medications = records
    .flatMap((r) => r.medications ?? [])
    .filter((m) => m.status === 'ACTIVE')

  const encounters = (patient.encounters ?? []).map((enc) => ({
    type: enc.type,
    date: enc.startTime ?? enc.encounteredAt,
    chiefComplaint: enc.chiefComplaint ?? null,
    vitals: enc.vitals?.[0]
      ? `BP ${enc.vitals[0].systolicBP ?? '?'}/${enc.vitals[0].diastolicBP ?? '?'} | HR ${enc.vitals[0].heartRate ?? '?'} | Temp ${enc.vitals[0].temperature ?? '?'}°C | SpO₂ ${enc.vitals[0].spO2 ?? '?'}%`
      : 'No vitals recorded',
    diagnoses: (enc.diagnoses ?? []).map((d) => `${d.name}${d.icdCode ? ` (${d.icdCode})` : ''}`),
  }))

  const recentResults = records
    .flatMap((r) => r.results ?? [])
    .slice(0, 10)
    .map((r) => ({
      name: r.template?.name ?? 'Result',
      date: r.createdAt,
      status: r.status,
    }))

  return {
    facilityName,
    generatedAt: new Date().toISOString(),
    patient: {
      name: `${patient.firstName} ${patient.lastName}`,
      age,
      gender: patient.gender,
      dob: patient.dob,
      phone: patient.phoneNumber ?? null,
      email: patient.email ?? null,
      payer: payer?.name ?? 'Self-Pay',
    },
    allergies: (patient.allergies ?? []).map((a) => ({
      substance: a.substance,
      reaction: a.reaction,
      severity: a.severity,
    })),
    problemList: problemList.map((d) => ({
      name: d.name,
      icdCode: d.icdCode ?? null,
      status: d.status,
      diagnosedAt: d.diagnosedAt,
    })),
    medications: medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      route: m.route,
      frequency: m.frequency,
      startDate: m.startDate,
      status: m.status,
    })),
    encounters,
    recentResults,
  }
}

export function exportAsJSON(patient: PatientFull, facilityName?: string): string {
  const record = compileMedicalRecord(patient, facilityName)
  return JSON.stringify(record, null, 2)
}

export function downloadRecord(patient: PatientFull, facilityName?: string) {
  const json = exportAsJSON(patient, facilityName)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `medical-record-${patient.id.slice(-8)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function printRecord(patient: PatientFull, facilityName?: string) {
  const record = compileMedicalRecord(patient, facilityName)
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return

  const html = `<!DOCTYPE html>
<html>
<head><title>Medical Record — ${record.patient.name}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #0F172A; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; border-bottom: 2px solid #5580F4; padding-bottom: 4px; margin-top: 24px; }
  .meta { color: #64748B; font-size: 13px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { text-align: left; padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #EEF1F8; }
  th { color: #64748B; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .active { background: #F0F4FF; color: #5580F4; }
  .critical { background: #FEF2F2; color: #EF4444; }
  .resolved { background: #ECFDF5; color: #10B981; }
  .footer { margin-top: 32px; font-size: 11px; color: #94A3B8; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
<h1>Medical Record</h1>
<p class="meta">${record.facilityName} · Generated ${new Date(record.generatedAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

<h2>Patient</h2>
<table>
  <tr><th>Name</th><td>${record.patient.name}</td><th>Age</th><td>${record.patient.age ?? '—'}y</td></tr>
  <tr><th>Gender</th><td>${record.patient.gender}</td><th>DOB</th><td>${new Date(record.patient.dob).toLocaleDateString('en-NG')}</td></tr>
  <tr><th>Phone</th><td>${record.patient.phone ?? '—'}</td><th>Payer</th><td>${record.patient.payer}</td></tr>
</table>

${record.allergies.length > 0 ? `
<h2>Allergies</h2>
<table>
  ${record.allergies.map((a) => `<tr><td><span class="badge ${a.severity === 'LIFE_THREATENING' || a.severity === 'SEVERE' ? 'critical' : 'active'}">${a.severity}</span></td><td>${a.substance}</td><td>${a.reaction}</td></tr>`).join('')}
</table>` : ''}

${record.problemList.length > 0 ? `
<h2>Problem List</h2>
<table>
  <tr><th>Diagnosis</th><th>ICD-10</th><th>Status</th></tr>
  ${record.problemList.map((d) => `<tr><td>${d.name}</td><td>${d.icdCode ?? '—'}</td><td><span class="badge ${d.status === 'ACTIVE' ? 'active' : d.status === 'RESOLVED' ? 'resolved' : ''}">${d.status}</span></td></tr>`).join('')}
</table>` : ''}

${record.medications.length > 0 ? `
<h2>Active Medications</h2>
<table>
  <tr><th>Medication</th><th>Dosage</th><th>Route</th><th>Frequency</th></tr>
  ${record.medications.map((m) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.route}</td><td>${m.frequency}</td></tr>`).join('')}
</table>` : ''}

${record.encounters.length > 0 ? `
<h2>Encounter History</h2>
${record.encounters.map((e) => `<table><tr><th>Date</th><td>${new Date(e.date).toLocaleDateString('en-NG')}</td><th>Type</th><td>${e.type}</td></tr>
<tr><th>Complaint</th><td colspan="3">${e.chiefComplaint ?? '—'}</td></tr>
<tr><th>Vitals</th><td colspan="3">${e.vitals}</td></tr>
${e.diagnoses.length > 0 ? `<tr><th>Diagnoses</th><td colspan="3">${e.diagnoses.join(' · ')}</td></tr>` : ''}
</table><br>`).join('')}` : ''}

${record.recentResults.length > 0 ? `
<h2>Recent Results</h2>
<table>
  <tr><th>Test</th><th>Date</th><th>Status</th></tr>
  ${record.recentResults.map((r) => `<tr><td>${r.name}</td><td>${new Date(r.date).toLocaleDateString('en-NG')}</td><td>${r.status}</td></tr>`).join('')}
</table>` : ''}

<p class="footer">Generated by Atlis Health · ${record.facilityName} · This is a clinical document</p>
</body></html>`

  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 300)
}
