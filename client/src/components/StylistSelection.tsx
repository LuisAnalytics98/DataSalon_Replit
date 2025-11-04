import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stylist } from "@shared/schema";

interface StylistSelectionProps {
  stylists: Stylist[];
  onContinue: (stylistId: string) => void;
  initialStylist?: string;
  isLoading?: boolean;
}

export default function StylistSelection({ stylists, onContinue, initialStylist, isLoading = false }: StylistSelectionProps) {
  const [selectedStylist, setSelectedStylist] = useState<string | null>(initialStylist || null);

  const handleContinue = () => {
    if (selectedStylist) {
      onContinue(selectedStylist);
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-3">
            Elige tu Estilista
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona tu estilista preferido
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {stylists.map((stylist) => {
            const isSelected = selectedStylist === stylist.id;
            
            return (
              <Card
                key={stylist.id}
                className={cn(
                  "p-8 cursor-pointer transition-all duration-300 hover:shadow-lg",
                  isSelected && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedStylist(stylist.id)}
                data-testid={`card-stylist-${stylist.id}`}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0">
                    {stylist.imageUrl ? (
                      <img
                        src={stylist.imageUrl}
                        alt={stylist.name}
                        className="w-32 h-32 rounded-xl object-cover mx-auto sm:mx-0"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center mx-auto sm:mx-0">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                      {stylist.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-3 justify-center sm:justify-start">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-semibold text-foreground">{stylist.rating}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        • {stylist.experience} de experiencia
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {stylist.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
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
            disabled={!selectedStylist}
            className="px-12"
            data-testid="button-continue-stylist"
          >
            Continuar a Fecha y Hora
          </Button>
        </div>
      </div>
    </div>
  );
}
