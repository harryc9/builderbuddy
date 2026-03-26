# Permit Pulse Database System

## Overview

The Permit Pulse database system is responsible for collecting, storing, and retrieving building permit data from multiple municipal sources. This document outlines the system architecture, database schema, and API routes.

## Database Schema

### Permits Table

The `permits` table stores building permit data with the following key fields:

- `id`: UUID primary key
- `external_id`: Original ID from the source system (used for deduplication)
- `source`: The municipal source (e.g., 'toronto', 'mississauga')
- `permit_num`: Official permit identifier
- `description`: Detailed project description
- `est_const_cost`: Dollar value of the project
- `postal`: Postal code for service area matching
- `location`: Geographic point (PostGIS) for location-based queries
- `full_address`: Complete formatted address
- `application_date`: When permit was applied for
- `issued_date`: When permit was issued

See `src/lib/db/permits-schema.sql` for the complete schema definition.

## Geocoding

Addresses are geocoded using Google Maps Geocoding API to convert street addresses into geographic coordinates. This enables:

1. Accurate location-based filtering
2. Distance-based searches for users
3. Map visualization options

Geocoding is performed during the permit import process, and the coordinates are stored in the `location` field as a PostGIS POINT.

## API Routes

### `/api/toronto-permits`

Fetches and stores permits from the Toronto Open Data Portal.

- **Method**: GET
- **Query Parameters**: 
  - `limit` (optional): Number of permits to fetch (default: 1000)
- **Response**: JSON with fetched permit count and database operation results

### `/api/permits`

Retrieves permits from the database with filtering options.

- **Method**: GET
- **Query Parameters**:
  - `limit` (optional): Permits per page (default: 20)
  - `page` (optional): Page number (default: 1)
  - `source` (optional): Filter by source (e.g., 'toronto')
  - `postal` (optional): Filter by postal code prefix
  - `search` (optional): Search in description and address
  - `date_from` / `date_to` (optional): Date range filters
  - `min_value` / `max_value` (optional): Project value range filters
- **Response**: JSON with permits and pagination metadata

### `/api/cron/daily-permits`

A secure endpoint for scheduled daily permit updates.

- **Method**: GET
- **Query Parameters**:
  - `key`: API key for authentication (must match `PERMIT_CRON_API_KEY` env var)
- **Response**: JSON with status of each municipal permit update

## Scheduled Updates

Permits are scheduled to be updated daily via a cron job that calls the `/api/cron/daily-permits` endpoint. This ensures fresh data for the morning email digests.

## Deduplication

The system prevents duplicate permits by:

1. Using a unique constraint on `external_id` in the database
2. Checking for existing permits during import
3. Tracking inserted vs. duplicate permits in the API response

## Environment Variables

The following environment variables are required:

- `GOOGLE_MAPS_API_KEY`: For geocoding addresses
- `PERMIT_CRON_API_KEY`: For securing the cron job endpoint
- `NEXT_PUBLIC_BASE_URL`: Base URL for internal API calls

## Usage Example

```typescript
// Fetch permits filtered by postal code prefix
const response = await fetch('/api/permits?postal=M4B&limit=50')
const data = await response.json()

// Access the permits
const permits = data.permits
``` 