# SeatFlow.tech

ניהול מושבים חכם, פשוט וזורם

קל לעצב מפות מהבית כנסת שלכם לראש השנה בנפרד ליום הכיפורים בנפרד וכל לכל חגי ישראל או יומי דפגרא

## Storage Server

This project now includes an Express-based storage server backed by PostgreSQL. The server persists map data in a database so that maps for each account can be accessed from anywhere.

### Run the server

```
DATABASE_URL=postgres://user:pass@localhost:5432/dbname npm run server
```

The server creates a `storage` table if it does not exist and listens on `http://localhost:3001`. The client uses `useServerStorage` to communicate with it.

### ZCredit payments

To accept Pro plan payments via ZCredit, set the following environment variables before running the server:

```
ZCREDIT_TERMINAL=<terminal number>
ZCREDIT_USER=<api username>
ZCREDIT_PASS=<api password>
```

The server exposes `POST /api/zcredit/charge` which forwards card details to ZCredit's API (`https://api.zcredit.co.il/api/v3/transactions/charge`). Adjust the endpoint and fields as required by your account.
