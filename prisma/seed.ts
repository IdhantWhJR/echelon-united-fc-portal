import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const squad = await prisma.squad.upsert({
    where: { name: "First Team" },
    update: {},
    create: { name: "First Team", description: "Senior squad" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@echelonunited.com" },
    update: {},
    create: {
      email: "admin@echelonunited.com",
      name: "Club Admin",
      role: "ADMIN",
      passwordHash: password,
      notificationPrefs: { create: {} },
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: "coach@echelonunited.com" },
    update: {},
    create: {
      email: "coach@echelonunited.com",
      name: "Sam Whitfield",
      role: "COACH",
      passwordHash: password,
      notificationPrefs: { create: {} },
    },
  });

  const player = await prisma.user.upsert({
    where: { email: "player@echelonunited.com" },
    update: {},
    create: {
      email: "player@echelonunited.com",
      name: "Alex Morgan",
      role: "PLAYER",
      passwordHash: password,
      notificationPrefs: { create: {} },
      playerProfile: {
        create: {
          jerseyNumber: 9,
          position: "ATTACKER",
          preferredFoot: "RIGHT",
          heightCm: 181,
          status: "ACTIVE",
          squadId: squad.id,
        },
      },
    },
    include: { playerProfile: true },
  });

  const profile = await prisma.playerProfile.findUniqueOrThrow({ where: { userId: player.id } });

  // Sample weight history
  const today = new Date();
  const days = [10, 7, 5, 2, 0];
  const weights = [80.2, 79.8, 79.5, 79.6, 79.1];
  for (let i = 0; i < days.length; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - days[i]);
    await prisma.weightEntry.create({
      data: {
        playerProfileId: profile.id,
        recordedById: player.id,
        weightKg: weights[i],
        date,
      },
    });
  }

  // Sample performance stat
  await prisma.performanceStat.create({
    data: {
      playerProfileId: profile.id,
      updatedById: coach.id,
      periodLabel: "2026/27 Season",
      matchesPlayed: 6,
      starts: 5,
      goals: 4,
      assists: 2,
      minutesPlayed: 480,
      trainingAttendancePct: 92,
      fitnessScore: 87,
      coachRating: 7.6,
    },
  });

  // Sample training event today
  const trainingStart = new Date(today);
  trainingStart.setHours(19, 0, 0, 0);
  const trainingEnd = new Date(trainingStart);
  trainingEnd.setHours(20, 30, 0, 0);

  await prisma.event.create({
    data: {
      title: "Team Training",
      type: "TRAINING",
      date: today,
      startTime: trainingStart,
      endTime: trainingEnd,
      location: "Echelon Training Ground",
      squadId: squad.id,
      createdById: coach.id,
    },
  });

  // Sample announcement
  await prisma.announcement.create({
    data: {
      title: "Kit collection this Friday",
      message:
        "New away kits are in. Collect yours from the equipment room after Friday's session.",
      category: "GENERAL",
      priority: 1,
      targetType: "EVERYONE",
      authorId: admin.id,
    },
  });

  console.log("Seed complete.");
  console.log("Admin login:  admin@echelonunited.com / password123");
  console.log("Coach login:  coach@echelonunited.com / password123");
  console.log("Player login: player@echelonunited.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
