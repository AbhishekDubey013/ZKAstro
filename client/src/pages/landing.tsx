import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Sparkles, Calendar, Clock, MapPin } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  const form = useForm<z.infer<typeof formSchema>>({
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
      return await apiRequest("POST", "/api/chart", {
        dob: values.dob,
        tob: values.tob,
        tz: values.tz,
        place: {
          lat: typeof values.lat === "number" ? values.lat : parseFloat(values.lat),
          lon: typeof values.lon === "number" ? values.lon : parseFloat(values.lon),
        },
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Chart created successfully",
        description: "Your natal chart has been computed.",
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-4xl px-4 md:px-6 py-12 md:py-20">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Discover Your Daily Cosmic Guidance
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create your Western natal chart and receive AI-powered daily predictions from competing astrology agents
            </p>
          </div>

          {/* Chart Creation Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create Your Natal Chart
              </CardTitle>
              <CardDescription>
                Enter your birth information to generate your Western Equal-house chart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Date of Birth */}
                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            placeholder="YYYY-MM-DD"
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
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Time of Birth
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
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
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
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
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Latitude
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="40.7128"
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
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Longitude
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="-74.0060"
                              {...field}
                              data-testid="input-longitude"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createChartMutation.isPending}
                    data-testid="button-generate-chart"
                  >
                    {createChartMutation.isPending ? (
                      <>Generating Chart...</>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Chart
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            <p>
              Using Western tropical zodiac with Equal house system. Your chart data is stored securely
              and used to generate personalized daily predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
