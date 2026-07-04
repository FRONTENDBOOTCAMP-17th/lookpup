"use client";

import { useState } from "react";
import type { SitterDetail } from "@/hooks/queries/useSitterDetail";
import { ImageLightbox } from "@/components/common/ImageGallery";

export default function SitterIntroTab({ sitter }: { sitter: SitterDetail }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
        <h3 className="font-bold text-stone-900 mb-4">소개</h3>
        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
          {sitter.introduction ?? "소개글이 없습니다."}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
        <h3 className="font-bold text-stone-900 mb-4">경력</h3>
        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
          {sitter.career ?? "등록된 경력 정보가 없습니다."}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(232,116,42,0.10)] border border-orange-100 p-6">
        <h3 className="font-bold text-stone-900 mb-4">사진</h3>
        {sitter.activity_photo_urls.length === 0 ? (
          <p className="text-gray-400 text-sm">등록된 사진이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {sitter.activity_photo_urls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="focus:outline-none"
              >
                <img
                  src={url}
                  alt={`활동 사진 ${idx + 1}`}
                  className="aspect-square rounded-lg object-cover w-full hover:opacity-90 transition-opacity"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        urls={sitter.activity_photo_urls}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
