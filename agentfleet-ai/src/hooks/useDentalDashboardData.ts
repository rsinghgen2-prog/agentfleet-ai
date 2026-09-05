import { useCallback, useEffect, useState } from 'react'
import { DashboardService, type ClinicSettings, type DashboardData } from '../services/dashboardService'
import type { Client } from '../config/clients'
import { describeApiError } from '../utils/apiError'

let cachedClient: Client | null = null
let cachedData: DashboardData | null = null
let cachedSettings: ClinicSettings | null = null

export function clearDentalDashboardCache() {
  cachedClient = null
  cachedData = null
  cachedSettings = null
}

export function useDentalDashboardData() {
  const [client, setClient] = useState<Client | null>(cachedClient)
  const [data, setData] = useState<DashboardData | null>(cachedData)
  const [settings, setSettings] = useState<ClinicSettings | null>(cachedSettings)
  const [loading, setLoading] = useState(!cachedData)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isActive: () => boolean = () => true, silent = false) => {
    if (!silent) setLoading(true)
    const storedClient = localStorage.getItem('clientData')
    if (storedClient) {
      try {
        const parsed = JSON.parse(storedClient) as Client
        cachedClient = parsed
        setClient(parsed)
      } catch {
        cachedClient = null
        setClient(null)
      }
    }

    const [dashboardResult, settingsResult] = await Promise.allSettled([
      DashboardService.getDashboardData(),
      DashboardService.getSettings(),
    ])
    if (!isActive()) return
    if (dashboardResult.status === 'fulfilled') {
      cachedData = dashboardResult.value
      setData(dashboardResult.value)
      setError(null)
    } else {
      setError(describeApiError(dashboardResult.reason, 'Unable to load clinic dashboard data from the backend.'))
    }
    if (settingsResult.status === 'fulfilled') {
      cachedSettings = settingsResult.value
      setSettings(settingsResult.value)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true
    void load(() => active, Boolean(cachedData))
    return () => { active = false }
  }, [load])

  const refresh = useCallback((isActive: () => boolean = () => true) => load(isActive, true), [load])

  return { client, settings, data, loading, error, refresh }
}
