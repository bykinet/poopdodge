import React, { useState, useEffect } from 'react';
import { soundManager } from '@/features/audio/soundManager';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [currentScene, setCurrentScene] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Play upbeat sound effects timed to the scenes
    try {
      soundManager.playWhoosh();
    } catch {}

    const scene2Timer = setTimeout(() => {
      setCurrentScene(2);
      try {
        soundManager.playClean();
      } catch {}
    }, 1000);

    const scene3Timer = setTimeout(() => {
      setCurrentScene(3);
      try {
        soundManager.playCheer();
      } catch {}
    }, 2000);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3100);

    // Progress bar update at 60fps
    const startTime = Date.now();
    const duration = 3000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (elapsed >= duration) {
        clearInterval(progressInterval);
      }
    }, 16);

    return () => {
      clearTimeout(scene2Timer);
      clearTimeout(scene3Timer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#070712',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
      }}
      onClick={handleSkip}
    >
      {/* Scene 1: Poop Plummeting from Sky (0s - 1.0s) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: currentScene === 1 ? 1 : 0,
          transform: currentScene === 1 ? 'scale(1.15)' : 'scale(1.0)',
          transition: 'opacity 0.25s ease-in-out, transform 1s ease-out',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/game-assets/intro/scene1.jpg"
          alt="Poop Incoming!"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(1.05) contrast(1.1)',
          }}
        />
        {/* Animated Speed Blur Lines Overlay */}
        <div className="intro-speed-lines" />
        <div className="intro-scene-badge">
          <span>⚠️ INCOMING HAZARD!</span>
        </div>
      </div>

      {/* Scene 2: Hero Character Dodge & Slide (1.0s - 2.0s) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: currentScene === 2 ? 1 : 0,
          transform: currentScene === 2 ? 'scale(1.12) translateX(-2%)' : 'scale(1.0)',
          transition: 'opacity 0.25s ease-in-out, transform 1s ease-out',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/game-assets/intro/scene2.jpg"
          alt="Hero Dodges!"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(1.08) contrast(1.08)',
          }}
        />
        <div className="intro-scene-badge" style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>
          <span>⚡ QUICK DODGE!</span>
        </div>
      </div>

      {/* Scene 3: Triumphant Celebration & Logo Slam (2.0s - 3.0s) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: currentScene === 3 ? 1 : 0,
          transform: currentScene === 3 ? 'scale(1.08)' : 'scale(1.0)',
          transition: 'opacity 0.25s ease-in-out, transform 1s ease-out',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/game-assets/intro/scene3.jpg"
          alt="Super Poop Dodge!"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(1.1) contrast(1.1)',
          }}
        />
        <div className="intro-scene-badge" style={{ borderColor: '#f59e0b', color: '#fbbf24' }}>
          <span>✨ POOP DODGE! ✨</span>
        </div>
      </div>

      {/* Flash White Burst between transitions */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#ffffff',
          opacity: currentScene === 2 || currentScene === 3 ? 0.08 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Top Controls: Audio Note + Skip Button */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(14px, 3vh, 24px)',
          left: 'clamp(14px, 3vw, 24px)',
          right: 'clamp(14px, 3vw, 24px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10000,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#e2e8f0',
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <span style={{ animation: 'introPulse 1s infinite' }}>🎬</span>
          <span>INTRO ANIMATION</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <span>SKIP</span>
          <span style={{ fontSize: '11px' }}>⏩</span>
        </button>
      </div>

      {/* Bottom Progress Bar (3 Seconds Gauge) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #f59e0b, #ec4899, #38bdf8)',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.8)',
            transition: 'width 0.05s linear',
          }}
        />
      </div>
    </div>
  );
};
