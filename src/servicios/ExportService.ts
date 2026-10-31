/**
 * ExportService — «servicio» en el diagrama de clases de la aplicación móvil.
 * Genera el historial completo en CSV o PDF dentro del dispositivo, sin pasar
 * por el servidor, y lo entrega al menú de compartir del sistema (CU-23). El
 * contenido lo arma InformeHistorial.
 */
import { format } from 'date-fns';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { RegistroDiario, TagPersonalizado, Usuario } from '@/dominio';
import { armarCsv, armarInformeHtml, TextosInforme } from './InformeHistorial';

/** "mood-historial-2026-10-31": se entiende qué es al recibirlo. */
const nombreArchivo = () => `mood-historial-${format(new Date(), 'yyyy-MM-dd')}`;

export async function exportarCSV(registros: RegistroDiario[], tags: TagPersonalizado[], textos: TextosInforme): Promise<void> {
  const archivo = new File(Paths.cache, `${nombreArchivo()}.csv`);
  archivo.create({ overwrite: true });
  archivo.write(armarCsv(registros, tags, textos));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(archivo.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'Mood' });
  }
}

export async function exportarPDF(
  registros: RegistroDiario[],
  usuario: Usuario | null,
  tags: TagPersonalizado[],
  textos: TextosInforme
): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: armarInformeHtml({ registros, usuario, tags, textos }) });
  // Print lo guarda con un nombre al azar: se copia con uno que diga qué es.
  const destino = new File(Paths.cache, `${nombreArchivo()}.pdf`);
  if (destino.exists) destino.delete();
  new File(uri).move(destino);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destino.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Mood' });
  }
}
