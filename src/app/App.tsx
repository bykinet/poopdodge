import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FirstPage } from '@/pages/FirstPage';
import { HomePage } from '@/pages/HomePage';
import { PlayPage } from '@/pages/PlayPage';
import { ResultPage } from '@/pages/ResultPage';
import { MyPage } from '@/pages/MyPage';
import { UserProfile, logoutUser } from '@/features/auth/authService';
import { GameSettings } from '@/game/sim/types';
import { GameSessionRecord } from '@/features/session/sessionService';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '@/features/audio/soundManager';
import '@/shared/i18n';
import { getNextLanguage, getLanguageLabel } from '@/shared/i18n';

type PageRoute = 'first' | 'home' | 'play' | 'result' | 'mypage';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [currentPage, setCurrentPage] = useState<PageRoute>('first');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({
    duration: 60,
    difficulty: 1,
    lives: 3,
    characterSlot: 0,
  });
  const [lastSession, setLastSession] = useState<GameSessionRecord | null>(null);

  // Check saved mock user or initial state
  useEffect(() => {
    const saved = localStorage.getItem('poopdodge_mock_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setCurrentPage('home');
      } catch {}
    }
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setCurrentPage('home');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setCurrentPage('first');
  };

  const handleStartGame = (settings: GameSettings) => {
    setCurrentSettings(settings);
    setCurrentPage('play');
  };

  const handleFinishGame = (session: GameSessionRecord) => {
    setLastSession(session);
    setCurrentPage('result');
  };

  const handlePlayAgain = () => {
    setCurrentPage('play');
  };

  const toggleLanguage = () => {
    const nextLang = getNextLanguage(i18n.language);
    i18n.changeLanguage(nextLang);
    try {
      localStorage.setItem('poopdodge_lang', nextLang);
    } catch {}
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* Global Top Bar (On non-play pages; PlayPage has integrated single-line HUD) */}
      {currentPage !== 'play' && (
        <div className="app-header-bar">
          {/* Sound button (Always top-left) */}
          <button
            type="button"
            className="hud-sound-btn"
            onClick={toggleSound}
            title={isMuted ? t('unmute') : t('mute')}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div style={{ flex: 1 }} />

          {/* Right Navigation Actions */}
          <div className="app-nav-group">
            <button type="button" className="lang-btn" onClick={toggleLanguage} title="Language">
              {getLanguageLabel(i18n.language)}
            </button>

            {user && currentPage !== 'first' && (
              <>
                <button type="button" className="nav-btn" onClick={handleLogout}>
                  {t('logout')}
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setCurrentPage(currentPage === 'mypage' ? 'home' : 'mypage')}
                >
                  {currentPage === 'mypage' ? t('home') || 'Home' : t('myPage')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pages */}
      {currentPage === 'first' && <FirstPage onLoginSuccess={handleLoginSuccess} />}

      {currentPage === 'home' && user && (
        <HomePage user={user} onStartGame={handleStartGame} onUpdateUser={setUser} />
      )}

      {currentPage === 'play' && user && (
        <PlayPage
          user={user}
          settings={currentSettings}
          onFinishGame={handleFinishGame}
          onLogout={handleLogout}
          onNavigateMyPage={() => setCurrentPage('mypage')}
          toggleLanguage={toggleLanguage}
        />
      )}

      {currentPage === 'result' && user && lastSession && (
        <ResultPage
          user={user}
          session={lastSession}
          onPlayAgain={handlePlayAgain}
          onLinkAccount={() => setCurrentPage('mypage')}
          onGoHome={() => setCurrentPage('home')}
        />
      )}

      {currentPage === 'mypage' && user && (
        <MyPage
          user={user}
          onUpdateUser={setUser}
          onAccountDeleted={handleLogout}
          onBack={() => setCurrentPage('home')}
        />
      )}
    </div>
  );
};
