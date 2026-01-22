
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import IndividualMetrics from './IndividualMetrics';
import './VideoPlayer.css';

interface VideoPlayerProps {
  streamUrl: string;
  playerLabel: string;
  playerIndex: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, playerLabel, playerIndex }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.log('Autoplay prevented:', err));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => console.log('Autoplay prevented:', err));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '10px',
      width: '100%'
    }}>
      <div className="video-player-container">
        <div className="player-label">{playerLabel}</div>
        <video
          ref={videoRef}
          className="video-player"
          controls
          muted
        />
      </div>

      {/* Metrics Toggle Button */}
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#61dafb',
          color: '#282c34',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4fa8c5'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#61dafb'}
      >
        {showMetrics ? 'Hide Metrics ▲' : 'Show Metrics ▼'}
      </button>

      {/* Collapsible Metrics Panel */}
      {showMetrics && (
        <IndividualMetrics 
          channelName={playerLabel}
          playerIndex={playerIndex}
        />
      )}
    </div>
  );
};

export default VideoPlayer;