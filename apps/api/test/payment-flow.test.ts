/**
 * Payment Flow Test Script
 * 
 * Test flow:
 * 1. Login to get JWT token
 * 2. Create a booking
 * 3. Create VietQR payment for booking
 * 4. Simulate Sepay webhook callback
 * 5. Verify payment status updated
 */

const API_URL = 'http://localhost:3001/api';

interface TestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function runTest() {
  console.log('\n🧪 ===== PAYMENT FLOW TEST =====\n');

  // Step 1: Login
  console.log('📝 Step 1: Login as admin...');
  const loginRes = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@reetro.vn',
      password: 'admin123',
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed:', loginRes.data);
    results.push({ step: 'Login', success: false, error: loginRes.data?.message });
    return;
  }

  const token = loginRes.data.accessToken;
  console.log('✅ Login successful, got token\n');
  results.push({ step: 'Login', success: true, data: { hasToken: !!token } });

  // Step 2: Get a salon
  console.log('📝 Step 2: Get salon list...');
  const salonsRes = await fetchApi('/salons', {}, token);
  
  // Handle paginated response: { data: [], meta: {} }
  const salons = salonsRes.data?.data || salonsRes.data;
  if (!salonsRes.ok || !salons?.length) {
    console.error('❌ No salons found');
    results.push({ step: 'Get Salons', success: false, error: 'No salons found' });
    return;
  }

  const salon = salons[0];
  console.log(`✅ Found salon: ${salon.name} (ID: ${salon.id})\n`);
  results.push({ step: 'Get Salons', success: true, data: { salonName: salon.name } });

  // Step 3: Get services for salon
  console.log('📝 Step 3: Get services for salon...');
  const servicesRes = await fetchApi(`/services/salon/${salon.id}`, {}, token);

  // Handle array or paginated response
  const services = servicesRes.data?.data || servicesRes.data;
  if (!servicesRes.ok || !services?.length) {
    console.error('❌ No services found');
    results.push({ step: 'Get Services', success: false, error: 'No services found' });
    return;
  }

  const service = services[0];
  console.log(`✅ Found service: ${service.name} - ${service.price}đ\n`);
  results.push({ step: 'Get Services', success: true, data: { serviceName: service.name, price: service.price } });

  // Step 4: Get staff for salon
  console.log('📝 Step 4: Get staff for salon...');
  const staffRes = await fetchApi(`/staff/salon/${salon.id}`, {}, token);

  // Handle array or paginated response
  const staffList = staffRes.data?.data || staffRes.data;
  if (!staffRes.ok || !staffList?.length) {
    console.error('❌ No staff found');
    results.push({ step: 'Get Staff', success: false, error: 'No staff found' });
    return;
  }

  const staff = staffList[0];
  console.log(`✅ Found staff: ${staff.user?.name || staff.id}\n`);
  results.push({ step: 'Get Staff', success: true, data: { staffId: staff.id } });

  // Step 5: Create booking
  console.log('📝 Step 5: Create booking...');
  
  // Find next weekday (Mon-Sat) for booking
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + 1); // Start from tomorrow
  
  // Find a valid working day (staff usually works Mon-Sat)
  while (bookingDate.getDay() === 0) { // Skip Sunday
    bookingDate.setDate(bookingDate.getDate() + 1);
  }
  
  const dateStr = bookingDate.toISOString().split('T')[0];
  
  // Get available slots for the staff
  console.log(`   Checking available slots for ${dateStr}...`);
  const slotsRes = await fetchApi(`/staff/${staff.id}/available-slots?date=${dateStr}`, {}, token);
  const availableSlots = slotsRes.data;
  
  // Pick first available slot, or default to 10:00
  let timeSlot = '10:00';
  if (availableSlots && Array.isArray(availableSlots) && availableSlots.length > 0) {
    timeSlot = availableSlots[0];
    console.log(`   Found ${availableSlots.length} available slots, using: ${timeSlot}`);
  } else {
    console.log(`   No slots API response, using default: ${timeSlot}`);
  }

  const bookingRes = await fetchApi('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      salonId: salon.id,
      staffId: staff.id,
      date: dateStr,
      timeSlot: timeSlot,
      serviceIds: [service.id],
      note: 'Test booking for payment flow',
    }),
  }, token);

  if (!bookingRes.ok) {
    console.error('❌ Create booking failed:', bookingRes.data);
    results.push({ step: 'Create Booking', success: false, error: bookingRes.data?.message });
    return;
  }

  const booking = bookingRes.data;
  console.log(`✅ Created booking: ${booking.bookingCode}`);
  console.log(`   - Date: ${booking.date}`);
  console.log(`   - Time: ${booking.timeSlot}`);
  console.log(`   - Amount: ${booking.totalAmount}đ\n`);
  results.push({ step: 'Create Booking', success: true, data: { bookingCode: booking.bookingCode, amount: booking.totalAmount } });

  // Step 6: Create VietQR payment
  console.log('📝 Step 6: Create VietQR payment...');
  const paymentRes = await fetchApi('/payments', {
    method: 'POST',
    body: JSON.stringify({
      bookingId: booking.id,
      method: 'VIETQR',
    }),
  }, token);

  if (!paymentRes.ok) {
    console.error('❌ Create payment failed:', paymentRes.data);
    results.push({ step: 'Create Payment', success: false, error: paymentRes.data?.message });
    return;
  }

  const payment = paymentRes.data;
  console.log(`✅ Created payment:`);
  console.log(`   - Payment ID: ${payment.id}`);
  console.log(`   - Method: ${payment.method}`);
  console.log(`   - Status: ${payment.status}`);
  console.log(`   - QR Code URL: ${payment.qrCodeUrl?.substring(0, 80)}...`);
  console.log(`   - Bank: ${payment.bankCode} - ${payment.bankAccount}\n`);
  results.push({ 
    step: 'Create Payment', 
    success: true, 
    data: { 
      paymentId: payment.id, 
      hasQRCode: !!payment.qrCodeUrl,
      status: payment.status
    } 
  });

  // Step 7: Verify payment status (before webhook)
  console.log('📝 Step 7: Check payment status (before webhook)...');
  const paymentStatusRes = await fetchApi(`/payments/${payment.id}`, {}, token);

  if (!paymentStatusRes.ok) {
    console.error('❌ Get payment status failed:', paymentStatusRes.data);
    results.push({ step: 'Check Payment Before', success: false, error: paymentStatusRes.data?.message });
    return;
  }

  console.log(`✅ Payment status: ${paymentStatusRes.data.status} (should be PENDING)\n`);
  results.push({ step: 'Check Payment Before', success: true, data: { status: paymentStatusRes.data.status } });

  // Step 8: Simulate Sepay webhook
  console.log('📝 Step 8: Simulate Sepay webhook callback...');
  
  const webhookPayload = {
    id: `SEPAY${Date.now()}`,
    gateway: 'MBBank',
    transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    accountNumber: payment.bankAccount || '0123456789',
    subAccount: null,
    transferType: 'in',
    transferAmount: Number(payment.amount),
    accumulated: Number(payment.amount),
    code: null,
    content: `${booking.bookingCode} thanh toan`, // Booking code in content
    referenceCode: `FT${Date.now()}`,
    description: `MBVCB.${Date.now()}.${booking.bookingCode} thanh toan.CT tu 0901234567`,
  };

  console.log('   Webhook payload:', JSON.stringify(webhookPayload, null, 2));

  // Note: Sepay sends webhook with Authorization header containing SEPAY_WEBHOOK_SECRET
  // API expects format: "Bearer {secret}"
  const webhookRes = await fetchApi('/payments/webhook/sepay', {
    method: 'POST',
    body: JSON.stringify(webhookPayload),
    headers: {
      'Authorization': 'Bearer test-sepay-secret', // Match the SEPAY_WEBHOOK_SECRET env var
    },
  });

  console.log(`   Webhook response: ${JSON.stringify(webhookRes.data)}`);
  
  if (!webhookRes.ok && webhookRes.status !== 401) {
    console.error('❌ Webhook failed:', webhookRes.data);
    results.push({ step: 'Sepay Webhook', success: false, error: webhookRes.data?.message });
    return;
  }

  console.log(`✅ Webhook processed: ${webhookRes.data?.message || 'Success'}\n`);
  results.push({ step: 'Sepay Webhook', success: webhookRes.ok, data: webhookRes.data });

  // Step 9: Verify payment status (after webhook)
  console.log('📝 Step 9: Check payment status (after webhook)...');
  const paymentAfterRes = await fetchApi(`/payments/${payment.id}`, {}, token);

  if (!paymentAfterRes.ok) {
    console.error('❌ Get payment status failed:', paymentAfterRes.data);
    results.push({ step: 'Check Payment After', success: false, error: paymentAfterRes.data?.message });
    return;
  }

  const finalStatus = paymentAfterRes.data.status;
  console.log(`✅ Final payment status: ${finalStatus}`);
  console.log(`   - Paid at: ${paymentAfterRes.data.paidAt || 'Not paid'}`);
  console.log(`   - Sepay Trans ID: ${paymentAfterRes.data.sepayTransId || 'N/A'}\n`);
  
  results.push({ 
    step: 'Check Payment After', 
    success: true, 
    data: { 
      status: finalStatus,
      isPaid: finalStatus === 'PAID',
      paidAt: paymentAfterRes.data.paidAt
    } 
  });

  // Step 10: Check booking status
  console.log('📝 Step 10: Check booking payment status...');
  const bookingAfterRes = await fetchApi(`/bookings/${booking.id}`, {}, token);

  if (!bookingAfterRes.ok) {
    console.error('❌ Get booking failed:', bookingAfterRes.data);
    results.push({ step: 'Check Booking After', success: false, error: bookingAfterRes.data?.message });
    return;
  }

  console.log(`✅ Booking payment status: ${bookingAfterRes.data.paymentStatus}`);
  results.push({ 
    step: 'Check Booking After', 
    success: true, 
    data: { 
      bookingStatus: bookingAfterRes.data.status,
      paymentStatus: bookingAfterRes.data.paymentStatus
    } 
  });

  // Summary
  console.log('\n===== TEST SUMMARY =====\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.step}: ${r.success ? 'PASSED' : 'FAILED'}`);
    if (r.data) console.log(`   Data: ${JSON.stringify(r.data)}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  });

  console.log(`\n📊 Results: ${passed}/${results.length} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Payment flow is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
  }
}

// Run the test
runTest().catch(console.error);
