import { useEffect, useState } from "react";
import { errorMessage } from "./API/apiFetch";
import { useProjects } from "./API/projects/useProjects";
import { useSignInToProject } from "./API/projects/useSignInToProject";
import { useSignOutOfProject } from "./API/projects/useSignOutOfProject";
import { useCurrentUser } from "./API/users/useCurrentUser";
import { useLogout } from "./API/users/useLogout";
import { useGlobalStore } from "./store/useGlobalStore";
import UserInfo from "./components/userInfo";
import Login from "./pages/login";
import ProjectBoardPage from "./pages/projectBoard";
import SignIntoProject from "./pages/signIntoProject";

function SignedInApp() {
  const projectId = useGlobalStore((s) => s.projectId);
  const setProjectId = useGlobalStore((s) => s.setProjectId);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const projects = useProjects();
  const signIn = useSignInToProject();
  const signOut = useSignOutOfProject();
  const logout = useLogout();

  // A project remembered from before a refresh may no longer exist
  const projectMissing =
    !!projectId &&
    projects.isSuccess &&
    !projects.isFetching &&
    !projects.data.some((p) => p.project_id === projectId);
  useEffect(() => {
    if (projectMissing) setProjectId(null);
  }, [projectMissing, setProjectId]);

  async function selectProject(nextId: string) {
    if (busy || nextId === projectId) return;
    setBusy(true);
    setError(undefined);
    try {
      if (projectId) {
        await signOut.mutateAsync(projectId);
        setProjectId(null);
      }
      await signIn.mutateAsync(nextId);
      setProjectId(nextId);
    } catch (err) {
      setError(errorMessage(err, "Could not open the project."));
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
        setProjectId(null);
      }
      await logout.mutateAsync();
    } catch (err) {
      setError(errorMessage(err, "Could not log out."));
    } finally {
      setBusy(false);
    }
  }

  const errorBanner = error && (
    <p role="alert" className="alert" style={{ margin: "var(--space-4) var(--space-6)" }}>
      {error}
    </p>
  );

  if (projects.isPending || projects.isError) {
    return (
      <>
        <header className="project-header">
          <h1 className="project-header__title">Project board</h1>
          <UserInfo onLogout={handleLogout} disabled={busy} />
        </header>
        {errorBanner}
        <main className="center-page">
          {projects.isPending ? (
            <p className="muted">Loading projects…</p>
          ) : (
            <section className="panel">
              <p role="alert" className="alert">
                Could not load projects: {errorMessage(projects.error)}
              </p>
              <button type="button" className="btn" onClick={() => projects.refetch()}>
                Retry
              </button>
            </section>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      {projectId && !projectMissing ? (
        <ProjectBoardPage
          // Remount per project so filters and popups never leak between boards
          key={projectId}
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
      {errorBanner}
    </>
  );
}

export default function App() {
  const { isPending } = useCurrentUser();
  const user = useGlobalStore((s) => s.user);

  if (isPending) return <p className="center-page muted">Loading…</p>;
  return user ? <SignedInApp key={user.user_id} /> : <Login />;
}
