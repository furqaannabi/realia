"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

/**
 * If the user calls onChange(null) from the parent,
 * the preview is reset (cleared) in this component.
 */
export function UploadCard({
  onChange,
  className,
  value,
}: {
  onChange: (file: File | null) => void
  className?: string
  value?: File | null // Not used, here for completeness if needed in the future
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Reset preview if selectedFile changes to null (when onChange(null) is called from parent)
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null)
      // Also clear file input value for user experience (can upload again)
      if (inputRef.current) inputRef.current.value = ""
    }
  }, [selectedFile])

  // Parent: to reset, call `onChange(null)`, which triggers setSelectedFile(null) here via the callback
  const handleFile = (file: File | null) => {
    setSelectedFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
    onChange(file)
  }

  useEffect(() => {
    if (!value) {
      setPreview(null)
    }
  }, [value])

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-glass backdrop-blur-xl p-5 lg:min-h-[50vh]", className)}>
      {!preview && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition lg:min-h-[50vh]",
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
              if (f) {
                handleFile(f)
              }
            }}
          />
        </div>
      )}

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
