"use client"

import { IconLoader2 } from '@tabler/icons-react'

interface PageLoaderProps {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

export function PageLoader({ 
  loading, 
  children, 
  loadingText = "Loading...",
  className = ""
}: PageLoaderProps) {
  if (loading) {
    return (
      <div className={`flex flex-1 flex-col items-center justify-center gap-4 p-8 ${className}`}>
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{loadingText}</p>
      </div>
    )
  }

  return <>{children}</>
}

export function TableLoader({ 
  loading, 
  children, 
  loadingText = "Loading data...",
  rows = 5
}: PageLoaderProps & { rows?: number }) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <IconLoader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{loadingText}</span>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/5"></div>
            <div className="h-4 bg-muted rounded w-1/6"></div>
          </div>
        ))}
      </div>
    )
  }

  return <>{children}</>
}