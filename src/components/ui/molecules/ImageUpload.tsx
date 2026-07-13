import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface UploadedFile {
  url: string
  filename: string
  mimetype: string
  size: number
}

interface Props {
  onUpload: (file: UploadedFile) => void
  onRemove?: (url: string) => void
  existingFiles?: UploadedFile[]
  accept?: string
  maxSize?: number // bytes
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
  onUpload, onRemove, existingFiles = [],
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  label = 'Upload files',
  disabled = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

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
      onUpload(data)
      setError(null)
    },
    onError: (err: unknown) => {
      // Narrow unknown error to possible shape returned by our api
      const hasResponse = (e: unknown): e is { response?: { data?: { error?: string } } } =>
        typeof e === 'object' && e !== null && 'response' in e;

      if (hasResponse(err)) {
        const msg = err.response?.data?.error
        setError(msg ?? 'Upload failed')
      } else {
        setError('Upload failed')
      }
    },
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMut.mutate(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isImage = (mimetype: string) => mimetype.startsWith('image/')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingFiles.map((file) => (
            <div
              key={file.url}
              className="relative group rounded-xl border border-[#EEF1F8] overflow-hidden bg-[#F8FAFF]"
            >
              {isImage(file.mimetype) ? (
                <img
                  src={file.url}
                  alt={file.filename}
                  className="h-24 w-24 object-cover"
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center">
                  <FileText size={28} className="text-[#94A3B8]" />
                </div>
              )}
              {onRemove && !disabled && (
                <button
                  onClick={() => onRemove(file.url)}
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

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}