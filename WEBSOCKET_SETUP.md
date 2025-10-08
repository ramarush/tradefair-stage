# WebSocket Real-Time Communication Setup

This project now includes a real-time WebSocket communication system that replaces the polling mechanism for transaction updates.

## Architecture Overview

The system consists of:
1. **WebSocket Server** (`listener.js`) - Express.js server with Socket.IO
2. **PostgreSQL Notifications** - Database triggers notify the server of transaction changes
3. **Client-Side Integration** - React hooks and contexts for real-time updates

## Components

### Server Side
- **`listener.js`** - Main WebSocket server with PostgreSQL listener
- **Database Trigger** - `notify_transaction()` function triggers on transaction INSERT/UPDATE

### Client Side
- **`hooks/useWebSocket.ts`** - WebSocket connection hook
- **`contexts/WebSocketContext.tsx`** - General WebSocket context
- **`contexts/AdminNotificationContext.tsx`** - Admin-specific notifications (replaced polling)
- **`contexts/UserNotificationContext.tsx`** - User-specific notifications

## How It Works

### 1. Database Level
When a transaction is created or updated, PostgreSQL triggers:
```sql
CREATE OR REPLACE FUNCTION notify_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload := json_build_object(
    'event', TG_OP,           -- will be 'INSERT' or 'UPDATE'
    'id', NEW.id,
    'user_id', NEW.user_id,
    'status', NEW.status,
    'amount', NEW.amount,
    'payment_method_id', NEW.payment_method_id
  );

  PERFORM pg_notify('transactions_channel', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transaction_notify ON transactions;

CREATE TRIGGER transaction_notify
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION notify_transaction();
```

### 2. Server Level
The WebSocket server (`listener.js`):
- Connects to PostgreSQL and listens for `transactions_channel` notifications
- Authenticates WebSocket connections using JWT tokens
- Filters and broadcasts updates to appropriate users:
  - **Users**: Only receive updates for their own transactions
  - **Admins**: Receive updates for all transactions

### 3. Client Level
React components use WebSocket hooks to:
- Connect to the WebSocket server with authentication
- Receive real-time transaction updates
- Display notifications and play sounds
- Refresh data automatically

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```env
# WebSocket Configuration
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
npm install express ws socket.io socket.io-client jsonwebtoken concurrently
npm install @types/ws @types/express
```

### 3. Start the System
```bash
# Start both Next.js and WebSocket server
npm run dev:full

# Or start them separately:
npm run dev          # Next.js app
npm run websocket    # WebSocket server
```

## Usage

### For Admin Panel
The admin panel automatically connects to WebSocket and receives:
- New deposit notifications
- New withdrawal notifications
- Real-time dashboard updates
- Audio notifications (with permission)

### For Regular Users
Users receive notifications for:
- Deposit status changes (pending → completed/rejected)
- Withdrawal status changes (pending → completed/rejected)
- Real-time balance updates

### Authentication
WebSocket connections are authenticated using JWT tokens:
- Token is extracted from `localStorage.getItem('token')`
- Server validates the token and extracts user info
- Users only receive updates for their own transactions
- Admins receive updates for all transactions

## API Events

### Server → Client Events
- `connected` - Connection confirmation
- `transaction-update` - User's own transaction updates
- `admin-transaction-update` - All transaction updates (admin only)

### Client → Server Events
- `join-room` - Join specific notification rooms
- Authentication happens during connection handshake

## Benefits

1. **Real-Time Updates** - Instant notifications instead of polling
2. **Reduced Server Load** - No more periodic API calls
3. **Better UX** - Immediate feedback on transaction status changes
4. **Scalable** - WebSocket connections are more efficient than polling
5. **Filtered Updates** - Users only get relevant notifications

## Troubleshooting

### WebSocket Connection Issues
- Check if WebSocket server is running on port 3001
- Verify JWT token is valid and stored in localStorage
- Check browser console for connection errors

### Database Notifications Not Working
- Ensure PostgreSQL trigger is created
- Check if `notify_transaction()` function exists
- Verify database connection in `listener.js`

### No Audio Notifications
- User must grant audio permission by clicking "Enable Audio" button
- Check if `/notification.mp3` file exists in public folder
- Browser may block autoplay - user interaction required first

## Development Notes

- WebSocket server runs on port 3001 by default
- CORS is configured for localhost:3000
- JWT secret should match between Next.js app and WebSocket server
- PostgreSQL connection string should be the same for both services
