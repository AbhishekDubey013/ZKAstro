import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Sparkles, Calendar, Clock, MapPin, Shield, Stars, Zap, Moon, Sun } from "lucide-react";
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

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-violet-50 via-blue-50 to-teal-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-teal-950/20 relative overflow-hidden">
      {/* Vibrant Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bright gradient orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-violet-400 to-purple-300 dark:from-violet-600 dark:to-purple-500 opacity-30 dark:opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-gradient-to-br from-teal-400 to-cyan-300 dark:from-teal-600 dark:to-cyan-500 opacity-30 dark:opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-300 dark:from-blue-600 dark:to-indigo-500 opacity-20 dark:opacity-15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating stars effect */}
        <div className="absolute top-20 right-1/4 text-yellow-400 opacity-60 animate-pulse">
          <Stars className="h-8 w-8" />
        </div>
        <div className="absolute bottom-32 left-1/4 text-yellow-400 opacity-60 animate-pulse" style={{ animationDelay: '1s' }}>
          <Stars className="h-6 w-6" />
        </div>
        <div className="absolute top-1/2 right-1/3 text-yellow-400 opacity-60 animate-pulse" style={{ animationDelay: '2s' }}>
          <Sparkles className="h-7 w-7" />
        </div>
      </div>

      <div className="container max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 relative">
        {/* Hero Section */}
        <div className="text-center space-y-6 sm:space-y-8 mb-12 sm:mb-16">
          {/* Vibrant Title */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-4 sm:mb-6">
            <div className="relative">
              <Sun className="h-10 w-10 sm:h-14 sm:w-14 text-yellow-500 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-0 blur-xl bg-yellow-400/40 rounded-full animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-600 dark:from-violet-400 dark:via-blue-400 dark:to-teal-400 bg-clip-text text-transparent animate-gradient">
                Cosmic Predictions
              </span>
            </h1>
            <div className="relative">
              <Moon className="h-10 w-10 sm:h-14 sm:w-14 text-blue-500 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-blue-400/40 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            Unlock the secrets of the cosmos with{" "}
            <span className="text-violet-600 dark:text-violet-400 font-semibold">AI-powered astrology</span>
          </p>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Create your Western natal chart and receive personalized daily predictions 
            from competing AI agents powered by real astronomical calculations
          </p>

          {/* Vibrant Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-4 px-4">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-300 dark:border-violet-700">
              <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs sm:text-sm font-medium text-violet-700 dark:text-violet-300">Real Astronomical Data</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-300 dark:border-teal-700">
              <Shield className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-300">Zero-Knowledge Privacy</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300 dark:border-blue-700">
              <Stars className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Competing AI Agents</span>
            </div>
          </div>
        </div>

        {/* Login Button - Centered above chart */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={handleLogin}
            variant="outline"
            className="border-violet-300 dark:border-violet-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-8 h-11"
            data-testid="button-login"
          >
            Login
          </Button>
        </div>

        {/* Chart Creation Form */}
        <Card className="max-w-2xl mx-auto border-violet-200 dark:border-violet-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-2xl">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-violet-50/50 via-blue-50/50 to-teal-50/50 dark:from-violet-950/30 dark:via-blue-950/30 dark:to-teal-950/30">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
              <div className="relative">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600 dark:text-violet-400" />
                <div className="absolute inset-0 blur-lg bg-violet-400/30 rounded-full" />
              </div>
              Create Your Natal Chart
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Enter your birth information to generate your Western Equal-house chart
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        Date of Birth
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="YYYY-MM-DD"
                          className="h-11 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400"
                          {...field}
                          data-testid="input-dob"
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">Your birth date (YYYY-MM-DD)</FormDescription>
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
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        Time of Birth
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="h-11 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400"
                          {...field}
                          data-testid="input-tob"
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">24-hour format (HH:MM)</FormDescription>
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
                      <FormLabel className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-violet-200 dark:border-violet-800 focus:ring-violet-500 dark:focus:ring-violet-400" data-testid="select-timezone">
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
                      <FormDescription className="text-xs sm:text-sm">Your birth location timezone</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Birth Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          Latitude
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="40.7128"
                            className="h-11 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400"
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
                        <FormLabel className="flex items-center gap-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          Longitude
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="-74.0060"
                            className="h-11 border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 dark:focus-visible:ring-violet-400"
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-violet-200 dark:border-violet-800 p-4 sm:p-5 bg-gradient-to-r from-violet-50/50 to-teal-50/50 dark:from-violet-950/30 dark:to-teal-950/30">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative mt-0.5">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                      <div className="absolute inset-0 blur-lg bg-teal-400/30 rounded-full" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">Zero-Knowledge Privacy Mode</div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Calculate chart locally in browser using cryptographic proofs. 
                        Your birth data never leaves your device.
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={zkMode}
                    onCheckedChange={setZkMode}
                    className="self-end sm:self-auto"
                    data-testid="switch-zk-mode"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-sm sm:text-base bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
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
                      <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {zkMode ? "Generate Chart (ZK Mode)" : "Generate Chart"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-12 sm:mt-16 text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <p className="text-xs sm:text-sm">
              Using Western tropical zodiac with Equal house system powered by VSOP87 astronomical calculations
            </p>
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-8">
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-200 dark:border-violet-800">
              <div className="text-3xl sm:text-4xl mb-3">🔮</div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-gray-900 dark:text-gray-100">AI-Powered Insights</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Competing agents analyze your chart using different methodologies
              </p>
            </div>
            
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800">
              <div className="text-3xl sm:text-4xl mb-3">🔐</div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-gray-900 dark:text-gray-100">Privacy First</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Zero-knowledge proofs keep your birth data completely private
              </p>
            </div>
            
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800">
              <div className="text-3xl sm:text-4xl mb-3">✨</div>
              <h3 className="font-semibold text-base sm:text-lg mb-2 text-gray-900 dark:text-gray-100">Daily Predictions</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Receive personalized cosmic guidance based on real transits
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
