import { getOfficialProjects, getTopUsers } from "@/app/project/actions";
import OfficialShowcase from "@/components/OfficialShowcase";
import Leaderboard from "@/components/Leaderboard";
import HomeHero from "@/components/HomeHero";
import MatrixRain from "@/components/MatrixRain";

export default async function HomePage() {
  const [officialProjects, topUsers] = await Promise.all([
    getOfficialProjects(),
    getTopUsers(),
  ]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <MatrixRain />
      
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <HomeHero />
        <OfficialShowcase projects={officialProjects} />
        <Leaderboard users={topUsers || []} />
      </div>
    </div>
  );
}
