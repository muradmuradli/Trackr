"use client";

import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/application";
import { CheckIcon, Loader2Icon, PencilIcon, XIcon } from "lucide-react";

export type JobLookup = Map<string, { company: string; role: string }>;

type ToolPart = {
  type: string;
  state: string;
  input?: unknown;
  output?: unknown;
  approval?: { id: string };
};

type ProposalInput = {
  jobId?: string;
  status?: ApplicationStatus;
  note?: string;
};

type ResultOutput =
  | { error: string }
  | { company: string; role: string; status?: string; note?: string };

const describeProposal = (part: ToolPart, jobLookup: JobLookup) => {
  const input = part.input as ProposalInput | undefined;
  const job = input?.jobId ? jobLookup.get(input.jobId) : undefined;
  const jobLabel = job ? `${job.role} at ${job.company}` : "this application";

  if (part.type === "tool-updateJobStatus") {
    const statusLabel = input?.status ? STATUS_LABELS[input.status] : "…";
    return `Mark ${jobLabel} as ${statusLabel}`;
  }
  if (part.type === "tool-addNote") {
    return `Add a note to ${jobLabel}: "${input?.note ?? ""}"`;
  }
  return "Take an action";
};

const describeResult = (part: ToolPart) => {
  const output = part.output as ResultOutput | undefined;
  if (!output) return "Done.";
  if ("error" in output) return output.error;
  if (part.type === "tool-updateJobStatus") {
    return `Marked ${output.role} at ${output.company} as ${output.status}.`;
  }
  if (part.type === "tool-addNote") {
    return `Added a note to ${output.role} at ${output.company}.`;
  }
  return "Done.";
};

const ChatToolCard = ({
  part,
  jobLookup,
  onRespond,
}: {
  part: ToolPart;
  jobLookup: JobLookup;
  onRespond: (args: { id: string; approved: boolean }) => void;
}) => {
  if (part.state === "approval-requested" && part.approval) {
    const approvalId = part.approval.id;
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-2">
          <PencilIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400" />
          <span className="text-slate-700 dark:text-slate-200">
            {describeProposal(part, jobLookup)}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-slate-500 hover:text-slate-700 dark:text-slate-400"
            onClick={() => onRespond({ id: approvalId, approved: false })}
          >
            Decline
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 bg-blue-700 text-white hover:bg-blue-600"
            onClick={() => onRespond({ id: approvalId, approved: true })}
          >
            Confirm
          </Button>
        </div>
      </div>
    );
  }

  if (
    part.state === "approval-responded" ||
    part.state === "input-streaming" ||
    part.state === "input-available"
  ) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin" />
        {describeProposal(part, jobLookup)}
      </div>
    );
  }

  if (part.state === "output-available") {
    const output = part.output as ResultOutput | undefined;
    const failed = !!output && "error" in output;
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
          failed
            ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
        }`}
      >
        {failed ? (
          <XIcon className="h-4 w-4 shrink-0" />
        ) : (
          <CheckIcon className="h-4 w-4 shrink-0" />
        )}
        {describeResult(part)}
      </div>
    );
  }

  if (part.state === "output-denied") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
        <XIcon className="h-4 w-4 shrink-0" />
        Declined: {describeProposal(part, jobLookup)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
      <XIcon className="h-4 w-4 shrink-0" />
      Couldn&apos;t complete: {describeProposal(part, jobLookup)}
    </div>
  );
};

export default ChatToolCard;
