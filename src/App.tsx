
import React, { useEffect, useRef, useState } from 'react';
import MetricsDashboard from './components/MetricsDashboard';
import IndividualMetrics from './components/IndividualMetrics';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://7s0pbiqmb5.execute-api.us-east-2.amazonaws.com/prod';
const API_KEY = process.env.REACT_APP_API_KEY || '';

interface Layout {
  totalPlayers: number;
  columns: number;
}

const App: React.FC = () => {
  const [hlsUrls, setHlsUrls] = useState<string[]>([]);
  const [channelNames, setChannelNames] = useState<string[]>([]);
  const [mediaLiveChannelIds, setMediaLiveChannelIds] = useState<(string | undefined)[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [layout, setLayout] = useState<Layout>({ totalPlayers: 4, columns: 2 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showIndividualMetrics, setShowIndividualMetrics] = useState<boolean[]>([false, false, false, false, false, false]);
  const [videoSize, setVideoSize] = useState<number>(100);

  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null)
  ];

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch MediaPackage channels
      const channelsResponse = await fetch(`${API_URL}/channels`, {
        headers: { 'x-api-key': API_KEY }
      });

      if (!channelsResponse.ok) {
        throw new Error(`HTTP ${channelsResponse.status}: ${channelsResponse.statusText}`);
      }

      const channels = await channelsResponse.json();
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

      // Fetch channel mapping (MediaLive <-> MediaPackage)
      try {
        const mappingResponse = await fetch(`${API_URL}/channel-mapping`, {
          headers: { 'x-api-key': API_KEY }
        });

        if (mappingResponse.ok) {
          const mappingData = await mappingResponse.json();

          // Create array of MediaLive channel IDs matching the order of MediaPackage channels
          const mlIds = names.map(mpName => {
            const mapping = mappingData.mapping.find(
              (m: any) => 
                m.mediaPackageChannelName === mpName || 
                m.mediaPackageChannelId === mpName ||
                m.mediaPackageChannelName.includes(mpName) ||
                mpName.includes(m.mediaPackageChannelId)
            );
            return mapping?.mediaLiveChannelId;
          });

          setMediaLiveChannelIds(mlIds);
          console.log('Channel mapping loaded:', mlIds);
        } else {
          console.warn('Channel mapping endpoint not available, continuing without MediaLive metrics');
          setMediaLiveChannelIds(new Array(names.length).fill(undefined));
        }
      } catch (mappingError) {
        console.warn('Could not fetch channel mapping:', mappingError);
        setMediaLiveChannelIds(new Array(names.length).fill(undefined));
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hlsUrls.length > 0) {
      videoRefs.forEach((ref, index) => {
        if (index < layout.totalPlayers) {
          loadVideo(ref, selectedUrls[index], index);
        }
      });
    }
  }, [selectedUrls, hlsUrls, layout.totalPlayers]);

  const loadVideo = async (
    videoRef: React.RefObject<HTMLVideoElement>,
    urlIndex: number,
    playerIndex: number
  ) => {
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

  const handleChannelChange = (playerIndex: number, newUrlIndex: number) => {
    const newSelectedUrls = [...selectedUrls];
    newSelectedUrls[playerIndex] = newUrlIndex;
    setSelectedUrls(newSelectedUrls);
  };

  const changeLayout = (totalPlayers: number, columns: number) => {
    setLayout({ totalPlayers, columns });
  };

  const toggleIndividualMetrics = (index: number) => {
    const newShowMetrics = [...showIndividualMetrics];
    newShowMetrics[index] = !newShowMetrics[index];
    setShowIndividualMetrics(newShowMetrics);
  };

  // Calculate player width based on size percentage
  const baseWidthPercent = 100 / layout.columns;
  const playerWidthPercent = (baseWidthPercent * videoSize) / 100;
  const videoHeight = (300 * videoSize) / 100;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#61dafb',
        fontSize: '20px'
      }}>
        Loading channels...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#f44336',
        fontSize: '18px'
      }}>
        <div>Error: {error}</div>
        <button 
          onClick={fetchEndpoints}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#61dafb',
            color: '#282c34',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#282c34', 
      minHeight: '100vh',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        position: 'relative'
      }}>
        <h1 style={{ 
          color: '#61dafb',
          margin: 0,
          fontSize: '24px'
        }}>
          LS-AMER LPV Dashboard
        </h1>

        {/* Layout Selector Buttons - Centered */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => changeLayout(1, 1)}
            style={{
              padding: '10px 20px',
              backgroundColor: layout.totalPlayers === 1 ? '#61dafb' : '#3d3d3d',
              color: layout.totalPlayers === 1 ? '#282c34' : '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            1 Player
          </button>
          <button
            onClick={() => changeLayout(2, 2)}
            style={{
              padding: '10px 20px',
              backgroundColor: layout.totalPlayers === 2 ? '#61dafb' : '#3d3d3d',
              color: layout.totalPlayers === 2 ? '#282c34' : '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            2 Players
          </button>
          <button
            onClick={() => changeLayout(4, 2)}
            style={{
              padding: '10px 20px',
              backgroundColor: layout.totalPlayers === 4 ? '#61dafb' : '#3d3d3d',
              color: layout.totalPlayers === 4 ? '#282c34' : '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            4 Players
          </button>
          <button
            onClick={() => changeLayout(6, 3)}
            style={{
              padding: '10px 20px',
              backgroundColor: layout.totalPlayers === 6 ? '#61dafb' : '#3d3d3d',
              color: layout.totalPlayers === 6 ? '#282c34' : '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            6 Players
          </button>
        </div>

        {/* Video Size Slider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Player Size:</span>
          <input
            type="range"
            min="50"
            max="150"
            value={videoSize}
            onChange={(e) => setVideoSize(Number(e.target.value))}
            style={{
              width: '120px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#61dafb', minWidth: '50px' }}>
            {videoSize}%
          </span>
        </div>
      </div>

      {/* Video Players Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '20px',
        alignContent: 'flex-start'
      }}>
        {videoRefs.slice(0, layout.totalPlayers).map((ref, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: `calc(${playerWidthPercent}% - 20px)`,
            minWidth: '200px',
            flexShrink: 0
          }}>
            <div style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '8px',
              padding: '15px',
              border: '2px solid #3d3d3d'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <label style={{ 
                  fontSize: '14px',
                  color: '#61dafb',
                  fontWeight: 600
                }}>
                  Player {index + 1}
                </label>
                <select
                  value={selectedUrls[index]}
                  onChange={(e) => handleChannelChange(index, parseInt(e.target.value))}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#3d3d3d',
                    color: '#ffffff',
                    border: '1px solid #61dafb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {channelNames.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <video
                ref={ref}
                controls
                style={{
                  width: '100%',
                  height: `${videoHeight}px`,
                  backgroundColor: '#000',
                  borderRadius: '4px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Individual Metrics Toggle Button */}
            <button
              onClick={() => toggleIndividualMetrics(index)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#61dafb',
                color: '#282c34',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4fa8c5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#61dafb'}
            >
              {showIndividualMetrics[index] ? 'Hide Metrics ▲' : 'Show Metrics ▼'}
            </button>

            {/* Individual Metrics Panel - Docked Under Video */}
            {showIndividualMetrics[index] && (
              <IndividualMetrics 
                channelName={channelNames[selectedUrls[index]]}
                playerIndex={index}
                mediaLiveChannelId={mediaLiveChannelIds[selectedUrls[index]]}
              />
            )}
          </div>
        ))}
      </div>

      {/* Side Panel Metrics Dashboard */}
      <MetricsDashboard
        channelNames={channelNames}
        mediaLiveChannelIds={mediaLiveChannelIds}
        activeChannelIndices={selectedUrls.slice(0, layout.totalPlayers)}
        isVisible={showMetrics}
        onToggle={() => setShowMetrics(!showMetrics)}
      />
    </div>
  );
};

export default App;

