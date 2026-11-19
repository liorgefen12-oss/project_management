import type { BoardTask, Project, User } from "../API/types";
import ProjectDescription from "./projectDescription";
import TasksBoard from "./tasksBoard";
import UserInfo from "./userInfo";
import ProjectDropdown from "./projectDropdown";

type ProjectBoardProps = {
  user: User;
  projects: Project[];
  project: Project;
  onSelectProject: (projectId: string) => void;
  tasks: BoardTask[];
  onExecuteTask: (taskId: string) => void;
  executingTaskId?: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
};

export default function ProjectBoard({
  user,
  projects,
  project,
  onSelectProject,
  tasks,
  onExecuteTask,
  executingTaskId,
  onLogout,
  isLoggingOut = false,
}: ProjectBoardProps) {
  const totalSteps = tasks.reduce((sum, task) => sum + task.steps, 0);

  return (
    <main>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <h1>Project board</h1>
        <ProjectDropdown
          projects={projects}
          value={project.project_id}
          onChange={onSelectProject}
          variant="small"
          disabled={isLoggingOut || !!executingTaskId}
        />
        <button type="button" onClick={onLogout} disabled={isLoggingOut || !!executingTaskId}>
          Log out
        </button>
      </header>

      <UserInfo user={user} />
      <ProjectDescription project={project} steps={totalSteps} />
      <TasksBoard
        tasks={tasks}
        onExecute={onExecuteTask}
        executingTaskId={executingTaskId}
      />
    </main>
  );
}
