---
title: "sequelize-simple-cache-redis: Transparent Query Caching with Redis"
date: 2026-11-21 18:55:07
description: "Cache Sequelize reads in memory or Redis with per-model TTLs, shared invalidation, and familiar query methods."
categories:
  - Projects
tags:
  - Sequelize
  - Redis
  - Node.js
  - JavaScript
  - Databases
  - Caching
---

<img src="/images/sequelize-redis-banner.webp" alt="Sequelize and Redis logos centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Repeated database reads are a natural place to consider caching, but manually wrapping every query can spread cache logic throughout an application. [sequelize-simple-cache-redis](https://github.com/tizianoluziramos/sequelize-simple-cache-redis) adds caching around Sequelize models, keeping familiar query methods while offering either an in-memory cache or a shared Redis backend.

<!--more-->

## What is sequelize-simple-cache-redis?

sequelize-simple-cache-redis is a Node.js package that wraps Sequelize models in a proxy. Calls to configured read methods can return cached results instead of querying the database again.

Redis support extends that idea beyond a single process: application instances using the same database, configuration, and Redis namespace can share cached results and model-level invalidation.

The important integration step is `cache.init(Model)`. It returns the model proxy your application should use for cached queries; simply installing the package does not change every existing model reference.

## What it supports

- **Common Sequelize read methods**, including `findByPk`, `findOne`, `findAll`, `findAndCountAll`, and aggregate methods such as `count` and `sum`.
- **Per-model TTLs**, with expiry values expressed in seconds.
- **An optional Redis backend**, using a connected node-redis client.
- **Model-level invalidation after writes**, enabled by default.
- **Transaction-aware behavior in Redis mode**, bypassing cached transactional reads and deferring invalidation until commit when `afterCommit` is available.
- **Redis serialization and model reconstruction**, including support for dates, buffers, big integers, and arrays.
- **Manual invalidation and cache bypass**, without changing the ordinary Sequelize query syntax.

The source, tests, and usage instructions are available in the [repository](https://github.com/tizianoluziramos/sequelize-simple-cache-redis). The package is also published on [npm](https://www.npmjs.com/package/sequelize-simple-cache-redis).

## Getting started with Redis

### 1. Install the dependencies

From an existing Sequelize application:

```bash
pnpm add redis sequelize-simple-cache-redis
```

You still need Sequelize and the driver for your database dialect. The package declares Sequelize `>=4`, while its development dependencies use Sequelize 6. Use a supported Node.js release compatible with your chosen Redis client rather than relying on the cache package's older minimum Node version.

### 2. Connect Redis and wrap a model

The following integration assumes your application already exports an initialized Sequelize model named `User` from `./models/User.js` and has a working database connection.

```javascript
import { createClient } from "redis";
import SequelizeSimpleCache from "sequelize-simple-cache-redis";
import User from "./models/User.js";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("Set REDIS_URL before initializing the cache.");
}

const redis = createClient({ url: redisUrl });
redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});
await redis.connect();

const cache = new SequelizeSimpleCache(
  {
    User: { ttl: 60 },
  },
  {
    redis: {
      client: redis,
      prefix: "my-app:development:sequelize-cache",
    },
  },
);

const CachedUser = cache.init(User);
```

Configuration keys match **model names**, not database table names. Repeat `cache.init()` for each model you want to wrap, and make sure that model has a configuration entry.

Use a distinct Redis prefix for each application and environment. Instances intended to share a cache need the same prefix and compatible model definitions; unrelated databases should not share one namespace.

### 3. Keep the usual query methods

Using the `CachedUser` proxy above:

```javascript
const first = await CachedUser.findByPk(1);
const second = await CachedUser.findByPk(1);

console.log(first?.get("name"), second?.get("name"));
```

The first call can populate Redis; the second can reuse that result while its TTL and model version remain valid. The cache key includes the model, method, and query arguments, so different queries are stored separately.

Redis hits reconstruct Sequelize instances rather than returning only JSON strings. Queries returning `null` or `undefined` are not stored, so repeated lookups for a missing row still reach the database.

### 4. Bypass or clear the cache when needed

The proxy adds a small management interface:

```javascript
const fresh = await CachedUser.noCache().findByPk(1);

await CachedUser.clearCache();
await cache.clear("User");
```

`noCache()` returns the original model for that query. The two clear calls above are alternative ways to invalidate the same model; normally, choose one rather than doing both.

Use `await cache.clear()` with no model names to invalidate all models initialized on that cache instance. These operations are asynchronous in Redis mode.

Keep the Redis connection alive while the application uses the cache, and close it through your application's shutdown handling.

## How shared invalidation works

Redis entries include a model version in their key. Clearing a model increments its version, so later reads from other application instances stop using entries from the old version.

That avoids scanning and deleting every cached query during invalidation. It also means invalidation is **model-wide**, not limited to one row or one primary-key lookup.

With the default `clearOnUpdate: true`, wrapped write methods and registered Sequelize hooks invalidate the affected model. In Redis mode, a transaction exposing `afterCommit` schedules that invalidation after the transaction commits.

Older-version keys are not immediately deleted. A positive TTL lets them expire, so avoid unlimited lifetimes unless you have deliberately planned how Redis memory will be managed.

This is a shared invalidation mechanism, not a guarantee of strict consistency across every concurrent read and write.

## Useful configuration

These are some of the defaults worth knowing:

| Setting | Default | Purpose |
| --- | --- | --- |
| Model `ttl` | `3600` | Cache lifetime in seconds. |
| Model `clearOnUpdate` | `true` | Enables invalidation for supported writes. |
| Model `limit` | `50` | Limits entries in the in-memory cache, not Redis. |
| Model `methods` | Common read methods | Selects which methods are cached. |
| Model `methodsUpdate` | Common write methods | Selects wrapped methods that trigger invalidation. |
| `redis.prefix` | `"sequelize-simple-cache"` | Separates Redis keys into a namespace. |
| `debug` | `false` | Enables cache-event logging through the configured delegate. |

For example, `User: { ttl: 60 }` and `Role: { ttl: 300 }` give those models one-minute and five-minute lifetimes respectively.

Redis handles expiry and eviction itself; the model's `limit` setting does not cap Redis storage. Monitor memory usage and choose a Redis eviction policy appropriate for your application.

If you only need a process-local cache, omit the Redis options:

```javascript
const localCache = new SequelizeSimpleCache({
  User: { ttl: 60, limit: 100 },
});

const LocalUser = localCache.init(User);
```

That is an alternative setup, not a shared cache between workers. Each process has its own entries.
