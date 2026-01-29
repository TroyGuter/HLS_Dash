
import React, { useEffect, useState } from 'react';
import CloudWatchService from '../services/cloudwatch.service';
import { StreamMetrics } from '../services/cloudwatch.service';

const API_URL = process.env.REACT_APP_API_URL || 'https://7s0pbiqmb5.execute-api.us-east-2.amazonaws.com/prod';
const API_KEY = process.env.REACT_APP_API_KEY || '';

interface MetricsDashboardProps {
  channelNames: string[];
  mediaLiveChannelIds: (string | undefined)[];
  activeChannelIndices: number[];
  isVisible: boolean;
  onToggle: () => void;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  channelNames,
  mediaLiveChannelIds,
  activeChannelIndices,
  isVisible,
  onToggle
}) => {
  const [metrics, setMetrics] = useState<StreamMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const cloudWatchService = new CloudWatchService(API_URL, API_KEY);

  const fetchMetrics = async () => {
    const activeChannelNames = activeChannelIndices.map(index => channelNames[index]);
    const activeMLChannelIds = activeChannelIndices.map(index => mediaLiveChannelIds[index]);

    if (activeChannelNames.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const metricsPromises = activeChannelNames.map((name, idx) =>
        cloudWatchService.getChannelMetrics(name, activeMLChannelIds[idx], 60)
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
  }, [isVisible, activeChannelIndices]);

  useEffect(() => {
    if (!autoRefresh || !isVisible) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isVisible, activeChannelIndices]);

  const styles = {
    container: {
      position: 'fixed' as const,
      right: isVisible ? 0 : '-400px',
      top: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#ffffff',
      boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
      transition: 'right 0.3s ease',
      zIndex: 1000,
      overflowY: 'auto' as const,
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: '2px solid #61dafb'
    },
    title: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#61dafb',
      margin: 0
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
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '5px 0 0 5px',
      transition: 'right 0.3s ease',
      zIndex: 1001,
      writingMode: 'vertical-rl' as const,
      textOrientation: 'mixed' as const
    },
    controls: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    },
    button: {
      padding: '8px 12px',
      backgroundColor: '#61dafb',
      color: '#282c34',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600
    },
    channelCard: {
      backgroundColor: '#2d2d2d',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      border: '1px solid #3d3d3d'
    },
    channelName: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#61dafb',
      marginBottom: '5px',
      display: 'flex',
      alignItems: 'center'
    },
    channelSubtitle: {
      fontSize: '12px',
      color: '#999',
      marginBottom: '15px'
    },
    sectionHeader: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#ffffff',
      marginTop: '15px',
      marginBottom: '10px',
      paddingBottom: '5px',
      borderBottom: '1px solid #3d3d3d'
    },
    metricRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #3d3d3d'
    },
    metricLabel: {
      fontSize: '13px',
      color: '#ccc'
    },
    metricValue: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#61dafb'
    },
    statusIndicator: (status: 'good' | 'warning' | 'error') => ({
      display: 'inline-block',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: status === 'good' ? '#4caf50' : status === 'warning' ? '#ff9800' : '#f44336',
      marginRight: '8px'
    }),
    loadingText: {
      textAlign: 'center' as const,
      color: '#999',
      padding: '20px'
    },
    errorText: {
      color: '#f44336',
      padding: '20px',
      textAlign: 'center' as const
    }
  };

  const getHealthStatus = (metric: StreamMetrics): 'good' | 'warning' | 'error' => {
    if (metric.mediaPackage.errorRate > 5) return 'error';
    if (metric.mediaPackage.errorRate > 1) return 'warning';
    return 'good';
  };

  return (
    <>
      <button style={styles.toggleButton} onClick={onToggle}>
        {isVisible ? '→ Metrics' : '← Metrics'}
      </button>

      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Stream Metrics</h2>
        </div>

        <div style={styles.controls}>
          <button style={styles.button} onClick={fetchMetrics}>
            Refresh Now
          </button>
          <button
            style={{
              ...styles.button,
              backgroundColor: autoRefresh ? '#61dafb' : '#3d3d3d'
            }}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>

        {loading && <div style={styles.loadingText}>Loading metrics...</div>}
        {error && <div style={styles.errorText}>{error}</div>}

        {!loading && !error && metrics.map((metric, index) => {
          const playerIndex = activeChannelIndices[index];
          const healthStatus = getHealthStatus(metric);

          // MediaPackage metrics
          const mpLatestBytes = cloudWatchService.getLatestValue(metric.mediaPackage.egressBytes);
          const mpBitrate = cloudWatchService.calculateBitrate(mpLatestBytes, 300);
          const mpLatestRequests = cloudWatchService.getLatestValue(metric.mediaPackage.requestCount);
          const mpLatestLatency = cloudWatchService.getLatestValue(metric.mediaPackage.responseTime);

          // MediaLive metrics (if available)
          const mlInputFps = metric.mediaLive
            ? cloudWatchService.getLatestValue(metric.mediaLive.pipeline0.inputVideoFrameRate)
            : null;
          const mlOutputFps = metric.mediaLive
            ? cloudWatchService.getLatestValue(metric.mediaLive.pipeline0.outputVideoFrameRate)
            : null;
          const mlDroppedFrames = metric.mediaLive?.pipeline0.droppedFrames
            ? cloudWatchService.getLatestValue(metric.mediaLive.pipeline0.droppedFrames)
            : null;
          const mlNetworkOut = metric.mediaLive?.pipeline0.networkOut
            ? cloudWatchService.getLatestValue(metric.mediaLive.pipeline0.networkOut)
            : null;

          // Pipeline 1 metrics for redundancy monitoring
          const mlInputFpsP1 = metric.mediaLive
            ? cloudWatchService.getLatestValue(metric.mediaLive.pipeline1.inputVideoFrameRate)
            : null;
          const mlOutputFpsP1 = metric.mediaLive
            ? cloudWatchService.getLatestValue(metric.mediaLive.pipeline1.outputVideoFrameRate)
            : null;

          return (
            <div key={index} style={styles.channelCard}>
              <div style={styles.channelName}>
                <span style={styles.statusIndicator(healthStatus)}></span>
                Player {playerIndex + 1}: {metric.channelName}
              </div>
              {metric.mediaLiveChannelId && (
                <div style={styles.channelSubtitle}>
                  MediaLive: {metric.mediaLiveChannelId}
                </div>
              )}

              {/* MediaLive Section */}
              {metric.mediaLive && (
                <>
                  <div style={styles.sectionHeader}>MediaLive (Encoding)</div>
                  
                  {/* Pipeline 0 */}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '10px', marginBottom: '5px' }}>
                    Pipeline 0
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Input FPS:</span>
                    <span style={styles.metricValue}>
                      {mlInputFps !== null ? mlInputFps.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Output FPS:</span>
                    <span style={styles.metricValue}>
                      {mlOutputFps !== null ? mlOutputFps.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  {mlDroppedFrames !== null && (
                    <div style={styles.metricRow}>
                      <span style={styles.metricLabel}>Dropped Frames:</span>
                      <span style={styles.metricValue}>
                        {mlDroppedFrames.toFixed(0)}
                      </span>
                    </div>
                  )}
                  {mlNetworkOut !== null && (
                    <div style={styles.metricRow}>
                      <span style={styles.metricLabel}>Network Out:</span>
                      <span style={styles.metricValue}>
                        {cloudWatchService.calculateBitrate(mlNetworkOut, 300)}
                      </span>
                    </div>
                  )}

                  {/* Pipeline 1 */}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '10px', marginBottom: '5px' }}>
                    Pipeline 1 (Redundancy)
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Input FPS:</span>
                    <span style={styles.metricValue}>
                      {mlInputFpsP1 !== null ? mlInputFpsP1.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Output FPS:</span>
                    <span style={styles.metricValue}>
                      {mlOutputFpsP1 !== null ? mlOutputFpsP1.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </>
              )}

              {/* MediaPackage Section */}
              <div style={styles.sectionHeader}>MediaPackage (Delivery)</div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Bitrate:</span>
                <span style={styles.metricValue}>{mpBitrate}</span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Requests:</span>
                <span style={styles.metricValue}>{mpLatestRequests.toFixed(0)}</span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Latency:</span>
                <span style={styles.metricValue}>{mpLatestLatency.toFixed(2)} ms</span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Error Rate:</span>
                <span style={styles.metricValue}>{metric.mediaPackage.errorRate.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MetricsDashboard;

