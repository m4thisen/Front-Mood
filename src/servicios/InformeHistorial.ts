/**
 * Arma el historial para exportar (CU-23): el CSV, para abrir en una planilla,
 * y el informe en HTML que ExportService convierte a PDF, pensado para
 * compartir con un psicólogo/a. Todo se calcula en el teléfono, con los datos
 * de la base local; no pasa por el servidor ni por la IA.
 *
 * No depende de nada nativo: se puede probar y mirar fuera del teléfono.
 */
import { differenceInCalendarDays, format, getDay, parseISO } from 'date-fns';
import { Clima, Idioma, NIVELES_ANIMO, NivelAnimo, RegistroDiario, TagPersonalizado, Usuario, enlaceSpotify } from '@/dominio';
import { moodScale } from '@/tema/colors';
import { dateLocale, formatearFecha, unDecimal } from '@/utils/fecha';
import { rachaMaxima } from './CalculadoraProgreso';
import { animoSegunHabito, distribucion, FranjaHoraria, franjaHoraria, MINIMO_DIAS_HABITO, promedio } from './MotorEstadistico';

/** El idioma y los textos que ve la persona (salen de i18n). */
export interface TextosInforme {
  idioma: Idioma;
  /** Traduce una clave del diccionario ("report.summary"). */
  t: (clave: string) => string;
  animo: (nivel: NivelAnimo) => string;
  clima: (clima: Clima) => string;
  etiqueta: (clave: string) => string;
  franja: (franja: FranjaHoraria) => string;
}

const MAXIMO_HABITOS = 8;
/** Días sin registrar a partir de los cuales la línea del gráfico se corta. */
const HUECO_GRAFICO = 3;

const ordenar = (registros: RegistroDiario[]) => [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Un texto del diccionario con sus marcas completadas: tx(textos, 'report.dayCount', { n: 3 }). */
const tx = (textos: TextosInforme, clave: string, valores: Record<string, string | number> = {}) =>
  Object.entries(valores).reduce((texto, [marca, valor]) => texto.replaceAll(`{${marca}}`, String(valor)), textos.t(clave));

/** Los tags propios del día: los de sí/no por su nombre, los de texto con lo que escribió. */
function tagsDelDia(registro: RegistroDiario, tags: TagPersonalizado[]): string[] {
  return Object.entries(registro.valoresTags)
    .map(([id, valor]) => {
      const nombre = tags.find((t) => t.id === id)?.nombre;
      if (!nombre) return null;
      if (typeof valor === 'boolean') return valor ? nombre : null;
      return valor.trim() ? `${nombre}: ${valor.trim()}` : null;
    })
    .filter((v): v is string => v !== null);
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

const celdaCsv = (valor: string | number | null): string => {
  if (valor === null) return '';
  const texto = String(valor);
  return /[",\n\r;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

/**
 * Una fila por día, con los nombres que ve la persona (no las claves
 * internas). Empieza con la marca BOM para que Excel lea bien las tildes.
 */
export function armarCsv(registros: RegistroDiario[], tags: TagPersonalizado[], textos: TextosInforme): string {
  const encabezado = textos.t('report.csvHeader');
  const filas = ordenar(registros).map((r) =>
    [
      r.fecha,
      format(parseISO(r.fecha), 'EEEE', { locale: dateLocale(textos.idioma) }),
      r.nivelAnimo,
      textos.animo(r.nivelAnimo),
      r.destacado ? textos.t('report.yes') : textos.t('report.no'),
      r.horasSueno,
      r.minutosEjercicio,
      r.climas.map(textos.clima).join('; '),
      r.etiquetas.map(textos.etiqueta).join('; '),
      tagsDelDia(r, tags).join('; '),
      r.cancion?.titulo ?? null,
      r.cancion?.artista || null,
      r.cancion ? enlaceSpotify(r.cancion) : null,
      r.texto,
      format(new Date(r.horaCarga), 'HH:mm'),
    ]
      .map(celdaCsv)
      .join(',')
  );
  return '\uFEFF' + [encabezado, ...filas].join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Informe (HTML → PDF)
// ---------------------------------------------------------------------------

const html = (valor: string): string =>
  valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colorDe = (nivel: NivelAnimo) => moodScale[nivel - 1].color;

/** El ánimo día por día: puntos del color del nivel, unidos mientras no haya huecos largos. */
function grafico(registros: RegistroDiario[], textos: TextosInforme): string {
  const ancho = 700;
  const alto = 200;
  const izquierda = 74;
  const derecha = 12;
  const arriba = 12;
  const abajo = 28;
  const primero = registros[0]!.fecha;
  const ultimo = registros.at(-1)!.fecha;
  const total = Math.max(1, differenceInCalendarDays(parseISO(ultimo), parseISO(primero)));
  const x = (fecha: string) =>
    registros.length === 1
      ? izquierda + (ancho - izquierda - derecha) / 2
      : izquierda + (differenceInCalendarDays(parseISO(fecha), parseISO(primero)) / total) * (ancho - izquierda - derecha);
  const y = (nivel: number) => arriba + ((5 - nivel) / 4) * (alto - arriba - abajo);

  const guias = NIVELES_ANIMO.map(
    (n) =>
      `<line x1="${izquierda}" x2="${ancho - derecha}" y1="${y(n)}" y2="${y(n)}" stroke="#E6E9F0" stroke-width="1" />` +
      `<text x="${izquierda - 10}" y="${y(n) + 4}" text-anchor="end" font-size="11" fill="#5B6478">${html(textos.animo(n))}</text>`
  ).join('');

  const tramos: RegistroDiario[][] = [];
  registros.forEach((r, i) => {
    const anterior = registros[i - 1];
    if (!anterior || differenceInCalendarDays(parseISO(r.fecha), parseISO(anterior.fecha)) > HUECO_GRAFICO) tramos.push([]);
    tramos.at(-1)!.push(r);
  });
  const lineas = tramos
    .filter((t) => t.length > 1)
    .map((t) => `<polyline fill="none" stroke="#B8C0D0" stroke-width="1.5" points="${t.map((r) => `${x(r.fecha)},${y(r.nivelAnimo)}`).join(' ')}" />`)
    .join('');
  const puntos = registros
    .map((r) => `<circle cx="${x(r.fecha)}" cy="${y(r.nivelAnimo)}" r="4.5" fill="${colorDe(r.nivelAnimo)}" stroke="#FFFFFF" stroke-width="1.5" />`)
    .join('');
  const fechas =
    `<text x="${izquierda}" y="${alto - 6}" font-size="11" fill="#5B6478">${html(formatearFecha(primero, 'diaMes', textos.idioma))}</text>` +
    (registros.length > 1
      ? `<text x="${ancho - derecha}" y="${alto - 6}" text-anchor="end" font-size="11" fill="#5B6478">${html(formatearFecha(ultimo, 'diaMes', textos.idioma))}</text>`
      : '');

  return `<svg viewBox="0 0 ${ancho} ${alto}" width="100%" role="img" aria-label="${html(textos.t('report.chartLabel'))}">${guias}${lineas}${puntos}${fechas}</svg>`;
}

/** Un calendario por mes, de lunes a domingo, con cada día del color de su ánimo. */
function calendarios(registros: RegistroDiario[], textos: TextosInforme): string {
  const porFecha = new Map(registros.map((r) => [r.fecha, r]));
  const meses = [...new Set(registros.map((r) => r.fecha.slice(0, 7)))];
  return meses
    .map((mes) => {
      const [anio, numero] = mes.split('-').map(Number) as [number, number];
      const diasDelMes = new Date(anio, numero, 0).getDate();
      // Lunes primero: getDay da 0 para el domingo.
      const vacios = (getDay(new Date(anio, numero - 1, 1)) + 6) % 7;
      const celdas = [
        ...Array.from({ length: vacios }, () => '<td></td>'),
        ...Array.from({ length: diasDelMes }, (_, i) => {
          const registro = porFecha.get(`${mes}-${String(i + 1).padStart(2, '0')}`);
          const estilo = registro ? `background:${colorDe(registro.nivelAnimo)};color:#0B1120;font-weight:600` : 'background:#F1F3F7;color:#9AA2B4';
          return `<td><div class="dia" style="${estilo}">${i + 1}</div></td>`;
        }),
      ];
      const semanas: string[] = [];
      for (let i = 0; i < celdas.length; i += 7) semanas.push(`<tr>${celdas.slice(i, i + 7).join('')}</tr>`);
      const titulo = capitalizar(formatearFecha(new Date(anio, numero - 1, 1), 'mesAnio', textos.idioma));
      return `
        <div class="mes">
          <div class="titulo-mes">${html(titulo)}</div>
          <table class="calendario">
            <thead><tr>${textos.t('report.weekdays').split(',').map((d) => `<th>${html(d)}</th>`).join('')}</tr></thead>
            <tbody>${semanas.join('')}</tbody>
          </table>
        </div>`;
    })
    .join('');
}

function diaPorDia(registros: RegistroDiario[], tags: TagPersonalizado[], textos: TextosInforme): string {
  return registros
    .map((r) => {
      const datos = [
        r.horasSueno !== null ? tx(textos, 'report.sleep', { horas: unDecimal(r.horasSueno, textos.idioma).replace(/[.,]0$/, '') }) : null,
        r.minutosEjercicio !== null ? tx(textos, 'report.exercise', { minutos: r.minutosEjercicio }) : null,
        r.climas.length > 0 ? tx(textos, 'report.weather', { clima: r.climas.map(textos.clima).join(', ') }) : null,
      ].filter(Boolean);
      const marcado = [...r.etiquetas.map(textos.etiqueta), ...tagsDelDia(r, tags)];
      const cancion = r.cancion ? [r.cancion.titulo, r.cancion.artista].filter(Boolean).join(' — ') : null;
      return `
        <div class="registro">
          <div class="cabecera-dia">
            <span class="punto" style="background:${colorDe(r.nivelAnimo)}"></span>
            <strong>${html(capitalizar(formatearFecha(r.fecha, 'diaLargo', textos.idioma)))}</strong>
            <span class="animo">${html(textos.animo(r.nivelAnimo))}</span>
            ${r.destacado ? `<span class="destacado">${html(textos.t('report.highlighted'))}</span>` : ''}
          </div>
          ${datos.length > 0 ? `<div class="datos">${html(datos.join(' · '))}</div>` : ''}
          ${marcado.length > 0 ? `<div class="marcado">${html(marcado.join(', '))}</div>` : ''}
          ${cancion ? `<div class="datos">${html(tx(textos, 'report.song', { cancion }))}</div>` : ''}
          ${r.texto.trim() ? `<blockquote>${html(r.texto.trim()).replace(/\r?\n/g, '<br />')}</blockquote>` : ''}
        </div>`;
    })
    .join('');
}

export interface DatosInforme {
  registros: RegistroDiario[];
  usuario: Usuario | null;
  tags: TagPersonalizado[];
  textos: TextosInforme;
  /** Cuándo se exporta. */
  hoy?: Date;
}

/**
 * El informe para compartir con un profesional: quién y qué período, un
 * resumen, cómo se repartieron los días, el ánimo en el tiempo, los
 * calendarios, qué hábitos acompañan al ánimo (con la regla de RN-08) y cada
 * día con lo que se registró. Aclara que no es un diagnóstico.
 */
export function armarInformeHtml({ registros: sinOrdenar, usuario, tags, textos, hoy = new Date() }: DatosInforme): string {
  const registros = ordenar(sinOrdenar);
  const total = registros.length;
  const nombre = usuario?.nombre.trim() ?? '';
  const fechaLarga = (fecha: string) => formatearFecha(fecha, 'fechaLarga', textos.idioma);
  const titulo = nombre ? tx(textos, 'report.titleOf', { nombre }) : textos.t('report.title');
  const promedioAnimo = promedio(registros);
  const porNivel = distribucion(registros);
  const franja = franjaHoraria(registros);
  const habitos = animoSegunHabito(registros, MAXIMO_HABITOS);
  const periodo =
    total === 0
      ? ''
      : registros[0]!.fecha === registros.at(-1)!.fecha
        ? tx(textos, 'report.periodOne', { fecha: fechaLarga(registros[0]!.fecha) })
        : tx(textos, 'report.periodRange', { desde: fechaLarga(registros[0]!.fecha), hasta: fechaLarga(registros.at(-1)!.fecha) });

  const resumen = [
    { valor: String(total), etiqueta: textos.t(total === 1 ? 'report.dayLogged' : 'report.daysLogged') },
    {
      valor: promedioAnimo === null ? '—' : tx(textos, 'report.outOf5', { valor: unDecimal(promedioAnimo, textos.idioma) }),
      etiqueta:
        promedioAnimo === null
          ? textos.t('report.average')
          : tx(textos, 'report.averageWith', { animo: textos.animo(Math.round(promedioAnimo) as NivelAnimo).toLowerCase() }),
    },
    { valor: `${rachaMaxima(registros)}`, etiqueta: textos.t('report.longestStreak') },
    { valor: franja ? textos.franja(franja) : '—', etiqueta: textos.t('report.usualTime') },
  ]
    .map((t) => `<div class="tile"><div class="valor">${html(t.valor)}</div><div class="etiqueta">${html(t.etiqueta)}</div></div>`)
    .join('');

  const reparto = [...NIVELES_ANIMO]
    .reverse()
    .map((nivel) => {
      const cantidad = porNivel[nivel - 1]!;
      const porcentaje = total === 0 ? 0 : Math.round((cantidad / total) * 100);
      return `
        <tr>
          <td class="nivel"><span class="punto" style="background:${colorDe(nivel)}"></span>${html(textos.animo(nivel))}</td>
          <td class="pista"><div class="barra" style="width:${porcentaje}%;background:${colorDe(nivel)}"></div></td>
          <td class="cifra">${html(tx(textos, cantidad === 1 ? 'report.dayCountOne' : 'report.dayCount', { n: cantidad }))} · ${porcentaje}%</td>
        </tr>`;
    })
    .join('');

  const tablaHabitos =
    habitos.length === 0
      ? `<p class="nota">${html(tx(textos, 'report.habitsNone', { minimo: MINIMO_DIAS_HABITO }))}</p>`
      : `
        <table class="tabla">
          <thead><tr>${['report.habitColumn', 'report.daysColumn', 'report.moodThoseDays', 'report.vsAverage'].map((c) => `<th>${html(textos.t(c))}</th>`).join('')}</tr></thead>
          <tbody>${habitos
            .map(
              (h) => `
              <tr>
                <td>${html(textos.etiqueta(h.clave))}</td>
                <td>${h.dias}</td>
                <td>${html(tx(textos, 'report.outOf5', { valor: unDecimal(h.conHabito, textos.idioma) }))}</td>
                <td class="${h.variacion >= 0 ? 'sube' : 'baja'}">${h.variacion >= 0 ? '+' : '−'}${Math.round(Math.abs(h.variacion))}%</td>
              </tr>`
            )
            .join('')}</tbody>
        </table>
        <p class="nota">${html(tx(textos, 'report.habitsNote', { minimo: MINIMO_DIAS_HABITO }))}</p>`;

  return `<!doctype html>
<html lang="${textos.idioma}">
<head>
<meta charset="utf-8" />
<meta name="color-scheme" content="light" />
<title>Mood · ${html(titulo)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  /* Al imprimir, iOS saca los fondos si no se le pide: sin esto no salen las barras ni los colores del calendario. */
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* Siempre claro: se imprime, y el teléfono puede estar en modo oscuro. */
  html, body { background: #FFFFFF; color-scheme: light; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #0B1120; font-size: 12px; line-height: 1.45; margin: 0; }
  @media screen { body { max-width: 820px; margin: 0 auto; padding: 24px; } }
  .marca { color: #4D6BFE; font-weight: 700; letter-spacing: 0.08em; font-size: 11px; text-transform: uppercase; }
  h1 { font-size: 24px; margin: 4px 0 2px; }
  h2 { font-size: 15px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #E6E9F0; break-after: avoid; page-break-after: avoid; }
  /* Un título nunca queda solo al pie de la página, separado de lo suyo. */
  .seccion { break-inside: avoid; page-break-inside: avoid; }
  .periodo { color: #5B6478; margin: 0; }
  .aviso { margin-top: 14px; padding: 10px 12px; background: #F4F6FB; border-radius: 8px; color: #3A4256; }
  .tiles { display: flex; gap: 10px; margin-top: 4px; }
  .tile { flex: 1; padding: 10px 12px; border: 1px solid #E6E9F0; border-radius: 10px; }
  .tile .valor { font-size: 18px; font-weight: 700; }
  .tile .etiqueta { color: #5B6478; font-size: 11px; }
  .punto { display: inline-block; width: 10px; height: 10px; border-radius: 5px; margin-right: 6px; vertical-align: -1px; border: 1px solid rgba(11,17,32,0.12); }
  table { border-collapse: collapse; width: 100%; }
  .reparto td { padding: 4px 0; }
  .reparto .nivel { width: 110px; white-space: nowrap; }
  .reparto .pista { background: #F1F3F7; border-radius: 4px; height: 12px; padding: 0; }
  .reparto .barra { height: 12px; border-radius: 4px; }
  .reparto .cifra { width: 110px; text-align: right; color: #5B6478; padding-left: 10px; white-space: nowrap; }
  .meses { display: flex; flex-wrap: wrap; gap: 14px; }
  .mes { width: 31%; break-inside: avoid; }
  .titulo-mes { font-weight: 600; margin-bottom: 4px; }
  .calendario th { font-size: 9px; color: #9AA2B4; font-weight: 600; padding-bottom: 2px; }
  .calendario td { padding: 1.5px; }
  .calendario .dia { height: 20px; border-radius: 4px; font-size: 9px; text-align: center; line-height: 20px; }
  .tabla th { text-align: left; font-size: 11px; color: #5B6478; font-weight: 600; border-bottom: 1px solid #E6E9F0; padding: 6px 8px 6px 0; }
  .tabla td { border-bottom: 1px solid #F1F3F7; padding: 6px 8px 6px 0; }
  .sube { color: #1E8E4E; font-weight: 600; }
  .baja { color: #C2334A; font-weight: 600; }
  .nota { color: #5B6478; font-size: 11px; }
  .registro { padding: 10px 0; border-bottom: 1px solid #F1F3F7; break-inside: avoid; }
  .cabecera-dia { display: flex; align-items: center; gap: 4px; }
  .cabecera-dia .animo { color: #5B6478; margin-left: 6px; }
  .destacado { margin-left: 8px; font-size: 10px; color: #8A6D00; background: #FFF4C7; border-radius: 10px; padding: 1px 8px; }
  .datos, .marcado { color: #3A4256; margin-top: 3px; }
  .marcado { color: #0B1120; }
  blockquote { margin: 6px 0 0; padding: 6px 10px; border-left: 3px solid #D7DCE6; color: #0B1120; background: #FAFBFD; }
  .pie { margin-top: 24px; color: #9AA2B4; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <div class="marca">${html(textos.t('report.brand'))}</div>
  <h1>${html(titulo)}</h1>
  <p class="periodo">${html(periodo)}${periodo ? ' · ' : ''}${html(tx(textos, 'report.exportedOn', { fecha: fechaLarga(format(hoy, 'yyyy-MM-dd')) }))}</p>
  <div class="aviso">${html(textos.t('report.disclaimer'))}</div>

  ${
    total === 0
      ? `<p class="nota">${html(textos.t('report.empty'))}</p>`
      : `
  <div class="seccion"><h2>${html(textos.t('report.summary'))}</h2>
  <div class="tiles">${resumen}</div></div>

  <div class="seccion"><h2>${html(textos.t('report.distribution'))}</h2>
  <table class="reparto">${reparto}</table></div>

  <div class="seccion"><h2>${html(textos.t('report.overTime'))}</h2>
  ${grafico(registros, textos)}</div>

  <div class="seccion"><h2>${html(textos.t('report.calendar'))}</h2>
  <div class="meses">${calendarios(registros, textos)}</div></div>

  <div class="seccion"><h2>${html(textos.t('report.habits'))}</h2>
  ${tablaHabitos}</div>

  <h2>${html(textos.t('report.dayByDay'))}</h2>
  ${diaPorDia(registros, tags, textos)}`
  }

  <div class="pie">${html(textos.t('report.footer'))}</div>
</body>
</html>`;
}
