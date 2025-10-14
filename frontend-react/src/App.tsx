import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { auth } from './utils/auth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={auth.hasToken() ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job/:jobId"
          element={
            <ProtectedRoute>
              <JobDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
