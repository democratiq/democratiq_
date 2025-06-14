# Democratiq Development Notes

## Project Overview
Democratiq is a task management system for handling citizen grievances with workflow-based process automation.

## Key Features
- Task creation with automatic workflow attachment based on category/subcategory
- Workflow step tracking with checkboxes for completion
- Progress calculation based on completed workflow steps
- Admin dashboard for task management

## Recent Issues Fixed

### Workflow Attachment Issue (2024)
**Problem**: Tasks were not getting workflow_id assigned during creation, so workflow steps weren't being attached to new tasks.

**Root Cause**: 
1. Tasks created through the admin interface had category/subcategory combinations but workflow lookup was failing
2. Console logs showed tasks had workflow_id as null/undefined
3. Select component had empty string values causing React errors

**Investigation**:
- Created test pages at `/admin/tasks/test-workflow` and `/admin/tasks/debug` for debugging
- Added extensive logging to task creation API (`/api/tasks/create.ts`)
- Used `/api/tasks/list-with-steps` to verify step counts

**Fix Applied**:
- Fixed Select component error by changing empty string value to "all" in test-workflow page
- Updated subcategory handling to properly convert "all" to null for workflow lookup

**Files Modified**:
- `src/app/admin/tasks/test-workflow/page.tsx` - Fixed Select.Item empty value issue
- `src/pages/api/tasks/create.ts` - Enhanced with debugging logs for workflow attachment
- `src/app/admin/tasks/page.tsx` - Updated to show step counts instead of percentages

## Database Schema

### Key Tables
- `tasks` - Main task records with workflow_id foreign key and source column
- `workflows` - Workflow definitions by category/subcategory  
- `workflow_steps` - Step templates for workflows
- `task_workflow_steps` - Individual step instances for each task

### Required Migrations
1. **task_workflow_steps table**: Run `task_workflow_steps_migration.sql`
2. **source column**: Run `add_source_column_migration.sql` to add source tracking

### Workflow Attachment Logic
1. When creating a task, look up workflow by category_id and subcategory
2. If no specific subcategory match, try 'all' subcategories workflow
3. If workflow found, update task with workflow_id and create task_workflow_steps records

## API Endpoints
- `POST /api/tasks/create` - Create task with automatic workflow attachment (internal use)
- `POST /api/webhooks/tasks/create` - Webhook endpoint for external task creation (with authentication)
- `GET /api/tasks/list-with-steps` - Fetch tasks with step completion counts
- `PUT /api/tasks/[id]/steps` - Update workflow step status
- `GET /api/debug/workflows` - Debug endpoint for workflow data

## Webhook API
The system supports external task creation via webhook at `/api/webhooks/tasks/create` with API key authentication:
- **Authentication**: `X-API-Key` header
- **Environment Variable**: `WEBHOOK_API_KEY=your-secret-key`

See `WEBHOOK_API.md` for complete documentation and examples.

## Testing Tools
- `/admin/tasks/test-workflow` - Test workflow lookup functionality
- `/admin/tasks/debug` - Debug workflow and step data
- Console logging in task creation for troubleshooting

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run linting
- `npm run typecheck` - TypeScript type checking

## Known Issues
- Workflow attachment during task creation needs verification after category changes
- Progress calculation depends on proper workflow_id assignment
- Select components require non-empty string values to avoid React errors