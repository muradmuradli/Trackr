"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/utils";
import { format } from "date-fns";
import { FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const JobDocuments = ({ jobId }: { jobId: string }) => {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents } = trpc.documents.list.useQuery({ jobId });

  const getSignature = trpc.documents.getUploadSignature.useMutation();
  const createDocument = trpc.documents.create.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate({ jobId });
      toast.success("Document uploaded successfully!");
    },
  });
  const getDownloadUrl = trpc.documents.getDownloadUrl.useMutation();

  const deleteMutation = trpc.documents.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.documents.list.cancel({ jobId });
      const previous = utils.documents.list.getData({ jobId });
      utils.documents.list.setData({ jobId }, (old) =>
        old?.filter((doc) => doc.id !== id),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        utils.documents.list.setData({ jobId }, context.previous);
      }
      toast.error("Failed to delete document. Please try again.");
    },
    onSuccess: () => {
      toast.success("Document deleted successfully!");
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const { signature, timestamp, folder, type, apiKey, cloudName } =
        await getSignature.mutateAsync({ jobId });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey ?? "");
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);
      formData.append("type", type);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData },
      );

      if (!response.ok) throw new Error("Upload failed");

      const uploaded = await response.json();

      await createDocument.mutateAsync({
        jobId,
        name: file.name,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        format: uploaded.format,
        size: uploaded.bytes,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenDocument(id: string) {
    try {
      const { url } = await getDownloadUrl.mutateAsync({ id });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      toast.error("Failed to open document. Please try again.");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Documents</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <UploadIcon className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ul className="mt-4 grid gap-2">
        {documents?.map((doc) => (
          <li
            key={doc.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <FileTextIcon className="h-4 w-4" />
            </span>
            <button
              type="button"
              onClick={() => handleOpenDocument(doc.id)}
              className="min-w-0 text-left"
            >
              <p className="truncate text-sm font-medium text-slate-700 hover:underline dark:text-slate-300">
                {doc.name}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {doc.format?.toUpperCase()} · {formatBytes(doc.size)} ·{" "}
                {format(new Date(doc.createdAt), "MMM d, yyyy")}
              </p>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete document"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove{" "}
                    <strong>{doc.name}</strong>. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive! text-white! hover:bg-destructive/90!"
                    onClick={() => deleteMutation.mutate({ id: doc.id })}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
        {documents?.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No documents attached yet.
          </li>
        )}
      </ul>
    </section>
  );
};

export default JobDocuments;
