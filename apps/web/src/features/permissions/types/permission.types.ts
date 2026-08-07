export interface Permission {
  id: string;
  code: string;
  module: string;
  description: string | null;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface PermissionCatalog {
  groups: PermissionGroup[];
}
