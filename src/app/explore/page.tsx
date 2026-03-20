import React from "react";
import ExploreClient from "./ExploreClient";
import { getVaultProjects } from "./actions";

export const metadata = {
  title: "Matrix Vault — Unauthorized Archives",
  description: "Explore leaked scripts, binary tools, and forbidden APKs within the Matrix.",
};

export default async function ExplorePage() {
  const projects = await getVaultProjects();

  return (
    <ExploreClient initialProjects={projects as any} />
  );
}
