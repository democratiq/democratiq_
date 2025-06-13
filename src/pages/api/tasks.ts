import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json(data)
    }

    if (req.method === 'POST') {
        //const { title, category, sub_category, status, priority, progress, filled_by, ai_summary } = req.body
        const { data, error } = await supabase
            .from('tasks')
            .insert([req.body])

        if (error) return res.status(500).json({ error: error.message })
        return res.status(201).json(data)
    }

    return res.status(405).json({ error: 'Method not allowed' })
}