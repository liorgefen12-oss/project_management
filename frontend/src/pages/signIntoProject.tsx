import { useState, type FormEvent } from "react";
import { errorMessage } from "../API/apiErrorClass";
import { useCreateProject } from "../API/projects/useCreateProject";
import type { Project } from "../API/types";
import ProjectDropdown from "../components/projectDropdown";
import ProjectGoalsFields from "../components/projectGoalsFields";
import UserInfo from "../components/userInfo";
import { goalsFromInputs } from "../functions/projectGoals";
import bookStack from "../../../assets/pictures/book-stack.jpg";
import "../styles/input.css";
import "../styles/ProjectHeader.css";
import "../styles/SignIntoProject.css";

type SignIntoProjectProps = {
  projects: Project[];
  onEnter: (projectId: string) => void;
  onLogout: () => void;
  busy: boolean;
};

function CreateProject({
  onEnter,
  busy,
}: Pick<SignIntoProjectProps, "onEnter" | "busy">) {
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(0);
  const [costGoal, setCostGoal] = useState("");
  const [stepsGoal, setStepsGoal] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const goals = goalsFromInputs(costGoal, stepsGoal) ?? undefined;
    create.mutate(
      { name, description, budget, goals },
      { onSuccess: (project) => onEnter(project.project_id) },
    );
  }

  return (
    <section
      className="panel project-entry__create"
      aria-label="Create a project"
    >
      <h2 className="panel__title">Create a new project</h2>
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="field__input"
            required
            maxLength={50}
            placeholder="e.g. A community reading corner"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            className="field__input"
            maxLength={250}
            rows={3}
            placeholder="What would you like this project to achieve?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="project-entry__goals">
          <ProjectGoalsFields
            costGoal={costGoal}
            stepsGoal={stepsGoal}
            onCostGoalChange={setCostGoal}
            onStepsGoalChange={setStepsGoal}
          />
        </div>
        <label className="field">
          <span className="field__label">Budget</span>
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
        {create.error && (
          <p role="alert" className="alert">
            {errorMessage(create.error)}
          </p>
        )}
        <button
          type="submit"
          className="btn btn--block"
          disabled={busy || create.isPending}
        >
          {create.isPending ? "Creating…" : "Create and open"}
        </button>
      </form>
    </section>
  );
}

export default function SignIntoProject({
  projects,
  onEnter,
  onLogout,
  busy,
}: SignIntoProjectProps) {
  const [selectedId, setSelectedId] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedId) onEnter(selectedId);
  }

  return (
    <>
      <header className="project-header">
        <h1 className="project-header__title">Project board</h1>
        <UserInfo onLogout={onLogout} disabled={busy} />
      </header>
      <main className="project-entry">
        <section
          className="panel project-entry__welcome"
          aria-label="Choose a project"
        >
          <div className="project-entry__selection">
            <h2 className="panel__title">Sign into a project</h2>
            {projects.length === 0 ? (
              <p className="project-entry__empty">
                Your library is waiting for its first project. Create one to get
                started.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <ProjectDropdown
                  projects={projects}
                  value={selectedId}
                  onChange={setSelectedId}
                  variant="large"
                  disabled={busy}
                />
                <button
                  type="submit"
                  className="btn btn--block"
                  disabled={!selectedId || busy}
                >
                  {busy ? "Opening…" : "Open project"}
                </button>
              </form>
            )}
          </div>
          <img
            className="project-entry__illustration"
            src={bookStack}
            alt="An illustrated stack of colorful books"
            width={554}
            height={554}
          />
        </section>

        <CreateProject onEnter={onEnter} busy={busy} />
      </main>
    </>
  );
}
