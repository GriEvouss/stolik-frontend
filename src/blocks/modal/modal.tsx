import React, { useEffect, useRef } from "react";
export default function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const previous = document.activeElement as HTMLElement;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <dialog
      className="modal"
      ref={ref}
      aria-label="Бронирование столика"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="button modal__close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>
      {children}
    </dialog>
  );
}
