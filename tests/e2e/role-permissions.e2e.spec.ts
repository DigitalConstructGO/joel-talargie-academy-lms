import { test, expect, Page } from '@playwright/test';

test.setTimeout(300000);

const ADMIN_EMAIL = 'admin@academy.test';
const ADMIN_PASSWORD = 'Admin@12345';
const SLOW = 60000;

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email Address').fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: SLOW });
}

async function expandModule(page: Page, module: string) {
  await page.getByRole('button', { name: new RegExp(`^${module}`) }).click();
  await page.getByLabel(`${module}.read`).first().waitFor({ state: 'visible', timeout: SLOW });
}

test('role permission assignment persists and refreshes', async ({ page }) => {
  await login(page);

  await page.goto('/admin/system/roles');
  await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible({ timeout: SLOW });

  const stamp = Date.now().toString(36);
  const roleName = `E2E Probe ${stamp}`;
  const roleCode = `E2E_PROBE_${stamp}`.toUpperCase().slice(0, 20);

  await page.goto('/admin/system/roles/create');
  await page.getByLabel('Name').fill(roleName);
  await page.getByLabel('Code').fill(roleCode);
  await page.getByText(/\d+ permission\(s\) selected/).waitFor({ state: 'visible', timeout: SLOW });

  await expandModule(page, 'courses');
  const coursesRead = page.getByLabel('courses.read');
  const coursesCreate = page.getByLabel('courses.create');
  await coursesRead.check({ force: true });
  await coursesCreate.check({ force: true });
  await expect(page.getByText(/2 permission\(s\) selected/)).toBeVisible();

  await page.getByRole('button', { name: 'Create role' }).click();
  await page.waitForURL(/\/admin\/system\/roles\/[0-9a-f-]{36}/, { timeout: SLOW });
  const roleId = page.url().split('/').pop()!;

  await expect(page.getByRole('heading', { name: roleName })).toBeVisible({ timeout: SLOW });
  await expect(page.getByText('Permissions (2)')).toBeVisible();
  await expect(page.getByText('courses.read', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('courses.create', { exact: true }).first()).toBeVisible();

  await page.goto(`/admin/system/roles/${roleId}/edit`);
  await page.getByText(/\d+ permission\(s\) selected/).waitFor({ state: 'visible', timeout: SLOW });
  await expandModule(page, 'courses');
  await expect(page.getByLabel('courses.read')).toBeChecked();
  await expect(page.getByLabel('courses.create')).toBeChecked();

  await page.getByLabel('courses.read').uncheck({ force: true });
  await expandModule(page, 'lessons');
  await page.getByLabel('lessons.read').check({ force: true });

  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForURL(`**/admin/system/roles/${roleId}`, { timeout: SLOW });

  await expect(page.getByText('courses.read', { exact: true }).first()).not.toBeVisible({
    timeout: SLOW,
  });
  await expect(page.getByText('courses.create', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('lessons.read', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Permissions (2)')).toBeVisible();

  await page.goto(`/admin/system/roles/${roleId}/edit`);
  await page.getByText(/\d+ permission\(s\) selected/).waitFor({ state: 'visible', timeout: SLOW });
  await expandModule(page, 'courses');
  await expect(page.getByLabel('courses.read')).not.toBeChecked();
  await expect(page.getByLabel('courses.create')).toBeChecked();
  await expandModule(page, 'lessons');
  await expect(page.getByLabel('lessons.read')).toBeChecked();

  await page.goto(`/admin/system/roles/${roleId}`);
  await page.getByRole('heading', { name: roleName }).waitFor({ state: 'visible', timeout: SLOW });
  await page.getByRole('button', { name: 'Archive' }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).last().click();
  await page.waitForURL('**/admin/system/roles', { timeout: SLOW });
});
