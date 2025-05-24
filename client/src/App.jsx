import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from "./components/chat/Chat"
import List from "./components/list/List"
import Login from "./components/login/Login"
import { SocketProvider } from './context/SocketContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppContent = () => {
  const [testResult, setTestResult] = useState('');

  // Test backend connection
  useEffect(() => {
    axios.get('http://localhost:5000/test')
      .then(response => {
        setTestResult(response.data.message);
      })
      .catch(error => {
        setTestResult('Error connecting to server: ' + error.message);
      });
  }, []);

  return (
    <>
      <p>Server status: {testResult}</p>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <div className='container'>
                <List />
                <Chat />
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App