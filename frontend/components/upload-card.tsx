"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function UploadCard({
  preview,
  onChange,
  className,
}: {
  preview: string | null
  onChange: (url: string | null) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = (file: File) => {
    const url = URL.createObjectURL(file)
    onChange(url)
  }

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-glass backdrop-blur-xl p-5", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition",
          "hover:bg-white/5",
          preview ? "border-white/10" : "border-white/20",
        )}
      >
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Drag & Drop an image or</div>
          <div className="font-medium bg-brand-gradient inline-block px-2 py-1 rounded-md text-background">
            Upload Image
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </div>

      {preview && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview || "/placeholder.svg"}
            alt="Uploaded preview"
            className="rounded-xl w-full h-auto object-cover ring-1 ring-white/10"
            crossOrigin="anonymous"
          />
        </motion.div>
      )}
    </div>
  )
}
