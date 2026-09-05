import type { Appointment, PatientLabOrder, PatientPrescription, TreatmentPlan } from '../services/dashboardService'
import { appointmentDateKey } from './clinicSchedule'

export type ChargeKind = 'visit' | 'plan' | 'medicine' | 'test'
export type ChargeLine = { kind: ChargeKind; id: string; label: string; detail: string; amount: number }

const onOrAfter = (value: string | undefined, day: string) => {
  if (!day) return true
  if (!value) return true
  return String(value).slice(0, 10) >= day
}

export function buildVisitCharges(input: {
  visit?: Appointment | null
  plans?: TreatmentPlan[]
  prescriptions?: PatientPrescription[]
  labOrders?: PatientLabOrder[]
}): ChargeLine[] {
  const lines: ChargeLine[] = []
  const visitDay = appointmentDateKey(input.visit?.appointment_date)
  if (input.visit) {
    lines.push({
      kind: 'visit',
      id: input.visit.id,
      label: input.visit.appointment_type || 'Consultation',
      detail: `${visitDay} · ${String(input.visit.appointment_time).slice(0, 5)}`,
      amount: 0,
    })
  }
  for (const plan of input.plans || []) {
    if (plan.status === 'cancelled') continue
    lines.push({
      kind: 'plan',
      id: plan.id,
      label: plan.title,
      detail: [plan.tooth, plan.status.replaceAll('_', ' ')].filter(Boolean).join(' · '),
      amount: Number(plan.estimated_cost || 0),
    })
  }
  for (const item of input.prescriptions || []) {
    if (!onOrAfter(item.prescribed_at, visitDay)) continue
    lines.push({
      kind: 'medicine',
      id: item.id,
      label: item.medication,
      detail: [item.dosage, item.frequency, item.duration].filter(Boolean).join(' · '),
      amount: 0,
    })
  }
  for (const order of input.labOrders || []) {
    if (!onOrAfter(order.ordered_at, visitDay)) continue
    lines.push({
      kind: 'test',
      id: order.id,
      label: order.tests || order.order_number,
      detail: [order.lab_name, order.order_number].filter(Boolean).join(' · '),
      amount: 0,
    })
  }
  return lines
}

export const chargesTotal = (lines: ChargeLine[]) => lines.reduce((sum, line) => sum + Number(line.amount || 0), 0)

export function chargesDescription(visitId: string, lines: ChargeLine[]) {
  const rows = lines.map((line) => {
    const amount = line.amount ? ` — ₹${line.amount.toLocaleString('en-IN')}` : ''
    return `${line.label}${line.detail ? ` (${line.detail})` : ''}${amount}`
  })
  return [`Visit:${visitId}`, ...rows].join('\n').slice(0, 4000)
}

export const chargeKindLabel: Record<ChargeKind, string> = {
  visit: 'Consultation',
  plan: 'Treatment plan',
  medicine: 'Medicine',
  test: 'Lab / test',
}
