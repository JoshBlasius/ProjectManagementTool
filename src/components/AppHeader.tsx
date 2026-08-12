import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AppHeader() {
  const { profile, session, signOut } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/projects" className="font-semibold text-gray-900">
          Project Management Tool
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{profile?.name ?? session?.user.email}</span>
          <button onClick={() => signOut()} className="text-indigo-600 hover:text-indigo-500">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
