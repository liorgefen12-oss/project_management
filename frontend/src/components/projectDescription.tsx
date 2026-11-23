import { useProjectCompletion } from "../API/projects/useProjectCompletion";
import type { Project } from "../API/types";
import { getProjectGoals } from "../functions/projectGoals";

type ProjectDescriptionProps = {
  project: Project;
  steps: number;
  taskCount: number;
  executedCount: number;
  onEdit: () => void;
};

export default function ProjectDescription({
  project,
  steps,
  taskCount,
  executedCount,
  onEdit,
}: ProjectDescriptionProps) {
  const completion = useProjectCompletion(project.project_id);
  const completed = completion.data?.completed ?? false;
  const goals = getProjectGoals(project.goals);

  return (
    <section className="panel" aria-label="Project description">
      <div className="project-summary__head">
        <h2 className="project-summary__name">{project.name}</h2>
        {completion.data && (
          <span
            className={`project-summary__status${completed ? " project-summary__status--done" : ""}`}
          >
            {completed ? "Completed" : "In progress"}
          </span>
        )}
        <button
          type="button"
          className="btn btn--secondary project-summary__edit"
          onClick={onEdit}
        >
          Edit project
        </button>
      </div>
      <p className="project-summary__description">{project.description}</p>
      {goals && (
        <p className="project-summary__goals">
          Project goals - complete with a cost under {goals.cost} $ and under{" "}
          {goals.steps} steps.
        </p>
      )}

      <dl className="project-summary__stats">
        <div className="project-summary__stat">
          <dt>Budget</dt>
          <dd>{project.budget} $</dd>
        </div>
        <div className="project-summary__stat">
          <dt>Value</dt>
          <dd>{project.value} ✩</dd>
        </div>
        <div className="project-summary__stat">
          <dt>Steps</dt>
          <dd> {steps} 🚶︎</dd>
        </div>
        <div className="project-summary__stat">
          <dt>Executed</dt>
          <dd>
            {executedCount}/{taskCount} ⚒
          </dd>
        </div>
      </dl>
    </section>
  );
}
