# Repository notes

## Setup and commands

- Use Node.js >=20.19.0, required by the locked Hexo 8.1.2; the local blog skill's Node >=14 guidance is outdated.
- Install with `pnpm install --frozen-lockfile`. `pnpm-lock.yaml` matches the current dependencies and applies the Redefine patch via `pnpm-workspace.yaml`; `package-lock.json` predates Redefine and Cheerio. Do not use `npm ci` or switch installers casually.
- Create content with `pnpm exec hexo new post <slug>` or `pnpm exec hexo new page <slug>`. There is no `new` npm script or need for a global Hexo CLI.
- `pnpm build` generates the site; `pnpm server --port 4000` previews it at `http://localhost:4000`. Run `pnpm clean` before rebuilding when checking stale output.
- No test, lint, typecheck, or CI build workflow is configured. Verify content changes with a build and local preview of the affected route, homepage excerpt, links, and assets.
- Deployment is not configured: `_config.yml` has an empty `deploy.type`, and no deployer dependency is installed. There is no `release-blog` script; do not treat the generic skill's deployment examples as this repo's release process.

## Theme and rendering

- The active theme is the installed `hexo-theme-redefine` dependency, configured through `_config.redefine.yml`; `_config.landscape.yml` is inactive. There is no in-repo theme implementation to build.
- Persist dependency modifications in `patches/hexo-theme-redefine@2.9.0.patch` using pnpm's patch workflow, not direct `node_modules` edits. The existing patch suppresses welcome/CDN messages and removes CDN-status updates; preserve it when changing dependencies.
- `scripts/remove-footer-credits.js` is auto-loaded by Hexo and strips credits with an `after_render:html` Cheerio filter. Footer customization is not implemented by an injected browser script.
- Set both `description` and `og_description` for page-specific descriptions: Redefine's Open Graph defaults can override `description` alone.
- Redefine can rewrite image `src` to `/images/loading.svg`, putting the real URL in `data-src`. HTML checks must account for lazy loading.
- `public/` and `db.json` are ignored generated output/cache; change source/configuration rather than editing them.

## Content conventions and routes

- Content is English; dates use `America/Argentina/Buenos_Aires`. Post URLs are `/YYYY/MM/DD/<slug>/`, so changing dates or filenames changes links.
- The archive route is `/articles/`, not Hexo's default `/archives/`. The existing About navigation points to `/about/`, backed by `source/about/index.md`.
- `scaffolds/post.md` omits categories and excerpt separators. Add relevant categories/tags and use `<!--more-->` when an explicit excerpt is wanted.
- Do not add comments to blog posts. The only allowed comment is the `<!--more-->` excerpt separator.
- Standalone pages use `layout: page`; the theme supplies the H1 from the title, so start body sections at H2. Follow the About page's `comment: false` and `comments: false` when comments should be disabled.
- Store shared images in `source/images/` and reference `/images/<filename>`; `post_asset_folder` is disabled. The TelegramFS banner is a local WebP, not a hotlinked background.
- `.agents/skills/hexo-blog-update/SKILL.md` contains the content/preview workflow; defer to actual scripts and configuration where its generic setup or deployment advice conflicts.
