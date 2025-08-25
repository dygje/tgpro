# Telegram MTProto Automation System

A comprehensive Telegram automation application that uses MTProto API (not Bot API) to send messages automatically to multiple groups with advanced safety features, blacklist management, and natural message patterns.

## 🚀 Features

### Core Functionality
- **MTProto API Integration**: Direct Telegram API access (not Bot API)
- **Phone Number Authentication**: Login with phone + OTP + 2FA support
- **Auto Message Sending**: Send messages to multiple groups automatically
- **Random Message Selection**: Load random messages from files
- **Template System**: Create customizable message templates with variables
- **Smart Delays**: Random delays between messages (5-10 seconds) and cycles (1.1-1.3 hours)

### Safety & Security
- **Blacklist Management**: Automatic permanent and temporary blacklisting
- **Account Health Monitoring**: Track success rates, flood waits, and usage patterns
- **Rate Limiting**: Intelligent rate limiting to prevent account restrictions
- **Content Analysis**: Spam detection and content variation
- **Warmup Schedule**: Gradual account activity increase for new accounts
- **Error Handling**: Comprehensive error handling for all Telegram API errors

### Management Interface
- **Web Dashboard**: Modern React-based management interface
- **Real-time Monitoring**: Live task tracking and status updates
- **Configuration Management**: Easy config editing through web interface
- **Log Viewer**: Real-time log viewing with filtering
- **Template Editor**: Visual template creation and management
- **Groups Manager**: Add, remove and manage Telegram groups
- **Messages Manager**: Create, edit and manage message files

## 📋 Requirements

- Python 3.11+ (Recommended)
- Node.js 18+ (Recommended)
- MongoDB (for data storage)
- Telegram API credentials (api_id and api_hash)

## 🛠 Installation & Setup

### 1. Telegram API Credentials

1. Go to [my.telegram.org/apps](https://my.telegram.org/apps)
2. Log in with your phone number
3. Create a new application
4. Note down your `api_id` and `api_hash`

### 2. Configuration

Edit `/app/config.json` with your credentials:

```json
{
  "telegram": {
    "api_id": "YOUR_API_ID",
    "api_hash": "YOUR_API_HASH",
    "phone_number": "+1234567890"
  },
  "delays": {
    "min_delay_msg": 5,
    "max_delay_msg": 10,
    "min_cycle_delay_hours": 1.1,
    "max_cycle_delay_hours": 1.3
  }
}
```

### 3. Setup Groups and Messages

1. **Groups**: Add Telegram group links to `/app/backend/groups.txt`
   ```
   https://t.me/group1
   @group2
   https://t.me/group3
   ```

2. **Messages**: Add message files to `/app/backend/messages/`
   - Create files like `1.txt`, `2.txt`, etc.
   - Each file should contain one message

## 🚀 Usage Guide

### 1. Authentication
1. Open the web dashboard
2. Enter your phone number
3. Enter the verification code sent to your phone
4. If 2FA is enabled, enter your password

### 2. Configure Groups
- Add group links to `groups.txt` or manage through the web interface
- Format: One group per line (links or usernames)

### 3. Create Message Templates
- Use the Template Manager to create dynamic message templates
- Support for variables: `{{ variable_name }}`
- Random variable selection for message variation

### 4. Send Messages
1. Go to Message Sender
2. Select a template
3. Choose target groups (all or specific)
4. Configure custom variables (optional)
5. Start the automation

### 5. Monitor Activity
- Check Dashboard for account health
- View real-time logs
- Monitor blacklist status
- Track message delivery statistics

## ⚙️ Configuration Options

### Delays
- `min_delay_msg`: Minimum delay between messages (seconds)
- `max_delay_msg`: Maximum delay between messages (seconds)
- `min_cycle_delay_hours`: Minimum delay between cycles (hours)
- `max_cycle_delay_hours`: Maximum delay between cycles (hours)

### Safety Settings
- `max_messages_per_hour`: Hourly message limit
- `max_messages_per_day`: Daily message limit
- `enable_content_analysis`: Enable spam detection
- `enable_warmup_schedule`: Enable gradual activity increase

## 🛡️ Safety Features

### Automatic Blacklisting
- **Permanent**: Groups causing errors like ChatForbidden, UserBlocked
- **Temporary**: Groups with rate limits (FloodWait, SlowModeWait)
- **Auto-expiry**: Temporary blacklist entries expire automatically

### Account Protection
- **Risk Assessment**: Real-time risk level calculation
- **Content Analysis**: Spam keyword detection
- **Pattern Variation**: Automatic message variation
- **Warmup Schedule**: Safe activity patterns for new accounts

### Error Handling
- **FloodWait**: Automatic delay handling
- **Rate Limits**: Intelligent retry mechanisms
- **Connection Issues**: Automatic reconnection
- **Invalid Groups**: Automatic blacklisting

## 🔒 Security Considerations

1. **API Credentials**: Keep api_id and api_hash secure
2. **Session Files**: Protect session files (equivalent to login tokens)
3. **2FA**: Enable two-factor authentication on your Telegram account
4. **Rate Limits**: Respect Telegram's rate limits to avoid bans
5. **Content**: Avoid spam-like content and behavior
6. **Groups**: Only send messages to groups where you have permission

## ⚠️ Disclaimer

- This tool is for legitimate automation purposes only
- Users are responsible for complying with Telegram's Terms of Service
- Misuse may result in account restrictions or bans
- Always respect group rules and member preferences
- Use the built-in safety features to maintain good account standing
