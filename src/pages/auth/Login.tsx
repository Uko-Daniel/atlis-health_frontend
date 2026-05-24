import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { login } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const CURRENT_YEAR = new Date().getFullYear()

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    try {
      const res = await login(data)
      setAuth(res.user, res.token)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials. Try again.'
      setServerError(message)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">

      {/* ── Outer content column ── */}
      <div className={cn('flex flex-col gap-6 w-full max-w-sm flex-1 justify-center')}>

        {/* ── Logo + heading block ── */}
        <div className="flex flex-col items-center gap-2 text-center">

          {/* Logo */}
          <a href="#" className="flex flex-col items-center gap-2 font-medium">
            <img src="/atlis-logo.svg" alt="Atlis Health" className="h-12 w-auto" />
          </a>

          <h1 className="text-xl font-bold text-slate-900">
            Welcome to Atlis Health
          </h1>
          <p className="text-sm text-slate-500 balance">
            Sign in with your facility credentials to continue
          </p>
        </div>

        {/* ── Form group ── */}
        <div className="flex flex-col gap-4">

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@facility.com"
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-700 text-white transition-colors"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

          </form>

        </div>

      </div>

      {/* ── Copyright footer ── */}
      <footer className="py-6 text-center">
        <p className="text-xs text-slate-400">
          Copyright &copy; {CURRENT_YEAR} Atlis Health. All rights reserved.
        </p>
      </footer>

    </div>
  )
}