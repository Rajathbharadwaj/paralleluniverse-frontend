"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ImagePlus, Loader2 } from "lucide-react";
import { uploadAsset, UserAsset } from "@/lib/api/ads";

interface AssetUploaderProps {
  onAssetCreated?: (asset: UserAsset) => void;
  triggerButton?: React.ReactNode;
}

export function AssetUploader({ onAssetCreated, triggerButton }: AssetUploaderProps) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<"logo" | "product" | "background" | "other">("other");
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setSelectedFile(file);
    setName(file.name.replace(/\.[^/.]+$/, "")); // Use filename without extension as default name

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !name) return;

    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const asset = await uploadAsset(selectedFile, name, assetType, token);

      onAssetCreated?.(asset);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "Failed to upload asset");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setName("");
    setAssetType("other");
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <ImagePlus className="h-4 w-4" />
            Upload Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Upload Brand Asset</DialogTitle>
          <DialogDescription>
            Upload your logo, product photos, or background images for AI-generated ads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="space-y-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-destructive"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInput}
                />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drop image here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 10MB
                </p>
              </label>
            )}
          </div>

          {/* Asset Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              placeholder="e.g., Company Logo, Pepperoni Pizza"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Asset Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Asset Type</Label>
            <Select value={assetType} onValueChange={(v) => setAssetType(v as typeof assetType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="logo">Logo</SelectItem>
                <SelectItem value="product">Product Photo</SelectItem>
                <SelectItem value="background">Background</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Button */}
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!selectedFile || !name || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Asset
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
