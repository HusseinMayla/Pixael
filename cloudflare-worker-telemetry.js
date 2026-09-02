/**
 * Cloudflare Worker / Serverless Relay for Telegram Milestone Alerts
 * 
 * Instructions:
 * 1. Create a free Cloudflare Worker at https://workers.cloudflare.com
 * 2. Set Environment Variables / Secrets in Worker Settings:
 *    - TELEGRAM_BOT_TOKEN: Your Telegram bot token from @BotFather
 *    - TELEGRAM_CHAT_ID: Your personal or channel Telegram Chat ID
 * 3. Deploy this script to the worker.
 * 4. Add your worker URL (e.g., https://your-worker.workers.dev/milestone) to .env as VITE_TELEMETRY_ENDPOINT
 */

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const data = await request.json().catch(() => ({}));
      const {
        milestone = 'ACTION_TRIGGERED',
        page = '/',
        referrer = 'Direct',
        deviceType = 'Desktop',
        actionData = {},
      } = data as any;

      // Extract real visitor IP & Geo from Cloudflare Headers
      const ip = request.headers.get('cf-connecting-ip') || 'Unknown IP';
      const city = (request.cf as any)?.city || 'Unknown City';
      const country = (request.cf as any)?.country || 'Global';

      // Current UTC time formatted: e.g. 10:49:05 PM UTC
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' UTC';

      // Format Action Data list
      const actionEntries = Object.entries(actionData || {});
      const actionText = actionEntries.length > 0
        ? actionEntries.map(([k, v]) => `• ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
        : '• status: executed';

      // Telegram Message Format matching user requirements
      const message = 
`⚡ Visitor Milestone: ${milestone}

🌐 IP Address: ${ip}
🌍 Location: ${city}, ${country} (💻 ${deviceType})
📍 Current Page: ${page}
🔗 Referrer: ${referrer}
📋 Action Data:
${actionText}
⏱ ${timeStr}`;

      if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: message,
          }),
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      // Return 200/ok or silent error to avoid breaking client side
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
