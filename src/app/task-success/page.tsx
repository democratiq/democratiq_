"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy, IconExternalLink, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'

function TaskSuccessComponent() {
  const searchParams = useSearchParams()
  const taskId = searchParams.get('id')
  const shortId = taskId?.slice(-6) || 'XXXXXX'

  const copyToClipboard = () => {
    if (taskId) {
      navigator.clipboard.writeText(taskId)
      toast.success('Task ID copied to clipboard')
    }
  }

  const trackTask = () => {
    if (taskId) {
      window.open(`/track/${taskId}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <IconCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Task Submitted Successfully!</CardTitle>
          <CardDescription>
            Your task has been recorded and assigned to our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Your Task ID</p>
            <p className="text-2xl font-bold font-mono">{shortId}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Save this ID to track your task status
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              className="w-full"
              disabled={!taskId}
            >
              <IconCopy className="mr-2 h-4 w-4" />
              Copy Task ID
            </Button>
            
            <Button 
              onClick={trackTask} 
              className="w-full"
              disabled={!taskId}
            >
              <IconExternalLink className="mr-2 h-4 w-4" />
              Track Status
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your task will be reviewed within 24 hours</li>
              <li>• You&apos;ll receive SMS updates on progress</li>
              <li>• Track status anytime using your Task ID</li>
              <li>• Average resolution time: 3-7 business days</li>
            </ul>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact us at <br />
            <strong>+91 XXXXX XXXXX</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function GrievanceSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <IconLoader className="h-6 w-6 animate-spin" />
      </div>
    }>
      <TaskSuccessComponent />
    </Suspense>
  )
}