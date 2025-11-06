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
import type { Service, Stylist, BookingWithDetails } from "@shared/schema";
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

    setCurrentStep(5);
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
    ? stylistsWithImages.filter(stylist =>
        stylist.specialties.some(specialty =>
          specialty.toLowerCase().includes(selectedService.name.split(' ')[0].toLowerCase()) ||
          selectedService.name.toLowerCase().includes(specialty.toLowerCase())
        )
      )
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

        {currentStep === 4 && (
          <DateTimeSelection
            onContinue={handleDateTimeSelect}
            initialDate={bookingData.date}
            initialTime={bookingData.time}
            stylistId={bookingData.stylistId}
            salonSlug={salonSlug}
          />
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
            service={{
              id: confirmedBooking.service.id,
              name: confirmedBooking.service.name,
              description: confirmedBooking.service.description,
              duration: confirmedBooking.service.duration,
              price: confirmedBooking.service.price,
              image: confirmedBooking.service.photo || serviceImages[confirmedBooking.service.id] || haircutImage,
            }}
            stylist={confirmedBooking.stylist ? {
              id: confirmedBooking.stylist.id,
              name: confirmedBooking.stylist.name,
              specialties: confirmedBooking.stylist.specialties,
              experience: confirmedBooking.stylist.experience,
              rating: confirmedBooking.stylist.rating / 10,
              image: stylistImages[confirmedBooking.stylist.id] || sarahImage,
            } : null}
            date={new Date(confirmedBooking.appointmentDate)}
            time={confirmedBooking.appointmentTime}
            onNewBooking={handleNewBooking}
            isLoading={createBookingMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
