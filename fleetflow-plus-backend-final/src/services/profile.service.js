const User = require("../model/auth.model");
const { publicUser } = require("./auth.service");
const { apiError } = require("../utils/apiResponse");
async function update(user, body) {
  const changes = { bio: body.bio, dob: body.dob };
  if (body.imageData) {
    const [header, base64] = body.imageData.split(",");
    const data = Buffer.from(base64, "base64");
    const jpeg =
      header.includes("jpeg") &&
      data[0] === 255 &&
      data[1] === 216 &&
      data[2] === 255;
    const png =
      header.includes("png") &&
      data
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      header.includes("webp") &&
      data.subarray(0, 4).toString() === "RIFF" &&
      data.subarray(8, 12).toString() === "WEBP";
    if (data.length > 600 * 1024 || !(jpeg || png || webp))
      throw apiError(
        400,
        "INVALID_IMAGE",
        "Use a JPEG, PNG or WebP image of at most 600 KB.",
      );
    const {
      CLOUDINARY_CLOUD_NAME: cloud_name,
      CLOUDINARY_API_KEY: api_key,
      CLOUDINARY_API_SECRET: api_secret,
    } = process.env;
    if (!cloud_name || !api_key || !api_secret)
      throw apiError(
        503,
        "PROFILE_IMAGE_NOT_CONFIGURED",
        "Profile image storage is not configured.",
      );
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    const folder =
      (process.env.CLOUDINARY_FOLDER || "fleetflow")
        .replace(/[^a-zA-Z0-9_/-]/g, "")
        .replace(/^\/+|\/+$/g, "") || "fleetflow";
    const result = await cloudinary.uploader.upload(body.imageData, {
      resource_type: "image",
      public_id: `${folder}/profiles/${user.id}`,
      overwrite: true,
      invalidate: true,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 512, height: 512, crop: "limit" }],
      timeout: 20000,
    });
    if (!result.secure_url?.startsWith("https://"))
      throw apiError(503, "IMAGE_UPLOAD_FAILED", "Image upload failed.");
    changes.profileImage = result.secure_url;
    changes.profileImagePublicId = result.public_id;
  }
  const updated = await User.findByIdAndUpdate(
    user.id,
    { $set: changes },
    { new: true, runValidators: true },
  );
  if (!updated) throw apiError(404, "ACCOUNT_NOT_FOUND", "Account not found.");
  return publicUser(updated);
}
module.exports = { update };
