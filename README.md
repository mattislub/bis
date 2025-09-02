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

To accept Pro plan payments via ZCredit WebCheckout, set the following environment variables before running the server:

```
ZCREDIT_BASE_URL=https://pci.zcredit.co.il/zCreditWS/
ZCREDIT_TERMINAL=<terminal number>
ZCREDIT_PASSWORD=<terminal password>
ZCREDIT_KEY=<guid key>
PUBLIC_BASE_URL=https://yourdomain.com
```

The server exposes two endpoints:

- `POST /api/zcredit/create-checkout` – creates a WebCheckout session and returns a URL to redirect the customer.
- `POST /api/zcredit/callback` – receives the server-to-server notification from ZCredit after payment.

Adjust endpoint URLs and payload fields according to your ZCredit documentation.
