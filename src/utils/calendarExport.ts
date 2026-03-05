interface CalendarEvent {
  title: string;
  startDate: string;
  startTime: string;
  endTime?: string;
  dayOfWeek: number;
  durationWeeks?: number;
  location?: string;
  description?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toICSDate(date: Date): string {
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    '00'
  );
}

function getNextDayOfWeek(startDate: Date, targetDay: number): Date {
  const d = new Date(startDate);
  const diff = (targetDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d;
}

export function generateICS(event: CalendarEvent): string {
  const baseDate = new Date(event.startDate + 'T00:00:00');
  const firstSession = getNextDayOfWeek(baseDate, event.dayOfWeek);

  const [startH, startM] = event.startTime.split(':').map(Number);
  const start = new Date(firstSession);
  start.setHours(startH, startM, 0);

  let end: Date;
  if (event.endTime) {
    const [endH, endM] = event.endTime.split(':').map(Number);
    end = new Date(firstSession);
    end.setHours(endH, endM, 0);
  } else {
    end = new Date(start);
    end.setHours(end.getHours() + 1);
  }

  const weeks = event.durationWeeks || 9;
  const rrule = `RRULE:FREQ=WEEKLY;COUNT=${weeks}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kairo//Registration//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    rrule,
    `SUMMARY:${event.title}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    `UID:${crypto.randomUUID()}@kairo.app`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadICS(event: CalendarEvent, filename: string): void {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
