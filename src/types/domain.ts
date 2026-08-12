import type { TaskRow } from './database'

export interface TaskNode extends TaskRow {
  children: TaskNode[]
}

export function buildTaskTree(tasks: TaskRow[]): TaskNode[] {
  const byId = new Map<string, TaskNode>()
  tasks.forEach((task) => byId.set(task.id, { ...task, children: [] }))

  const roots: TaskNode[] = []
  byId.forEach((node) => {
    if (node.parent_task_id && byId.has(node.parent_task_id)) {
      byId.get(node.parent_task_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortByCreatedAt = (nodes: TaskNode[]) => {
    nodes.sort((a, b) => a.created_at.localeCompare(b.created_at))
    nodes.forEach((n) => sortByCreatedAt(n.children))
  }
  sortByCreatedAt(roots)

  return roots
}
