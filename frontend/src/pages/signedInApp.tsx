import { useEffect, useState } from "react";
import { errorMessage } from "../API/apiErrorClass";
import { useProjects } from "../API/projects/useProjects";
import { useSignInToProject } from "../API/projects/useSignInToProject";
import { useSignOutOfProject } from "../API/projects/useSignOutOfProject";
import { useLogout } from "../API/users/useLogout";
import { useGlobalStore } from "../store/useGlobalStore";
import UserInfo from "../components/userInfo";
import ProjectBoardPage from "./projectBoard";
import SignIntoProject from "./signIntoProject";
import { selectProject } from "../functions/selectProject";
import { handleLogout } from "../functions/handleLogout";
import { leaveProject } from "../functions/leaveProject";
import "../styles/ErrorBanner.css";

export default function SignedInApp() {
  const projectId = useGlobalStore((s) => s.projectId);
  const setProjectId = useGlobalStore((s) => s.setProjectId);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const projects = useProjects();
  const signIn = useSignInToProject();
  const signOut = useSignOutOfProject();
  const logout = useLogout();

  // A project remembered from before a refresh may no longer exist
  const projectMissing = //does the remembered project (from before the refresh)
    //still exist?
    !!projectId && //projectId holds a value - it's selected
    projects.isSuccess && //projects are loaded
    !projects.isFetching && //loading isnt in process
    !projects.data.some((p) => p.project_id === projectId); //isnt in the projects' list
  useEffect(() => {
    if (projectMissing) setProjectId(null);
  }, [projectMissing, setProjectId]);

  const sessionCtx = {
    //bundle context objects together
    projectId,
    busy,
    setBusy,
    setError,
    setProjectId,
    signOutOfProject: signOut.mutateAsync,
  };

  const onSelectProject = (nextId: string) =>
    selectProject(nextId, {
      ...sessionCtx,
      signInToProject: signIn.mutateAsync,
    });

  const onLogout = () =>
    handleLogout({ ...sessionCtx, logout: () => logout.mutateAsync() });

  const onLeaveProject = () => leaveProject(sessionCtx);

  const errorBanner = error && (
    <p role="alert" className="error-banner">
      {error}
    </p>
  );

  if (projects.isPending || projects.isError) {
    return (
      <>
        <header className="project-header">
          <h1 className="project-header__title">Project board</h1>
          <UserInfo onLogout={onLogout} disabled={busy} />
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
              <button
                type="button"
                className="btn"
                onClick={() => projects.refetch()}
              >
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
      {projectId && !projectMissing ? ( //project is chosen and exists
        <ProjectBoardPage //go the project board page (component)
          key={projectId}
          projectId={projectId}
          projects={projects.data}
          onSelectProject={onSelectProject}
          onLeaveProject={onLeaveProject}
          onLogout={onLogout}
          busy={busy}
        />
      ) : (
        //no chosen project
        <SignIntoProject
          projects={projects.data}
          onEnter={onSelectProject}
          onLogout={onLogout}
          busy={busy}
        />
      )}
      {errorBanner}
    </>
  );
}
