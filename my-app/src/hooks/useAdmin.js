import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAdmin(authUser) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authUser) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', authUser.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin ?? false)
        setLoading(false)
      })
  }, [authUser?.id])

  const loadOrders = useCallback(async () => {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !ordersData) return

    setOrders(ordersData)

    const userIds = [...new Set(ordersData.map((o) => o.user_id))]
    if (userIds.length === 0) return

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    if (profilesData) {
      const map = {}
      profilesData.forEach((p) => { map[p.id] = p.display_name })
      setProfiles(map)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) loadOrders()
  }, [isAdmin, loadOrders])

  const updateOrderStatus = async (orderId, status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    }
    return { error }
  }

  return { isAdmin, orders, profiles, loading, loadOrders, updateOrderStatus }
}
