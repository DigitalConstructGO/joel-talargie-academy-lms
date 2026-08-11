import { PublicCatalogController } from '../controllers/public-catalog.controller';

describe('PublicCatalogController', () => {
  const catalog = {
    listCategories: jest.fn(),
    publicCategory: jest.fn(),
    publicCourses: jest.fn(),
    publicCourse: jest.fn(),
  };
  const controller = new PublicCatalogController(catalog as never);

  beforeEach(() => jest.clearAllMocks());

  it('lists only active categories for public browsing', () => {
    controller.categories({} as never);
    expect(catalog.listCategories).toHaveBeenCalledWith({}, true);
  });

  it('gets a public category by slug', () => {
    controller.category('web-dev', {} as never);
    expect(catalog.publicCategory).toHaveBeenCalledWith('web-dev', {});
  });

  it('searches published courses', () => {
    controller.courses({ page: 1 } as never);
    expect(catalog.publicCourses).toHaveBeenCalledWith({ page: 1 });
  });

  it('forces featured=true and caps pageSize at 20 for the featured endpoint', () => {
    const query = { featured: false, pageSize: 100 } as never;
    controller.featured(query);
    expect(catalog.publicCourses).toHaveBeenCalledWith({
      featured: true,
      pageSize: 20,
    });
  });

  it('leaves a smaller requested pageSize untouched for the featured endpoint', () => {
    const query = { featured: false, pageSize: 5 } as never;
    controller.featured(query);
    expect(catalog.publicCourses).toHaveBeenCalledWith({
      featured: true,
      pageSize: 5,
    });
  });

  it('gets a published course by slug', () => {
    controller.course('intro-to-ts');
    expect(catalog.publicCourse).toHaveBeenCalledWith('intro-to-ts');
  });
});
