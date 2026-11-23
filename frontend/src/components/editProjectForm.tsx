import { useState, type FormEvent } from "react";
import { errorMessage } from "../API/apiErrorClass";
import { useEditProject } from "../API/projects/useEditProject";
import type { EditProjectInput, Project } from "../API/types";
import { getProjectGoals, goalsFromInputs } from "../functions/projectGoals";
import Popup from "./popup";
import ProjectGoalsFields from "./projectGoalsFields";
import "../styles/input.css";

type EditProjectFormProps = {
  project: Project;
  onClose: () => void;
};

export default function EditProjectForm({ project, onClose }: EditProjectFormProps) {
  const edit = useEditProject();
  const initialGoals = getProjectGoals(project.goals);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [budget, setBudget] = useState(project.budget);
  const [costGoal, setCostGoal] = useState(initialGoals ? String(initialGoals.cost) : "");
  const [stepsGoal, setStepsGoal] = useState(initialGoals ? String(initialGoals.steps) : "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Only send what changed
    const changes: EditProjectInput = {};
    if (name !== project.name) changes.name = name;
    if (description !== project.description) changes.description = description;
    if (budget !== project.budget) changes.budget = budget;
    const goals = goalsFromInputs(costGoal, stepsGoal);
    const goalsChanged =
      goals?.cost !== initialGoals?.cost || goals?.steps !== initialGoals?.steps;
    if (goalsChanged) changes.goals = goals;

    if (Object.keys(changes).length === 0) return onClose();
    edit.mutate({ projectId: project.project_id, changes }, { onSuccess: onClose });
  }

  return (
    <Popup
      title={`Edit "${project.name}"`}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="project-form" className="btn" disabled={edit.isPending}>
            {edit.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="field__input"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            className="field__input"
            maxLength={250}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <ProjectGoalsFields
          costGoal={costGoal}
          stepsGoal={stepsGoal}
          onCostGoalChange={setCostGoal}
          onStepsGoalChange={setStepsGoal}
        />
        <label className="field">
          <span className="field__label">Remaining budget</span>
          <input
            className="field__input"
            type="number"
            min={0}
            step={1}
            required
            value={budget}
            onChange={(e) => setBudget(e.target.valueAsNumber)}
          />
        </label>
        {edit.error && (
          <p role="alert" className="alert">
            {errorMessage(edit.error)}
          </p>
        )}
      </form>
    </Popup>
  );
}
