import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import Login from './admin/Login';
import Dashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './LandingPage'; 


function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route path="/" element={<LandingPage />} />


        {/* Admin routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            localStorage.getItem('adminToken') ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
      </Routes>


      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Router>
  );
}


export default App;
