
// src/components/IndividualMetrics.tsx
import React, { useEffect, useState } from 'react';
import CloudWatchService, { StreamMetrics } from '../services/cloudwatch.service';

interface IndividualMetricsProps {
  channelName: string;
  playerIndex: number;
}

const IndividualMetrics: React.FC<IndividualMetricsProps> = ({ 
  channelName,
  playerIndex 
}) => {
  const [metrics, setMetrics] = useState<StreamMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://7s0pbiqmb5.execute-api.us-east-2.amazonaws.com/prod';
  const API_KEY = process.env.REACT_APP_API_KEY || '';

  const cloudWatchService = new CloudWatchService(API_URL, API_KEY);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await cloudWatchService.getChannelMetrics(channelName, 60);
      setMetrics(result);
    } catch (err) {
      setError('Failed to fetch metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [channelName]);

  if (loading && !metrics) {
    return <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>Loading metrics...</div>;
  }

  if (error) {
    return <div style={{ color: '#ff4444', padding: '10px' }}>{error}</div>;
  }

  if (!metrics) return null;

  const latestBytes = metrics.egressBytes[metrics.egressBytes.length - 1]?.value || 0;
  const latestRequests = metrics.requestCount[metrics.requestCount.length - 1]?.value || 0;
  const latestLatency = metrics.responseTime[metrics.responseTime.length - 1]?.value || 0;
  const bitrate = cloudWatchService.calculateBitrate(latestBytes, 300);

  const styles = {
    container: {
      backgroundColor: '#2d2d2d',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #3d3d3d',
    },
    title: {
      fontSize: '14px',
      fontWeight: 'bold' as const,
      marginBottom: '10px',
      color: '#61dafb',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
    },
    metricCard: {
      backgroundColor: '#1e1e1e',
      padding: '10px',
      borderRadius: '4px',
    },
    metricLabel: {
      fontSize: '11px',
      color: '#999',
      marginBottom: '3px',
    },
    metricValue: {
      fontSize: '16px',
      fontWeight: 'bold' as const,
      color: '#fff',
    },
    errorRate: (rate: number) => ({
      color: rate > 5 ? '#ff4444' : rate > 1 ? '#ffaa00' : '#44ff44',
    }),
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        Player {playerIndex + 1}: {channelName}
      </div>
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Bitrate</div>
          <div style={styles.metricValue}>{bitrate}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Requests</div>
          <div style={styles.metricValue}>{latestRequests.toFixed(0)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Latency</div>
          <div style={styles.metricValue}>{latestLatency.toFixed(2)} ms</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Error Rate</div>
          <div style={{...styles.metricValue, ...styles.errorRate(metrics.errorRate)}}>
            {metrics.errorRate.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualMetrics;

