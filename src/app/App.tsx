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
import '@/shared/i18n';

type PageRoute = 'first' | 'home' | 'play' | 'result' | 'mypage';

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [currentPage, setCurrentPage] = useState<PageRoute>('first');
  const [user, setUser] = useState<UserProfile | null>(null);
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
    const nextLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* Upper Right Navigation (Except on FirstPage) */}
      <div className="app-nav">
        <button type="button" className="lang-btn" onClick={toggleLanguage}>
          {i18n.language === 'en' ? '한국어' : 'English'}
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
              {t('myPage')}
            </button>
          </>
        )}
      </div>

      {/* Pages */}
      {currentPage === 'first' && <FirstPage onLoginSuccess={handleLoginSuccess} />}

      {currentPage === 'home' && user && (
        <HomePage user={user} onStartGame={handleStartGame} onUpdateUser={setUser} />
      )}

      {currentPage === 'play' && user && (
        <PlayPage user={user} settings={currentSettings} onFinishGame={handleFinishGame} />
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
