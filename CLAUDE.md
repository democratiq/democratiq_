# Democratiq Development Context

## Project Overview
Democratiq is a comprehensive task and grievance management platform for politicians and their teams. It provides multi-tenant data isolation, workflow automation, staff management, analytics, and citizen engagement tools.

## Tech Stack

### Frontend Framework
- **Next.js 15.3.3** with React 19.0.0
- **TypeScript** for type safety
- **Tailwind CSS v4** with inline configuration
- **App Router** architecture

### UI Components & Design
- **shadcn/ui** components (New York style) with Radix UI primitives
- **@tabler/icons-react** for icons
- **next-themes** for light/dark/system theme management
- **recharts** for data visualization
- **sonner** for toast notifications
- **vaul** for drawer components

### Database & Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **API Routes** (Next.js) for backend logic
- **Multi-tenant architecture** with politician_id isolation

### Additional Libraries
- **@dnd-kit** for drag and drop functionality
- **@tanstack/react-table** for advanced table features
- **bcryptjs** for password hashing
- **qrcode** for QR code generation
- **twilio** for SMS/voice integration
- **mongoose** for MongoDB operations (if needed)
- **zod** for schema validation

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Recommended Commands
```bash
npm run typecheck    # TypeScript type checking (if available)
```

## Project Structure

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   │   ├── tasks/         # Task management
│   │   ├── staff/         # Staff management with table/card views
│   │   ├── clients/       # Client onboarding (super admin only)
│   │   └── analytics/     # Performance analytics with gamification
│   ├── dashboard/         # Main dashboard
│   └── login/            # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── contexts/             # React contexts (theme, auth)
├── lib/                  # Utility functions and configurations
└── pages/api/            # API routes
    ├── tasks/            # Task CRUD operations
    ├── staff/            # Staff management APIs
    ├── webhooks/         # External integrations
    └── politicians/      # Client management
```

## Recent Major Features

### 1. Theme Management System
- **Light/Dark/System** theme options
- **Context-based** theme provider with localStorage persistence
- **Theme toggle** component integrated in navigation
- **Hydration-safe** theme detection

### 2. Enhanced Analytics Dashboard
- **Employee Leaderboard** with performance metrics
- **Department Analysis** with comparative charts
- **Gamification System** (points, badges, streaks)
- **Performance Insights** with NPS tracking
- **Tabbed interface** for organized data presentation

### 3. Advanced Staff Management
- **Dual View Modes**: Cards and Table views
- **Advanced Filtering**: Search, role, department filters
- **Sortable Columns**: Name, role, department, date added
- **Department Categories**: 10 predefined departments
- **CRUD Operations** with multi-tenant isolation
- **Real-time Updates** with optimistic UI

### 4. Multi-Tenant Architecture
- **Data Isolation**: Complete separation by politician_id
- **Authentication Layers**: User roles (super_admin, admin, agent, supervisor)
- **Client Onboarding**: Automated provisioning system
- **RLS Policies**: Database-level security

## Database Schema

### Core Tables
```sql
-- User management
politicians              # Client/politician profiles
user_profiles           # User roles and politician associations

-- Task management
tasks                   # Main task records with workflow_id
categories             # Task categories
workflows              # Workflow definitions
workflow_steps         # Step templates
task_workflow_steps    # Task-specific step instances

-- Staff management
staff                  # Team member records with departments

-- Analytics
task_counters          # Performance metrics per politician
```

### Required Migrations
1. **Basic Setup**: `task_workflow_steps_migration.sql`
2. **Source Tracking**: `add_source_column_migration.sql`
3. **Multi-tenant**: `politician_onboarding_migration.sql`

## Environment Variables

### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# API Security
WEBHOOK_API_KEY=your-webhook-api-key
SUPER_ADMIN_API_KEY=your-super-admin-api-key
```

## Configuration Files

### TypeScript Configuration
- **Target**: ES2017
- **Strict Mode**: Enabled
- **Path Mapping**: `@/*` → `./src/*`
- **JSX**: Preserve (handled by Next.js)

### Tailwind CSS v4
- **Inline Configuration**: Via `@theme` in globals.css
- **CSS Variables**: For design tokens
- **Dark Mode**: Class-based with `.dark` prefix
- **Component Library**: shadcn/ui compatible

### ESLint
- **Config**: `eslint.config.mjs`
- **Next.js Rules**: Enabled
- **TypeScript Support**: Configured

## API Architecture

### Authentication
- **Supabase Auth**: JWT-based authentication
- **Role-based Access**: Multiple user roles
- **API Helpers**: Centralized auth utilities
- **Multi-tenant Filtering**: Automatic politician_id isolation

### Key API Endpoints
```
# Staff Management
GET    /api/staff/list              # List staff with filtering
POST   /api/staff/create            # Create new staff member
PUT    /api/staff/[id]/update       # Update staff member
DELETE /api/staff/[id]/delete       # Deactivate staff member

# Task Management
POST   /api/tasks/create            # Internal task creation
GET    /api/tasks/list-with-steps   # Tasks with workflow progress
PUT    /api/tasks/[id]/steps        # Update workflow steps

# Webhooks
POST   /api/webhooks/tasks/create   # External task creation
POST   /api/webhooks/whatsapp       # WhatsApp integration

# Client Management (Super Admin)
POST   /api/politicians/onboard     # Client onboarding
GET    /api/politicians/list        # List clients
```

## Development Workflow

### 1. Authentication Setup
- Users authenticated via Supabase Auth
- Role assignment in `user_profiles` table
- Multi-tenant isolation via `politician_id`

### 2. Data Access Patterns
- All queries filtered by `politician_id`
- RLS policies enforce data isolation
- Service role key for admin operations

### 3. UI Development
- shadcn/ui components for consistency
- Responsive design with Tailwind CSS
- Theme-aware styling
- Accessibility-first approach

### 4. Testing & Debugging
- Debug pages: `/admin/tasks/debug`, `/admin/debug-auth`
- API test endpoints: `/api/test-db`, `/api/debug/*`
- Console logging for workflow debugging
- Manual testing tools integrated

## Troubleshooting

### Common Issues
1. **Theme Hydration**: Use `mounted` state for theme-dependent rendering
2. **Database Access**: Verify RLS policies and politician_id filtering  
3. **Workflow Attachment**: Check category/subcategory matching logic
4. **API Authentication**: Ensure proper headers and role verification

### Debug Tools
- Browser dev tools for client-side issues
- Supabase dashboard for database queries
- API test pages for backend debugging
- Console logs in development mode

## Security Considerations
- **API Key Protection**: Environment variables only
- **RLS Enforcement**: Database-level security
- **Input Validation**: Zod schemas where applicable
- **Authentication Headers**: Required for all protected routes
- **Multi-tenant Isolation**: Verified at query level

See `WEBHOOK_API.md` for webhook documentation and integration examples.