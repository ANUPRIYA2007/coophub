/**
 * COOP HUB — Analytics & BI Export Engine
 * Generates CSV, Excel (.xlsx), PDF reports, PNG chart images, and Clipboard TSV copies.
 */

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for MS Excel compatibility
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k].toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);

  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
  xml += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
  xml += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
  xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="COOP_HUB_Analytics"><Table>';

  // Header Row
  xml += '<Row>';
  keys.forEach(k => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(k)}</Data></Cell>`;
  });
  xml += '</Row>';

  // Data Rows
  rows.forEach(row => {
    xml += '<Row>';
    keys.forEach(k => {
      const val = row[k] === null || row[k] === undefined ? '' : row[k].toString();
      const isNum = !isNaN(val) && val.trim() !== '';
      const type = isNum ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xml`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(rows) {
  if (!rows || !rows.length) return Promise.reject('No data');
  const keys = Object.keys(rows[0]);
  const header = keys.join('\t');
  const body = rows.map(r => keys.map(k => r[k] ?? '').join('\t')).join('\n');
  const text = `${header}\n${body}`;

  return navigator.clipboard.writeText(text);
}

export function exportToPDF(title, elementId) {
  const printWindow = window.open('', '_blank');
  const el = document.getElementById(elementId);
  if (!el || !printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeXml(title)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; }
          h1 { font-size: 20px; color: #ff7900; margin-bottom: 5px; }
          .timestamp { font-size: 11px; color: #64748b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f8fafc; font-weight: 700; color: #334155; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .summary-card { border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background: #f8fafc; }
          .summary-card label { font-size: 10px; color: #64748b; font-weight: 600; }
          .summary-card val { font-size: 16px; font-weight: 800; display: block; color: #0f172a; }
        </style>
      </head>
      <body>
        <h1>🇮🇳 COOP HUB — ${escapeXml(title)}</h1>
        <div class="timestamp">Generated on ${new Date().toLocaleString()} • National Government BI Audit Trail</div>
        <div>${el.innerHTML}</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportChartAsPNG(svgElementId, filename) {
  const svgEl = document.getElementById(svgElementId);
  if (!svgEl) return;

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svgEl.clientWidth || 800;
    canvas.height = svgEl.clientHeight || 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function escapeXml(str) {
  return str
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
