// Picks black or white text for a given hex background so pill labels stay
// legible regardless of which color a flag option was given.
export function contrastTextColor(hex: string): '#000000' | '#ffffff' {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return '#ffffff'
  const [r, g, b] = match.slice(1).map((c) => parseInt(c, 16))
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#000000' : '#ffffff'
}
