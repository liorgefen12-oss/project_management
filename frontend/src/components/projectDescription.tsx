type ProjectDescriptionProps = {
  project: {
    name: string;
    description: string;
    budget: number;
    value: number;
  };
  steps: number;
};

export default function ProjectDescription({
  project,
  steps,
}: ProjectDescriptionProps) {
  return (
    <section aria-label="Project description">
      <h2>{project.name}</h2>
      <p>{project.description}</p>

      <dl>
        <dt>Budget</dt>
        <dd>{project.budget}</dd>

        <dt>Value</dt>
        <dd>{project.value}</dd>

        <dt>Steps</dt>
        <dd>{steps}</dd>
      </dl>
    </section>
  );
}
