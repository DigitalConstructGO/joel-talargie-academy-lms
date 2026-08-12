import { Injectable } from '@nestjs/common';
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
export class PdfReportExporter {
  private readonly brand = '#0F766E';

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
  generate(
    rows: Record<string, unknown>[],
    title = 'Report',
    context: { filters?: Record<string, unknown>; generatedAt?: Date } = {},
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        margin: 42,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('error', reject);
      document.on('end', () => resolve(Buffer.concat(chunks)));
      const generatedAt = context.generatedAt ?? new Date();
      const reportTitle = title.replace(/[\r\n]/g, ' ').slice(0, 120);
      const filters = Object.entries(context.filters ?? {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      );
      const addHeader = () => {
        document
          .fillColor(this.brand)
          .rect(0, 0, document.page.width, 82)
          .fill();
        document
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(16)
          .text('JOEL TALARGIE ACADEMY', 42, 25);
        document
          .font('Helvetica')
          .fontSize(8)
          .text('Official Academy Report', 42, 47);
        document
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .fontSize(19)
          .text(reportTitle, 42, 104);
        document
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#4B5563')
          .text(
            `Generated ${generatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC`,
            42,
            132,
          );
      };
      const addFooter = (page: number) => {
        document
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#6B7280')
          .text('Joel Talargie Academy  •  Confidential Report', 42, 800, {
            width: 330,
          });
        document.text(`Page ${page}`, 470, 800, { width: 82, align: 'right' });
      };
      let page = 1;
      addHeader();
      if (filters.length) {
        document
          .roundedRect(42, 156, 511, 30 + Math.ceil(filters.length / 3) * 16, 6)
          .fillAndStroke('#F0FDFA', '#99F6E4');
        document
          .fillColor('#115E59')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text('APPLIED FILTERS', 54, 166);
        filters.forEach(([key, value], index) => {
          const column = index % 3;
          const row = Math.floor(index / 3);
          document
            .fillColor('#374151')
            .font('Helvetica')
            .fontSize(7)
            .text(
              `${key}: ${String(value)}`,
              54 + column * 160,
              182 + row * 16,
              { width: 145 },
            );
        });
        document.y = 156 + 30 + Math.ceil(filters.length / 3) * 16 + 18;
      } else document.y = 166;
      const monetary = rows.reduce((sum, row) => {
        const value = row.finalPrice ?? row.amount ?? row.revenue;
        return sum + (typeof value === 'number' ? value : Number(value ?? 0));
      }, 0);
      const kpis = [
        ['RECORDS', String(rows.length)],
        [
          'TOTAL VALUE',
          Number.isFinite(monetary)
            ? monetary.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '—',
        ],
        ['REPORT', reportTitle],
      ];
      const kpiY = document.y;
      kpis.forEach(([label, value], index) => {
        const x = 42 + index * 171;
        document
          .roundedRect(x, kpiY, 159, 53, 6)
          .fillAndStroke('#FFFFFF', '#D1D5DB');
        document
          .fillColor('#6B7280')
          .font('Helvetica-Bold')
          .fontSize(7)
          .text(label, x + 11, kpiY + 10);
        document
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .fontSize(index === 2 ? 9 : 13)
          .text(value, x + 11, kpiY + 25, { width: 137, ellipsis: true });
      });
      document.y = kpiY + 72;
      document
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Detailed records');
      const headers = Object.keys(rows[0] ?? {}).filter(
        (header) => header !== 'id',
      );
      const label = (header: string) =>
        header
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replaceAll('_', ' ')
          .toUpperCase();
      const widths = headers.map((header) => {
        const longest = Math.max(
          label(header).length,
          ...rows.slice(0, 100).map((row) => String(row[header] ?? '').length),
        );
        return Math.max(54, Math.min(132, longest * 5.2));
      });
      const tableWidth = 511;
      const totalWidth = widths.reduce((sum, width) => sum + width, 0);
      const scale = totalWidth > tableWidth ? tableWidth / totalWidth : 1;
      const columnWidths = widths.map((width) => width * scale);
      const drawTableHeader = () => {
        const y = document.y;
        document.rect(42, y, tableWidth, 20).fill(this.brand);
        let x = 48;
        headers.forEach((header, index) => {
          document
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .fontSize(6.5)
            .text(label(header), x, y + 7, {
              width: columnWidths[index] - 8,
              height: 8,
              ellipsis: true,
            });
          x += columnWidths[index];
        });
        document.y = y + 24;
      };
      if (headers.length) drawTableHeader();
      for (const [rowIndex, row] of rows.entries()) {
        document.font('Helvetica').fontSize(7);
        const values = headers.map((header) => {
          const value = row[header];
          return this.safeText(
            value == null
              ? '—'
              : value instanceof Date
                ? value.toISOString().slice(0, 10)
                : String(value),
          ).replace(/\s+/g, ' ');
        });
        const rowHeight =
          Math.max(
            25,
            ...values.map((value, index) =>
              Math.min(
                48,
                document.heightOfString(value, {
                  width: columnWidths[index] - 8,
                }),
              ),
            ),
          ) + 10;
        if (document.y + rowHeight > 782) {
          addFooter(page++);
          document.addPage();
          addHeader();
          document.y = 160;
          document
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('Detailed records (continued)');
          document.y += 8;
          drawTableHeader();
        }
        const y = document.y;
        document
          .rect(42, y, tableWidth, rowHeight)
          .fillAndStroke(rowIndex % 2 ? '#F8FAFC' : '#FFFFFF', '#E5E7EB');
        let x = 48;
        values.forEach((value, index) => {
          document
            .fillColor('#1F2937')
            .font('Helvetica')
            .fontSize(7)
            .text(value, x, y + 6, {
              width: columnWidths[index] - 8,
              height: rowHeight - 10,
              ellipsis: true,
            });
          x += columnWidths[index];
        });
        document.y = y + rowHeight;
      }
      if (rows.length === 0)
        document
          .moveDown()
          .font('Helvetica')
          .text('No rows matched the selected filters.');
      addFooter(page);
      document.end();
    });
  }
}
