import type { BoardTask } from "../API/types";

type TaskCardProps = {
  task: BoardTask;
  onExecute: (taskId: string) => void;
  isExecuting?: boolean;
};

export default function TaskCard({
  task,
  onExecute,
  isExecuting = false,
}: TaskCardProps) {
  return (
    <article>
      <h3>{task.task_name}</h3>
      <p>{task.description}</p>
      <dl>
        <dt>Cost</dt>
        <dd>{task.cost}</dd>
        <dt>Value</dt>
        <dd>{task.value}</dd>
        <dt>Steps</dt>
        <dd>{task.steps}</dd>
      </dl>
      <button
        type="button"
        onClick={() => onExecute(task.task_id)}
        disabled={isExecuting || task.executed}
      >
        {task.executed ? "Executed" : isExecuting ? "Executing…" : "Execute"}
      </button>
    </article>
  );
}
