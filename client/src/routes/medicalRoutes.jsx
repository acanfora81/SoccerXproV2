// client/src/routes/medicalRoutes.jsx
import React from 'react';
import { Route } from 'react-router-dom';
import Dashboard from '../pages/medical/Dashboard';
import InjuriesPage from '../pages/medical/InjuriesPage';
import VisitsPage from '../pages/medical/VisitsPage';
import CalendarPage from '../pages/medical/CalendarPage';
import CasesBoard from '../pages/medical/CasesBoard.placeholder';
import CaseWorkspace from '../pages/medical/CaseWorkspace.placeholder';
import DocumentsPage from '../pages/medical/DocumentsPage';
import ConsentsPage from '../pages/medical/ConsentsPage.placeholder';
import AnalyticsPage from '../pages/medical/AnalyticsPage.placeholder';
import AuditPage from '../pages/medical/AuditPage.placeholder';
import SettingsPage from '../pages/medical/SettingsPage';

export function medicalRoutes(base = '/medical') {
  return (
    <>
      <Route path={`${base}`} element={<Dashboard />} />
      <Route path={`${base}/dashboard`} element={<Dashboard />} />
      <Route path={`${base}/injuries`} element={<InjuriesPage />} />
      <Route path={`${base}/visits`} element={<VisitsPage />} />
      <Route path={`${base}/calendar`} element={<CalendarPage />} />
      <Route path={`${base}/cases`} element={<CasesBoard />} />
      <Route path={`${base}/cases/:id`} element={<CaseWorkspace />} />
      <Route path={`${base}/documents`} element={<DocumentsPage />} />
      <Route path={`${base}/consents`} element={<ConsentsPage />} />
      <Route path={`${base}/analytics`} element={<AnalyticsPage />} />
      <Route path={`${base}/audit`} element={<AuditPage />} />
      <Route path={`${base}/settings`} element={<SettingsPage />} />
    </>
  );
}
