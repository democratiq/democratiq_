# Democratiq Webhook API Documentation

## Task Creation Webhook Endpoint

**URL:** `POST /api/webhooks/tasks/create`

This endpoint allows external systems to create tasks in Democratiq via webhook with proper authentication.

## Authentication

The API uses simple API key authentication. Add the API key in the request header:

```
X-API-Key: your-secret-api-key
```

## Environment Variables Setup

Add this to your `.env.local` file:

```bash
WEBHOOK_API_KEY=your-very-secure-api-key-here
```

## Request Format

### Required Fields
```json
{
  "title": "Task title",
  "description": "Detailed description of the task",
  "grievance_type": "category", // Must match your category values
  "voter_name": "Name of person submitting"
}
```

### Optional Fields
```json
{
  "sub_category": "specific subcategory", // Optional subcategory
  "status": "open", // Default: "open" 
  "priority": "medium", // "low", "medium", "high" - Default: "medium"
  "assigned_to": "staff-id", // Staff member ID to assign to
  "deadline": "2024-12-31T23:59:59Z", // ISO datetime, auto-calculated if not provided
  "source": "voice_bot", // "voice_bot", "whatsapp", "manual_entry", "qr_code", "email" - Default: "email"
  "webhook_source": "External System Name", // Will prefix task title (deprecated, use source instead)
  "external_id": "ext-12345", // Your system's ID for this task
  "webhook_metadata": { // Additional metadata object
    "source_ip": "192.168.1.1",
    "user_agent": "MyApp/1.0",
    "form_version": "2.1"
  }
}
```

### Valid Category Values
Make sure `grievance_type` matches one of your categories:
- `general`
- `water` 
- `electricity`
- `roads`
- `infrastructure`
- `sanitation`
- `healthcare`
- `education`
- `safety`
- `corruption`
- `other`

## Example Requests

### Using cURL with API Key
```bash
curl -X POST "https://your-domain.com/api/webhooks/tasks/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "title": "Water pipe burst on Main Street",
    "description": "Large water pipe has burst causing flooding on Main Street near the market",
    "grievance_type": "water",
    "sub_category": "Pipe Leak",
    "voter_name": "John Doe",
    "priority": "high",
    "source": "whatsapp",
    "webhook_source": "MyApp"
  }'
```

### Using cURL (Alternative Example)
```bash
curl -X POST "https://your-domain.com/api/webhooks/tasks/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "title": "Street light not working",
    "description": "Street light on Oak Avenue has been out for 3 days",
    "grievance_type": "electricity", 
    "sub_category": "Street Light",
    "voter_name": "Jane Smith",
    "source": "qr_code",
    "webhook_source": "CitizenApp",
    "external_id": "LIGHT-001"
  }'
```

### Using JavaScript/Node.js
```javascript
const axios = require('axios');

const createTask = async () => {
  try {
    const response = await axios.post('https://your-domain.com/api/webhooks/tasks/create', {
      title: 'Pothole on Highway 101',
      description: 'Large pothole is causing damage to vehicles',
      grievance_type: 'roads',
      sub_category: 'Potholes', 
      voter_name: 'Mike Johnson',
      priority: 'medium',
      source: 'voice_bot',
      webhook_source: 'RoadApp',
      external_id: 'POT-456',
      webhook_metadata: {
        latitude: 37.7749,
        longitude: -122.4194,
        photo_url: 'https://example.com/photo.jpg'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-secret-api-key'
      }
    });
    
    console.log('Task created:', response.data);
  } catch (error) {
    console.error('Error creating task:', error.response?.data || error.message);
  }
};
```

### Using Python
```python
import requests
import json

def create_task():
    url = "https://your-domain.com/api/webhooks/tasks/create"
    
    payload = {
        "title": "Garbage not collected this week",
        "description": "Garbage collection missed our street this week",
        "grievance_type": "sanitation",
        "sub_category": "Garbage Collection",
        "voter_name": "Sarah Wilson",
        "source": "email",
        "webhook_source": "MyPythonApp",
        "external_id": "GC-789"
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "your-secret-api-key"
    }
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()
        print("Task created:", response.json())
    except requests.exceptions.RequestException as e:
        print("Error creating task:", e)
```

## Testing Your Webhook

You can test the webhook endpoint quickly with this simple example:

```bash
# Test with your actual API key
curl -X POST "http://localhost:3000/api/webhooks/tasks/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "title": "Test Webhook Task",
    "description": "This is a test task created via webhook",
    "grievance_type": "general",
    "voter_name": "Test User",
    "source": "manual_entry",
    "webhook_source": "Test System"
  }'
```

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Task created successfully via webhook",
  "task": {
    "id": 123,
    "title": "[MyApp] Water pipe burst on Main Street",
    "category": "water",
    "sub_category": "Pipe Leak", 
    "status": "open",
    "priority": "high",
    "filled_by": "John Doe",
    "assigned_to": null,
    "deadline": "2024-12-31T23:59:59Z",
    "created_at": "2024-12-28T10:30:00Z"
  },
  "workflow_attached": true,
  "timestamp": "2024-12-28T10:30:00Z"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key",
  "timestamp": "2024-12-28T10:30:00Z"
}
```

#### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["title", "description", "grievance_type", "voter_name"],
  "provided": ["title", "description"],
  "timestamp": "2024-12-28T10:30:00Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error", 
  "message": "Database connection failed",
  "timestamp": "2024-12-28T10:30:00Z"
}
```

## Features

✅ **Automatic Workflow Attachment** - Tasks automatically get workflow steps based on category/subcategory
✅ **Simple API Key Authentication** - Easy to implement and secure
✅ **Webhook Source Tracking** - Identify which external system created the task
✅ **External ID Support** - Link tasks to your external system IDs
✅ **Metadata Storage** - Store additional context in webhook_metadata
✅ **Auto Deadline Calculation** - Deadlines calculated based on priority if not provided
✅ **Comprehensive Logging** - Full request/response logging for debugging
✅ **Error Handling** - Detailed error messages for troubleshooting

## Security Best Practices

1. **Use HTTPS only** in production
2. **Rotate API keys regularly**
3. **Store API key in environment variables**, never in code
4. **Implement rate limiting** if needed
5. **Log webhook calls** for audit trails
6. **Validate webhook sources** in your application

## Testing

Test the webhook endpoint using the `/admin/tasks/test-workflow` page or directly with cURL/Postman using the examples above.