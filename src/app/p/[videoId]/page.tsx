import { createAdminClient } from "@/lib/supabase/server";
import { VideoPlayer } from "./video-player";

export default async function PublicPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{
    autoplay?: string;
    muted?: string;
    session_id?: string;
    page_url?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }>;
}) {
  const { videoId } = await params;
  const {
    autoplay,
    muted,
    session_id,
    page_url,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
  } = await searchParams;
  const supabase = createAdminClient();

  const { data: video } = await supabase
    .from("videos")
    .select("id, name, status, thumbnail_url")
    .eq("id", videoId)
    .single();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="w-full">
        <VideoPlayer
          videoId={videoId}
          status={video?.status ?? null}
          thumbnailUrl={video?.thumbnail_url ?? null}
          autoplay={autoplay === "1" || autoplay === "true"}
          startMuted={muted === "1" || muted === "true"}
          tracking={{
            sessionId: session_id ?? null,
            pageUrl: page_url ?? null,
            utmSource: utm_source ?? null,
            utmMedium: utm_medium ?? null,
            utmCampaign: utm_campaign ?? null,
            utmTerm: utm_term ?? null,
            utmContent: utm_content ?? null,
          }}
        />
      </div>
    </div>
  );
}
