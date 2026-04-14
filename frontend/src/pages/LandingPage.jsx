import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import AppTopNav from '../components/common/AppTopNav'
import BrandLogo from '../components/common/BrandLogo'
import { heatmapLevels } from '../data'

const integrations = ['LeetCode', 'GeeksforGeeks', 'Codeforces', 'HackerRank']

const featureCards = [
  {
    title: 'Multi-platform Sync',
    copy: 'Automatically import your submissions from LeetCode and GFG. Never manually log a problem again.',
    icon: 'sync',
    tone: 'violet'
  },
  {
    title: 'AI Hints & Analysis',
    copy: 'Stuck on a DP problem? Get subtle nudges and complexity analysis without revealing the full solution.',
    icon: 'psychology',
    tone: 'cyan'
  },
  {
    title: 'GitHub Sync',
    copy: 'Push your solutions directly to your GitHub repository with beautiful commit messages and formatted code.',
    icon: 'dataset',
    tone: 'slate'
  },
  {
    title: 'Sheet Sharing',
    copy: 'Create custom problem sheets for your study group or students and track collective progress in real-time.',
    icon: 'share',
    tone: 'blue'
  }
]

const toneStyles = {
  violet: 'bg-violet-500/15 text-violet-300 border-violet-400/25',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/25',
  slate: 'bg-white/10 text-slate-200 border-white/20',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-400/25'
}

const targetToneStyles = {
  yellow: 'bg-yellow-500/20 text-yellow-300',
  rose: 'bg-rose-500/20 text-rose-300',
  emerald: 'bg-emerald-500/20 text-emerald-300'
}

const LandingPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchUser = async () => {
      try {
        const currentUser = await authApi.getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      }
    }

    fetchUser()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      navigate('/', { replace: true })
    } catch {
      setUser(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e27] text-slate-200">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="landing-grid-mask absolute inset-0" />
        <div className="landing-orb left-[16%] top-[-220px]" />
        <div className="landing-orb bottom-[-260px] right-[-100px] opacity-60" />
      </div>

      {user ? (
        <AppTopNav user={user} onLogout={handleLogout} />
      ) : (
      <nav className="relative z-30 border-b border-white/5 bg-[#0a0e27]/70 px-6 py-6 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <BrandLogo to="/" />
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#integrations" className="transition-colors hover:text-white">
              Integrations
            </a>
            <a href="#consistency" className="transition-colors hover:text-white">
              Progress
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white md:block">
              Sign In
            </Link>
            <Link to="/login" className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      )}

      <main className={`relative z-20 ${user ? 'pt-16' : ''}`}>
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 text-center lg:pb-28 lg:pt-32">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">v2.0 is now live</span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
            Your DSA journey,
            <br />
            <span className="text-gradient-brand">organized.</span>
          </h1>

          <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg font-light leading-relaxed text-slate-400 md:text-xl">
            Track your coding practice across platforms, visualize your progress, and maintain consistency with the ultimate developer companion.
          </p>

          <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to={user ? '/dashboard' : '/login'} className="btn-gradient-brand inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-semibold text-white sm:w-auto">
              {user ? 'Go to Dashboard' : 'Get Started Free'}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
            <Link to="/problem/Two%20Sum" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#12183a]/75 px-8 py-3.5 font-semibold text-slate-300 transition-all hover:border-slate-500 hover:text-white sm:w-auto">
              <span className="material-symbols-outlined text-lg">play_circle</span>
              View Demo Sheet
            </Link>
          </div>

          <div className="mx-auto w-full max-w-5xl px-2">
            <div className="mockup-tilt overflow-hidden rounded-xl border border-white/10 bg-[#0f1225]">
              <div className="flex h-10 items-center gap-2 border-b border-white/5 bg-[#10142b] px-4">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20" />
                  <span className="h-3 w-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
                  <span className="h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20" />
                </div>
                <div className="mx-auto rounded-md border border-white/5 bg-[#0a0e27] px-3 py-1 font-mono text-[10px] text-slate-500">
                  app.codevault.dashboard
                </div>
              </div>

              <div className="grid h-[480px] grid-cols-12 gap-6 bg-[#0a0e27] p-6">
                <aside className="col-span-2 hidden border-r border-white/5 pr-4 md:block">
                  <div className="h-8 w-24 animate-pulse rounded bg-white/5" />
                  <div className="mt-4 space-y-2">
                    <div className="h-8 rounded-lg bg-violet-500/20" />
                    <div className="h-8 rounded-lg bg-white/5" />
                    <div className="h-8 rounded-lg bg-white/5" />
                  </div>
                </aside>

                <div className="col-span-12 flex flex-col gap-5 md:col-span-10">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass-brand rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Solved Today</p>
                      <p className="text-3xl font-bold text-white">4</p>
                    </div>
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Streak</p>
                      <p className="flex items-center gap-2 text-3xl font-bold text-violet-300">
                        12 <span className="text-lg">🔥</span>
                      </p>
                    </div>
                    <div className="glass-brand rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Accuracy</p>
                      <p className="text-3xl font-bold text-cyan-300">87%</p>
                    </div>
                  </div>

                  <div className="glass-brand flex-1 rounded-xl border-t-2 border-t-violet-400/60 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-white">Today's Targets</h3>
                      <span className="text-xs text-slate-500">Oct 24, 2023</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        ['Merge Intervals', 'LeetCode • Medium', 'yellow', 'check_circle'],
                        ['Alien Dictionary', 'GFG • Hard', 'rose', 'progress_activity'],
                        ['Two Sum', 'Codeforces • Easy', 'emerald', 'data_object']
                      ].map(([name, meta, tone, icon], idx) => (
                        <div key={name} className={`flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 ${idx === 2 ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded ${targetToneStyles[tone]}`}>
                              <span className="material-symbols-outlined text-sm">{icon}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{name}</p>
                              <p className="text-xs text-slate-500">{meta}</p>
                            </div>
                          </div>

                          {idx === 0 ? (
                            <span className="material-symbols-outlined text-green-400">check_circle</span>
                          ) : idx === 1 ? (
                            <div className="h-2 w-12 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full w-2/3 bg-violet-400" />
                            </div>
                          ) : (
                            <button type="button" className="rounded bg-white/10 px-2 py-1 text-xs text-slate-300">
                              Start
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="border-y border-white/5 bg-[#12183a]/40 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <p className="mb-10 text-center text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
              Works seamlessly with your favorite platforms
            </p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {integrations.map((name) => (
                <div key={name} className="glass-brand flex cursor-default items-center gap-3 rounded-xl px-6 py-4 transition-all hover:-translate-y-1">
                  <span className="material-symbols-outlined text-cyan-300">deployed_code</span>
                  <span className="font-medium text-slate-200">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-24">
          <div className="mb-14 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Study Smarter</p>
            <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-white md:text-5xl">
              Everything you need to
              <br />
              master algorithms.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
            {featureCards.map((feature) => (
              <article key={feature.title} className="glass-brand group relative overflow-hidden rounded-3xl p-8">
                <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl transition-all group-hover:bg-violet-500/20" />
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl border ${toneStyles[feature.tone]}`}>
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                <p className="leading-relaxed text-slate-400">{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="consistency" className="px-4 pb-16">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] p-8 lg:p-14">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 font-['Space_Grotesk'] text-4xl font-bold text-white lg:text-5xl">Consistency is key.</h2>
                <p className="mb-7 text-lg text-slate-300">
                  Visualize your daily effort. The heatmap doesn't lie, and neither should you. Build a habit that sticks.
                </p>
                <ul className="space-y-3 text-slate-300">
                  {['Visual streak tracking', 'Daily targets & reminders', 'Comparison with peers'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-cyan-300">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-brand rounded-2xl border border-white/10 bg-[#0d1331]/80 p-6">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Total Contributions</p>
                    <p className="text-3xl font-bold text-white">1,284</p>
                  </div>
                  <p className="text-xs text-slate-500">Last Year</p>
                </div>
                <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] gap-1.5">
                  {heatmapLevels.map((level, index) => (
                    <div key={`cell-${index}`} className={`hm-cell hm-l${level}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#05081a] pb-8 pt-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <BrandLogo to="/" />
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                "Ship code daily. Track progress honestly. Improve relentlessly."
              </p>
            </div>
            <a
              href="https://github.com/kartik-py12"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white"
            >
              <span className="material-symbols-outlined text-base">code</span>
              Built by kartik-py12 on GitHub
            </a>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
            <p className="text-sm text-slate-600">© 2026 CodeVault</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Own your progress.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
