import { HealthController } from './health.controller';

describe('HealthController', () => {
  const health = {
    getHealth: jest.fn(),
    getDatabaseHealth: jest.fn(),
    getStorageHealth: jest.fn(),
    getLiveness: jest.fn(),
    getReadiness: jest.fn(),
  };
  const controller = new HealthController(health as never);

  beforeEach(() => jest.clearAllMocks());

  it('delegates every route to the matching HealthService method', () => {
    controller.getHealth();
    expect(health.getHealth).toHaveBeenCalled();
    controller.getDatabaseHealth();
    expect(health.getDatabaseHealth).toHaveBeenCalled();
    controller.getStorageHealth();
    expect(health.getStorageHealth).toHaveBeenCalled();
    controller.getLiveness();
    expect(health.getLiveness).toHaveBeenCalled();
    controller.getReadiness();
    expect(health.getReadiness).toHaveBeenCalled();
  });
});
