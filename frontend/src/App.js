import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Toaster } from './components/ui/sonner';

// User Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HealthAssessment from './pages/HealthAssessment';
import ReportView from './pages/ReportView';
import History from './pages/History';
import Settings from './pages/Settings';
import ImageAnalysis from './pages/ImageAnalysis';
import HealthChat from './pages/HealthChat';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRecords from './pages/admin/AdminRecords';
import AdminImages from './pages/admin/AdminImages';
import AdminChats from './pages/admin/AdminChats';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/assess" element={
            <ProtectedRoute>
              <HealthAssessment />
            </ProtectedRoute>
          } />
          <Route path="/report/:id" element={
            <ProtectedRoute>
              <ReportView />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* New Module Routes */}
          <Route path="/image-analysis" element={
            <ProtectedRoute>
              <ImageAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <HealthChat />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="records" element={<AdminRecords />} />
            <Route path="images" element={<AdminImages />} />
            <Route path="chats" element={<AdminChats />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
