function escapeCsvValue(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T>(
  rows: T[],
  columns: { key: keyof T; label: string; format?: (row: T) => string | number | null }[],
) {
  const headerRow = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const bodyRows = rows.map((row) =>
    columns
      .map((column) =>
        escapeCsvValue(column.format ? column.format(row) : (row[column.key] as string | number)),
      )
      .join(","),
  );

  return [headerRow, ...bodyRows].join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
