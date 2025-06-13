# Grievance Form Error Report

## Summary
The grievance form submission is failing with a 500 Internal Server Error because there is a **schema mismatch** between the code expectations and the actual database table structure.

## Root Cause
The `tasks` table in Supabase has a different schema than what the application code expects.

### Expected Schema (in code):
```typescript
{
  id: string
  title: string
  description: string  // ❌ MISSING IN DATABASE
  status: 'open' | 'in_progress' | 'completed' | 'closed'
  priority: 'low' | 'medium' | 'high'
  source: string  // ❌ MISSING IN DATABASE
  grievance_type: string  // ❌ MISSING IN DATABASE
  voter_name?: string  // ❌ MISSING IN DATABASE
  voter_phone?: string  // ❌ MISSING IN DATABASE
  voter_location?: string  // ❌ MISSING IN DATABASE
  // ... other fields
}
```

### Actual Schema (in database):
```
{
  id: number
  created_at: string
  title: string
  category: string  // ✅ Different from grievance_type
  sub_category: string  // ✅ Additional field
  status: string
  priority: string
  progress: number  // ✅ Additional field
  filled_by: string  // ✅ Different from voter_name
  is_deleted: boolean  // ✅ Additional field
  ai_summary: null  // ✅ Additional field
}
```

## Specific Error
When the form tries to submit, the API attempts to insert a record with a `description` field, which causes Supabase to return:
```
Error: Could not find the 'description' column of 'tasks' in the schema cache
Code: PGRST204
```

## Impact
1. **Grievance Form (/grievance-form)**: Completely non-functional - returns 500 error
2. **API Endpoint (/api/tasks/create)**: Fails on any request due to schema mismatch
3. **Missing Service Role Key**: The SUPABASE_SERVICE_ROLE_KEY is not set in environment variables, though this is a secondary issue

## Solutions

### Option 1: Update Database Schema
Add the missing columns to the `tasks` table in Supabase:
- `description` (text)
- `source` (text)
- `grievance_type` (text)
- `voter_name` (text)
- `voter_phone` (text)
- `voter_location` (text)
- `attachments` (text[])
- `assigned_to` (text)
- `sop_steps` (jsonb)
- `points_awarded` (integer)
- `completed_at` (timestamp)
- `metadata` (jsonb)

### Option 2: Update Application Code
Modify the code to match the existing database schema:
- Map `grievance_type` to `category`
- Map `voter_name` to `filled_by`
- Remove the `description` field requirement
- Add support for `sub_category`, `progress`, `is_deleted`, `ai_summary`

### Option 3: Create New Table
Create a new `grievances` table with the expected schema and update the code to use it instead of `tasks`.

## Recommendation
**Option 2** is likely the fastest solution - update the application code to match the existing database schema. This avoids any database migrations and maintains compatibility with existing data.

## Test Results
1. **Database Connection**: ✅ Successful
2. **SELECT Query**: ✅ Works (can read existing tasks)
3. **INSERT Query**: ❌ Fails due to schema mismatch
4. **API Response**: ❌ Returns 500 Internal Server Error

## Environment Issues
- Missing `SUPABASE_SERVICE_ROLE_KEY` in environment variables (currently falling back to anon key)
- `NEXT_PUBLIC_BASE_URL` is set to port 3001 but server runs on port 3000