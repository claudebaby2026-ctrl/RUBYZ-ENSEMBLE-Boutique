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
            className="flex shrink-0 items-center gap-1 rounded-[1rem] border border-black/10 px-4 text-sm text-[#111111] hover:border-[#B68D40] disabled:opacity-60"
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
