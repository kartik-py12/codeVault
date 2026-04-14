import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { authApi, syncApi } from '../api/client'
import AppTopNav from '../components/common/AppTopNav'

const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
}

const markdownComponents = {
  h1: (props) => <h1 className="mt-6 mb-4 text-2xl font-bold text-white" {...props} />,
  h2: (props) => <h2 className="mt-5 mb-3 text-xl font-bold text-white" {...props} />,
  h3: (props) => <h3 className="mt-4 mb-2 text-lg font-bold text-slate-100" {...props} />,
  p: (props) => <p className="mb-3 leading-relaxed text-slate-300" {...props} />,
  ul: (props) => <ul className="mb-3 ml-5 list-disc space-y-1 text-slate-300" {...props} />,
  ol: (props) => <ol className="mb-3 ml-5 list-decimal space-y-1 text-slate-300" {...props} />,
  li: (props) => <li className="text-slate-300" {...props} />,
  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const lang = match ? match[1] : 'text'
    return !inline ? (
      <SyntaxHighlighter
        style={materialDark}
        language={lang}
        className="my-3 rounded-lg"
        customStyle={{
          backgroundColor: '#0f1126',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-sm text-cyan-300" {...props}>
        {children}
      </code>
    )
  },
  blockquote: (props) => (
    <blockquote className="my-3 border-l-4 border-violet-400/30 bg-violet-500/5 pl-4 italic text-slate-300" {...props} />
  ),
  a: (props) => <a className="text-violet-400 hover:text-violet-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  table: (props) => <table className="my-3 w-full border-collapse" {...props} />,
  th: (props) => <th className="border border-[#232640] bg-[#13162e] px-3 py-2 text-left font-semibold text-white" {...props} />,
  td: (props) => <td className="border border-[#232640] px-3 py-2 text-slate-300" {...props} />
}

const ProblemPage = () => {
  const navigate = useNavigate()
  const { problemTitle } = useParams()
  const decodedProblemTitle = useMemo(() => decodeURIComponent(problemTitle || ''), [problemTitle])
  const [user, setUser] = useState(null)
  const [problemMeta, setProblemMeta] = useState(null)
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null)

  useEffect(() => {
    const loadProblemData = async () => {
      console.log('[ProblemPage] Loading data for route title:', decodedProblemTitle)

      try {
        const [currentUser, problemPayload] = await Promise.all([
          authApi.getCurrentUser(),
          syncApi.getProblemSubmissions(decodedProblemTitle)
        ])

        console.log('[ProblemPage] API problem metadata:', problemPayload?.problem)
        console.log('[ProblemPage] API latest submission:', problemPayload?.latestSubmission)
        console.log('[ProblemPage] API submissions count:', (problemPayload?.submissions || []).length)

        setUser(currentUser)
        setProblemMeta(problemPayload.problem || null)
        setSubmissionHistory(problemPayload.submissions || [])
        setSelectedSubmissionId(problemPayload.latestSubmission?._id || null)
      } catch (error) {
        console.error('[ProblemPage] Failed to load problem data:', error)

        if (error.message?.toLowerCase().includes('unauthorized')) {
          navigate('/login')
          return
        }
        navigate('/dashboard')
      }
    }

    if (decodedProblemTitle) {
      loadProblemData()
    }
  }, [decodedProblemTitle, navigate])

  const selectedSubmission = useMemo(() => {
    if (!submissionHistory.length) return null
    return submissionHistory.find((item) => item._id === selectedSubmissionId) || submissionHistory[0]
  }, [selectedSubmissionId, submissionHistory])

  const displayProblemTitle = selectedSubmission?.problemTitle || problemMeta?.title || decodedProblemTitle || 'Problem'
  const displayDifficulty = selectedSubmission?.difficulty || problemMeta?.difficulty || 'Unknown'
  const displayPlatform = selectedSubmission?.platform || problemMeta?.platform || 'LeetCode'
  const displayExternalUrl = selectedSubmission?.externalUrl || problemMeta?.externalUrl || ''
  const displayProblemContent = selectedSubmission?.problemContent || problemMeta?.description || ''
  const displayTopicTags = useMemo(() => {
    return (selectedSubmission?.topicTags || []).length
      ? selectedSubmission.topicTags
      : (problemMeta?.topics || [])
  }, [selectedSubmission?.topicTags, problemMeta?.topics])

  useEffect(() => {
    if (!decodedProblemTitle) return

    console.log('[ProblemPage] Display title:', displayProblemTitle)
    console.log('[ProblemPage] Display difficulty:', displayDifficulty)
    console.log('[ProblemPage] Display platform:', displayPlatform)
    console.log('[ProblemPage] Display description length:', displayProblemContent?.length || 0)
    console.log('[ProblemPage] Display topic tags:', displayTopicTags)

    if (!displayProblemContent) {
      console.warn('[ProblemPage] Problem description is empty in frontend display model')
    }

    if (!displayTopicTags.length) {
      console.warn('[ProblemPage] Topic tags are empty in frontend display model')
    }
  }, [decodedProblemTitle, displayDifficulty, displayPlatform, displayProblemContent, displayProblemTitle, displayTopicTags])

  const mappedStatus = selectedSubmission?.status === 'COMPLETED'
    ? 'Solved'
    : selectedSubmission?.status === 'FAILED'
      ? 'Review'
      : 'To-Do'

  const statusClasses = mappedStatus === 'Solved'
    ? 'border-emerald-400/10 bg-emerald-500/5 text-emerald-300'
    : mappedStatus === 'Review'
      ? 'border-amber-400/10 bg-amber-500/5 text-amber-300'
      : 'border-cyan-400/10 bg-cyan-500/5 text-cyan-300'

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

      <main className="mx-auto w-full max-w-[1600px] px-6 pb-12 pt-24 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-violet-300"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Sheet
            </button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <h2 className="text-4xl font-bold tracking-tight">{displayProblemTitle}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded border border-slate-700 bg-[#2a2a2a] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-300">
                  {displayPlatform}
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {displayDifficulty}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusClasses}`}>
                  <span className="material-symbols-outlined text-base">
                    {mappedStatus === 'Solved' ? 'check_circle' : mappedStatus === 'Review' ? 'flag' : 'circle'}
                  </span>
                  {mappedStatus}
                </span>
              </div>
            </div>
          </div>

          {displayExternalUrl ? (
            <a
              href={displayExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#232640] bg-[#13162e] px-4 text-sm font-medium text-slate-300 transition-all hover:border-violet-400/50 hover:text-white"
            >
              View on LeetCode
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </a>
          ) : null}
        </div>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            <article className="rounded-xl border border-[#232640] bg-[#13162e] p-6 lg:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="material-symbols-outlined text-violet-300">description</span>
                Problem Statement
              </h3>

              <div className="overflow-x-auto text-sm leading-relaxed">
                {displayProblemContent ? (
                  <div
                    className="prose prose-invert max-w-none [&_p]:mb-3 [&_p]:text-slate-300 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_li]:text-slate-300 [&_code]:bg-slate-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:text-sm [&_pre]:bg-[#0f1126] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-[#232640] [&_th]:bg-[#13162e] [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-left [&_th]:text-white [&_td]:border [&_td]:border-[#232640] [&_td]:px-3 [&_td]:py-2 [&_td]:text-slate-300 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-400/30 [&_blockquote]:bg-violet-500/5 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_blockquote]:my-3 [&_a]:text-violet-400 [&_a]:hover:text-violet-300 [&_a]:hover:underline"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayProblemContent) }}
                  />
                ) : (
                  <p className="text-slate-400 italic">No problem statement is available for this submission yet.</p>
                )}
              </div>
            </article>

            <article className="glass-brand relative overflow-hidden rounded-xl p-1">
              <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="rounded-lg border border-violet-400/15 bg-[#13162e]/60 p-6 lg:p-8">
                <div className="mb-6 border-b border-violet-400/20 pb-4">
                  <h3 className="text-lg font-bold text-white">AI Interviewer Guide</h3>
                  <p className="text-xs font-medium text-violet-300">Synced from CodeVault Extension</p>
                </div>

                <div className="space-y-6 text-sm text-slate-300">
                  <div className="timeline-item">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                      Intuition
                    </h4>
                    <div className="prose prose-sm prose-invert max-w-none">
                      {selectedSubmission?.aiNotes?.intuition ? (
                        <ReactMarkdown components={markdownComponents}>
                          {selectedSubmission.aiNotes.intuition}
                        </ReactMarkdown>
                      ) : (
                        <p className="italic text-slate-500">AI notes are not generated yet for this submission.</p>
                      )}
                    </div>
                  </div>

                  <div className="timeline-item">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      Potential Follow-ups
                    </h4>
                    <ul className="space-y-3">
                      {(selectedSubmission?.aiNotes?.followUps || []).length ? (
                        selectedSubmission.aiNotes.followUps.map((followUp, index) => (
                          <li key={`${followUp.question}-${index}`} className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10">
                            <p className="mb-2 font-medium text-cyan-200">{followUp.question}</p>
                            <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                              <ReactMarkdown components={markdownComponents}>
                                {followUp.hint}
                              </ReactMarkdown>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-2 text-slate-500 italic">
                          <span className="material-symbols-outlined mt-0.5 text-sm">question_answer</span>
                          No follow-up questions available yet.
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="timeline-item border-transparent pb-0">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      How to Answer
                    </h4>
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-4">
                      {selectedSubmission?.aiNotes?.howToAnswer ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown components={markdownComponents}>
                            {selectedSubmission.aiNotes.howToAnswer}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="italic text-slate-500">How-to-answer guidance is not available yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <aside className="space-y-6 lg:col-span-2">
            <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-[#232640] bg-[#0f1126] shadow-lg">
              <div className="flex items-center justify-between border-b border-[#232640] bg-[#13162e] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-300">javascript</span>
                  <span className="text-xs font-medium text-slate-300">
                    solution.{(selectedSubmission?.language || 'txt').toLowerCase()}
                  </span>
                </div>
                <button type="button" className="rounded p-1 text-slate-400 transition-colors hover:text-white">
                  <span className="material-symbols-outlined text-base">content_copy</span>
                </button>
              </div>

              <div className="custom-scrollbar flex-1 overflow-auto bg-[#0f1126]" style={{ padding: 0 }}>
                {selectedSubmission?.code ? (
                  <div style={{ margin: 0, padding: 0 }}>
                    <SyntaxHighlighter
                      style={materialDark}
                      language={selectedSubmission?.language?.toLowerCase() || 'text'}
                      showLineNumbers={true}
                      wrapLines={true}
                      customStyle={{
                        backgroundColor: '#0f1126',
                        padding: '16px',
                        fontSize: '0.875rem',
                        margin: 0,
                        borderRadius: 0,
                        color: '#e2e8f0'
                      }}
                      lineNumberStyle={{
                        color: '#64748b',
                        paddingRight: '16px',
                        userSelect: 'none'
                      }}
                    >
                      {selectedSubmission.code}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 p-4">
                    // No code available for this entry.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#232640] bg-[#13162e] px-4 py-2 text-[10px] text-slate-500">
                <span>Ln 18, Col 1</span>
                <span>UTF-8</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#232640] bg-[#13162e] p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Performance & Tags</h4>

              <div className="mb-6 grid grid-cols-2 gap-4">
                {[
                  ['Time Complexity', selectedSubmission?.aiNotes?.timeComplexity || 'N/A'],
                  ['Space Complexity', selectedSubmission?.aiNotes?.spaceComplexity || 'N/A']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#232640] bg-[#0f1126] p-3 text-center">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#232640] pt-4">
                <p className="mb-3 text-xs text-slate-400">Topic Tags</p>
                <div className="flex flex-wrap gap-2">
                  {displayTopicTags.length ? displayTopicTags.map((tag) => (
                    <span key={tag} className="cursor-pointer rounded-md border border-[#232640] bg-[#0f1126] px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-white">
                      {tag}
                    </span>
                  )) : <span className="text-xs text-slate-500">No tags available</span>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#232640] bg-[#13162e] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">All Submissions ({submissionHistory.length})</p>
              <div className="max-h-60 space-y-2 overflow-auto pr-1">
                {submissionHistory.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedSubmissionId(item._id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${selectedSubmissionId === item._id ? 'border-violet-400/50 bg-violet-500/10 text-white' : 'border-[#232640] bg-[#0f1126] text-slate-300 hover:border-slate-500'}`}
                  >
                    <p className="font-medium">{new Date(item.createdAt).toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">{item.status} • {item.language?.toUpperCase()}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default ProblemPage
