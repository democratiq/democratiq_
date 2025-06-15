"use client"

import { useEffect, useState, useCallback, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { IconLoader2 } from '@tabler/icons-react'

function NavigationProgressComponent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setProgress(0)
    
    // Simulate progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer)
          return 90
        }
        return prev + 10
      })
    }, 100)
    
    return () => clearInterval(timer)
  }, [])

  const completeLoading = useCallback(() => {
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 200)
  }, [])

  useEffect(() => {
    // Handle navigation start
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && !link.href.startsWith('#') && !link.href.startsWith('javascript:')) {
        const currentUrl = window.location.pathname + window.location.search
        const newUrl = new URL(link.href, window.location.href)
        const targetUrl = newUrl.pathname + newUrl.search
        
        // Only show progress for actual navigation within the app
        if (currentUrl !== targetUrl && newUrl.origin === window.location.origin && !link.getAttribute('data-no-progress')) {
          startLoading()
        }
      }
    }

    // Complete loading when route changes
    completeLoading()
    
    // Listen for navigation clicks
    document.addEventListener('click', handleClick, true)
    
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [pathname, searchParams, startLoading, completeLoading])

  if (!isLoading) return null

  return (
    <>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-primary/30 blur-sm" />
        </div>
      </div>
      
      {/* Loading overlay for slow pages */}
      {progress > 50 && (
        <div className="fixed inset-0 z-[90] bg-background/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-3">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading page...</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressComponent />
    </Suspense>
  )
}