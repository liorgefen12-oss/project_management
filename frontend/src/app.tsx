import { useState } from "react";
import type { User } from "./API/types";
import { useProjects } from "./API/projects/useProjects";
import { useSignInToProject } from "./API/projects/useSignInToProject";
import { useSignOutOfProject } from "./API/projects/useSignOutOfProject";
import { useCurrentUser } from "./API/users/useCurrentUser";
import { useLogout } from "./API/users/useLogout";
import Login from "./pages/login";
import ProjectBoardPage from "./pages/projectBoard";
import SignIntoProject from "./pages/signIntoProject";

function SignedInApp({ user }: { user: User }) {
  const [projectId, setProjectId] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const projects = useProjects();
  const signIn = useSignInToProject();
  const signOut = useSignOutOfProject();
  const logout = useLogout();

  async function selectProject(nextId: string) {
    if (busy || nextId === projectId) return;
    setBusy(true);
    setError(undefined);
    try {
      if (projectId) {
        await signOut.mutateAsync(projectId);
        setProjectId(undefined);
      }
      await signIn.mutateAsync(nextId);
      setProjectId(nextId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the project.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      if (projectId) {
        await signOut.mutateAsync(projectId);
        setProjectId(undefined);
      }
      await logout.mutateAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log out.");
    } finally {
      setBusy(false);
    }
  }

  if (projects.isPending || projects.isError) {
    return (
      <main>
        {projects.isPending ? (
          <p>Loading projects...</p>
        ) : (
          <p role="alert">Could not load projects: {projects.error.message}</p>
        )}
        {error && <p role="alert">{error}</p>}
        {projects.isError && <button type="button" onClick={() => projects.refetch()}>Retry</button>}
        <button type="button" onClick={handleLogout} disabled={busy}>Log out</button>
      </main>
    );
  }

  return (
    <>
      {error && <p role="alert">{error}</p>}
      {projectId ? (
        <ProjectBoardPage
          user={user}
          projectId={projectId}
          projects={projects.data}
          onSelectProject={selectProject}
          onLogout={handleLogout}
          busy={busy}
        />
      ) : (
        <SignIntoProject
          projects={projects.data}
          onEnter={selectProject}
          onLogout={handleLogout}
          busy={busy}
        />
      )}
    </>
  );
}

export default function App() {
  // A 401 from /users/me leaves data undefined, which shows the login page
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <p>Loading…</p>;
  return user ? <SignedInApp key={user.user_id} user={user} /> : <Login />;
}
