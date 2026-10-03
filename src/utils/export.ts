import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { EntriesByDate, UserProfile } from '@/types/models';

const csvEscape = (value: string): string => `"${value.replace(/"/g, '""')}"`;

function buildCsv(entries: EntriesByDate): string {
  const header = [
    'date',
    'mood',
    'note',
    'loggedAtHour',
    'selectedOptions',
    'song',
    'weather',
    'exerciseMinutes',
    'sleepHours',
  ];
  const rows = Object.values(entries)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) =>
      [
        e.date,
        String(e.mood),
        csvEscape(e.note ?? ''),
        String(e.loggedAtHour),
        csvEscape(e.selectedOptions.join('; ')),
        csvEscape(e.song ?? ''),
        e.weather ?? '',
        e.exerciseMinutes?.toString() ?? '',
        e.sleepHours?.toString() ?? '',
      ].join(',')
    );
  return [header.join(','), ...rows].join('\n');
}

export async function exportEntriesAsCsv(entries: EntriesByDate): Promise<void> {
  const csv = buildCsv(entries);
  const file = new File(Paths.cache, `mood-export-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Mood — export' });
  }
}

function buildHtml(entries: EntriesByDate, profile: UserProfile | null): string {
  const rows = Object.values(entries)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (e) => `
      <tr>
        <td>${e.date}</td>
        <td>${e.mood}</td>
        <td>${(e.note ?? '').replace(/</g, '&lt;')}</td>
        <td>${e.selectedOptions.join(', ')}</td>
      </tr>`
    )
    .join('');

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, sans-serif; padding: 24px; color: #0B1120;">
        <h1>Mood — ${profile?.name ?? ''}</h1>
        <p>Exportado el ${new Date().toLocaleDateString()}</p>
        <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="8">
          <thead>
            <tr><th>Fecha</th><th>Ánimo</th><th>Nota</th><th>Tags</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

export async function exportEntriesAsPdf(
  entries: EntriesByDate,
  profile: UserProfile | null
): Promise<void> {
  const html = buildHtml(entries, profile);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Mood — export' });
  }
}
