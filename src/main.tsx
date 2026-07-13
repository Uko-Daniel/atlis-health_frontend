import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRouter from '@/routes/AppRouter'
import '@/index.css'
import { Toaster } from 'sonner'
import TenantProvider from '@/components/layout/TenantProvider'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 minutes
      retry: 1,
    },
  },
})



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast:   'bg-white border border-slate-200 shadow-lg rounded-xl',
            title:   'text-slate-800 font-medium text-sm',
            description: 'text-slate-500 text-xs',
          },
        }}
      />
      </TenantProvider>
    </QueryClientProvider>
  </StrictMode>
)



// Inside your render, after QueryClientProvider:
