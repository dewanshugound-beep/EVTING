import { getOfficialProjects, getTopUsers } from "@/app/project/actions";
import OfficialShowcase from "@/components/OfficialShowcase";
import Leaderboard from "@/components/Leaderboard";
import HomeHero from "@/components/HomeHero";

export default async function HomePage() {
  const [officialProjects, topUsers] = await Promise.all([
    getOfficialProjects(),
    getTopUsers(),
  ]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="gradient-mesh" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        {/* Hero */}
        <HomeHero />

        {/* Official Showcase */}
        <OfficialShowcase projects={officialProjects} />

        {/* Leaderboard */}
        <Leaderboard users={topUsers} />
      </div>
    </div>
  );
}
