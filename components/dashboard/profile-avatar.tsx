"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getInitials, trpc } from "@/lib/utils";
import { CameraIcon } from "lucide-react";
import { toast } from "sonner";

const ProfileAvatar = ({
  name,
  image,
}: {
  name: string;
  image?: string | null;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const getSignature = trpc.profile.getAvatarUploadSignature.useMutation();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const { signature, timestamp, folder, publicId, apiKey, cloudName } =
        await getSignature.mutateAsync();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey ?? "");
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);
      formData.append("public_id", publicId);
      formData.append("overwrite", "true");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      if (!response.ok) throw new Error("Upload failed");

      const uploaded = await response.json();

      const { error: updateError } = await authClient.updateUser({
        image: uploaded.secure_url,
      });
      if (updateError) throw new Error(updateError.message ?? "Update failed");

      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <Avatar className="h-20 w-20">
        <AvatarImage src={image ?? undefined} />
        <AvatarFallback className="text-xl">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className="absolute -right-1 -bottom-1 rounded-full bg-white dark:bg-slate-900"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        aria-label="Change avatar"
      >
        <CameraIcon className="h-3.5 w-3.5" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ProfileAvatar;
