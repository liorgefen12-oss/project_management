import { useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "../API/apiFetch";
import { useCreateProject } from "../API/projects/useCreateProject";
import { useProjectByName } from "../API/projects/useProjectByName";
import type { Project } from "../API/types";
import ProjectDropdown from "../components/projectDropdown";
import UserInfo from "../components/userInfo";
import "../styles/input.css";
import "../styles/ProjectHeader.css";

type SignIntoProjectProps = {
  projects: Project[];
  onEnter: (projectId: string) => void;
  onLogout: () => void;
  busy: boolean;
};

function FindProject({ onEnter, busy }: Pick<SignIntoProjectProps, "onEnter" | "busy">) {
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const found = useProjectByName(name);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setName(draft);
  }

  return (
    <section className="panel" aria-label="Find a project">
      <h2 className="panel__title">Find by name</h2>
      <form className="inline-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Project name</span>
          <input
            className="field__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--secondary" disabled={!draft.trim()}>
          Find
        </button>
      </form>
      {name.trim() &&
        (found.isPending ? (
          <p className="muted">Searching…</p>
        ) : found.isError ? (
          <p role="alert" className="alert">
            {found.error instanceof ApiError && found.error.status === 404
              ? `No project is called "${name.trim()}".`
              : errorMessage(found.error)}
          </p>
        ) : (
          <ul className="search-results">
            <li className="search-results__item">
              <span>
                <strong>{found.data.name}</strong>
                <br />
                <span className="muted">
                  Budget {found.data.budget} · Value {found.data.value}
                </span>
              </span>
              <button
                type="button"
                className="btn btn--link"
                onClick={() => onEnter(found.data.project_id)}
                disabled={busy}
              >
                Open
              </button>
            </li>
          </ul>
        ))}
    </section>
  );
}

function CreateProject({ onEnter, busy }: Pick<SignIntoProjectProps, "onEnter" | "busy">) {
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate(
      { name, description, budget },
      { onSuccess: (project) => onEnter(project.project_id) },
    );
  }

  return (
    <section className="panel" aria-label="Create a project">
      <h2 className="panel__title">New project</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit" className="btn" disabled={busy || create.isPending}>
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
      <main className="center-page">
        <section className="panel" aria-label="Choose a project">
          <h2 className="panel__title">Choose a project</h2>
          {projects.length === 0 ? (
            <p className="muted">No projects available yet. Create one below.</p>
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
        </section>
        <FindProject onEnter={onEnter} busy={busy} />
        <CreateProject onEnter={onEnter} busy={busy} />
      </main>
    </>
  );
}
