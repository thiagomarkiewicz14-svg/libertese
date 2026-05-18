import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Prontuario from './pages/Prontuario'
import Sessoes from './pages/Sessoes'
import Agenda from './pages/Agenda'
import CRM from './pages/CRM'
import Financeiro from './pages/Financeiro'
import Servicos from './pages/Servicos'
import Planos from './pages/Planos'
import AreaPaciente from './pages/AreaPaciente'
import Equipe from './pages/Equipe'
import RelatorioPosSessao from './pages/RelatorioPosSessao'

export default function App() {
  return (
    <AppProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/prontuario" element={<Prontuario />} />
            <Route path="/prontuario/:patientId" element={<Prontuario />} />
            <Route path="/sessoes" element={<Sessoes />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/area-paciente" element={<AreaPaciente />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/relatorio-pos-sessao" element={<RelatorioPosSessao />} />
            {/* Compat redirects */}
            <Route path="/alunos" element={<Navigate to="/pacientes" replace />} />
            <Route path="/presencas" element={<Navigate to="/sessoes" replace />} />
          </Routes>
        </div>
      </div>
      <Toast />
    </AppProvider>
  )
}
