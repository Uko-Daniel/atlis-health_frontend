import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute  from './ProtectedRoute'
import AppLayout       from '@/components/layout/AppLayout'

import Login           from '@/pages/auth/Login'
import DashboardIndex from '@/pages/dashboard/DashboardIndex'
import ServicesPage from '@/pages/services/ServicesPage'

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
import SignUpRequests from '@/pages/admin/SignUpRequests'
import Signup from '@/pages/auth/SignUp'
import EncounterWorkspace from '@/pages/encounters/EncounterWorkspace'

import SettingsIndex from '@/pages/settings/SettingsIndex'
import PermissionsPage from '@/pages/settings/PermissionsPage'
import BillingPage from '@/pages/settings/BillingPage'
import GoogleSettingsPage from '@/pages/settings/GoogleSettingsPage'

import OrdersPage from '@/pages/orders/OrdersPage'
import OrderDetails from '@/pages/orders/OrderDetails'
import StaffManagement from '@/pages/staff/StaffManagement'
import StaffDetail from '@/pages/staff/StaffDetail'

import TemplatesPage from '@/pages/template/TemplatesPage'
import TemplateDetail from '@/pages/template/TemplatesDetail'
import TemplateEditor from '@/pages/template/TemplateEditor'

import RequestPortal from '@/pages/requests/RequestPortal'



export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            <Route path="/admin/signup-requests" element={<SignUpRequests />} />
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardIndex />} />
            <Route path="/services" element={<ServicesPage />} />

            {/* Settings */}
            <Route path="/settings/permissions" element={<PermissionsPage />} />
            <Route path="/settings" element={<SettingsIndex />} />
            <Route path="/settings/billing" element={<BillingPage />} />
            <Route path="/settings/google" element={<GoogleSettingsPage />} />

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
            
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetails />} />

            {/* Results */}
            <Route path="/results"     element={<Results />} />
            <Route path="/results/:id" element={<ResultViewer />} />

            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/:id" element={<TemplateDetail />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
            <Route path="/templates/:id/edit" element={<TemplateEditor />} />


            {/* Worklist */}
            <Route path="/worklist" element={<DepartmentWorklist />} />

            {/* Encounter Workspace */}
            <Route path="/encounters/:id" element={<EncounterWorkspace />} />

            <Route path="/requests" element={<RequestPortal />} />

            {/* Result editor */}
            <Route path="/editor/:resultId" element={<ResultEditor />} />
            <Route path="/appointments/:id" element={<AppointmentDetail />} />

            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/staff/:id" element={<StaffDetail />} />

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}