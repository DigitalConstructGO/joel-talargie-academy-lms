import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface CertificateDocumentInput {
  academyName: string;
  title: string;
  studentName: string;
  courseTitle: string;
  completionDate: Date;
  certificateNumber: string;
  verificationUrl: string;
  primaryColor?: string;
  accentColor?: string;
  footerText?: string;
}

/** A4 landscape content column - shared by every centered block so the layout stays aligned. */
const CONTENT_X = 70;
const CONTENT_WIDTH = 702;

/** Draws a short horizontal rule centered within a column (defaults to the full content column). */
function centerRule(
  document: PDFKit.PDFDocument,
  y: number,
  width: number,
  color: string,
  options: { lineWidth?: number; columnX?: number; columnWidth?: number } = {},
) {
  const {
    lineWidth = 1,
    columnX = CONTENT_X,
    columnWidth = CONTENT_WIDTH,
  } = options;
  const x = columnX + (columnWidth - width) / 2;
  document
    .moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(lineWidth)
    .stroke(color);
}

export async function generateCertificatePdf(
  input: CertificateDocumentInput,
): Promise<Buffer> {
  const qrCode = await QRCode.toBuffer(input.verificationUrl, {
    type: 'png',
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      // Every element below is placed at an explicit x/y, not pdfkit's
      // auto-flowing cursor - a small margin just keeps pdfkit's own
      // page-break safety check (text near the bottom edge triggering an
      // unwanted second page) out of the way of the footer content.
      margin: 16,
      autoFirstPage: true,
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => resolve(Buffer.concat(chunks)));

    const primary = input.primaryColor ?? '#336B00';
    const accent = input.accentColor ?? '#69BE28';
    const ink = '#191C1E';
    const muted = '#6B7689';
    const hairline = '#DDE3EC';

    // Decorative double border - a premium, print-safe frame instead of a single flat rule.
    document.rect(18, 18, 806, 559).lineWidth(2.5).stroke(primary);
    document.rect(30, 30, 782, 535).lineWidth(1).stroke(accent);

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(input.academyName.toUpperCase(), CONTENT_X, 58, {
        align: 'center',
        width: CONTENT_WIDTH,
        characterSpacing: 1.5,
      });
    centerRule(document, 82, 90, accent, { lineWidth: 1.5 });

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(32)
      .text(input.title, CONTENT_X, 96, {
        align: 'center',
        width: CONTENT_WIDTH,
      });

    document
      .fillColor(muted)
      .font('Helvetica-Oblique')
      .fontSize(13)
      .text('This certificate is proudly presented to', CONTENT_X, 150, {
        align: 'center',
        width: CONTENT_WIDTH,
      });

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(30)
      .text(input.studentName, CONTENT_X + 25, 176, {
        align: 'center',
        width: CONTENT_WIDTH - 50,
        height: 42,
        ellipsis: true,
      });
    centerRule(document, 222, 260, accent);

    document
      .fillColor(muted)
      .font('Helvetica-Oblique')
      .fontSize(13)
      .text('for successfully completing', CONTENT_X, 238, {
        align: 'center',
        width: CONTENT_WIDTH,
      });

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(input.courseTitle, CONTENT_X + 40, 262, {
        align: 'center',
        width: CONTENT_WIDTH - 80,
        height: 56,
        ellipsis: true,
      });

    centerRule(document, 332, CONTENT_WIDTH, hairline);

    // Footer: completion details (left) / signature line (center) / QR verification block (right).
    document
      .fillColor(muted)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('COMPLETION DATE', CONTENT_X, 360, { width: 220 });
    document
      .fillColor(ink)
      .font('Helvetica')
      .fontSize(13)
      .text(input.completionDate.toISOString().slice(0, 10), CONTENT_X, 374, {
        width: 220,
      });

    document
      .fillColor(muted)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CERTIFICATE ID', CONTENT_X, 404, { width: 220 });
    document
      .fillColor(ink)
      .font('Helvetica')
      .fontSize(13)
      .text(input.certificateNumber, CONTENT_X, 418, { width: 220 });

    const signatureColumnX = 311;
    document
      .fillColor(primary)
      .font('Helvetica-Oblique')
      .fontSize(13)
      .text(input.academyName, signatureColumnX, 470, {
        align: 'center',
        width: 220,
      });
    centerRule(document, 490, 180, hairline, {
      columnX: signatureColumnX,
      columnWidth: 220,
    });
    document
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(9)
      .text('Authorized Signature', signatureColumnX, 496, {
        align: 'center',
        width: 220,
      });

    const qrBoxX = 636;
    const qrBoxWidth = 136;
    document.rect(qrBoxX, 350, qrBoxWidth, 158).lineWidth(1).stroke(accent);
    document.image(qrCode, qrBoxX + 18, 362, { width: 100, height: 100 });
    document
      .fillColor(muted)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('SCAN OR VISIT TO VERIFY', qrBoxX, 468, {
        align: 'center',
        width: qrBoxWidth,
      });
    document
      .fillColor(primary)
      .font('Helvetica')
      .fontSize(7.5)
      .text(
        input.verificationUrl.replace(/^https?:\/\//, ''),
        qrBoxX + 6,
        480,
        {
          align: 'center',
          width: qrBoxWidth - 12,
          height: 24,
          ellipsis: true,
        },
      );

    document
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(9)
      .text(
        input.footerText ?? `Issued by ${input.academyName}`,
        CONTENT_X,
        550,
        {
          align: 'center',
          width: CONTENT_WIDTH,
        },
      );

    document.end();
  });
}
