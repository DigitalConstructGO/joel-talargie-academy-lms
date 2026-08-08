import { PermissionsController } from '../controllers/permissions.controller';

describe('PermissionsController', () => {
  const permissions = { list: jest.fn() };
  const controller = new PermissionsController(permissions as never);

  it('lists the permission catalog filtered by search', () => {
    controller.list({ search: 'course' } as never);
    expect(permissions.list).toHaveBeenCalledWith('course');
  });
});
