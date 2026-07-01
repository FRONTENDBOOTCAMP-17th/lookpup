"use client";

import { useState } from "react";
import { uploadToCloudinary } from "@/utils/cloudinary";

export function useSingleImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return null;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    return selected;
  };

  const upload = (folder: string) =>
    file ? uploadToCloudinary(file, folder) : Promise.resolve(undefined);

  return { file, preview, onSelect, upload, setFile, setPreview };
}

export function useMultiFileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onAdd = (e: React.ChangeEvent<HTMLInputElement>, withPreview = false) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return [];
    setFiles((prev) => [...prev, ...selected]);
    if (withPreview) {
      setPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
    }
    e.target.value = "";
    return selected;
  };

  const removeAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = (folder: string) =>
    Promise.all(files.map((f) => uploadToCloudinary(f, folder)));

  return { files, previews, onAdd, removeAt, uploadAll, setFiles, setPreviews };
}
