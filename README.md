# Canada Telugu Classifieds Blog Landing Page

Standalone Next.js blog landing page powered by the Uplift AI publishing API.

The blog feed is fetched on the server for SEO. Crawlers receive rendered titles, excerpts, publish dates, article links, and metadata in the HTML. The Uplift token is server-only and must not use a `NEXT_PUBLIC_` prefix.

## Environment

```bash
UPLIFTAI_API_TOKEN=your_upliftai_api_token
SITE_URL=https://your-domain.com
```

`SITE_URL` is optional for local development, but should be set in production for canonical and Open Graph URLs.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm run start
```
