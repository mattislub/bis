bis

## Storage Server

This project now includes a small file-based storage server used to persist map data on the server rather than in the browser's local storage. This allows maps for each account to be accessed from anywhere.

### Run the server

```
npm run server
```

The client uses `useServerStorage` to communicate with the server at `http://localhost:3001`.
