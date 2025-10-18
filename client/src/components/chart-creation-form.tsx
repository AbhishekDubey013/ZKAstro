import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Sparkles, Calendar, Clock, MapPin, Navigation } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";

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

  // Auto-detect system timezone
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

  // Auto-fill timezone on mount
  useEffect(() => {
    if (systemTimezone) {
      form.setValue("tz", systemTimezone);
    }
  }, [systemTimezone, form]);

  const createChartMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // ZK MODE: Calculate positions client-side and generate proof
      const { calculateChartClientSide, generateZKProof } = await import('@/lib/astro-client');
      
      try {
        // 1. Calculate chart positions in the browser (birth data never leaves)
        const positions = await calculateChartClientSide(
          values.dob,
          values.tob,
          values.tz,
          values.lat,
          values.lon
        );

        // 2. Generate cryptographic ZK proof using Poseidon hash
        const zkProof = await generateZKProof(
          values.dob,
          values.tob,
          values.tz,
          values.lat,
          values.lon,
          positions
        );

        // 3. Send ONLY proof + positions to server (no raw birth data!)
        const response = await apiRequest("POST", "/api/chart", {
          zkEnabled: true,
          inputsHash: zkProof.commitment,
          zkProof: zkProof.proof,
          zkSalt: zkProof.salt,
          params: {
            quant: "centi-degrees",
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
        throw new Error(error.message || "Failed to create chart with ZK proof");
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      toast({
        title: "Chart created with Zero-Knowledge proof!",
        description: "Your birth data was never sent to the server. Privacy guaranteed.",
      });
      setLocation(`/chart/${data.chartId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating chart",
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
        title: "Geolocation not supported",
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

        // Try to get place name from reverse geocoding
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
          console.error("Reverse geocoding failed:", error);
        }

        toast({
          title: "Location detected!",
          description: `Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`,
        });
        
        setDetectingLocation(false);
      },
      (error) => {
        toast({
          title: "Location detection failed",
          description: error.message || "Please enter your location manually.",
          variant: "destructive",
        });
        setDetectingLocation(false);
      }
    );
  };

  return (
    <Card className="border-violet-200 dark:border-violet-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-violet-50/50 via-blue-50/50 to-teal-50/50 dark:from-violet-950/30 dark:via-blue-950/30 dark:to-teal-950/30">
        <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
          <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          Enter Your Birth Information
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          🔐 <span className="font-semibold text-violet-600 dark:text-violet-400">Zero-Knowledge Privacy Active</span> - Your birth data is calculated in your browser and never sent to our servers. Only cryptographic proofs are transmitted.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Date of Birth
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11 border-violet-200 dark:border-violet-800"
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
                  <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Time of Birth
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="h-11 border-violet-200 dark:border-violet-800"
                      {...field}
                      data-testid="input-tob"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-300">Timezone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="America/New_York"
                      className="h-11 border-violet-200 dark:border-violet-800"
                      {...field}
                      data-testid="input-timezone"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Auto-detected: {systemTimezone}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-gray-700 dark:text-gray-300">Location</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="border-violet-300 dark:border-violet-700"
                  data-testid="button-detect-location"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {detectingLocation ? "Detecting..." : "Auto-Detect Location"}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="40.7128"
                          className="h-11 border-violet-200 dark:border-violet-800"
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="-74.0060"
                          className="h-11 border-violet-200 dark:border-violet-800"
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

            <FormField
              control={form.control}
              name="placeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Place Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="New York, NY, USA"
                      className="h-11 border-violet-200 dark:border-violet-800"
                      {...field}
                      data-testid="input-place-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={createChartMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white font-semibold"
              data-testid="button-create-chart"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {createChartMutation.isPending ? "Creating Chart..." : "Generate My Chart"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
