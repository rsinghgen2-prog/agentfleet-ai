import { useCallback, useEffect, useState } from 'react'
import { DashboardService, type ClinicSettings, type DashboardData } from '../services/dashboardService'
import type { Client } from '../config/clients'

export function useDentalDashboardData() {
  const [client, setClient] = useState<Client | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true)
    setError(null)
    const storedClient = localStorage.getItem('clientData')
    if (storedClient) {
      try {
        setClient(JSON.parse(storedClient) as Client)
      } catch {
        setClient(null)
      }
    }

    try {
      const [dashboard, clinicSettings] = await Promise.all([
        DashboardService.getDashboardData(),
        DashboardService.getSettings(),
      ])
      if (isActive()) {
        setData(dashboard)
        setSettings(clinicSettings)
      }
    } catch (loadError) {
      if (isActive()) setError(loadError instanceof Error ? loadError.message : 'Unable to load clinic data')
    } finally {
      if (isActive()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void load(() => active)
    return () => { active = false }
  }, [load])

  return { client, settings, data, loading, error, refresh: load }
}