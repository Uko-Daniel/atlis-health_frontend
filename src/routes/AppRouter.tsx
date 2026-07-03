import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute  from './ProtectedRoute'
import AppLayout       from '@/components/layout/AppLayout'

import Login           from '@/pages/auth/Login'
import Dashboard       from '@/pages/dashboard/Dashboard'

import PatientList     from '@/pages/patients/PatientList'
import PatientNew      from '@/pages/patients/PatientNew'
import PatientDetail   from '@/pages/patients/PatientDetails'
import OverviewTab     from '@/pages/patients/tabs/OverviewTab'
import VitalsTab       from '@/pages/patients/tabs/VitalsTab'
import DiagnosesTab    from '@/pages/patients/tabs/DiagnosesTab'
import MedicationsTab  from '@/pages/patients/tabs/MedicationsTab'
import OrdersTab       from '@/pages/patients/tabs/OrdersTab'
import ResultsTab      from '@/pages/patients/tabs/ResultsTab'
import EveeTab         from '@/pages/patients/tabs/EveeTab'

import Appointments    from '@/pages/appointments/Appointments'
import Results         from '@/pages/results/Results'
import ResultViewer    from '@/pages/results/ResultViewer'
import ResultEditor    from '@/pages/editor/ResultEditor'

import DepartmentWorklist from '@/pages/worklist/DepartmentWorkList'
import AppointmentDetail from '@/pages/appointments/AppointmentDetails'
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Patients */}
            <Route path="/patients"     element={<PatientList />} />
            <Route path="/patients/new" element={<PatientNew />} />

            {/* Patient detail — nested tabs */}
            <Route path="/patients/:id" element={<PatientDetail />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview"    element={<OverviewTab />} />
              <Route path="vitals"      element={<VitalsTab />} />
              <Route path="diagnoses"   element={<DiagnosesTab />} />
              <Route path="medications" element={<MedicationsTab />} />
              <Route path="orders"      element={<OrdersTab />} />
              <Route path="results"     element={<ResultsTab />} />
              <Route path="evee"        element={<EveeTab />} />
            </Route>

            {/* Appointments */}
            <Route path="/appointments" element={<Appointments />} />

            {/* Results */}
            <Route path="/results"     element={<Results />} />
            <Route path="/results/:id" element={<ResultViewer />} />

            {/* Worklist */}
            <Route path="/worklist" element={<DepartmentWorklist />} />

            {/* Result editor */}
            <Route path="/editor/:resultId" element={<ResultEditor />} />
            <Route path="/appointments/:id" element={<AppointmentDetail />} />

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}