import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function createDb() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const demoTimelines = [
  {
    email: "demo1@significanthobbies.demo",
    name: "Alex Rivera",
    username: "alexrivera",
    avatarSeed: "alex",
    timeline: {
      title: "A life through music and movement",
      slug: "demo-alex",
      phases: [
        {
          id: "p1",
          label: "Childhood",
          ageStart: 6,
          ageEnd: 12,
          order: 0,
          hobbies: [
            { name: "Piano", intensity: 3 },
            { name: "Swimming", intensity: 4 },
            { name: "Drawing", intensity: 2 },
          ],
        },
        {
          id: "p2",
          label: "Teenager",
          ageStart: 13,
          ageEnd: 17,
          order: 1,
          hobbies: [
            { name: "Guitar", intensity: 5 },
            { name: "Swimming", intensity: 3 },
            { name: "Video games", intensity: 4 },
            { name: "Skateboarding", intensity: 3 },
          ],
        },
        {
          id: "p3",
          label: "College",
          ageStart: 18,
          ageEnd: 22,
          order: 2,
          hobbies: [
            { name: "Guitar", intensity: 4 },
            { name: "Running", intensity: 3 },
            { name: "Video games", intensity: 3 },
            { name: "Cooking", intensity: 2 },
          ],
        },
        {
          id: "p4",
          label: "Early career",
          ageStart: 23,
          ageEnd: 28,
          order: 3,
          hobbies: [
            { name: "Running", intensity: 5 },
            { name: "Cooking", intensity: 4 },
            { name: "Reading", intensity: 3 },
            { name: "Piano", intensity: 2 },
          ],
        },
        {
          id: "p5",
          label: "Now",
          ageStart: 29,
          ageEnd: 32,
          order: 4,
          hobbies: [
            { name: "Running", intensity: 4 },
            { name: "Cooking", intensity: 5 },
            { name: "Reading", intensity: 4 },
            { name: "Guitar", intensity: 3 },
            { name: "Yoga", intensity: 3 },
          ],
        },
      ],
    },
  },
  {
    email: "demo2@significanthobbies.demo",
    name: "Sam Chen",
    username: "samchen",
    avatarSeed: "sam",
    timeline: {
      title: "The curious mind's journey",
      slug: "demo-sam",
      phases: [
        {
          id: "q1",
          label: "Early years",
          ageStart: 7,
          ageEnd: 11,
          order: 0,
          hobbies: [
            { name: "Reading", intensity: 5 },
            { name: "Chess", intensity: 3 },
          ],
        },
        {
          id: "q2",
          label: "School",
          ageStart: 12,
          ageEnd: 17,
          order: 1,
          hobbies: [
            { name: "Reading", intensity: 5 },
            { name: "Coding", intensity: 4 },
            { name: "Chess", intensity: 4 },
          ],
        },
        {
          id: "q3",
          label: "University",
          ageStart: 18,
          ageEnd: 22,
          order: 2,
          hobbies: [
            { name: "Coding", intensity: 5 },
            { name: "Philosophy", intensity: 4 },
            { name: "Hiking", intensity: 3 },
          ],
        },
        {
          id: "q4",
          label: "Working life",
          ageStart: 23,
          ageEnd: 30,
          order: 3,
          hobbies: [
            { name: "Coding", intensity: 4 },
            { name: "Reading", intensity: 5 },
            { name: "Woodworking", intensity: 3 },
            { name: "Chess", intensity: 3 },
          ],
        },
      ],
    },
  },
  {
    email: "demo3@significanthobbies.demo",
    name: "Jordan Lee",
    username: "jordanlee",
    avatarSeed: "jordan",
    timeline: {
      title: "Creative seasons",
      slug: "demo-jordan",
      phases: [
        {
          id: "r1",
          label: "Childhood",
          ageStart: 5,
          ageEnd: 12,
          order: 0,
          hobbies: [
            { name: "Painting", intensity: 5 },
            { name: "Dance", intensity: 4 },
            { name: "Origami", intensity: 3 },
          ],
        },
        {
          id: "r2",
          label: "Teens",
          ageStart: 13,
          ageEnd: 18,
          order: 1,
          hobbies: [
            { name: "Photography", intensity: 4 },
            { name: "Writing", intensity: 5 },
            { name: "Dance", intensity: 3 },
          ],
        },
        {
          id: "r3",
          label: "20s",
          ageStart: 19,
          ageEnd: 27,
          order: 2,
          hobbies: [
            { name: "Writing", intensity: 4 },
            { name: "Photography", intensity: 5 },
            { name: "Ceramics", intensity: 3 },
            { name: "Yoga", intensity: 4 },
          ],
        },
        {
          id: "r4",
          label: "30s",
          ageStart: 28,
          ageEnd: 35,
          order: 3,
          hobbies: [
            { name: "Painting", intensity: 5 },
            { name: "Writing", intensity: 3 },
            { name: "Yoga", intensity: 5 },
            { name: "Ceramics", intensity: 4 },
          ],
        },
      ],
    },
  },
];

async function main() {
  const db = await createDb();
  console.log("🌱 Seeding database...");

  try {
    for (const demo of demoTimelines) {
      const user = await db.user.upsert({
        where: { email: demo.email },
        update: { username: demo.username },
        create: {
          email: demo.email,
          name: demo.name,
          username: demo.username,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demo.avatarSeed}`,
        },
      });

      await db.timeline.upsert({
        where: { slug: demo.timeline.slug },
        update: { phases: JSON.stringify(demo.timeline.phases) },
        create: {
          userId: user.id,
          title: demo.timeline.title,
          visibility: "PUBLIC",
          slug: demo.timeline.slug,
          phases: JSON.stringify(demo.timeline.phases),
        },
      });

      console.log(`  ✓ ${demo.name} (@${demo.username})`);
    }
    console.log("✅ Seeding complete!");
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
