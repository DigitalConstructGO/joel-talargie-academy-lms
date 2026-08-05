import { AdminCategoriesController } from '../controllers/admin-categories.controller';

describe('AdminCategoriesController', () => {
  const catalog = {
    listCategories: jest.fn(),
    createCategory: jest.fn(),
    reorderCategories: jest.fn(),
    category: jest.fn(),
    updateCategory: jest.fn(),
    archiveCategory: jest.fn(),
  };
  const controller = new AdminCategoriesController(catalog as never);
  const actor = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => jest.clearAllMocks());

  it('lists all categories (not just active ones) for admins', () => {
    controller.list({} as never);
    expect(catalog.listCategories).toHaveBeenCalledWith({});
  });

  it('creates a category', () => {
    controller.create(actor, { name: 'New' } as never);
    expect(catalog.createCategory).toHaveBeenCalledWith(actor, { name: 'New' });
  });

  it('reorders categories', () => {
    controller.reorder(actor, { items: [] } as never);
    expect(catalog.reorderCategories).toHaveBeenCalledWith(actor, {
      items: [],
    });
  });

  it('gets a category by id', () => {
    controller.detail('category-1');
    expect(catalog.category).toHaveBeenCalledWith('category-1');
  });

  it('updates a category', () => {
    controller.update(actor, 'category-1', { name: 'Renamed' } as never);
    expect(catalog.updateCategory).toHaveBeenCalledWith(actor, 'category-1', {
      name: 'Renamed',
    });
  });

  it('archives a category', () => {
    controller.archive(actor, 'category-1');
    expect(catalog.archiveCategory).toHaveBeenCalledWith(actor, 'category-1');
  });
});
