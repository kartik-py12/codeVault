import { Link, NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`

const AppTopNav = ({ user, onLogout }) => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-violet-500/20 bg-[#0a0b1e]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <BrandLogo to="/" />
          <nav className="hidden items-center gap-7 md:flex">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <div className="relative group">
              <button className="text-sm font-medium text-slate-400 transition-colors cursor-not-allowed flex items-center gap-1">
                Analytics
                <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">v2</span>
              </button>
              <div className="invisible group-hover:visible absolute top-full mt-1 bg-[#13162e] border border-[#232640] rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap">
                Coming in next version
              </div>
            </div>
            <div className="relative group">
              <button className="text-sm font-medium text-slate-400 transition-colors cursor-not-allowed flex items-center gap-1">
                Settings
                <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-full">v2</span>
              </button>
              <div className="invisible group-hover:visible absolute top-full mt-1 bg-[#13162e] border border-[#232640] rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap">
                Coming in next version
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 md:block">{user?.username || 'Guest'}</span>
            <Link to="/login" className="h-9 w-9 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 p-[2px]">
              {user?.avatarUrl ? (
                <img alt="User Avatar" className="h-full w-full rounded-full object-cover" src={user.avatarUrl} />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0b1e] text-xs font-semibold text-white">
                  KV
                </span>
              )}
            </Link>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-[#232640] bg-[#13162e] px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:text-white"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppTopNav
