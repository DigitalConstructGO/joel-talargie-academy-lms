import {
  AdminEmailDeliveriesController,
  EmailTemplatesController,
  MyNotificationsController,
  NotificationHealthController,
} from '../controllers/notifications.controllers';

describe('MyNotificationsController', () => {
  const notifications = {
    listMine: jest.fn(),
    unread: jest.fn(),
    mine: jest.fn(),
    mark: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new MyNotificationsController(notifications as never);
  const user = { id: 'user-1', roles: ['STUDENT'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists notifications scoped to the caller', () => {
    controller.list(user, {} as never);
    expect(notifications.listMine).toHaveBeenCalledWith('user-1', {});
  });

  it('gets the unread count scoped to the caller', () => {
    controller.unread(user);
    expect(notifications.unread).toHaveBeenCalledWith('user-1');
  });

  it('gets one owned notification', () => {
    controller.detail(user, 'notification-1');
    expect(notifications.mine).toHaveBeenCalledWith('user-1', 'notification-1');
  });

  it('marks a single notification read', () => {
    controller.read(user, 'notification-1');
    expect(notifications.mark).toHaveBeenCalledWith('user-1', [
      'notification-1',
    ]);
  });

  it('marks several notifications read', () => {
    controller.readMany(user, { notificationIds: ['a', 'b'] } as never);
    expect(notifications.mark).toHaveBeenCalledWith('user-1', ['a', 'b']);
  });

  it('marks all notifications read (no id filter)', () => {
    controller.readAll(user);
    expect(notifications.mark).toHaveBeenCalledWith('user-1');
  });

  it('archives a notification scoped to the caller', () => {
    controller.archive(user, 'notification-1');
    expect(notifications.archive).toHaveBeenCalledWith(
      'user-1',
      'notification-1',
    );
  });
});

describe('AdminEmailDeliveriesController', () => {
  const notifications = {
    listDeliveries: jest.fn(),
    attempts: jest.fn(),
    delivery: jest.fn(),
    retry: jest.fn(),
    cancel: jest.fn(),
  };
  const controller = new AdminEmailDeliveriesController(notifications as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists deliveries', () => {
    controller.list({} as never);
    expect(notifications.listDeliveries).toHaveBeenCalledWith({});
  });

  it('lists delivery attempts', () => {
    controller.attempts('delivery-1');
    expect(notifications.attempts).toHaveBeenCalledWith('delivery-1');
  });

  it('gets delivery detail', () => {
    controller.detail('delivery-1');
    expect(notifications.delivery).toHaveBeenCalledWith('delivery-1');
  });

  it('retries a delivery with the acting admin and reason', () => {
    controller.retry(actor, 'delivery-1', {
      reason: 'SMTP outage resolved',
    } as never);
    expect(notifications.retry).toHaveBeenCalledWith(
      'admin-1',
      'delivery-1',
      'SMTP outage resolved',
    );
  });

  it('cancels a delivery with the acting admin and reason', () => {
    controller.cancel(actor, 'delivery-1', {
      reason: 'No longer relevant',
    } as never);
    expect(notifications.cancel).toHaveBeenCalledWith(
      'admin-1',
      'delivery-1',
      'No longer relevant',
    );
  });
});

describe('EmailTemplatesController', () => {
  const notifications = {
    templates: jest.fn(),
    template: jest.fn(),
    preview: jest.fn(),
  };
  const controller = new EmailTemplatesController(notifications as never);

  beforeEach(() => jest.clearAllMocks());

  it('lists templates', () => {
    controller.list();
    expect(notifications.templates).toHaveBeenCalled();
  });

  it('gets one template', () => {
    controller.detail('template-1');
    expect(notifications.template).toHaveBeenCalledWith('template-1');
  });

  it('previews a template with substituted variables', () => {
    controller.preview('template-1', { variables: { name: 'A' } } as never);
    expect(notifications.preview).toHaveBeenCalledWith('template-1', {
      name: 'A',
    });
  });
});

describe('NotificationHealthController', () => {
  it('reports worker health', () => {
    const notifications = { health: jest.fn() };
    const controller = new NotificationHealthController(notifications as never);
    controller.health();
    expect(notifications.health).toHaveBeenCalled();
  });
});
