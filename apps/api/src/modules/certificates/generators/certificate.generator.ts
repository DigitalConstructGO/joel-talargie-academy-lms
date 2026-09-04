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

/** A4 landscape content column - shared by centered elements (842 x 595 pt) */
const CONTENT_X = 60;
const CONTENT_WIDTH = 722;

/** Draws a crisp vector star */
function drawStar(
  document: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  document.save();
  document.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    document.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    document.lineTo(x, y);
    rot += step;
  }
  document.lineTo(cx, cy - outerRadius);
  document.closePath();
  document.fill(fillColor);
  document.restore();
}

function safeWinAnsiText(value: string): string {
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

export async function generateCertificatePdf(
  rawInput: CertificateDocumentInput,
): Promise<Buffer> {
  const input: CertificateDocumentInput = {
    ...rawInput,
    academyName:
      safeWinAnsiText(rawInput.academyName) || 'Joel Talargie Academy',
    title: safeWinAnsiText(rawInput.title) || 'Certificate of Completion',
    studentName:
      safeWinAnsiText(rawInput.studentName) ||
      rawInput.studentName ||
      'Student',
    courseTitle:
      safeWinAnsiText(rawInput.courseTitle) || rawInput.courseTitle || 'Course',
    certificateNumber:
      safeWinAnsiText(rawInput.certificateNumber) ||
      rawInput.certificateNumber ||
      'JTA-CERT',
    verificationUrl:
      rawInput.verificationUrl || 'https://joel-academy.com/verify',
    footerText: rawInput.footerText
      ? safeWinAnsiText(rawInput.footerText) || rawInput.footerText
      : 'Issued by Joel Talargie Academy',
  };

  let qrCode: Buffer;
  try {
    const targetUrl =
      input.verificationUrl && input.verificationUrl.trim().length > 0
        ? input.verificationUrl
        : 'https://joel-academy.com/verify';
    qrCode = await QRCode.toBuffer(targetUrl, {
      type: 'png',
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch {
    qrCode = await QRCode.toBuffer('https://joel-academy.com/verify', {
      type: 'png',
      width: 240,
      margin: 1,
    });
  }

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      autoFirstPage: true,
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('error', reject);
    document.on('end', () => resolve(Buffer.concat(chunks)));

    const primary = input.primaryColor ?? '#1F4700'; // Deep prestige forest green
    const gold = '#C5A059'; // Metallic gold accent
    const lightGreen = input.accentColor ?? '#529E1B';
    const darkInk = '#0F172A';
    const mutedInk = '#64748B';
    const cardBg = '#F8FAF6';
    const borderGold = '#DFC68E';

    // 1. Soft Warm Canvas Background
    document.rect(0, 0, 842, 595).fill('#FCFCF9');

    // 2. Inner White Canvas with subtle border
    document.rect(14, 14, 814, 567).fill('#FFFFFF');

    // 3. Double Luxury Border
    document.rect(18, 18, 806, 559).lineWidth(3).stroke(primary);
    document.rect(26, 26, 790, 543).lineWidth(1).stroke(gold);
    document.rect(30, 30, 782, 535).lineWidth(0.5).stroke(borderGold);

    // 4. Elegant 4-Corner Geometric Ornaments
    function drawCorner(x: number, y: number, angle: number) {
      document.save();
      document.translate(x, y);
      document.rotate(angle);
      // Outer diamond
      document
        .polygon([0, -10], [10, 0], [0, 10], [-10, 0])
        .lineWidth(1.5)
        .stroke(gold);
      document.polygon([0, -5], [5, 0], [0, 5], [-5, 0]).fill(primary);
      // Corner corner ticks
      document.moveTo(14, 0).lineTo(22, 0).lineWidth(1).stroke(gold);
      document.moveTo(0, 14).lineTo(0, 22).lineWidth(1).stroke(gold);
      document.restore();
    }
    drawCorner(28, 28, 0);
    drawCorner(814, 28, 90);
    drawCorner(814, 567, 180);
    drawCorner(28, 567, 270);

    // 5. Top Brand Crest & Academy Name
    drawStar(document, 401, 50, 5, 4.5, 2.2, gold);
    drawStar(document, 421, 48, 5, 6.5, 3.2, gold);
    drawStar(document, 441, 50, 5, 4.5, 2.2, gold);

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(input.academyName.toUpperCase(), CONTENT_X, 64, {
        align: 'center',
        width: CONTENT_WIDTH,
        characterSpacing: 3,
      });

    // Decorative Header Divider with center diamond
    const dividerY = 88;
    const dividerWidth = 140;
    const dividerLeft = (842 - dividerWidth) / 2;
    document
      .moveTo(dividerLeft, dividerY)
      .lineTo(dividerLeft + 55, dividerY)
      .lineWidth(1)
      .stroke(gold);
    document
      .moveTo(dividerLeft + 85, dividerY)
      .lineTo(dividerLeft + dividerWidth, dividerY)
      .lineWidth(1)
      .stroke(gold);
    document
      .polygon(
        [421, dividerY - 4],
        [425, dividerY],
        [421, dividerY + 4],
        [417, dividerY],
      )
      .fill(gold);

    // 6. Certificate Title
    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(input.title.toUpperCase(), CONTENT_X, 100, {
        align: 'center',
        width: CONTENT_WIDTH,
        characterSpacing: 1.5,
      });

    // 7. Presentation Subtitle
    document
      .fillColor(mutedInk)
      .font('Helvetica-Oblique')
      .fontSize(12)
      .text('THIS IS PROUDLY PRESENTED TO', CONTENT_X, 142, {
        align: 'center',
        width: CONTENT_WIDTH,
        characterSpacing: 1.5,
      });

    // 8. Student Recipient Name
    document
      .fillColor(darkInk)
      .font('Helvetica-Bold')
      .fontSize(32)
      .text(input.studentName, CONTENT_X, 166, {
        align: 'center',
        width: CONTENT_WIDTH,
        height: 40,
        ellipsis: true,
      });

    // Underline beneath student name with center gold emblem
    const nameUnderlineY = 212;
    const nameLineWidth = 360;
    const nameLineLeft = (842 - nameLineWidth) / 2;
    document
      .moveTo(nameLineLeft, nameUnderlineY)
      .lineTo(nameLineLeft + 160, nameUnderlineY)
      .lineWidth(1.5)
      .stroke(gold);
    document
      .moveTo(nameLineLeft + 200, nameUnderlineY)
      .lineTo(nameLineLeft + nameLineWidth, nameUnderlineY)
      .lineWidth(1.5)
      .stroke(gold);
    document
      .polygon(
        [421, nameUnderlineY - 5],
        [427, nameUnderlineY],
        [421, nameUnderlineY + 5],
        [415, nameUnderlineY],
      )
      .fill(primary);

    // 9. Completion Text
    document
      .fillColor(mutedInk)
      .font('Helvetica')
      .fontSize(11.5)
      .text(
        'for successfully completing all curriculum requirements and demonstrating mastery in',
        CONTENT_X,
        226,
        {
          align: 'center',
          width: CONTENT_WIDTH,
        },
      );

    // 10. Course Title Card Banner
    const courseCardY = 250;
    const courseCardWidth = 620;
    const courseCardHeight = 52;
    const courseCardX = (842 - courseCardWidth) / 2;

    document
      .roundedRect(
        courseCardX,
        courseCardY,
        courseCardWidth,
        courseCardHeight,
        6,
      )
      .fill(cardBg);
    document
      .roundedRect(
        courseCardX,
        courseCardY,
        courseCardWidth,
        courseCardHeight,
        6,
      )
      .lineWidth(1)
      .stroke(borderGold);

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(19)
      .text(input.courseTitle, courseCardX + 16, courseCardY + 14, {
        align: 'center',
        width: courseCardWidth - 32,
        height: 30,
        ellipsis: true,
      });

    // 11. Thin separator line
    document
      .moveTo(CONTENT_X + 20, 322)
      .lineTo(CONTENT_X + CONTENT_WIDTH - 20, 322)
      .lineWidth(0.5)
      .stroke('#E2E8F0');

    // 12. Executive 3-Column Footer Grid (Left: Official Seal & Date | Center: Signature | Right: QR Code Security)

    // Left Column: Official Gold & Green Seal Badge
    const sealX = 110;
    const sealY = 390;
    document.circle(sealX, sealY, 34).lineWidth(2).stroke(gold);
    document.circle(sealX, sealY, 30).lineWidth(1).stroke(primary);
    document.circle(sealX, sealY, 26).fillAndStroke('#FBF8EE', borderGold);
    document.circle(sealX, sealY, 18).fill(primary);
    drawStar(document, sealX, sealY, 5, 8, 3.8, '#FFFFFF');

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('OFFICIAL CREDENTIAL', sealX - 60, sealY + 40, {
        width: 120,
        align: 'center',
      });

    document
      .fillColor(mutedInk)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('ISSUE DATE', sealX - 60, sealY + 54, {
        width: 120,
        align: 'center',
      });

    document
      .fillColor(darkInk)
      .font('Helvetica')
      .fontSize(11)
      .text(
        input.completionDate.toISOString().slice(0, 10),
        sealX - 60,
        sealY + 66,
        {
          width: 120,
          align: 'center',
        },
      );

    // Center Column: Authorized Signature
    const sigX = 320;
    const sigWidth = 200;

    // Stylized signature curve
    document
      .moveTo(sigX + 35, 405)
      .bezierCurveTo(sigX + 60, 375, sigX + 90, 425, sigX + 120, 385)
      .bezierCurveTo(sigX + 140, 370, sigX + 155, 410, sigX + 175, 395)
      .lineWidth(1.8)
      .stroke(primary);

    document
      .fillColor(primary)
      .font('Helvetica-Oblique')
      .fontSize(13)
      .text(input.academyName, sigX, 420, {
        align: 'center',
        width: sigWidth,
      });

    document
      .moveTo(sigX + 15, 438)
      .lineTo(sigX + sigWidth - 15, 438)
      .lineWidth(1)
      .stroke(gold);

    document
      .fillColor(darkInk)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text('AUTHORIZED SIGNATURE', sigX, 444, {
        align: 'center',
        width: sigWidth,
      });

    document
      .fillColor(mutedInk)
      .font('Helvetica')
      .fontSize(8)
      .text('Academic Governing Board', sigX, 456, {
        align: 'center',
        width: sigWidth,
      });

    // Right Column: QR Security Card
    const qrCardX = 615;
    const qrCardY = 345;
    const qrCardWidth = 148;
    const qrCardHeight = 160;

    document
      .roundedRect(qrCardX, qrCardY, qrCardWidth, qrCardHeight, 6)
      .fill(cardBg);
    document
      .roundedRect(qrCardX, qrCardY, qrCardWidth, qrCardHeight, 6)
      .lineWidth(1)
      .stroke(borderGold);

    document.image(qrCode, qrCardX + 24, qrCardY + 12, {
      width: 100,
      height: 100,
    });

    document
      .fillColor(primary)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('SCAN TO VERIFY', qrCardX, qrCardY + 116, {
        align: 'center',
        width: qrCardWidth,
      });

    document
      .fillColor(mutedInk)
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text('ID: ' + input.certificateNumber, qrCardX + 4, qrCardY + 128, {
        align: 'center',
        width: qrCardWidth - 8,
        ellipsis: true,
      });

    document
      .fillColor(lightGreen)
      .font('Helvetica')
      .fontSize(6.5)
      .text(
        input.verificationUrl.replace(/^https?:\/\//, ''),
        qrCardX + 4,
        qrCardY + 140,
        {
          align: 'center',
          width: qrCardWidth - 8,
          ellipsis: true,
        },
      );

    // 13. Bottom Micro-Security Footer
    document
      .fillColor(mutedInk)
      .font('Helvetica')
      .fontSize(8)
      .text(
        input.footerText ??
          `Official digital certificate issued by ${input.academyName} • Tamper-evident credential verification enabled`,
        CONTENT_X,
        542,
        {
          align: 'center',
          width: CONTENT_WIDTH,
        },
      );

    document.end();
  });
}
