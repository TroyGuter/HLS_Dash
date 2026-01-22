
import React, { useEffect, useRef, useState } from 'react';
import MetricsDashboard from './components/MetricsDashboard';
import IndividualMetrics from './components/IndividualMetrics';

const API_URL = process.env.REACT_APP_API_URL || 'https://7s0pbiqmb5.execute-api.us-east-2.amazonaws.com/prod';
const API_KEY = process.env.REACT_APP_API_KEY || '';

interface LayoutOption {
  name: string;
  rows: number;
  cols: number;
  totalPlayers: number;
}

const App: React.FC = () => {
  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ];

  const [hlsUrls, setHlsUrls] = useState<string[]>([]);
  const [channelNames, setChannelNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState([0, 1, 2, 3, 4, 5]);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showIndividualMetrics, setShowIndividualMetrics] = useState<boolean[]>([false, false, false, false, false, false]);
  const [videoSize, setVideoSize] = useState<number>(100);

  const [layout, setLayout] = useState<LayoutOption>(() => {
    const saved = localStorage.getItem('preferredLayout');
    return saved ? JSON.parse(saved) : { name: '4 Players', rows: 2, cols: 2, totalPlayers: 4 };
  });

  useEffect(() => {
    localStorage.setItem('preferredLayout', JSON.stringify(layout));
  }, [layout]);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/channels`, {
        headers: {
          'x-api-key': API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const channels = await response.json();
      console.log('Fetched channels:', channels);

      const urls: string[] = [];
      const names: string[] = [];

      channels.forEach((channel: any) => {
        channel.endpoints.forEach((endpoint: any) => {
          urls.push(endpoint.Url);
          names.push(channel.Description || channel.Id);
        });
      });

      setHlsUrls(urls);
      setChannelNames(names);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const loadVideo = async (videoRef: React.RefObject<HTMLVideoElement>, urlIndex: number) => {
    if (!videoRef.current || !hlsUrls[urlIndex]) return;
    
    const Hls = (await import('hls.js')).default;
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
      });
      hls.loadSource(hlsUrls[urlIndex]);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play();
      });
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = hlsUrls[urlIndex];
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
      });
    }
  };

  useEffect(() => {
    videoRefs.forEach((ref, index) => {
      if (index < layout.totalPlayers) {
        loadVideo(ref, selectedUrls[index]);
      }
    });
  }, [selectedUrls, hlsUrls, layout.totalPlayers]);

  const handleUrlChange = (playerIndex: number, urlIndex: number) => {
    const newSelectedUrls = [...selectedUrls];
    newSelectedUrls[playerIndex] = urlIndex;
    setSelectedUrls(newSelectedUrls);
  };

  const handleLayoutChange = (newLayout: LayoutOption) => {
    setLayout(newLayout);
  };

  const toggleIndividualMetrics = (index: number) => {
    const newShowMetrics = [...showIndividualMetrics];
    newShowMetrics[index] = !newShowMetrics[index];
    setShowIndividualMetrics(newShowMetrics);
  };

  const getChannelId = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 2];
  };

  const layouts: LayoutOption[] = [
    { name: '1 Player', rows: 1, cols: 1, totalPlayers: 1 },
    { name: '2 Players', rows: 1, cols: 2, totalPlayers: 2 },
    { name: '4 Players', rows: 2, cols: 2, totalPlayers: 4 },
    { name: '6 Players', rows: 2, cols: 3, totalPlayers: 6 },
  ];

  const activePlayers = videoRefs.slice(0, layout.totalPlayers);

  // Calculate player width based on size percentage
  // Base width calculation: at 100%, use layout columns; scale proportionally
  const baseWidthPercent = 100 / layout.cols;
  const playerWidthPercent = (baseWidthPercent * videoSize) / 100;
  
  // Calculate video height based on percentage
  const videoHeight = (300 * videoSize) / 100;

  const styles = {
    appContainer: {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: '#f0f0f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    },
    appHeader: {
      backgroundColor: '#282c34',
      color: 'white',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      position: 'relative' as const,
      flexWrap: 'wrap' as const,
      gap: '15px',
    },
    heading: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#61dafb',
      margin: 0,
      position: 'absolute' as const,
      left: '20px',
    },
    layoutSelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap' as const,
    },
    layoutLabel: {
      fontWeight: 600,
      color: 'white',
      marginRight: '5px',
    },
    layoutBtn: (isActive: boolean) => ({
      padding: '8px 16px',
      border: '2px solid #61dafb',
      backgroundColor: isActive ? '#61dafb' : '#282c34',
      color: isActive ? '#282c34' : '#61dafb',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? 600 : 500,
      transition: 'all 0.3s ease',
    }),
    sizeControl: {
      position: 'absolute' as const,
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    sizeLabel: {
      fontWeight: 600,
      color: 'white',
      fontSize: '14px',
    },
    slider: {
      width: '120px',
      height: '6px',
      borderRadius: '3px',
      background: '#3d3d3d',
      outline: 'none',
      cursor: 'pointer',
    },
    sizeValue: {
      fontWeight: 600,
      color: '#61dafb',
      fontSize: '14px',
      minWidth: '50px',
    },
    statusBar: {
      padding: '10px 20px',
      backgroundColor: '#fff',
      borderBottom: '1px solid #ddd',
      minHeight: '40px',
    },
    errorText: {
      color: 'red',
      fontWeight: 600,
      margin: 0,
    },
    videoGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '20px',
      padding: '20px',
      flex: 1,
      overflow: 'auto',
      alignContent: 'flex-start',
    },
    playerContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
      width: `calc(${playerWidthPercent}% - 20px)`,
      minWidth: '200px',
      flexShrink: 0,
    },
    videoWrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
      width: '100%',
    },
    playerLabel: {
      position: 'absolute' as const,
      top: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 600,
      zIndex: 10,
      pointerEvents: 'none' as const,
      maxWidth: 'calc(100% - 20px)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    videoPlayer: {
      width: '100%',
      height: `${videoHeight}px`,
      backgroundColor: '#000',
      objectFit: 'contain' as const,
    },
    channelDropdown: {
      padding: '8px',
      fontSize: '14px',
      backgroundColor: '#fff',
      border: 'none',
      borderTop: '1px solid #ddd',
      cursor: 'pointer',
    },
    metricsToggleBtn: {
      padding: '8px 16px',
      backgroundColor: '#61dafb',
      color: '#282c34',
      border: 'none',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      borderRadius: '4px',
    },
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.appHeader}>
        <h1 style={styles.heading}>LS-AMER LPV DASHBOARD</h1>
        <div style={styles.layoutSelector}>
          <span style={styles.layoutLabel}>Layout:</span>
          {layouts.map((layoutOption) => (
            <button
              key={layoutOption.name}
              style={styles.layoutBtn(layout.totalPlayers === layoutOption.totalPlayers)}
              onClick={() => handleLayoutChange(layoutOption)}
              onMouseOver={(e) => {
                if (layout.totalPlayers !== layoutOption.totalPlayers) {
                  e.currentTarget.style.backgroundColor = '#61dafb';
                  e.currentTarget.style.color = '#282c34';
                }
              }}
              onMouseOut={(e) => {
                if (layout.totalPlayers !== layoutOption.totalPlayers) {
                  e.currentTarget.style.backgroundColor = '#282c34';
                  e.currentTarget.style.color = '#61dafb';
                }
              }}
            >
              {layoutOption.name}
            </button>
          ))}
        </div>
        
        <div style={styles.sizeControl}>
          <span style={styles.sizeLabel}>Player Size:</span>
          <input
            type="range"
            min="50"
            max="150"
            value={videoSize}
            onChange={(e) => setVideoSize(Number(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.sizeValue}>{videoSize}%</span>
        </div>
      </header>

      <div style={styles.statusBar}>
        {loading && <p>Loading channels from AWS...</p>}
        {error && <p style={styles.errorText}>Error: {error}</p>}
        {!loading && hlsUrls.length === 0 && <p>No channels found. Deploy the Lambda function first.</p>}
      </div>

      <div style={styles.videoGrid}>
        {activePlayers.map((ref, index) => (
          <div key={index} style={styles.playerContainer}>
            <div style={styles.videoWrapper}>
              <div style={styles.playerLabel}>
                Stream {index + 1}: {channelNames[selectedUrls[index]] || getChannelId(hlsUrls[selectedUrls[index]] || '')}
              </div>
              <video ref={ref} controls autoPlay muted style={styles.videoPlayer} />
              <select 
                style={styles.channelDropdown}
                value={selectedUrls[index]}
                onChange={(e) => handleUrlChange(index, parseInt(e.target.value))}
              >
                {hlsUrls.map((url, urlIndex) => (
                  <option key={urlIndex} value={urlIndex}>
                    {channelNames[urlIndex] || getChannelId(url)}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              style={styles.metricsToggleBtn}
              onClick={() => toggleIndividualMetrics(index)}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4fa8c5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#61dafb'}
            >
              {showIndividualMetrics[index] ? 'Hide Metrics ▲' : 'Show Metrics ▼'}
            </button>

            {showIndividualMetrics[index] && (
              <IndividualMetrics 
                channelName={channelNames[selectedUrls[index]] || getChannelId(hlsUrls[selectedUrls[index]] || '')}
                playerIndex={index}
              />
            )}
          </div>
        ))}
      </div>

      <MetricsDashboard
        channelNames={channelNames}
        activeChannelIndices={selectedUrls.slice(0, layout.totalPlayers)}
        isVisible={showMetrics}
        onToggle={() => setShowMetrics(!showMetrics)}
      />
    </div>
  );
};

export default App;

