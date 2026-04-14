import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, syncApi } from '../api/client'
import AppTopNav from '../components/common/AppTopNav'

const getDifficultyClasses = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'
  if (difficulty === 'Medium') return 'bg-amber-500/10 text-amber-300 border-amber-400/20'
  return 'bg-rose-500/10 text-rose-300 border-rose-400/20'
}

const getStatusMeta = (status) => {
  if (status === 'Solved') return { icon: 'check_circle', classes: 'text-emerald-300' }
  if (status === 'Review') return { icon: 'flag', classes: 'text-amber-300' }
  return { icon: 'circle', classes: 'text-slate-400' }
}

const statIconStyles = {
  violet: 'bg-violet-500/15 text-violet-300',
  emerald: 'bg-emerald-500/15 text-emerald-300',
  cyan: 'bg-cyan-500/15 text-cyan-300',
  amber: 'bg-amber-500/15 text-amber-300'
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortBy, setSortBy] = useState('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        const [currentUser, submissions] = await Promise.all([
          authApi.getCurrentUser(),
          syncApi.getLatestSubmissions()
        ])

        setUser(currentUser)

        const mapped = submissions.map((item) => {
          const mappedStatus = item.status === 'COMPLETED' ? 'Solved' : item.status === 'FAILED' ? 'Review' : 'To-Do'
          return {
            id: item._id,
            name: item.problemTitle,
            platform: item.platform || 'LeetCode',
            difficulty: item.difficulty || 'Unknown',
            status: mappedStatus,
            tags: item.topicTags?.length ? item.topicTags.slice(0, 3) : [item.language?.toUpperCase() || 'CODE'],
            lastActivity: new Date(item.updatedAt || item.createdAt).toLocaleDateString(),
            lastActivityAt: new Date(item.updatedAt || item.createdAt).getTime(),
            flagged: mappedStatus === 'Review'
          }
        })

        setRows(mapped)
      } catch {
        navigate('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [navigate])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedPlatform, selectedDifficulty, selectedStatus, sortBy])

  const platformOptions = useMemo(() => {
    const uniquePlatforms = [...new Set(rows.map((row) => row.platform).filter(Boolean))]
    return ['All', ...uniquePlatforms]
  }, [rows])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const result = rows.filter((row) => {
      const matchesSearch = !normalizedSearch ||
        row.name.toLowerCase().includes(normalizedSearch) ||
        row.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      const matchesPlatform = selectedPlatform === 'All' || row.platform === selectedPlatform
      const matchesDifficulty = selectedDifficulty === 'All' || row.difficulty === selectedDifficulty
      const matchesStatus = selectedStatus === 'All' || row.status === selectedStatus
      return matchesSearch && matchesPlatform && matchesDifficulty && matchesStatus
    })

    if (sortBy === 'name-asc') {
      return [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    if (sortBy === 'name-desc') {
      return [...result].sort((a, b) => b.name.localeCompare(a.name))
    }

    return [...result].sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  }, [rows, searchTerm, selectedPlatform, selectedDifficulty, selectedStatus, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage])

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedPlatform('All')
    setSelectedDifficulty('All')
    setSelectedStatus('All')
    setSortBy('recent')
  }

  const stats = useMemo(() => {
    const solved = rows.filter((row) => row.status === 'Solved').length
    const todo = rows.filter((row) => row.status === 'To-Do').length
    const review = rows.filter((row) => row.status === 'Review').length
    return {
      total: rows.length,
      solved,
      todo,
      review,
      solvedPercent: rows.length ? Math.round((solved / rows.length) * 100) : 0
    }
  }, [rows])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white">
      <AppTopNav user={user} onLogout={handleLogout} />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-6 pb-8 pt-20 lg:px-10">
        <div className="mb-8 flex shrink-0 flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-4xl font-bold tracking-tight">Your Problem Sheet</h2>
            <p className="text-slate-400">Track, organize, and master your DSA journey</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#232640] bg-[#13162e] text-slate-400 transition-all hover:border-violet-400/50 hover:text-white"
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        <section className="mb-8 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total Problems', String(stats.total), 'dataset', 'violet'],
            ['Solved', String(stats.solved), 'check_circle', 'emerald'],
            ['To-Do', String(stats.todo), 'radio_button_unchecked', 'cyan'],
            ['Review', String(stats.review), 'flag', 'amber']
          ].map(([title, value, icon, tone]) => (
            <article
              key={title}
              className="rounded-xl border border-[#232640] bg-[#13162e] p-5 transition-all hover:border-violet-400/35 hover:shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="text-sm text-slate-400">{title}</span>
                <span className={`material-symbols-outlined rounded-lg p-1.5 ${statIconStyles[tone]}`}>{icon}</span>
              </div>
              <p className="text-4xl font-bold">{value}</p>
              {title === 'Solved' ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${stats.solvedPercent}%` }} />
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#232640] bg-[#13162e] shadow-xl">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[#232640] bg-[#0f1126] p-4 lg:flex-row lg:items-center">
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="relative h-9 w-full lg:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2 text-slate-500">search</span>
                <input
                  className="h-full w-full rounded-lg border border-[#232640] bg-[#0a0b1e] pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/55 focus:outline-none"
                  placeholder="Filter problems..."
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="hidden h-6 w-px bg-[#232640] lg:block" />
              {platformOptions.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setSelectedPlatform(platform)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedPlatform === platform ? 'border-violet-400/60 bg-violet-500/10 text-violet-200' : 'border-[#232640] bg-[#0a0b1e] text-slate-300 hover:border-violet-400/50 hover:text-white'}`}
                >
                  {platform}
                </button>
              ))}
            </div>

            <div className="flex w-full items-center gap-3 overflow-x-auto pb-1 lg:w-auto">
              <div className="flex items-center gap-2 rounded-lg border border-[#232640] bg-[#0a0b1e] p-1">
                {['All', 'Easy', 'Medium', 'Hard', 'Unknown'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedDifficulty(level)}
                    className={`cursor-pointer rounded px-3 py-1 text-xs font-medium ${selectedDifficulty === level ? 'bg-[#13162e] text-white' : level === 'Easy' ? 'text-emerald-300' : level === 'Medium' ? 'text-amber-300' : level === 'Hard' ? 'text-rose-300' : 'text-slate-300'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-8 rounded-lg border border-[#232640] bg-[#0a0b1e] px-2 text-xs font-medium text-slate-300 focus:border-violet-400/55 focus:outline-none"
              >
                {['All', 'Solved', 'To-Do', 'Review'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-8 rounded-lg border border-[#232640] bg-[#0a0b1e] px-2 text-xs font-medium text-slate-300 focus:border-violet-400/55 focus:outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>
          </div>

          <div className="custom-scrollbar relative flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#0f1126]">
                <tr>
                  {['Problem Name', 'Platform', 'Difficulty', 'Status', 'Tags', 'Last Activity'].map((heading) => (
                    <th key={heading} className="border-b border-[#232640] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {heading}
                    </th>
                  ))}
                  <th className="border-b border-[#232640] px-5 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-[#232640]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Loading dashboard...</td>
                  </tr>
                ) : null}
                {!isLoading && paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                      No problems match your current filters.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && paginatedRows.map((row, index) => {
                  const statusMeta = getStatusMeta(row.status)
                  return (
                    <tr
                      key={`${row.id || row.name}-${index}`}
                      onClick={() => navigate(`/problem/${encodeURIComponent(row.name)}`)}
                      className="group cursor-pointer transition-colors hover:bg-violet-500/5"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-white transition-colors group-hover:text-violet-300">{row.name}</p>
                          {row.flagged ? <span className="material-symbols-outlined text-sm text-amber-300">flag</span> : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded border border-slate-700 bg-[#2a2a2a] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                          {row.platform}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getDifficultyClasses(row.difficulty)}`}>
                          {row.difficulty}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-2 text-xs font-medium ${statusMeta.classes}`}>
                          <span className="material-symbols-outlined text-[18px]">{statusMeta.icon}</span>
                          {row.status}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.tags.map((tag) => (
                            <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-500">{row.lastActivity}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/problem/${encodeURIComponent(row.name)}`)
                            }}
                            className="rounded p-1 text-slate-400 transition-colors hover:bg-violet-500/10 hover:text-violet-300"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/problem/${encodeURIComponent(row.name)}`)
                            }}
                            className="rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#232640] bg-[#0f1126] p-4 text-xs text-slate-400">
            <span>
              {filteredRows.length === 0
                ? 'Showing 0 of 0 problems'
                : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredRows.length)} of ${filteredRows.length} problems`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={`rounded border border-[#232640] px-3 py-1.5 ${currentPage <= 1 ? 'opacity-50' : 'hover:bg-white/5'}`}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className={`rounded border border-[#232640] px-3 py-1.5 text-white ${currentPage >= totalPages ? 'opacity-50' : 'hover:bg-white/5'}`}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
