"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createCommunity } from "@/lib/communities/api";

const formSchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(80, "Community name is too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description is too long"),
  image: z.string().url("Please enter a valid image URL").or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCommunityForm = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", image: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    try {
      const community = await createCommunity({
        name: data.name,
        description: data.description,
        image: data.image || undefined,
      });
      router.push(`/communities/${community.slug}`);
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create community",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">
              Community name <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="name"
              className="bg-[#FAFAFA] border-none h-12 rounded-lg shadow text-sm"
              placeholder="e.g Medicinal Chemistry Research Hub"
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="description">
              Description <span className="text-red-500">*</span>
            </FieldLabel>
            <FieldDescription>
              Tell people what this community is about and who it&apos;s for.
            </FieldDescription>
            <Textarea
              id="description"
              className="bg-[#FAFAFA] border-none min-h-32 rounded-lg shadow text-sm"
              placeholder="A space for researchers exploring medicinal chemistry…"
              {...register("description")}
            />
            {errors.description && (
              <FieldError>{errors.description.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="image">Cover image URL (optional)</FieldLabel>
            <Input
              id="image"
              className="bg-[#FAFAFA] border-none h-12 rounded-lg shadow text-sm"
              placeholder="https://…"
              {...register("image")}
            />
            {errors.image && <FieldError>{errors.image.message}</FieldError>}
          </Field>

          {submitError && <FieldError>{submitError}</FieldError>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create community"}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default CreateCommunityForm;