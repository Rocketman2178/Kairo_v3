import { ChatInterface } from '../components/registration/ChatInterface';
import CartRecoveryBanner from '../components/registration/CartRecoveryBanner';
import { useCartRecovery } from '../hooks/useCartRecovery';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export function Home() {
  const { cartRecovery, recoveryUrl, dismiss } = useCartRecovery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a2332] to-[#0f1419]">
      {/* Cart recovery banner — desktop top bar, mobile sticky bottom */}
      {cartRecovery && recoveryUrl && (
        <CartRecoveryBanner
          cart={cartRecovery}
          recoveryUrl={recoveryUrl}
          onDismiss={dismiss}
        />
      )}

      {/* Sticky Header — hidden on mobile where chat is full-bleed */}
      <header className="hidden sm:block sticky top-0 z-50 bg-gradient-to-r from-[#0f1419] via-[#1a2332] to-[#0f1419] border-b border-gray-800 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex-shrink-0">
              <span className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent">
                Kairo Pro
              </span>
            </h1>
            <div className="flex items-center gap-4">
              {import.meta.env.DEV && (
                <Link
                  to="/test-scenarios"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <span>Test Scenarios</span>
                </Link>
              )}
              <a
                href="/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 bg-gradient-to-r from-[#6366f1] to-[#06b6d4] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity py-2"
              >
                <span>Platform Demo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <div className="text-right">
                <p className="text-sm text-white">Registration Reimagined</p>
                <p className="text-xs text-gray-400">Built for Busy Parents</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — no padding on mobile for full-bleed chat */}
      <div className="sm:container sm:mx-auto sm:px-4 sm:py-8">
        <ChatInterface organizationId="00000000-0000-0000-0000-000000000001" />

        <div className="hidden sm:block text-center mt-8 text-sm text-gray-500 space-y-2">
          <p>Copyright 2026 Kairo Pro & RocketHub Labs</p>
          <div className="flex justify-center gap-4">
            <Link to="/privacy" className="hover:text-[#06b6d4] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#06b6d4] transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
