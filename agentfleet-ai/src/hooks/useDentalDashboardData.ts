import { useCallback, useEffect, useState } from 'react'
import { DashboardService, type DashboardData } from '../services/dashboardService'
import type { Client } from '../config/clients'

export function useDentalDashboardData() {
  const [client, setClient] = useState<Client | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const storedClient = localStorage.getItem('clientData')
    if (storedClient) {
      try {
        setClient(JSON.parse(storedClient) as Client)
      } catch {
        setClient(null)
      }
    }

    try {
      setData(await DashboardService.getDashboardData())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { client, data, loading, refresh: load }
}