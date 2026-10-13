function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** `dd.MM.yyyy HH:mm` in the viewer's time zone; empty for an unparseable timestamp. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
