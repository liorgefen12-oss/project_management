type BackToProjectsButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function BackToProjectsButton({
  onClick,
  disabled = false,
}: BackToProjectsButtonProps) {
  return (
    <button
      type="button"
      className="btn btn--secondary"
      onClick={onClick}
      disabled={disabled}
      title="Leave this project and choose another one"
    >
      ← Back to all projects
    </button>
  );
}
