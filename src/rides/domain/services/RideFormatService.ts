/** Kilometres with a decimal comma and at most one decimal place. */
export function formatKm(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "").replace(".", ",");
}
