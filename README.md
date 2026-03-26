# 416Permits

A daily lead-generation tool for specialty trade contractors, suppliers, and local GCs in the Greater Toronto Area. 416Permits automatically pulls newly issued building permits from city open-data portals, filters them by trade and service area, and delivers curated leads every morning.

## Core Features

- **Permit Scraping**: Pulls fresh permits nightly from Toronto and GTA municipal data sources
- **Rule Engine**: Filters permits based on user-selected trade keywords and postal code prefixes
- **Email Digest**: Sends a daily email at 6 AM with curated permits
- **CSV Attachment**: Each email includes a downloadable CSV of the day's permits
- **User Dashboard**: View all recent permits with search and export functionality
- **Billing System**: 7-day free trial with $99/month subscription via Stripe

## User Workflow

1. **Sign up:** Select your trade specialties and service postal codes
2. **Wake up:** Open the daily email with new matching permits
3. **Act:** Contact the owner or GC directly and win more work

## Development Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Geoapify (for address autocomplete)
NEXT_PUBLIC_GEOAPIFY_API_KEY=your_geoapify_api_key

# OpenAI (for permit categorization)
OPENAI_API_KEY=your_openai_api_key

# Stripe (for subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_ID=your_stripe_price_id
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:4002

# Cron Jobs (for Vercel cron endpoints)
CRON_SECRET=your_random_secret_string

# Optional: Slack (for notifications)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

Get a free Geoapify API key at: https://www.geoapify.com/

### Installation

```bash
# Install dependencies
bun install

# Run the development server
bun run dev
```

Open [http://localhost:4002](http://localhost:4002) with your browser to see the result.

## Testing

```bash
# Run all tests
bun test

# Run performance tests (requires dev server running)
bun run test:perf

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui
```

### Performance Testing
The project includes performance regression tests for the permits search API. These tests ensure:
- Initial page load: < 2 seconds
- Subsequent pages (2-5): < 5 seconds  
- Filtered queries: < 3 seconds

Run `bun run test:perf` with your dev server running to verify performance thresholds are met.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI
- Supabase
- Luxon
- Stripe (for payments)
- Vercel AI SDK

## License

This project is for educational purposes only.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
