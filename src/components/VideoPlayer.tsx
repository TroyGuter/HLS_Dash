
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import './VideoPlayer.css';

interface VideoPlayerProps {
  streamUrl: string;
  playerLabel: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, playerLabel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

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
    <div className="video-player-container">
      <div className="player-label">{playerLabel}</div>
      <video
        ref={videoRef}
        className="video-player"
        controls
        muted
      />
    </div>
  );
};

export default VideoPlayer;

