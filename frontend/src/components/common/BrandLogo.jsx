import { Link } from 'react-router-dom'

const BrandLogo = ({ to = '/', compact = false }) => {
  return (
    <Link to={to} className="inline-flex items-center gap-2">
      <span className="material-symbols-outlined rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 p-1 text-xl text-white shadow-[0_0_18px_rgba(139,92,246,0.45)]">
        terminal
      </span>
      {!compact ? (
        <span className="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-white">CodeVault</span>
      ) : null}
    </Link>
  )
}

export default BrandLogo
