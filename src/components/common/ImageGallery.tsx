"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog as DialogPrimitive } from "radix-ui";

interface ImageGalleryProps {
  urls: string[];
}

interface ImageLightboxProps {
  urls: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageLightbox({ urls, index, onClose, onIndexChange }: ImageLightboxProps) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && index < urls.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length, onIndexChange]);

  const hasManyImages = urls.length > 1;
  const prev = () => index !== null && index > 0 && onIndexChange(index - 1);
  const next = () => index !== null && index < urls.length - 1 && onIndexChange(index + 1);

  return (
    <DialogPrimitive.Root
      open={index !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col items-center justify-center outline-none cursor-pointer data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200"
          onClick={onClose}
        >
          <DialogPrimitive.Title className="sr-only">이미지 보기</DialogPrimitive.Title>

          <div
            className="absolute top-4 right-4 flex items-center gap-2.5 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {hasManyImages && index !== null && (
              <span className="text-white/50 text-sm tabular-nums">
                {index + 1} / {urls.length}
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
              {hasManyImages && index !== null && index > 0 && (
                <button
                  onClick={prev}
                  aria-label="이전 이미지"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
            </div>
            {index !== null && (
              <img
                src={urls[index]}
                alt=""
                className="flex-1 min-w-0 w-full object-contain max-h-[78vh] rounded-2xl"
              />
            )}
            <div className="shrink-0 w-10">
              {hasManyImages && index !== null && index < urls.length - 1 && (
                <button
                  onClick={next}
                  aria-label="다음 이미지"
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
                  onClick={() => onIndexChange(i)}
                  aria-label={`${i + 1}번째 이미지로 이동`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    i === index ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ImageGallery({ urls }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex flex-row gap-2 pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              aria-label={`${i + 1}번째 후기 사진 크게 보기`}
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

      <ImageLightbox
        urls={urls}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  );
}
