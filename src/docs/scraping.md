# Permit Pulse Scraping System

## Overview

The Permit Pulse scraping system automatically collects building permit data from municipal open data portals, processes it for relevance, and delivers targeted permit information to users via daily email digests.

## Data Collection Strategy

- **Scraping Schedule**: Run daily at 3-4 AM to ensure fresh data before 6 AM emails
- **Primary Data Sources**:
  - Toronto Open Data Portal
  - Other GTA municipalities (Mississauga, Brampton, Vaughan, etc.)
- **Implementation**: Each data source requires a dedicated scraper adapter to handle different APIs and data formats

## Database Schema

### Permits Table

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| external_id | integer | Original ID from Toronto's system |
| permit_num | string | Official permit identifier |
| revision_num | string | Revision number of the permit |
| permit_type | string | Type of permit |
| structure_type | string | Type of structure |
| work | string | Type of work being done |
| street_num | string | Street number |
| street_name | string | Street name |
| street_type | string | Street type (RD, AVE, ST, etc.) |
| street_direction | string | Street direction (N, S, E, W) |
| postal | string | Postal code for service area matching |
| geo_id | string | Geographic identifier |
| ward_grid | string | City ward grid reference |
| application_date | date | When permit was applied for |
| issued_date | date | When permit was issued |
| completed_date | date | When permit was completed |
| status | string | Current permit status |
| description | text | Detailed project description |
| current_use | string | Current use of property |
| proposed_use | string | Proposed use after work |
| dwelling_units_created | integer | Number of dwelling units created |
| dwelling_units_lost | integer | Number of dwelling units lost |
| est_const_cost | decimal | Dollar value of the project |
| assembly | decimal | Assembly space (in sq meters) |
| institutional | decimal | Institutional space (in sq meters) |
| residential | decimal | Residential space (in sq meters) |
| business_and_personal_services | decimal | Business/service space (in sq meters) |
| mercantile | decimal | Mercantile space (in sq meters) |
| industrial | decimal | Industrial space (in sq meters) |
| interior_alterations | decimal | Interior alterations (in sq meters) |
| demolition | decimal | Demolition space (in sq meters) |
| builder_name | string | Builder or contractor name |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

### Users Table

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| email | string | User email (unique) |
| trade_keywords | string[] | Trade-specific keywords for matching |
| service_areas | string[] | Postal code prefixes defining service area |
| subscription_status | string | Trial/paid/cancelled status |
| email_preferences | jsonb | Email delivery preferences |

### User Permit Views Table

| Field | Type | Description |
|-------|------|-------------|
| user_id | uuid | Foreign key to users table |
| permit_id | uuid | Foreign key to permits table |
| viewed_at | timestamp | When user viewed the permit |
| sent_in_email | boolean | Whether permit was included in email digest |

The `user_permit_views` table serves multiple important functions:
- Tracks which permits have been sent to each user to prevent duplicates
- Records user engagement for analytics and algorithm improvement
- Supports features like saved permits or "mark as contacted" 
- Provides conversion metrics (how many leads result in views/actions)
- Builds personalization data beyond explicit keywords

## Processing Pipeline

1. **Data Collection**: Scrape new permits from municipal sources
2. **Data Cleaning**: Normalize addresses, postal codes, and other fields
3. **Keyword Extraction**: Parse descriptions to identify relevant trades
4. **Deduplication**: Filter out permits already in database
5. **Storage**: Persist clean permit data to database
6. **Matching**: Correlate permits with user preferences
7. **Email Preparation**: Generate personalized email digests

## Email System

- **Delivery Time**: Daily at 6 AM
- **Content**: Top 5 most relevant permits for each user
- **Format**: Mobile-friendly HTML with permit details
- **Attachments**: CSV export of all matching permits
- **Matching Logic**: 
  - Filter by user's trade keywords and service areas
  - Prioritize high-value and recent permits
  - Exclude permits previously sent to the user

## Architectural Considerations

- **Resilience**: Implement retry mechanisms and error logging
- **Scalability**: Design for adding new municipalities and handling growing user base
- **Monitoring**: Track scraping success rates and data quality
- **Privacy**: Handle personally identifiable information appropriately
