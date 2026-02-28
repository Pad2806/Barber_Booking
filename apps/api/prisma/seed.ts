import {
  PrismaClient,
  AuthProvider,
  Role,
  ServiceCategory,
  StaffPosition,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data in order (respecting foreign keys)
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      phone: '0909000001',
      email: 'admin@reetro.vn',
      name: 'Admin',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      authProvider: AuthProvider.LOCAL,
      isVerified: true,
      isActive: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=1a365d&color=fff',
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Create Customer Users
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        phone: '0909111111',
        name: 'Nguyễn Văn A',
        role: Role.CUSTOMER,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=random',
      },
    }),
    prisma.user.create({
      data: {
        phone: '0909222222',
        name: 'Trần Văn B',
        role: Role.CUSTOMER,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Tran+Van+B&background=random',
      },
    }),
    prisma.user.create({
      data: {
        phone: '0909333333',
        name: 'Lê Văn C',
        role: Role.CUSTOMER,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=random',
      },
    }),
  ]);
  console.log('✅ Created', customers.length, 'customer users');

  // Create Staff Users (need User records for Staff)
  const staffUsers = await Promise.all([
    prisma.user.create({
      data: {
        phone: '0909001001',
        email: 'minh.barber@reetro.vn',
        name: 'Minh Barber',
        password: hashedPassword,
        role: Role.STAFF,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Minh&background=random',
      },
    }),
    prisma.user.create({
      data: {
        phone: '0909001002',
        email: 'tung.barber@reetro.vn',
        name: 'Tùng Barber',
        password: hashedPassword,
        role: Role.STAFF,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Tung&background=random',
      },
    }),
    prisma.user.create({
      data: {
        phone: '0909001003',
        email: 'huy.barber@reetro.vn',
        name: 'Huy Barber',
        password: hashedPassword,
        role: Role.STAFF,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Huy&background=random',
      },
    }),
    prisma.user.create({
      data: {
        phone: '0909001004',
        email: 'duc.barber@reetro.vn',
        name: 'Đức Barber',
        password: hashedPassword,
        role: Role.STAFF,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Duc&background=random',
      },
    }),
    prisma.user.create({
      data: {
        phone: '0909001005',
        email: 'long.barber@reetro.vn',
        name: 'Long Barber',
        password: hashedPassword,
        role: Role.STAFF,
        authProvider: AuthProvider.LOCAL,
        isVerified: true,
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Long&background=random',
      },
    }),
  ]);
  console.log('✅ Created', staffUsers.length, 'staff users');

  // Create Salons
  const salons = await Promise.all([
    prisma.salon.create({
      data: {
        name: 'Reetro Quận 1',
        slug: 'reetro-quan-1',
        description: 'Tiệm cắt tóc nam cao cấp tại Quận 1',
        address: '123 Nguyễn Huệ, Q.1, TP.HCM',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        phone: '0909 123 456',
        email: 'q1@reetro.vn',
        openTime: '08:00',
        closeTime: '21:00',
        latitude: 10.7739,
        longitude: 106.7004,
        images: [
          'https://images.unsplash.com/photo-1585747860019-8e2e0c35c0e1?w=600&h=400&fit=crop',
        ],
        isActive: true,
        ownerId: adminUser.id,
        bankCode: '970423',
        bankAccount: '23238628888',
        bankName: 'TPBank',
      },
    }),
    prisma.salon.create({
      data: {
        name: 'Reetro Quận 3',
        slug: 'reetro-quan-3',
        description: 'Tiệm cắt tóc nam cao cấp tại Quận 3',
        address: '456 Võ Văn Tần, Q.3, TP.HCM',
        city: 'Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 6',
        phone: '0909 123 457',
        email: 'q3@reetro.vn',
        openTime: '08:00',
        closeTime: '21:00',
        latitude: 10.7823,
        longitude: 106.6875,
        images: [
          'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=400&fit=crop',
        ],
        isActive: true,
        ownerId: adminUser.id,
        bankCode: '970423',
        bankAccount: '23238628888',
        bankName: 'TPBank',
      },
    }),
  ]);
  console.log('✅ Created', salons.length, 'salons');

  // Create Staff records
  const staffPositions: StaffPosition[] = [
    StaffPosition.MASTER_STYLIST,
    StaffPosition.SENIOR_STYLIST,
    StaffPosition.STYLIST,
    StaffPosition.MASTER_STYLIST,
    StaffPosition.SENIOR_STYLIST,
  ];

  const staffRecords = await Promise.all(
    staffUsers.map((user, i) =>
      prisma.staff.create({
        data: {
          userId: user.id,
          salonId: salons[i < 3 ? 0 : 1].id,
          position: staffPositions[i],
          bio: `${user.name} - Chuyên gia tạo kiểu tóc nam`,
          rating: 4.5 + Math.random() * 0.5,
          totalReviews: Math.floor(Math.random() * 50),
          isActive: true,
        },
      })
    )
  );
  console.log('✅ Created', staffRecords.length, 'staff records');

  // Create Staff Schedules (Mon-Sat, 0=Sun, 1=Mon, ..., 6=Sat)
  for (const staff of staffRecords) {
    for (let day = 1; day <= 6; day++) {
      await prisma.staffSchedule.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '21:00',
          isOff: false,
        },
      });
    }
    // Sunday morning only
    await prisma.staffSchedule.create({
      data: {
        staffId: staff.id,
        dayOfWeek: 0,
        startTime: '08:00',
        endTime: '12:00',
        isOff: false,
      },
    });
  }
  console.log('✅ Created schedules for all staff');

  // Create Services for each salon
  const serviceData = [
    {
      name: 'Cắt tóc nam',
      description: 'Cắt tóc nam cơ bản, tạo kiểu theo yêu cầu',
      price: 100000,
      duration: 30,
      category: ServiceCategory.HAIRCUT,
      order: 1,
    },
    {
      name: 'Cắt tóc + Gội massage',
      description: 'Combo cắt tóc kèm gội đầu massage thư giãn',
      price: 150000,
      duration: 45,
      category: ServiceCategory.COMBO,
      order: 2,
    },
    {
      name: 'Cạo mặt + Đắp mặt nạ',
      description: 'Cạo râu, cạo mặt kèm đắp mặt nạ dưỡng da',
      price: 80000,
      duration: 25,
      category: ServiceCategory.FACIAL,
      order: 3,
    },
    {
      name: 'Nhuộm tóc',
      description: 'Nhuộm tóc các màu theo xu hướng',
      price: 250000,
      duration: 90,
      category: ServiceCategory.HAIR_COLORING,
      order: 4,
    },
    {
      name: 'Uốn tóc Hàn Quốc',
      description: 'Uốn tóc Hàn Quốc, tạo kiểu độc đáo',
      price: 350000,
      duration: 120,
      category: ServiceCategory.HAIR_STYLING,
      order: 5,
    },
    {
      name: 'VIP Combo',
      description: 'Cắt + Gội + Cạo mặt + Đắp mặt nạ + Massage vai cổ',
      price: 300000,
      duration: 90,
      category: ServiceCategory.COMBO,
      order: 6,
    },
  ];

  const services: any[] = [];
  for (const salon of salons) {
    for (const svc of serviceData) {
      const service = await prisma.service.create({
        data: {
          ...svc,
          salonId: salon.id,
          isActive: true,
        },
      });
      services.push(service);
    }
  }
  console.log('✅ Created', services.length, 'services');

  // Create Sample Bookings
  const today = new Date();
  const bookings = [];

  for (let i = 0; i < 10; i++) {
    const bookingDate = new Date(today);
    bookingDate.setDate(today.getDate() - Math.floor(Math.random() * 7));
    const hour = 9 + Math.floor(Math.random() * 10);

    const salonIndex = Math.floor(Math.random() * salons.length);
    const salon = salons[salonIndex];
    const salonServices = services.filter(s => s.salonId === salon.id);
    const selectedService = salonServices[Math.floor(Math.random() * salonServices.length)];
    const salonStaff = staffRecords.filter(s => s.salonId === salon.id);
    const selectedStaff = salonStaff[Math.floor(Math.random() * salonStaff.length)];

    const statuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ];

    const booking = await prisma.booking.create({
      data: {
        bookingCode: `BK${Date.now()}${i}`,
        customerId: customers[Math.floor(Math.random() * customers.length)].id,
        salonId: salon.id,
        staffId: selectedStaff?.id,
        date: bookingDate,
        timeSlot: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + Math.ceil(selectedService.duration / 60)).toString().padStart(2, '0')}:00`,
        totalDuration: selectedService.duration,
        totalAmount: selectedService.price,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentStatus: PaymentStatus.UNPAID,
      },
    });

    // Add booking service
    await prisma.bookingService.create({
      data: {
        bookingId: booking.id,
        serviceId: selectedService.id,
        price: selectedService.price,
        duration: selectedService.duration,
      },
    });

    bookings.push(booking);
  }
  console.log('✅ Created', bookings.length, 'sample bookings');

  // Create payments for completed bookings
  const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED);
  for (const booking of completedBookings) {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.CASH },
    });
  }
  console.log('✅ Created payments for completed bookings');

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   - Admin: admin@reetro.vn / admin123`);
  console.log(`   - Salons: ${salons.length}`);
  console.log(`   - Staff: ${staffRecords.length}`);
  console.log(`   - Services: ${services.length}`);
  console.log(`   - Bookings: ${bookings.length}`);
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
