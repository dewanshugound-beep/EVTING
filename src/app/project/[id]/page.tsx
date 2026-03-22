import { currentUser } from "@/lib/auth";
import { getProject, getComments, hasStarred, recordView } from "../actions";
import ProjectDetailClient from "@/components/project/ProjectDetailClient";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const user = await currentUser();
  const project = await getProject(slug);

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Project not found.</p>
      </div>
    );
  }

  // Record view
  await recordView(project.id);

  const comments = await getComments(project.id);
  const isOwner = user?.id === project.user_id;
  const starred = user ? await hasStarred(user.id, project.id) : false;

  return (
    <ProjectDetailClient
      project={project}
      comments={comments}
      isOwner={isOwner}
      isStarred={starred}
      currentUserId={user?.id ?? null}
    />
  );
}
