import { config } from "dotenv";
config();

import { db } from "./server/db/index";
import { rooms } from "./server/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    const defaultRooms = [
      {
        slug: "general",
        name: "الغرفة العامة",
        description: "أهلاً بكم في الغرفة العامة للجميع",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
      },
      {
        slug: "events",
        name: "غرفة المسابقات",
        description: "مسابقات وألعاب تفاعلية مباشرة",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
      }
    ];

    for (const r of defaultRooms) {
      const existing = await db.select().from(rooms).where(eq(rooms.slug, r.slug)).limit(1);
      if (existing.length === 0) {
        await db.insert(rooms).values({
          slug: r.slug,
          name: r.name,
          description: r.description,
          avatarUrl: r.image,
          isPublic: true,
          micSlots: 5
        });
        console.log(`Inserted room: ${r.slug}`);
      } else {
        console.log(`Room exists: ${r.slug}`);
      }
    }
    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}

seed();
