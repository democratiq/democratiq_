"use client"

import { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconCircleCheckFilled, IconLoader } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, createSelectColumn } from "@/components/data-table"

export interface Task {
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

const columns: ColumnDef<Task>[] = [
  createSelectColumn<Task>(),
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate font-medium">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "category", 
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("category")}
      </Badge>
    ),
  },
  {
    accessorKey: "sub_category",
    header: "Sub Category", 
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("sub_category")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "completed" ? "default" : "secondary"}>
          {status === "completed" ? (
            <IconCircleCheckFilled className="mr-1 h-3 w-3" />
          ) : (
            <IconLoader className="mr-1 h-3 w-3" />
          )}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <Badge 
          variant={
            priority === "high" ? "destructive" : 
            priority === "medium" ? "default" : 
            "secondary"
          }
        >
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: "filled_by",
    header: "Filled By",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("filled_by")}
      </div>
    ),
  },
  {
    accessorKey: "ai_summary",
    header: "AI Summary",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-sm text-muted-foreground">
        {row.getValue("ai_summary")}
      </div>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

interface TasksTableProps {
  data: Task[]
}

export function TasksTable({ data }: TasksTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="title"
      searchPlaceholder="Search tasks..."
    />
  )
}