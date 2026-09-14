import { createAdminClient } from "@/lib/supabase/server";
import { VideoPlayer } from "./video-player";

export default async function PublicPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ autoplay?: string; muted?: string }>;
}) {
  const { videoId } = await params;
  const { autoplay, muted } = await searchParams;
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
        />
      </div>
    </div>
  );
}
