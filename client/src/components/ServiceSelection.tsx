import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import placeholderImage from "@assets/generated_images/Haircut_service_image_c010f519.png";
import type { Service } from "@shared/schema";

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
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {(service.imageUrl || service.photo) ? (
                    <img
                      src={service.imageUrl || service.photo || ""}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
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
