"use client";

import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  STATUS_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_VALUES,
} from "@/lib/application";
import type { RouterOutputs } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Job = RouterOutputs["jobs"]["list"]["items"][number];

const jobSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required"),
    roleTitle: z.string().min(1, "Role title is required"),
    jobUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
    status: z.enum(STATUS_VALUES),
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

const emptyDefaults: z.infer<typeof jobSchema> = {
  companyName: "",
  roleTitle: "",
  jobUrl: "",
  status: "saved",
  date: undefined as unknown as Date,
  source: "linkedin",
  salaryMin: undefined,
  salaryMax: undefined,
  notes: "",
};

function jobToDefaults(job: Job): z.infer<typeof jobSchema> {
  return {
    companyName: job.companyName,
    roleTitle: job.roleTitle,
    jobUrl: job.jobUrl ?? "",
    status: job.status,
    date: new Date(job.date),
    source: job.source,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    notes: job.notes ?? "",
  };
}

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job;
};

const JobFormDialog = ({ open, onOpenChange, job }: JobFormDialogProps) => {
  const isEditing = !!job;
  const formId = useId();
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(job ? jobToDefaults(job) : emptyDefaults);
    // form.reset is stable across renders; only re-sync when the dialog opens or the target job changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job?.id]);

  const createMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      utils.jobs.list.invalidate();
      utils.jobs.stats.invalidate();
      toast.success("Job added successfully!");
    },
    onError: () => {
      toast.error("Failed to add job. Please try again.");
    },
  });

  const updateMutation = trpc.jobs.update.useMutation({
    onMutate: async (updated) => {
      const listKey = getQueryKey(trpc.jobs.list);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousQueries = queryClient.getQueriesData({
        queryKey: listKey,
      });

      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: RouterOutputs["jobs"]["list"] | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updated.id ? { ...item, ...updated } : item,
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error("Failed to update job. Please try again.");
    },
    onSuccess: (updatedJob) => {
      // Reconcile with the authoritative server row in place — no invalidate/refetch,
      // so the table never flashes a loading skeleton after an already-applied optimistic update.
      const listKey = getQueryKey(trpc.jobs.list);
      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: RouterOutputs["jobs"]["list"] | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updatedJob.id ? updatedJob : item,
            ),
          };
        },
      );
      utils.jobs.getById.setData({ id: updatedJob.id }, updatedJob);
      utils.jobs.stats.invalidate();
      utils.jobs.getTimeline.invalidate({ jobId: updatedJob.id });
      toast.success("Job updated successfully!");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(data: z.infer<typeof jobSchema>) {
    try {
      if (job) {
        await updateMutation.mutateAsync({ id: job.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-lg px-5 py-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Job" : "Add Job"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this job."
                : "Track a new job. Click save when you're done."}
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
                  <span className="text-slate-400 dark:text-slate-500">
                    (optional)
                  </span>
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
                    placeholder="Any details you want to remember about this job..."
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
              <Button variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form={formId}
              disabled={isPending}
              className="bg-blue-700 hover:bg-blue-600 text-white"
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default JobFormDialog;
