# TGPro API Documentation

Comprehensive API documentation for TGPro - Telegram Automation Platform. This document covers all available endpoints, authentication, and usage examples.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health & Status](#health--status)
  - [Authentication](#authentication-endpoints)
  - [Configuration](#configuration)
  - [Groups Management](#groups-management)
  - [Messages Management](#messages-management)
  - [Templates](#templates)
  - [Blacklist](#blacklist)
  - [Logs](#logs)
  - [WebSocket](#websocket)
  - [Tasks](#tasks)

## 🌐 Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:8001/api
```

**Note**: All API routes must be prefixed with `/api` for proper routing through Kubernetes ingress.

## 🔐 Authentication

### Bearer Token Authentication

All API endpoints require Bearer token authentication:

```http
Authorization: Bearer your-api-key-here
```

### API Key

Default API key for development:
```
telegram-automation-key-2025
```

### JWT Authentication

Some endpoints require JWT tokens obtained through the authentication flow:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-26T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  },
  "timestamp": "2025-01-26T10:30:00Z"
}
```

## ⚠️ Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request data validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication |
| `PERMISSION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `SERVICE_UNAVAILABLE` | External service unavailable |

## 🚦 Rate Limiting

Rate limits are enforced per API key:

- **General API**: 100 requests/minute
- **Authentication**: 10 requests/minute
- **Message Operations**: 50 requests/minute
- **Bulk Operations**: 20 requests/minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

## 📡 Endpoints

### Health & Status

#### Get System Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "telegram_service": true,
      "db_service": true,
      "encryption_service": true,
      "config_service": true,
      "auth_service": true,
      "websocket_manager": true,
      "task_service": true,
      "config_manager": true,
      "blacklist_manager": true
    },
    "version": "3.1.0",
    "uptime": "2d 14h 32m"
  }
}
```

### Authentication Endpoints

#### Telegram Login Widget
```http
POST /api/auth/telegram-login
```

**Request Body:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
  "auth_date": 1643723400,
  "hash": "calculated_hash_value"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe"
    },
    "token": "jwt_token_here",
    "expires_at": "2025-01-26T11:30:00Z"
  },
  "message": "Welcome, John! Authentication successful."
}
```

#### Configure API Credentials
```http
POST /api/auth/configure
```

**Request Body:**
```json
{
  "api_id": 12345678,
  "api_hash": "abcd1234efgh5678ijkl9012mnop3456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "api_id": 12345678
  },
  "message": "API credentials configured successfully"
}
```

#### Get Configuration Status
```http
GET /api/auth/configuration
```

**Response:**
```json
{
  "success": true,
  "data": {
    "api_configured": true,
    "api_id": 12345678,
    "has_session": false
  }
}
```

#### Authentication Status
```http
GET /api/auth/status
```

**Headers Required:**
```http
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": 123456789,
      "first_name": "John",
      "username": "johndoe"
    },
    "session_valid": true
  }
}
```

### Configuration

#### Get Configuration
```http
GET /api/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "delays": {
      "min_delay_msg": 5,
      "max_delay_msg": 10,
      "min_cycle_delay_hours": 1.1,
      "max_cycle_delay_hours": 1.3
    },
    "safety": {
      "max_messages_per_hour": 50,
      "max_messages_per_day": 200,
      "enable_content_analysis": true,
      "enable_warmup_schedule": true
    },
    "paths": {
      "groups_file": "/app/backend/groups.txt",
      "messages_dir": "/app/backend/messages"
    }
  }
}
```

#### Update Configuration
```http
PUT /api/config
```

**Request Body:**
```json
{
  "delays": {
    "min_delay_msg": 7,
    "max_delay_msg": 12
  },
  "safety": {
    "max_messages_per_hour": 30
  }
}
```

### Groups Management

#### List Groups
```http
GET /api/groups
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      "https://t.me/group1",
      "https://t.me/group2",
      "@group3"
    ],
    "count": 3
  }
}
```

#### Add Group
```http
POST /api/groups
```

**Request Body:**
```json
{
  "group_link": "https://t.me/newgroup"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "group_link": "https://t.me/newgroup",
    "added": true
  },
  "message": "Group added successfully"
}
```

#### Remove Group
```http
DELETE /api/groups/{group_link}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "group_link": "https://t.me/newgroup",
    "removed": true
  },
  "message": "Group removed successfully"
}
```

### Messages Management

#### List Messages
```http
GET /api/messages
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "filename": "message1.txt",
        "content": "Hello {name}! Welcome to our channel.",
        "size": 156,
        "modified": "2025-01-26T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

#### Create Message
```http
POST /api/messages
```

**Request Body:**
```json
{
  "filename": "new_message",
  "content": "Hello {name}!\n\nThis is a new message template.\n\nBest regards,\nTeam"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "new_message.txt",
    "created": true,
    "size": 87
  },
  "message": "Message file created successfully"
}
```

#### Update Message
```http
PUT /api/messages/{filename}
```

**Request Body:**
```json
{
  "content": "Updated message content here."
}
```

#### Delete Message
```http
DELETE /api/messages/{filename}
```

### Templates

#### List Templates
```http
GET /api/templates
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "welcome_template",
        "content": "Welcome {name} to {group}!",
        "variables": ["name", "group"],
        "created_at": "2025-01-26T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

#### Create Template
```http
POST /api/templates
```

**Request Body:**
```json
{
  "template_id": "promo_template",
  "content": "Hi {name}! Check out our {product} with {discount}% off!",
  "variables": {
    "name": ["John", "Jane", "Alex"],
    "product": ["Premium Plan", "Pro Version"],
    "discount": ["20", "30", "50"]
  }
}
```

### Blacklist

#### Get Blacklist Status
```http
GET /api/blacklist
```

**Response:**
```json
{
  "success": true,
  "data": {
    "permanent": [
      "https://t.me/spamgroup1",
      "https://t.me/bannedgroup2"
    ],
    "temporary": [
      {
        "group": "https://t.me/tempgroup",
        "expires": "2025-01-27T10:30:00Z"
      }
    ],
    "total": 3
  }
}
```

#### Add to Permanent Blacklist
```http
POST /api/blacklist/permanent
```

**Request Body:**
```json
{
  "group_link": "https://t.me/spamgroup",
  "reason": "Spam and inappropriate content"
}
```

#### Remove from Blacklist
```http
DELETE /api/blacklist/permanent/{group_link}
```

### Logs

#### Get System Logs
```http
GET /api/logs?lines=50&level=info
```

**Query Parameters:**
- `lines` (optional): Number of log lines to return (default: 100)
- `level` (optional): Log level filter (debug, info, warning, error)
- `since` (optional): ISO timestamp to get logs since

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2025-01-26T10:30:00Z",
        "level": "info",
        "message": "Message sent successfully to group",
        "context": {
          "group": "https://t.me/group1",
          "message_id": "msg_123"
        }
      }
    ],
    "count": 1,
    "total_available": 500
  }
}
```

### WebSocket

#### Get WebSocket Connections
```http
GET /api/ws/connections
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_connections": 5,
    "connection_types": {
      "logs": 2,
      "monitoring": 2,
      "tasks": 1
    },
    "active_client_ids": ["client_1", "client_2"],
    "queue_size": 0
  }
}
```

#### Broadcast Message
```http
POST /api/ws/broadcast
```

**Request Body:**
```json
{
  "message": "System maintenance in 5 minutes",
  "type": "announcement",
  "recipients": ["all"]
}
```

#### Add Log Entry (WebSocket Broadcast)
```http
POST /api/ws/log
```

**Request Body:**
```json
{
  "level": "info",
  "message": "Custom log message",
  "context": {
    "source": "api",
    "user_id": 123456789
  }
}
```

### Tasks

#### Get Task Statistics
```http
GET /api/tasks/stats/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tasks": 150,
    "by_status": {
      "pending": 5,
      "running": 2,
      "completed": 140,
      "failed": 3
    },
    "by_type": {
      "message_sending": 120,
      "bulk_message": 20,
      "group_management": 10
    },
    "running_status": true,
    "queue_size": 7,
    "active_tasks_count": 2
  }
}
```

#### Create Message Sending Task
```http
POST /api/tasks/message-sending
```

**Request Body:**
```json
{
  "template_id": "welcome_template",
  "recipients": [
    "https://t.me/group1",
    "https://t.me/group2"
  ],
  "variables": {
    "name": "John Doe",
    "product": "Premium Plan"
  },
  "delay_override": {
    "message_delay": 8
  },
  "schedule_at": "2025-01-26T15:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_abc123",
    "type": "message_sending",
    "status": "pending",
    "created_at": "2025-01-26T10:30:00Z",
    "estimated_completion": "2025-01-26T15:30:00Z",
    "progress": {
      "total": 2,
      "completed": 0,
      "percentage": 0
    }
  },
  "message": "Message sending task created successfully"
}
```

#### Get Task Status
```http
GET /api/tasks/{task_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_abc123",
    "type": "message_sending",
    "status": "running",
    "progress": {
      "total": 2,
      "completed": 1,
      "percentage": 50,
      "current_step": "Sending to group 2"
    },
    "created_at": "2025-01-26T10:30:00Z",
    "started_at": "2025-01-26T15:00:00Z",
    "estimated_completion": "2025-01-26T15:15:00Z",
    "results": {
      "sent": 1,
      "failed": 0,
      "errors": []
    }
  }
}
```

#### Cancel Task
```http
POST /api/tasks/{task_id}/cancel
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_abc123",
    "status": "cancelled",
    "cancelled_at": "2025-01-26T10:35:00Z"
  },
  "message": "Task cancelled successfully"
}
```

#### List Tasks
```http
GET /api/tasks?status=running&type=message_sending&limit=50
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, running, completed, failed, cancelled)
- `type` (optional): Filter by type (message_sending, bulk_message, group_management)
- `limit` (optional): Number of tasks to return (default: 50, max: 100)
- `offset` (optional): Number of tasks to skip (pagination)

## 🔌 WebSocket API

### Connection

Connect to WebSocket endpoints:

```javascript
// Logs WebSocket
const logsWs = new WebSocket('wss://your-domain.com/api/ws/logs?api_key=your-api-key');

// Monitoring WebSocket  
const monitoringWs = new WebSocket('wss://your-domain.com/api/ws/monitoring?api_key=your-api-key');

// Tasks WebSocket
const tasksWs = new WebSocket('wss://your-domain.com/api/ws/tasks?api_key=your-api-key');
```

### Message Formats

#### Incoming Messages
```json
{
  "type": "log_entry",
  "data": {
    "timestamp": "2025-01-26T10:30:00Z",
    "level": "info",
    "message": "Operation completed"
  }
}

{
  "type": "system_stats",
  "data": {
    "cpu_percent": 45.2,
    "memory_percent": 67.8,
    "disk_percent": 34.5
  }
}

{
  "type": "task_update",
  "data": {
    "task_id": "task_abc123",
    "status": "running",
    "progress": 75
  }
}
```

#### Outgoing Messages
```json
{
  "action": "ping"
}

{
  "action": "subscribe",
  "channel": "system_stats"
}

{
  "action": "unsubscribe", 
  "channel": "task_updates"
}
```

## 📝 Example Usage

### Python Example

```python
import requests
import json

# Configuration
BASE_URL = "https://your-domain.com/api"
API_KEY = "telegram-automation-key-2025"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Health check
response = requests.get(f"{BASE_URL}/health", headers=HEADERS)
print(f"Health: {response.json()}")

# Add group
group_data = {"group_link": "https://t.me/newgroup"}
response = requests.post(f"{BASE_URL}/groups", headers=HEADERS, json=group_data)
print(f"Add group: {response.json()}")

# Create message sending task
task_data = {
    "template_id": "welcome_template",
    "recipients": ["https://t.me/newgroup"],
    "variables": {"name": "John"}
}
response = requests.post(f"{BASE_URL}/tasks/message-sending", headers=HEADERS, json=task_data)
task_id = response.json()["data"]["task_id"]
print(f"Task created: {task_id}")
```

### JavaScript Example

```javascript
const API_BASE = 'https://your-domain.com/api';
const API_KEY = 'telegram-automation-key-2025';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Health check
fetch(`${API_BASE}/health`, { headers })
  .then(response => response.json())
  .then(data => console.log('Health:', data));

// List groups
fetch(`${API_BASE}/groups`, { headers })
  .then(response => response.json())
  .then(data => console.log('Groups:', data.data.groups));

// WebSocket connection
const ws = new WebSocket(`wss://your-domain.com/api/ws/logs?api_key=${API_KEY}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Log:', message);
};
```

### cURL Examples

```bash
# Health check
curl -H "Authorization: Bearer telegram-automation-key-2025" \
     https://your-domain.com/api/health

# Add group
curl -X POST \
     -H "Authorization: Bearer telegram-automation-key-2025" \
     -H "Content-Type: application/json" \
     -d '{"group_link": "https://t.me/newgroup"}' \
     https://your-domain.com/api/groups

# Get task status
curl -H "Authorization: Bearer telegram-automation-key-2025" \
     https://your-domain.com/api/tasks/task_abc123
```

## 🚀 SDKs and Libraries

### Official SDKs
- **Python**: `tgpro-python-sdk` (coming soon)
- **JavaScript/Node.js**: `tgpro-js-sdk` (coming soon)

### Community Libraries
- Check our GitHub repository for community-contributed libraries

---

For more information, see the [main documentation](./README.md) or contact the development team.