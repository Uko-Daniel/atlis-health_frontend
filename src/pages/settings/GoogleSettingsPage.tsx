import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Link2Off, Calendar, HardDrive, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface GoogleStatus {
  connected: boolean
  expiryDate: string | null
}

async function getGoogleStatus(): Promise<GoogleStatus> {
  const res = await api.get('/auth/google/status')
  return res.data
}

async function getGoogleAuthUrl(): Promise<string> {
  const res = await api.get('/auth/google')
  return res.data.url
}

async function disconnectGoogle(): Promise<void> {
  await api.delete('/auth/google')
}

export default function GoogleSettingsPage() {
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['google', 'status'],
    queryFn: getGoogleStatus,
  })

  const disconnectMut = useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google', 'status'] })
      toast.success('Google account disconnected')
    },
    onError: () => toast.error('Failed to disconnect'),
  })

  const handleConnect = async () => {
    try {
      const url = await getGoogleAuthUrl()
      window.location.href = url
    } catch {
      toast.error('Failed to start Google authentication')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">Google Integration</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Connect your Google account to enable calendar sync, Meet links, and document storage.
        </p>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                status?.connected ? 'bg-[#ECFDF5]' : 'bg-[#F8FAFF]',
              )}>
                {status?.connected ? (
                  <Check size={18} className="text-[#10B981]" />
                ) : (
                  <Link2 size={18} className="text-[#94A3B8]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {status?.connected ? 'Connected' : 'Not connected'}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {status?.connected
                    ? `Connected · Expires ${status.expiryDate
                        ? new Date(status.expiryDate).toLocaleDateString('en-NG', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : 'soon'}`
                    : 'Connect to enable Calendar and Drive features'}
                </p>
              </div>
            </div>

            {status?.connected ? (
              <ButtonPill
                variant="danger"
                icon={Link2Off}
                loading={disconnectMut.isPending}
                onClick={() => disconnectMut.mutate()}
              >
                Disconnect
              </ButtonPill>
            ) : (
              <ButtonPill
                variant="primary"
                icon={Link2}
                onClick={handleConnect}
              >
                Connect Google
              </ButtonPill>
            )}
          </div>
        )}
      </div>

      {/* What you get */}
      <div className="bg-white rounded-2xl border border-[#EEF1F8]
                      shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <h3 className="text-sm font-bold text-[#0F172A] mb-4">
          Connected features
        </h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4FF]">
              <Calendar size={15} className="text-[#5580F4]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Calendar sync</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Appointments automatically sync to your Google Calendar with Meet video links.
                Never miss a consultation.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F0FF]">
              <HardDrive size={15} className="text-[#9B6DFF]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Drive storage</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Attach referral letters and external lab reports directly to patient records.
                Files are stored in your Google Drive under an "Atlis Referrals" folder.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 bg-[#FFFBEB] rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-[#F59E0B] shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400E]">
            Atlis only accesses calendar events it creates and files in the Atlis folder.
            We never read your emails, other calendar events, or other Drive files.
          </p>
        </div>
      </div>
    </div>
  )
}