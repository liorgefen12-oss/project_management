import type { Project } from "../API/types";
import icon from "../../../assets/pictures/icon-no-background.png";
import BackToProjectsButton from "./backToProjectsButton";
import ProjectDropdown from "./projectDropdown";
import UserInfo from "./userInfo";
import "../styles/ProjectHeader.css";

type ProjectHeaderProps = {
  projects: Project[];
  projectId: string;
  onSelectProject: (projectId: string) => void;
  onLeaveProject: () => void;
  onLogout: () => void;
  busy: boolean;
};

export default function ProjectHeader({
  projects,
  projectId,
  onSelectProject,
  onLeaveProject,
  onLogout,
  busy,
}: ProjectHeaderProps) {
  return (
    <header className="project-header">
      <h1 className="project-header__title">
        Library Projects Management
        <img className="project-header__icon" src={icon} alt="" />
      </h1>
      <div className="project-header__switch">
        <BackToProjectsButton onClick={onLeaveProject} disabled={busy} />
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
