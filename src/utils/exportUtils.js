import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const s = value.toString();
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function exportToCSV(filename, headers, rows) {
  try {
    const csv = [headers.join(',')].concat(rows.map(r => r.map(cell => escapeCSV(cell)).join(','))).join('\n');
    const path = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (!(await Sharing.isAvailableAsync())) {
      // fallback: return path
      return { ok: true, path };
    }
    await Sharing.shareAsync(path, { mimeType: 'text/csv' });
    return { ok: true, path };
  } catch (e) {
    console.error('exportToCSV error', e);
    return { ok: false, error: e };
  }
}

export async function exportToDoc(filename, title, sections) {
  // sections: [{ title: '...', html: '<table>...</table>' }, ...]
  try {
    const htmlParts = [];
    htmlParts.push('<!doctype html><html><head><meta charset="utf-8"><title>' + (title || '') + '</title></head><body>');
    htmlParts.push('<h1>' + (title || '') + '</h1>');
    sections.forEach(s => {
      htmlParts.push('<h2>' + (s.title || '') + '</h2>');
      htmlParts.push(s.html || '<p></p>');
    });
    htmlParts.push('</body></html>');
    const content = htmlParts.join('\n');
    const path = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
    if (!(await Sharing.isAvailableAsync())) {
      return { ok: true, path };
    }
    await Sharing.shareAsync(path, { mimeType: 'application/msword' });
    return { ok: true, path };
  } catch (e) {
    console.error('exportToDoc error', e);
    return { ok: false, error: e };
  }
}
