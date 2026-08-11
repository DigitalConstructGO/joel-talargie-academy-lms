import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ReportPrivacyService } from '../services/report-privacy.service';
@Injectable()
export class CsvReportExporter {
  constructor(private readonly privacy: ReportPrivacyService) {}
  generate(rows: Record<string, unknown>[]) {
    const headers = Object.keys(rows[0] ?? {});
    const cell = (v: unknown) =>
      `"${this.privacy.spreadsheet(v).replace(/"/g, '""')}"`;
    return Buffer.from(
      '\ufeff' +
        [
          headers.map(cell).join(','),
          ...rows.map((r) => headers.map((h) => cell(r[h])).join(',')),
        ].join('\r\n'),
      'utf8',
    );
  }
}
@Injectable()
export class ExcelReportExporter {
  constructor(private readonly privacy: ReportPrivacyService) {}
  async generate(rows: Record<string, unknown>[], name = 'Report') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      name.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31) || 'Report',
    );
    const headers = Object.keys(rows[0] ?? {});
    sheet.addRow(headers);
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const row of rows)
      sheet.addRow(headers.map((h) => this.privacy.spreadsheet(row[h])));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
@Injectable()
export class PdfReportExporter {
  private safeText(value: string): string {
    return [...value]
      .filter((character) => {
        const code = character.charCodeAt(0);
        return (
          code >= 32 ||
          character === '\n' ||
          character === '\r' ||
          character === '\t'
        );
      })
      .join('');
  }
  generate(rows: Record<string, unknown>[], title = 'Report'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        margin: 36,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('error', reject);
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.fontSize(16).text(title.replace(/[\r\n]/g, ' ').slice(0, 120));
      document
        .moveDown(0.5)
        .fontSize(8)
        .fillColor('#444444')
        .text(`Generated ${new Date().toISOString()}`);
      const headers = Object.keys(rows[0] ?? {});
      for (const row of rows) {
        if (document.y > 750) document.addPage();
        document.moveDown(0.5).fillColor('#111111');
        for (const header of headers) {
          const value = row[header];
          const text =
            value == null
              ? ''
              : value instanceof Date
                ? value.toISOString()
                : String(value);
          document
            .font('Helvetica-Bold')
            .text(`${header}: `, { continued: true });
          document.font('Helvetica').text(this.safeText(text).slice(0, 2000));
        }
      }
      if (rows.length === 0)
        document
          .moveDown()
          .font('Helvetica')
          .text('No rows matched the selected filters.');
      document.end();
    });
  }
}
