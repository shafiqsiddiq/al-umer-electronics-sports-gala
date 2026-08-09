import LiveScoreboardOverlay from "@/components/LiveScoreboardOverlay";

export const metadata = {
  title: "Live Score Overlay",
  description: "OBS / Facebook / YouTube scoreboard overlay",
};

export default async function OverlayPage({ params }) {
  const { id } = await params;
  return (
    <div className="fixed inset-0 z-[9999] bg-transparent">
      <LiveScoreboardOverlay matchId={id} />
    </div>
  );
}
