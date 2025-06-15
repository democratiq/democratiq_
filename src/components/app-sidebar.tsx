"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconRobot,
  IconChartPie,
  IconAdjustments,
  IconMessageReport,
  IconBuilding,
  IconCalendarPlus,
  IconPlus,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Clients",
      url: "/admin/clients",
      icon: IconBuilding,
      items: [
        {
          title: "All Clients",
          url: "/admin/clients",
        },
        {
          title: "Onboard Client",
          url: "/admin/clients/onboard",
        },
      ],
    },
    {
      title: "Tasks",
      url: "/admin/tasks",
      icon: IconListDetails,
      items: [
        {
          title: "Tasks",
          url: "/admin/tasks",
        },
        {
          title: "Analytics",
          url: "/admin/tasks/analytics",
        },
        {
          title: "Configuration",
          url: "/admin/tasks/configuration",
        },
        {
          title: "Task Source",
          url: "/admin/tasks/complaint-source",
        },
      ],
    },
    {
      title: "Staff",
      url: "/admin/staff",
      icon: IconUsers,
      items: [
        {
          title: "Staff Management",
          url: "/admin/staff",
        },
        {
          title: "Analytics",
          url: "/admin/staff/analytics",
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Auth Debug",
      url: "/admin/debug-auth",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Admin Guide",
      url: "/admin/guide",
      icon: IconHelp,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "AI Assistant",
      url: "#",
      icon: IconRobot,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Democratiq</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Create Event Button */}
        <div className="px-3 py-2">
          <Button asChild className="w-full gap-2">
            <a href="/admin/events/create">
              <IconCalendarPlus className="h-4 w-4" />
              Create Event
            </a>
          </Button>
        </div>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
