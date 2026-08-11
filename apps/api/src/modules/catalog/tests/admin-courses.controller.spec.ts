import { AdminCoursesController } from '../controllers/admin-courses.controller';

describe('AdminCoursesController', () => {
  const catalog = {
    adminCourses: jest.fn(),
    createCourse: jest.fn(),
    adminCourse: jest.fn(),
    updateCourse: jest.fn(),
    pricing: jest.fn(),
    visibility: jest.fn(),
    settings: jest.fn(),
    items: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
    archiveCourse: jest.fn(),
    restoreCourse: jest.fn(),
    duplicateCourse: jest.fn(),
  };
  const controller = new AdminCoursesController(catalog as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists courses', () => {
    controller.list({} as never);
    expect(catalog.adminCourses).toHaveBeenCalledWith({});
  });

  it('creates a course', () => {
    controller.create(actor, { title: 'New' } as never);
    expect(catalog.createCourse).toHaveBeenCalledWith(actor, { title: 'New' });
  });

  it('gets course detail', () => {
    controller.detail('course-1');
    expect(catalog.adminCourse).toHaveBeenCalledWith('course-1');
  });

  it('updates a course', () => {
    controller.update(actor, 'course-1', { title: 'Renamed' } as never);
    expect(catalog.updateCourse).toHaveBeenCalledWith(actor, 'course-1', {
      title: 'Renamed',
    });
  });

  it('updates pricing', () => {
    controller.pricing(actor, 'course-1', { price: 100 } as never);
    expect(catalog.pricing).toHaveBeenCalledWith(actor, 'course-1', {
      price: 100,
    });
  });

  it('updates visibility', () => {
    controller.visibility(actor, 'course-1', { visibility: 'PUBLIC' } as never);
    expect(catalog.visibility).toHaveBeenCalledWith(actor, 'course-1', {
      visibility: 'PUBLIC',
    });
  });

  it('updates certificate settings', () => {
    controller.settings(actor, 'course-1', {
      certificateEnabled: true,
    } as never);
    expect(catalog.settings).toHaveBeenCalledWith(actor, 'course-1', {
      certificateEnabled: true,
    });
  });

  it('routes outcomes to the "outcomes" item list', () => {
    controller.outcomes(actor, 'course-1', { items: ['a'] } as never);
    expect(catalog.items).toHaveBeenCalledWith(actor, 'course-1', 'outcomes', {
      items: ['a'],
    });
  });

  it('routes requirements to the "requirements" item list', () => {
    controller.requirements(actor, 'course-1', { items: ['b'] } as never);
    expect(catalog.items).toHaveBeenCalledWith(
      actor,
      'course-1',
      'requirements',
      { items: ['b'] },
    );
  });

  it('publishes and unpublishes a course', () => {
    controller.publish(actor, 'course-1');
    expect(catalog.publish).toHaveBeenCalledWith(actor, 'course-1');
    controller.unpublish(actor, 'course-1');
    expect(catalog.unpublish).toHaveBeenCalledWith(actor, 'course-1');
  });

  it('archives, restores, and duplicates a course', () => {
    controller.archive(actor, 'course-1');
    expect(catalog.archiveCourse).toHaveBeenCalledWith(actor, 'course-1');
    controller.restore(actor, 'course-1');
    expect(catalog.restoreCourse).toHaveBeenCalledWith(actor, 'course-1');
    controller.duplicate(actor, 'course-1', { title: 'Copy' } as never);
    expect(catalog.duplicateCourse).toHaveBeenCalledWith(actor, 'course-1', {
      title: 'Copy',
    });
  });
});
