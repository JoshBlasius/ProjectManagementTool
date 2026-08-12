// Minimal hand-written types for frappe-gantt (no official/matching @types
// package for the v1.x API we use). Only covers the surface this app calls.
declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string
    name: string
    start: string
    end: string
    progress: number
    dependencies?: string
    custom_class?: string
    description?: string
  }

  export interface GanttPopupContext {
    task: GanttTask
    set_title: (html: string) => void
    set_subtitle: (html: string) => void
    set_details: (html: string) => void
  }

  export interface GanttOptions {
    view_mode?: 'Day' | 'Week' | 'Month' | 'Year'
    view_mode_select?: boolean
    bar_height?: number
    padding?: number
    move_dependencies?: boolean
    readonly?: boolean
    readonly_progress?: boolean
    readonly_dates?: boolean
    scroll_to?: 'today' | 'start' | 'end'
    popup?: (ctx: GanttPopupContext) => void | false
    on_click?: (task: GanttTask) => void
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void
    on_progress_change?: (task: GanttTask, progress: number) => void
  }

  export default class Gantt {
    constructor(wrapper: string | HTMLElement, tasks: GanttTask[], options?: GanttOptions)
    refresh(tasks: GanttTask[]): void
    change_view_mode(mode?: string): void
  }
}
