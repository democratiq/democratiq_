"use client"

import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

//import data from "./data.json"

type Tasks = {
  id: number
  title: string
  category: string
  sub_category: string
  status: string
  priority: string
  progress: number
  filled_by: string
  ai_summary: string
}

export default function Page() {
  const [tasks, setTasks] = useState<Tasks[]>([]);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    console.log(data);
    setTasks(data)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/*<SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>*/}
              {console.log("before table" + JSON.stringify(tasks))}
              <DataTable data={tasks} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
