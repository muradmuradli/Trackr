"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, trpc } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const applicationSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    roleTitle: z.string().min(1, "Role title is required"),
    jobUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
    status: z.enum([
      "saved",
      "applied",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
    ]),
    date: z.date({ message: "Date is required" }),
    source: z.enum(["linkedin", "company_website", "other"]),
    salaryMin: z.number().positive().optional(),
    salaryMax: z.number().positive().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.salaryMin || !data.salaryMax || data.salaryMax >= data.salaryMin,
    {
      message: "Max salary must be greater than or equal to min salary",
      path: ["salaryMax"],
    },
  );

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

const SOURCE_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "company_website", label: "Company Website" },
  { value: "other", label: "Other" },
] as const;

const AddApplication = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      companyName: "",
      roleTitle: "",
      jobUrl: "",
      status: "saved",
      date: undefined,
      source: "linkedin",
      salaryMin: undefined,
      salaryMax: undefined,
      notes: "",
    },
  });

  const createMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      utils.jobs.list.invalidate(); // refetches the list after a successful create
    },
  });

  async function onSubmit(data: z.infer<typeof applicationSchema>) {
    try {
      await createMutation.mutateAsync(data);
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <form id="application-form" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-700 hover:bg-blue-600 hover:text-white text-white px-8 py-5"
            variant="outline"
          >
            <Plus />
            Add Application
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg px-5 py-6">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>
              Track a new job application. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="companyName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                    <Input
                      className="py-3"
                      {...field}
                      id="companyName"
                      aria-invalid={fieldState.invalid}
                      placeholder="Acme Inc."
                      autoComplete="name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="roleTitle"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="roleTitle">Role Title</FieldLabel>
                    <Input
                      className="py-3"
                      {...field}
                      id="roleTitle"
                      aria-invalid={fieldState.invalid}
                      placeholder="Web Designer"
                      autoComplete="name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="jobUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="jobUrl">Job URL</FieldLabel>
                  <Input
                    className="py-3"
                    {...field}
                    id="jobUrl"
                    aria-invalid={fieldState.invalid}
                    placeholder="https://acme.com"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="status"
                        className="w-full py-3"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="date">Applied Date</FieldLabel>
                    <Popover
                      open={datePickerOpen}
                      onOpenChange={setDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          type="button"
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "w-full justify-start rounded-lg border-input bg-transparent py-3 font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-1 size-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(selectedDate) => {
                            field.onChange(selectedDate);
                            setDatePickerOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="source"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="source">Source</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="source"
                        className="w-full py-3"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field
                data-invalid={
                  !!(
                    form.formState.errors.salaryMin ||
                    form.formState.errors.salaryMax
                  )
                }
              >
                <FieldLabel htmlFor="salaryMin">
                  Salary Range
                  <span className="text-slate-400">(optional)</span>
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Controller
                    name="salaryMin"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Input
                        className="py-3"
                        id="salaryMin"
                        name={field.name}
                        ref={field.ref}
                        type="number"
                        min={0}
                        aria-invalid={fieldState.invalid}
                        placeholder="Min"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    )}
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Controller
                    name="salaryMax"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Input
                        className="py-3"
                        id="salaryMax"
                        name={field.name}
                        ref={field.ref}
                        type="number"
                        min={0}
                        aria-invalid={fieldState.invalid}
                        placeholder="Max"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    )}
                  />
                </div>
                {(form.formState.errors.salaryMin ||
                  form.formState.errors.salaryMax) && (
                  <FieldError
                    errors={[
                      form.formState.errors.salaryMin,
                      form.formState.errors.salaryMax,
                    ]}
                  />
                )}
              </Field>
            </div>

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="notes">Notes</FieldLabel>
                  <Textarea
                    {...field}
                    id="notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Any details you want to remember about this application..."
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={createMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="application-form"
              disabled={createMutation.isPending}
              className="bg-blue-700 hover:bg-blue-600 text-white"
            >
              {createMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default AddApplication;
