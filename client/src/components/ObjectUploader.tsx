import { useState, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * Referenced from blueprint:javascript_object_storage
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("upload-progress", (file, progress) => {
        if (file && progress.bytesUploaded && progress.bytesTotal) {
          setProgress(Math.round((progress.bytesUploaded / progress.bytesTotal) * 100));
        }
      })
      .on("upload-success", () => {
        setUploading(false);
        setProgress(100);
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setSelectedFile(null);
        setProgress(0);
      })
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setUploading(true);
      uppy.upload();
    }
  };

  const handleCancel = () => {
    uppy.cancelAll();
    setSelectedFile(null);
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
        data-testid="input-file-upload"
      />
      
      {!selectedFile ? (
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          className={buttonClassName}
          data-testid="button-upload-image"
        >
          {children}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate flex-1">
              {selectedFile.name}
            </span>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                data-testid="button-cancel-upload"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}
          
          {!uploading && (
            <Button
              onClick={handleUpload}
              size="sm"
              className="w-full"
              data-testid="button-start-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
