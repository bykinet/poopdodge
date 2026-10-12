import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
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
      home: '홈',

      alleyScene: '대기 중인 골목',
      time: '시간',
      difficulty: '난이도',
      diffEasy: '쉬움',
      diffNormal: '보통',
      diffHard: '어려움',
      lives: '목숨',
      lifeRiskMultiplier: '목숨 리스크 배율',
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
      mainMenu: '메인 메뉴',
      saveToAccount: '계정에 남기기',
      noRankingsYet: '이 설정의 기록이 아직 없습니다. 첫 랭커가 되어 보세요!',
      loading: '불러오는 중...',

      emailTab: '이메일',
      phoneTab: '전화번호',
      emailPlaceholder: 'name@example.com',
      phonePlaceholder: '10-1234-5678',
      passwordPlaceholder: '비밀번호',
      confirmPasswordPlaceholder: '비밀번호 확인',
      nicknamePlaceholder: '2-12자 영문/숫자/한글 별명 입력',
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
      passwordLabel: '비밀번호',
      changePassword: '비밀번호 변경',
      currentPassword: '현재 비밀번호',
      newPassword: '새 비밀번호',
      updatePasswordBtn: '비밀번호 변경하기',
      characterCustomSlots: '캐릭터 커스텀 슬롯',
      uploadSlot: '업로드',
      changeSlot: '변경',
      back: '뒤로가기',
      save: '저장',
      saved: '저장됨!',
      deleteAccount: '탈퇴',
      confirmDeleteAccount: '탈퇴 확인',
      deleteWarning:
        '계정과 개인정보는 삭제됩니다. 누구의 기록인지 알 수 없게 만든 플레이 통계는 남을 수 있습니다.',
      deleteComplete: '탈퇴가 완료 되었습니다!',
      guestPlayer: '게스트 플레이어',

      devStop: '정지',
      devGo: '재개',
      devTriggerClimax: '클라이맥스',
      devTriggerSuccess: '성공 엔딩',
      devTriggerFailure: '실패 엔딩',
    },
  },
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
      home: 'Home',

      alleyScene: 'Waiting Alley',
      time: 'Time',
      difficulty: 'Difficulty',
      diffEasy: 'Easy',
      diffNormal: 'Normal',
      diffHard: 'Hard',
      lives: 'Lives',
      lifeRiskMultiplier: 'Life Risk multiplier',
      character: 'Character',
      startGame: 'Start Game',

      diff1Desc: 'Shadows fill slowly',
      diff2Desc: 'Occasionally drops right on your spot',
      diff3Desc: 'Fills frequently and fast',

      shadowHint: 'It will fall right here!',
      bigShadowAlert: 'A huge shadow is approaching!',
      viewScore: 'View Score',

      timeLeft: 'TIME',
      livesLabel: 'LIVES',
      scoreLabel: 'SCORE',
      comboLabel: 'COMBO',
      bigLabel: 'BIG',
      mute: 'Mute',
      unmute: 'Sound',

      moveLeft: 'Move Left',
      moveRight: 'Move Right',

      successTitle: 'Clear!',
      failureTitle: 'Game Over!',

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
      mainMenu: 'Main Menu',
      saveToAccount: 'Save to Account',
      noRankingsYet: 'No records for these settings yet. Be the first!',
      loading: 'Loading...',

      emailTab: 'Email',
      phoneTab: 'Phone',
      emailPlaceholder: 'name@example.com',
      phonePlaceholder: '10-1234-5678',
      passwordPlaceholder: 'Password',
      confirmPasswordPlaceholder: 'Confirm Password',
      nicknamePlaceholder: 'Enter 2-12 characters',
      saveNickname: 'Save Nickname',
      nicknamePrompt: 'Please enter your nickname before starting',

      emailInvalid: 'Please enter a valid email',
      passwordInvalid: 'Enter letters or numbers only (6-20 characters)',
      passwordMismatch: 'Passwords do not match',
      phoneInvalid: 'Please enter a valid phone number',
      authFailedEmail: 'Please check your email or password again',
      authFailedPhone: 'Please check your phone number or password again',

      nickname: 'Nickname',
      loginId: 'Login ID',
      passwordMasked: 'Password: ********',
      passwordLabel: 'Password',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      updatePasswordBtn: 'Update Password',
      characterCustomSlots: 'Custom Character Slots',
      uploadSlot: 'Upload',
      changeSlot: 'Change',
      back: 'Back',
      save: 'Save',
      saved: 'Saved!',
      deleteAccount: 'Delete Account',
      confirmDeleteAccount: 'Confirm Delete',
      deleteWarning:
        'Your account and personal data will be deleted. Anonymized gameplay statistics may remain.',
      deleteComplete: 'Account deletion completed!',
      guestPlayer: 'Guest Player',

      devStop: 'Stop',
      devGo: 'Go',
      devTriggerClimax: 'Climax',
      devTriggerSuccess: 'Success Ending',
      devTriggerFailure: 'Failure Ending',
    },
  },
  ja: {
    translation: {
      gameTitle: 'ウンチよけ (Poop Dodge)',
      introDesc:
        '影が広がりきる前にその場所から離れましょう。選ぶライフが少ないほどスコア倍率が上がり、ギリギリで避けるとコンボが繋がります！',
      login: 'ログイン',
      signUp: '新規登録',
      playAsGuest: 'ゲストでプレイ',
      logout: 'ログアウト',
      myPage: 'マイページ',
      admin: '管理者',
      home: 'ホーム',

      alleyScene: '待機中の路地',
      time: '時間',
      difficulty: '難易度',
      diffEasy: 'かんたん',
      diffNormal: 'ふつう',
      diffHard: 'むずかしい',
      lives: 'ライフ',
      lifeRiskMultiplier: 'ライスク倍率',
      character: 'キャラクター',
      startGame: 'ゲームスタート',

      diff1Desc: '影の広がりが遅い',
      diff2Desc: '時々プレイヤーの位置に落ちる',
      diff3Desc: '頻繁かつ素早く広がる',

      shadowHint: 'ここに落ちてきます！',
      bigShadowAlert: '巨大な影が接近中！',
      viewScore: 'スコアを見る',

      timeLeft: 'TIME',
      livesLabel: 'LIVES',
      scoreLabel: 'SCORE',
      comboLabel: 'COMBO',
      bigLabel: 'BIG',
      mute: 'ミュート',
      unmute: 'サウンドON',

      moveLeft: '左へ移動',
      moveRight: '右へ移動',

      successTitle: 'クリア！',
      failureTitle: 'ゲームオーバー！',

      resultTitle: 'ゲーム結果',
      finalScore: '最終スコア',
      maxCombo: '最大コンボ',
      cleanCount: 'Clean',
      closeCount: 'Close',
      hitCount: 'Hit',
      giantCloseCount: '巨大ウンチ Close',
      remainingLives: '残りライフ',
      grade: 'ランク',
      top20Rankings: '同設定ランキング TOP20',
      playAgain: '同じ設定でもう一度',
      mainMenu: 'メインメニュー',
      saveToAccount: 'アカウントに保存',
      noRankingsYet: 'この設定の記録はまだありません。最初のランカーを目指そう！',
      loading: '読み込み中...',

      emailTab: 'メール',
      phoneTab: '電話番号',
      emailPlaceholder: 'name@example.com',
      phonePlaceholder: '090-1234-5678',
      passwordPlaceholder: 'パスワード',
      confirmPasswordPlaceholder: 'パスワード確認',
      nicknamePlaceholder: '2〜12文字のニックネームを入力',
      saveNickname: 'ニックネーム保存',
      nicknamePrompt: 'ゲーム開始前にニックネームを入力してください',

      emailInvalid: '有効なメールアドレスを入力してください',
      passwordInvalid: '半角英数字で入力してください（6〜20文字）',
      passwordMismatch: 'パスワードが一致しません',
      phoneInvalid: '有効な電話番号を入力してください',
      authFailedEmail: 'メールアドレスまたはパスワードをご確認ください',
      authFailedPhone: '電話番号またはパスワードをご確認ください',

      nickname: 'ニックネーム',
      loginId: 'ログインID',
      passwordMasked: 'パスワード: ********',
      passwordLabel: 'パスワード',
      changePassword: 'パスワード変更',
      currentPassword: '現在のパスワード',
      newPassword: '新しいパスワード',
      updatePasswordBtn: 'パスワード更新',
      characterCustomSlots: 'カスタムキャラクタースロット',
      uploadSlot: 'アップロード',
      changeSlot: '変更',
      back: '戻る',
      save: '保存',
      saved: '保存完了！',
      deleteAccount: 'アカウント削除',
      confirmDeleteAccount: '削除の確認',
      deleteWarning:
        'アカウントおよび個人情報は削除されます。誰の記録かわからないようにしたプレイ統計は残る場合があります。',
      deleteComplete: 'アカウント削除が完了しました！',
      guestPlayer: 'ゲストプレイヤー',

      devStop: '停止',
      devGo: '再開',
      devTriggerClimax: 'クライマックス',
      devTriggerSuccess: '成功エンディング',
      devTriggerFailure: '失敗エンディング',
    },
  },
};

export type SupportedLanguage = 'ko' | 'en' | 'ja';

export const getNextLanguage = (currentLang: string): SupportedLanguage => {
  if (currentLang.startsWith('ko')) return 'en';
  if (currentLang.startsWith('en')) return 'ja';
  return 'ko';
};

export const getLanguageLabel = (lang: string): string => {
  if (lang.startsWith('ja')) return '日本語';
  if (lang.startsWith('en')) return 'English';
  return '한국어';
};

const getInitialLanguage = (): SupportedLanguage => {
  try {
    const saved = localStorage.getItem('poopdodge_lang');
    if (saved === 'ko' || saved === 'en' || saved === 'ja') {
      return saved;
    }
  } catch {}
  return 'ko'; // 디폴트 한국어
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
