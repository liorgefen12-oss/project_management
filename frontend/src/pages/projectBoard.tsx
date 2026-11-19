import type { Project, User } from "../API/types";
import { useProject } from "../API/projects/useProject";
import { useProjectTasks } from "../API/projects/useProjectTasks";
import { useExecuteTask } from "../API/tasks/useExecuteTask";
import ProjectBoard from "../components/projectBoard";
import ProjectDropdown from "../components/projectDropdown";

type ProjectBoardPageProps = {
  user: User;
  projectId: string;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onLogout: () => void;
  busy: boolean;
};

export default function ProjectBoardPage({
  user,
  projectId,
  projects,
  onSelectProject,
  onLogout,
  busy,
}: ProjectBoardPageProps) {
  const project = useProject(projectId);
  const tasks = useProjectTasks(projectId);
  const execute = useExecuteTask(projectId);

  const logoutButton = (
    <button
      type="button"
      onClick={onLogout}
      disabled={busy || execute.isPending}
    >
      Log out
    </button>
  );

  const error = project.error ?? tasks.error;
  if (error)
    return (
      <main>
        <p role="alert">Could not load the board: {error.message}</p>
        <ProjectDropdown
          projects={projects}
          value={projectId}
          onChange={onSelectProject}
          variant="small"
          disabled={busy}
        />
        {logoutButton}
      </main>
    );
  if (!project.data || !tasks.data) return <main><p>Loading…</p>{logoutButton}</main>;

  return (
    <ProjectBoard
      user={user}
      projects={projects}
      project={project.data}
      onSelectProject={onSelectProject}
      tasks={tasks.data}
      onExecuteTask={(taskId) => execute.mutate(taskId)}
      executingTaskId={execute.isPending ? execute.variables : undefined}
      onLogout={onLogout}
      isLoggingOut={busy}
    />
  );
}
