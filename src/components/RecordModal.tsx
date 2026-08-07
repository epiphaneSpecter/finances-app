'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

export type FieldDef = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  options?: { value: string; label: string }[];
  /** Valeur par défaut en mode ajout (ex. select). Ignorée en édition. */
  defaultValue?: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  );
}

function toInputValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * Modale pilotée par une définition de champs, réutilisée pour l'ajout et la
 * modification.
 * - `trigger="fab"`  → gros bouton flottant « + » (ajout)
 * - `trigger="edit"` → petit bouton « ✎ » dans une ligne (modification)
 * En mode édition, `values` pré-remplit les champs et un champ caché `id` est
 * envoyé à la Server Action.
 */
export function RecordModal({
  title,
  action,
  fields,
  trigger,
  values,
}: {
  title: string;
  action: (formData: FormData) => Promise<void>;
  fields: FieldDef[];
  trigger: 'fab' | 'edit';
  values?: object;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // `values` est un enregistrement typé (Income/Expense/Debt) ; on l'indexe
  // dynamiquement par nom de champ.
  const vals = values as Record<string, unknown> | undefined;

  async function handleAction(formData: FormData) {
    await action(formData);
    if (trigger === 'fab') formRef.current?.reset();
    setOpen(false);
  }

  return (
    <>
      {trigger === 'fab' ? (
        <button
          type="button"
          className="btn fab"
          aria-label={title}
          onClick={() => setOpen(true)}
        >
          +
        </button>
      ) : (
        <button
          type="button"
          className="btn ghost"
          aria-label={title}
          title={title}
          onClick={() => setOpen(true)}
        >
          ✎
        </button>
      )}

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
              {vals?.id != null && (
                <input type="hidden" name="id" value={String(vals.id)} />
              )}

              {fields.map((f) => {
                const prefill =
                  vals !== undefined
                    ? toInputValue(vals[f.name])
                    : (f.defaultValue ?? '');

                return (
                  <div className="field" key={f.name}>
                    <label htmlFor={`${f.name}`}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select
                        id={f.name}
                        name={f.name}
                        defaultValue={prefill || f.defaultValue || ''}
                      >
                        {(f.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={f.name}
                        name={f.name}
                        type={f.type}
                        required={f.required}
                        placeholder={f.placeholder}
                        step={f.step}
                        min={f.min}
                        max={f.max}
                        defaultValue={prefill}
                      />
                    )}
                  </div>
                );
              })}

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
