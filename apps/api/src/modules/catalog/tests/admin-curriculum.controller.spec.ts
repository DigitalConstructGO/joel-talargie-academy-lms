import { AdminCurriculumController } from '../controllers/admin-curriculum.controller';

describe('AdminCurriculumController', () => {
  const catalog = {
    createSection: jest.fn(),
    reorderSections: jest.fn(),
    updateSection: jest.fn(),
    archiveSection: jest.fn(),
    createLesson: jest.fn(),
    reorderLessons: jest.fn(),
    updateLesson: jest.fn(),
    moveLesson: jest.fn(),
    publishLesson: jest.fn(),
    unpublishLesson: jest.fn(),
    previewLesson: jest.fn(),
    archiveLesson: jest.fn(),
    createResource: jest.fn(),
    updateResource: jest.fn(),
    deleteResource: jest.fn(),
  };
  const controller = new AdminCurriculumController(catalog as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('manages sections', () => {
    controller.createSection(actor, 'course-1', { title: 'S1' } as never);
    expect(catalog.createSection).toHaveBeenCalledWith(actor, 'course-1', {
      title: 'S1',
    });

    controller.reorderSections(actor, 'course-1', { items: [] } as never);
    expect(catalog.reorderSections).toHaveBeenCalledWith(actor, 'course-1', {
      items: [],
    });

    controller.updateSection(actor, 'section-1', { title: 'S2' } as never);
    expect(catalog.updateSection).toHaveBeenCalledWith(actor, 'section-1', {
      title: 'S2',
    });

    controller.archiveSection(actor, 'section-1');
    expect(catalog.archiveSection).toHaveBeenCalledWith(actor, 'section-1');
  });

  it('manages lessons', () => {
    controller.createLesson(actor, 'section-1', { title: 'L1' } as never);
    expect(catalog.createLesson).toHaveBeenCalledWith(actor, 'section-1', {
      title: 'L1',
    });

    controller.reorderLessons(actor, 'section-1', { items: [] } as never);
    expect(catalog.reorderLessons).toHaveBeenCalledWith(actor, 'section-1', {
      items: [],
    });

    controller.updateLesson(actor, 'lesson-1', { title: 'L2' } as never);
    expect(catalog.updateLesson).toHaveBeenCalledWith(actor, 'lesson-1', {
      title: 'L2',
    });

    controller.moveLesson(actor, 'lesson-1', {
      sectionId: 'section-2',
    } as never);
    expect(catalog.moveLesson).toHaveBeenCalledWith(actor, 'lesson-1', {
      sectionId: 'section-2',
    });

    controller.publishLesson(actor, 'lesson-1');
    expect(catalog.publishLesson).toHaveBeenCalledWith(actor, 'lesson-1');

    controller.unpublishLesson(actor, 'lesson-1');
    expect(catalog.unpublishLesson).toHaveBeenCalledWith(actor, 'lesson-1');

    controller.archiveLesson(actor, 'lesson-1');
    expect(catalog.archiveLesson).toHaveBeenCalledWith(actor, 'lesson-1');
  });

  it('extracts isPreview from the DTO when toggling lesson preview', () => {
    controller.previewLesson(actor, 'lesson-1', { isPreview: true });
    expect(catalog.previewLesson).toHaveBeenCalledWith(actor, 'lesson-1', true);
  });

  it('manages lesson resources', () => {
    controller.createResource(actor, 'lesson-1', { title: 'R1' } as never);
    expect(catalog.createResource).toHaveBeenCalledWith(actor, 'lesson-1', {
      title: 'R1',
    });

    controller.updateResource(actor, 'resource-1', { title: 'R2' } as never);
    expect(catalog.updateResource).toHaveBeenCalledWith(actor, 'resource-1', {
      title: 'R2',
    });

    controller.deleteResource(actor, 'resource-1');
    expect(catalog.deleteResource).toHaveBeenCalledWith(actor, 'resource-1');
  });
});
