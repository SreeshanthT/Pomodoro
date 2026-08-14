export function formatFocusDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

/** Fraction (0..1) through the day for an ISO datetime, used to position marks on a 24h timeline. */
export function dayFraction(isoDateTime: string): number {
  const d = new Date(isoDateTime)
  return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400
}
