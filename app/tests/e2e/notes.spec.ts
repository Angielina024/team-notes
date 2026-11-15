import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('a user creates a note, sees it in the list and deletes it', async ({ page, request }) => {
  // Arrange: новий користувач через API (реєстрація — не предмет цього тесту)
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'correct-horse-battery-42';
  const title = `E2E нотатка ${randomUUID().slice(0, 8)}`;
  const registered = await request.post('/api/auth/register', { data: { email, password, name: 'E2E' } });
  expect(registered.ok()).toBe(true);

  // Act + Assert: вхід
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page).toHaveURL(/\/notes/);

  // створення
  await page.getByLabel('Заголовок').fill(title);
  await page.getByLabel('Текст').fill('Створено e2e-тестом');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  // нотатка є в списку
  await page.getByRole('link', { name: 'Усі нотатки' }).click();
  const item = page.getByRole('listitem').filter({ hasText: title });
  await expect(item).toBeVisible();

  // видалення
  await item.getByRole('button', { name: 'Видалити' }).click();
  await expect(item).toHaveCount(0);
});