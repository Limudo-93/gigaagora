/**
 * Gera um arquivo .ics (iCalendar) a partir de uma lista de eventos
 */

export interface CalendarEvent {
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  description?: string;
}

/**
 * Formata uma data para o formato iCalendar (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICS(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapa texto para formato iCalendar
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Gera o conteúdo do arquivo .ics
 */
export function generateICS(events: CalendarEvent[]): string {
  const now = new Date();
  const nowStr = formatDateForICS(now);

  let ics = "BEGIN:VCALENDAR\r\n";
  ics += "VERSION:2.0\r\n";
  ics += "PRODID:-//GigAgora//Calendar//PT\r\n";
  ics += "CALSCALE:GREGORIAN\r\n";
  ics += "METHOD:PUBLISH\r\n";

  events.forEach((event) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    ics += "BEGIN:VEVENT\r\n";
    ics += `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@chamaomusico.com\r\n`;
    ics += `DTSTAMP:${nowStr}\r\n`;
    ics += `DTSTART:${formatDateForICS(startDate)}\r\n`;
    ics += `DTEND:${formatDateForICS(endDate)}\r\n`;
    ics += `SUMMARY:${escapeICS(event.title)}\r\n`;

    if (event.location) {
      ics += `LOCATION:${escapeICS(event.location)}\r\n`;
    }

    if (event.description) {
      ics += `DESCRIPTION:${escapeICS(event.description)}\r\n`;
    }

    ics += "END:VEVENT\r\n";
  });

  ics += "END:VCALENDAR\r\n";
  return ics;
}

/**
 * Faz o download do arquivo .ics
 */
export function downloadICS(events: CalendarEvent[], filename: string = "agenda.ics"): void {
  const icsContent = generateICS(events);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

