import { storage } from "./storage";

// Auto-link new users to demo salon during development/testing
export async function ensureUserHasDemoSalonAccess(userId: string) {
  try {
    // Check if user already has salon access
    const userWithSalon = await storage.getUserWithSalon(userId);
    if (userWithSalon && userWithSalon.salon) {
      return; // User already has salon access
    }

    // Verify user exists in database
    const user = await storage.getUser(userId);
    if (!user) {
      console.log(`[DEV] User ${userId} not found in database yet - skipping salon link`);
      return;
    }

    // Get demo salon
    const demoSalon = await storage.getSalonBySlug("demo-salon");
    if (!demoSalon) {
      console.error("Demo salon not found - cannot link user");
      return;
    }

    // Link user to demo salon as admin
    await storage.createSalonUser({
      userId,
      salonId: demoSalon.id,
      role: "admin",
    });

    console.log(`[DEV] Auto-linked user ${userId} to demo salon as admin`);
  } catch (error) {
    console.error("Error ensuring user has demo salon access:", error);
  }
}

export async function seedDemoSalon() {
  try {
    // Check if a demo salon already exists
    const existingSalon = await storage.getSalonBySlug("demo-salon");
    if (existingSalon) {
      console.log("Demo salon already exists");
      return existingSalon;
    }

    console.log("Creating demo salon...");

    // Create demo salon
    const salon = await storage.createSalon({
      name: "Data Salon",
      slug: "demo-salon",
      description: "Salón de belleza premium en el corazón de Madrid",
    });

    // Create demo services
    console.log("Seeding services...");
    await Promise.all([
      storage.createService({
        id: `${salon.id}-haircut`,
        salonId: salon.id,
        name: "Corte de Cabello",
        description: "Corte de cabello profesional y peinado adaptado a tus preferencias",
        duration: 60,
        price: 65,
        currency: "dolares",
      }),
      storage.createService({
        id: `${salon.id}-manicure`,
        salonId: salon.id,
        name: "Manicura",
        description: "Cuidado completo de uñas con limado, pulido y esmaltado",
        duration: 30,
        price: 45,
        currency: "dolares",
      }),
      storage.createService({
        id: `${salon.id}-pedicure`,
        salonId: salon.id,
        name: "Pedicura",
        description: "Tratamiento relajante para pies con exfoliación y cuidado de uñas",
        duration: 60,
        price: 55,
        currency: "dolares",
      }),
    ]);

    // Create demo stylists
    console.log("Seeding stylists...");
    await Promise.all([
      storage.createStylist({
        id: `${salon.id}-sarah`,
        salonId: salon.id,
        name: "Sarah Johnson",
        specialties: ["Corte", "Color", "Peinado"],
        experience: "8 años",
        rating: 49,
      }),
      storage.createStylist({
        id: `${salon.id}-michael`,
        salonId: salon.id,
        name: "Michael Chen",
        specialties: ["Corte", "Recorte de Barba", "Peinado"],
        experience: "6 años",
        rating: 48,
      }),
      storage.createStylist({
        id: `${salon.id}-emma`,
        salonId: salon.id,
        name: "Emma Davis",
        specialties: ["Manicura", "Pedicura", "Arte de Uñas"],
        experience: "5 años",
        rating: 50,
      }),
    ]);

    console.log("Demo salon created successfully:", salon.slug);
    return salon;
  } catch (error) {
    console.error("Error seeding demo salon:", error);
    throw error;
  }
}
