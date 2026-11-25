import { useState } from "react";
import type { BoardTask } from "../API/types";
import TaskCard from "./taskCard";

export type TaskFilter = "all" | "open" | "executed";

const filters: { value: TaskFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "executed", label: "Executed" },
];

type TasksBoardProps = {
  tasks: BoardTask[];
  tasksById: Map<string, BoardTask>;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onExecute: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onMove: (taskId: string, position: number) => void;
  onCreate: () => void;
  executingTaskId?: string;
  moving: boolean;
};

export default function TasksBoard({
  tasks,
  tasksById,
  filter,
  onFilterChange,
  onExecute,
  onEdit,
  onMove,
  onCreate,
  executingTaskId,
  moving,
}: TasksBoardProps) {
  const [draggedId, setDraggedId] = useState<string>();
  const [dropPosition, setDropPosition] = useState<number>();
  // Positions are only contiguous on the unfiltered board
  const canReorder = filter === "all" && !moving;

  function endDrag() {
    setDraggedId(undefined);
    setDropPosition(undefined);
  }

  function drop(position: number) {
    const dragged = tasks.find((task) => task.task_id === draggedId);
    endDrag();
    if (dragged && dragged.position !== position)
      onMove(dragged.task_id, position);
  }

  return (
    <section className="panel" aria-label="Tasks board">
      <div className="tasks-board__head">
        <h2 className="panel__title">Tasks</h2>
        <div
          className="tasks-board__filters"
          role="group"
          aria-label="Filter tasks"
        >
          {filters.map((f) => (
            //for each filter, display as html element
            <button
              key={f.value}
              type="button"
              className={`tasks-board__filter${filter === f.value ? " tasks-board__filter--active" : ""}`}
              aria-pressed={filter === f.value}
              onClick={() => onFilterChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={onCreate}>
          + New task
        </button>
      </div>
      {canReorder && tasks.length > 1 && (
        <p className="tasks-board__hint muted">
          Drag a card onto another position to reorder.
        </p>
      )}
      {tasks.length === 0 ? (
        <p className="muted">No tasks to show.</p>
      ) : (
        <div className="tasks-board__grid">
          {tasks.map((task) => (
            //show each task
            <div
              key={task.task_id}
              className={`tasks-board__cell${dropPosition === task.position ? " tasks-board__cell--drop" : ""}`}
              onDragOver={(event) => {
                if (!draggedId) return;
                event.preventDefault();
                setDropPosition(task.position);
              }}
              onDragLeave={(event) => {
                // Moving over the card's own children also fires dragleave
                if (event.currentTarget.contains(event.relatedTarget as Node | null))
                  return;
                setDropPosition(undefined);
              }}
              onDrop={(event) => {
                event.preventDefault();
                drop(task.position);
              }}
            >
              <TaskCard
                task={task}
                tasksById={tasksById}
                onExecute={onExecute}
                onEdit={onEdit}
                isExecuting={executingTaskId === task.task_id}
                isDragging={draggedId === task.task_id}
                draggable={canReorder && !task.executed}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", task.task_id);
                  setDraggedId(task.task_id);
                }}
                onDragEnd={endDrag}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
