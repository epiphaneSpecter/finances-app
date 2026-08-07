'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  );
}

/**
 * Bouton flottant "+" qui ouvre une modale contenant un formulaire.
 * `action` est une Server Action ; le formulaire se ferme après soumission.
 */
export function FormModal({
  title,
  action,
  children,
}: {
  title: string;
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn fab"
        aria-label={title}
        onClick={() => setOpen(true)}
      >
        +
      </button>

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <h2>{title}</h2>
            <form ref={formRef} action={handleAction}>
              {children}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </button>
                <SaveButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
