import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import {
  UserProfile,
  updateNickname,
  changeUserPassword,
  deleteUserAccount,
} from '@/features/auth/authService';
import { uploadCustomCharacter } from '@/features/character-upload/imageCompressor';

interface MyPageProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onAccountDeleted: () => void;
  onBack: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({
  user,
  onUpdateUser,
  onAccountDeleted,
  onBack,
}) => {
  const { t } = useTranslation();

  // Nickname
  const [nickname, setNickname] = useState(user.nickname);
  const [nicknameSaved, setNicknameSaved] = useState(false);

  // Password change form
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMessage, setPassMessage] = useState<string | null>(null);

  // Custom character upload states
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // Two-step account deletion
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveNickname = async () => {
    if (nickname.length < 2 || nickname.length > 12) return;
    await updateNickname(user.uid, nickname);
    onUpdateUser({ ...user, nickname });
    setNicknameSaved(true);
    setTimeout(() => setNicknameSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);
    try {
      await changeUserPassword(currentPass, newPass);
      setPassMessage('Password changed successfully!');
      setCurrentPass('');
      setNewPass('');
      setShowPasswordChange(false);
    } catch (err: any) {
      setPassMessage(err.message || 'Password update failed');
    }
  };

  const handleFileUpload = async (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slotIdx);
    try {
      const url = await uploadCustomCharacter(user.uid, slotIdx, file);
      const paths = [...(user.customCharacterPaths || [])];
      paths[slotIdx] = url;
      onUpdateUser({ ...user, customCharacterPaths: paths });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeleteClick = async () => {
    if (deleteStep === 1) {
      // Step 1: Turn complementary color and show confirm bubble
      setDeleteStep(2);
    } else {
      // Step 2: Perform deletion
      setIsDeleting(true);
      try {
        await deleteUserAccount(user.uid);
        alert(t('deleteComplete'));
        onAccountDeleted();
      } catch (err: any) {
        alert('Deletion failed: ' + err.message);
        setIsDeleting(false);
      }
    }
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
        background: 'linear-gradient(180deg, #15162a 0%, #0a0b16 100%)',
      }}
    >
      <div className="glass-panel" style={{ maxWidth: '580px', width: '100%', gap: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{t('myPage')}</h2>
          <button
            type="button"
            className="nav-btn"
            onClick={onBack}
            style={{ padding: '6px 14px', fontSize: '13px' }}
          >
            Back
          </button>
        </div>

        {/* 1. Nickname */}
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
            {t('nickname')}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input-field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <button
              type="button"
              className="btn-full"
              style={{ width: 'auto', background: 'var(--primary)', color: '#000', whiteSpace: 'nowrap' }}
              onClick={handleSaveNickname}
            >
              {nicknameSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* 2. Login ID */}
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            {t('loginId')}
          </label>
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              color: '#cbd5e1',
              fontSize: '14px',
            }}
          >
            {user.email || (user.phoneE164 ? `+82 ${user.phoneE164}` : 'Guest Player')}
          </div>
        </div>

        {/* 3. Password */}
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Password
          </label>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
            }}
          >
            <span style={{ letterSpacing: '2px', color: '#cbd5e1' }}>********</span>
            {user.provider !== 'guest' && user.provider !== 'google' && (
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
                onClick={() => setShowPasswordChange(!showPasswordChange)}
              >
                {t('changePassword')}
              </button>
            )}
          </div>

          {showPasswordChange && (
            <form
              onSubmit={handleChangePassword}
              style={{
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(0,0,0,0.4)',
                padding: '12px',
                borderRadius: '10px',
              }}
            >
              <input
                type="password"
                className="input-field"
                placeholder={t('currentPassword')}
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />
              <input
                type="password"
                className="input-field"
                placeholder={t('newPassword')}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button
                type="submit"
                className="btn-full"
                style={{ background: '#38bdf8', color: '#000', padding: '10px' }}
              >
                Update Password
              </button>
            </form>
          )}
          {passMessage && (
            <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '6px' }}>{passMessage}</div>
          )}
        </div>

        {/* 4. Custom Character Upload (4 slots) */}
        <div>
          <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
            🎨 {t('characterCustomSlots')} (Max 4 slots)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[0, 1, 2, 3].map((slotIdx) => {
              const customUrl = user.customCharacterPaths?.[slotIdx];
              return (
                <div
                  key={slotIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px dashed var(--border-glass)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      marginBottom: '6px',
                    }}
                  >
                    {customUrl ? (
                      <img src={customUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Upload size={18} color="#64748b" />
                    )}
                  </div>
                  <label
                    style={{
                      fontSize: '11px',
                      color: '#f59e0b',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {uploadingSlot === slotIdx ? '...' : customUrl ? 'Change' : t('uploadSlot')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(slotIdx, e)}
                      disabled={uploadingSlot !== null}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Account Deletion (Two-step confirmation) */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          {deleteStep === 2 && (
            <div
              className="speech-bubble"
              role="alert"
              aria-live="assertive"
              style={{
                marginBottom: '12px',
                background: '#451a03',
                borderColor: '#78350f',
                color: '#fef3c7',
              }}
            >
              {t('deleteWarning')}
            </div>
          )}

          <button
            type="button"
            className="btn-full"
            style={{
              // Complementary color on step 2 (teal/cyan vs red)
              background: deleteStep === 1 ? 'rgba(239, 68, 68, 0.15)' : '#0d9488',
              color: deleteStep === 1 ? '#ef4444' : '#ffffff',
              border: deleteStep === 1 ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
              fontWeight: 700,
            }}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {deleteStep === 1 ? t('deleteAccount') : t('confirmDeleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};
