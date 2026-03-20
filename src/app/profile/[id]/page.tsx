import { currentUser } from "@clerk/nextjs/server";
import { getProfile, isFollowing } from "../actions";
import ProfileHeader from "@/components/profile/ProfileHeader";
import YouTubeEmbed from "@/components/profile/YouTubeEmbed";
import ProjectCard from "@/components/project/ProjectCard";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  const profile = await getProfile(id);

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">User not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === profile.id;
  const followingStatus = user ? await isFollowing(user.id, profile.id) : false;

  return (
    <div className="relative min-h-screen w-full">
      <div className="gradient-mesh" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-6 pb-20">
        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-light">
          <ProfileHeader
            profile={profile}
            isOwner={isOwner}
            isFollowingUser={followingStatus}
            projectCount={profile.projects?.length ?? 0}
          />
        </div>

        {/* YouTube Embed */}
        {profile.youtube_url && <YouTubeEmbed url={profile.youtube_url} />}

        {/* Projects Grid */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-white">
            Projects ({profile.projects?.length ?? 0})
          </h2>
          {profile.projects?.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-light p-12 text-center">
              <p className="text-sm text-zinc-500">
                {isOwner
                  ? "You haven't uploaded any projects yet."
                  : "No projects yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
