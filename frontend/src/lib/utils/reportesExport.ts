import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToPDF } from './exportPDF';
import { exportToExcel } from './exportExcel';
import { formatFechaEs, formatFechasExport, fechaDdMmAaaa, nombreMesAnio } from './formatters';
import type { ReporteAsistenciaClase, ReportePaseListaTutor, SesionPaseLista } from '@/lib/types';

// ── CLASE ────────────────────────────────────────────────────────────────────

interface EstadisticasReporte {
  totalRegistros?: number;
  presentes?: number;
  ausentes?: number;
  porcentajeAsistencia?: string | number;
  totalClasesInscritas?: number;
  totalClasesAsignadas?: number;
  totalDiasConRegistroGlobal?: number;
  diasConAsistenciaRegistrada?: number;
  totalAusencias?: number;
  totalBeneficiariosAusentes?: number;
  beneficiariosPresentes?: number;
  beneficiariosAusentes?: number;
}

interface RegistroItem {
  beneficiario: { nombre: string; codigo: string };
  registros: { estado?: string; fecha: string }[];
}

interface ClaseData {
  clase?: { nombre: string; tutor?: string; horarios?: string; totalBeneficiarios?: number };
  estadisticas?: EstadisticasReporte;
  asistenciasPorBeneficiario?: RegistroItem[];
  asistenciasPorClase?: Array<{
    clase?: { nombre: string; tutor?: string; codigo?: string; totalBeneficiarios?: number };
    estadisticas?: EstadisticasReporte;
    asistenciasPorBeneficiario?: RegistroItem[];
    registros?: { estado?: string; fecha: string }[];
  }>;
  resumen?: { totalClases?: number; [key: string]: unknown };
  estadisticasGlobales?: { beneficiariosPresentes?: number; beneficiariosAusentes?: number; [key: string]: unknown };
  beneficiario?: { nombre?: string; codigo?: string; edad?: number };
  registros?: {
    beneficiario?: { nombre?: string; codigo?: string; telefono?: string; padre_tutor?: string; direccion?: string };
    clase?: { nombre?: string };
    tutor?: { nombre?: string };
    fechas?: string[];
  }[];
}

const CENTRO = 'DR0436 - Centro de Desarrollo Infantil Caminando Con Jesús';
const LOGO_URL = '/logo-modelo-extendido.png';
// Medidas en puntos sobre A4, tomadas de la lista impresa del sistema anterior.
const MARGEN = 28.35;
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const cargarImagen = async (url: string) => {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ESTILO_TABLA = {
  theme: 'grid' as const,
  margin: { left: MARGEN, right: MARGEN, top: MARGEN, bottom: 50 },
  tableWidth: 'wrap' as const,
  styles: {
    font: 'helvetica',
    fontSize: 11,
    textColor: 0,
    lineColor: 0,
    lineWidth: 0.57,
    cellPadding: { top: 1.6, bottom: 1.6, left: 2.83, right: 2.83 },
    minCellHeight: 14.17,
    valign: 'top' as const,
  },
  headStyles: {
    fillColor: [204, 204, 255] as [number, number, number],
    fontStyle: 'bold' as const,
    fontSize: 12,
    halign: 'center' as const,
    minCellHeight: 19.84,
    cellPadding: 1,
  },
};

export const diaSemana = (fecha: string) => DIAS_SEMANA[new Date(`${fecha.slice(0, 10)}T00:00:00Z`).getUTCDay()];
const nombreArchivo = (texto: string) => texto.replace(/\s+/g, '_');

const textoConEtiqueta = (doc: jsPDF, etiqueta: string, valor: string, x: number, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(etiqueta, x, y);
  const xValor = x + doc.getTextWidth(etiqueta) + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(valor, xValor, y + 1.11);
};

// Logo, centro, dos datos en la segunda línea, periodo a la derecha y título.
const dibujarEncabezado = async (
  doc: jsPDF,
  opciones: {
    titulo: string;
    periodo: string;
    izquierda: [string, string];
    derecha: [string, string];
    extra?: [string, string];
  },
) => {
  const ancho = doc.internal.pageSize.getWidth();
  try {
    doc.addImage(await cargarImagen(LOGO_URL), 'PNG', MARGEN, MARGEN, 85.04, 40.93);
  } catch {
    // Sin logo el reporte sigue siendo válido.
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(CENTRO, 116.22, 46.42);
  textoConEtiqueta(doc, ...opciones.izquierda, 116.22, 65.97);
  textoConEtiqueta(doc, ...opciones.derecha, 371.34, 65.97);
  if (opciones.extra) textoConEtiqueta(doc, ...opciones.extra, 116.22, 80.14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(opciones.periodo, ancho - MARGEN, 81.04, { align: 'right' });
  doc.setFontSize(20);
  doc.text(opciones.titulo, ancho / 2, 110.88, { align: 'center' });
};

// La fuente base del PDF no incluye "✓", así que la marca se dibuja.
const dibujarMarca = (doc: jsPDF, cell: { x: number; y: number; width: number; height: number }) => {
  const cx = cell.x + cell.width / 2;
  const cy = cell.y + cell.height / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(1.2);
  doc.lines([[2.4, 2.8], [5, -6]], cx - 3.6, cy + 0.2, [1, 1], 'S', false);
  doc.setLineWidth(0.57);
};

const dibujarTotales = (doc: jsPDF, totales: [string, number][]) => {
  const y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  let x = MARGEN;
  totales.forEach(([etiqueta, valor]) => {
    textoConEtiqueta(doc, `${etiqueta}:`, String(valor), x, y);
    x += 150;
  });
};

const dibujarPiePagina = (doc: jsPDF) => {
  const ahora = new Date();
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  const hora = ahora.getHours() % 12 || 12;
  const impreso = `Impreso el ${dosDigitos(ahora.getDate())}/${dosDigitos(ahora.getMonth() + 1)}/${ahora.getFullYear()} a las ${dosDigitos(hora)}:${dosDigitos(ahora.getMinutes())}:${dosDigitos(ahora.getSeconds())}${ahora.getHours() < 12 ? 'am' : 'pm'}`;
  const total = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(`Pagina ${pagina}/${total}`, 273.62, 801.77);
    doc.text(impreso, 420.9, 801.77);
  }
};

// Tabla Fecha | Día | [Tipo] | <columnaActividad> | <columnaMarca>: marca si la fila
// está marcada, o su nota (p. ej. "Incompleta (5/20)") si la tiene.
const dibujarTablaFechas = (
  doc: jsPDF,
  columnas: { actividad: string; marca: string; conTipo?: boolean },
  filas: FilaFechaReporte[],
) => {
  const conTipo = !!columnas.conTipo;
  const iMarca = conTipo ? 4 : 3;
  autoTable(doc, {
    ...ESTILO_TABLA,
    startY: 127.56,
    head: [['Fecha', 'Día', ...(conTipo ? ['Tipo'] : []), columnas.actividad, columnas.marca]],
    body: filas.map((f) => [
      fechaDdMmAaaa(f.fecha),
      diaSemana(f.fecha),
      ...(conTipo ? [f.tipo || ''] : []),
      f.actividad,
      f.marcada ? '' : f.nota || '',
    ]),
    columnStyles: conTipo
      ? {
          0: { cellWidth: 62, halign: 'center' },
          1: { cellWidth: 62 },
          2: { cellWidth: 85 },
          3: { cellWidth: 160 },
          4: { cellWidth: 100, halign: 'center' },
        }
      : {
          0: { cellWidth: 70, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 172.91 },
          3: { cellWidth: 70, halign: 'center' },
        },
    didDrawCell: (hook) => {
      if (hook.section === 'body' && hook.column.index === iMarca && filas[hook.row.index].marcada)
        dibujarMarca(doc, hook.cell);
    },
  });
};

export const generarPDFClase = async (data: ReporteAsistenciaClase) => {
  const { clase, periodo, fechas, beneficiarios } = data;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  await dibujarEncabezado(doc, {
    titulo: 'Lista de Asistencia',
    periodo: nombreMesAnio(periodo.fechaInicio),
    izquierda: ['Seccion:', `${clase.nombre}.  ${clase.horarios}`],
    derecha: ['Tutor:', clase.tutor || 'Sin tutor'],
  });

  const presentes = beneficiarios.map((b) => new Set(b.presentes));
  const columnasFecha = Object.fromEntries(
    fechas.map((_, i) => [i + 2, { cellWidth: 19.84, halign: 'center' as const }]),
  );

  autoTable(doc, {
    ...ESTILO_TABLA,
    startY: 127.56,
    head: [['Numero', 'Beneficiario', ...fechas.map((f) => f.slice(8, 10))]],
    body: beneficiarios.map((b) => [b.codigo, b.nombre, ...fechas.map(() => '')]),
    columnStyles: {
      0: { cellWidth: 48.19, halign: 'center' },
      1: { cellWidth: 172.91 },
      ...columnasFecha,
    },
    didDrawCell: (hook) => {
      const fecha = fechas[hook.column.index - 2];
      if (hook.section === 'body' && fecha && presentes[hook.row.index].has(fecha)) dibujarMarca(doc, hook.cell);
    },
  });

  dibujarPiePagina(doc);
  doc.save(`Lista_Asistencia_${nombreArchivo(clase.nombre)}_${periodo.fechaInicio.slice(0, 7)}.pdf`);
};

// ── BENEFICIARIO ─────────────────────────────────────────────────────────────

export interface FilaFechaReporte {
  fecha: string;
  actividad: string;
  tipo?: string;
  marcada: boolean;
  nota?: string;
}

const ordenarFilas = (filas: FilaFechaReporte[]) =>
  filas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.actividad.localeCompare(b.actividad, 'es'));

// Cada asistencia registrada, marcada si estuvo presente.
export const filasBeneficiario = (data: ClaseData): FilaFechaReporte[] =>
  ordenarFilas(
    (data.asistenciasPorClase || []).flatMap((item) =>
      (item.registros || []).map((r) => ({
        fecha: r.fecha.slice(0, 10),
        actividad: item.clase?.nombre || '',
        marcada: r.estado === 'presente',
      })),
    ),
  );

export const generarPDFBeneficiario = async (data: ClaseData, fechaReporte: string) => {
  const beneficiario = data.beneficiario;
  const filas = filasBeneficiario(data);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  await dibujarEncabezado(doc, {
    titulo: 'Asistencia del Beneficiario',
    periodo: fechaReporte,
    izquierda: ['Beneficiario:', beneficiario?.nombre || ''],
    derecha: ['Numero:', beneficiario?.codigo || '-'],
    extra: beneficiario?.edad ? ['Edad:', `${beneficiario.edad} años`] : undefined,
  });
  dibujarTablaFechas(doc, { actividad: 'Clase', marca: 'Presente' }, filas);
  dibujarTotales(doc, [
    ['Presentes', filas.filter((f) => f.marcada).length],
    ['Ausentes', filas.filter((f) => !f.marcada).length],
  ]);
  dibujarPiePagina(doc);
  doc.save(`Asistencia_${nombreArchivo(beneficiario?.nombre || 'Beneficiario')}.pdf`);
};

export const generarExcelBeneficiario = (data: ClaseData) => {
  const asistencias = (data.asistenciasPorClase || []).map((item) => ({
    Clase: item.clase?.nombre || '',
    'Código Clase': item.clase?.codigo || '-',
    Presentes: formatFechasExport(item.registros || [], 'presente'),
    'Ausentes (Faltas)': formatFechasExport(item.registros || [], 'ausente'),
  }));
  const estadisticas = [
    { Métrica: 'Clases Inscritas', Valor: data.estadisticas?.totalClasesInscritas || 0 },
    { Métrica: 'Total Registros', Valor: data.estadisticas?.totalRegistros || 0 },
    { Métrica: 'Presentes', Valor: data.estadisticas?.presentes || 0 },
    { Métrica: 'Ausentes', Valor: data.estadisticas?.ausentes || 0 },
    { Métrica: '% Asistencia', Valor: data.estadisticas?.porcentajeAsistencia || '0%' },
  ];
  exportToExcel({
    nombreArchivo: `Reporte_Beneficiario_${data.beneficiario?.nombre || 'unknown'}`,
    hojas: [
      {
        nombre: 'Información',
        datos: [
          { Campo: 'Nombre', Valor: data.beneficiario?.nombre || '' },
          { Campo: 'Código', Valor: data.beneficiario?.codigo || '' },
        ],
      },
      { nombre: 'Asistencias', datos: asistencias },
      { nombre: 'Estadísticas', datos: estadisticas },
    ],
  });
};

// ── TUTOR ────────────────────────────────────────────────────────────────────

const TIPOS_ACTIVIDAD: Record<SesionPaseLista['tipo'], string> = {
  clase: 'Clase',
  club: 'Club',
  supervivencia: 'Supervivencia',
};

// Cada sesión programada de clases, clubs y Supervivencia hasta hoy: marcada si
// pasó lista completa; las incompletas y las de hoy llevan una nota.
export const filasTutor = (data: ReportePaseListaTutor): FilaFechaReporte[] =>
  ordenarFilas(
    data.sesiones
      .filter((s) => s.estado !== 'programada')
      .map((s) => ({
        fecha: s.fecha,
        actividad: s.actividad,
        tipo: TIPOS_ACTIVIDAD[s.tipo],
        marcada: s.estado === 'registrada',
        nota:
          s.estado === 'parcial'
            ? `Incompleta (${s.registrados}/${s.inscritos})`
            : s.estado === 'pendiente_hoy'
              ? 'Pendiente hoy'
              : undefined,
      })),
  );

export const totalesTutor = (filas: FilaFechaReporte[]): [string, number][] => [
  ['Con lista', filas.filter((f) => f.marcada).length],
  ['Incompletas', filas.filter((f) => f.nota?.startsWith('Incompleta')).length],
  ['Sin lista', filas.filter((f) => !f.marcada && !f.nota).length],
];

export const actividadesTutor = (data: ReportePaseListaTutor) =>
  new Set(data.sesiones.map((s) => `${s.tipo}-${s.actividadId}`)).size;

export const generarPDFTutor = async (data: ReportePaseListaTutor, fechaReporte: string) => {
  const filas = filasTutor(data);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  await dibujarEncabezado(doc, {
    titulo: 'Control de Pase de Lista',
    periodo: fechaReporte,
    izquierda: ['Tutor:', data.tutor.nombre],
    derecha: ['Actividades:', String(actividadesTutor(data))],
  });
  dibujarTablaFechas(doc, { actividad: 'Actividad', marca: 'Pasó lista', conTipo: true }, filas);
  dibujarTotales(doc, totalesTutor(filas));
  dibujarPiePagina(doc);
  doc.save(`Pase_Lista_${nombreArchivo(data.tutor.nombre)}.pdf`);
};

export const generarExcelTutor = (data: ReportePaseListaTutor) => {
  exportToExcel({
    nombreArchivo: `Pase_Lista_${nombreArchivo(data.tutor.nombre)}`,
    hojas: [
      {
        nombre: 'Pase de Lista',
        datos: filasTutor(data).map((f) => ({
          Fecha: fechaDdMmAaaa(f.fecha),
          Día: diaSemana(f.fecha),
          Tipo: f.tipo,
          Actividad: f.actividad,
          'Pasó lista': f.marcada ? '✓' : f.nota || '',
        })),
      },
    ],
  });
};

// ── AUSENCIAS ────────────────────────────────────────────────────────────────

export const generarPDFAusencias = (data: ClaseData, periodo: string, fechaReporte: string) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Reporte General de Ausencias', pageW / 2, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Período: ${periodo}`, pageW / 2, 23, { align: 'center' });
  doc.text(`Generado: ${fechaReporte}`, pageW / 2, 29, { align: 'center' });

  const tableData = (data.registros || []).map((item) => [
    `${item.beneficiario?.nombre || ''}\n${item.beneficiario?.codigo || '-'}`,
    item.beneficiario?.telefono || '-',
    item.beneficiario?.padre_tutor || '-',
    item.beneficiario?.direccion || '-',
    item.clase?.nombre || '',
    item.tutor?.nombre || '',
    String((item.fechas || []).length),
    (item.fechas || []).map((f: string) => formatFechaEs(f)).join('\n') || '-',
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Beneficiario / Código', 'Teléfono', 'Padre / Tutor', 'Dirección', 'Clase', 'Tutor', 'Faltas', 'Fechas de Ausencia']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 28 },
      2: { cellWidth: 35 },
      3: { cellWidth: 50 },
      4: { cellWidth: 22 },
      5: { cellWidth: 28 },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 52 },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Total Ausencias: ${data.estadisticas?.totalAusencias || 0}   |   Alumnos con Faltas: ${data.estadisticas?.totalBeneficiariosAusentes || 0}`,
    14,
    finalY
  );

  doc.save(`Reporte_Ausencias_${new Date().getTime()}.pdf`);
};

export const generarExcelAusencias = (data: ClaseData, periodo: string) => {
  const registros = (data.registros || []).map((item) => ({
    Beneficiario: item.beneficiario?.nombre || '',
    Código: item.beneficiario?.codigo || '-',
    Teléfono: item.beneficiario?.telefono || '-',
    'Padre / Tutor': item.beneficiario?.padre_tutor || '-',
    Dirección: item.beneficiario?.direccion || '-',
    Clase: item.clase?.nombre || '',
    Tutor: item.tutor?.nombre || '',
    'Total Faltas': (item.fechas || []).length,
    'Fechas de Ausencia': (item.fechas || []).map((f: string) => formatFechaEs(f)).join(', ') || '-',
  }));
  const estadisticas = [
    { Métrica: 'Período', Valor: periodo },
    { Métrica: 'Total Ausencias', Valor: data.estadisticas?.totalAusencias || 0 },
    { Métrica: 'Alumnos Distintos con Faltas', Valor: data.estadisticas?.totalBeneficiariosAusentes || 0 },
  ];
  exportToExcel({
    nombreArchivo: 'Reporte_General_Ausencias',
    hojas: [
      { nombre: 'Ausencias', datos: registros },
      { nombre: 'Resumen', datos: estadisticas },
    ],
  });
};

// ── GLOBAL ───────────────────────────────────────────────────────────────────

export const generarPDFGlobal = (data: ClaseData, periodo: string, fechaReporte: string, tipoGlobal: string) => {
  if (tipoGlobal === 'detallado') {
    const registros = (data.asistenciasPorClase || []).flatMap((item) =>
      (item.asistenciasPorBeneficiario || []).map((ben) => ({
        clase: item.clase?.nombre || '',
        beneficiario: ben.beneficiario?.nombre || '',
        codigo: ben.beneficiario?.codigo || '',
        presentes: formatFechasExport(ben.registros, 'presente'),
        ausentes: formatFechasExport(ben.registros, 'ausente'),
      }))
    );
    exportToPDF({
      titulo: 'Reporte General de Asistencia - Detallado',
      subtitulo: `Período: ${periodo}`,
      fecha: fechaReporte,
      datos: registros,
      columnas: ['clase', 'beneficiario', 'codigo', 'presentes', 'ausentes'],
      headers: ['Clase', 'Beneficiario', 'Código', 'Presentes', 'Ausentes (Faltas)'],
      totales: [
        { label: 'Total Clases', value: data.resumen?.totalClases || 0 },
        { label: 'Asistieron', value: data.estadisticasGlobales?.beneficiariosPresentes || 0 },
        { label: 'No Asistieron', value: data.estadisticasGlobales?.beneficiariosAusentes || 0 },
      ],
    });
  } else {
    const resumenClases = (data.asistenciasPorClase || []).map((item) => ({
      clase: item.clase?.nombre || '',
      tutor: item.clase?.tutor || '',
      inscritos: item.clase?.totalBeneficiarios || 0,
      asistieron: item.estadisticas?.beneficiariosPresentes || 0,
      noAsistieron: item.estadisticas?.beneficiariosAusentes || 0,
      porcentaje: item.estadisticas?.porcentajeAsistencia || '0%',
    }));
    exportToPDF({
      titulo: 'Reporte General de Asistencia - Estadístico',
      subtitulo: `Período: ${periodo}`,
      fecha: fechaReporte,
      datos: resumenClases,
      columnas: ['clase', 'tutor', 'inscritos', 'asistieron', 'noAsistieron', 'porcentaje'],
      headers: ['Clase', 'Tutor', 'Inscritos', 'Asistieron', 'No Asistieron', '% Asist.'],
      totales: [
        { label: 'Total Clases', value: data.resumen?.totalClases || 0 },
        { label: 'Asistieron', value: data.estadisticasGlobales?.beneficiariosPresentes || 0 },
        { label: 'No Asistieron', value: data.estadisticasGlobales?.beneficiariosAusentes || 0 },
      ],
    });
  }
};

export const generarExcelGlobal = (data: ClaseData, periodo: string, tipoGlobal: string) => {
  const hojas: { nombre: string; datos: Record<string, unknown>[] }[] = [];
  hojas.push({
    nombre: 'Resumen',
    datos: [
      { Campo: 'Período', Valor: periodo },
      { Campo: 'Total Clases', Valor: data.resumen?.totalClases || 0 },
      { Campo: '% Asistencia Global', Valor: data.estadisticasGlobales?.porcentajeAsistencia || '0%' },
    ],
  });
  hojas.push({
    nombre: 'Por Clase',
    datos: (data.asistenciasPorClase || []).map((item) => ({
      Clase: item.clase?.nombre || '',
      Tutor: item.clase?.tutor || '',
      Asistieron: item.estadisticas?.beneficiariosPresentes || 0,
      '% Asistencia': item.estadisticas?.porcentajeAsistencia || '0%',
    })),
  });
  if (tipoGlobal === 'detallado') {
    const registrosDetallados = (data.asistenciasPorClase || []).flatMap((item) =>
      (item.asistenciasPorBeneficiario || []).map((ben) => ({
        Clase: item.clase?.nombre || '',
        Beneficiario: ben.beneficiario?.nombre || '',
        Código: ben.beneficiario?.codigo || '',
        Presentes: formatFechasExport(ben.registros, 'presente'),
        Ausentes: formatFechasExport(ben.registros, 'ausente'),
      }))
    );
    hojas.push({ nombre: 'Detalle', datos: registrosDetallados });
  }
  exportToExcel({ nombreArchivo: `Reporte_General_${tipoGlobal}`, hojas });
};
