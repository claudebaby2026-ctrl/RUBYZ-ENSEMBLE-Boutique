"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createAttribute, type AttributeType } from "@/lib/api";

const ADD_NEW = "__add_new__";

/**
 * Dropdown for a product taxonomy field (category / fabric) with a
 * trailing "+ Add new…" option. Picking it swaps in a text input;
 * confirming persists the value via POST /attributes and selects it, so
 * it's immediately available as a normal option everywhere else (other
 * product forms, storefront filters) without a page reload.
 */
/**
 * Multi-select variant of AttributeSelect — used only for `category` so a
 * product can belong to more than one, while `fabric` keeps using the
 * single-select AttributeSelect above unchanged. Same "+ Add new…" flow,
 * but toggles values on/off a checklist instead of swapping one selection
 * for another. Optionally supports deleting an option entirely (used for
 * category, via `onOptionDeleted`).
 */
export function AttributeMultiSelect({
  label,
  type,
  values,
  options,
  onChange,
  onOptionAdded,
  onOptionDeleted,
}: {
  label: string;
  type: AttributeType;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  onOptionAdded: (value: string) => void;
  onOptionDeleted?: (value: string) => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const allOptions = [...options, ...values.filter((v) => !options.includes(v))];

  const toggle = (option: string) => {
    if (values.includes(option)) {
      // Keep at least one category selected.
      if (values.length === 1) return;
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  };

  const removeOption = async (option: string) => {
    if (!onOptionDeleted) return;
    if (!confirm(`Delete "${option}"? It will no longer appear as an option to pick from.`)) return;
    setDeleting(option);
    setError(null);
    try {
      await onOptionDeleted(option);
      if (values.includes(option)) onChange(values.filter((v) => v !== option));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setDeleting(null);
    }
  };

  const confirmAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    const existing = allOptions.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!values.includes(existing)) onChange([...values, existing]);
      setAdding(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createAttribute(type, trimmed);
      onOptionAdded(created.value);
      onChange([...values, created.value]);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save new option");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="text-xs uppercase tracking-[0.24em] text-[#8B7A6E]">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2 rounded-[1rem] border border-[#3A2213]/12 p-3">
        {allOptions.map((option) => {
          const selected = values.includes(option);
          return (
            <span key={option} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => toggle(option)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selected ? "border-[#3A2213] bg-[#3A2213] text-white" : "border-[#3A2213]/12 text-[#3A2213]"
                } ${onOptionDeleted ? "rounded-r-none border-r-0" : ""}`}
              >
                {option}
              </button>
              {onOptionDeleted && (
                <button
                  type="button"
                  onClick={() => removeOption(option)}
                  disabled={deleting === option}
                  aria-label={`Delete ${option}`}
                  className={`rounded-full rounded-l-none border border-l-0 px-2 py-1.5 text-xs disabled:opacity-60 ${
                    selected ? "border-[#3A2213] bg-[#3A2213] text-white" : "border-[#3A2213]/12 text-[#8B7A6E]"
                  }`}
                >
                  {deleting === option ? <Loader2 size={11} className="animate-spin" /> : "×"}
                </button>
              )}
            </span>
          );
        })}
        {adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmAdd();
                } else if (e.key === "Escape") {
                  setAdding(false);
                }
              }}
              placeholder={`New ${label.toLowerCase()}…`}
              className="rounded-full border border-[#3A2213]/12 px-3 py-1.5 text-xs"
            />
            <button type="button" onClick={confirmAdd} disabled={saving} className="text-xs text-[#3A2213] disabled:opacity-60">
              {saving && <Loader2 size={12} className="mr-1 inline animate-spin" />}Add
            </button>
            <button type="button" onClick={() => setAdding(false)} disabled={saving} className="text-xs text-[#8B7A6E]">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(""); setError(null); setAdding(true); }}
            className="rounded-full border border-dashed border-black/20 px-3 py-1.5 text-xs text-[#8B7A6E]"
          >
            + Add new {label.toLowerCase()}…
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#D94F70]">{error}</p>}
    </div>
  );
}

export function AttributeSelect({
  label,
  type,
  value,
  options,
  onChange,
  onOptionAdded,
  onOptionDeleted,
}: {
  label: string;
  type: AttributeType;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onOptionAdded: (value: string) => void;
  onOptionDeleted?: (value: string) => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const removeCurrent = async () => {
    if (!onOptionDeleted || !value) return;
    if (!confirm(`Delete "${value}"? It will no longer appear as an option to pick from.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await onOptionDeleted(value);
      const next = options.find((o) => o !== value);
      if (next) onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  const startAdding = () => {
    setDraft("");
    setError(null);
    setAdding(true);
  };

  const cancelAdding = () => {
    setAdding(false);
    setError(null);
  };

  const confirmAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelAdding();
      return;
    }
    // Already an existing option (case-insensitive) — just select it, no
    // need to hit the API again.
    const existing = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      onChange(existing);
      cancelAdding();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createAttribute(type, trimmed);
      onOptionAdded(created.value);
      onChange(created.value);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save new option");
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div>
        <label className="text-xs uppercase tracking-[0.24em] text-[#8B7A6E]">{label}</label>
        <div className="mt-1 flex gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmAdd();
              } else if (e.key === "Escape") {
                cancelAdding();
              }
            }}
            placeholder={`New ${label.toLowerCase()}…`}
            className="w-full rounded-[1rem] border border-[#3A2213]/12 px-3 py-3 text-sm"
          />
          <button
            type="button"
            onClick={confirmAdd}
            disabled={saving}
            className="flex shrink-0 items-center gap-1 rounded-[1rem] border border-[#3A2213]/12 px-4 text-sm text-[#3A2213] hover:border-[#B17F5E] disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Add
          </button>
          <button
            type="button"
            onClick={cancelAdding}
            disabled={saving}
            className="shrink-0 rounded-[1rem] border border-[#3A2213]/12 px-4 text-sm text-[#8B7A6E]"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-[#D94F70]">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs uppercase tracking-[0.24em] text-[#8B7A6E]">{label}</label>
      <div className="mt-1 flex gap-2">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === ADD_NEW) {
              startAdding();
            } else {
              onChange(e.target.value);
            }
          }}
          className="w-full rounded-[1rem] border border-[#3A2213]/12 px-3 py-3 text-sm"
        >
          {value && !options.includes(value) && <option value={value}>{value}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={ADD_NEW}>+ Add new {label.toLowerCase()}…</option>
        </select>
        {onOptionDeleted && (
          <button
            type="button"
            onClick={removeCurrent}
            disabled={deleting || !value}
            aria-label={`Delete ${value}`}
            title={`Delete "${value}"`}
            className="shrink-0 rounded-[1rem] border border-[#3A2213]/12 px-3 text-sm text-[#8B7A6E] hover:border-[#D94F70] hover:text-[#D94F70] disabled:opacity-60"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : "×"}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-[#D94F70]">{error}</p>}
    </div>
  );
}
