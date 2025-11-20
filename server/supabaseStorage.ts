import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from '@supabase/supabase-js';
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
} from "./objectAcl.js";

// Load .env.local file FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

// Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'salon-assets';

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with Supabase Storage.
export class SupabaseStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    // For Supabase, we use bucket paths
    return ['public'];
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    return 'private';
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<{ path: string; bucket: string } | null> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('public', {
          search: filePath.split('/').pop(),
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      // Find exact match
      const exactMatch = data.find(file => file.name === filePath.split('/').pop());
      if (exactMatch) {
        return {
          path: `public/${exactMatch.name}`,
          bucket: STORAGE_BUCKET,
        };
      }

      return null;
    } catch (error) {
      console.error('[STORAGE] Error searching public object:', error);
      return null;
    }
  }

  // Downloads an object to the response.
  async downloadObject(
    path: string,
    res: Response,
    cacheTtlSec: number = 3600,
    isPublic: boolean = false
  ) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(path);

      if (error || !data) {
        throw new ObjectNotFoundError();
      }

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get content type from path
      const contentType = this.getContentType(path);

      // Set appropriate headers
      res.set({
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });

      res.send(buffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const fullPath = `${this.getPrivateObjectDir()}/uploads/${objectId}`;

    // Generate signed URL for upload (15 minutes TTL)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(fullPath, {
        upsert: false,
      });

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  // Gets the object entity file path from the object path.
  async getObjectEntityPath(objectPath: string): Promise<string> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const entityId = objectPath.slice("/objects/".length);
    const fullPath = `${this.getPrivateObjectDir()}/${entityId}`;

    // Verify file exists
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(this.getPrivateObjectDir(), {
        search: entityId.split('/').pop(),
      });

    if (error || !data || data.length === 0) {
      throw new ObjectNotFoundError();
    }

    return fullPath;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path, return it
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    // If it's a Supabase storage URL, extract the path
    if (rawPath.includes(`${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/`)) {
      const url = new URL(rawPath);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(STORAGE_BUCKET);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const objectPath = pathParts.slice(bucketIndex + 1).join('/');
        return `/objects/${objectPath}`;
      }
    }

    // If it's a full Supabase URL, try to extract
    if (rawPath.startsWith(`${supabaseUrl}/storage/v1/object/sign/`)) {
      // This is a signed URL, we can't normalize it easily
      // Return as-is or extract if possible
      return rawPath;
    }

    return rawPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    
    if (!normalizedPath.startsWith("/objects/")) {
      return normalizedPath;
    }

    const objectPath = await this.getObjectEntityPath(normalizedPath);

    // In Supabase, we control visibility via bucket policies
    // For now, we'll just return the normalized path
    // You can implement bucket policy updates via Supabase Admin API if needed
    
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectPath,
    requestedPermission,
  }: {
    userId?: string;
    objectPath: string;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    // For Supabase, access control is handled via bucket policies
    // This is a simplified check - you may want to implement more sophisticated logic
    try {
      const fullPath = await this.getObjectEntityPath(objectPath);
      
      // Check if file exists and user has access
      // In a real implementation, you'd check against your ACL policies
      return true; // Simplified - implement proper ACL checking
    } catch {
      return false;
    }
  }

  // Helper to get content type from file path
  private getContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  // Get public URL for an object (if public)
  async getPublicUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Upload file directly (for server-side uploads)
  async uploadFile(
    path: string,
    file: Buffer,
    contentType: string,
    options?: { upsert?: boolean; cacheControl?: string }
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        contentType,
        upsert: options?.upsert || false,
        cacheControl: options?.cacheControl || '3600',
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return data.path;
  }

  // Delete file
  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService();

