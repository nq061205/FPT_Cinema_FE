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

The current backend security configuration protects the movie/showtime
catalog endpoints. The public homepage therefore shows a sign-in prompt to
guests and loads the live catalog after authentication.

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

## Chatbot

The red robot button is rendered by `ChatbotWidget` on the public homepage
and in the authenticated app shell. The backend chat controller currently
requires a JWT, so guests see a login prompt. For a signed-in user the
frontend stores the conversation ID per account, restores messages with
`GET /chat/conversations/{id}/messages`, and keeps a local fallback of the
latest 20 messages (10 user/assistant turns) while the API is unavailable.
The backend also sends the latest 20 messages to Gemini, which satisfies the
five-turn context requirement. “Cuộc mới” closes the current conversation
and starts a new one.

For a browser-facing VNPay result page, configure the backend
`VNPAY_RETURN_URL` to point to this FE route (for example
`http://localhost:5173/payment/result`) while preserving the gateway query
parameters. The default backend value returns JSON from its own endpoint.

The FE cannot work around a few backend contract issues: the current booking
service compares enum statuses as strings, review history does not expose a
booking ID, and the promotion list does not expose a promotion ID. Those
backend fixes are required for booking/review/voucher flows to complete
end-to-end. The FE keeps the relevant controls visible and reports API errors
so they can be verified after the backend is corrected.

The admin routes also provide client-side role/permission guards. Backend
method authorization should still be added for movie/product mutations and
report endpoints, because hiding a route in the FE is not a security boundary.

## Added backend-backed screens

In addition to the customer booking flow, the FE now exposes payment history
and VNPay result handling, a staff cash-payment desk, movie/product/showtime
management, room seat generation and editing, access/permission assignment,
review create/update, promotion detail/apply, quick showtime lookup, and
report-specific filters. All calls remain in the service modules under
`src/services`.

## Team workflow

- Put all backend calls in `src/services`.
- Keep route pages in `src/pages/<domain>`.
- Keep shared UI in `src/components`.
- Do not call Axios directly from page components unless a new service has not been created yet.
- Add backend enum values to `src/constants/enums.js` before using them in forms.
