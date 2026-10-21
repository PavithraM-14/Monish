import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import Tickets from './pages/Tickets';
import IssueIntimationsPage from './pages/IssueIntimationsPage';
import LogExplorer from './pages/LogExplorer';
import ReportsPage from './pages/ReportsPage';
import EngineersPage from './pages/EngineersPage';
import Login from './pages/Login';
import ChatWidget from './components/ChatWidget';
import NotificationToast from './components/NotificationToast';
import CreateWorkOrderModal from './components/CreateWorkOrderModal';
import ReportIssueModal from './components/ReportIssueModal';
import WorkOrderDetailModal from './components/WorkOrderDetailModal';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loading, isAdmin, isEngineer } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState('MCH-003');

  // Navigation state filters
  const [fleetFilter, setFleetFilter] = useState('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [historyTab, setHistoryTab] = useState('telemetry');

  // Global modals
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [createTicketPreload, setCreateTicketPreload] = useState(null);
  const [selectedViewTicket, setSelectedViewTicket] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
        }}
      >
        Initializing PredictaMaint Fleet Operations Platform...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Navigation helper methods
  const navigateToMachine = (mId) => {
    setSelectedMachineId(mId);
    setActivePage('machine-detail');
  };

  const navigateToFleetWithFilter = (filter) => {
    setFleetFilter(filter);
    setActivePage('machines');
  };

  const navigateToTicketsWithFilter = (status) => {
    setTicketStatusFilter(status);
    setActivePage('tickets');
  };

  const navigateToHistoryWithTab = (tab) => {
    setHistoryTab(tab);
    setActivePage('logs');
  };

  const handleOpenCreateTicketFromIssue = (issue) => {
    setCreateTicketPreload({
      machineId: issue.machineId,
      machineName: issue.machineName,
      title: `Remediate Defect: ${issue.description.substring(0, 40)}...`,
      description: issue.description,
      priority: issue.severity === 'CRITICAL' ? 'CRITICAL' : issue.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
    });
    setIsCreateTicketOpen(true);
  };

  const handleViewTicket = (ticket) => {
    setSelectedViewTicket(ticket);
    setIsViewModalOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenReportIssue={() => setIsReportIssueOpen(true)}
      />

      <main className="main-content">
        {/* DASHBOARD ROUTE */}
        {activePage === 'dashboard' && (
          isAdmin ? (
            <Dashboard
              onNavigateToMachines={navigateToFleetWithFilter}
              onNavigateToTickets={navigateToTicketsWithFilter}
              onNavigateToIssues={() => setActivePage('issues')}
              onNavigateToHistory={navigateToHistoryWithTab}
              onNavigateToMachine={navigateToMachine}
              onOpenCreateTicket={() => {
                setCreateTicketPreload(null);
                setIsCreateTicketOpen(true);
              }}
            />
          ) : (
            <EngineerDashboard
              onNavigateToTickets={navigateToTicketsWithFilter}
              onNavigateToActiveMaintenance={() => setActivePage('active-maintenance')}
              onNavigateToHistory={navigateToHistoryWithTab}
              onNavigateToMachine={navigateToMachine}
              onOpenReportIssue={() => setIsReportIssueOpen(true)}
              onViewTicket={handleViewTicket}
            />
          )
        )}

        {/* FLEET REGISTRY */}
        {activePage === 'machines' && (
          <Machines
            onSelectMachine={navigateToMachine}
            initialFilter={fleetFilter}
          />
        )}

        {/* MACHINE DETAIL */}
        {activePage === 'machine-detail' && (
          <MachineDetail
            machineId={selectedMachineId}
            onBack={() => setActivePage('machines')}
          />
        )}

        {/* WORK ORDERS */}
        {activePage === 'tickets' && (
          <Tickets
            onSelectMachine={navigateToMachine}
            initialStatusFilter={ticketStatusFilter}
            mode="normal"
            onOpenCreateTicket={() => {
              setCreateTicketPreload(null);
              setIsCreateTicketOpen(true);
            }}
            onOpenReportIssue={() => setIsReportIssueOpen(true)}
          />
        )}

        {/* ACTIVE MAINTENANCE (ENGINEER SPECIFIC SHORTCUT) */}
        {activePage === 'active-maintenance' && (
          <Tickets
            onSelectMachine={navigateToMachine}
            initialStatusFilter="IN_PROGRESS"
            mode="active-maintenance"
            onOpenCreateTicket={() => {
              setCreateTicketPreload(null);
              setIsCreateTicketOpen(true);
            }}
            onOpenReportIssue={() => setIsReportIssueOpen(true)}
          />
        )}

        {/* ISSUE INTIMATIONS / MY REPORTS */}
        {activePage === 'issues' && (
          <IssueIntimationsPage
            onSelectMachine={navigateToMachine}
            onOpenReportIssue={() => setIsReportIssueOpen(true)}
            onOpenCreateTicketFromIssue={handleOpenCreateTicketFromIssue}
          />
        )}

        {/* HISTORICAL EXPLORER / MY HISTORY */}
        {activePage === 'logs' && (
          <LogExplorer initialTab={historyTab} />
        )}

        {/* REPORTS / PERFORMANCE ANALYTICS */}
        {activePage === 'reports' && (
          <ReportsPage />
        )}

        {/* ENGINEERS MANAGEMENT (ADMIN ONLY) */}
        {activePage === 'engineers' && (
          isAdmin ? (
            <EngineersPage
              onNavigateToTicketsForEngineer={(engName) => {
                setActivePage('tickets');
              }}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Access restricted. Administrative role required.
            </div>
          )
        )}
      </main>

      {/* Floating AI Diagnostic Chat Assistant */}
      <ChatWidget activeMachineId={selectedMachineId} />

      {/* In-App Live Anomaly Alert Toast */}
      <NotificationToast onSelectMachine={navigateToMachine} />

      {/* Global Create Work Order Modal (Admin) */}
      <CreateWorkOrderModal
        isOpen={isCreateTicketOpen}
        onClose={() => {
          setIsCreateTicketOpen(false);
          setCreateTicketPreload(null);
        }}
        initialMachineId={createTicketPreload?.machineId || selectedMachineId}
        initialTitle={createTicketPreload?.title}
        initialDescription={createTicketPreload?.description}
        initialPriority={createTicketPreload?.priority}
      />

      {/* Global Report Defect / Issue Modal (Technician / Field) */}
      <ReportIssueModal
        isOpen={isReportIssueOpen}
        onClose={() => setIsReportIssueOpen(false)}
        initialMachineId={selectedMachineId}
      />

      {/* Global Work Order View Modal */}
      <WorkOrderDetailModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        ticketId={selectedViewTicket?._id}
        initialTicket={selectedViewTicket}
        onNavigateToMachine={navigateToMachine}
      />
    </div>
  );
}
