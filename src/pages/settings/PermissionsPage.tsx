import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { getPermissions, updatePermission } from '@/services/permissionService'
import { ALL_STAFF_ROLES } from '@/utils/permissions'
import type { StaffRole } from '@/types/auth'
import { Toggle } from '@/components/ui/atoms/Toggle'
import { ButtonPill } from '@/components/ui/atoms/ButtonPill'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const PERMISSION_ROLE: Record<string, StaffRole> = {
  allowOrderTest: 'RECEPTIONIST',
  allowRecordVitalsWithoutActiveEncounter: 'NURSES',
  allowViewDiagnoses: 'LAB_SCIENTIST',
  requireDoctorCosignOnPrescription: 'DOCTOR',
  allowViewOrderStatus: 'BILLING_OFFICER',
}

function roleLabel(role: StaffRole): string {
  return role.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function getErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' && err !== null &&
    'response' in err && typeof err.response === 'object' && err.response !== null &&
    'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null &&
    'error' in err.response.data && typeof err.response.data.error === 'string'
  ) {
    return err.response.data.error
  }
  return 'Failed to update'
}

export default function PermissionsPage() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { data: permissions, isLoading, isError } = useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: getPermissions,
  })

  const saveMutation = useMutation({
    mutationFn: ({ key, roles }: { key: string; roles: StaffRole[] }) =>
      updatePermission(key, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'permissions'] })
      toast.success('Permission updated')
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err))
    },
  })

  const toggleRole = (permKey: string, role: StaffRole, currentRoles: StaffRole[]) => {
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role]
    saveMutation.mutate({ key: permKey, roles: newRoles })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">Permissions</h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          Grant or restrict specific role capabilities. Changes apply immediately.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          Failed to load permissions.
        </div>
      )}

      {permissions?.map((perm) => {
        const targetRole = PERMISSION_ROLE[perm.key]
        const isEnabled = targetRole
          ? perm.effectiveRoles.includes(targetRole)
          : perm.effectiveRoles.length > 0
        const isExpanded = expanded[perm.key] ?? false

        const handleMainToggle = (checked: boolean) => {
          if (!targetRole) return
          const newRoles = checked
            ? [...perm.effectiveRoles, targetRole]
            : perm.effectiveRoles.filter((r) => r !== targetRole)
          saveMutation.mutate({ key: perm.key, roles: newRoles })
        }

        return (
          <div
            key={perm.key}
            className="bg-white rounded-2xl border border-[#EEF1F8]
                       shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            {/* Main row */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-xl mt-0.5',
                  perm.complianceLocked ? 'bg-[#FEF2F2]' : isEnabled ? 'bg-[#ECFDF5]' : 'bg-[#F8FAFF]',
                )}>
                  <Shield size={15} className={cn(
                    perm.complianceLocked ? 'text-[#EF4444]' : isEnabled ? 'text-[#10B981]' : 'text-[#94A3B8]',
                  )} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#0F172A]">{perm.label}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{perm.description}</p>
                  {targetRole && (
                    <p className="text-xs text-[#64748B] mt-1">
                      Applies to: <span className="font-medium">{roleLabel(targetRole)}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Toggle
                  checked={isEnabled}
                  disabled={perm.complianceLocked || saveMutation.isPending}
                  onChange={handleMainToggle}
                />
                {!perm.complianceLocked && (
                  <ButtonPill
                    variant="ghost"
                    size="sm"
                    icon={Settings2}
                    onClick={() => setExpanded((prev) => ({ ...prev, [perm.key]: !prev[perm.key] }))}
                  >
                    {isExpanded ? 'Simple' : 'Advanced'}
                  </ButtonPill>
                )}
              </div>
            </div>

            {/* Advanced: role-level toggles */}
            {isExpanded && (
              <div className="border-t border-[#EEF1F8] bg-[#FAFBFF] px-5 py-4">
                <p className="text-xs text-[#94A3B8] mb-3">
                  Select exactly which roles can perform this action.
                </p>
                <div className="space-y-2">
                  {ALL_STAFF_ROLES.map((role) => {
                    const roleAllowed = perm.effectiveRoles.includes(role)
                    return (
                      <div key={role} className="flex items-center justify-between py-1.5">
                        <span className={cn(
                          'text-sm',
                          roleAllowed ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]',
                        )}>
                          {roleLabel(role)}
                        </span>
                        <Toggle
                          checked={roleAllowed}
                          disabled={saveMutation.isPending}
                          onChange={() => toggleRole(perm.key, role, perm.effectiveRoles)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}