import { protectedProcedure, router } from "../trpc";
import cloudinary from "@/lib/cloudinary";

export const profileRouter = router({
  // Avatars are public-facing (unlike job documents), so they're uploaded as
  // Cloudinary's default "upload" delivery type and can be used directly as
  // an <img src>. A fixed public_id per user means re-uploading overwrites
  // the previous avatar instead of accumulating orphaned images.
  getAvatarUploadSignature: protectedProcedure.mutation(async ({ ctx }) => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "trackr/avatars";
    const publicId = ctx.session.user.id;

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, public_id: publicId, overwrite: true },
      cloudinary.config().api_secret!,
    );

    return {
      signature,
      timestamp,
      folder,
      publicId,
      apiKey: cloudinary.config().api_key,
      cloudName: cloudinary.config().cloud_name,
    };
  }),
});
