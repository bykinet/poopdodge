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
}

export const ResultPage: React.FC<ResultPageProps> = ({
  user,
  session,
  onPlayAgain,
  onLinkAccount,
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #131428 0%, #080814 100%)',
      }}
    >
      <div className="glass-panel" style={{ maxWidth: '680px', width: '100%', gap: '20px' }}>
        {/* Title & Grade Banner */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{t('resultTitle')}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: `4px solid ${gradeColors[grade]}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 900,
                color: gradeColors[grade],
                boxShadow: `0 0 20px ${gradeColors[grade]}40`,
              }}
            >
              {grade}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{t('finalScore')}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                {session.score}
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
          }}
        >
          <div>
            <span style={{ color: '#94a3b8' }}>{t('maxCombo')}:</span>{' '}
            <strong style={{ color: '#10b981' }}>{session.maxCombo}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>{t('cleanCount')}:</span>{' '}
            <strong style={{ color: '#38bdf8' }}>{session.cleans}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>{t('closeCount')}:</span>{' '}
            <strong style={{ color: '#fb923c' }}>{session.closes}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>{t('giantCloseCount')}:</span>{' '}
            <strong style={{ color: '#f43f5e' }}>{session.giantCloses}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>{t('hitCount')}:</span>{' '}
            <strong style={{ color: '#ef4444' }}>{session.hits}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>{t('remainingLives')}:</span>{' '}
            <strong style={{ color: '#f87171' }}>{session.remainingLives}</strong>
          </div>
        </div>

        {/* Top 20 Rankings */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            🏆 {t('top20Rankings')}
          </h3>
          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '10px',
              padding: '8px',
              fontSize: '13px',
            }}
          >
            {loadingRankings ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>Loading...</div>
            ) : rankings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                {t('noRankingsYet')}
              </div>
            ) : (
              rankings.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    #{idx + 1} {r.nickname || 'Player'}
                  </span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{r.score}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn-primary-large"
            style={{ width: '100%', padding: '14px' }}
            onClick={onPlayAgain}
          >
            {t('playAgain')}
          </button>

          {user.provider === 'guest' && (
            <button
              type="button"
              className="btn-full"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
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
