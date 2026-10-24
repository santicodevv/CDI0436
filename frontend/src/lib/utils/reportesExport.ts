import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToPDF } from './exportPDF';
import { exportToExcel } from './exportExcel';
import { formatFechaEs, formatFechasExport, formatFechaCompletaEs } from './formatters';

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
  tutor?: { nombre?: string; especialidad?: string };
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
  clases?: Array<{
    clase: { nombre: string; codigo?: string };
    fechasRegistro?: string[];
    fechasSinRegistro?: string[];
    estadisticas?: { diasConAsistenciaRegistrada?: number };
  }>;
}

export const generarPDFClase = (data: ClaseData, fechaReporte: string) => {
  const asistencias = (data.asistenciasPorBeneficiario || []).map((item) => ({
    beneficiario: item.beneficiario.nombre,
    codigo: item.beneficiario.codigo,
    presentes: formatFechasExport(item.registros, 'presente'),
    ausentes: formatFechasExport(item.registros, 'ausente'),
  }));
  exportToPDF({
    titulo: `Reporte de Asistencia - ${data.clase?.nombre || ''}`,
    subtitulo: `${data.clase?.tutor || ''} | ${data.clase?.horarios || ''}`,
    fecha: fechaReporte,
    datos: asistencias,
    columnas: ['beneficiario', 'codigo', 'presentes', 'ausentes'],
    headers: ['Beneficiario', 'Código', 'Presentes', 'Ausentes (Faltas)'],
    totales: [
      { label: 'Total Registros', value: data.estadisticas?.totalRegistros || 0 },
      { label: 'Presentes', value: data.estadisticas?.presentes || 0 },
      { label: 'Ausentes', value: data.estadisticas?.ausentes || 0 },
      { label: '% Asistencia', value: data.estadisticas?.porcentajeAsistencia || '0%' },
    ],
  });
};

export const generarExcelClase = (data: ClaseData) => {
  const asistencias = (data.asistenciasPorBeneficiario || []).map((item) => ({
    Beneficiario: item.beneficiario.nombre,
    Código: item.beneficiario.codigo,
    Presentes: formatFechasExport(item.registros, 'presente'),
    'Ausentes (Faltas)': formatFechasExport(item.registros, 'ausente'),
  }));
  const estadisticas = [
    { Métrica: 'Total Registros', Valor: data.estadisticas?.totalRegistros || 0 },
    { Métrica: 'Presentes', Valor: data.estadisticas?.presentes || 0 },
    { Métrica: 'Ausentes', Valor: data.estadisticas?.ausentes || 0 },
    { Métrica: '% Asistencia', Valor: data.estadisticas?.porcentajeAsistencia || '0%' },
  ];
  exportToExcel({
    nombreArchivo: `Reporte_Clase_${data.clase?.nombre || 'unknown'}`,
    hojas: [
      { nombre: 'Asistencias', datos: asistencias },
      { nombre: 'Estadísticas', datos: estadisticas },
    ],
  });
};

// ── BENEFICIARIO ─────────────────────────────────────────────────────────────

export const generarPDFBeneficiario = (data: ClaseData, fechaReporte: string) => {
  const asistencias = (data.asistenciasPorClase || []).map((item) => ({
    clase: item.clase?.nombre || '',
    codigo: item.clase?.codigo || '-',
    presentes: formatFechasExport(item.registros || [], 'presente'),
    ausentes: formatFechasExport(item.registros || [], 'ausente'),
  }));
  exportToPDF({
    titulo: `Reporte de Asistencia - ${data.beneficiario?.nombre || ''}`,
    subtitulo: `Código: ${data.beneficiario?.codigo || '-'}${data.beneficiario?.edad ? ` | Edad: ${data.beneficiario.edad} años` : ''}`,
    fecha: fechaReporte,
    datos: asistencias,
    columnas: ['clase', 'codigo', 'presentes', 'ausentes'],
    headers: ['Clase', 'Código Clase', 'Presentes', 'Ausentes (Faltas)'],
    totales: [
      { label: 'Clases Inscritas', value: data.estadisticas?.totalClasesInscritas || 0 },
      { label: 'Total Registros', value: data.estadisticas?.totalRegistros || 0 },
      { label: 'Presentes', value: data.estadisticas?.presentes || 0 },
      { label: 'Ausentes', value: data.estadisticas?.ausentes || 0 },
      { label: '% Asistencia', value: data.estadisticas?.porcentajeAsistencia || '0%' },
    ],
  });
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

export const generarPDFTutor = (data: ClaseData, fechaReporte: string) => {
  const clases = (data.clases || []).map((item) => ({
    clase: item.clase.nombre,
    codigo: item.clase.codigo || '-',
    fechasSinRegistro: (item.fechasSinRegistro || []).map(formatFechaCompletaEs).join(', ') || 'Ninguna',
    fechasRegistro: (item.fechasRegistro || []).map(formatFechaCompletaEs).join(', ') || 'Ninguna',
    totalDias: item.estadisticas?.diasConAsistenciaRegistrada || 0,
  }));
  exportToPDF({
    titulo: `Reporte de Asistencia por Tutor - ${data.tutor?.nombre || ''}`,
    subtitulo: `Especialidad: ${data.tutor?.especialidad || 'No especificada'}`,
    fecha: fechaReporte,
    datos: clases,
    columnas: ['clase', 'codigo', 'totalDias', 'fechasSinRegistro', 'fechasRegistro'],
    headers: ['Clase', 'Código Clase', 'Días Pasó Lista', 'Fechas en que no pasó lista', 'Fechas en que sí pasó lista'],
    totales: [
      { label: 'Total Clases', value: data.estadisticas?.totalClasesAsignadas || 0 },
      { label: 'Días Únicos Registró', value: data.estadisticas?.totalDiasConRegistroGlobal || 0 },
    ],
  });
};

export const generarExcelTutor = (data: ClaseData) => {
  const clases = (data.clases || []).map((item) => ({
    Clase: item.clase.nombre,
    'Código Clase': item.clase.codigo || '-',
    'Días Pasó Lista': item.estadisticas?.diasConAsistenciaRegistrada || 0,
    'Fechas en que no pasó lista': (item.fechasSinRegistro || []).map(formatFechaCompletaEs).join(', ') || 'Ninguna',
    'Fechas en que sí pasó lista': (item.fechasRegistro || []).map(formatFechaCompletaEs).join(', ') || 'Ninguna',
  }));
  const estadisticas = [
    { Métrica: 'Total Clases', Valor: data.estadisticas?.totalClasesAsignadas || 0 },
    { Métrica: 'Días Únicos Registró', Valor: data.estadisticas?.totalDiasConRegistroGlobal || 0 },
  ];
  exportToExcel({
    nombreArchivo: `Reporte_Tutor_${data.tutor?.nombre || 'unknown'}`,
    hojas: [
      {
        nombre: 'Información',
        datos: [
          { Campo: 'Nombre', Valor: data.tutor?.nombre || '' },
          { Campo: 'Especialidad', Valor: data.tutor?.especialidad || 'N/A' },
        ],
      },
      { nombre: 'Clases y Asistencia', datos: clases },
      { nombre: 'Estadísticas', datos: estadisticas },
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
