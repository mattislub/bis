# SeatFlow.tech

ניהול מושבים חכם, פשוט וזורם

## Storage Server

This project now includes an Express-based storage server backed by PostgreSQL. The server persists map data in a database so that maps for each account can be accessed from anywhere.

### Run the server

```
DATABASE_URL=postgres://user:pass@localhost:5432/dbname npm run server
```

The server creates a `storage` table if it does not exist and listens on `http://localhost:3001`. The client uses `useServerStorage` to communicate with it.
