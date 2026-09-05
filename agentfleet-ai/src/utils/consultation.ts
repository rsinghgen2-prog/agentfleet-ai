export function consultationPath(appointmentId?: string | null, patientId?: string | null, tab?: string) {
  const params = new URLSearchParams()
  if (appointmentId) params.set('appointment', appointmentId)
  if (patientId) params.set('patient', patientId)
  if (tab) params.set('tab', tab)
  const query = params.toString()
  return query ? `/dental-client/consultation?${query}` : '/dental-client/consultation'
}
