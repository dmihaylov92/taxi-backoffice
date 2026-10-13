function pad(value: number): string {
  return String(value).padStart(2, "0");
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `dd.MM.yyyy` for a `yyyy-MM-dd` calendar date, without any time-zone shift; empty otherwise. */
export function formatDate(isoDate: string): string {
  const match = ISO_DATE.exec(isoDate);

  return match ? `${match[3]}.${match[2]}.${match[1]}` : "";
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
