import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

const LoginPage = () => {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        await authApi.getCurrentUser()
        if (isMounted) {
          navigate('/dashboard', { replace: true })
        }
      } catch {
        if (isMounted) {
          setCheckingAuth(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const handleGithubLogin = () => {
    window.location.href = authApi.getGithubLoginUrl()
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1226] text-slate-300">
        Checking session...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f1226] text-[#dfe0fe]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="login-grid absolute inset-0" />
        <div className="absolute left-[15%] top-[10%] h-64 w-64 animate-pulse rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-96 w-96 animate-pulse rounded-full bg-cyan-500/10 blur-[150px]" />

        <img
          alt="3D decorative octahedron"
          className="absolute left-1/4 top-1/4 h-24 w-24 rotate-12 opacity-20"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuASPUdU79jIyR-aGDN0HUvp4p5vihY32twJ_PwQx2fkdVEUmLL3qUHjQAkHP_VgFmxwZKN8R1M9ZYImwmUL_6bmn5VI2YohTqrHsFFdKPC9IsD4LQ84Mda3_hgAJ5RPEVTBIRxRfcP8KRyARMOxlJjXGxv30rQKuV2-JrtNQrJ-L2jjHS2AnXNUfhQIBU5jzwP8YT95_It9v3DJbrVWfjcPS_r8zH5sNBYr1-LRorlLxgcJQY8qUo7Ou4wBen8yr51bN88Et5mh31o"
        />
        <img
          alt="3D decorative sphere"
          className="absolute bottom-1/4 right-1/3 h-32 w-32 -rotate-45 opacity-20"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO4HJs3zj5Z7Jt5LUbrebsN0dWOKXpXKIgCnsXUz6d8CTrklVu39NRD2l6Kn7De4k05f1tfEbOlekDR9n8FClXmr7v8BsCiCG0umTGvduwjW1kneHzawWR5P4o-1rLMAXAoQKQa-gTx28HNCxRfGdttNi2VOcfkKeqd8Spm2r4SWovUzDFSl7FmqvXjSUlk53o_PEyTxPEVjEeSlHMYk0lz95UryXKFtHLvIqpUHuewDaDFWNK5cctIlNv71A_rjiLl53kPzPkE9I"
        />
        <img
          alt="3D decorative pyramid"
          className="absolute right-[15%] top-1/2 h-20 w-20 rotate-45 opacity-10"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0scl8vm_LZjS_68IE_LCRYYdAfnpmfEwvOX5-Qx87z07AQCeIsJHTiLa1-HRc081YaiF43TyqHQqay_RdVC9Z-p9DSJo_esO1d8JxFY0lDOjZqiWSWkjtft3kv2a2u1mV65ACoFj3WILXR-AZKLVtcdNI-UCkRpFPGkv6qIpb3uvwpWI6O0Sx_aw5Aac40iV4Kw_iPafxrVlc0XxknZgH_U5et9c7HvRAgJCl_UQEzBQkQy7Rs50MuU63qVcrGnOTpDRo-qg2p-k"
        />
      </div>

      <header className="fixed top-0 z-40 w-full bg-[#0f1226]/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-10 py-6">
          <Link to="/" className="font-['Syne'] text-3xl font-black tracking-tighter text-slate-100">
            CodeVault
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {['Docs', 'Security', 'Pricing'].map((item) => (
              <a key={item} href="#" className="font-['Space_Grotesk'] text-slate-500 transition-all hover:scale-105 hover:text-violet-400">
                {item}
              </a>
            ))}
            <a href="#" className="rounded-lg bg-[#171a2f] px-4 py-2 font-['Space_Grotesk'] text-violet-400">
              Support
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-20 flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="glass-login relative w-full max-w-md overflow-hidden rounded-xl border border-slate-500/20 p-8 md:p-12">
          <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-8 rounded-full border border-slate-500/40 bg-[#26283e] p-4">
              <svg aria-hidden="true" className="h-10 w-10 text-[#dfe0fe]" fill="currentColor" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fillRule="evenodd"
                />
              </svg>
            </div>

            <h1 className="mb-3 font-['Syne'] text-4xl font-bold tracking-tight">Continue your journey</h1>
            <p className="mb-10 max-w-xs text-lg text-slate-300">
              Sign in to access your personal DSA workspace.
            </p>

            <button
              type="button"
              onClick={handleGithubLogin}
              className="glow-login-btn group flex w-full items-center justify-center gap-3 rounded-md bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02]"
            >
              <span>Sign in with GitHub</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>

          <div className="mt-12 text-center text-xs leading-relaxed text-slate-400/70">
            By signing in, you agree to our
            <br />
            <a href="#" className="text-violet-300 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-violet-300 hover:underline">
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </main>

      <footer className="absolute bottom-0 z-20 w-full">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-12 py-8 md:flex-row">
          <p className="font-['Syne'] text-sm font-bold text-slate-300">CodeVault</p>
          <div className="flex gap-6">
            {['Terms', 'Privacy', 'Status', 'Twitter'].map((item) => (
              <a key={item} href="#" className="font-['DM_Sans'] text-xs uppercase tracking-[0.2em] text-slate-600 transition-colors hover:text-white">
                {item}
              </a>
            ))}
          </div>
          <p className="font-['DM_Sans'] text-xs uppercase tracking-[0.2em] text-slate-600">
            © 2024 CodeVault. Built for the void.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
