import { useId } from "react";
import type { Project } from "../API/types";

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
  const large = variant === "large";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label htmlFor={id} style={{ fontWeight: 600 }}>
        Project
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={{
          width: large ? "100%" : "auto",
          minWidth: large ? 0 : 180,
          padding: large ? 16 : 8,
          fontSize: large ? 20 : 14,
          border: large ? "2px solid #5366db" : "1px solid #aaa",
          borderRadius: 8,
          backgroundColor: "white",
        }}
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
