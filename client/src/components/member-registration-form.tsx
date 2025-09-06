import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMemberSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Dumbbell, CheckCircle } from "lucide-react";

const memberRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().min(1, "Phone is required"),
  age: z.number().min(1).optional().nullable(),
  branchId: z.string().min(1, "Branch ID is required"),
  membershipPlan: z.enum(["monthly", "quarterly", "yearly"]),
  membershipStart: z.date(),
  membershipEnd: z.date(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
});

type MemberRegistrationData = z.infer<typeof memberRegistrationSchema>;

export default function MemberRegistrationForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [branchId, setBranchId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Get branch ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const branchIdParam = urlParams.get('branchId');
    if (branchIdParam) {
      setBranchId(branchIdParam);
    }
  }, []);

  const form = useForm<MemberRegistrationData>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      age: undefined,
      branchId: branchId,
      membershipPlan: "monthly",
      membershipStart: new Date(),
      membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  useEffect(() => {
    if (branchId) {
      form.setValue("branchId", branchId);
    }
  }, [branchId, form]);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/members", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "You have been successfully registered as a gym member.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemberRegistrationData) => {
    // Calculate membership end date based on plan
    const startDate = new Date(data.membershipStart);
    let endDate = new Date(startDate);
    
    switch (data.membershipPlan) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "yearly":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Format data for the API
    const apiData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      age: data.age || null,
      branchId: data.branchId,
      membershipPlan: data.membershipPlan,
      membershipStart: startDate.toISOString(),
      membershipEnd: endDate.toISOString(),
      status: "active" as const
    };

    registerMutation.mutate(apiData);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-chart-2 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Welcome to the Gym!</h2>
            <p className="text-muted-foreground">
              Your registration has been completed successfully. You can now start using the gym facilities.
            </p>
            <Button 
              onClick={() => window.close()} 
              className="w-full"
              data-testid="button-close"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">FitManage Pro</span>
          </div>
          <CardTitle data-testid="text-registration-title">Member Registration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in your details to join our gym
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                data-testid="input-name"
                {...form.register("name")}
                placeholder="Enter your full name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                data-testid="input-phone"
                {...form.register("phone")}
                placeholder="Enter your phone number"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                {...form.register("email")}
                placeholder="Enter your email address"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                data-testid="input-age"
                type="number"
                {...form.register("age", { valueAsNumber: true })}
                placeholder="Enter your age"
              />
              {form.formState.errors.age && (
                <p className="text-sm text-destructive">{form.formState.errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipPlan">Membership Plan *</Label>
              <Select 
                value={form.watch("membershipPlan")} 
                onValueChange={(value) => form.setValue("membershipPlan", value as any)}
              >
                <SelectTrigger data-testid="select-membership-plan">
                  <SelectValue placeholder="Select membership plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly - ₹2,500</SelectItem>
                  <SelectItem value="quarterly">Quarterly - ₹7,000</SelectItem>
                  <SelectItem value="yearly">Yearly - ₹25,000</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.membershipPlan && (
                <p className="text-sm text-destructive">{form.formState.errors.membershipPlan.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Registering..." : "Register Now"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
