import { CATEGORY_OPTIONS } from '../lib/format'

/**
 * Controlled filter bar. `value` is the current filter object; `onChange` is
 * called with the next filter object whenever a field changes.
 */
export default function Filters({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <input
        type="search"
        placeholder="Search events…"
        value={value.q}
        onChange={(e) => set({ q: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm lg:col-span-3"
      />

      <select
        value={value.category}
        onChange={(e) => set({ category: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">All categories</option>
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={value.online}
        onChange={(e) => set({ online: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Online &amp; in-person</option>
        <option value="true">Online only</option>
        <option value="false">In-person only</option>
      </select>

      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={value.tags}
        onChange={(e) => set({ tags: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <label className="flex items-center gap-2 text-sm text-slate-600">
        From
        <input
          type="date"
          value={value.from}
          onChange={(e) => set({ from: e.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        To
        <input
          type="date"
          value={value.to}
          onChange={(e) => set({ to: e.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
    </div>
  )
}
