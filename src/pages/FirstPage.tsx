import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import {
  loginAsGuest,
  loginWithEmail,
  signUpWithEmail,
  loginWithPhone,
  signUpWithPhone,
  loginWithGoogle,
  UserProfile,
} from '@/features/auth/authService';

interface FirstPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const FirstPage: React.FC<FirstPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [modalMode, setModalMode] = useState<'none' | 'login' | 'signup'>('none');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorBubble, setErrorBubble] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setErrorBubble(null);
  };

  const handleGuestPlay = async () => {
    setIsLoading(true);
    try {
      const profile = await loginAsGuest();
      onLoginSuccess(profile);
    } catch (err: any) {
      setErrorBubble('Failed to start guest play: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorBubble(null);
    try {
      const profile = await loginWithGoogle();
      onLoginSuccess(profile);
    } catch (err: any) {
      setErrorBubble('Google login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pass: string) => {
    // 6-20 alphanumeric characters
    return /^[a-zA-Z0-9]{6,20}$/.test(pass);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBubble(null);

    // Validate fields on submission end
    if (authMethod === 'email') {
      if (!email || !email.includes('@') || !email.includes('.')) {
        setErrorBubble(t('emailInvalid'));
        return;
      }
    } else {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 11) {
        setErrorBubble(t('phoneInvalid'));
        return;
      }
    }

    if (!validatePassword(password)) {
      setErrorBubble(t('passwordInvalid'));
      return;
    }

    if (modalMode === 'signup') {
      if (password !== confirmPassword) {
        setErrorBubble(t('passwordMismatch'));
        return;
      }
      if (nickname.length < 2 || nickname.length > 12) {
        setErrorBubble(t('nicknamePrompt'));
        return;
      }
    }

    setIsLoading(true);
    try {
      if (modalMode === 'login') {
        if (authMethod === 'email') {
          const profile = await loginWithEmail(email, password);
          onLoginSuccess(profile);
        } else {
          const profile = await loginWithPhone('+82', phone, password);
          onLoginSuccess(profile);
        }
      } else {
        // Signup
        if (authMethod === 'email') {
          const profile = await signUpWithEmail(email, password, nickname);
          onLoginSuccess(profile);
        } else {
          const profile = await signUpWithPhone('+82', phone, password, nickname);
          onLoginSuccess(profile);
        }
      }
    } catch (err: any) {
      if (modalMode === 'login') {
        setErrorBubble(authMethod === 'email' ? t('authFailedEmail') : t('authFailedPhone'));
      } else {
        setErrorBubble(err.message || 'Error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle at center, #1e2040 0%, #0b0b1a 100%)',
        padding: 'clamp(10px, 2.5vh, 24px)',
        textAlign: 'center',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vh, 18px)' }}>
        {/* Title Logo */}
        <div>
          <div style={{ fontSize: 'clamp(32px, 7vh, 54px)', marginBottom: '4px' }}>💩💨</div>
          <h1
            style={{
              fontSize: 'clamp(26px, 5.5vh, 42px)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px',
              lineHeight: 1.15,
            }}
          >
            Poop Dodge
          </h1>
          <p
            style={{
              color: '#cbd5e1',
              fontSize: 'clamp(12px, 1.8vh, 14px)',
              lineHeight: '1.5',
              marginTop: '6px',
              wordBreak: 'keep-all',
            }}
          >
            {t('introDesc')}
          </p>
        </div>

        {/* Buttons from top to bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vh, 12px)', marginTop: '4px' }}>
          <button
            className="btn-full"
            style={{ background: '#f59e0b', color: '#111827', padding: 'clamp(10px, 1.8vh, 14px)' }}
            onClick={() => {
              resetForm();
              setModalMode('login');
            }}
          >
            {t('login')}
          </button>
          <button
            className="btn-full"
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: 'clamp(10px, 1.8vh, 14px)' }}
            onClick={() => {
              resetForm();
              setModalMode('signup');
            }}
          >
            {t('signUp')}
          </button>
          <button
            className="btn-full"
            style={{ background: 'transparent', color: '#94a3b8', border: '1px dashed #475569', padding: 'clamp(8px, 1.5vh, 12px)' }}
            onClick={handleGuestPlay}
            disabled={isLoading}
          >
            {t('playAsGuest')}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      {modalMode !== 'none' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setModalMode('none')}
        >
          <div className="glass-panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center' }}>
              {modalMode === 'login' ? t('login') : t('signUp')}
            </h2>

            {/* Error Bubble with aria-live */}
            {errorBubble && (
              <div
                className="speech-bubble"
                role="alert"
                aria-live="assertive"
                style={{ background: '#7f1d1d', borderColor: '#b91c1c', color: '#fecaca' }}
              >
                {errorBubble}
              </div>
            )}

            {/* Google Login for Login mode */}
            {modalMode === 'login' && (
              <button
                type="button"
                className="btn-full"
                style={{
                  background: '#ffffff',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onClick={handleGoogleLogin}
              >
                <span>Google</span> {t('login')}
              </button>
            )}

            {/* Method switcher */}
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authMethod === 'email' ? 'var(--primary)' : 'transparent',
                  color: authMethod === 'email' ? '#000000' : '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setAuthMethod('email')}
              >
                {t('emailTab', 'Email')}
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authMethod === 'phone' ? 'var(--primary)' : 'transparent',
                  color: authMethod === 'phone' ? '#000000' : '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setAuthMethod('phone')}
              >
                {t('phoneTab', 'Phone')}
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMethod === 'email' ? (
                <input
                  type="email"
                  className="input-field"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span
                    style={{
                      padding: '12px',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-glass)',
                      fontSize: '14px',
                    }}
                  >
                    +82
                  </span>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder={t('phonePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              {modalMode === 'signup' && (
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('nicknamePlaceholder')}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              )}

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {modalMode === 'signup' && (
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}

              <button
                type="submit"
                className="btn-full"
                style={{ background: 'var(--primary)', color: '#000000', marginTop: '6px' }}
                disabled={isLoading}
              >
                {modalMode === 'login' ? t('login') : t('signUp')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
