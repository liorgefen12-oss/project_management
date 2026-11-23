import type { DragEvent } from "react";
import type { BoardTask } from "../API/types";
import { useTaskExecutability } from "../API/tasks/useTaskExecutability";
import { useTaskPredecessors } from "../API/tasks/useTaskPredecessors";
import "../styles/TaskCard.css";

type TaskCardProps = {
  task: BoardTask;
  taskNames: Map<string, string>;
  onExecute: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  isExecuting?: boolean;
  isDragging?: boolean;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
};

export default function TaskCard({
  task,
  taskNames,
  onExecute,
  onEdit,
  isExecuting = false,
  isDragging = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  // Executed tasks can never run again, so skip the readiness check for them
  const executable = useTaskExecutability(
    task.executed ? undefined : task.task_id,
  );
  const predecessors = useTaskPredecessors(task.task_id);

  const predecessorList = (predecessors.data ?? []).map((p) => ({
    id: p.task_id,
    name: taskNames.get(p.task_id) ?? "Unknown task",
    executed: p.executed,
  }));
  const predecessorsTitle = predecessorList
    .map((p) => `${p.name}${p.executed ? " (executed)" : " (waiting)"}`)
    .join(", ");
  const blocked = !task.executed && executable.data === false;

  const classes = [
    "task-card",
    task.executed && "task-card--executed",
    blocked && "task-card--disabled",
    isDragging && "task-card--dragging",
  ]
    .filter(Boolean)
    .join(" ");

  const executeLabel = task.executed
    ? "✓ Executed"
    : isExecuting
      ? "Executing…"
      : "Execute";
  const executeTitle = task.executed
    ? "This task was already executed"
    : blocked
      ? "Not available yet - predecessors must be executed first"
      : "Execute task";

  return (
    <article
      className={classes}
      title={task.description}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={task.task_name}
    >
      <div className="task-card__top">
        <span className="task-card__badge">#{task.position}</span>
        <h3 className="task-card__name">{task.task_name}</h3>
        {!task.executed && (
          <button
            type="button"
            className="task-card__edit"
            onClick={() => onEdit(task.task_id)}
          >
            Edit
          </button>
        )}
      </div>
      <div className="task-card__row task-card__row--split">
        <div>
          <span className="task-card__label">Cost</span>
          <span className="task-card__number task-card--cost">{task.cost}</span>
        </div>
        <div>
          <span className="task-card__label">Value</span>
          <span className="task-card__number task-card--value">
            {task.value}
          </span>
        </div>
      </div>
      <div className="task-card__row">
        <span className="task-card__label">Steps</span>
        <span className="task-card__number task-card--steps">{task.steps}</span>
      </div>
      <div className="task-card__row">
        <span className="task-card__label">Predecessors</span>
        {predecessorList.length === 0 ? (
          <span className="task-card__predecessors muted">None</span>
        ) : (
          <span className="task-card__predecessors" title={predecessorsTitle}>
            {predecessorList.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ", "}
                <span
                  className={
                    p.executed
                      ? "task-card__predecessor--done"
                      : "task-card__predecessor--waiting"
                  }
                >
                  {p.name}
                </span>
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="task-card__footer">
        <button
          type="button"
          className={`task-card__execute${task.executed ? " task-card__execute--done" : ""}`}
          onClick={() => onExecute(task.task_id)}
          // Unavailable tasks stay clickable: the attempt is audited and explained in a popup
          disabled={task.executed || isExecuting}
          title={executeTitle}
          draggable={false}
        >
          {executeLabel}
        </button>
      </div>
    </article>
  );
}
