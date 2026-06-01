# Canada Telugu Classifieds Blog Landing Page

Standalone Next.js blog landing page powered by the Uplift AI publishing API.

The blog feed is fetched on the server for SEO. Crawlers receive rendered titles, excerpts, publish dates, article links, and metadata in the HTML. The Uplift token is server-only and must not use a `NEXT_PUBLIC_` prefix.

## Brand Direction

This live site should stay aligned with Canada Telugu Classifieds:

- Use the brand teal as the primary color and the blue accent sparingly for action-oriented moments.
- Keep copy focused on Telugu classifieds, trusted local deals, community guides, service listings, and marketplace safety.
- Do not show backend implementation details, feed counters, API names, or dashboard-style integration language in the public UI.
- Keep the layout clean, practical, and community-marketplace focused.

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
