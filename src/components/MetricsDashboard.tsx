
// src/components/MetricsDashboard.tsx
import React, { useEffect, useState } from 'react';
import CloudWatchService, { StreamMetrics } from '../services/cloudwatch.service';

interface MetricsDashboardProps {
  channelNames: string[];
  isVisible: boolean;
  onToggle: () => void;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ 
  channelNames, 
  isVisible,
  onToggle 
}) => {
  const [metrics, setMetrics] = useState<StreamMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

const API_URL = process.env.REACT_APP_API_URL || 'https://7s0pbiqmb5.execute-api.us-east-2.amazonaws.com/prod';
const API_KEY = process.env.REACT_APP_API_KEY || '';

const cloudWatchService = new CloudWatchService(API_URL, API_KEY);


  const fetchMetrics = async () => {
    if (channelNames.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const metricsPromises = channelNames.map(name => 
        cloudWatchService.getChannelMetrics(name, 60)
      );
      const results = await Promise.all(metricsPromises);
      setMetrics(results);
    } catch (err) {
      setError('Failed to fetch metrics from CloudWatch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchMetrics();
    }
  }, [isVisible, channelNames]);

  useEffect(() => {
    if (!autoRefresh || !isVisible) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh, isVisible, channelNames]);

  const calculateTotalBandwidth = () => {
    const total = metrics.reduce((sum, metric) => {
      const latestBytes = metric.egressBytes[metric.egressBytes.length - 1]?.value || 0;
      return sum + latestBytes;
    }, 0);
    return cloudWatchService.formatBytes(total);
  };

  const calculateAverageLatency = () => {
    if (metrics.length === 0) return '0 ms';
    const total = metrics.reduce((sum, metric) => {
      const latestLatency = metric.responseTime[metric.responseTime.length - 1]?.value || 0;
      return sum + latestLatency;
    }, 0);
    return (total / metrics.length).toFixed(2) + ' ms';
  };

  const styles = {
    container: {
      position: 'fixed' as const,
      right: isVisible ? '0' : '-400px',
      top: '0',
      width: '400px',
      height: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.3)',
      transition: 'right 0.3s ease',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    toggleButton: {
      position: 'fixed' as const,
      right: isVisible ? '400px' : '0',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#61dafb',
      color: '#282c34',
      border: 'none',
      padding: '15px 10px',
      cursor: 'pointer',
      borderRadius: '5px 0 0 5px',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'right 0.3s ease',
      zIndex: 1001,
    },
    header: {
      padding: '20px',
      backgroundColor: '#282c34',
      borderBottom: '2px solid #61dafb',
    },
    title: {
      margin: '0 0 10px 0',
      fontSize: '20px',
      fontWeight: 'bold',
    },
    controls: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
    },
    refreshButton: {
      padding: '5px 10px',
      backgroundColor: '#61dafb',
      color: '#282c34',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    autoRefreshLabel: {
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px',
    },
    summaryCards: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '20px',
    },
    card: {
      backgroundColor: '#2d2d2d',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #3d3d3d',
    },
    cardTitle: {
      fontSize: '12px',
      color: '#999',
      marginBottom: '5px',
    },
    cardValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#61dafb',
    },
    channelMetrics: {
      marginTop: '20px',
    },
    channelCard: {
      backgroundColor: '#2d2d2d',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '15px',
      border: '1px solid #3d3d3d',
    },
    channelName: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#61dafb',
    },
    metricRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '5px 0',
      fontSize: '14px',
    },
    metricLabel: {
      color: '#999',
    },
    metricValue: {
      color: '#fff',
      fontWeight: 'bold',
    },
    errorRate: (rate: number) => ({
      color: rate > 5 ? '#ff4444' : rate > 1 ? '#ffaa00' : '#44ff44',
    }),
    loading: {
      textAlign: 'center' as const,
      padding: '20px',
      color: '#999',
    },
    error: {
      backgroundColor: '#ff4444',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      marginBottom: '10px',
    },
  };

  return (
    <>
      <button style={styles.toggleButton} onClick={onToggle}>
        {isVisible ? '→' : '← Metrics'}
      </button>
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>CloudWatch Metrics</h2>
          <div style={styles.controls}>
            <button style={styles.refreshButton} onClick={fetchMetrics} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <label style={styles.autoRefreshLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
        </div>

        <div style={styles.content}>
          {error && <div style={styles.error}>{error}</div>}
          
          {loading && metrics.length === 0 ? (
            <div style={styles.loading}>Loading metrics...</div>
          ) : (
            <>
              <div style={styles.summaryCards}>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Total Bandwidth</div>
                  <div style={styles.cardValue}>{calculateTotalBandwidth()}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Avg Latency</div>
                  <div style={styles.cardValue}>{calculateAverageLatency()}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Active Streams</div>
                  <div style={styles.cardValue}>{metrics.length}</div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>Status</div>
                  <div style={styles.cardValue}>
                    {metrics.every(m => m.errorRate < 1) ? '✓ Healthy' : '⚠ Issues'}
                  </div>
                </div>
              </div>

              <div style={styles.channelMetrics}>
                <h3>Channel Details</h3>
                {metrics.map((metric, index) => {
                  const latestBytes = metric.egressBytes[metric.egressBytes.length - 1]?.value || 0;
                  const latestRequests = metric.requestCount[metric.requestCount.length - 1]?.value || 0;
                  const latestLatency = metric.responseTime[metric.responseTime.length - 1]?.value || 0;
                  const bitrate = cloudWatchService.calculateBitrate(latestBytes, 300);

                  return (
                    <div key={index} style={styles.channelCard}>
                      <div style={styles.channelName}>{metric.channelName}</div>
                      <div style={styles.metricRow}>
                        <span style={styles.metricLabel}>Bitrate:</span>
                        <span style={styles.metricValue}>{bitrate}</span>
                      </div>
                      <div style={styles.metricRow}>
                        <span style={styles.metricLabel}>Requests:</span>
                        <span style={styles.metricValue}>{latestRequests.toFixed(0)}</span>
                      </div>
                      <div style={styles.metricRow}>
                        <span style={styles.metricLabel}>Latency:</span>
                        <span style={styles.metricValue}>{latestLatency.toFixed(2)} ms</span>
                      </div>
                      <div style={styles.metricRow}>
                        <span style={styles.metricLabel}>Error Rate:</span>
                        <span style={{...styles.metricValue, ...styles.errorRate(metric.errorRate)}}>
                          {metric.errorRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MetricsDashboard;

