// client_v3/src/pages/market/MarketDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/design-system/ds/PageHeader';
import Card, { CardContent } from '@/design-system/ds/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BriefcaseBusiness } from 'lucide-react';
import apiFetch from '@/lib/utils/apiFetch';
import MarketKPI from './components/MarketKPI';
import NegotiationsTable from './components/NegotiationsTable';
import OffersTable from './components/OffersTable';

export default function MarketDashboard({ initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(null);
  const [negotiations, setNegotiations] = useState([]);
  const [offers, setOffers] = useState([]);

  // Optionally keep track of a selected negotiation for offers list
  const selectedNegotiationId = useMemo(() => negotiations?.[0]?.id || null, [negotiations]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      apiFetch('/api/market/overview').catch((e) => ({ __error: e })),
      apiFetch('/api/market/negotiations').catch((e) => ({ __error: e })),
    ])
      .then(async ([overviewRes, negotiationsRes]) => {
        if (!isMounted) return;

        if (overviewRes?.__error) throw overviewRes.__error;
        if (negotiationsRes?.__error) throw negotiationsRes.__error;

        setOverview(overviewRes?.kpi || null);
        setNegotiations(negotiationsRes?.data || []);

        // Fetch offers only if we have at least one negotiation (API requires negotiationId)
        const firstNegotiationId = negotiationsRes?.data?.[0]?.id;
        if (firstNegotiationId) {
          try {
            const offersRes = await apiFetch(`/api/market/offers?negotiationId=${firstNegotiationId}`);
            if (isMounted) setOffers(offersRes?.data || []);
          } catch (_) {
            if (isMounted) setOffers([]);
          }
        } else {
          setOffers([]);
        }
      })
      .catch((e) => {
        if (!isMounted) return;
        setError(e?.message || 'Errore di caricamento');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mercato / Trasferimenti"
        subtitle="Gestione trattative, offerte e budget di mercato"
        icon={<BriefcaseBusiness className="h-8 w-8 text-primary" />}
        actions={null}
      />

      {/* KPI BAR */}
      <Card>
        <CardContent>
          <MarketKPI data={overview} loading={loading} error={error} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="negotiations">Trattative</TabsTrigger>
          <TabsTrigger value="offers">Offerte</TabsTrigger>
        </TabsList>

        {/* Content switch */}
        <div className="mt-4">
          {activeTab === 'overview' && (
            <Card>
              <CardContent>
                <MarketKPI data={overview} loading={loading} error={error} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'negotiations' && (
            <Card>
              <CardContent className="p-0">
                <NegotiationsTable data={negotiations} loading={loading} error={error} />
              </CardContent>
            </Card>
          )}

          {activeTab === 'offers' && (
            <Card>
              <CardContent className="p-0">
                <OffersTable data={offers} loading={loading} error={error} negotiationId={selectedNegotiationId} />
              </CardContent>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  );
}


