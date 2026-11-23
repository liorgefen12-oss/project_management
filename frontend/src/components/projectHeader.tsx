import type { Project } from "../API/types";
import ProjectDropdown from "./projectDropdown";
import UserInfo from "./userInfo";
import "../styles/ProjectHeader.css";

type ProjectHeaderProps = {
  projects: Project[];
  projectId: string;
  onSelectProject: (projectId: string) => void;
  onLogout: () => void;
  busy: boolean;
};

export default function ProjectHeader({
  projects,
  projectId,
  onSelectProject,
  onLogout,
  busy,
}: ProjectHeaderProps) {
  return (
    <header className="project-header">
      <h1 className="project-header__title">Project board</h1>
      <div className="project-header__switch">
        גר
        <ProjectDropdown
          projects={projects}
          value={projectId}
          onChange={onSelectProject}
          variant="small"
          disabled={busy}
        />
      </div>
      <UserInfo onLogout={onLogout} disabled={busy} />
    </header>
  );
}
