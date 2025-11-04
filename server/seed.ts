import { storage } from "./storage";

export async function seedDemoSalon() {
  try {
    // Check if a demo salon already exists
    const existingSalon = await storage.getSalonBySlug("demo-salon");
    if (existingSalon) {
      console.log("Demo salon already exists, skipping seed");
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
        duration: "60 min",
        price: 65,
        currency: "dolares",
      }),
      storage.createService({
        id: `${salon.id}-manicure`,
        salonId: salon.id,
        name: "Manicura",
        description: "Cuidado completo de uñas con limado, pulido y esmaltado",
        duration: "45 min",
        price: 45,
        currency: "dolares",
      }),
      storage.createService({
        id: `${salon.id}-pedicure`,
        salonId: salon.id,
        name: "Pedicura",
        description: "Tratamiento relajante para pies con exfoliación y cuidado de uñas",
        duration: "60 min",
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
