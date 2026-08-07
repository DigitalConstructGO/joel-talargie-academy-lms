export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageKey: string | null;
  isActive: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryChild {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminCategoryDetail extends AdminCategory {
  children: AdminCategoryChild[];
  courseCounts: Record<string, number>;
}

export interface AdminCategoryListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  includeArchived?: boolean;
  parentId?: string;
}

export interface AdminCategoryListResult {
  items: AdminCategory[];
  total: number;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  imageKey?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string | null;
  imageKey?: string | null;
  isActive?: boolean;
}

export interface ReorderCategoriesInput {
  items: { categoryId: string; parentId?: string | null; sortOrder: number }[];
}
