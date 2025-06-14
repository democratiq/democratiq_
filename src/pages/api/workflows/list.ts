import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select(`
        *,
        category:categories(value, label),
        steps:workflow_steps(*)
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching workflows:', error)
      return res.status(500).json({ error: 'Failed to fetch workflows' })
    }

    res.status(200).json(workflows)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}