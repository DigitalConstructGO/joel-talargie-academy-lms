import { createDatabaseClient } from '@joel-academy/database';
import PDFDocument from 'pdfkit';

function safeText(value: string): string {
  return [...String(value ?? '')]
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

async function testPdf() {
  try {
    const db = createDatabaseClient({ url: 'sqlite.db' });
    const rows = await db.execute(require('@joel-academy/database').sql`SELECT * FROM users LIMIT 10`);
    console.log('Sample rows count:', rows.length);

    const doc = new PDFDocument({ size: 'A4', margin: 42, autoFirstPage: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => console.log('PDF Generated successfully! Size:', Buffer.concat(chunks).length));
    doc.on('error', (err) => console.error('PDF Generation Error:', err));

    doc.font('Helvetica-Bold').fontSize(16).text('TEST REPORT', 42, 42);
    for (const r of rows) {
      doc.font('Helvetica').fontSize(8).text(safeText(JSON.stringify(r)));
    }
    doc.end();
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

testPdf();
