import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  if (!supabase) {
    res.status(500).json({ error: 'Server auth not configured' })
    return
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  ;(req as Request & { user: { id: string; email: string; name: string } }).user = {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string,
  }
  next()
}
