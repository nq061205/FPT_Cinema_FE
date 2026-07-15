import { useEffect } from "react";


export default function AppModal({
  open,
  onClose,
  title,
  eyebrow,
  size = "default",
  footer,
  children,
}) {
 
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "wide" ? "app-modal--wide" : size === "sm" ? "app-modal--sm" : "";

  return (
    <div
      className="app-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`app-modal ${sizeClass}`} role="dialog" aria-modal="true">
      
        <div className="app-modal__header">
          <div>
            {eyebrow && <p className="app-modal__eyebrow">{eyebrow}</p>}
            <h2 className="app-modal__title">{title}</h2>
          </div>
          <button
            className="app-modal__close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

     
        <div className="app-modal__body">{children}</div>

      
        {footer && <div className="app-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
