import BookingConfirmation from "../BookingConfirmation";
import sarahImage from "@assets/generated_images/Stylist_profile_Sarah_4931a600.png";
import haircutImage from "@assets/generated_images/Haircut_service_image_c010f519.png";

export default function BookingConfirmationExample() {
  const mockClientInfo = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    notes: "Please use hypoallergenic products"
  };

  const mockService = {
    id: "haircut",
    name: "Haircut",
    description: "Professional haircut and styling",
    duration: "60 min",
    price: 65,
    image: haircutImage
  };

  const mockStylist = {
    id: "sarah",
    name: "Sarah Johnson",
    specialties: ["Haircut", "Color", "Styling"],
    experience: "8 years",
    rating: 4.9,
    image: sarahImage
  };

  const mockDate = new Date(2025, 10, 15);
  const mockTime = "2:00 PM";

  return (
    <div className="min-h-screen bg-background">
      <BookingConfirmation
        bookingId="BK-2025-001234"
        clientInfo={mockClientInfo}
        service={mockService}
        stylist={mockStylist}
        date={mockDate}
        time={mockTime}
        onNewBooking={() => console.log("New booking clicked")}
      />
    </div>
  );
}
