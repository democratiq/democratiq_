# Democratiq Conversation Context

## Summary
This conversation focused on fixing a critical authentication runtime error and making navigation improvements to the Democratiq application - a multi-tenant task management system for politicians.

## Key Issues Resolved

### 1. Authentication Runtime Error (Primary Issue)
**Problem**: `Error: supabaseKey is required` from `auth-utils.ts`
- The error occurred because `SUPABASE_SERVICE_ROLE_KEY` was being used in client-side code
- This environment variable is only available server-side, causing runtime failures

**Solution**: Restructured authentication to properly separate client-side and server-side operations
- **Removed**: `/src/lib/auth-utils.ts` (problematic file)
- **Created**: `/src/lib/server-auth.ts` (server-side only authentication utility)
- **Created**: `/src/pages/api/auth/verify-role.ts` (API endpoint for role verification)
- **Updated**: `SuperAdminGuard` component to use API route instead of direct server utilities
- **Fixed**: Politician API routes (`list.ts`, `onboard.ts`) to use new server-side auth utility

### 2. Navigation Panel Cleanup
**Changes Made**:
- Removed "QR Generator" from left navigation
- Removed "SOPs" from left navigation  
- Removed "Leaderboard" from left navigation
- Final navigation structure: Dashboard, Clients, Tasks, Staff

## Technical Architecture

### Authentication Flow (Fixed)
1. **Client-side**: Uses `/src/lib/client-auth.ts` with public Supabase client
2. **Server-side**: Uses `/src/lib/server-auth.ts` with service role key
3. **Role verification**: API route `/api/auth/verify-role` bridges client and server
4. **Super admin guard**: Uses API route to verify permissions

### Multi-tenant System
- **Politicians**: Each politician has isolated data with Row Level Security (RLS)
- **Super admin access**: Can onboard new politicians and access all data
- **Regular admin access**: Limited to their politician's data only
- **Data isolation**: Implemented through `politician_id` foreign keys and RLS policies

### Key Components
- **SuperAdminGuard**: Protects super admin only pages (client onboarding)
- **AuthGuard**: General authentication protection for logged-in users
- **Client onboarding**: 5-step form for creating new politician accounts
- **Task system**: Multi-step workflows with progress tracking
- **Source tracking**: Tasks can originate from voice bot, WhatsApp, manual entry, QR code, email

## Database Structure
```sql
- politicians (main tenant table)
- user_profiles (with politician_id for data isolation)
- tasks (with politician_id, includes source field)
- task_workflow_steps (for step-by-step progress)
- categories (per-politician task categories)
- task_counters (statistics per politician)
```

## API Endpoints
- `/api/auth/verify-role` - Server-side role verification
- `/api/politicians/list` - List all politicians (super admin only)
- `/api/politicians/onboard` - Create new politician account (super admin only)
- `/api/webhooks/tasks/create` - External task creation with API key auth
- `/api/debug/user-profile` - Debug endpoint for authentication troubleshooting

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<supabase_service_role_key>
WEBHOOK_API_KEY=<api_key_for_webhook_access>
```

## Recent File Changes

### Created Files
- `/src/lib/server-auth.ts` - Server-side authentication utilities
- `/src/pages/api/auth/verify-role.ts` - Role verification API endpoint

### Deleted Files
- `/src/lib/auth-utils.ts` - Removed due to client-side service key usage

### Modified Files
- `/src/components/super-admin-guard.tsx` - Updated to use API route
- `/src/components/app-sidebar.tsx` - Removed QR Generator, SOPs, Leaderboard
- `/src/pages/api/politicians/list.ts` - Updated import to use server-auth
- `/src/pages/api/politicians/onboard.ts` - Updated import to use server-auth
- `/src/app/admin/debug-auth/page.tsx` - Fixed role display logic

## Current Status
✅ **Authentication system working**: No more runtime errors
✅ **Client onboarding functional**: Super admins can onboard politicians
✅ **Navigation cleaned up**: Removed unused menu items
✅ **Multi-tenant isolation**: Fixed critical bug - now properly filters data by politician_id
✅ **Task source tracking**: Tasks show origin (voice bot, WhatsApp, etc.)
✅ **Workflow progress**: Tasks display step counts (e.g., "2/5" instead of percentages)
✅ **Page loading improvements**: Added navigation progress bar and loading states
✅ **Silent auth errors**: No more error toasts for authentication failures

## Latest Critical Fix: Multi-Tenant Data Isolation

### Problem
When logged in as a politician's admin, users could see ALL tasks, categories, and workflows from ALL politicians instead of just their own.

### Solution
Updated all API endpoints to properly filter by `politician_id`:

1. **Task APIs** (`/api/tasks/list-with-steps.ts`, `/api/tasks/list.ts`)
   - Now filters tasks by politician_id based on logged-in user
   - Super admins can still see all tasks

2. **Categories API** (`/api/categories/list.ts`)
   - Filters categories by politician_id
   - Super admins see all categories

3. **Workflows API** (`/api/workflows/list.ts`)
   - Filters workflows by politician_id
   - Super admins see all workflows

4. **Task Creation** (`/api/tasks/create.ts`)
   - Automatically sets politician_id from user's profile
   - Ensures workflows and categories are looked up within the same politician's data

5. **Webhook API** (`/api/webhooks/tasks/create.ts`)
   - Now requires `politician_id` in the request body
   - Updated documentation to reflect this requirement

### New Helper Functions
Created `/src/lib/api-auth-helpers.ts` with:
- `getAuthContext()` - Gets user's politician_id and role
- `applyPoliticianFilter()` - Applies politician filter to queries based on role

## Latest Improvement: Page Loading Performance

### Problem
Pages were taking too long to load with no visual feedback, causing poor user experience during navigation.

### Solution
1. **Navigation Progress Bar** (`/src/components/navigation-progress.tsx`):
   - Shows progress bar at top of page during navigation
   - Displays loading overlay for slow pages (>50% progress)
   - Automatically detects navigation clicks and shows progress

2. **Page Loading Components** (`/src/components/page-loader.tsx`):
   - `PageLoader` - Full page loading state
   - `TableLoader` - Skeleton loading for tables with animated placeholders

3. **Updated Pages with Loading States**:
   - **Tasks page**: Added TableLoader for task list with skeleton rows
   - **Clients page**: Added TableLoader for politician list
   - **Configuration page**: Added PageLoader for entire page
   - **Silent auth errors**: No error toasts shown for 401/403 responses

4. **Fetch Helper** (`/src/lib/fetch-with-auth.ts`):
   - Centralized fetch wrapper with automatic auth headers
   - Graceful handling of authentication errors

### Benefits
- Users see immediate feedback when navigating between pages
- Skeleton loading gives better perception of performance
- No annoying error messages for unauthorized access
- Cleaner, more professional loading experience

## Next Steps (if needed)
- Test client onboarding flow end-to-end
- Verify super admin access controls
- Test webhook API functionality
- Consider adding user management interface for politicians
- Implement politician dashboard with their specific data

## Important Notes
- Never use `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- All super admin operations must go through API routes
- RLS policies ensure data isolation between politicians
- Authentication errors should be debugged using `/admin/debug-auth` page