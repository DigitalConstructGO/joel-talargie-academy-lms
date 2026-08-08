import { ReportPrivacyService } from '../services/report-privacy.service';
import {
  CsvReportExporter,
  PdfReportExporter,
} from '../exporters/report.exporters';
describe('Phase 11 report security', () => {
  const privacy = new ReportPrivacyService();
  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A1)', '\tformula', '\rformula'])(
    'neutralizes spreadsheet input %s',
    (value) => expect(privacy.spreadsheet(value)).toBe(`'${value}`),
  );
  it('recursively redacts historical secrets', () =>
    expect(
      privacy.sanitize({
        nested: { accessToken: 'x', safe: 'ok' },
        passwordHash: 'x',
      }),
    ).toEqual({
      nested: { accessToken: '[REDACTED]', safe: 'ok' },
      passwordHash: '[REDACTED]',
    }));
  it('escapes CSV and preserves UTF-8', () => {
    const csv = new CsvReportExporter(privacy)
      .generate([{ name: 'ጆኤል, "Academy"', value: '=1+1' }])
      .toString('utf8');
    expect(csv).toContain('ጆኤል');
    expect(csv).toContain('""Academy""');
    expect(csv).toContain("'=1+1");
  });
  it('generates a valid PDF report', async () => {
    const pdf = await new PdfReportExporter().generate(
      [{ status: 'APPROVED', amount: '10.50' }],
      'Revenue',
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(500);
  });
});
