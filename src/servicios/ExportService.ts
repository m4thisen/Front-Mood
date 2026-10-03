/**
 * ExportService — «servicio» en el diagrama de clases de la aplicación móvil.
 * Genera el historial completo en CSV o PDF dentro del dispositivo, sin pasar
 * por el servidor, y lo entrega al menú de compartir del sistema (CU-23).
 * El diseño final del PDF se completa en la iteración 6.
 */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { RegistroDiario, TagPersonalizado, Usuario } from '@/dominio';

const escaparCsv = (valor: string): string => `"${valor.replace(/"/g, '""')}"`;
const escaparHtml = (valor: string): string =>
  valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ordenarPorFecha = (registros: RegistroDiario[]) =>
  [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));

function describirTags(registro: RegistroDiario, tags: TagPersonalizado[]): string {
  return Object.entries(registro.valoresTags)
    .map(([id, valor]) => {
      const nombre = tags.find((t) => t.id === id)?.nombre ?? id;
      return typeof valor === 'boolean' ? (valor ? nombre : null) : `${nombre}: ${valor}`;
    })
    .filter((v): v is string => v !== null && v !== '')
    .join('; ');
}

const describirCancion = (registro: RegistroDiario): string =>
  registro.cancion ? [registro.cancion.titulo, registro.cancion.artista].filter(Boolean).join(' — ') : '';

function armarCsv(registros: RegistroDiario[], tags: TagPersonalizado[]): string {
  const encabezado = [
    'fecha',
    'nivel_animo',
    'destacado',
    'texto',
    'climas',
    'horas_sueno',
    'minutos_ejercicio',
    'etiquetas',
    'tags_personalizados',
    'cancion',
    'hora_carga',
  ];
  const filas = ordenarPorFecha(registros).map((r) =>
    [
      r.fecha,
      String(r.nivelAnimo),
      r.destacado ? 'si' : 'no',
      escaparCsv(r.texto),
      r.climas.join('; '),
      r.horasSueno?.toString() ?? '',
      r.minutosEjercicio?.toString() ?? '',
      escaparCsv(r.etiquetas.join('; ')),
      escaparCsv(describirTags(r, tags)),
      escaparCsv(describirCancion(r)),
      r.horaCarga,
    ].join(',')
  );
  return [encabezado.join(','), ...filas].join('\n');
}

export async function exportarCSV(registros: RegistroDiario[], tags: TagPersonalizado[]): Promise<void> {
  const archivo = new File(Paths.cache, `mood-historial-${Date.now()}.csv`);
  archivo.create({ overwrite: true });
  archivo.write(armarCsv(registros, tags));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(archivo.uri, { mimeType: 'text/csv', dialogTitle: 'Mood' });
  }
}

function armarHtml(registros: RegistroDiario[], usuario: Usuario | null, tags: TagPersonalizado[]): string {
  const filas = ordenarPorFecha(registros)
    .map(
      (r) => `
      <tr>
        <td>${r.fecha}</td>
        <td>${r.nivelAnimo}${r.destacado ? ' ⭐' : ''}</td>
        <td>${escaparHtml(r.texto)}</td>
        <td>${escaparHtml(r.etiquetas.join(', '))}</td>
        <td>${escaparHtml(describirTags(r, tags))}</td>
      </tr>`
    )
    .join('');

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, sans-serif; padding: 24px; color: #0B1120;">
        <h1>Mood — ${escaparHtml(usuario?.nombre ?? '')}</h1>
        <p>${registros.length} días registrados · exportado el ${new Date().toLocaleDateString()}</p>
        <table style="width:100%; border-collapse: collapse;" border="1" cellpadding="8">
          <thead>
            <tr><th>Fecha</th><th>Ánimo</th><th>Texto</th><th>Etiquetas</th><th>Tags</th></tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </body>
    </html>
  `;
}

export async function exportarPDF(
  registros: RegistroDiario[],
  usuario: Usuario | null,
  tags: TagPersonalizado[]
): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: armarHtml(registros, usuario, tags) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Mood' });
  }
}
