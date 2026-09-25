"use client";

import { useEffect, useState } from "react";
import { PageHeading, SectionCard } from "@/components/admin/ui/PageHeading";
import { LoadingCard, ErrorState } from "@/components/admin/ui/States";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { fetchStatisticsSeries } from "@/lib/admin/api";
import type { TimeSeriesPoint } from "@/types/admin";

interface Series {
  userGrowth: TimeSeriesPoint[];
  activeUsers: TimeSeriesPoint[];
  messageVolume: TimeSeriesPoint[];
  newConversations: TimeSeriesPoint[];
  reports: TimeSeriesPoint[];
  blockedUsers: TimeSeriesPoint[];
}

export default function AdminStatisticsPage() {
  const [series, setSeries] = useState<Series | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    setSeries(null);
    fetchStatisticsSeries()
      .then(setSeries)
      .catch(() => setError("Couldn't load statistics."));
  }

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeading title="Statistics" description="Trends across users, activity, and moderation over recent weeks." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="User growth, last 8 weeks">
          {series ? <LineChart data={series.userGrowth} color="#3854E0" /> : <LoadingCard lines={4} />}
        </ChartCard>
        <ChartCard title="Active users, last 7 days">
          {series ? <LineChart data={series.activeUsers} color="#1E8F5F" /> : <LoadingCard lines={4} />}
        </ChartCard>
        <ChartCard title="Message volume, last 7 days">
          {series ? <BarChart data={series.messageVolume} color="#3854E0" /> : <LoadingCard lines={4} />}
        </ChartCard>
        <ChartCard title="New conversations, last 8 weeks">
          {series ? <BarChart data={series.newConversations} color="#7A5AF8" /> : <LoadingCard lines={4} />}
        </ChartCard>
        <ChartCard title="Reports filed, last 8 weeks">
          {series ? <BarChart data={series.reports} color="#C4392B" /> : <LoadingCard lines={4} />}
        </ChartCard>
        <ChartCard title="Blocked users, cumulative">
          {series ? <LineChart data={series.blockedUsers} color="#B7791F" /> : <LoadingCard lines={4} />}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SectionCard title={title}>
      <div className="p-4">{children}</div>
    </SectionCard>
  );
}
