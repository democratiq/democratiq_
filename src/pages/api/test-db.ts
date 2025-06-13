import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Testing database connection...')
    
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    console.log('Supabase admin imported successfully')
    
    // Test the connection by trying to select from tasks table
    console.log('About to query tasks table...')
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .limit(1)
    
    console.log('Query completed. Error:', error, 'Data:', data)
    
    if (error) {
      console.error('Database connection error:', error)
      return res.status(500).json({
        error: 'Database connection failed',
        details: error.message,
        supabaseError: error
      })
    }
    
    console.log('Database connection successful')
    res.status(200).json({
      success: true,
      message: 'Database connection working',
      sampleData: data
    })
    
  } catch (error) {
    console.error('Test error:', error)
    console.error('Error type:', typeof error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}