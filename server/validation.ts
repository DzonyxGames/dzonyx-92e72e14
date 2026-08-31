import { detectComicImage } from "./storage";

export class ValidationError extends Error {}

export function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(label + " is required.");
  }
  const cleaned = value.trim();
  if (cleaned.length > maxLength) {
    throw new ValidationError(label + " is too long.");
  }
  return cleaned;
}

export function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function integerInRange(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new ValidationError(
      label + " must be a whole number from " + min + " to " + max + ".",
    );
  }
  return value;
}

export async function comicImageFromRequest(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ValidationError("Choose an image to upload.");
  }
  if (file.size < 32 || file.size > 8 * 1024 * 1024) {
    throw new ValidationError("Images must be smaller than 8 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectComicImage(bytes);
  if (!contentType) {
    throw new ValidationError("Use a JPG, PNG or WebP image.");
  }
  return { bytes, contentType };
}

export function validationResponse(error: unknown) {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return null;
}
