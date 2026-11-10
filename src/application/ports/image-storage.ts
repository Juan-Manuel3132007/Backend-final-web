export interface ImageFile {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
}

export interface ImageStorage {
  /** Sube la imagen al bucket y devuelve su URL pública. */
  upload(file: ImageFile): Promise<string>;
}
