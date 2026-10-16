import { useEffect } from "react";

export default function Modal({ title, eyebrow = "WORKSPACE", onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="modal-heading">
          <div><div className="eyebrow">{eyebrow}</div><h2 id="modalTitle">{title}</h2></div>
          <button className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
