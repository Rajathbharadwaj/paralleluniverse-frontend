"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Trash2, Image as ImageIcon, Package, Palette, MoreHorizontal } from "lucide-react";
import { fetchAssets, deleteAsset, UserAsset } from "@/lib/api/ads";
import { AssetUploader } from "./AssetUploader";

interface AssetGalleryProps {
  onAssetSelect?: (asset: UserAsset) => void;
  selectable?: boolean;
  selectedAssetIds?: number[];
}

const assetTypeIcons = {
  logo: <Palette className="h-3 w-3" />,
  product: <Package className="h-3 w-3" />,
  background: <ImageIcon className="h-3 w-3" />,
  other: <MoreHorizontal className="h-3 w-3" />,
};

const assetTypeColors = {
  logo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  product: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  background: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function AssetGallery({
  onAssetSelect,
  selectable = false,
  selectedAssetIds = [],
}: AssetGalleryProps) {
  const { getToken } = useAuth();
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAssets = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await fetchAssets(token);
      setAssets(data);
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleDelete = async (assetId: number) => {
    setDeletingId(assetId);
    try {
      const token = await getToken();
      if (!token) return;

      await deleteAsset(assetId, token);
      setAssets(assets.filter((a) => a.id !== assetId));
    } catch (error) {
      console.error("Failed to delete asset:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAssetCreated = (asset: UserAsset) => {
    setAssets([asset, ...assets]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Assets</h3>
          <p className="text-sm text-muted-foreground">
            {assets.length} asset{assets.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <AssetUploader onAssetCreated={handleAssetCreated} />
      </div>

      {/* Empty State */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No assets yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Upload your logo, product photos, and other brand assets to use in AI-generated ads.
            </p>
            <AssetUploader
              onAssetCreated={handleAssetCreated}
              triggerButton={
                <Button>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Your First Asset
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        /* Asset Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id);

            return (
              <Card
                key={asset.id}
                className={`overflow-hidden transition-all ${
                  selectable ? "cursor-pointer hover:ring-2 hover:ring-primary" : ""
                } ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => selectable && onAssetSelect?.(asset)}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={asset.thumbnail_url || asset.file_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{asset.name}</p>
                      <Badge
                        variant="secondary"
                        className={`text-xs mt-1 ${assetTypeColors[asset.asset_type]}`}
                      >
                        {assetTypeIcons[asset.asset_type]}
                        <span className="ml-1 capitalize">{asset.asset_type}</span>
                      </Badge>
                    </div>
                    {!selectable && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deletingId === asset.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{asset.name}"? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(asset.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
