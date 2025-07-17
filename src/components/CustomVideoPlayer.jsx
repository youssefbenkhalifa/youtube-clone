import React, { useState, useRef, useEffect, useCallback } from 'react';
import './CustomVideoPlayer.css';

const CustomVideoPlayer = ({ src, poster, title, onTheaterMode }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const buttonClickRef = useRef(false);

  // State variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaybackRateMenu, setShowPlaybackRateMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Format time in MM:SS or HH:MM:SS format
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Handle volume change
  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toggle theater mode
  const toggleTheaterMode = useCallback(() => {
    console.log('Theater mode toggled:', !isTheaterMode);
    setIsTheaterMode(!isTheaterMode);
    if (onTheaterMode) {
      onTheaterMode(!isTheaterMode);
    }
  }, [isTheaterMode, onTheaterMode]);

  // Toggle picture-in-picture
  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPictureInPicture(true);
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  }, []);

  // Handle playback rate change
  const handlePlaybackRateChange = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackRateMenu(false);
    }
  };

  // Show/hide controls
  const showControlsTemporarily = () => {
    console.log('showControlsTemporarily called, buttonClickRef:', buttonClickRef.current);
    // Don't override button click timeout
    if (buttonClickRef.current) {
      console.log('Ignoring mouse movement, button was recently clicked');
      return;
    }
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      console.log('Auto-hide timeout from mouse movement');
      if (isPlaying && !buttonClickRef.current) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Handle control button clicks - keep controls visible longer
  const handleControlButtonClick = (callback) => {
    return (e) => {
      console.log('Control button clicked, preventing auto-hide');
      e.stopPropagation();
      buttonClickRef.current = true;
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      if (callback) callback();
      // Keep controls visible for 5 seconds after button click
      controlsTimeoutRef.current = setTimeout(() => {
        console.log('Auto-hide timeout triggered after button click');
        buttonClickRef.current = false;
        if (isPlaying) {
          setShowControls(false);
        }
      }, 5000);
    };
  };

  // Skip forward/backward
  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  }, []);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleEnterPip = () => {
      setIsPictureInPicture(true);
    };

    const handleLeavePip = () => {
      setIsPictureInPicture(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('enterpictureinpicture', handleEnterPip);
    video.addEventListener('leavepictureinpicture', handleLeavePip);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('enterpictureinpicture', handleEnterPip);
      video.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'j':
          skip(-10);
          break;
        case 'l':
          skip(10);
          break;
        case 'i':
          togglePictureInPicture();
          break;
        case 't':
          toggleTheaterMode();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, skip, toggleMute, togglePictureInPicture, toggleTheaterMode]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={`custom-video-player ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading spinner */}
      {isBuffering && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Play button overlay */}
      {!isPlaying && !isBuffering && (
        <div className="play-overlay" onClick={togglePlay}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}

      {/* Controls */}
      <div className={`video-controls ${showControls || !isPlaying ? 'visible' : ''}`}>
        {/* Progress bar */}
        <div className="progress-container">
          <div 
            ref={progressRef}
            className="progress-bar"
            onClick={handleProgressClick}
          >
            <div 
              className="progress-filled"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="progress-thumb"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Control buttons */}
        <div className="controls-row">
          <div className="controls-left">
            {/* Play/Pause */}
            <button className="control-btn" onClick={handleControlButtonClick(togglePlay)}>
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Skip backward */}
            <button className="control-btn" onClick={handleControlButtonClick(() => skip(-10))}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="9" y="15" fontSize="8" fill="white">10</text>
              </svg>
            </button>

            {/* Skip forward */}
            <button className="control-btn" onClick={handleControlButtonClick(() => skip(10))}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="9" y="15" fontSize="8" fill="white">10</text>
              </svg>
            </button>

            {/* Volume */}
            <div className="volume-container">
              <button 
                className="control-btn"
                onClick={handleControlButtonClick(toggleMute)}
                onMouseEnter={() => setShowVolumeSlider(true)}
              >
                {isMuted || volume === 0 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : volume > 0.5 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                  </svg>
                )}
              </button>
              
              {showVolumeSlider && (
                <div 
                  className="volume-slider-container"
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    ref={volumeRef}
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="volume-slider"
                    orient="vertical"
                  />
                </div>
              )}
            </div>

            {/* Time display */}
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {/* Playback speed */}
            <div className="playback-speed-container">
              <button 
                className="control-btn"
                onClick={handleControlButtonClick(() => setShowPlaybackRateMenu(!showPlaybackRateMenu))}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M10,8v8l6-4L10,8L10,8z M6.3,5L5.7,4.2C7.2,3,9,2.2,11,2l0.1,1C9.3,3.2,7.7,3.9,6.3,5z"/>
                  <text x="16" y="18" fontSize="10" fill="white">{playbackRate}x</text>
                </svg>
              </button>
              
              {showPlaybackRateMenu && (
                <div className="playback-rate-menu">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                    <button
                      key={rate}
                      className={`playback-rate-option ${rate === playbackRate ? 'active' : ''}`}
                      onClick={() => handlePlaybackRateChange(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality selector */}
            <div className="quality-container">
              <button 
                className="control-btn"
                onClick={handleControlButtonClick(() => setShowQualityMenu(!showQualityMenu))}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </button>
              
              {showQualityMenu && (
                <div className="quality-menu">
                  {['Auto', '1080p', '720p', '480p', '360p', '240p'].map(quality => (
                    <button
                      key={quality}
                      className={`quality-option ${quality === videoQuality ? 'active' : ''}`}
                      onClick={() => {
                        setVideoQuality(quality);
                        setShowQualityMenu(false);
                      }}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode */}
            <button 
              className="control-btn" 
              onClick={handleControlButtonClick(toggleTheaterMode)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                <path d="M8 15h8v-6H8v6z"/>
              </svg>
            </button>

            {/* Picture-in-Picture */}
            <button 
              className={`control-btn ${isPictureInPicture ? 'active' : ''}`} 
              onClick={handleControlButtonClick(togglePictureInPicture)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
              </svg>
            </button>

            {/* Fullscreen */}
            <button 
              className="control-btn" 
              onClick={handleControlButtonClick(toggleFullscreen)}
            >
              {isFullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
