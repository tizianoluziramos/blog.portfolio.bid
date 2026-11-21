---
title: "express-swagger-docauto: OpenAPI Documentation from Express Code"
date: 2026-11-21 16:59:21
description: "Generate OpenAPI 3.1 documentation from Express source code, with type inference, Swagger UI, and a CLI for build-time checks."
categories:
  - Projects
tags:
  - Express
  - OpenAPI
  - Swagger
  - JavaScript
  - TypeScript
  - Node.js
---

<img src="/images/swagger-banner.webp" alt="Swagger logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

API documentation is useful until it drifts away from the code it describes. [express-swagger-docauto](https://github.com/tizianoluziramos/express-swagger-docauto) generates OpenAPI documentation by analyzing an Express project's source, reducing the need to maintain a separate set of handwritten schemas alongside your routes.

<!--more-->

## What is express-swagger-docauto?

express-swagger-docauto is a Node.js package that generates **OpenAPI 3.1** documents for Express applications. It follows routes, handlers, and related source files, using the TypeScript compiler and dependency declarations to infer the shapes of requests and responses.

Despite using the TypeScript compiler, it is not limited to TypeScript applications. The project supports JavaScript, TypeScript, and mixed codebases, including imports, aliases, and generics.

You can serve the result through Swagger UI, export a JSON document from the CLI, or call the generator directly. A small `swaggerdoc()` middleware lets you add a human-readable summary, but the goal is to infer the technical details rather than ask you to describe every field manually.

## What it supports

- **Automatic route, request, and response detection**, including HTTP status codes and error responses.
- **Project-wide type inference**, following imports and supported middleware and service patterns.
- **JavaScript and TypeScript source**, with dependency type declarations contributing to inference.
- **Sequelize models and associations**, plus Zod validation.
- **JSON serialization and cache roundtrip inference**, helping track values across supported transformations.
- **Reusable OpenAPI schemas and recursive types**, rather than duplicating every structure inline.
- **Diagnostics for unresolved information**, with a strict mode that can turn incomplete inference into a failing build step.

The project is licensed under MIT. Its source, tests, and build configuration are available in the [repository](https://github.com/tizianoluziramos/express-swagger-docauto), and the package is published on [npm](https://www.npmjs.com/package/express-swagger-docauto).

## Getting started with Express

### 1. Install the dependencies

The current package declares **Node.js 20.19 or later** and **Express 5** as requirements. From an existing Express project, install:

```bash
pnpm add express-swagger-docauto swagger-ui-express
```

If you are starting a new project, install `express` as well. The example below uses ES modules, so set `"type": "module"` in your project's `package.json`.

### 2. Add a route and install the documentation

Save this as `src/app.js`:

```javascript
import express from "express";
import {
  swaggerdoc,
  installSwaggerdoc,
} from "express-swagger-docauto";

const app = express();
app.use(express.json());

app.get(
  "/api/v1/health",
  swaggerdoc({ summary: "Check service health" }),
  (_req, res) => {
    res.status(200).json({ ok: true });
  },
);

await installSwaggerdoc(app, {
  root: process.cwd(),
  entry: "src/app.js",
  title: "Example API",
  version: "1.0.0",
});

app.listen(3000);
```

The response shape comes from the handler's code. The summary is the only documentation-specific detail attached to this route; there is no handwritten response schema.

`swaggerdoc()` passes control to the next middleware. It adds descriptive metadata, not request validation or authentication.

### 3. Open Swagger UI

Run the application from the project root:

```bash
node src/app.js
```

Open [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs). The generated JSON document is available at [http://localhost:3000/api/v1/docs/openapi.json](http://localhost:3000/api/v1/docs/openapi.json).

Check that `GET /api/v1/health` appears with its summary, a `200` response, and an `ok` boolean property. Then compare a few of your real endpoints against their actual behavior.

### 4. Generate a document from the CLI

You do not need to run the Express server to export documentation:

```bash
pnpm exec swaggerdoc-auto --root . --entry src/app.js --strict --out openapi.json
```

This writes the generated specification to `openapi.json` when generation succeeds. Diagnostics and scan statistics are written to standard error.

With `--strict`, any warning or error diagnostic causes generation to fail with a nonzero exit code. Without it, the tool can return a document containing incomplete inference, so review the diagnostics instead of assuming that a generated file means everything was resolved.

## Inference is not runtime validation

The generator analyzes source code. It does not prove that every possible runtime response matches the document, and it does not install validation middleware for your requests.

Dynamic route construction, missing dependency declarations, or values that cannot be resolved statically can leave gaps. The generator reports issues such as `NO_ROUTES`, `UNKNOWN_RESPONSE`, and `UNRESOLVED_RESPONSE_SCHEMA`; those are useful signals to investigate, not details to hide by turning off logging.

Use strict generation as one check in your workflow, alongside endpoint tests and a review of the resulting specification. Even a clean diagnostic report is not a replacement for testing authentication, validation, and error behavior.

The document served by `installSwaggerdoc()` is generated when that function runs. It is not a continuously updated record of live traffic; regenerate or restart the application after changing the source.

## Useful configuration

These options are available when calling `installSwaggerdoc()`:

| Option | Default | Purpose |
| --- | --- | --- |
| `root` | `process.cwd()` | Selects the project directory to analyze. |
| `entry` | `"src/app.js"` | Identifies the application's source entry point. |
| `docsPath` | `"/api/v1/docs"` | Sets the documentation mount path. |
| `strict` | `false` | Rejects generation when warnings or errors are reported. |
| `ui` | `true` | Enables Swagger UI in addition to the JSON endpoint. |
| `logDiagnostics` | `true` | Logs diagnostics during installation. |

Set `entry` explicitly if your application starts from another file, such as `src/server.ts`. Point the generator at the source you want analyzed rather than assuming it will discover the right entry point from your production start command.

If you only need a document in a script, use the exported generator:

```javascript
import { generateOpenApi } from "express-swagger-docauto";

const { document, diagnostics, stats } = await generateOpenApi({
  root: process.cwd(),
  entry: "src/app.js",
  title: "Example API",
  strict: true,
});

console.log(JSON.stringify(document, null, 2));
console.error({ diagnostics, stats });
```

`swagger-ui-express` is optional when you are not serving the UI. You can use the CLI or `generateOpenApi()` without installing that UI package.

## Review before exposing the docs

Swagger UI is convenient during development, but API documentation can reveal routes, request fields, and response structures that you do not intend to publish.

The installer registers the documentation endpoints; it does not add access control. Protect them with your application's middleware or keep them off public deployments. Setting `ui: false` disables the interactive UI, **not** the JSON endpoint.

Start with a small set of routes, inspect the output, and make strict generation part of your build once the diagnostics are understood. The aim is less duplicated documentation work, not less attention to the API contract.

If that fits your Express workflow, the [express-swagger-docauto repository](https://github.com/tizianoluziramos/express-swagger-docauto) has the source, current usage instructions, and tests.
