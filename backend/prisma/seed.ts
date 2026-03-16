import { PrismaClient, Role, LogLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing database
  console.log('Cleaning existing data...');
  await prisma.log.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.document.deleteMany();
  await prisma.report.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password for all seed users ('Password$123')
  const defaultPassword = await bcrypt.hash('Password$123', 10);

  // 3. Create Core Users
  console.log('Creating users (Admins, Organizers, Participants)...');
  const admin = await prisma.user.create({
    data: {
      username: 'SystemAdmin',
      email: 'admin@smartevents.edu',
      password_hash: defaultPassword,
      role: Role.ADMIN,
    },
  });

  const org1 = await prisma.user.create({
    data: {
      username: 'TechDepartment',
      email: 'tech@smartevents.edu',
      password_hash: defaultPassword,
      role: Role.ORG,
    },
  });

  const org2 = await prisma.user.create({
    data: {
      username: 'StudentUnion',
      email: 'union@smartevents.edu',
      password_hash: defaultPassword,
      role: Role.ORG,
    },
  });

  // Create an array of 5 participants
  const participants: any[] = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        username: `Student_${i}`,
        email: `student${i}@smartevents.edu`,
        password_hash: defaultPassword,
        role: Role.USER,
      },
    });
    participants.push(user);
  }

  // 4. Create Events
  console.log('Creating events...');
  
  const event1 = await prisma.event.create({
    data: {
      title: 'Advanced Web Development Hackathon',
      description: 'Join us for a 24-hour coding marathon building full-stack applications with Angular and NestJS. Pizza included!',
      location: 'Main Campus - Building A, Lab 3',
      capacity: 50,
      event_date: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
      is_published: true,
      organizer_id: org1.user_id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Career Fair 2026',
      description: 'Meet 50+ technology employers looking for fresh graduates. Bring your resumes.',
      location: 'University Grand Hall',
      capacity: 500,
      event_date: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
      is_published: true,
      organizer_id: org2.user_id,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: 'Introduction to Cloud Computing',
      description: 'A beginner workshop on Docker, local VirtualBox deployments, and basic scaling.',
      location: 'Online (Zoom Link provided upon registration)',
      capacity: 30,
      event_date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
      is_published: true,
      organizer_id: org1.user_id,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: 'Draft: Quantum Security Algorithms',
      description: 'Currently planning the syllabus for this advanced cryptography talk.',
      location: 'TBD',
      capacity: 100,
      event_date: new Date(new Date().setDate(new Date().getDate() + 45)), // 45 days out
      is_published: false,
      organizer_id: org2.user_id,
    },
  });

  // 5. Create Registrations
  console.log('Registering users to events...');
  
  // Register Student 1 and 2 to Hackathon
  await prisma.registration.createMany({
    data: [
      { user_id: participants[0].user_id, event_id: event1.event_id },
      { user_id: participants[1].user_id, event_id: event1.event_id },
      // Register Student 2, 3, 4 to Career Fair
      { user_id: participants[1].user_id, event_id: event2.event_id },
      { user_id: participants[2].user_id, event_id: event2.event_id },
      { user_id: participants[3].user_id, event_id: event2.event_id },
      // Register Student 5 to Cloud Computing
      { user_id: participants[4].user_id, event_id: event3.event_id },
    ],
  });

  // 6. Create Initial System Logs
  console.log('Adding system audit logs...');
  await prisma.log.createMany({
    data: [
      {
        level: LogLevel.INFO,
        message: 'Platform initialized and seeded with test data.',
        user_id: admin.user_id,
      },
      {
        level: LogLevel.WARN,
        message: 'High registration rate detected for Career Fair 2026.',
      },
    ],
  });

  console.log('✅ Database seeding complete!');
  console.log('----------------------------------------------------');
  console.log('You can now log in with:');
  console.log('Admin: admin@smartevents.edu / Password$123');
  console.log('Org:   tech@smartevents.edu / Password$123');
  console.log('User:  student1@smartevents.edu / Password$123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });