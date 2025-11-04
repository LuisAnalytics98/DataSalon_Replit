import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import haircutImage from "@assets/generated_images/Haircut_service_image_c010f519.png";
import manicureImage from "@assets/generated_images/Manicure_service_image_c9507d7a.png";
import pedicureImage from "@assets/generated_images/Pedicure_service_image_68db06c2.png";

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  image: string;
}

const services: Service[] = [
  {
    id: "haircut",
    name: "Corte de Cabello",
    description: "Corte de cabello profesional y peinado adaptado a tus preferencias",
    duration: "60 min",
    price: 65,
    image: haircutImage,
  },
  {
    id: "manicure",
    name: "Manicura",
    description: "Cuidado completo de uñas con limado, pulido y esmaltado",
    duration: "45 min",
    price: 45,
    image: manicureImage,
  },
  {
    id: "pedicure",
    name: "Pedicura",
    description: "Tratamiento relajante para pies con exfoliación y cuidado de uñas",
    duration: "60 min",
    price: 55,
    image: pedicureImage,
  },
];

interface ServiceSelectionProps {
  services: Service[];
  onContinue: (serviceId: string) => void;
  initialService?: string;
  isLoading?: boolean;
}

export default function ServiceSelection({ services, onContinue, initialService, isLoading = false }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<string | null>(initialService || null);

  const handleContinue = () => {
    if (selectedService) {
      onContinue(selectedService);
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-3">
            Elige tu Servicio
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona el servicio que deseas reservar hoy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service) => {
            const isSelected = selectedService === service.id;
            
            return (
              <Card
                key={service.id}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg",
                  isSelected && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedService(service.id)}
                data-testid={`card-service-${service.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                    {service.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="text-2xl font-bold text-foreground">
                    ${service.price}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedService}
            className="px-12"
            data-testid="button-continue-service"
          >
            Continuar a Selección de Estilista
          </Button>
        </div>
      </div>
    </div>
  );
}
