# FPT Cinema Frontend

React + Vite frontend scaffold for the `FPT_Cinema` Spring Boot backend.

## Tech stack

- React 19
- Vite
- React Router
- Axios
- Bootstrap / React Bootstrap

## Quick start

```bash
npm install
copy .env.example .env
npm run dev
```

Default API URL:

```bash
http://localhost:8080/api
```

Change it in `.env` when the backend runs on another host or port.

## Scripts

```bash
npm run dev      # start local dev server
npm run build    # production build
npm run lint     # eslint
npm run preview  # preview dist build
```

## Project structure

```text
src/
  app/             # Router composition
  components/      # Reusable UI states and blocks
  config/          # Environment and navigation config
  constants/       # Backend enum mirrors
  contexts/        # Auth provider
  hooks/           # Shared React hooks
  layouts/         # Auth and app shells
  lib/             # Axios client, storage, formatters
  pages/           # Route-level screens by domain
  services/        # API modules mapped to backend controllers
```

## Backend contract

Backend response shape:

```json
{
  "code": 200,
  "message": "OK",
  "result": {}
}
```

`src/lib/apiClient.js` unwraps `result`, attaches the JWT token from local storage, and normalizes API errors.

Endpoint notes live in [docs/api-endpoints.md](docs/api-endpoints.md).

## Team workflow

- Put all backend calls in `src/services`.
- Keep route pages in `src/pages/<domain>`.
- Keep shared UI in `src/components`.
- Do not call Axios directly from page components unless a new service has not been created yet.
- Add backend enum values to `src/constants/enums.js` before using them in forms.
