import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Sparkles, Calendar, Clock, MapPin, Shield, Stars, Zap, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateChartClientSide, generateZKProof } from "@/lib/astro-client";

const formSchema = z.object({
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)"),
  tob: z.string().regex(/^\d{2}:\d{2}$/, "Please enter a valid time (HH:MM)"),
  tz: z.string().min(1, "Please select a timezone"),
  lat: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(-90).max(90)),
  lon: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(-180).max(180)),
});

const commonTimezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [zkMode, setZkMode] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dob: "",
      tob: "12:00",
      tz: "America/New_York",
      lat: "40.7128",
      lon: "-74.0060",
    },
  });

  const createChartMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const lat = typeof values.lat === "number" ? values.lat : parseFloat(values.lat);
      const lon = typeof values.lon === "number" ? values.lon : parseFloat(values.lon);

      if (zkMode) {
        const chartCalc = await calculateChartClientSide(
          values.dob,
          values.tob,
          values.tz,
          lat,
          lon
        );

        const { commitment, proof, salt } = await generateZKProof(
          values.dob,
          values.tob,
          values.tz,
          lat,
          lon,
          chartCalc
        );

        const response = await apiRequest("POST", "/api/chart", {
          zkEnabled: true,
          inputsHash: commitment,
          zkProof: proof,
          zkSalt: salt,
          params: {
            quant: "centi-deg" as const,
            zodiac: "tropical" as const,
            houseSystem: "equal" as const,
            planets: chartCalc.planets,
            retro: chartCalc.retro,
            asc: chartCalc.asc,
            mc: chartCalc.mc,
          },
        });
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/chart", {
          dob: values.dob,
          tob: values.tob,
          tz: values.tz,
          place: { lat, lon },
        });
        return await response.json();
      }
    },
    onSuccess: (data: any) => {
      console.log('Chart creation response:', data);
      const chartId = data?.chartId;
      if (!chartId) {
        console.error('No chartId in response:', data);
        toast({
          title: "Error",
          description: "Chart created but missing ID",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Chart created successfully",
        description: "Your natal chart has been computed.",
      });
      setLocation(`/chart/${chartId}`);
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl px-4 md:px-6 py-12 md:py-20 relative">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          {/* Cosmic Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <Moon className="h-12 w-12 text-primary animate-pulse" />
              <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
                Cosmic Predictions
              </span>
            </h1>
            <div className="relative">
              <Stars className="h-12 w-12 text-secondary animate-pulse" />
              <div className="absolute inset-0 blur-2xl bg-secondary/30 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Unlock the secrets of the cosmos with{" "}
            <span className="text-primary font-semibold">AI-powered astrology</span>
          </p>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your Western natal chart and receive personalized daily predictions 
            from competing AI agents powered by real astronomical calculations
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Real Astronomical Data</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <Shield className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">Zero-Knowledge Privacy</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-chart-3/10 border border-chart-3/20">
              <Stars className="h-4 w-4 text-chart-3" />
              <span className="text-sm font-medium">Competing AI Agents</span>
            </div>
          </div>
        </div>

        {/* Chart Creation Form */}
        <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
              </div>
              Create Your Natal Chart
            </CardTitle>
            <CardDescription className="text-base">
              Enter your birth information to generate your Western Equal-house chart
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 text-primary" />
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="YYYY-MM-DD"
                          className="h-11 border-primary/20 focus-visible:ring-primary"
                          {...field}
                          data-testid="input-dob"
                        />
                      </FormControl>
                      <FormDescription>Your birth date (YYYY-MM-DD)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time of Birth */}
                <FormField
                  control={form.control}
                  name="tob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-primary" />
                        Time of Birth
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="h-11 border-primary/20 focus-visible:ring-primary"
                          {...field}
                          data-testid="input-tob"
                        />
                      </FormControl>
                      <FormDescription>24-hour format (HH:MM)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Timezone */}
                <FormField
                  control={form.control}
                  name="tz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-primary/20 focus:ring-primary" data-testid="select-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonTimezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Your birth location timezone</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Birth Location */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base">
                          <MapPin className="h-4 w-4 text-secondary" />
                          Latitude
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="40.7128"
                            className="h-11 border-primary/20 focus-visible:ring-primary"
                            {...field}
                            data-testid="input-latitude"
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
                        <FormLabel className="flex items-center gap-2 text-base">
                          <MapPin className="h-4 w-4 text-secondary" />
                          Longitude
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="-74.0060"
                            className="h-11 border-primary/20 focus-visible:ring-primary"
                            {...field}
                            data-testid="input-longitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ZK Privacy Mode Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-primary/20 p-5 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative mt-0.5">
                      <Shield className="h-6 w-6 text-primary" />
                      <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-base">Zero-Knowledge Privacy Mode</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        Calculate chart locally in browser using cryptographic proofs. 
                        Your birth data never leaves your device.
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={zkMode}
                    onCheckedChange={setZkMode}
                    className="ml-4"
                    data-testid="switch-zk-mode"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all"
                  disabled={createChartMutation.isPending}
                  data-testid="button-generate-chart"
                >
                  {createChartMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Chart...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {zkMode ? "Generate Chart (ZK Mode)" : "Generate Chart"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-16 text-center space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm">
              Using Western tropical zodiac with Equal house system powered by VSOP87 astronomical calculations
            </p>
            <Sparkles className="h-4 w-4 text-secondary" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 pt-8">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <div className="text-3xl mb-3">🔮</div>
              <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground">
                Competing agents analyze your chart using different methodologies
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-semibold mb-2">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                Zero-knowledge proofs keep your birth data completely private
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-chart-3/10 to-transparent border border-chart-3/20">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">Daily Predictions</h3>
              <p className="text-sm text-muted-foreground">
                Receive personalized cosmic guidance based on real transits
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
