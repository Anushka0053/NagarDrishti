import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Public Portal Pages
import { PublicHomePage } from './pages/PublicHomePage';
import { PublicReportPage } from './pages/PublicReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { PublicInsightsPage } from './pages/PublicInsightsPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Government Portal Layout & Pages
import { GovLayout } from './components/gov/GovLayout';
import { GovOverviewPage } from './pages/GovOverviewPage';
import { GovReportsCenterPage } from './pages/GovReportsCenterPage';
import { GovAIIntelligencePage } from './pages/GovAIIntelligencePage';
import { GovGISExplorerPage } from './pages/GovGISExplorerPage';
import { GovDepartmentsPage } from './pages/GovDepartmentsPage';
import { GovOfficersPage } from './pages/GovOfficersPage';
import { GovAnalyticsPage } from './pages/GovAnalyticsPage';
import { GovDataSourcesPage } from './pages/GovDataSourcesPage';
import { GovAuditLogsPage } from './pages/GovAuditLogsPage';
import { GovSettingsPage } from './pages/GovSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Portal Routes */}
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/report" element={<PublicReportPage />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/insights" element={<PublicInsightsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Legacy / Direct Redirects */}
          <Route path="/reports" element={<Navigate to="/gov/reports" replace />} />
          <Route path="/admin" element={<Navigate to="/gov/overview" replace />} />

          {/* Government Portal Routes */}
          <Route
            path="/gov/overview"
            element={
              <GovLayout>
                <GovOverviewPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/reports"
            element={
              <GovLayout>
                <GovReportsCenterPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/ai-intelligence"
            element={
              <GovLayout>
                <GovAIIntelligencePage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/gis-explorer"
            element={
              <GovLayout>
                <GovGISExplorerPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/departments"
            element={
              <GovLayout>
                <GovDepartmentsPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/officers"
            element={
              <GovLayout>
                <GovOfficersPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/analytics"
            element={
              <GovLayout>
                <GovAnalyticsPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/sources"
            element={
              <GovLayout>
                <GovDataSourcesPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/audit"
            element={
              <GovLayout>
                <GovAuditLogsPage />
              </GovLayout>
            }
          />
          <Route
            path="/gov/settings"
            element={
              <GovLayout>
                <GovSettingsPage />
              </GovLayout>
            }
          />

          {/* Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
