import { Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';

/**
 * Universal Excel Spreadsheet Generator & Exporter
 * Generates genuine Microsoft Excel compatible spreadsheets (.xls / .xlsx)
 * with full column formatting, styled headers, and gridlines.
 */
export const exportToExcel = async ({
  title = 'RVS_VASTRA_Laundry_Report',
  sheetName = 'Laundry Data',
  headers = [],
  rows = [],
  summaryInfo = [],
}) => {
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    const cleanTitle = title.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${cleanTitle}_${timestamp}.xls`;

    // 1. Build Excel HTML XML format with styled tables and gridlines
    let summaryRowsHtml = '';
    if (summaryInfo && summaryInfo.length > 0) {
      summaryRowsHtml = summaryInfo
        .map(
          (item) =>
            `<tr><td colspan="2" style="font-weight:bold;background-color:#EEF2FF;color:#4338CA;padding:6px;border:1px solid #CBD5E1;">${escapeHtml(
              item.label
            )}</td><td colspan="${Math.max(
              headers.length - 2,
              2
            )}" style="font-weight:bold;color:#0F172A;padding:6px;border:1px solid #CBD5E1;">${escapeHtml(
              item.value
            )}</td></tr>`
        )
        .join('');
      summaryRowsHtml += `<tr><td colspan="${headers.length}" style="height:12px;"></td></tr>`;
    }

    const headerRowHtml = headers
      .map(
        (h) =>
          `<th style="background-color:#4338CA;color:#FFFFFF;font-weight:bold;padding:10px;border:1px solid #312E81;text-align:left;font-size:12pt;">${escapeHtml(
            h
          )}</th>`
      )
      .join('');

    const bodyRowsHtml = rows
      .map((row, rIdx) => {
        const bg = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        const cells = row
          .map(
            (cell) =>
              `<td style="background-color:${bg};color:#1E293B;padding:8px;border:1px solid #E2E8F0;font-size:11pt;mso-number-format:'\\@';">${escapeHtml(
                String(cell ?? '')
              )}</td>`
          )
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>${escapeHtml(sheetName)}</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
</style>
</head>
<body>
  <table>
    ${summaryRowsHtml}
    <thead>
      <tr>${headerRowHtml}</tr>
    </thead>
    <tbody>
      ${bodyRowsHtml}
    </tbody>
  </table>
</body>
</html>`.trim();

    // 2. Export on Web
    if (Platform.OS === 'web') {
      const blob = new Blob(['\uFEFF' + excelHtml], {
        type: 'application/vnd.ms-excel;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, filename };
    }

    // 3. Export on Native Mobile (Android & iOS)
    let fileUri = null;

    // Try New Expo SDK 57 FileSystem API
    try {
      const FileSystemModule = require('expo-file-system');
      if (FileSystemModule.File && FileSystemModule.Paths) {
        const file = new FileSystemModule.File(FileSystemModule.Paths.cache, filename);
        if (file.exists) {
          file.delete();
        }
        file.create();
        file.write('\uFEFF' + excelHtml);
        fileUri = file.uri;
      }
    } catch (e1) {
      console.log('Next-gen FileSystem write not available, using legacy fallback:', e1);
    }

    // Try Legacy Expo FileSystem API if new API wasn't available
    if (!fileUri) {
      try {
        const FileSystemLegacy = require('expo-file-system/legacy');
        if (FileSystemLegacy && FileSystemLegacy.writeAsStringAsync) {
          const cacheDir = FileSystemLegacy.cacheDirectory || FileSystemLegacy.documentDirectory;
          fileUri = `${cacheDir}${filename}`;
          await FileSystemLegacy.writeAsStringAsync(fileUri, '\uFEFF' + excelHtml, {
            encoding: FileSystemLegacy.EncodingType.UTF8,
          });
        }
      } catch (e2) {
        console.log('Legacy FileSystem write failed:', e2);
      }
    }

    // Final fallback: try root expo-file-system writeAsStringAsync if present
    if (!fileUri) {
      try {
        const RootFS = require('expo-file-system');
        if (RootFS.writeAsStringAsync && RootFS.cacheDirectory) {
          fileUri = `${RootFS.cacheDirectory}${filename}`;
          await RootFS.writeAsStringAsync(fileUri, '\uFEFF' + excelHtml, {
            encoding: RootFS.EncodingType?.UTF8 || 'utf8',
          });
        }
      } catch (e3) {
        console.log('Root FS write failed:', e3);
      }
    }

    if (fileUri) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.ms-excel',
          dialogTitle: 'Open in Excel / Save Excel Sheet',
          UTI: 'com.microsoft.excel.xls',
        });
        return { success: true, filename, uri: fileUri };
      }
    }

    throw new Error('FileSystem or Sharing could not be initialized on this device.');
  } catch (error) {
    console.log('Excel export error:', error);
    Alert.alert(
      'Export Error',
      `Could not generate Excel spreadsheet: ${error.message || error}`
    );
    return { success: false, error };
  }
};

const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export default exportToExcel;
