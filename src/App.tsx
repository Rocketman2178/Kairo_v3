import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsConditions } from './pages/TermsConditions';
import { TestDataDashboard } from './pages/TestDataDashboard';
import { Demo } from './pages/Demo';
import Register from './pages/Register';
import { TestN8N } from './pages/TestN8N';
import { TestScenarios } from './pages/TestScenarios';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/test-data" element={<TestDataDashboard />} />
          <Route path="/test-n8n" element={<TestN8N />} />
          <Route path="/test-scenarios" element={<TestScenarios />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
