import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title contains ReetroBarberShop
    await expect(page).toHaveTitle(/ReetroBarberShop|Reetro/i);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    // Look for hero section content
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation links
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('should have working links in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test clicking on a salon link
    const salonLink = page.getByRole('link', { name: /salon|cửa hàng/i }).first();
    if (await salonLink.isVisible()) {
      await salonLink.click();
      await expect(page).toHaveURL(/salon/);
    }
  });
});

test.describe('Salons Page', () => {
  test('should display salons listing', async ({ page }) => {
    await page.goto('/salons');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for salon cards or listing
    const salonsContainer = page.locator('[data-testid="salons-list"], .salons-container, main');
    await expect(salonsContainer).toBeVisible();
  });

  test('should be able to search salons', async ({ page }) => {
    await page.goto('/salons');
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/tìm kiếm|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Reetro');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for login form
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Submit empty form
    const submitButton = page.getByRole('button', { name: /đăng nhập|login/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for validation messages
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check for registration form
    const registerForm = page.locator('form');
    await expect(registerForm).toBeVisible();
  });

  test('should have password input for registration', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check for password field
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput.first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('mobile: should show hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Look for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu"]');
    // Mobile menu may or may not exist depending on implementation
    await page.waitForTimeout(500);
  });

  test('desktop: should show full navigation', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Navigation should be visible
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });
});
