import { AdminSettingsController } from '../admin-settings.controller';

describe('AdminSettingsController', () => {
  const service = {
    list: jest.fn(),
    batch: jest.fn(),
    history: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };
  const controller = new AdminSettingsController(service as never);
  const user = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  function request(
    overrides: { permissions?: string[]; isAdministrator?: boolean } = {},
  ) {
    return { authorization: overrides } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('lists settings', () => {
    controller.list({} as never);
    expect(service.list).toHaveBeenCalledWith({});
  });

  it('batch-updates settings with the caller’s permissions and admin flag', () => {
    controller.batch(
      user,
      { items: [{ key: 'k', value: 1 }], reason: 'Config change' } as never,
      request({ permissions: ['settings.update'], isAdministrator: true }),
    );
    expect(service.batch).toHaveBeenCalledWith(
      'admin-1',
      [{ key: 'k', value: 1 }],
      'Config change',
      ['settings.update'],
      true,
    );
  });

  it('gets setting history and a single setting by key', () => {
    controller.history('payment.bank_name');
    expect(service.history).toHaveBeenCalledWith('payment.bank_name');
    controller.get('payment.bank_name');
    expect(service.get).toHaveBeenCalledWith('payment.bank_name');
  });

  it('updates one setting with the caller’s permissions and admin flag', () => {
    controller.update(
      user,
      'payment.bank_name',
      { value: 'New Bank', reason: 'Rebrand' } as never,
      request({ permissions: ['settings.update'], isAdministrator: false }),
    );
    expect(service.update).toHaveBeenCalledWith(
      'admin-1',
      'payment.bank_name',
      'New Bank',
      'Rebrand',
      ['settings.update'],
      false,
    );
  });

  it('defaults to an empty permission list and non-admin when the request has no authorization context', () => {
    controller.update(
      user,
      'k',
      { value: 'v', reason: 'r' } as never,
      {} as never,
    );
    expect(service.update).toHaveBeenCalledWith(
      'admin-1',
      'k',
      'v',
      'r',
      [],
      false,
    );
  });
});
