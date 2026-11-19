import TaskCard from "./taskCard";
import type { BoardTask } from "../API/types";

type TasksBoardProps = {
  tasks: BoardTask[];
  onExecute: (taskId: string) => void;
  executingTaskId?: string;
};

export default function TasksBoard({
  tasks,
  onExecute,
  executingTaskId,
}: TasksBoardProps) {
  return (
    <section aria-label="Tasks board">
      <h2>Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks in this project.</p>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.task_id}
            task={task}
            onExecute={onExecute}
            isExecuting={executingTaskId === task.task_id}
          />
        ))
      )}
    </section>
  );
}
