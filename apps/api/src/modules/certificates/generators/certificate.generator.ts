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

export async function generateCertificatePdf(
  input: CertificateDocumentInput,
): Promise<Buffer> {
  const qrCode = await QRCode.toBuffer(input.verificationUrl, {
    type: 'png',
    width: 180,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      autoFirstPage: true,
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => resolve(Buffer.concat(chunks)));
    const primary = input.primaryColor ?? '#15324A';
    const accent = input.accentColor ?? '#C9A227';
    document.rect(18, 18, 806, 559).lineWidth(3).stroke(primary);
    document.rect(28, 28, 786, 539).lineWidth(1).stroke(accent);
    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(input.academyName, 70, 65, { align: 'center', width: 700 });
    document
      .fillColor(accent)
      .fontSize(34)
      .text(input.title, 70, 125, { align: 'center', width: 700 });
    document
      .fillColor('#333333')
      .font('Helvetica')
      .fontSize(16)
      .text('This certifies that', 70, 200, { align: 'center', width: 700 });
    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(30)
      .text(input.studentName, 95, 235, {
        align: 'center',
        width: 650,
        height: 45,
        ellipsis: true,
      });
    document
      .fillColor('#333333')
      .font('Helvetica')
      .fontSize(16)
      .text('has successfully completed', 70, 295, {
        align: 'center',
        width: 700,
      });
    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text(input.courseTitle, 110, 330, {
        align: 'center',
        width: 610,
        height: 58,
        ellipsis: true,
      });
    document
      .fillColor('#333333')
      .font('Helvetica')
      .fontSize(12)
      .text(
        `Completed ${input.completionDate.toISOString().slice(0, 10)}`,
        80,
        415,
        { width: 300 },
      );
    document.text(`Certificate ${input.certificateNumber}`, 80, 438, {
      width: 420,
    });
    document.image(qrCode, 660, 400, { width: 105, height: 105 });
    document
      .fontSize(8)
      .text('Scan to verify', 660, 510, { align: 'center', width: 105 });
    document
      .fillColor('#555555')
      .fontSize(9)
      .text(input.footerText ?? 'Issued by Joel Talargie Academy', 70, 535, {
        align: 'center',
        width: 700,
      });
    document.end();
  });
}
