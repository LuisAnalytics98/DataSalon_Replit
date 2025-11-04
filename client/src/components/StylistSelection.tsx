import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import sarahImage from "@assets/generated_images/Stylist_profile_Sarah_4931a600.png";
import michaelImage from "@assets/generated_images/Stylist_profile_Michael_18134496.png";
import emmaImage from "@assets/generated_images/Stylist_profile_Emma_62c236b6.png";

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  experience: string;
  rating: number;
  image: string;
}

const stylists: Stylist[] = [
  {
    id: "sarah",
    name: "Sarah Johnson",
    specialties: ["Corte", "Color", "Peinado"],
    experience: "8 años",
    rating: 4.9,
    image: sarahImage,
  },
  {
    id: "michael",
    name: "Michael Chen",
    specialties: ["Corte", "Recorte de Barba", "Peinado"],
    experience: "6 años",
    rating: 4.8,
    image: michaelImage,
  },
  {
    id: "emma",
    name: "Emma Davis",
    specialties: ["Manicura", "Pedicura", "Arte de Uñas"],
    experience: "5 años",
    rating: 5.0,
    image: emmaImage,
  },
];

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
            Selecciona tu estilista preferido o elige cualquiera disponible
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card
            className={cn(
              "p-8 cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center",
              selectedStylist === "any" && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedStylist("any")}
            data-testid="card-stylist-any"
          >
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 text-accent-foreground" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
              Cualquier Estilista Disponible
            </h3>
            <p className="text-sm text-muted-foreground">
              Obtén el primer horario disponible
            </p>
            <Badge className="mt-4" variant="secondary">Primero Disponible</Badge>
          </Card>

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
                    <img
                      src={stylist.image}
                      alt={stylist.name}
                      className="w-32 h-32 rounded-xl object-cover mx-auto sm:mx-0"
                    />
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
