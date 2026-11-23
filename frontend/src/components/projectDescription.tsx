import { useProjectCompletion } from "../API/projects/useProjectCompletion";
import type { Project } from "../API/types";

type ProjectDescriptionProps = {
  project: Project;
  steps: number;
  taskCount: number;
  executedCount: number;
};

export default function ProjectDescription({
  project,
  steps,
  taskCount,
  executedCount,
}: ProjectDescriptionProps) {
  const completion = useProjectCompletion(project.project_id);
  const completed = completion.data?.completed ?? false;

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
      </div>
      <p className="project-summary__description">{project.description}</p>

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
