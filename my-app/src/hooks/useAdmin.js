import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAdmin(authUser) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [lotwProductId, setLotwProductId] = useState(null)

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

  const loadLotw = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'loaf_of_the_week')
      .single()
    setLotwProductId(data?.value ?? null)
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadOrders()
      loadLotw()
    }
  }, [isAdmin, loadOrders, loadLotw])

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

  const updateLotw = async (productId) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'loaf_of_the_week', value: productId ?? null })
    if (!error) setLotwProductId(productId ?? null)
    return { error }
  }

  return { isAdmin, orders, profiles, loading, loadOrders, updateOrderStatus, lotwProductId, updateLotw }
}
