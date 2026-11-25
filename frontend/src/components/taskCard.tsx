import type { DragEvent } from "react";
import type { BoardTask } from "../API/types";
import "../styles/TaskCard.css";

type TaskCardProps = {
  task: BoardTask;
  tasksById: Map<string, BoardTask>;
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
  tasksById,
  onExecute,
  onEdit,
  isExecuting = false,
  isDragging = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const predecessorList = task.predecessor_ids
    .map((p) => {
      const predecessor = tasksById.get(p.predecessor_id);
      return {
        id: p.predecessor_id,
        name: predecessor?.task_name ?? "Unknown task",
        position: predecessor?.position,
        executed: predecessor?.executed ?? false,
      };
    })
    .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
  const predecessorsTitle = predecessorList
    .map(
      (p) =>
        `#${p.position ?? "?"} ${p.name}${p.executed ? " (executed)" : " (waiting)"}`,
    )
    .join(", ");
  //display predecessor's name + execution status

  const blocked =
    !task.executed &&
    predecessorList.some((predecessor) => !predecessor.executed);

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
          <ul className="task-card__predecessors" title={predecessorsTitle}>
            {predecessorList.map((p) => (
              <li
                key={p.id}
                className={
                  p.executed
                    ? "task-card__predecessor--done"
                    : "task-card__predecessor--waiting"
                }
              >
                #{p.position ?? "?"} {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="task-card__footer">
        <button
          type="button"
          className={`task-card__execute${task.executed ? " task-card__execute--done" : ""}`}
          onClick={() => onExecute(task.task_id)}
          //tasks with predecessors look unclickable, but arent, to audit log the execution attempts
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
