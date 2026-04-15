import type { HistoryItem } from '../types/analysis';

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildHistoryCsv(items: HistoryItem[]) {
  const header = [
    'id',
    'file_name',
    'file_type',
    'timestamp',
    'result',
    'confidence_percent',
  ];

  const rows = items.map((item) => [
    item.id,
    item.fileName,
    item.fileType,
    item.timestamp,
    item.result,
    item.confidence.toFixed(1),
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(','))
    .join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
