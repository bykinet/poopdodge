import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameSettings, DurationOption, DifficultyLevel, LivesOption } from '@/game/sim/types';
import { getEffectiveCharacters } from '@/entities/character/characterModel';
import { UserProfile, updateNickname } from '@/features/auth/authService';

interface HomePageProps {
  user: UserProfile;
  onStartGame: (settings: GameSettings) => void;
  onUpdateUser: (user: UserProfile) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, onStartGame, onUpdateUser }) => {
  const { t } = useTranslation();

  // Settings states with specified defaults: 60s, diff 1, lives 3
  const [duration, setDuration] = useState<DurationOption>(60);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [lives, setLives] = useState<LivesOption>(3);
  const [characterSlot, setCharacterSlot] = useState<number>(user.selectedCharacterSlot || 0);

  // Nickname modal state if user has no nickname or default
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(
    !user.nickname || user.nickname.length < 2
  );
  const [newNickname, setNewNickname] = useState(user.nickname || '');
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const characters = getEffectiveCharacters(user.customCharacterPaths || []);

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNickname.trim();
    if (trimmed.length < 2 || trimmed.length > 12 || !/^[a-zA-Z0-9가-힣]+$/.test(trimmed)) {
      setNicknameError(t('nicknamePrompt'));
      return;
    }
    await updateNickname(user.uid, trimmed);
    const updated = { ...user, nickname: trimmed };
    onUpdateUser(updated);
    setShowNicknameModal(false);
  };

  const handleStart = () => {
    if (!user.nickname || user.nickname.length < 2) {
      setShowNicknameModal(true);
      return;
    }
    const updatedUser = { ...user, selectedCharacterSlot: characterSlot };
    onUpdateUser(updatedUser);
    localStorage.setItem('poopdodge_mock_user', JSON.stringify(updatedUser));

    onStartGame({
      duration,
      difficulty,
      lives,
      characterSlot,
    });
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
        background: 'linear-gradient(180deg, #181935 0%, #0d0d1e 100%)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: 'clamp(10px, 1.8vh, 18px)',
          gap: 'clamp(6px, 1.1vh, 12px)',
          overflow: 'hidden',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('alleyScene')}
          </span>
          <h2 style={{ fontSize: 'clamp(18px, 2.6vh, 23px)', fontWeight: 800, marginTop: '2px', lineHeight: 1.2 }}>
            {t('gameTitle')}
          </h2>
        </div>

        {/* Duration Select */}
        <div>
          <label style={{ fontSize: 'clamp(11px, 1.4vh, 13px)', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '4px' }}>
            ⏱️ {t('time')} (sec)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {([30, 60, 90, 120, 150, 180] as DurationOption[]).map((sec) => (
              <button
                key={sec}
                type="button"
                style={{
                  padding: 'clamp(4px, 0.8vh, 8px) 2px',
                  borderRadius: '8px',
                  border: duration === sec ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
                  background: duration === sec ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: duration === sec ? '#f59e0b' : '#ffffff',
                  fontWeight: 700,
                  fontSize: 'clamp(11px, 1.4vh, 13px)',
                  cursor: 'pointer',
                }}
                onClick={() => setDuration(sec)}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Select */}
        <div>
          <label style={{ fontSize: 'clamp(11px, 1.4vh, 13px)', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '4px' }}>
            ⚡ {t('difficulty')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {([1, 2, 3] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                style={{
                  padding: 'clamp(5px, 0.9vh, 8px) 4px',
                  borderRadius: '10px',
                  border: difficulty === d ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
                  background: difficulty === d ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => setDifficulty(d)}
              >
                <span style={{ fontSize: 'clamp(12px, 1.6vh, 14px)', fontWeight: 800, color: difficulty === d ? '#f59e0b' : '#ffffff' }}>
                  LV {d}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {d === 1 ? 'Easy' : d === 2 ? 'Normal' : 'Hard'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lives Select */}
        <div>
          <label style={{ fontSize: 'clamp(11px, 1.4vh, 13px)', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '4px' }}>
            ❤️ {t('lives')} (Life Risk multiplier)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {([1, 2, 3, 4, 5] as LivesOption[]).map((l) => (
              <button
                key={l}
                type="button"
                style={{
                  padding: 'clamp(4px, 0.8vh, 8px) 2px',
                  borderRadius: '8px',
                  border: lives === l ? '2px solid #ef4444' : '1px solid var(--border-glass)',
                  background: lives === l ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0,0,0,0.3)',
                  color: lives === l ? '#ef4444' : '#ffffff',
                  fontWeight: 700,
                  fontSize: 'clamp(11px, 1.4vh, 13px)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setLives(l)}
              >
                {'❤️'.repeat(l)}
              </button>
            ))}
          </div>
        </div>

        {/* Character Select (8 choices) - 3D Figurine Showcase */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: 'clamp(11px, 1.4vh, 13px)', fontWeight: 600, color: '#e2e8f0' }}>
              👤 {t('character')} (1 of 8)
            </label>
            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', padding: '1px 6px', borderRadius: '8px' }}>
              ✨ 3D Figurine
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
            {characters.map((char) => (
              <button
                key={char.id}
                type="button"
                style={{
                  padding: 'clamp(3px, 0.6vh, 6px) 2px',
                  borderRadius: '10px',
                  border: characterSlot === char.id ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
                  background: characterSlot === char.id ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0,0,0,0.25)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease',
                  transform: characterSlot === char.id ? 'scale(1.03)' : 'none',
                }}
                onClick={() => {
                  setCharacterSlot(char.id);
                  const updatedUser = { ...user, selectedCharacterSlot: char.id };
                  onUpdateUser(updatedUser);
                  localStorage.setItem('poopdodge_mock_user', JSON.stringify(updatedUser));
                }}
              >
                {/* 3D Figurine Display Showcase */}
                <div
                  style={{
                    width: 'clamp(38px, 5vh, 46px)',
                    height: 'clamp(38px, 5vh, 46px)',
                    borderRadius: '10px',
                    background: `radial-gradient(circle at 50% 30%, ${char.colorHex}44 0%, #111425 85%)`,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: characterSlot === char.id ? `0 0 10px ${char.colorHex}99` : '0 2px 5px rgba(0,0,0,0.4)',
                  }}
                >
                  {char.avatarUrl ? (
                    <img
                      src={char.avatarUrl}
                      alt={char.name}
                      style={{
                        width: '85%',
                        height: '85%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))',
                      }}
                    />
                  ) : char.category === 'animal' ? (
                    '🐾'
                  ) : (
                    '🏃'
                  )}
                  {/* Miniature 3D acrylic plinth stand */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      width: '64%',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'radial-gradient(ellipse, #f59e0b 0%, rgba(245, 158, 11, 0.2) 70%, transparent 100%)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '56px',
                    lineHeight: 1.1,
                  }}
                >
                  {char.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          type="button"
          className="btn-primary-large"
          style={{
            width: '100%',
            marginTop: '2px',
            padding: 'clamp(9px, 1.4vh, 13px)',
            fontSize: 'clamp(14px, 2vh, 17px)',
            borderRadius: '20px',
          }}
          onClick={handleStart}
        >
          {t('startGame')}
        </button>
      </div>

      {/* Nickname Prompt Modal */}
      {showNicknameModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div className="glass-panel">
            <h3 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center' }}>{t('nicknamePrompt')}</h3>
            {nicknameError && (
              <div className="speech-bubble" style={{ background: '#7f1d1d', color: '#fecaca' }}>
                {nicknameError}
              </div>
            )}
            <form onSubmit={handleSaveNickname} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder={t('nicknamePlaceholder')}
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-full" style={{ background: 'var(--primary)', color: '#000' }}>
                {t('saveNickname')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
