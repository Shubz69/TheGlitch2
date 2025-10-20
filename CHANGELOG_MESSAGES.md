Changelog - Messaging & Community Persistence

- Backend
  - Added SQLite persistence via better-sqlite3.
  - Implemented Admin↔User DM threads with endpoints:
    - GET /api/threads
    - GET /api/threads/:threadId/messages?cursor&limit
    - POST /api/threads/:threadId/messages
    - POST /api/threads/:threadId/read
  - Implemented community channel persistence:
    - GET /api/channels/:channelId/messages?cursor&limit
    - POST /api/channels/:channelId/messages
  - Added Socket.IO realtime with rooms per thread/channel.
  - Added rate limiting, sanitization, and /api/metrics.

- Frontend
  - Migrated websockets to Socket.IO (`src/services/WebSocketService.js`).
  - Updated `Api.js` for new REST endpoints and community normalization.
  - Added `SupportInbox` (user) and `AdminInbox` (admin) pages.
  - Updated `Navbar` to include Messages link.
  - Updated `Chat.js` to persistence-first and realtime updates.

- Cleanup
  - Removed legacy STOMP/SockJS hook `src/utils/useWebSocket.js`.
  - Removed `sockjs-client` from devDependencies.

- Tests
  - Added `tests/smoke.test.js` for minimal threads/channels realtime smoke test.


