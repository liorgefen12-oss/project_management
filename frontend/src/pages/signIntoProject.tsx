import { useState, type FormEvent } from "react";
import type { Project } from "../API/types";
import ProjectDropdown from "../components/projectDropdown";

type SignIntoProjectProps = {
  projects: Project[];
  onEnter: (projectId: string) => void;
  onLogout: () => void;
  busy: boolean;
};

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
    <main style={{ maxWidth: 480, margin: "10vh auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Choose a project</h1>
        <button type="button" onClick={onLogout} disabled={busy}>
          Log out
        </button>
      </header>
      <p>Select the project you want to open.</p>
      {projects.length === 0 ? (
        <p>No projects available.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <ProjectDropdown
            projects={projects}
            value={selectedId}
            onChange={setSelectedId}
            variant="large"
            disabled={busy}
          />
          <button type="submit" disabled={!selectedId || busy} style={{ marginTop: 20 }}>
            {busy ? "Opening..." : "Open project"}
          </button>
        </form>
      )}
    </main>
  );
}
