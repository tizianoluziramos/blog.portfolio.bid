---
title: "express-turnstile-revived: Turnstile Verification for Express"
date: 2026-11-21 17:16:56
description: "Validate Cloudflare Turnstile tokens in Express with configurable retries, timeouts, request-body cleanup, and application error-handler integration."
categories:
  - Projects
tags:
  - Express
  - Cloudflare
  - Turnstile
  - Node.js
  - TypeScript
  - Security
---

<img src="/images/cloudflare-banner.webp" alt="Cloudflare logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Adding a Turnstile widget to a form is only half the integration: the backend still needs to verify the token before processing the submission. [express-turnstile-revived](https://github.com/tizianoluziramos/express-turnstile-revived) handles that server-side step as Express middleware, with configurable retries, a total timeout, and predictable error responses.

<!--more-->

## What is express-turnstile-revived?

express-turnstile-revived is a TypeScript middleware package for validating [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) tokens in an Express application.

The public API centers on two functions: `configureTurnstile()` sets the shared secret and options, while `validateTurnstile()` creates middleware for a protected route. That middleware sends the submitted token to Cloudflare's Siteverify endpoint and calls the next handler only after successful verification.

It does not render a browser widget, validate the rest of your form, or authenticate a user. Those remain separate parts of the application.

## What it supports

- **Two request-body token fields:** `token` and `cf-turnstile-response`.
- **Global configuration and route-level overrides**, including different secrets for different routes.
- **Token input checks**, rejecting blank strings, incorrect types, and values longer than 2,048 characters.
- **Request-body cleanup after success**, removing both captcha fields before the controller runs.
- **Retries for temporary verification failures**, with exponential backoff and a shared idempotency key.
- **A total verification timeout**, covering the requests and waits together.
- **Direct JSON errors or Express error-handler integration**, selected through `errorMode`.
- **Bundled TypeScript declarations**, with the published middleware supporting Node.js 22 and later.

The source and current usage instructions are available in the [repository](https://github.com/tizianoluziramos/express-turnstile-revived), and the package is published on [npm](https://www.npmjs.com/package/express-turnstile-revived).

## Getting started with Express

### 1. Install the dependencies

Use **Node.js 22 or later**. The current package uses Express 4 as a dependency; for a small standalone demo, install:

```bash
pnpm add express@4 express-turnstile-revived
```

For an existing Express 4 application, you only need to add `express-turnstile-revived`. Check compatibility deliberately rather than assuming the package's dependency declaration promises support for every Express version.

Create a widget through Cloudflare's Turnstile dashboard. Your frontend uses its **sitekey**, while your backend keeps the **secret key** in an environment variable such as `TURNSTILE_SECRET`.

### 2. Protect a route

Save this as `app.mjs`:

```javascript
import express from "express";
import {
  configureTurnstile,
  validateTurnstile,
} from "express-turnstile-revived";

const secret = process.env.TURNSTILE_SECRET;

if (!secret?.trim()) {
  throw new Error("Set TURNSTILE_SECRET before starting the server.");
}

configureTurnstile(secret);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/contact", validateTurnstile(), (_req, res) => {
  res.json({ message: "Verification passed." });
});

app.listen(3000);
```

After setting the environment variable in your shell or deployment platform, start the server:

```bash
node app.mjs
```

The `.mjs` extension enables ES modules without changing `package.json`. Register the body parsers **before** the verification middleware so it can read JSON submissions and URL-encoded forms.

### 3. Send the browser's token

Integrate the widget using [Cloudflare's client-side rendering instructions](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/). Submit its generated token to your protected endpoint with the rest of the form data.

A JSON request to `http://localhost:3000/contact` can have this shape:

```json
{
  "email": "reader@example.com",
  "token": "TOKEN_FROM_THE_TURNSTILE_WIDGET"
}
```

That token value is a placeholder, not a working token. A normal widget-backed HTML form can instead submit `cf-turnstile-response`.

When both fields have non-null values, `token` takes priority. An invalid `token` does not cause the middleware to try the other field as a fallback, so prefer sending one field consistently.

### 4. Check both success and failure

The example returns `{"message":"Verification passed."}` only after Cloudflare accepts the token. Replace that demo controller with your application's payload validation and processing.

By default, failures use this JSON structure:

```json
{ "status": 400, "message": "Invalid token" }
```

| HTTP status | Message | Meaning |
| --- | --- | --- |
| `400` | `No token provided` | The expected token field is absent or empty. |
| `400` | `Invalid token` | Local input checks fail or Cloudflare rejects the token. |
| `503` | `Turnstile verification unavailable` | Verification cannot be completed. |

Failed verification does not call the route controller. Test those paths as well as the happy path; Cloudflare provides [testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) specifically for development.

## Successful verification changes the request body

After success, the middleware deletes **both** `token` and `cf-turnstile-response` from `req.body`. Other fields remain unchanged.

This lets a strict validator placed after Turnstile check just the application payload, without allowing captcha-specific fields in its schema. On failure, the body is left unchanged.

That cleanup is also a migration consideration. A controller that previously inspected the captcha field will no longer find it after successful verification. Avoid retaining raw tokens unless you have a specific need, and do not log tokens or the secret key.

## Useful configuration

Configure the verification policy before creating route middleware:

```javascript
configureTurnstile(process.env.TURNSTILE_SECRET, {
  maxRetries: 2,
  retryDelayMs: 250,
  timeoutMs: 10_000,
  errorMode: "response",
});
```

These are the defaults:

| Option | Default | Purpose |
| --- | --- | --- |
| `maxRetries` | `2` | Allows up to three attempts, including the first request. |
| `retryDelayMs` | `250` | Sets the first retry wait; subsequent waits double. |
| `timeoutMs` | `10000` | Limits the entire verification, including retry waits. |
| `errorMode` | `"response"` | Sends a JSON error instead of forwarding it to Express. |

Retries apply to network failures, HTTP `429` or `5xx` responses, and Cloudflare's `internal-error`. Rejected tokens, other HTTP errors, and malformed responses are not retried.

Each verification reuses its `idempotency_key` across attempts. This is for safely retrying verification, not for making your contact form, signup, or payment operation idempotent.

To change just one route's retry policy while keeping the global secret:

```javascript
app.post(
  "/feedback",
  validateTurnstile({ maxRetries: 0, timeoutMs: 5_000 }),
  (_req, res) => res.json({ message: "Verification passed." }),
);
```

You can also pass a route-specific secret as the first argument, followed by an options object. Omitted route options inherit the global values.

Global settings are captured when middleware is created: changing them later does not update existing route middleware. Calling `configureTurnstile(secret)` without options restores the default policy rather than preserving earlier overrides.

## Use your application's error handler

Set `errorMode: "next"` before creating the protected routes if you want failures to go through your existing Express error handler:

```javascript
configureTurnstile(process.env.TURNSTILE_SECRET, { errorMode: "next" });
```

In that mode, the middleware calls `next(error)` with an `Error` carrying `status` and `message`, without writing a response. Register your four-argument error handler after the routes:

```javascript
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);

  const status = error.status ?? 500;
  res.status(status).json({
    status,
    message: status >= 500 ? "Internal Server Error" : error.message,
  });
});
```

Older integrations may expect `{ success: false, data: { message } }`. The current default envelope is `{ status, message }`, so update clients that read the older format.

## Verification is one layer, not the whole security model

Cloudflare documents a five-minute token lifetime and tokens intended for single use. Obtain a fresh token for a new submission, and handle expired or rejected tokens in the frontend rather than replaying the same value indefinitely.

The current middleware checks Siteverify's `success` result, but it does not provide expected-hostname or expected-action checks, nor expose that verification metadata to your controller. If your integration needs those checks, review the implementation against [Cloudflare's server-side validation guidance](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) rather than assuming they happen automatically.

The middleware also sends the request IP to Cloudflare. If you run behind a proxy, configure Express's `trust proxy` for your actual infrastructure instead of blindly trusting forwarded headers.

Keep ordinary input validation, authentication, authorization, CSRF protection where applicable, and rate limiting in place. A verified challenge is not permission to perform an operation, and a verification-service outage should not silently turn protection off.

express-turnstile-revived is an independent middleware package, not an official Cloudflare integration. If it fits your Express application, the [repository](https://github.com/tizianoluziramos/express-turnstile-revived) has the source, configuration reference, and current compatibility notes.
