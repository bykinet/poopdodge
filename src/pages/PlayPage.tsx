import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { GameManager } from '@/game/GameManager';
import { GameSettings, SimState } from '@/game/sim/types';
import { soundManager } from '@/features/audio/soundManager';
import { GameSessionRecord, saveGameSession } from '@/features/session/sessionService';
import { UserProfile } from '@/features/auth/authService';
import { getEffectiveCharacters } from '@/entities/character/characterModel';

interface PlayPageProps {
  user: UserProfile;
  settings: GameSettings;
  onFinishGame: (session: GameSessionRecord) => void;
}

export const PlayPage: React.FC<PlayPageProps> = ({ user, settings, onFinishGame }) => {
  const { t } = useTranslation();

  const container3DRef = useRef<HTMLDivElement>(null);
  const containerOverlayRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);

  const [simState, setSimState] = useState<SimState | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isPaused, setIsPaused] = useState(false);

  // Ending phase
  const [endingPhase, setEndingPhase] = useState<'none' | 'playing_3s' | 'still'>('none');
  const [endingOutcome, setEndingOutcome] = useState<'success' | 'failure' | null>(null);

  // Active button hold state
  const [activeBtn, setActiveBtn] = useState<'left' | 'right' | null>(null);
  const moveIntervalRef = useRef<number | null>(null);

  // Completed session record saved
  const sessionRecordRef = useRef<GameSessionRecord | null>(null);

  useEffect(() => {
    if (!container3DRef.current || !containerOverlayRef.current) return;

    const characters = getEffectiveCharacters(user.customCharacterPaths || []);
    const selectedChar = characters[settings.characterSlot] || characters[0];

    const gm = new GameManager({
      container3D: container3DRef.current,
      containerOverlay: containerOverlayRef.current,
      settings,
      characterTextureUrl: selectedChar.avatarUrl,
      characterColor: selectedChar.color,
      showShadowBorder: true,
      onStateChange: (st) => {
        setSimState({ ...st });
        setIsPaused(st.isPaused);
      },
      onEndingStart: (outcome) => {
        setEndingOutcome(outcome);
        setEndingPhase('playing_3s');

        // Prepare and save session record
        const record: GameSessionRecord = {
          uid: user.uid,
          nickname: user.nickname,
          duration: settings.duration,
          difficulty: settings.difficulty,
          livesStart: settings.lives,
          characterSlot: settings.characterSlot,
          score: gm.sim.state.score,
          maxCombo: gm.sim.state.maxCombo,
          cleans: gm.sim.state.cleans,
          closes: gm.sim.state.closes,
          hits: gm.sim.state.hits,
          giantCleans: gm.sim.state.giantCleans,
          giantCloses: gm.sim.state.giantCloses,
          giantHits: gm.sim.state.giantHits,
          remainingLives: gm.sim.state.lives,
          climaxCount: gm.sim.state.climaxCount,
          outcome: outcome,
          startedAt: new Date(Date.now() - gm.sim.state.elapsed * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          completed: true,
        };
        sessionRecordRef.current = record;
        saveGameSession(record);
      },
      onEndingStillReached: () => {
        setEndingPhase('still');
      },
    });

    gameManagerRef.current = gm;
    gm.start();

    return () => {
      gm.destroy();
      gameManagerRef.current = null;
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    };
  }, [settings, user]);

  // Touch and drag support on viewport
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (endingPhase !== 'none' || !gameManagerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const worldX = Math.max(6, Math.min(94, xRatio * 100));
    gameManagerRef.current.setPointerWorldX(worldX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 && endingPhase === 'none' && gameManagerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const worldX = Math.max(6, Math.min(94, xRatio * 100));
      gameManagerRef.current.setPointerWorldX(worldX);
    }
  };

  // Continuous button movement
  const startContinuousMove = (dir: -1 | 1) => {
    if (endingPhase !== 'none' || !gameManagerRef.current) return;
    setActiveBtn(dir === -1 ? 'left' : 'right');
    gameManagerRef.current.moveContinuous(dir, 0.05);

    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    moveIntervalRef.current = window.setInterval(() => {
      if (gameManagerRef.current && endingPhase === 'none') {
        gameManagerRef.current.moveContinuous(dir, 0.03);
      }
    }, 30);
  };

  const stopContinuousMove = () => {
    setActiveBtn(null);
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const togglePause = () => {
    if (!gameManagerRef.current) return;
    if (isPaused) {
      gameManagerRef.current.resume();
    } else {
      gameManagerRef.current.pause();
    }
  };

  const handleViewScore = () => {
    if (sessionRecordRef.current) {
      onFinishGame(sessionRecordRef.current);
    }
  };

  const remainingSeconds = simState
    ? Math.max(0, Math.ceil(settings.duration - simState.elapsed))
    : settings.duration;

  return (
    <div className="game-container-wrapper">
      <div
        className="aspect-frame"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        {/* Top Bar HUD (Hidden during ending) */}
        {endingPhase === 'none' && (
          <div className="hud-topbar">
            {/* Time with BIG indicator in climax */}
            <div className="hud-item">
              <span style={{ color: '#94a3b8' }}>{t('timeLeft')}:</span>
              <span style={{ color: '#38bdf8', fontVariantNumeric: 'tabular-nums' }}>
                {remainingSeconds}s
              </span>
              {simState?.isClimax && <span className="hud-badge-big">{t('bigLabel')}</span>}
            </div>

            {/* Lives */}
            <div className="hud-item">
              <span style={{ color: '#94a3b8' }}>{t('livesLabel')}:</span>
              <span style={{ color: '#ef4444' }}>
                {'❤️'.repeat(simState?.lives || 0)}
              </span>
            </div>

            {/* Score */}
            <div className="hud-item">
              <span style={{ color: '#94a3b8' }}>{t('scoreLabel')}:</span>
              <span style={{ color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                {simState?.score || 0}
              </span>
            </div>

            {/* Combo */}
            <div className="hud-item">
              <span style={{ color: '#94a3b8' }}>{t('comboLabel')}:</span>
              <span style={{ color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                {simState?.streak || 0}
              </span>
            </div>

            {/* Mute button */}
            <button
              type="button"
              onClick={toggleSound}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              title={isMuted ? t('unmute') : t('mute')}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* DEV TOOLS (rendered strictly when import.meta.env.DEV is true) */}
            {import.meta.env.DEV && (
              <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  onClick={togglePause}
                >
                  {isPaused ? t('devGo') : t('devStop')}
                </button>
                <button
                  type="button"
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  onClick={() => gameManagerRef.current?.devTriggerClimax()}
                >
                  {t('devTriggerClimax')}
                </button>
                <button
                  type="button"
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  onClick={() => gameManagerRef.current?.devTriggerSuccess()}
                >
                  {t('devTriggerSuccess')}
                </button>
                <button
                  type="button"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  onClick={() => gameManagerRef.current?.devTriggerFailure()}
                >
                  {t('devTriggerFailure')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3D Canvas Layer */}
        <div ref={container3DRef} className="canvas-layer" />

        {/* Transparent Phaser 3 Overlay */}
        <div ref={containerOverlayRef} className="canvas-overlay" />

        {/* Bottom Left & Right Thumb Controls (Hidden during ending) */}
        {endingPhase === 'none' && (
          <div className="hud-controls-bottom">
            <button
              type="button"
              className={`ctrl-btn ${activeBtn === 'left' ? 'active' : ''}`}
              aria-label={t('moveLeft')}
              onPointerDown={(e) => {
                e.stopPropagation();
                startContinuousMove(-1);
              }}
              onPointerUp={stopContinuousMove}
              onPointerLeave={stopContinuousMove}
            >
              <span style={{ fontSize: '24px' }}>◀</span>
              <span>{t('moveLeft')}</span>
            </button>

            <button
              type="button"
              className={`ctrl-btn ${activeBtn === 'right' ? 'active' : ''}`}
              aria-label={t('moveRight')}
              onPointerDown={(e) => {
                e.stopPropagation();
                startContinuousMove(1);
              }}
              onPointerUp={stopContinuousMove}
              onPointerLeave={stopContinuousMove}
            >
              <span style={{ fontSize: '24px' }}>▶</span>
              <span>{t('moveRight')}</span>
            </button>
          </div>
        )}

        {/* Ending Sequence & Still Frame */}
        {endingPhase !== 'none' && (
          <div className="ending-fullscreen">
            {/* Visual representation: color silhouette and still scene */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  endingOutcome === 'success'
                    ? 'radial-gradient(circle at center, rgba(56, 189, 248, 0.25) 0%, rgba(11, 11, 26, 0.8) 100%)'
                    : 'radial-gradient(circle at center, rgba(239, 68, 68, 0.25) 0%, rgba(11, 11, 26, 0.8) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Ending title */}
            <div style={{ textAlign: 'center', zIndex: 65, marginBottom: '40px' }}>
              <h2
                style={{
                  fontSize: '42px',
                  fontWeight: 800,
                  color: endingOutcome === 'success' ? '#38bdf8' : '#ef4444',
                  textShadow: '0 4px 16px rgba(0,0,0,0.8)',
                }}
              >
                {endingOutcome === 'success' ? t('successTitle') : t('failureTitle')}
              </h2>
            </div>

            {/* "View Score" ("스코어 보기") Button appears when still reached */}
            {endingPhase === 'still' && (
              <div className="score-view-btn-wrap">
                <button
                  type="button"
                  className="btn-primary-large"
                  onClick={handleViewScore}
                >
                  {t('viewScore')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
