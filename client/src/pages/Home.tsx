import { useState } from "react";
import ProgressStepper from "@/components/ProgressStepper";
import ClientInfoForm, { ClientInfo } from "@/components/ClientInfoForm";
import ServiceSelection from "@/components/ServiceSelection";
import StylistSelection from "@/components/StylistSelection";
import DateTimeSelection from "@/components/DateTimeSelection";
import BookingConfirmation from "@/components/BookingConfirmation";
import haircutImage from "@assets/generated_images/Haircut_service_image_c010f519.png";
import manicureImage from "@assets/generated_images/Manicure_service_image_c9507d7a.png";
import pedicureImage from "@assets/generated_images/Pedicure_service_image_68db06c2.png";
import sarahImage from "@assets/generated_images/Stylist_profile_Sarah_4931a600.png";
import michaelImage from "@assets/generated_images/Stylist_profile_Michael_18134496.png";
import emmaImage from "@assets/generated_images/Stylist_profile_Emma_62c236b6.png";

const services = [
  {
    id: "haircut",
    name: "Haircut",
    description: "Professional haircut and styling tailored to your preferences",
    duration: "60 min",
    price: 65,
    image: haircutImage,
  },
  {
    id: "manicure",
    name: "Manicure",
    description: "Complete nail care with shaping, buffing, and polish",
    duration: "45 min",
    price: 45,
    image: manicureImage,
  },
  {
    id: "pedicure",
    name: "Pedicure",
    description: "Relaxing foot treatment with exfoliation and nail care",
    duration: "60 min",
    price: 55,
    image: pedicureImage,
  },
];

const stylists = [
  {
    id: "sarah",
    name: "Sarah Johnson",
    specialties: ["Haircut", "Color", "Styling"],
    experience: "8 years",
    rating: 4.9,
    image: sarahImage,
  },
  {
    id: "michael",
    name: "Michael Chen",
    specialties: ["Haircut", "Beard Trim", "Styling"],
    experience: "6 years",
    rating: 4.8,
    image: michaelImage,
  },
  {
    id: "emma",
    name: "Emma Davis",
    specialties: ["Manicure", "Pedicure", "Nail Art"],
    experience: "5 years",
    rating: 5.0,
    image: emmaImage,
  },
];

const steps = [
  { id: 1, label: "Client Info" },
  { id: 2, label: "Service" },
  { id: 3, label: "Stylist" },
  { id: 4, label: "Date & Time" },
  { id: 5, label: "Confirm" }
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<{
    clientInfo?: ClientInfo;
    serviceId?: string;
    stylistId?: string;
    date?: Date;
    time?: string;
  }>({});

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
    setBookingData({ ...bookingData, date, time });
    setCurrentStep(5);
  };

  const handleNewBooking = () => {
    setBookingData({});
    setCurrentStep(1);
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  };

  const selectedService = services.find(s => s.id === bookingData.serviceId);
  const selectedStylist = stylists.find(s => s.id === bookingData.stylistId);

  return (
    <div className="min-h-screen bg-background">
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
            onContinue={handleServiceSelect}
            initialService={bookingData.serviceId}
          />
        )}

        {currentStep === 3 && (
          <StylistSelection
            onContinue={handleStylistSelect}
            initialStylist={bookingData.stylistId}
          />
        )}

        {currentStep === 4 && (
          <DateTimeSelection
            onContinue={handleDateTimeSelect}
            initialDate={bookingData.date}
            initialTime={bookingData.time}
          />
        )}

        {currentStep === 5 && bookingData.clientInfo && selectedService && bookingData.date && bookingData.time && (
          <BookingConfirmation
            bookingId={`BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`}
            clientInfo={bookingData.clientInfo}
            service={selectedService}
            stylist={selectedStylist || null}
            date={bookingData.date}
            time={bookingData.time}
            onNewBooking={handleNewBooking}
          />
        )}
      </div>
    </div>
  );
}
