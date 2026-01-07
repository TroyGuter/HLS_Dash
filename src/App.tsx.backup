import React, { useEffect, useRef, useState } from 'react';

const App: React.FC = () => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const video4Ref = useRef<HTMLVideoElement>(null);
  const video5Ref = useRef<HTMLVideoElement>(null);
  const video6Ref = useRef<HTMLVideoElement>(null);

  const [hlsUrls, setHlsUrls] = useState<string[]>([]);
  const [channelNames, setChannelNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://7s0pbiqmb5.execute-api.us-east-2.amazonaws.com/prod/channels');
      
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
  const [selectedUrls, setSelectedUrls] = useState([0, 1, 2, 3, 4, 5]);

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
    const videoRefs = [video1Ref, video2Ref, video3Ref, video4Ref, video5Ref, video6Ref];
    videoRefs.forEach((ref, index) => {
      loadVideo(ref, selectedUrls[index]);
    });
  }, [selectedUrls, hlsUrls]);

  const handleUrlChange = (playerIndex: number, urlIndex: number) => {
    const newSelectedUrls = [...selectedUrls];
    newSelectedUrls[playerIndex] = urlIndex;
    setSelectedUrls(newSelectedUrls);
  };

  const getChannelId = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 2];
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f0f0f0',
      margin: '20px'
    },
    heading: {
      color: 'blue',
      textAlign: 'center' as const
    },
    videoContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    videoWrapper: {
      display: 'flex',
      flexDirection: 'column' as const
    },
    videoTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '8px',
      textAlign: 'center' as const
    },
    video: {
      width: '100%',
      height: '200px',
      backgroundColor: '#000'
    },
    ingestText: {
      fontSize: '12px',
      color: '#666',
      marginTop: '4px',
      textAlign: 'center' as const
    },
    dropdown: {
      marginTop: '8px',
      padding: '4px',
      fontSize: '12px'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>LS-AMER LPV DASHBOARD</h1>
      <p>If you can see this, React is working!</p>
      {loading && <p>Loading channels from AWS...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {!loading && hlsUrls.length === 0 && <p>No channels found. Deploy the Lambda function first.</p>}
      <div style={styles.videoContainer}>
        {[video1Ref, video2Ref, video3Ref, video4Ref, video5Ref, video6Ref].map((ref, index) => (
          <div key={index} style={styles.videoWrapper}>
            <div style={styles.videoTitle}>Stream {index + 1}</div>
            <video ref={ref} controls autoPlay muted style={styles.video} />
            <div style={styles.ingestText}>Ingest: {channelNames[selectedUrls[index]] || getChannelId(hlsUrls[selectedUrls[index]] || '')}</div>
            <select 
              style={styles.dropdown}
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
        ))}
      </div>
    </div>
  );
};

export default App;