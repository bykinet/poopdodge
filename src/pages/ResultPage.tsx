import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameSessionRecord, getTop20Rankings } from '@/features/session/sessionService';
import { calculateTheoreticalMax } from '@/game/sim/theoreticalMax';
import { getGrade } from '@/game/sim/constants';
import { UserProfile } from '@/features/auth/authService';

interface ResultPageProps {
  user: UserProfile;
  session: GameSessionRecord;
  onPlayAgain: () => void;
  onLinkAccount: () => void;
  onGoHome?: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  user,
  session,
  onPlayAgain,
  onLinkAccount,
  onGoHome,
}) => {
  const { t } = useTranslation();
  const [rankings, setRankings] = useState<GameSessionRecord[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(true);

  const theoreticalMax = calculateTheoreticalMax(
    session.duration,
    session.difficulty,
    session.livesStart
  );
  const grade = getGrade(session.score, theoreticalMax);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const list = await getTop20Rankings(
          session.duration,
          session.difficulty,
          session.livesStart
        );
        setRankings(list);
      } catch {
        setRankings([]);
      } finally {
        setLoadingRankings(false);
      }
    }
    fetchRankings();
  }, [session]);

  const gradeColors: Record<string, string> = {
    S: '#fbbf24',
    A: '#38bdf8',
    B: '#4ade80',
    C: '#94a3b8',
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(6px, 1.5vh, 16px)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #131428 0%, #080814 100%)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: 'calc(100dvh - 16px)',
          padding: 'clamp(10px, 1.8vh, 18px)',
          gap: 'clamp(6px, 1.2vh, 12px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
          <h2 style={{ fontSize: 'clamp(18px, 2.4vh, 22px)', fontWeight: 800, margin: 0 }}>{t('resultTitle')}</h2>
        </div>

        {/* Responsive Content Grid: 2-column on desktop (>=600px), 1-column on mobile */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'clamp(8px, 1.5vw, 14px)',
            alignItems: 'stretch',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {/* Left / Top Section: Grade, Score, and Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 10px)', justifyContent: 'center' }}>
            {/* Grade & Score */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                background: 'rgba(0,0,0,0.3)',
                padding: 'clamp(6px, 1vh, 12px)',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: 'clamp(48px, 6.5vh, 60px)',
                  height: 'clamp(48px, 6.5vh, 60px)',
                  borderRadius: '50%',
                  border: `3px solid ${gradeColors[grade]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(24px, 3.2vh, 30px)',
                  fontWeight: 900,
                  color: gradeColors[grade],
                  boxShadow: `0 0 16px ${gradeColors[grade]}40`,
                }}
              >
                {grade}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('finalScore')}</div>
                <div style={{ fontSize: 'clamp(22px, 3.2vh, 28px)', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {session.score}
                </div>
              </div>
            </div>

            {/* Breakdown Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                background: 'rgba(0,0,0,0.25)',
                padding: 'clamp(6px, 1vh, 10px)',
                borderRadius: '10px',
                fontSize: 'clamp(10px, 1.3vh, 12px)',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '2px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>{t('maxCombo')}</span>
                <strong style={{ color: '#10b981', fontSize: 'clamp(11px, 1.4vh, 13px)' }}>{session.maxCombo}</strong>
              </div>
              <div style={{ padding: '2px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>{t('cleanCount')}</span>
                <strong style={{ color: '#38bdf8', fontSize: 'clamp(11px, 1.4vh, 13px)' }}>{session.cleans}</strong>
              </div>
              <div style={{ padding: '2px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>{t('closeCount')}</span>
                <strong style={{ color: '#fb923c', fontSize: 'clamp(11px, 1.4vh, 13px)' }}>{session.closes}</strong>
              </div>
              <div style={{ padding: '2px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>{t('giantCloseCount')}</span>
                <strong style={{ color: '#f43f5e', fontSize: 'clamp(11px, 1.4vh, 13px)' }}>{session.giantCloses}</strong>
              </div>
              <div style={{ padding: '2px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>{t('hitCount')}</span>
                <strong style={{ color: '#ef4444', fontSize: 'clamp(11px, 1.4vh, 13px)' }}>{session.hits}</strong>
              </div>
              <div style={{ padding: '2px' }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>{t('remainingLives')}</span>
                <strong style={{ color: '#f87171', fontSize: 'clamp(11px, 1.4vh, 13px)' }}>{session.remainingLives}</strong>
              </div>
            </div>
          </div>

          {/* Right / Bottom Section: Leaderboard Rankings (Internal Scroll only) */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ fontSize: 'clamp(11px, 1.4vh, 13px)', fontWeight: 700, marginBottom: '4px', color: '#cbd5e1' }}>
              🏆 {t('top20Rankings')}
            </div>
            <div
              style={{
                flex: 1,
                maxHeight: 'clamp(80px, 18vh, 160px)',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: '10px',
                padding: '4px 6px',
                fontSize: 'clamp(11px, 1.3vh, 12px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {loadingRankings ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8' }}>Loading...</div>
              ) : rankings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8' }}>
                  {t('noRankingsYet')}
                </div>
              ) : (
                rankings.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 6px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: idx === 0 ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    }}
                  >
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      #{idx + 1} {r.nickname || 'Player'}
                    </span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{r.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', marginTop: '2px' }}>
          <button
            type="button"
            className="btn-primary-large"
            style={{
              padding: 'clamp(8px, 1.3vh, 12px)',
              fontSize: 'clamp(13px, 1.8vh, 16px)',
              borderRadius: '12px',
            }}
            onClick={onPlayAgain}
          >
            {t('playAgain')}
          </button>

          {onGoHome && (
            <button
              type="button"
              className="btn-full"
              style={{
                background: 'rgba(245, 158, 11, 0.22)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                fontWeight: 700,
                padding: 'clamp(8px, 1.3vh, 12px)',
                fontSize: 'clamp(12px, 1.6vh, 14px)',
                borderRadius: '12px',
              }}
              onClick={onGoHome}
            >
              🏠 {t('mainMenu', 'Main Menu')}
            </button>
          )}

          {user.provider === 'guest' && (
            <button
              type="button"
              className="btn-full"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                padding: 'clamp(8px, 1.3vh, 12px)',
                fontSize: 'clamp(12px, 1.6vh, 14px)',
                borderRadius: '12px',
              }}
              onClick={onLinkAccount}
            >
              {t('saveToAccount')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
