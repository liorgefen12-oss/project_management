import { useId } from "react";
import type { Project } from "../API/types";
import "../styles/input.css";

type ProjectDropdownProps = {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
  variant: "large" | "small";
  disabled?: boolean;
};

export default function ProjectDropdown({
  projects,
  value,
  onChange,
  variant,
  disabled = false,
}: ProjectDropdownProps) {
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        Project
      </label>
      <select
        id={id}
        className={`field__input field__input--${variant}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          Choose a project
        </option>
        {projects.map((project) => (
          <option key={project.project_id} value={project.project_id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
