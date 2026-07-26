"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createAttribute, type AttributeType } from "@/lib/api";

const ADD_NEW = "__add_new__";

/**
 * Dropdown for a product taxonomy field (category / occasion / color /
 * fabric) with a trailing "+ Add new…" option. Picking it swaps in a text
 * input; confirming persists the value via POST /attributes and selects it,
 * so it's immediately available as a normal option everywhere else
 * (other product forms, storefront filters) without a page reload.
 */
/**
 * Multi-select variant of AttributeSelect — used only for `category` so a
 * product can belong to more than one, while occasion/color/fabric keep
 * using the single-select AttributeSelect above unchanged. Same "+ Add
 * new…" flow, but toggles values on/off a checklist instead of swapping
 * one selection for another.
 */
export function AttributeMultiSelect({
  label,
  type,
  values,
  options,
  onChange,
  onOptionAdded,
}: {
  label: string;
  type: AttributeType;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  onOptionAdded: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <label className="text-xs uppercase tracking-[0.24em] text-gray-500">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2 rounded-[1rem] border border-black/10 p-3">
        {allOptions.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => toggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                selected ? "border-[#3A2213] bg-[#3A2213] text-white" : "border-black/10 text-[#3A2213]"
              }`}
            >
              {option}
            </button>
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
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs"
            />
            <button type="button" onClick={confirmAdd} disabled={saving} className="text-xs text-[#3A2213] disabled:opacity-60">
              {saving && <Loader2 size={12} className="mr-1 inline animate-spin" />}Add
            </button>
            <button type="button" onClick={() => setAdding(false)} disabled={saving} className="text-xs text-gray-500">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(""); setError(null); setAdding(true); }}
            className="rounded-full border border-dashed border-black/20 px-3 py-1.5 text-xs text-gray-500"
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
}: {
  label: string;
  type: AttributeType;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onOptionAdded: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <label className="text-xs uppercase tracking-[0.24em] text-gray-500">{label}</label>
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
            className="w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm"
          />
          <button
            type="button"
            onClick={confirmAdd}
            disabled={saving}
            className="flex shrink-0 items-center gap-1 rounded-[1rem] border border-black/10 px-4 text-sm text-[#3A2213] hover:border-[#B17F5E] disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Add
          </button>
          <button
            type="button"
            onClick={cancelAdding}
            disabled={saving}
            className="shrink-0 rounded-[1rem] border border-black/10 px-4 text-sm text-gray-500"
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
      <label className="text-xs uppercase tracking-[0.24em] text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === ADD_NEW) {
            startAdding();
          } else {
            onChange(e.target.value);
          }
        }}
        className="mt-1 w-full rounded-[1rem] border border-black/10 px-3 py-3 text-sm"
      >
        {value && !options.includes(value) && <option value={value}>{value}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={ADD_NEW}>+ Add new {label.toLowerCase()}…</option>
      </select>
    </div>
  );
}
