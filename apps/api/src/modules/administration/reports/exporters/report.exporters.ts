import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ReportPrivacyService } from '../services/report-privacy.service';

function safeIsoDate(value: unknown): string {
  try {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return '—';
      const iso = value.toISOString();
      return iso.startsWith('+') ? iso.slice(1, 11) : iso.slice(0, 10);
    }
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 100000000000 &&
      value < 3000000000000
    ) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const iso = d.toISOString();
        return iso.startsWith('+') ? iso.slice(1, 11) : iso.slice(0, 10);
      }
    }
  } catch {
    // Ignore invalid time value
  }
  return typeof value === 'string' ? value.slice(0, 30) : '—';
}

@Injectable()
export class CsvReportExporter {
  constructor(private readonly privacy: ReportPrivacyService) {}
  generate(rows: Record<string, unknown>[]) {
    const headers = Object.keys(rows[0] ?? {});
    const cell = (v: unknown) => {
      let val = v;
      if (
        v instanceof Date ||
        (typeof v === 'number' && v > 100000000000 && v < 3000000000000)
      ) {
        val = safeIsoDate(v);
      }
      return `"${this.privacy.spreadsheet(val).replace(/"/g, '""')}"`;
    };
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
    return [...(value ?? '')]
      .filter((character) => {
        const code = character.charCodeAt(0);
        return (
          (code >= 32 && code <= 255) ||
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
      try {
        const headers = Object.keys(rows[0] ?? {}).filter(
          (header) => header !== 'id',
        );
        const isLandscape = headers.length > 5;
        const document = new PDFDocument({
          size: 'A4',
          layout: isLandscape ? 'landscape' : 'portrait',
          margin: 42,
          autoFirstPage: true,
        });
        const chunks: Buffer[] = [];
        document.on('data', (chunk: Buffer) => chunks.push(chunk));
        document.on('error', reject);
        document.on('end', () => resolve(Buffer.concat(chunks)));

        const generatedAt = context.generatedAt ?? new Date();
        const reportTitle = this.safeText(
          title.replace(/[\r\n]/g, ' ').slice(0, 120),
        );
        const filters = Object.entries(context.filters ?? {}).filter(
          ([, value]) => value !== undefined && value !== null && value !== '',
        );

        const footerY = isLandscape ? 550 : 800;
        const pageHeight = isLandscape ? 595 : 842;
        const tableWidth = isLandscape ? 758 : 511;

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
            .text(reportTitle || 'REPORT', 42, 104);
          document
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#4B5563')
            .text(`Generated ${safeIsoDate(generatedAt)} UTC`, 42, 132);
        };

        const addFooter = (currentPage: number) => {
          document
            .font('Helvetica')
            .fontSize(7)
            .fillColor('#6B7280')
            .text(
              'Joel Talargie Academy  •  Confidential Report',
              42,
              footerY,
              {
                width: 330,
              },
            );
          document.text(
            `Page ${currentPage}`,
            document.page.width - 124,
            footerY,
            {
              width: 82,
              align: 'right',
            },
          );
        };

        let page = 1;
        addHeader();

        if (filters.length) {
          document
            .roundedRect(
              42,
              156,
              tableWidth,
              30 + Math.ceil(filters.length / 3) * 16,
              6,
            )
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
                this.safeText(`${key}: ${String(value)}`),
                54 + column * Math.floor(tableWidth / 3),
                182 + row * 16,
                { width: Math.floor(tableWidth / 3) - 15 },
              );
          });
          document.y = 156 + 30 + Math.ceil(filters.length / 3) * 16 + 18;
        } else {
          document.y = 166;
        }

        const monetary = rows.reduce((sum, row) => {
          const value = row.finalPrice ?? row.amount ?? row.revenue;
          const num = typeof value === 'number' ? value : Number(value ?? 0);
          return sum + (Number.isFinite(num) ? num : 0);
        }, 0);

        const kpis = [
          ['RECORDS', String(rows.length)],
          [
            'TOTAL VALUE',
            Number.isFinite(monetary) && monetary > 0
              ? monetary.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '—',
          ],
          ['REPORT', reportTitle || 'REPORT'],
        ];

        const kpiY = document.y;
        const kpiWidth = Math.floor((tableWidth - 32) / 3);
        kpis.forEach(([label, value], index) => {
          const x = 42 + index * (kpiWidth + 16);
          document
            .roundedRect(x, kpiY, kpiWidth, 53, 6)
            .fillAndStroke('#FFFFFF', '#D1D5DB');
          document
            .fillColor('#6B7280')
            .font('Helvetica-Bold')
            .fontSize(7)
            .text(this.safeText(label), x + 11, kpiY + 10);
          document
            .fillColor('#111827')
            .font('Helvetica-Bold')
            .fontSize(index === 2 ? 9 : 13)
            .text(this.safeText(value), x + 11, kpiY + 25, {
              width: kpiWidth - 22,
              ellipsis: true,
            });
        });

        document.y = kpiY + 72;
        document
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('Detailed records');

        const label = (header: string) =>
          header
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replaceAll('_', ' ')
            .toUpperCase();

        const widths = headers.map((header) => {
          const longest = Math.max(
            label(header).length,
            ...rows
              .slice(0, 100)
              .map((row) => String(row[header] ?? '').length),
          );
          return Math.max(50, Math.min(150, longest * 5.5));
        });

        const totalWidth = widths.reduce((sum, width) => sum + width, 0) || 1;
        const scale = totalWidth > tableWidth ? tableWidth / totalWidth : 1;
        const columnWidths = widths.map((width) => Math.max(36, width * scale));

        const drawTableHeader = () => {
          const y = document.y;
          document.rect(42, y, tableWidth, 20).fill(this.brand);
          let x = 48;
          headers.forEach((header, index) => {
            const colW = Math.max(25, columnWidths[index] - 8);
            document
              .fillColor('#FFFFFF')
              .font('Helvetica-Bold')
              .fontSize(6.5)
              .text(this.safeText(label(header)), x, y + 7, {
                width: colW,
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
            if (value == null) return '—';
            if (value instanceof Date) return safeIsoDate(value);
            if (typeof value === 'number') {
              if (value > 100000000000 && value < 3000000000000) {
                return safeIsoDate(value);
              }
              return String(value);
            }
            if (typeof value === 'string') {
              if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\+\d{5,}/.test(value)) {
                return safeIsoDate(value);
              }
              return this.safeText(value).replace(/\s+/g, ' ');
            }
            if (typeof value === 'object') return JSON.stringify(value);
            return this.safeText(String(value)).replace(/\s+/g, ' ');
          });

          const maxMeasuredHeight = Math.max(
            22,
            ...values.map((value, index) => {
              const colW = Math.max(25, columnWidths[index] - 8);
              try {
                const sample = value.length > 80 ? value.slice(0, 80) : value;
                return Math.min(
                  45,
                  document.heightOfString(sample, { width: colW }),
                );
              } catch {
                return 16;
              }
            }),
          );

          const rowHeight = maxMeasuredHeight + 8;

          if (document.y + rowHeight > pageHeight - 60) {
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
            const colW = Math.max(25, columnWidths[index] - 8);
            document
              .fillColor('#1F2937')
              .font('Helvetica')
              .fontSize(7)
              .text(value, x, y + 5, {
                width: colW,
                height: rowHeight - 8,
                ellipsis: true,
              });
            x += columnWidths[index];
          });
          document.y = y + rowHeight;
        }

        if (rows.length === 0) {
          document
            .moveDown()
            .font('Helvetica')
            .text('No rows matched the selected filters.');
        }

        addFooter(page);
        document.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
