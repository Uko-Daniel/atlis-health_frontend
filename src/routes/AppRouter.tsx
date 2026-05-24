import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout      from '@/components/layout/AppLayout'
import Login          from '@/pages/auth/Login'
import Dashboard      from '@/pages/dashboard/Dashboard'
import PatientList    from '@/pages/patients/PatientList'
import PatientNew     from '@/pages/patients/PatientNew'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/patients"     element={<PatientList />} />
            <Route path="/patients/new" element={<PatientNew />} />
            {/* Patient detail — next session */}
            {/* <Route path="/patients/:id/*" element={<PatientDetail />} /> */}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}