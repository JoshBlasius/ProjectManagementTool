const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

// frappe-gantt's popup setters (set_title/set_subtitle/set_details) all
// assign to innerHTML, so any user-controlled text (task names, flag
// labels/colors) injected into that HTML must be escaped first.
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c])
}
