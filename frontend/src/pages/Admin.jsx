import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { CATEGORY_OPTIONS, formatDateTime } from '../lib/format'

export default function Admin() {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold text-slate-900">Admin dashboard</h2>
      <AdminEvents />
      <IngestionJobs />
    </div>
  )
}

function AdminEvents() {
  const { api } = useAuth()
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [editing, setEditing] = useState(null) // { id, title, category }
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api
      .get(`/api/admin/events?page=${page}&size=15`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [api, page])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    await api.put(`/api/admin/events/${editing.id}`, {
      title: editing.title,
      category: editing.category,
    })
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this event?')) return
    await api.del(`/api/admin/events/${id}`)
    load()
  }

  return (
    <section>
      <h3 className="mb-3 font-semibold text-slate-800">
        Events <span className="text-sm font-normal text-slate-400">({data.totalElements})</span>
      </h3>
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Starts</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.content.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0">
                {editing?.id === e.id ? (
                  <>
                    <td className="px-3 py-2">
                      <input
                        value={editing.title}
                        onChange={(ev) => setEditing({ ...editing, title: ev.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={editing.category}
                        onChange={(ev) => setEditing({ ...editing, category: ev.target.value })}
                        className="rounded border border-slate-300 px-2 py-1"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{formatDateTime(e.startDateTime)}</td>
                    <td className="px-3 py-2 text-slate-500">{e.source}</td>
                    <td className="space-x-2 px-3 py-2 text-right">
                      <button onClick={save} className="text-indigo-600 hover:underline">
                        Save
                      </button>
                      <button onClick={() => setEditing(null)} className="text-slate-500 hover:underline">
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 font-medium text-slate-800">{e.title}</td>
                    <td className="px-3 py-2 text-slate-500">{e.category}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDateTime(e.startDateTime)}</td>
                    <td className="px-3 py-2 text-slate-500">{e.source}</td>
                    <td className="space-x-2 px-3 py-2 text-right">
                      <button
                        onClick={() => setEditing({ id: e.id, title: e.title, category: e.category })}
                        className="text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => remove(e.id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-slate-500">
          Page {page + 1} of {Math.max(data.totalPages, 1)}
        </span>
        <button
          disabled={page + 1 >= data.totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  )
}

function IngestionJobs() {
  const { api } = useAuth()
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/admin/ingestion-jobs?size=20')
      .then((d) => setJobs(d.content))
      .catch((e) => setError(e.message))
  }, [api])

  const statusColor = (s) =>
    s === 'SUCCESS' ? 'text-emerald-600' : s === 'FAILED' ? 'text-red-600' : 'text-amber-600'

  return (
    <section>
      <h3 className="mb-3 font-semibold text-slate-800">Ingestion jobs</h3>
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">Fetched</th>
              <th className="px-3 py-2">Ins</th>
              <th className="px-3 py-2">Upd</th>
              <th className="px-3 py-2">Skip</th>
              <th className="px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 font-medium text-slate-800">{j.source}</td>
                <td className={`px-3 py-2 font-medium ${statusColor(j.status)}`}>{j.status}</td>
                <td className="px-3 py-2 text-slate-500">{formatDateTime(j.startedAt)}</td>
                <td className="px-3 py-2 text-slate-500">{j.fetched}</td>
                <td className="px-3 py-2 text-slate-500">{j.inserted}</td>
                <td className="px-3 py-2 text-slate-500">{j.updated}</td>
                <td className="px-3 py-2 text-slate-500">{j.skipped}</td>
                <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-400" title={j.errorMessage}>
                  {j.errorMessage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
