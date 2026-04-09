/**
 * printer-core.js
 * ESC/POS builder + Windows raw print qua PowerShell.
 * Không cần native module, Python, hay Build Tools.
 */
import { execSync, spawnSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ────────────────────────────────────────
// ESC/POS Command Builder
// ────────────────────────────────────────

export class EscPos {
  constructor() { this.data = []; }

  raw(...bytes) { this.data.push(...bytes); return this; }
  init() { return this.raw(0x1B, 0x40); }

  text(str) {
    for (const ch of str) this.data.push(ch.charCodeAt(0) & 0xFF);
    return this;
  }
  println(str = '') { return this.text(str).raw(0x0A); }
  newLine(n = 1) { for (let i = 0; i < n; i++) this.raw(0x0A); return this; }

  align(a = 0) { return this.raw(0x1B, 0x61, a); }
  alignLeft() { return this.align(0); }
  alignCenter() { return this.align(1); }
  alignRight() { return this.align(2); }

  bold(on = true) { return this.raw(0x1B, 0x45, on ? 1 : 0); }
  size(w = 0, h = 0) { return this.raw(0x1D, 0x21, (w << 4) | h); }

  line(char = '-', len = 32) { return this.println(char.repeat(len)); }

  tableRow(cols) {
    const TOTAL = 32;
    let row = '';
    for (const col of cols) {
      const w = Math.round(col.width * TOTAL);
      let t = String(col.text).slice(0, w);
      if (col.align === 'right') t = t.padStart(w);
      else if (col.align === 'center') { const p = Math.floor((w - t.length) / 2); t = ' '.repeat(p) + t + ' '.repeat(w - t.length - p); }
      else t = t.padEnd(w);
      row += t;
    }
    return this.println(row);
  }

  cut() { return this.raw(0x1D, 0x56, 0x41, 0x00); }
  build() { return Buffer.from(this.data); }
}

// ────────────────────────────────────────
// PowerShell helper — UTF-8 output
// ────────────────────────────────────────

function runPS(script) {
  // Thêm UTF-8 encoding ở đầu mỗi script
  const fullScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
${script}
`.trim();

  const result = spawnSync('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-Command', fullScript,
  ], {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });

  if (result.error) throw new Error('PowerShell error: ' + result.error.message);
  return (result.stdout || '').trim();
}

// ────────────────────────────────────────
// List printers
// ────────────────────────────────────────

export function listPrinters() {
  try {
    const out = runPS('Get-Printer | Select-Object Name,PrinterStatus | ConvertTo-Json -Compress');
    if (!out) return [];
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error('[listPrinters] Error:', err.message);
    return [];
  }
}

// ────────────────────────────────────────
// Send raw ESC/POS bytes to printer
// ────────────────────────────────────────

export function printRaw(printerName, buffer) {
  const tmpBin = join(tmpdir(), `escpos_${Date.now()}.bin`);
  const tmpName = join(tmpdir(), `printer_name_${Date.now()}.txt`);

  try {
    // Ghi file bin
    writeFileSync(tmpBin, buffer);
    // Ghi tên máy in ra file txt (UTF-8) để tránh encoding issue trong command line
    writeFileSync(tmpName, printerName, 'utf8');

    const ps = `
$printerName = [IO.File]::ReadAllText("${tmpName.replace(/\\/g, '\\\\')}", [System.Text.Encoding]::UTF8).Trim()
$fileName    = "${tmpBin.replace(/\\/g, '\\\\')}"

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
  [DllImport("winspool.Drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
  [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterW", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern int StartDocPrinter(IntPtr h, int lvl, ref DOCINFO di);
  [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr h);
  [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr h);
  [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr h, IntPtr p, int cnt, out int written);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct DOCINFO {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }
  public static string Send(string printer, string file) {
    IntPtr hPrinter;
    if (!OpenPrinter(printer, out hPrinter, IntPtr.Zero))
      return "ERR_OPEN:" + Marshal.GetLastWin32Error();
    DOCINFO di = new DOCINFO { pDocName="POS", pDataType="RAW" };
    StartDocPrinter(hPrinter, 1, ref di);
    StartPagePrinter(hPrinter);
    byte[] bytes = System.IO.File.ReadAllBytes(file);
    IntPtr pb = Marshal.AllocCoTaskMem(bytes.Length);
    Marshal.Copy(bytes, 0, pb, bytes.Length);
    int written;
    bool ok = WritePrinter(hPrinter, pb, bytes.Length, out written);
    Marshal.FreeCoTaskMem(pb);
    EndPagePrinter(hPrinter);
    EndDocPrinter(hPrinter);
    ClosePrinter(hPrinter);
    if (!ok) return "ERR_WRITE:" + Marshal.GetLastWin32Error();
    return "OK:" + written;
  }
}
"@

$result = [RawPrint]::Send($printerName, $fileName)
Write-Output $result
`;

    const out = runPS(ps);
    console.log('[printRaw] Printer:', printerName, '| Result:', out);

    if (out.startsWith('OK:')) return { success: true };

    // Parse error code
    if (out.startsWith('ERR_OPEN:')) {
      const code = out.split(':')[1];
      const msg = code === '1801' ? 'Khong tim thay may in "' + printerName + '" (err 1801)'
        : code === '5' ? 'Khong co quyen truy cap may in (err 5)'
          : 'Khong mo duoc may in (err ' + code + ')';
      return { success: false, error: msg };
    }
    if (out.startsWith('ERR_WRITE:')) {
      return { success: false, error: 'Loi ghi du lieu vao may in (err ' + out.split(':')[1] + ')' };
    }

    return { success: false, error: 'Phan hoi khong xac dinh: ' + out };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    if (existsSync(tmpBin)) try { unlinkSync(tmpBin); } catch { }
    if (existsSync(tmpName)) try { unlinkSync(tmpName); } catch { }
  }
}
