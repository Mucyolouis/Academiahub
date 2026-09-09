"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldError,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Upload, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { uploadFileWithProgress } from "@/lib/upload-client";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunities } from "@/lib/communities/api";

const PDF_MIME = "application/pdf";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const formSchema = z.object({
  file: z
    .custom<File>()
    .refine((file) => file instanceof File, "Please upload a PDF document")
    .refine(
      (file) => file instanceof File && file.type === PDF_MIME,
      "Only PDF files are allowed",
    )
    .refine(
      (file) => file instanceof File && file.size <= MAX_FILE_BYTES,
      "File must be 10MB or smaller",
    ),
  title: z.string().min(3, "Title is required"),
  description: z
    .string()
    .min(10, "Description is required")
    .max(1000, "Description is too long"),
  category: z.string().min(1, "Please select a category"),
  institution: z.string().min(3, "Institution is required"),
  year: z.string().min(4, "Year is required"),
  communityIds: z
    .array(z.string())
    .min(1, "Select at least one community"),
});

type FormValues = z.infer<typeof formSchema>;

const CATEGORY_OPTIONS = [
  { value: "research", label: "Research" },
  { value: "seminar", label: "Seminar Paper" },
  { value: "project", label: "Final Year Project" },
  { value: "analysis", label: "Analysis" },
] as const;

const formatMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

const UploadForm = () => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const {
    register,
    resetField,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      institution: "",
      year: "",
      communityIds: [],
    },
  });

  const selectedFile = watch("file");

  const joinedCommunitiesQuery = useQuery({
    queryKey: ["communities", "joined"],
    queryFn: () => fetchCommunities({ joined: true, limit: 100 }),
  });

  const joinedCommunities = joinedCommunitiesQuery.data?.communities ?? [];
  const selectedCommunityIds = watch("communityIds");

  const toggleCommunity = useCallback(
    (communityId: string) => {
      setValue(
        "communityIds",
        selectedCommunityIds.includes(communityId)
          ? selectedCommunityIds.filter((id) => id !== communityId)
          : [...selectedCommunityIds, communityId],
        { shouldValidate: true },
      );
    },
    [selectedCommunityIds, setValue],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setUploadError(null);
      if (!file) return;

      if (file.type !== PDF_MIME) {
        setUploadError("Only PDF files are allowed");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setUploadError("File must be 10MB or smaller");
        return;
      }

      setValue("file", file, { shouldValidate: true });
    },
    [setValue],
  );

  const handleRemoveFile = useCallback(() => {
    resetField("file");
    setUploadError(null);
  }, [resetField]);

  const onSubmit = async (data: FormValues) => {
    setUploadError(null);
    setProgress(0);

    try {
      const uploaded = await uploadFileWithProgress(
        data.file,
        "document",
        setProgress,
      );

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          category: data.category,
          institution: data.institution,
          year: data.year,
          fileUrl: uploaded.url,
          fileKey: uploaded.key,
          fileName: uploaded.fileName,
          fileSize: uploaded.bytes,
          communityIds: data.communityIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save document");
      }

      router.push("/profile");
      router.refresh();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "An error occurred",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full">
      <FieldSet className="">
        <h4 className="hidden md:block">Upload material</h4>
        <FieldDescription className="text-grey max-sm:text-[10px]">
          Share your research, seminar papers, or academic projects with the
          community
        </FieldDescription>

        <FieldGroup>
          {/* PDF UPLOAD */}
          <Field>
            <FieldLabel htmlFor="file">Document (PDF)</FieldLabel>

            <div className="relative min-h-39.5 lg:min-h-50 border-dashed border-grey border rounded-lg flex items-center justify-center overflow-hidden">
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                className="absolute top-0 left-0 w-full h-full opacity-0  cursor-pointer"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />

              {selectedFile ? (
                <>
                  <X
                    size={24}
                    strokeWidth={1.5}
                    className="absolute text-primary cursor-pointer top-2 right-2 z-10"
                    onClick={handleRemoveFile}
                  />

                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        PDF
                      </span>
                    </div>
                    <p className="font-medium truncate max-w-62.5">
                      {selectedFile.name}
                    </p>
                    <small className="text-grey">
                      {isSubmitting && progress > 0
                        ? `Uploading ${progress}%`
                        : `${formatMb(selectedFile.size)} MB`}
                    </small>
                  </div>

                  {isSubmitting ? (
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-grey/20 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-[width] duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload size={32} strokeWidth={1.5} />
                  <p>Click to upload PDF document</p>
                  <small>PDF up to 10MB</small>
                </div>
              )}
            </div>

            {errors.file && <FieldError>{errors.file.message}</FieldError>}
            {uploadError && <FieldError>{uploadError}</FieldError>}
          </Field>

          {/* TITLE */}
          <Field>
            <FieldLabel htmlFor="title">
              Title <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="title"
              className="bg-[#FAFAFA] text-sm leading-3.5 tracking-normal placeholder:text-grey placeholder:text-sm placeholder:leading-3.5 placeholder:tracking-normal border-none h-12 rounded-lg shadow"
              placeholder="e.g Analysis of Renewable Energy Solutions in Nigeria."
              {...register("title")}
            />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </Field>

          {/* DESCRIPTION */}
          <Field>
            <FieldLabel htmlFor="description">
              Abstract / Description <span className="text-red-500">*</span>
            </FieldLabel>
            <Textarea
              id="description"
              className="bg-[#FAFAFA] text-sm leading-6 tracking-normal placeholder:text-grey placeholder:text-sm placeholder:leading-3.5 placeholder:tracking-normal border-none min-h-12 rounded-lg shadow"
              placeholder="Short abstract or summary"
              {...register("description")}
            />
            {errors.description && (
              <FieldError>{errors.description.message}</FieldError>
            )}
          </Field>

          {/* CATEGORY */}
          <Field>
            <FieldLabel htmlFor="category">
              Category <span className="text-red-500">*</span>
            </FieldLabel>

            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-[#FAFAFA] text-sm leading-3.5 tracking-normal placeholder:text-grey placeholder:text-sm placeholder:leading-3.5 placeholder:tracking-normal border-none h-14 cursor-pointer rounded-lg shadow">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <FieldError>{errors.category.message}</FieldError>
            )}
          </Field>

          {/* COMMUNITIES */}
          <Field>
            <FieldLabel htmlFor="communities">
              Communities <span className="text-red-500">*</span>
            </FieldLabel>
            <FieldDescription>
              Select one or more communities to publish this document to.
            </FieldDescription>

            {joinedCommunitiesQuery.isLoading ? (
              <div className="bg-[#FAFAFA] border-none h-14 rounded-lg shadow flex items-center px-4 text-sm text-grey">
                Loading communities...
              </div>
            ) : joinedCommunities.length === 0 ? (
              <div className="bg-[#FAFAFA] border-none rounded-lg shadow px-4 py-4 text-sm text-grey space-y-2">
                <p>
                  You haven&apos;t joined any communities yet. Join or create one
                  to publish your document.
                </p>
                <Link
                  href="/communities"
                  className="text-primary font-medium underline underline-offset-2"
                >
                  Browse communities
                </Link>
              </div>
            ) : (
              <div className="bg-[#FAFAFA] border-none rounded-lg shadow px-4 py-3 flex flex-col gap-1 max-h-48 overflow-y-auto">
                {joinedCommunities.map((community) => {
                  const checked = selectedCommunityIds.includes(community.id);
                  return (
                    <label
                      key={community.id}
                      htmlFor={`community-${community.id}`}
                      className={`flex justify-between items-center gap-3 cursor-pointer rounded-lg px-2 py-2.5 text-sm transition-colors ${
                        checked ? "bg-primary/10" : "hover:bg-grey/10"
                      }`}
                    >
                      <span className="font-medium">{community.name}</span>
                      <input
                        id={`community-${community.id}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCommunity(community.id)}
                        className="size-4 cursor-pointer accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            )}
            {errors.communityIds && (
              <FieldError>{errors.communityIds.message}</FieldError>
            )}
          </Field>

          {/* INSTITUTION & YEAR */}
          <div className="flex items-center gap-4 justify-between">
            <div className="basis-1/2">
              <Field>
                <FieldLabel htmlFor="institution">
                  Institution <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="institution"
                  className="bg-[#FAFAFA] text-sm leading-3.5 tracking-normal placeholder:text-grey placeholder:text-sm placeholder:leading-3.5 placeholder:tracking-normal border-none h-12 rounded-lg shadow"
                  placeholder="e.g University of Lagos"
                  {...register("institution")}
                />
                {errors.institution && (
                  <FieldError>{errors.institution.message}</FieldError>
                )}
              </Field>
            </div>

            <div className="basis-1/2">
              <Field>
                <FieldLabel htmlFor="year">
                  Year <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="year"
                  className="bg-[#FAFAFA] text-sm leading-3.5 tracking-normal placeholder:text-grey placeholder:text-sm placeholder:leading-3.5 placeholder:tracking-normal border-none h-12 rounded-lg shadow"
                  placeholder="e.g 2025"
                  {...register("year")}
                />
                {errors.year && <FieldError>{errors.year.message}</FieldError>}
              </Field>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload"}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default UploadForm;
