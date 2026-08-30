import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
});

export const weightEntrySchema = z.object({
  playerProfileId: z.string().cuid(),
  weightKg: z.number().positive().max(300),
  date: z.string().datetime().optional(),
  note: z.string().max(280).optional(),
});

export const wellnessCheckinSchema = z.object({
  playerProfileId: z.string().cuid(),
  feeling: z.enum([
    "GREAT",
    "SLIGHTLY_FATIGUED",
    "TIRED",
    "NOT_WELL",
    "INJURED",
    "UNABLE_TO_TRAIN",
  ]),
  sleepQuality: z.number().min(1).max(5).optional(),
  sorenessLevel: z.number().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

export const injuryReportSchema = z.object({
  playerProfileId: z.string().cuid(),
  bodyArea: z.enum([
    "HEAD",
    "NECK",
    "SHOULDER",
    "CHEST",
    "BACK",
    "LOWER_BACK",
    "HIP",
    "GROIN",
    "THIGH",
    "KNEE",
    "CALF",
    "ANKLE",
    "FOOT",
    "OTHER",
  ]),
  painLevel: z.number().min(1).max(10),
  onsetDate: z.string().datetime(),
  mechanism: z.string().max(280).optional(),
  occurredDuring: z.string().max(80).optional(),
  canWalk: z.boolean(),
  canTrain: z.boolean(),
  canPlay: z.boolean(),
  description: z.string().max(1000).optional(),
  mediaUrl: z.string().url().optional(),
});

export const adminCreatePlayerSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
  position: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "ATTACKER"]).optional(),
  preferredFoot: z.enum(["LEFT", "RIGHT", "BOTH"]).optional(),
  heightCm: z.number().min(100).max(230).optional(),
  squadId: z.string().cuid().optional().nullable(),
  status: z.enum(["ACTIVE", "INJURED", "SUSPENDED", "ON_LOAN", "INACTIVE"]).optional(),
  bio: z.string().max(500).optional(),
});

export const adminUpdatePlayerSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  jerseyNumber: z.number().int().min(1).max(99).nullable().optional(),
  position: z.enum(["GOALKEEPER", "DEFENDER", "MIDFIELDER", "ATTACKER"]).nullable().optional(),
  preferredFoot: z.enum(["LEFT", "RIGHT", "BOTH"]).nullable().optional(),
  heightCm: z.number().min(100).max(230).nullable().optional(),
  squadId: z.string().cuid().nullable().optional(),
  status: z.enum(["ACTIVE", "INJURED", "SUSPENDED", "ON_LOAN", "INACTIVE"]).optional(),
  bio: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------
// SELF-SERVICE ACCOUNT (player editing their own record)
// ---------------------------------------------------------------------

export const selfProfileUpdateSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export const selfPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(72),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

export const squadSchema = z.object({
  name: z.string().min(2, "Squad name is too short").max(60),
  description: z.string().max(300).optional(),
});

// ---------------------------------------------------------------------
// CALENDAR / EVENTS / MATCHES / ATTENDANCE
// ---------------------------------------------------------------------

export const eventCreateSchema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  type: z.enum(["TRAINING", "MATCH", "TEAM_EVENT", "OTHER"]),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  location: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  squadId: z.string().cuid().optional().nullable(),
  playerProfileIds: z.array(z.string().cuid()).optional(), // individual assignment
});

export const eventUpdateSchema = eventCreateSchema.partial();

export const attendanceRespondSchema = z.object({
  eventId: z.string().cuid(),
  status: z.enum(["ATTENDING", "UNAVAILABLE", "MAYBE"]),
});

export const attendanceOverrideSchema = z.object({
  eventId: z.string().cuid(),
  playerProfileId: z.string().cuid(),
  status: z.enum(["ATTENDING", "UNAVAILABLE", "MAYBE", "PENDING"]),
});

export const matchCreateSchema = z.object({
  opponent: z.string().min(1, "Opponent is required").max(120),
  competition: z.string().max(120).optional(),
  date: z.string().datetime(),
  kickoff: z.string().datetime(),
  venue: z.string().max(160).optional(),
  homeAway: z.enum(["HOME", "AWAY", "NEUTRAL"]),
  description: z.string().max(1000).optional(),
  squadId: z.string().cuid().optional().nullable(),
  location: z.string().max(160).optional(),
});

export const matchUpdateSchema = z.object({
  opponent: z.string().min(1).max(120).optional(),
  competition: z.string().max(120).nullable().optional(),
  date: z.string().datetime().optional(),
  kickoff: z.string().datetime().optional(),
  venue: z.string().max(160).nullable().optional(),
  homeAway: z.enum(["HOME", "AWAY", "NEUTRAL"]).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]).optional(),
  description: z.string().max(1000).nullable().optional(),
  homeScore: z.number().int().min(0).max(99).nullable().optional(),
  awayScore: z.number().int().min(0).max(99).nullable().optional(),
  matchReport: z.string().max(4000).nullable().optional(),
});

export const injuryStatusUpdateSchema = z.object({
  status: z.enum(["REPORTED", "ASSESSING", "RECOVERING", "CLEARED"]),
  coachNotes: z.string().max(1500).optional(),
});

export const performanceUpdateSchema = z.object({
  playerProfileId: z.string().cuid(),
  periodLabel: z.string().min(1).max(40),
  matchesPlayed: z.number().int().min(0).optional(),
  starts: z.number().int().min(0).optional(),
  goals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  minutesPlayed: z.number().int().min(0).optional(),
  cleanSheets: z.number().int().min(0).optional(),
  trainingAttendancePct: z.number().min(0).max(100).optional(),
  fitnessScore: z.number().min(0).max(100).optional(),
  coachRating: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------
// TRAINING PLANS / WORKOUTS / VIDEO VERIFICATION
// ---------------------------------------------------------------------

export const trainingPlanDayCreateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  focus: z.string().min(2, "Focus is too short").max(80),
  description: z.string().max(500).optional(),
  squadId: z.string().cuid().optional().nullable(),
});

export const trainingPlanDayUpdateSchema = trainingPlanDayCreateSchema.partial();

const workoutExerciseSchema = z.object({
  name: z.string().min(2, "Exercise name is too short").max(120),
  sets: z.number().int().min(1).max(99).nullable().optional(),
  reps: z.string().max(40).nullable().optional(),
  durationSec: z.number().int().min(1).max(86400).nullable().optional(),
  restSec: z.number().int().min(0).max(3600).nullable().optional(),
  order: z.number().int().min(0).max(99).optional(),
});

export const workoutCreateSchema = z.object({
  title: z.string().min(2, "Workout title is too short").max(120),
  description: z.string().max(1000).optional(),
  date: z.string().datetime(),
  deadline: z.string().datetime().optional().nullable(),
  instructions: z.string().max(2000).optional(),
  coachNotes: z.string().max(1000).optional(),
  videoDemoUrl: z.string().url("Demo video URL must be a valid URL").max(500).optional().or(z.literal("")),
  targetType: z.enum(["EVERYONE", "SQUAD", "INDIVIDUAL"]),
  squadId: z.string().cuid().optional().nullable(),
  playerProfileIds: z.array(z.string().cuid()).optional(),
  exercises: z.array(workoutExerciseSchema).min(1, "Add at least one exercise").max(30),
});

export const workoutSubmissionSchema = z.object({
  videoUrl: z.string().url("Video URL must be a valid URL").max(500),
  playerNote: z.string().max(1000).optional(),
});

export const workoutReviewSchema = z.object({
  status: z.enum(["VERIFIED", "NEEDS_REVISION"]),
  coachFeedback: z.string().max(1500).optional(),
});

// ---------------------------------------------------------------------
// ANNOUNCEMENTS / NOTIFICATIONS
// ---------------------------------------------------------------------

export const announcementCreateSchema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  message: z.string().min(2, "Message is too short").max(2000),
  category: z.enum(["IMPORTANT", "MATCH", "TRAINING", "GENERAL", "URGENT"]),
  priority: z.number().int().min(0).max(10).optional(),
  targetType: z.enum(["EVERYONE", "SQUAD", "INDIVIDUAL"]),
  squadId: z.string().cuid().optional().nullable(),
  playerProfileIds: z.array(z.string().cuid()).optional(),
  attachmentUrl: z.string().url("Attachment must be a valid URL").max(500).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------
// LEADERBOARDS / ACHIEVEMENTS
// ---------------------------------------------------------------------

export const leaderboardKeySchema = z.enum([
  "ATTENDANCE",
  "WORKOUTS_COMPLETED",
  "GOALS",
  "ASSISTS",
  "MATCH_APPEARANCES",
  "FITNESS_SCORE",
]);

export const leaderboardVisibilitySchema = z.object({
  key: leaderboardKeySchema,
  visible: z.boolean(),
});

export const achievementCreateSchema = z.object({
  title: z.string().min(2, "Title is too short").max(100),
  description: z.string().max(400).optional(),
  iconKey: z.string().max(40).optional(),
});

export const achievementUpdateSchema = achievementCreateSchema.partial();

export const achievementAwardSchema = z.object({
  playerProfileIds: z.array(z.string().cuid()).min(1, "Choose at least one player"),
});

// ---------------------------------------------------------------------
// PAYMENTS
// ---------------------------------------------------------------------

export const paymentStatusSchema = z.enum(["UNPAID", "PENDING", "PAID", "WAIVED"]);

export const paymentCreateSchema = z
  .object({
    label: z.string().min(2, "Label is too short").max(120),
    amount: z.number().positive("Amount must be greater than 0").max(100000),
    currency: z.string().length(3).default("GBP"),
    dueDate: z.string().datetime().optional().nullable(),
    eventId: z.string().cuid().optional().nullable(),
    matchId: z.string().cuid().optional().nullable(),
    targetType: z.enum(["EVERYONE", "SQUAD", "INDIVIDUAL"]),
    squadId: z.string().cuid().optional().nullable(),
    playerProfileIds: z.array(z.string().cuid()).optional(),
  })
  .refine((d) => d.targetType !== "SQUAD" || !!d.squadId, {
    message: "Choose a squad",
    path: ["squadId"],
  })
  .refine((d) => d.targetType !== "INDIVIDUAL" || (d.playerProfileIds && d.playerProfileIds.length > 0), {
    message: "Choose at least one player",
    path: ["playerProfileIds"],
  });

export const paymentStatusUpdateSchema = z.object({
  status: paymentStatusSchema,
});

export const notificationPreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  announcements: z.boolean().optional(),
  trainingReminders: z.boolean().optional(),
  matchReminders: z.boolean().optional(),
  workoutUpdates: z.boolean().optional(),
  learningContent: z.boolean().optional(),
  polls: z.boolean().optional(),
  paymentReminders: z.boolean().optional(),
  pushSubscriptionJson: z.string().max(4000).optional().nullable(),
});

// ---------------------------------------------------------------------
// WEB PUSH
// ---------------------------------------------------------------------

// Shape of a browser PushSubscription (from PushManager.subscribe()).
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

// ---------------------------------------------------------------------
// DOCUMENTS
// ---------------------------------------------------------------------

export const documentCreateSchema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  category: z.enum([
    "TEAM_RULES",
    "CODE_OF_CONDUCT",
    "TRAINING_GUIDELINES",
    "NUTRITION_GUIDE",
    "FORMS",
    "POLICIES",
    "OTHER",
  ]),
  description: z.string().max(500).optional().or(z.literal("")),
  restrictedToCoachesOnly: z.boolean().optional(),
  // Set by the server after a successful upload — the client never sends
  // an arbitrary fileUrl for a document (that would defeat the point of a
  // real upload route), it sends the storage path returned by /api/upload/document.
  filePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
});

// ---------------------------------------------------------------------
// CLUB SETTINGS
// ---------------------------------------------------------------------

export const clubSettingsUpdateSchema = z.object({
  clubName: z.string().min(2, "Club name is too short").max(80),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  timezone: z.string().min(1).max(60),
});
