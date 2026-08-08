import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportTable } from './report-table';
import type { ReportResult } from '../types/report.types';

const RESULT: ReportResult = {
  summary: { totalRevenueUsd: '1249.50' },
  rows: [
    {
      studentEmail: 'ab***@example.com',
      courseTitle: 'Modern React Development',
      status: 'IN_PROGRESS',
    },
  ],
  meta: {
    page: 1,
    pageSize: 25,
    total: 1,
    filters: {},
    generatedAt: '2026-08-01T00:00:00.000Z',
    timezone: 'UTC',
  },
};

describe('ReportTable', () => {
  it('derives column headers from the report row keys and renders the summary strip', () => {
    render(
      <ReportTable
        result={RESULT}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        page={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Student Email')).toBeInTheDocument();
    expect(screen.getByText('Course Title')).toBeInTheDocument();
    expect(screen.getByText('ab***@example.com')).toBeInTheDocument();
    expect(screen.getByText('Modern React Development')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue Usd')).toBeInTheDocument();
    expect(screen.getByText('1249.50')).toBeInTheDocument();
  });

  it('shows the error state and lets the caller retry', async () => {
    const onRetry = vi.fn();
    render(
      <ReportTable
        result={undefined}
        isLoading={false}
        isError
        onRetry={onRetry}
        page={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Unable to load this report.')).toBeInTheDocument();
  });
});
