import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Section,
  Text,
} from '@react-email/components'

type Permit = {
  id: string
  full_address: string
  est_const_cost: number
  est_const_cost_formatted: string
  status: string
  description: string
  issued_date: string
  distance_km?: number
  builder_name?: string | null
  latitude?: number
  longitude?: number
  job_roles: Array<{ slug: string; name: string; color_hex: string }>
  latest_change?: {
    change_type: string
    business_impact: string
    changed_fields: string[]
    old_values: Record<string, unknown>
    new_values: Record<string, unknown>
  }
  has_recent_critical_change: boolean
  score: number
}

type DailyDigestEmailProps = {
  userId: string
  permits: Permit[]
  totalMatchingPermits: number
  digestDate: string
}

export default function DailyDigestEmail({
  userId,
  permits,
  totalMatchingPermits,
  digestDate,
}: DailyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={text}>
            Here are <strong>{permits.length} permits</strong> from {digestDate}{' '}
            matching your interests:
          </Text>

          {permits.map((permit) => (
            <Section key={permit.id} style={permitCard}>
              {/* Address + Cost Row */}
              <table style={headerTable}>
                <tbody>
                  <tr>
                    <td style={addressCell}>
                      <Link
                        href={`https://416permits.com/app?permit=${permit.id}`}
                        style={addressLink}
                      >
                        {permit.full_address}
                      </Link>
                    </td>
                    <td style={costCell}>
                      <span style={costHeader}>
                        ${permit.est_const_cost_formatted}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Static Map (if coordinates available) */}
              {permit.latitude && permit.longitude && (
                <Img
                  src={`https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=200&center=lonlat:${permit.longitude},${permit.latitude}&zoom=14&marker=lonlat:${permit.longitude},${permit.latitude};color:%232563eb;size:medium&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`}
                  alt={`Map of ${permit.full_address}`}
                  width="600"
                  height="200"
                  style={mapImage}
                />
              )}

              {/* Status + Distance */}
              <div style={metaRow}>
                <span style={statusBadge}>{permit.status}</span>
                {permit.distance_km && (
                  <span style={distanceBadge}>
                    📍 {permit.distance_km.toFixed(1)}km away
                  </span>
                )}
              </div>

              {/* What's New */}
              {permit.has_recent_critical_change && permit.latest_change && (
                <div style={whatsNewSection}>
                  {permit.latest_change.changed_fields?.includes('status') && (
                    <Text style={changeText}>
                      Status: {String(permit.latest_change.old_values?.status)}{' '}
                      →{' '}
                      <strong>
                        {String(permit.latest_change.new_values?.status)}
                      </strong>
                    </Text>
                  )}
                  {permit.latest_change.changed_fields?.includes(
                    'est_const_cost',
                  ) && (
                    <Text style={changeText}>
                      Cost: $
                      {(
                        permit.latest_change.old_values?.est_const_cost as
                          | number
                          | undefined
                      )?.toLocaleString('en-US') || 'N/A'}{' '}
                      → $
                      {(
                        permit.latest_change.new_values?.est_const_cost as
                          | number
                          | undefined
                      )?.toLocaleString('en-US') || 'N/A'}
                    </Text>
                  )}
                </div>
              )}

              {/* Builder */}
              {permit.builder_name && (
                <Text style={builder}>Builder: {permit.builder_name}</Text>
              )}

              {/* Description */}
              {permit.description && (
                <Text style={description}>
                  {permit.description.substring(0, 200)}
                  {permit.description.length > 200 ? '...' : ''}
                </Text>
              )}
            </Section>
          ))}

          {/* CTA */}
          <Section style={ctaSection}>
            <Link
              href={`${process.env.NEXT_PUBLIC_URL_PROD}/app`}
              style={ctaButton}
            >
              View all {totalMatchingPermits} permits →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link
                href={`${process.env.NEXT_PUBLIC_URL_PROD}/unsubscribed?type=daily&user_id=${userId}`}
                style={footerLink}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles (inline for email compatibility)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '24px',
  color: '#1a1a1a',
}

const permitCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
}

const headerTable = {
  width: '100%',
  marginBottom: '16px',
  borderCollapse: 'collapse' as const,
}

const addressCell = {
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  padding: '0',
}

const costCell = {
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
  padding: '0',
  whiteSpace: 'nowrap' as const,
}

const addressLink = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#374151',
  textDecoration: 'none',
}

const costHeader = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#374151',
}

const metaRow = {
  display: 'flex',
  marginBottom: '16px',
  alignItems: 'center',
  flexWrap: 'wrap' as const,
}

const statusBadge = {
  padding: '4px 10px',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: '500',
  marginRight: '8px',
}

const distanceBadge = {
  padding: '4px 10px',
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  borderRadius: '4px',
  fontSize: '13px',
}

const whatsNewSection = {
  backgroundColor: '#fef9f5',
  border: '1px solid #f5e6d3',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '12px',
}

const _whatsNewTitle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 6px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const changeText = {
  fontSize: '14px',
  color: '#78350f',
  margin: '4px 0',
}

const builder = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '8px 0',
}

const description = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '21px',
  margin: '8px 0 0 0',
}

const mapImage = {
  width: '100%',
  height: 'auto',
  borderRadius: '6px',
  marginBottom: '16px',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const ctaButton = {
  backgroundColor: '#1d4ed8',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '16px',
  display: 'inline-block',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const footerText = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '8px 0',
}

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
}
