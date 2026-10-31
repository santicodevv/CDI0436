/**
 * Utility functions for bond (bono) generation and printing.
 */

export function calcularFechaExpiracion(): string {
  const now = new Date();
  const exp = new Date(now);
  exp.setMonth(exp.getMonth() + 1);
  exp.setDate(exp.getDate() + 15);
  const d = exp.getDate().toString().padStart(2, '0');
  const m = (exp.getMonth() + 1).toString().padStart(2, '0');
  const y = exp.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatMonto(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return `RD$${num.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface PrintBonoRow {
  padre: string;
  cedula: string;
  beneficiario: string;
  codigo: string;
  monto: string;
}

export function imprimirBonos(rows: PrintBonoRow[], mes: string, expira: string): boolean {
  if (rows.length === 0) return false;

  const totalPagesCount = Math.ceil(rows.length / 2);
  const bondPages = Array.from({ length: totalPagesCount }, (_, pageIdx) => {
    const pageRows = rows.slice(pageIdx * 2, pageIdx * 2 + 2);
    return `
      <div class="print-page">
        ${pageRows.map((row) => `
          <div class="print-bond">
            <img src="${window.location.origin}/bond_template.png" alt="bono" />
            <span class="pf" style="top:35%;left:44.5%;font-size:13pt">${escapeHtml(mes)}</span>
            <span class="pf" style="top:46.3%;left:32%;font-size:11pt;max-width:27%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:inline-block">${escapeHtml(row.padre)}</span>
            <span class="pf" style="top:46.3%;left:76%;font-size:11pt;max-width:18%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:inline-block">${escapeHtml(row.cedula)}</span>
            <span class="pf" style="top:55.2%;left:37%;font-size:11pt;max-width:26%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:inline-block">${escapeHtml(row.beneficiario)}</span>
            <span class="pf" style="top:55.2%;left:76%;font-size:11pt">${escapeHtml(row.codigo)}</span>
            <span class="pf" style="top:64.5%;left:25%;font-size:13pt;color:#1a1a1a">${escapeHtml(formatMonto(row.monto))}</span>
            <span class="pf" style="top:80%;left:66%;font-size:11pt;color:red">${escapeHtml(expira)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bonos - ${escapeHtml(mes)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; }
    .print-page {
      width: 7.9in;
      height: 10.4in;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      gap: 0.2in;
      padding: 0.3in;
      position: relative;
    }
    .print-page:last-child { page-break-after: auto; }
    .print-bond {
      width: 100%;
      flex: 0 0 auto;
      position: relative;
      overflow: hidden;
    }
    .print-bond img {
      width: 100%;
      display: block;
    }
    .pf {
      position: absolute;
      font-family: Arial, Helvetica, sans-serif;
      color: #1a1a1a;
      font-weight: 400;
      line-height: 1;
    }
    @page {
      size: letter portrait;
      margin: 0.3in;
    }
  </style>
</head>
<body>
  ${bondPages}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
