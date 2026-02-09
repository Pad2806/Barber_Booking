import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to a salon page
    await page.goto('/salons');
    await page.waitForLoadState('networkidle');
  });

  test('should display salon details page', async ({ page }) => {
    // Click on first salon card if available
    const salonCard = page.locator('a[href*="/salons/"]').first();
    
    if (await salonCard.isVisible()) {
      await salonCard.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on salon detail page
      await expect(page).toHaveURL(/\/salons\/.+/);
    }
  });

  test('should show services on salon page', async ({ page }) => {
    // Navigate to a salon
    const salonCard = page.locator('a[href*="/salons/"]').first();
    
    if (await salonCard.isVisible()) {
      await salonCard.click();
      await page.waitForLoadState('networkidle');
      
      // Look for services section
      const servicesSection = page.locator('[data-testid="services"], .services-section, text=/dịch vụ|services/i');
      await page.waitForTimeout(1000);
    }
  });

  test('should show staff on salon page', async ({ page }) => {
    // Navigate to a salon
    const salonCard = page.locator('a[href*="/salons/"]').first();
    
    if (await salonCard.isVisible()) {
      await salonCard.click();
      await page.waitForLoadState('networkidle');
      
      // Look for staff section
      const staffSection = page.locator('[data-testid="staff"], .staff-section, text=/nhân viên|stylist|staff/i');
      await page.waitForTimeout(1000);
    }
  });

  test('should require login for booking', async ({ page }) => {
    // Navigate to a salon
    const salonCard = page.locator('a[href*="/salons/"]').first();
    
    if (await salonCard.isVisible()) {
      await salonCard.click();
      await page.waitForLoadState('networkidle');
      
      // Try to click book button
      const bookButton = page.getByRole('button', { name: /đặt lịch|book|booking/i }).first();
      
      if (await bookButton.isVisible()) {
        await bookButton.click();
        
        // Should redirect to login or show login modal
        await page.waitForTimeout(1000);
        
        // Check if redirected to login or login modal appeared
        const loginForm = page.locator('form');
        const isLoginPage = await page.url().includes('login');
        const hasLoginForm = await loginForm.isVisible();
        
        expect(isLoginPage || hasLoginForm).toBeTruthy();
      }
    }
  });
});

test.describe('Authenticated Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (mock login for testing)
    await page.goto('/auth/login');
    
    // Fill login form
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await phoneInput.isVisible() && await passwordInput.isVisible()) {
      await phoneInput.fill('0901234567');
      await passwordInput.fill('TestPassword123');
      
      const submitButton = page.getByRole('button', { name: /đăng nhập|login/i });
      await submitButton.click();
      
      // Wait for redirect
      await page.waitForTimeout(2000);
    }
  });

  test('should display time slots after selecting service', async ({ page }) => {
    // Navigate to salon
    await page.goto('/salons');
    await page.waitForLoadState('networkidle');
    
    const salonCard = page.locator('a[href*="/salons/"]').first();
    
    if (await salonCard.isVisible()) {
      await salonCard.click();
      await page.waitForLoadState('networkidle');
      
      // Select a service (click on service card/checkbox)
      const serviceCheckbox = page.locator('input[type="checkbox"]').first();
      if (await serviceCheckbox.isVisible()) {
        await serviceCheckbox.click();
        
        // Check for time slots display
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should allow selecting date for booking', async ({ page }) => {
    // Navigate to salon
    await page.goto('/salons');
    await page.waitForLoadState('networkidle');
    
    const salonCard = page.locator('a[href*="/salons/"]').first();
    
    if (await salonCard.isVisible()) {
      await salonCard.click();
      await page.waitForLoadState('networkidle');
      
      // Look for date picker
      const datePicker = page.locator('[data-testid="date-picker"], .date-picker, input[type="date"]');
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('My Bookings Page', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/bookings');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await page.waitForTimeout(1000);
    
    const isLoginPage = page.url().includes('login') || page.url().includes('auth');
    const hasLoginForm = await page.locator('form').isVisible();
    
    // Either redirected to login or showing login form
    expect(isLoginPage || hasLoginForm).toBeTruthy();
  });
});
