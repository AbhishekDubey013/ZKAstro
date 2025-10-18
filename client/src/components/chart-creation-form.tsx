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
import { Sparkles, Calendar, Clock, MapPin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dob: "",
      tob: "",
      tz: "America/New_York",
      lat: 0,
      lon: 0,
      placeName: "",
    },
  });

  const createChartMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/chart", {
        dob: values.dob,
        tob: values.tob,
        tz: values.tz,
        place: {
          lat: values.lat,
          lon: values.lon,
          name: values.placeName,
        },
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      toast({
        title: "Chart created!",
        description: "Your natal chart has been generated.",
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
    <Card className="border-violet-200 dark:border-violet-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-violet-50/50 via-blue-50/50 to-teal-50/50 dark:from-violet-950/30 dark:via-blue-950/30 dark:to-teal-950/30">
        <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
          <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          Enter Your Birth Information
        </CardTitle>
        <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          This data is protected with zero-knowledge proofs and never stored
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
                  <FormDescription className="text-xs">IANA timezone (e.g., America/New_York)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
