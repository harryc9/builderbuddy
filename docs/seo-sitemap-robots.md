# SEO: Sitemap & Robots.txt Maintenance

## Overview
This doc explains when and how to update `sitemap.ts` and `robots.txt` when adding new pages.

---

## Files

### 1. `src/app/sitemap.ts`
**Purpose:** Tells Google which pages to index  
**Format:** TypeScript file that generates XML sitemap at `/sitemap.xml`

### 2. `public/robots.txt`
**Purpose:** Controls crawler access to pages  
**Format:** Plain text file served at `/robots.txt`

---

## When to Update

### Add to Sitemap IF:
✅ Page is **publicly accessible** (no auth required)  
✅ Page has **SEO value** (helps users discover the product)  
✅ Page contains **unique content** (not duplicate/thin content)

**Examples:**
- Landing page
- Pricing page
- Blog posts
- Documentation pages
- Feature showcase pages

### DO NOT add to Sitemap:
❌ Pages behind authentication (`/app/*`, `/onboarding/*`)  
❌ Utility pages (`/verify-email`, `/unsubscribed`)  
❌ API routes (`/api/*`)  
❌ Admin/internal pages

### Update robots.txt IF:
- Adding new **authenticated areas** → Add to `Disallow`
- Adding new **public pages** that should be indexed → Usually automatic via `Allow: /`
- Adding new **utility pages** with no SEO value → Add to `Disallow`

---

## How to Update

### Adding a Public Page to Sitemap

Edit `src/app/sitemap.ts`:

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://416permits.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    // Add new public page
    {
      url: `${baseUrl}/pricing`,  // ← New page
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
```

**Priority Guidelines:**
- `1.0` - Homepage
- `0.8` - Key pages (pricing, main features)
- `0.6` - Secondary pages (blog posts, docs)
- `0.4` - Tertiary pages (tags, archives)

**Change Frequency:**
- `always` - Real-time data pages
- `daily` - Blog, news
- `weekly` - Feature pages
- `monthly` - Static pages (pricing, about)
- `yearly` - Legal pages

### Blocking Auth-Protected Areas in robots.txt

Edit `public/robots.txt`:

```txt
# Block authenticated areas
Disallow: /app/
Disallow: /onboarding/
Disallow: /verify-email
Disallow: /admin/  # ← New admin area
```

---

## Current Setup (as of Nov 2024)

### Public Pages in Sitemap:
- `/` - Landing page

### Blocked in robots.txt:
- `/app/` - Main authenticated app
- `/onboarding/` - Onboarding flow
- `/verify-email` - Email verification
- `/api/` - API routes
- `/unsubscribed` - Unsubscribe confirmation

---

## Testing

### Test Sitemap:
```bash
curl https://416permits.com/sitemap.xml
```

### Test robots.txt:
```bash
curl https://416permits.com/robots.txt
```

### Validate with Google:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Submit sitemap: `https://416permits.com/sitemap.xml`
3. Use URL Inspection tool to test specific pages

---

## Common Scenarios

### Adding a Blog
1. Create `src/app/blog/page.tsx`
2. Add to sitemap with priority `0.6`
3. No robots.txt change needed (default `Allow: /`)

### Adding a Pricing Page
1. Create `src/app/pricing/page.tsx`
2. Add to sitemap with priority `0.8`
3. No robots.txt change needed

### Adding an Admin Panel
1. Create `src/app/admin/page.tsx`
2. DO NOT add to sitemap
3. Add `Disallow: /admin/` to robots.txt

### Adding Dynamic Blog Posts
```typescript
export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://416permits.com'
  
  // Fetch blog posts from database
  const posts = await getBlogPosts()
  
  const blogUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...blogUrls,
  ]
}
```

---

## Resources

- [Next.js Sitemap Docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Google Robots.txt Spec](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)

