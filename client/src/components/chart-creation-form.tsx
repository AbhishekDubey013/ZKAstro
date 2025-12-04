import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Calendar, Clock, MapPin, Navigation, Lock, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

const formSchema = z.object({
  dob: z.string().min(1, "Date of birth is required"),
  tob: z.string().min(1, "Time of birth is required"),
  tz: z.string().min(1, "Timezone is required"),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  placeName: z.string().min(1, "Place name is required"),
});

export default function ChartCreationForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { user: privyUser } = usePrivy();

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const privyUserId = privyUser?.wallet?.address || privyUser?.email?.address || null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dob: "",
      tob: "",
      tz: systemTimezone || "America/New_York",
      lat: 0,
      lon: 0,
      placeName: "",
    },
  });

  useEffect(() => {
    if (systemTimezone) {
      form.setValue("tz", systemTimezone);
    }
  }, [systemTimezone, form]);

  const createChartMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { calculateChartClientSide, generateZKProof } = await import('@/lib/astro-client');
      
      try {
        toast({
          title: "Calculating positions...",
          description: "Your data stays in your browser",
        });
        
        const positions = await calculateChartClientSide(
          values.dob,
          values.tob,
          values.tz,
          values.lat,
          values.lon
        );

        toast({
          title: "Generating proof...",
          description: "Creating cryptographic verification",
        });
        
        const zkProof = await generateZKProof(
          values.dob,
          values.tob,
          values.tz,
          values.lat,
          values.lon,
          positions
        );

        toast({
          title: "Proof generated",
          description: `${zkProof.commitment.substring(0, 16)}...`,
        });

        const response = await apiRequest("POST", "/api/chart", {
          zkEnabled: true,
          privyUserId: privyUserId,
          inputsHash: zkProof.commitment,
          zkProof: zkProof.proof,
          zkSalt: zkProof.salt,
          params: {
            quant: "centi-deg",
            zodiac: "tropical",
            houseSystem: "equal",
            planets: positions.planets,
            retro: positions.retro,
            asc: positions.asc,
            mc: positions.mc,
          },
        });
        
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to create chart");
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      
      toast({
        title: "Chart created",
        description: "Your natal chart is ready",
      });
      
      if (data.onChain?.recorded) {
        toast({
          title: "Recorded on-chain",
          description: (
            <a 
              href={data.onChain.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              View transaction →
            </a>
          ),
          duration: 8000,
        });
      }
      
      setLocation(`/chart/${data.chartId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createChartMutation.mutate(values);
  };

  const detectLocation = async () => {
    setDetectingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive",
      });
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        form.setValue("lat", latitude);
        form.setValue("lon", longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || "";
            const state = data.address.state || "";
            const country = data.address.country || "";
            const placeName = [city, state, country].filter(Boolean).join(", ");
            
            if (placeName) {
              form.setValue("placeName", placeName);
            }
          }
        } catch (error) {
          console.error("Geocoding failed:", error);
        }

        toast({
          title: "Location found",
          description: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
        
        setDetectingLocation(false);
      },
      (error) => {
        toast({
          title: "Detection failed",
          description: "Please enter location manually.",
          variant: "destructive",
        });
        setDetectingLocation(false);
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Privacy notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Zero-knowledge privacy</p>
          <p className="text-xs text-muted-foreground">
            Your birth data is calculated locally and never sent to our servers. Only cryptographic proofs are transmitted.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date of Birth
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11"
                      {...field}
                      data-testid="input-dob"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Time of Birth
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="h-11"
                      {...field}
                      data-testid="input-tob"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tz"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Timezone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="America/New_York"
                    className="h-11"
                    {...field}
                    data-testid="input-timezone"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Detected: {systemTimezone}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">Birth Location</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="text-xs h-8"
                data-testid="button-detect-location"
              >
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                {detectingLocation ? "Detecting..." : "Use current location"}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="placeName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="City, State, Country"
                      className="h-11"
                      {...field}
                      data-testid="input-place-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="40.7128"
                        className="h-10 text-sm"
                        {...field}
                        data-testid="input-lat"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-74.0060"
                        className="h-10 text-sm"
                        {...field}
                        data-testid="input-lon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={createChartMutation.isPending}
            className="w-full h-12 text-base font-semibold group"
            data-testid="button-create-chart"
          >
            {createChartMutation.isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating chart...
              </>
            ) : (
              <>
                Generate Chart
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
