import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { AppHeader } from '../components/AppHeader'
import { NewProjectModal } from '../components/NewProjectModal'

export function ProjectsListPage() {
  const { session } = useAuth()
  const { projects, loading, error, createProject } = useProjects()
  const [showNewProject, setShowNewProject] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          <button
            onClick={() => setShowNewProject(true)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New project
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-gray-500">Loading projects…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <p className="mt-6 text-sm text-gray-500">
            No projects yet. Create one to get started.
          </p>
        )}

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm"
              >
                <h2 className="font-medium text-gray-900">{project.name}</h2>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{project.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={(name, description) =>
            createProject(name, description, session!.user.id)
          }
        />
      )}
    </div>
  )
}
