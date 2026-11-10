import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../../application/errors/app-error";
import type { ImageFile, ImageStorage } from "../../application/ports/image-storage";

/** Sube las imágenes a un bucket público de Supabase Storage (compatible con S3). */
export class SupabaseImageStorage implements ImageStorage {
  private readonly client: SupabaseClient;

  constructor(
    url: string,
    serviceRoleKey: string,
    private readonly bucket: string,
  ) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  async upload(file: ImageFile): Promise<string> {
    const extension = extname(file.originalName).toLowerCase() || ".jpg";
    const path = `products/${Date.now()}-${randomUUID()}${extension}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) {
      console.error("Error subiendo imagen a Supabase:", error.message);
      throw new AppError("No se pudo subir la imagen. Intenta de nuevo.", 502);
    }

    return this.client.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }
}
