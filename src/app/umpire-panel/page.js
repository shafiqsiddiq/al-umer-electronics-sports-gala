import UmpirePanelClient from "./UmpirePanelClient";

export const metadata = {
  title: "Umpire Panel | Al-Umer Sports Gala Season 3",
  description:
    "Official umpire panel for Al Umer Electronics Sports Gala Season 3 — Sir G Irfan, Aslam Legend, Iqbal Bholi, Qasim Dudhi, Tahmour Sufi, and Imran Baba.",
};

export default function UmpirePanelPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e6fffa] via-[#f0fdfa] to-[#f8fafc]">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.16),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[10px] bg-gradient-to-b from-amber-400 via-emerald-500 to-teal-800"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-3 py-5 sm:px-5 lg:px-6 lg:py-8">
        <UmpirePanelClient />
      </div>
    </div>
  );
}
