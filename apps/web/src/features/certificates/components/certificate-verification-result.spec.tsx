import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CertificateVerificationResult } from './certificate-verification-result';

describe('CertificateVerificationResult', () => {
  it('renders VALID certificate result with all student and course details', () => {
    render(
      <CertificateVerificationResult
        result={{
          state: 'VALID',
          certificateNumber: 'JTA-2026-000123',
          studentName: 'Joel Talargie',
          courseTitle: 'Full-Stack Web Development',
          completionDate: '2026-08-15T00:00:00.000Z',
          issuedAt: '2026-08-15T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText(/Certificate Verified/i)).toBeInTheDocument();
    expect(screen.getByText('VALID')).toBeInTheDocument();
    expect(screen.getByText('Joel Talargie')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack Web Development')).toBeInTheDocument();
    expect(screen.getByText('JTA-2026-000123')).toBeInTheDocument();
    expect(screen.getByText('Joel Talargie Academy')).toBeInTheDocument();
    expect(screen.getByText(/Print Record/i)).toBeInTheDocument();
  });

  it('renders REVOKED certificate result with notice', () => {
    render(
      <CertificateVerificationResult
        result={{
          state: 'REVOKED',
          certificateNumber: 'JTA-2026-REVOKED',
          studentName: 'John Doe',
          courseTitle: 'DevOps Masterclass',
        }}
      />,
    );

    expect(screen.getByText(/Certificate Revoked/i)).toBeInTheDocument();
    expect(screen.getByText('REVOKED')).toBeInTheDocument();
    expect(screen.getByText('JTA-2026-REVOKED')).toBeInTheDocument();
  });

  it('renders INVALID certificate result when not found', () => {
    render(
      <CertificateVerificationResult
        result={{
          state: 'INVALID',
        }}
      />,
    );

    expect(screen.getByText(/Certificate Not Found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The certificate code you entered could not be verified/i),
    ).toBeInTheDocument();
  });
});
