import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  en: {
    translation: {
      gameTitle: 'Poop Dodge',
      introDesc:
        'Step out of the way before the shadow fills up. The fewer lives you choose, the higher your score multiplier, and grazing falling hazards builds up your combo!',
      login: 'Log In',
      signUp: 'Create Account',
      playAsGuest: 'Play as Guest',
      logout: 'Log Out',
      myPage: 'My Page',
      admin: 'Admin',
      
      // Settings / Home
      alleyScene: 'Waiting Alley',
      time: 'Time',
      difficulty: 'Difficulty',
      lives: 'Lives',
      character: 'Character',
      startGame: 'Start Game',

      diff1Desc: 'Shadows fill slowly',
      diff2Desc: 'Occasionally drops right on your spot',
      diff3Desc: 'Fills frequently and fast',

      // Game hints & alerts
      shadowHint: 'It will fall right here!',
      bigShadowAlert: 'A huge shadow is approaching!',
      viewScore: 'View Score',

      // HUD
      timeLeft: 'TIME',
      livesLabel: 'LIVES',
      scoreLabel: 'SCORE',
      comboLabel: 'COMBO',
      bigLabel: 'BIG',
      mute: 'Mute',
      unmute: 'Sound',

      // Controls
      moveLeft: 'Move Left',
      moveRight: 'Move Right',

      // Endings
      successTitle: 'Clear!',
      failureTitle: 'Game Over!',

      // Results
      resultTitle: 'Game Results',
      finalScore: 'Final Score',
      maxCombo: 'Max Combo',
      cleanCount: 'Clean',
      closeCount: 'Close',
      hitCount: 'Hit',
      giantCloseCount: 'Giant Close',
      remainingLives: 'Remaining Lives',
      grade: 'Grade',
      top20Rankings: 'Top 20 Rankings (Same Settings)',
      playAgain: 'Play Again',
      saveToAccount: 'Save to Account',
      noRankingsYet: 'No records for these settings yet. Be the first!',

      // Auth & Forms
      emailPlaceholder: 'name@example.com',
      phonePlaceholder: '10-1234-5678',
      passwordPlaceholder: 'Password',
      confirmPasswordPlaceholder: 'Confirm Password',
      nicknamePlaceholder: 'Enter 2-12 alphanumeric characters',
      saveNickname: 'Save Nickname',
      nicknamePrompt: 'Please enter your nickname before starting',

      emailInvalid: 'Please enter a valid email',
      passwordInvalid: 'Enter letters or numbers only (6-20 characters)',
      passwordMismatch: 'Passwords do not match',
      phoneInvalid: 'Please enter a valid phone number',
      authFailedEmail: 'Please check your email or password again',
      authFailedPhone: 'Please check your phone number or password again',

      // My Page
      nickname: 'Nickname',
      loginId: 'Login ID',
      passwordMasked: 'Password: ********',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      characterCustomSlots: 'Custom Character Slots',
      uploadSlot: 'Upload',
      deleteAccount: 'Delete Account',
      confirmDeleteAccount: 'Confirm Delete',
      deleteWarning:
        'Your account and personal data will be deleted. Anonymized gameplay statistics may remain.',
      deleteComplete: 'Account deletion completed!',

      // Dev tools
      devStop: 'Stop',
      devGo: 'Go',
      devTriggerClimax: 'Climax',
      devTriggerSuccess: 'Success Ending',
      devTriggerFailure: 'Failure Ending',
    },
  },
  ko: {
    translation: {
      gameTitle: '똥피하기 (Poop Dodge)',
      introDesc:
        '그림자가 차오르기 전에 그 자리에서 빠지면 됩니다. 목숨이 적을수록 점수는 커지고, 스치면 콤보가 붙습니다.',
      login: '로그인',
      signUp: '새 계정',
      playAsGuest: '계정 없이 플레이',
      logout: '로그아웃',
      myPage: '마이페이지',
      admin: '관리자',

      alleyScene: '대기 중인 골목',
      time: '시간',
      difficulty: '난이도',
      lives: '목숨',
      character: '캐릭터',
      startGame: '게임 시작',

      diff1Desc: '그림자가 천천히 찬다',
      diff2Desc: '가끔 내 자리에 떨어진다',
      diff3Desc: '자주, 그리고 빨리 찬다',

      shadowHint: '여기로 떨어집니다',
      bigShadowAlert: '큰 그림자가 옵니다',
      viewScore: '스코어 보기',

      timeLeft: 'TIME',
      livesLabel: 'LIVES',
      scoreLabel: 'SCORE',
      comboLabel: 'COMBO',
      bigLabel: 'BIG',
      mute: '음소거',
      unmute: '소리켬',

      moveLeft: '왼쪽으로 이동',
      moveRight: '오른쪽으로 이동',

      successTitle: '성공!',
      failureTitle: '실패!',

      resultTitle: '게임 결과',
      finalScore: '최종 점수',
      maxCombo: '최대 콤보',
      cleanCount: 'Clean',
      closeCount: 'Close',
      hitCount: 'Hit',
      giantCloseCount: '거대 똥 Close',
      remainingLives: '남은 목숨',
      grade: '등급',
      top20Rankings: '같은 설정 상위 20명',
      playAgain: '같은 설정으로 다시 하기',
      saveToAccount: '계정에 남기기',
      noRankingsYet: '이 설정의 기록이 아직 없습니다. 첫 랭커가 되어 보세요!',

      emailPlaceholder: 'name@example.com',
      phonePlaceholder: '10-1234-5678',
      passwordPlaceholder: '비밀번호',
      confirmPasswordPlaceholder: '비밀번호 확인',
      nicknamePlaceholder: '2-12자 영문/숫자 별명 입력',
      saveNickname: '별명 저장',
      nicknamePrompt: '게임 시작 전에 별명을 입력해 주세요',

      emailInvalid: '이메일을 입력하세요',
      passwordInvalid: '문자 또는 숫자로만 입력하세요',
      passwordMismatch: '비밀번호가 일치하지 않습니다',
      phoneInvalid: '휴대폰 번호를 입력하세요',
      authFailedEmail: '이메일 또는 비밀번호를 다시 확인해 주세요',
      authFailedPhone: '휴대폰 번호 또는 비밀번호를 다시 확인해 주세요',

      nickname: '별명',
      loginId: '로그인 아이디',
      passwordMasked: '비밀번호: ********',
      changePassword: '비밀번호 변경',
      currentPassword: '현재 비밀번호',
      newPassword: '새 비밀번호',
      characterCustomSlots: '캐릭터 커스텀 슬롯',
      uploadSlot: '업로드',
      deleteAccount: '탈퇴',
      confirmDeleteAccount: '탈퇴 확인',
      deleteWarning:
        '계정과 개인정보는 삭제됩니다. 누구의 기록인지 알 수 없게 만든 플레이 통계는 남을 수 있습니다.',
      deleteComplete: '탈퇴가 완료 되었습니다!',

      devStop: '정지',
      devGo: '재개',
      devTriggerClimax: '클라이맥스',
      devTriggerSuccess: '성공 엔딩',
      devTriggerFailure: '실패 엔딩',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // English primary as requested
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
