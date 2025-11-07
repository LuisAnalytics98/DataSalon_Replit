import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import ProgressStepper from "@/components/ProgressStepper";
import ClientInfoForm, { ClientInfo } from "@/components/ClientInfoForm";
import ServiceSelection from "@/components/ServiceSelection";
import StylistSelection from "@/components/StylistSelection";
import DateTimeSelection from "@/components/DateTimeSelection";
import BookingConfirmation from "@/components/BookingConfirmation";
import type { Service, Stylist, BookingWithDetails, Salon } from "@shared/schema";
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from "lucide-react";
import haircutImage from "@assets/generated_images/Haircut_service_image_c010f519.png";
import manicureImage from "@assets/generated_images/Manicure_service_image_c9507d7a.png";
import pedicureImage from "@assets/generated_images/Pedicure_service_image_68db06c2.png";
import sarahImage from "@assets/generated_images/Stylist_profile_Sarah_4931a600.png";
import michaelImage from "@assets/generated_images/Stylist_profile_Michael_18134496.png";
import emmaImage from "@assets/generated_images/Stylist_profile_Emma_62c236b6.png";

const serviceImages: Record<string, string> = {
  haircut: haircutImage,
  manicure: manicureImage,
  pedicure: pedicureImage,
};

const stylistImages: Record<string, string> = {
  sarah: sarahImage,
  michael: michaelImage,
  emma: emmaImage,
};

const steps = [
  { id: 1, label: "Info Cliente" },
  { id: 2, label: "Servicio" },
  { id: 3, label: "Profesional" },
  { id: 4, label: "Fecha y Hora" },
  { id: 5, label: "Confirmar" }
];

export default function Home() {
  const params = useParams<{ salonSlug?: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<{
    clientInfo?: ClientInfo;
    serviceId?: string;
    stylistId?: string;
    date?: Date;
    time?: string;
  }>({});
  const [confirmedBooking, setConfirmedBooking] = useState<BookingWithDetails | null>(null);

  // Get salon slug from URL, default to demo-salon if accessing via root path
  const salonSlug = params.salonSlug || "demo-salon";

  // Reset booking state when salon slug changes to prevent cross-salon data corruption
  useEffect(() => {
    setCurrentStep(1);
    setBookingData({});
    setConfirmedBooking(null);
  }, [salonSlug]);

  // Fetch services from backend
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/public/${salonSlug}/services`],
  });

  // Fetch stylists from backend
  const { data: stylists = [], isLoading: stylistsLoading } = useQuery<Stylist[]>({
    queryKey: [`/api/public/${salonSlug}/stylists`],
  });

  // Fetch salon information
  const { data: salonInfo } = useQuery<Salon>({
    queryKey: [`/api/public/${salonSlug}`],
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: {
      clientInfo: ClientInfo;
      serviceId: string;
      stylistId: string;
      date: Date;
      time: string;
    }) => {
      const response = await apiRequest("POST", `/api/public/${salonSlug}/bookings`, data);
      return await response.json() as BookingWithDetails;
    },
    onSuccess: (data) => {
      setConfirmedBooking(data);
      setCurrentStep(5); // Move to confirmation step after booking is created
      queryClient.invalidateQueries({ queryKey: [`/api/public/${salonSlug}/bookings`] });
    },
  });

  const handleClientInfoSubmit = (data: ClientInfo) => {
    setBookingData({ ...bookingData, clientInfo: data });
    setCurrentStep(2);
  };

  const handleServiceSelect = (serviceId: string) => {
    setBookingData({ ...bookingData, serviceId });
    setCurrentStep(3);
  };

  const handleStylistSelect = (stylistId: string) => {
    setBookingData({ ...bookingData, stylistId });
    setCurrentStep(4);
  };

  const handleDateTimeSelect = (date: Date, time: string) => {
    const updatedBookingData = { ...bookingData, date, time };
    setBookingData(updatedBookingData);

    // Submit booking to backend
    if (updatedBookingData.clientInfo && updatedBookingData.serviceId && updatedBookingData.stylistId) {
      createBookingMutation.mutate({
        clientInfo: updatedBookingData.clientInfo,
        serviceId: updatedBookingData.serviceId,
        stylistId: updatedBookingData.stylistId,
        date,
        time,
      });
    }
    // Note: setCurrentStep(5) is now in onSuccess callback to avoid race condition
  };

  const handleNewBooking = () => {
    setBookingData({});
    setConfirmedBooking(null);
    setCurrentStep(1);
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  const selectedService = services.find(s => s.id === bookingData.serviceId);
  const selectedStylist = stylists.find(s => s.id === bookingData.stylistId);

  // Add images to services and stylists
  const servicesWithImages = services.map(service => ({
    ...service,
    image: service.photo || serviceImages[service.id] || haircutImage, // Use photo from DB, fallback to hardcoded images
  }));

  const stylistsWithImages = stylists.map(stylist => ({
    ...stylist,
    image: stylistImages[stylist.id] || sarahImage,
    rating: stylist.rating / 10, // Convert from 0-50 to 0-5
  }));

  // Filter stylists by selected service
  const filteredStylists = selectedService
    ? (() => {
        const matched = stylistsWithImages.filter(stylist =>
          stylist.specialties.some(specialty =>
            specialty.toLowerCase().includes(selectedService.name.split(' ')[0].toLowerCase()) ||
            selectedService.name.toLowerCase().includes(specialty.toLowerCase())
          )
        );
        // If no stylists match, show all stylists as fallback
        return matched.length > 0 ? matched : stylistsWithImages;
      })()
    : stylistsWithImages;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {currentStep < 5 && (
        <ProgressStepper 
          steps={steps} 
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      )}

      <div className="transition-opacity duration-300">
        {currentStep === 1 && (
          <ClientInfoForm
            onSubmit={handleClientInfoSubmit}
            initialData={bookingData.clientInfo}
          />
        )}

        {currentStep === 2 && (
          <ServiceSelection
            services={servicesWithImages}
            onContinue={handleServiceSelect}
            initialService={bookingData.serviceId}
            isLoading={servicesLoading}
          />
        )}

        {currentStep === 3 && (
          <StylistSelection
            stylists={filteredStylists}
            onContinue={handleStylistSelect}
            initialStylist={bookingData.stylistId}
            isLoading={stylistsLoading}
          />
        )}

        {currentStep === 4 && !createBookingMutation.isPending && (
          <DateTimeSelection
            onContinue={handleDateTimeSelect}
            initialDate={bookingData.date}
            initialTime={bookingData.time}
            stylistId={bookingData.stylistId}
            salonSlug={salonSlug}
          />
        )}

        {createBookingMutation.isPending && (
          <div className="container mx-auto px-4 py-16 max-w-2xl">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Procesando tu reserva...</h2>
              <p className="text-muted-foreground">Por favor espera un momento</p>
            </div>
          </div>
        )}

        {currentStep === 5 && confirmedBooking && (
          <BookingConfirmation
            bookingId={confirmedBooking.bookingReference}
            clientInfo={{
              name: confirmedBooking.client.name,
              email: confirmedBooking.client.email,
              phone: confirmedBooking.client.phone,
              birthDate: confirmedBooking.client.birthDate ? new Date(confirmedBooking.client.birthDate) : undefined,
              notes: confirmedBooking.client.notes || undefined,
            }}
            service={confirmedBooking.service}
            stylist={confirmedBooking.stylist}
            date={new Date(confirmedBooking.appointmentDate)}
            time={confirmedBooking.appointmentTime}
            onNewBooking={handleNewBooking}
            isLoading={false}
          />
        )}
      </div>

      {/* Salon Contact Information Footer */}
      {salonInfo && (currentStep < 5) && (
        <footer className="bg-muted/30 border-t mt-12">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-serif font-bold text-foreground mb-2">{salonInfo.name}</h3>
              {salonInfo.description && (
                <p className="text-muted-foreground">{salonInfo.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground mb-3">Contacto</h4>
                {salonInfo.phone && (
                  <a href={`tel:${salonInfo.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-salon-phone">
                    <Phone className="w-4 h-4" />
                    <span>{salonInfo.phone}</span>
                  </a>
                )}
                {salonInfo.email && (
                  <a href={`mailto:${salonInfo.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-salon-email">
                    <Mail className="w-4 h-4" />
                    <span>{salonInfo.email}</span>
                  </a>
                )}
                {salonInfo.whatsappNumber && (
                  <a href={`https://wa.me/${salonInfo.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-salon-whatsapp">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Location */}
              {salonInfo.location && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">Ubicación</h4>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span data-testid="text-salon-location">{salonInfo.location}</span>
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(salonInfo.instagramUrl || salonInfo.facebookUrl) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground mb-3">Redes Sociales</h4>
                  <div className="flex gap-4">
                    {salonInfo.instagramUrl && (
                      <a href={salonInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-salon-instagram">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {salonInfo.facebookUrl && (
                      <a href={salonInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-salon-facebook">
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
