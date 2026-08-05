import { AdminReportExportsController } from '../controllers/admin-report-exports.controller';

describe('AdminReportExportsController', () => {
  const service = {
    create: jest.fn(),
    list: jest.fn(),
    detail: jest.fn(),
    download: jest.fn(),
    retry: jest.fn(),
    cancel: jest.fn(),
  };
  const controller = new AdminReportExportsController(service as never);
  const user = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  function request(permissions: string[] = []) {
    return { authorization: { permissions } } as never;
  }

  beforeEach(() => jest.clearAllMocks());

  it('queues an export with the caller’s permission set', () => {
    controller.create(
      user,
      { format: 'CSV' } as never,
      request(['reports.export']),
    );
    expect(service.create).toHaveBeenCalledWith('admin-1', { format: 'CSV' }, [
      'reports.export',
    ]);
  });

  it('scopes list/detail/download/retry/cancel to "view all" only when the caller holds that permission', () => {
    controller.list(user, {} as never, request(['reports.view_all_exports']));
    expect(service.list).toHaveBeenCalledWith('admin-1', {}, true);

    controller.list(user, {} as never, request([]));
    expect(service.list).toHaveBeenCalledWith('admin-1', {}, false);

    controller.detail(user, 'export-1', request(['reports.view_all_exports']));
    expect(service.detail).toHaveBeenCalledWith('admin-1', 'export-1', true);

    controller.download(user, 'export-1', request([]));
    expect(service.download).toHaveBeenCalledWith('admin-1', 'export-1', false);

    controller.retry(
      user,
      'export-1',
      { reason: 'Retry' } as never,
      request(['reports.view_all_exports']),
    );
    expect(service.retry).toHaveBeenCalledWith(
      'admin-1',
      'export-1',
      'Retry',
      true,
    );

    controller.cancel(
      user,
      'export-1',
      { reason: 'Stale' } as never,
      request([]),
    );
    expect(service.cancel).toHaveBeenCalledWith(
      'admin-1',
      'export-1',
      'Stale',
      false,
    );
  });

  it('defaults to an empty permission list and false "view all" when the request has no authorization context', () => {
    controller.create(user, {} as never, {} as never);
    expect(service.create).toHaveBeenCalledWith('admin-1', {}, []);
    controller.list(user, {} as never, {} as never);
    expect(service.list).toHaveBeenCalledWith('admin-1', {}, false);
  });
});
