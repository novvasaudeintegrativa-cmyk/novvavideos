import type { VideoEventMilestone, VideoEventType } from "@/types/database";

export type TrackingContext = {
  sessionId: string | null;
  pageUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
};

function resolveSessionId(sessionId: string | null): string {
  if (sessionId) return sessionId;
  try {
    const key = "novva_session_id_fallback";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

export function sendVideoEvent(
  videoId: string,
  context: TrackingContext,
  eventType: VideoEventType,
  milestone?: VideoEventMilestone,
) {
  const body = {
    video_id: videoId,
    session_id: resolveSessionId(context.sessionId),
    event_type: eventType,
    ...(milestone ? { milestone } : {}),
    page_url: context.pageUrl ?? (typeof document !== "undefined" ? document.referrer || undefined : undefined),
    utm_source: context.utmSource ?? undefined,
    utm_medium: context.utmMedium ?? undefined,
    utm_campaign: context.utmCampaign ?? undefined,
    utm_term: context.utmTerm ?? undefined,
    utm_content: context.utmContent ?? undefined,
  };

  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ambiente sem fetch (nunca deve acontecer em browser) — ignora silenciosamente.
  }
}
