"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.email({ message: "Invalid email address" }),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z
    .string()
    .trim()
    .min(1, "Please add a message")
    .max(5000, "Keep it under 5000 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const defaultValues: ContactFormValues = {
  name: "",
  email: "",
  title: "",
  description: "",
};

const ContactForm = () => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  const sendMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      form.reset(defaultValues);
      toast.success("Message sent! I'll get back to you soon.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  async function onSubmit(data: ContactFormValues) {
    await sendMutation.mutateAsync(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-name">
                  Name{" "}
                  <span className="text-slate-400 dark:text-slate-500">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="contact-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-email">
                  Your email
                </FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="contact-email"
                  aria-invalid={fieldState.invalid}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-title">Title</FieldLabel>
              <Input
                className="py-3"
                {...field}
                id="contact-title"
                aria-invalid={fieldState.invalid}
                placeholder="What's this about?"
                autoComplete="off"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-description">
                Description
              </FieldLabel>
              <Textarea
                {...field}
                id="contact-description"
                aria-invalid={fieldState.invalid}
                placeholder="Bug report, feature idea, question — whatever it is."
                className="min-h-32"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        disabled={sendMutation.isPending}
        className="mt-4 bg-blue-700 px-5 py-5 text-white hover:bg-blue-600"
      >
        {sendMutation.isPending ? "Sending..." : "Send message"}
        <SendIcon />
      </Button>
    </form>
  );
};

export default ContactForm;
