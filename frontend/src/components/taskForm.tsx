import { useState, type FormEvent } from "react";
import { errorMessage } from "../API/apiErrorClass";
import { useCreateTask } from "../API/tasks/useCreateTask";
import { useEditTask } from "../API/tasks/useEditTask";
import { useTask } from "../API/tasks/useTask";
import type { BoardTask, EditTaskInput } from "../API/types";
import Popup from "./popup";
import "../styles/input.css";

type TaskFields = {
  task_name: string;
  description: string;
  cost: number;
  value: number;
  steps: number;
};

const emptyFields: TaskFields = {
  task_name: "",
  description: "",
  cost: 0,
  value: 0,
  steps: 1,
};

type FieldsFormProps = {
  title: string;
  initial: TaskFields;
  // Tasks that may be chosen as predecessors (they must come earlier on the board)
  candidates: BoardTask[];
  // Edits replace the predecessor list only when asked to
  predecessorsOptional: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (fields: TaskFields, predecessorIds: string[] | undefined) => void;
  onClose: () => void;
};

function TaskFieldsForm({
  title,
  initial,
  candidates,
  predecessorsOptional,
  pending,
  error,
  onSubmit,
  onClose,
}: FieldsFormProps) {
  const [fields, setFields] = useState(initial);
  const [changePredecessors, setChangePredecessors] =
    useState(!predecessorsOptional);
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);

  function update<K extends keyof TaskFields>(key: K, value: TaskFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function togglePredecessor(taskId: string) {
    setPredecessorIds((ids) =>
      ids.includes(taskId)
        ? ids.filter((id) => id !== taskId)
        : [...ids, taskId],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(fields, changePredecessors ? predecessorIds : undefined);
  }

  const numberField = (
    key: "cost" | "value" | "steps",
    label: string,
    min: number,
  ) => (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="number"
        min={min}
        step={1}
        required
        value={fields[key]}
        onChange={(e) => update(key, e.target.valueAsNumber)}
      />
    </label>
  );

  return (
    <Popup
      title={title}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            className="btn"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="field__input"
            required
            maxLength={50}
            value={fields.task_name}
            onChange={(e) => update("task_name", e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            className="field__input"
            maxLength={250}
            value={fields.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <div className="field-row">
          {numberField("cost", "Cost", 0)}
          {numberField("value", "Value", 0)}
          {numberField("steps", "Steps", 1)}
        </div>

        <div className="field">
          <span className="field__label">Predecessors</span>
          {predecessorsOptional && (
            <label>
              <input
                type="checkbox"
                checked={changePredecessors}
                onChange={(e) => setChangePredecessors(e.target.checked)}
              />{" "}
              Replace the current predecessors
            </label>
          )}
          {changePredecessors &&
            (candidates.length === 0 ? (
              <span className="muted">No earlier tasks to depend on.</span>
            ) : (
              <div className="checklist">
                {candidates.map((task) => (
                  <label key={task.task_id}>
                    <input
                      type="checkbox"
                      checked={predecessorIds.includes(task.task_id)}
                      onChange={() => togglePredecessor(task.task_id)}
                    />
                    #{task.position} {task.task_name}
                  </label>
                ))}
              </div>
            ))}
        </div>

        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}
      </form>
    </Popup>
  );
}

type CreateTaskFormProps = {
  projectId: string;
  tasks: BoardTask[];
  onClose: () => void;
};

export function CreateTaskForm({
  projectId,
  tasks,
  onClose,
}: CreateTaskFormProps) {
  const create = useCreateTask();
  const position =
    tasks.reduce((max, task) => Math.max(max, task.position), 0) + 1;

  return (
    <TaskFieldsForm
      title="New task"
      initial={emptyFields}
      candidates={tasks}
      predecessorsOptional={false}
      pending={create.isPending}
      error={create.error ? errorMessage(create.error) : null}
      onClose={onClose}
      onSubmit={(fields, predecessorIds) =>
        create.mutate(
          {
            ...fields,
            position,
            project: projectId,
            predecessor_ids: predecessorIds,
          },
          { onSuccess: onClose },
        )
      }
    />
  );
}

type EditTaskFormProps = {
  taskId: string;
  tasks: BoardTask[];
  onClose: () => void;
};

export function EditTaskForm({ taskId, tasks, onClose }: EditTaskFormProps) {
  // Load the latest copy of the task rather than trusting the board snapshot
  const task = useTask(taskId);
  const edit = useEditTask();

  if (!task.data) {
    return (
      <Popup title="Edit task" onClose={onClose}>
        {task.isError ? (
          <p role="alert" className="alert">
            {errorMessage(task.error)}
          </p>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </Popup>
    );
  }

  const current = task.data;
  const initial: TaskFields = {
    task_name: current.task_name,
    description: current.description,
    cost: current.cost,
    value: current.value,
    steps: current.steps,
  };

  return (
    <TaskFieldsForm
      title={`Edit "${current.task_name}"`}
      initial={initial}
      candidates={tasks.filter((t) => t.position < current.position)}
      predecessorsOptional
      pending={edit.isPending}
      error={edit.error ? errorMessage(edit.error) : null}
      onClose={onClose}
      onSubmit={(fields, predecessorIds) => {
        const changes: EditTaskInput = {};
        for (const key of Object.keys(fields) as (keyof TaskFields)[]) {
          if (fields[key] !== initial[key])
            Object.assign(changes, { [key]: fields[key] });
        }
        if (predecessorIds) changes.predecessor_ids = predecessorIds;
        if (Object.keys(changes).length === 0) return onClose();
        edit.mutate({ taskId, changes }, { onSuccess: onClose });
      }}
    />
  );
}
