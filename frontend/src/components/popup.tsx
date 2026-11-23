import { useEffect, type ReactNode } from "react";

type PopupProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

export default function Popup({ title, onClose, children, actions }: PopupProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div
        className="popup"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="popup__title">{title}</h2>
        {children}
        <div className="popup__actions">
          {actions ?? (
            <button type="button" className="btn" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
