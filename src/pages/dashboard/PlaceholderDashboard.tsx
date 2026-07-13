import { LayoutDashboard } from 'lucide-react'

export default function PlaceholderDashboard({ role }: { role: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#F0F4FF]">
        <LayoutDashboard size={28} className="text-[#5580F4]" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-[#0F172A]">{role} Dashboard</h2>
        <p className="text-sm text-[#94A3B8] mt-1">Coming soon — your workspace is being built.</p>
      </div>
    </div>
  )
}