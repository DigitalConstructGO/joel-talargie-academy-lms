import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingField } from './setting-field';
import type { PlatformSetting } from '../types/settings.types';

function makeSetting(overrides: Partial<PlatformSetting>): PlatformSetting {
  return {
    key: 'academy.name',
    category: 'academy',
    type: 'STRING',
    defaultValue: '',
    permission: 'settings.update_academy',
    editable: true,
    restartRequired: false,
    description: 'Academy name',
    value: '',
    updatedAt: null,
    updatedBy: null,
    ...overrides,
  };
}

describe('SettingField', () => {
  it('renders a switch for a BOOLEAN setting', () => {
    render(
      <SettingField
        setting={makeSetting({ type: 'BOOLEAN', value: true })}
        value={true}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('renders a number input for an INTEGER setting', () => {
    render(
      <SettingField
        setting={makeSetting({ key: 'payment.receipt_max_size_mb', type: 'INTEGER', value: 12 })}
        value={12}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Academy name')).toHaveAttribute('type', 'number');
  });

  it('renders an email input for an EMAIL setting', () => {
    render(
      <SettingField
        setting={makeSetting({ key: 'academy.support_email', type: 'EMAIL', value: 'a@b.com' })}
        value="a@b.com"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Academy name')).toHaveAttribute('type', 'email');
  });

  it('disables the field when the setting is not editable', () => {
    render(
      <SettingField
        setting={makeSetting({ editable: false })}
        value="Joel Talargie Academy"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Academy name')).toBeDisabled();
  });
});
