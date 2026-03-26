const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

type SlackMessage = {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

export async function sendSlackMessage({ type, title, message }: SlackMessage) {
  if (!SLACK_WEBHOOK_URL) return

  // Skip Slack notifications in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔔 Slack notification (dev):', { type, title, message })
    return
  }

  const emoji = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji[type]} ${title}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Environment:* ${process.env.VERCEL_ENV || 'development'} | *Timestamp:* ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      }),
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}
