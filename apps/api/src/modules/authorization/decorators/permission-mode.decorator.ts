import { SetMetadata } from '@nestjs/common';
import { PermissionMode as Mode } from '../enums/permission-mode.enum';
export const PERMISSION_MODE_KEY = 'permission_mode';
export const PermissionMode = (mode: Mode) =>
  SetMetadata(PERMISSION_MODE_KEY, mode);
