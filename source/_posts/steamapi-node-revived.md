---
title: "steamapi-node-revived: Steam APIs for Node.js and TypeScript"
date: 2026-11-21 17:07:41
description: "Access Steam Store, Web API, and Community data from Node.js with a TypeScript client, typed endpoints, caching, and structured errors."
categories:
  - Projects
tags:
  - Steam
  - Node.js
  - TypeScript
  - JavaScript
  - APIs
---

<img src="/images/steam-banner.webp" alt="Steam logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Steam data is spread across the Web API, the Store, and Steam Community. [steamapi-node-revived](https://github.com/tizianoluziramos/steamapi-node-revived) brings those services into a Node.js client, with typed endpoint groups for looking up games, player information, inventories, and more.

<!--more-->

## What is steamapi-node-revived?

steamapi-node-revived is a TypeScript client for Steam's HTTP services. It exposes a `SteamUser` class, also exported as `SteamClient`, with separate groups such as `store`, `users`, `games`, `community`, and `web`.

The project continues the lineage of `steamapi-node` by Yukine, originally forked from `node-steamapi` by Dim. Its `NOTICE` records that version 1.0.0 replaces the earlier JavaScript implementation, endpoint modules, type declarations, tests, and packaging with new TypeScript implementations.

That makes it worth checking the current methods and return types when migrating an older integration. A familiar method name is not a promise that every detail of an older package remains unchanged.

This is an HTTP API client, not a Steam desktop client or a way around account permissions. Some requests work without credentials; others require an API key, publisher access, or an appropriate Community session.

## What it supports

- **Steam Store lookups**, including app details, featured content, app lists, and reviews.
- **Player and game endpoints**, covering summaries, owned games, achievements, news, and player counts.
- **Steam Community data**, including inventories and market queries.
- **Trade and Workshop endpoint groups**, alongside a generic Web API request interface.
- **An endpoint catalog and live API discovery**, for inspecting available interface and method information.
- **Pagination helpers**, including async iterators for apps, reviews, and inventory pages.
- **App-details caching**, configurable timeouts, request cancellation, and structured errors.
- **ES module and CommonJS exports**, with TypeScript declarations and no declared runtime package dependencies.

The project is licensed under Apache-2.0. Its source and tests are available in the [repository](https://github.com/tizianoluziramos/steamapi-node-revived), and the package is published on [npm](https://www.npmjs.com/package/steamapi-node-revived).

## Getting started with Node.js

### 1. Install the package

The current package declares support for **Node.js 22.13 or later within the 22.x line, or Node.js 24 and later**. From your Node.js project:

```bash
pnpm add steamapi-node-revived
```

The examples below use `.mjs` files so they work as ES modules without changing your project's `package.json`. TypeScript projects can use the same imports and receive the bundled type declarations.

### 2. Look up a game without an API key

Save this as `store.mjs`:

```javascript
import SteamUser from "steamapi-node-revived";

const steam = new SteamUser();
const game = await steam.store.getAppDetails(440);

console.log({
  id: game.steam_appid,
  name: game.name,
  freeToPlay: game.is_free,
});
```

Run it with:

```bash
node store.mjs
```

App ID `440` identifies Team Fortress 2. This Store lookup does not require a Steam Web API key, making it a useful first check before adding authenticated requests.

### 3. Choose a Store locale

You can request app details for a particular country and language:

```javascript
const game = await steam.store.getAppDetails(440, {
  country: "ar",
  language: "english",
});

console.log(game.name, game.price_overview?.final_formatted);
```

This builds on the `steam` instance above. Price information is optional: a free game, an unavailable listing, or a response without pricing will not necessarily have `price_overview`.

Country and language are included in the app-details cache key. Changing the locale therefore does not reuse an entry fetched for a different locale.

### 4. Add credentials for player lookups

For endpoints that require a Web API key, obtain one through [Steam's API key page](https://steamcommunity.com/dev/apikey) if your account is eligible. Keep it in your server-side environment, not in browser code or a public repository.

Save this as `player.mjs`:

```javascript
import SteamUser from "steamapi-node-revived";

const apiKey = process.env.STEAM_API_KEY;
const steamId = process.env.STEAM_ID64;

if (!apiKey || !steamId) {
  throw new Error("Set STEAM_API_KEY and STEAM_ID64 before running this script.");
}

const steam = new SteamUser({ apiKey });
const player = await steam.users.getUserSummary(steamId);

console.log(player.nickname, player.profileURL);
```

Set those environment variables using your shell or deployment platform, then run `node player.mjs`. API access still depends on the endpoint's requirements and the target account's visibility settings.

## SteamIDs are not ordinary JavaScript numbers

Use **strings or `bigint` values for SteamID64 identifiers**. These IDs exceed JavaScript's safe integer range, so converting one to a `number` can lose precision before the request is even made.

The client validates SteamID64 inputs as 17-digit values and rejects numeric inputs. Other 64-bit identifiers, such as inventory asset IDs, also have string or `bigint` input types.

App IDs are different: methods such as `getAppDetails(440)` accept a string or number and validate it as a positive uint32 value.

Type declarations help catch incorrect inputs during development, but they do not make remote data available when Steam's privacy rules or permissions block access.

## Useful configuration

Pass transport and cache options to the constructor:

```javascript
const steam = new SteamUser({
  timeoutMs: 10_000,
  cache: {
    enabled: true,
    expires: 300_000,
    maxEntries: 128,
  },
});
```

This creates a client with a 10-second request timeout and a five-minute app-details cache.

| Option | Default | Purpose |
| --- | --- | --- |
| `timeoutMs` | `15000` | Sets the request timeout in milliseconds. |
| `cache.enabled` | `true` | Enables the app-details cache. |
| `cache.expires` | `86400000` | Sets the cache lifetime in milliseconds: 24 hours. |
| `cache.maxEntries` | `512` | Limits the number of cached app-detail entries. |
| `fetch` | Node.js global `fetch` | Allows a custom transport implementation, including test doubles. |

The cache is held in memory by the client instance. It is not a persistent cache for every API method, and a cached app-detail response is not a guarantee of current pricing or availability.

Use `{ force: true }` in a `getAppDetails()` call to bypass a cached result. Calls made with an `AbortSignal` bypass the app-details cache and its shared in-flight requests.

## Handle failures explicitly

The package exports `SteamApiError`, with codes including `AUTH`, `HTTP`, `NETWORK`, `TIMEOUT`, `ABORTED`, `PARSE`, and `RESPONSE`.

For a standalone lookup with basic error handling:

```javascript
import SteamUser, { SteamApiError } from "steamapi-node-revived";

const steam = new SteamUser({ timeoutMs: 10_000 });

try {
  const game = await steam.store.getAppDetails(440);
  console.log(game.name);
} catch (error) {
  if (error instanceof SteamApiError) {
    console.error({
      code: error.code,
      status: error.status,
      retryAfter: error.retryAfter,
    });
  } else {
    throw error;
  }
}
```

HTTP errors can include a status and Steam's `Retry-After` header. The transport does not automatically retry failed requests; decide how your application should back off, and avoid retrying state-changing operations blindly.

Invalid local inputs can also throw `TypeError` or `RangeError`, so not every failure is a `SteamApiError`.

## Keep access deliberate

Start with a public Store lookup, then add only the credentials and endpoint groups your application needs. A Web API key, a publisher key, and a Steam Community cookie serve different purposes; providing one does not grant access to everything.

Treat Community cookies as account credentials. Do not publish them in examples, logs, or bug reports, and check permissions before invoking endpoints that change account or game state.

steamapi-node-revived is an independent project, not an official Valve SDK. Steam controls availability, privacy restrictions, and service behavior. Keep request volume reasonable and test the endpoints your application actually relies on.

If a typed client would simplify your Steam integration, the [steamapi-node-revived repository](https://github.com/tizianoluziramos/steamapi-node-revived) has the source, current package configuration, and tests.
