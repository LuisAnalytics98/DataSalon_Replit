import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import salonHeroImage from "@assets/generated_images/Salon_interior_hero_image_fa71b9a1.png";

const clientInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  notes: z.string().optional(),
});

export type ClientInfo = z.infer<typeof clientInfoSchema>;

interface ClientInfoFormProps {
  onSubmit: (data: ClientInfo) => void;
  initialData?: Partial<ClientInfo>;
}

export default function ClientInfoForm({ onSubmit, initialData }: ClientInfoFormProps) {
  const form = useForm<ClientInfo>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      notes: initialData?.notes || "",
    },
  });

  return (
    <div className="min-h-[calc(100vh-88px)]">
      <div className="relative h-[30vh] sm:h-[40vh] overflow-hidden">
        <img 
          src={salonHeroImage} 
          alt="Elegant salon interior" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3">
              Welcome to Our Salon
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Let's get started with your booking
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Tell us about yourself
          </h2>
          <p className="text-muted-foreground text-base">
            We'll use this information to confirm your appointment
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name" 
                      {...field} 
                      data-testid="input-name"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="your.email@example.com" 
                      {...field} 
                      data-testid="input-email"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="(555) 123-4567" 
                      {...field} 
                      data-testid="input-phone"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any allergies, preferences, or special requests..."
                      rows={4}
                      {...field} 
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                size="lg"
                className="px-12"
                data-testid="button-continue"
              >
                Continue to Services
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
