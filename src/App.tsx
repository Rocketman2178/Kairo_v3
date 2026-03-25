import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsConditions } from './pages/TermsConditions';
import { TestDataDashboard } from './pages/TestDataDashboard';
import { Demo } from './pages/Demo';
import Register from './pages/Register';
import { TestScenarios } from './pages/TestScenarios';
import { SplashPage } from './pages/SplashPage';
import { Analytics } from './pages/Analytics';
import { ParentPortal } from './pages/ParentPortal';
import { Reports } from './pages/Reports';
import { Retention } from './pages/Retention';
import { Sessions } from './pages/Sessions';

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
          <Route path="/test-scenarios" element={<TestScenarios />} />
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/portal" element={<ParentPortal />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/retention" element={<Retention />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
