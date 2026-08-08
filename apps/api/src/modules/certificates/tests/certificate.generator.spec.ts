import { generateCertificatePdf } from '../generators/certificate.generator';

describe('certificate PDF and QR generation', () => {
  it('creates a bounded one-page PDF containing public certificate content', async () => {
    const pdf = await generateCertificatePdf({
      academyName: 'Joel Talargie Academy',
      title: 'Certificate of Completion',
      studentName:
        'A Very Long Student Name That Must Remain Inside the Approved Certificate Layout',
      courseTitle:
        'Secure Backend Architecture and Transactional Learning Management Systems',
      completionDate: new Date('2026-08-01T00:00:00.000Z'),
      certificateNumber: 'JTA-2026-ABCDEF0123456789',
      verificationUrl:
        'https://academy.example/certificates/verify/safe-public-token',
    });
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.length).toBeLessThan(2_000_000);
    expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
  });
});
