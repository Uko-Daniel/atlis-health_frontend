import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  url: string
  filename: string
  mimetype: string
  size: number
}

interface ApiErrorResponse {
  error?: string
}

interface Props {
  // Controlled mode: pass value + onChange
  value?: UploadedFile[]
  onChange?: (files: UploadedFile[]) => void
  // Uncontrolled mode (backward compatible): pass onUpload + onRemove
  onUpload?: (file: UploadedFile) => void
  onRemove?: (url: string) => void
  existingFiles?: UploadedFile[]
  accept?: string
  label?: string
  disabled?: boolean
  className?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onRemove,
  existingFiles = [],
  accept = 'image/jpeg,image/png,image/webp,application/pdf,application/dicom',
  label = 'Upload files',
  disabled = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Determine files to display: controlled value takes priority
  const files = value ?? existingFiles

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data as UploadedFile
    },
    onSuccess: (data) => {
      setError(null)
      if (onChange) {
        onChange([...files, data])
      } else if (onUpload) {
        onUpload(data)
      }
      if (inputRef.current) inputRef.current.value = ''
    },
    onError: (err: unknown) => {
      const message = isAxiosError<ApiErrorResponse>(err)
        ? err.response?.data?.error
        : undefined
      setError(message ?? 'Upload failed')
    },
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMut.mutate(file)
  }

  const handleRemove = (url: string) => {
    if (onChange) {
      onChange(files.filter((f) => f.url !== url))
    } else if (onRemove) {
      onRemove(url)
    }
  }

  const isImage = (mimetype: string) => mimetype.startsWith('image/')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Existing files */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.url}
              className="relative group rounded-xl border border-[#EEF1F8] overflow-hidden bg-[#F8FAFF]"
            >
              {isImage(file.mimetype) ? (
                <img src={file.url} alt={file.filename} className="h-24 w-24 object-cover" />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center">
                  <FileText size={28} className="text-[#94A3B8]" />
                </div>
              )}
              {!disabled && (
                <button
                  onClick={() => handleRemove(file.url)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-black/50
                             flex items-center justify-center opacity-0 group-hover:opacity-100
                             transition-opacity"
                >
                  <X size={11} className="text-white" />
                </button>
              )}
              <p className="text-xs text-[#94A3B8] truncate px-2 py-1 max-w-[96px]">
                {formatSize(file.size)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || uploadMut.isPending}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed',
            'text-sm font-medium transition-all',
            disabled
              ? 'border-[#EEF1F8] text-[#CBD5E1] cursor-not-allowed'
              : 'border-[#5580F4]/30 text-[#5580F4] hover:bg-[#F0F4FF] hover:border-[#5580F4]',
          )}
        >
          {uploadMut.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          {uploadMut.isPending ? 'Uploading…' : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}
