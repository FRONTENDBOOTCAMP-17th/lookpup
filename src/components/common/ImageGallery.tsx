"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog as DialogPrimitive } from "radix-ui";

interface ImageGalleryProps {
  urls: string[];
}

export function ImageGallery({ urls }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i !== null && i < urls.length - 1 ? i + 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, urls.length]);

  if (urls.length === 0) return null;

  const hasManyImages = urls.length > 1;
  const prev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const next = () => setLightboxIndex((i) => (i !== null && i < urls.length - 1 ? i + 1 : i));

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex flex-row gap-2 pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="shrink-0 focus:outline-none"
            >
              <img
                src={url}
                alt=""
                className="w-20 h-20 rounded-xl object-cover hover:opacity-90 transition-opacity"
              />
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DialogPrimitive.Root
        open={lightboxIndex !== null}
        onOpenChange={(open) => { if (!open) setLightboxIndex(null); }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex flex-col items-center justify-center outline-none cursor-pointer data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200"
            onClick={() => setLightboxIndex(null)}
          >
            <DialogPrimitive.Title className="sr-only">이미지 보기</DialogPrimitive.Title>

            <div
              className="absolute top-4 right-4 flex items-center gap-2.5 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {hasManyImages && lightboxIndex !== null && (
                <span className="text-white/50 text-sm tabular-nums">
                  {lightboxIndex + 1} / {urls.length}
                </span>
              )}
              <DialogPrimitive.Close className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
                <X size={18} />
                <span className="sr-only">닫기</span>
              </DialogPrimitive.Close>
            </div>

            <div
              className="flex items-center w-full max-w-4xl px-4 md:px-6 gap-4 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 w-10">
                {hasManyImages && lightboxIndex !== null && lightboxIndex > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={22} />
                  </button>
                )}
              </div>
              {lightboxIndex !== null && (
                <img
                  src={urls[lightboxIndex]}
                  alt=""
                  className="flex-1 min-w-0 w-full object-contain max-h-[78vh] rounded-2xl"
                />
              )}
              <div className="shrink-0 w-10">
                {hasManyImages && lightboxIndex !== null && lightboxIndex < urls.length - 1 && (
                  <button
                    onClick={next}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={22} />
                  </button>
                )}
              </div>
            </div>

            {hasManyImages && (
              <div
                className="flex gap-2 mt-6 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {urls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      i === lightboxIndex ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/55"
                    }`}
                  />
                ))}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
