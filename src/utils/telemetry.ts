/**
 * Lightweight, direct Telegram Milestone Tracker.
 * 
 * - Stateless Session & Active Time Tracker (sessionStorage & performance.now())
 * - Visitor Score (localStorage)
 * - Tracks ONLY major lifecycle events:
 *   1. APP_OPENED / APP_REFRESHED
 *   2. ASSET_CREATED
 *   3. ASSET_EXPORTED
 *   4. ASSET_DELETED
 *   5. PROJECT_RESET
 * - Zero timers, zero background loops, zero canvas lag.
 */

// Track session start time without setInterval
const SESSION_START_KEY = 'px_session_start';

function getSessionTime(): { sessionSeconds: number; sessionFormatted: string } {
  try {
    let startTime = sessionStorage.getItem(SESSION_START_KEY);
    const now = Date.now();

    if (!startTime) {
      startTime = now.toString();
      sessionStorage.setItem(SESSION_START_KEY, startTime);
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - parseInt(startTime, 10)) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;

    let formatted = `${secs}s`;
    if (mins > 0) {
      formatted = `${mins}m ${secs}s`;
    }

    return { sessionSeconds: elapsedSeconds, sessionFormatted: formatted };
  } catch {
    return { sessionSeconds: 0, sessionFormatted: '<1s' };
  }
}

// Simple visit counter persisted in localStorage
function getVisitScore(): { visitCount: number; isReturning: boolean } {
  try {
    const rawVisits = localStorage.getItem('px_visit_count');
    const rawLastSeen = localStorage.getItem('px_last_seen');
    const now = Date.now();

    let visitCount = rawVisits ? parseInt(rawVisits, 10) : 0;
    const lastSeen = rawLastSeen ? parseInt(rawLastSeen, 10) : 0;

    // If seen more than 30 minutes ago, treat as a new session visit
    const isNewSession = !lastSeen || (now - lastSeen > 30 * 60 * 1000);
    if (isNewSession) {
      visitCount += 1;
      localStorage.setItem('px_visit_count', visitCount.toString());
    }

    localStorage.setItem('px_last_seen', now.toString());

    return {
      visitCount,
      isReturning: visitCount > 1,
    };
  } catch {
    return { visitCount: 1, isReturning: false };
  }
}

// Single cached geo fetch per page load
let cachedGeoPromise: Promise<{ ip: string; city: string; country: string }> | null = null;

async function getVisitorGeo(): Promise<{ ip: string; city: string; country: string }> {
  if (cachedGeoPromise) return cachedGeoPromise;

  cachedGeoPromise = (async () => {
    try {
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return {
        ip: data.ip || 'Unknown IP',
        city: data.city || 'Unknown City',
        country: data.country_name || data.country || 'Global',
      };
    } catch {
      return { ip: '127.0.0.1', city: 'Local / Unknown', country: 'Global' };
    }
  })();

  return cachedGeoPromise;
}

const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'Desktop';
  const width = window.innerWidth;
  if (width < 640) return 'Mobile';
  if (width < 1024) return 'Tablet';
  return 'Desktop';
};

/**
 * Tracks a major milestone and dispatches it directly to Telegram without blocking.
 */
export function trackMilestone(
  milestone: 'APP_OPENED' | 'APP_REFRESHED' | 'ASSET_CREATED' | 'ASSET_EXPORTED' | 'ASSET_DELETED' | 'ASSET_IMPORTED' | 'PROJECT_RESET',
  actionData: Record<string, any> = {}
): void {
  // Fire asynchronously in background
  setTimeout(async () => {
    try {
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      const isEnabled = import.meta.env.VITE_TELEGRAM_ALERTS_ENABLED !== 'false';

      if (!botToken || !chatId || !isEnabled || typeof window === 'undefined') {
        return;
      }

      const { ip, city, country } = await getVisitorGeo();
      const score = getVisitScore();
      const { sessionFormatted } = getSessionTime();
      const deviceType = getDeviceType();
      const page = window.location.pathname || '/';
      const referrer = document.referrer ? new URL(document.referrer).hostname : 'Direct';

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' UTC';

      const actionEntries = Object.entries(actionData || {});
      const actionText = actionEntries.length > 0
        ? actionEntries.map(([k, v]) => `• ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
        : '• status: executed';

      const visitorTag = score.visitCount > 1 
        ? `Returning Visitor (Session #${score.visitCount})` 
        : `New Visitor (Session #1)`;

      const text = 
`⚡ Visitor Milestone: ${milestone}

🌐 IP Address: ${ip}
🌍 Location: ${city}, ${country} (💻 ${deviceType})
👤 Visitor Score: ${score.visitCount} visits (${visitorTag})
⏱ Time on App: ${sessionFormatted}
📍 Current Page: ${page}
🔗 Referrer: ${referrer}
📋 Action Data:
${actionText}
⏱ ${timeStr}`;

      const proxyEndpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;
      const targetUrl = proxyEndpoint || `https://api.telegram.org/bot${botToken}/sendMessage`;
      const bodyPayload = proxyEndpoint
        ? JSON.stringify({ botToken, chatId, text, milestone, actionData })
        : JSON.stringify({ chat_id: chatId, text });

      fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // 100% fail-silent
    }
  }, 0);
}
