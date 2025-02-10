import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpouseSchema, type Spouse } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Heart, Upload, Skull } from "lucide-react";

type InsertSpouse = {
  userName: string;
  spouseName: string;
  imageData: string;
}

export default function Home() {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>();

  const form = useForm({
    resolver: zodResolver(insertSpouseSchema),
    defaultValues: {
      userName: "",
      spouseName: "",
      imageData: "",
    }
  });

  const { data: spouses, isLoading } = useQuery<Spouse[]>({
    queryKey: ["/api/spouses"],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: InsertSpouse) => {
      const response = await apiRequest("POST", "/api/spouses", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spouses"] });
      form.reset();
      setPreviewUrl(undefined);
      toast({
        title: "Success!",
        description: "Your spouse has been added to the collection",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add spouse",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue("imageData", base64String);
        setPreviewUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  }, [form]);

  const onSubmit = form.handleSubmit((data) => {
    mutate(data);
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Skull className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Upload your cult of the lamb spouse!</h1>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="spouseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spouse Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter spouse name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageData"
                      render={() => (
                        <FormItem>
                          <FormLabel>Upload Image</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="cursor-pointer"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isPending} className="w-full">
                      {isPending ? (
                        "Adding..."
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Add Spouse
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-card rounded-lg p-4 flex items-center justify-center">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-[300px] rounded-lg object-contain"
                      />
                    ) : (
                      <div className="text-muted-foreground text-center">
                        <Upload className="w-12 h-12 mx-auto mb-2" />
                        <p>Click to upload an image</p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-4">
                  <Skeleton className="h-[200px] w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : spouses?.map((spouse) => (
            <Card key={spouse.id} className="overflow-hidden transition-transform hover:scale-[1.02]">
              <CardContent className="p-4">
                <img 
                  src={spouse.imageData} 
                  alt={spouse.spouseName}
                  className="w-full h-[200px] object-cover rounded-lg mb-4"
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <h3 className="font-semibold">{spouse.spouseName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Added by {spouse.userName}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}