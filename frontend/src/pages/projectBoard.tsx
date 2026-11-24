import { useState } from "react";
import { errorMessage } from "../API/apiErrorClass";
import { useProject } from "../API/projects/useProject";
import { useProjectTasks } from "../API/projects/useProjectTasks";
import { useExecuteTask } from "../API/tasks/useExecuteTask";
import { useMoveTask } from "../API/tasks/useMoveTask";
import type { BoardTask, Project } from "../API/types";
import AuditLogsPanel from "../components/auditLogsPanel";
import EditProjectForm from "../components/editProjectForm";
import Popup from "../components/popup";
import ProjectDescription from "../components/projectDescription";
import ProjectHeader from "../components/projectHeader";
import { CreateTaskForm, EditTaskForm } from "../components/taskForm";
import TasksBoard, { type TaskFilter } from "../components/tasksBoard";
import "../styles/ProjectBoard.css";

//----------types---------

type ProjectBoardPageProps = {
  projectId: string;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onLogout: () => void;
  busy: boolean;
};

// Which form pop up is open: create-task , edit-task, edit-project, or an error message
type Dialog =
  | { kind: "create" }
  | { kind: "edit"; taskId: string }
  | { kind: "edit-project" }
  | { kind: "message"; title: string; message: string };

export default function ProjectBoardPage({
  projectId,
  projects,
  onSelectProject,
  onLogout,
  busy,
}: ProjectBoardPageProps) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const project = useProject(projectId);
  const allTasks = useProjectTasks(projectId);
  const execute = useExecuteTask(projectId);
  const move = useMoveTask(projectId);

  function closeDialog() {
    setDialog(null);
  }

  //------user action handlers-------------
  function handleExecute(taskId: string) {
    execute.mutate(taskId, {
      onError: (err) => {
        setDialog({
          kind: "message",
          title: "Task unavailable",
          message: errorMessage(err),
        });
      },
    });
  }

  function handleMove(taskId: string, position: number) {
    move.mutate(
      { taskId: taskId, position: position },
      {
        onError: (err) => {
          setDialog({
            kind: "message",
            title: "Order unavailable",
            message: errorMessage(err),
          });
        },
      },
    );
  }

  const header = (
    <ProjectHeader
      projects={projects}
      projectId={projectId}
      onSelectProject={onSelectProject}
      onLogout={onLogout}
      busy={busy}
    />
  );

  if (project.error || allTasks.error) {
    return (
      <div className="board-page">
        {header}
        <p role="alert" className="alert">
          Could not load the board:{" "}
          {errorMessage(project.error || allTasks.error)}
        </p>
      </div>
    );
  }

  if (!project.data || !allTasks.data) {
    return (
      <div className="board-page">
        {header}
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const tasks = allTasks.data;

  // Tasks shown on the board, depending on the filter
  const shownTasks = [];
  for (const task of tasks) {
    if (filter === "all") {
      shownTasks.push(task);
    } else if (filter === "executed" && task.executed) {
      shownTasks.push(task);
    } else if (filter === "open" && !task.executed) {
      shownTasks.push(task);
    }
  }

  // Totals for the project description
  let totalSteps = 0;
  let spent = 0;
  let executedCount = 0;
  for (const task of tasks) {
    if (task.executed) {
      executedCount += 1;
      totalSteps += task.steps;
      spent += task.cost;
    }
  }

  // task id -> task, so cards can show predecessor names and positions
  const tasksById = new Map<string, BoardTask>();
  for (const task of tasks) {
    tasksById.set(task.task_id, task);
  }

  // The id of the task being executed right now (if any), so its card shows a spinner
  let executingTaskId = undefined;
  if (execute.isPending) {
    executingTaskId = execute.variables;
  }

  return (
    <div className="board-page">
      {header}
      <div className="board-layout">
        <div className="board-main">
          <ProjectDescription
            project={project.data}
            steps={totalSteps}
            spent={spent}
            taskCount={tasks.length}
            executedCount={executedCount}
            onEdit={() => setDialog({ kind: "edit-project" })}
          />
          <TasksBoard
            tasks={shownTasks}
            tasksById={tasksById}
            filter={filter}
            onFilterChange={setFilter}
            onExecute={handleExecute}
            onEdit={(taskId) => setDialog({ kind: "edit", taskId: taskId })}
            onMove={handleMove}
            onCreate={() => setDialog({ kind: "create" })}
            executingTaskId={executingTaskId}
            moving={move.isPending}
          />
        </div>
        <AuditLogsPanel projectId={projectId} tasksById={tasksById} />
      </div>
      {dialog !== null && dialog.kind === "create" && (
        <CreateTaskForm
          projectId={projectId}
          tasks={tasks}
          onClose={closeDialog}
        />
      )}
      {dialog !== null && dialog.kind === "edit" && (
        <EditTaskForm
          taskId={dialog.taskId}
          tasks={tasks}
          onClose={closeDialog}
        />
      )}
      {dialog !== null && dialog.kind === "edit-project" && (
        <EditProjectForm project={project.data} onClose={closeDialog} />
      )}
      {dialog !== null && dialog.kind === "message" && (
        <Popup title={dialog.title} onClose={closeDialog}>
          <p>{dialog.message}</p>
        </Popup>
      )}
    </div>
  );
}
