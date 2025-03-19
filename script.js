document.addEventListener('DOMContentLoaded', () => {
  // スロットの回転文字定義
  const reels = [
    ['ぷ', 'う', 'ち', 'さ'],
    ['ん', 'ら', 'う', 'り'],
    ['こ', 'め', 'ど', 'す'],
    ['す', 'じ', 'う', 'ん']
  ];
  
  // 顔文字マッピング (将来的に画像に置き換え)
  const faceEmojis = {
    'normal': '😐',    // 通常時
    'win': '😆',       // 大当たり（ぷんこす）
    'close': '😔',     // おしい（ぷんこ）
    'stinky': '🤢',    // うんこ
    'naughty': '😏',   // ちんこ
    'surprise1': '😮',  // うらすじ
    'surprise2': '😎',  // ちりめん
    'surprise3': '🎉',  // さんこん
    'chance': '🌟',     // チャンスモード
    'fever': '🔥'      // フィーバーモード
  };
  
  // トリガー状態管理 (顔文字を使用)
  const triggers = {
    'ぷんこす': { achieved: false, emoji: '😆', count: 0 },
    'うんこ': { achieved: false, emoji: '🤢', count: 0 },
    'ちんこ': { achieved: false, emoji: '😏', count: 0 },
    'うらすじ': { achieved: false, emoji: '😮', count: 0 },
    'ちりめん': { achieved: false, emoji: '😎', count: 0 },
    'さんこん': { achieved: false, emoji: '🎉', count: 0 },
    'ぷんこ': { achieved: false, emoji: '😔', count: 0 }
  };
  
  // DOM要素の取得
  const reelElements = Array.from({ length: 4 }, (_, i) => document.getElementById(`reel${i}`));
  const stopButtons = document.querySelectorAll('.stop-button');
  const startButton = document.getElementById('start-button');
  const faceDisplay = document.getElementById('face-display');
  const messageBubble = document.getElementById('message');
  const chanceLamp = document.getElementById('chance-lamp');
  const triggerList = document.getElementById('trigger-list');
  const triggerCount = document.getElementById('trigger-count');
  const triggerCompMessage = document.getElementById('trigger-comp-message');
  const chipCountDisplay = document.getElementById('chip-count');
  const feverImageLeft = document.querySelector('.fever-image.left');
  const feverImageRight = document.querySelector('.fever-image.right');
  const feverBanner = document.getElementById('fever-banner');
  
  // 状態管理
  let results = ['', '', '', ''];
  let spinning = [false, false, false, false];
  let isChanceMode = false;
  let chanceNotificationShown = false; // チャンス通知表示済みフラグ
  let timers = [null, null, null, null];
  let blinkTimer = null;
  let gameState = 'idle'; // 'idle', 'spinning'
  
  // チップシステム関連の変数
  let chipCount = 200; // 初期チップ数
  let isFeverMode = false; // フィーバーモードフラグ
  let feverSpinsRemaining = 0; // 残りフィーバー回転数
  let feverTotalPayout = 0; // フィーバー中の総払い出し
  let isSankonChanceMode = false; // サンコンチャンスモードフラグ
  let sankonChanceSpinsRemaining = 0; // 残りサンコンチャンス回転数
  let sankonChanceProbability = 0.1; // サンコンチャンス中のぷんこす確率 (1/10)
  let isReplay = false; // リプレイフラグ
  let replayShown = false; // リプレイ表示済みフラグ
  let newTriggerShown = false; // 新規トリガー獲得表示済みフラグ
  
  // 初期化: トリガーリストの表示
  updateTriggerList();
  updateTriggerCount();
  updateChipDisplay();
  
  // チップ表示を更新する
  function updateChipDisplay() {
    chipCountDisplay.textContent = chipCount;
  }
  
  // チップ獲得/消費の効果表示
  function showChipEffect(amount, type = '') {
    // 新規トリガー獲得表示中は表示を遅らせる
    if (newTriggerShown) {
      setTimeout(() => showChipEffect(amount, type), 1500);
      return;
    }
    
    // すでに表示されているものがあれば削除
    const existingEffect = document.querySelector('.chip-effect');
    if (existingEffect) {
      document.body.removeChild(existingEffect);
    }
    
    const effect = document.createElement('div');
    effect.className = 'chip-effect';
    
    // 金額に応じたクラスを追加
    if (amount > 0) {
      effect.classList.add('positive');
      effect.textContent = `+${amount}枚`;
    } else if (amount < 0) {
      effect.classList.add('negative');
      effect.textContent = `${amount}枚`;
    } else if (type === 'replay') {
      effect.classList.add('replay');
      effect.textContent = `リプレイ！`;
    }
    
    document.body.appendChild(effect);
    
    // アニメーション表示
    setTimeout(() => {
      effect.classList.add('show');
      
      // 一定時間後に消す
      setTimeout(() => {
        effect.classList.remove('show');
        setTimeout(() => {
          if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
          }
        }, 300);
      }, 1000);
    }, 10);
  }
  
  // ゲームオーバー表示
  function showGameOver() {
    const gameOver = document.createElement('div');
    gameOver.className = 'game-over';
    
    gameOver.innerHTML = `
      <div class="game-over-content">
        <h2>ゲームオーバー</h2>
        <p>チップがなくなりました！</p>
        <p>また遊んでね！</p>
        <button id="restart-button">もう一度遊ぶ</button>
      </div>
    `;
    
    document.body.appendChild(gameOver);
    
    // アニメーション表示
    setTimeout(() => {
      gameOver.classList.add('show');
      
      // リスタートボタンのイベント
      const restartButton = document.getElementById('restart-button');
      restartButton.addEventListener('click', () => {
        chipCount = 200;
        updateChipDisplay();
        startButton.disabled = false;
        messageBubble.textContent = 'チップをリセットしました！スタートを押してください。';
        
        // ゲームオーバー表示を閉じる
        gameOver.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(gameOver);
        }, 300);
      });
    }, 10);
  }
  
  // シンプルなリール回転ロジック
  function startSpin(reelIndex) {
    if (!spinning[reelIndex]) return;
    
    // 回転の表現としてランダムな文字を表示
    const randomChar = reels[reelIndex][Math.floor(Math.random() * reels[reelIndex].length)];
    reelElements[reelIndex].textContent = randomChar;
    
    // 次のフレームの予約
    timers[reelIndex] = setTimeout(() => startSpin(reelIndex), 100);
  }
  
  // リールの回転停止
  function stopSpin(reelIndex) {
    if (spinning[reelIndex]) {
      clearTimeout(timers[reelIndex]);
      
      // チャンスモードの場合は強制的に「ぷんこす」に
      if (isChanceMode) {
        results[reelIndex] = ['ぷ', 'ん', 'こ', 'す'][reelIndex];
      } else {
        // ランダムに結果を選択
        const randomIndex = Math.floor(Math.random() * reels[reelIndex].length);
        results[reelIndex] = reels[reelIndex][randomIndex];
      }
      
      // 表示を更新
      reelElements[reelIndex].textContent = results[reelIndex];
      spinning[reelIndex] = false;
      stopButtons[reelIndex].disabled = true;
      
      // 全て停止したかチェック
      if (!spinning.some(s => s)) {
        gameState = 'idle';
        checkResult();
        
        // フィーバーモード中は1回転ごとに15チップ獲得
        if (isFeverMode) {
          feverTotalPayout += 15;
          chipCount += 15;
          updateChipDisplay();
          showChipEffect(15);
          
          // 累計150枚の払い出しか10回転で終了
          feverSpinsRemaining--;
          if (feverSpinsRemaining <= 0 || feverTotalPayout >= 150) {
            endFeverMode();
          }
        }
        
        // チャンスモードをリセット（今回のゲームで使い切ったため）
        if (isChanceMode && !isSankonChanceMode) {
          isChanceMode = false;
          chanceNotificationShown = false; // 通知表示フラグもリセット
          clearInterval(blinkTimer);
          chanceLamp.classList.remove('active');
          // 虹色の縁は、checkResult()内で「ぷんこす」が完成した場合は保持される
        }
        
        startButton.textContent = 'スタート';
      }
    }
  }
  
  // フィーバーモード開始
// フィーバーモード開始（通知表示対応）
function startFeverMode() {
  isFeverMode = true;
  feverSpinsRemaining = 10;
  feverTotalPayout = 0;
  
  // フィーバー開始通知を表示
  showFeverNotification();
  
  // フィーバー画像を表示
  feverImageLeft.classList.add('active');
  feverImageRight.classList.add('active');
  
  // フィーバーバナーを表示
  feverBanner.classList.add('active');
  
  // メッセージ表示
  messageBubble.textContent = 'フィーバータイム中';
  
  // 顔画像をフィーバー用に変更
  faceDisplay.style.backgroundImage = `url(assets/fever1.png)`;
  
  // 虹色の縁を維持
  faceDisplay.classList.add('rainbow-border');
}
  
  // フィーバーモード終了
// フィーバーモード終了（サンコンチャンスへの移行をスムーズに）
function endFeverMode() {
  isFeverMode = false;
  
  // フィーバー画像を非表示
  feverImageLeft.classList.remove('active');
  feverImageRight.classList.remove('active');
  
  // フィーバーバナーを非表示
  feverBanner.classList.remove('active');
  
  // 顔画像を通常に戻す
  setFaceDisplay('normal');
  
  // チップがない場合はゲームオーバー表示
  if (chipCount <= 0) {
    chipCount = 0;
    updateChipDisplay();
    startButton.disabled = true;
    showGameOver();
    return; // ゲームオーバーの場合はサンコンチャンスに移行しない
  }
  
  // フィーバー終了通知（サンコンチャンスへの移行を含む）
  showFeverEndNotification();
  // 注意: ここではサンコンチャンスを直接開始せず、通知内で処理
}
  
  // サンコンチャンスモード開始
  function startSankonChanceMode() {
    isSankonChanceMode = true;
    sankonChanceSpinsRemaining = 5;
    
    // チャンスランプを点滅
    blinkChanceLight();
    
    // 虹色の縁を追加
    faceDisplay.classList.add('rainbow-border');
    
    // サンコン画像を表示
    setFaceDisplay('surprise3');
    
    // メッセージ表示
    messageBubble.textContent = 'サンコンチャンスモード開始！5回転の間、高確率でぷんこすが狙えます！';
    
    // サンコンチャンスモード開始通知
    showSankonChanceNotification();
  }
  
  // サンコンチャンスモード開始通知
  function showSankonChanceNotification() {
    const notification = document.createElement('div');
    notification.className = 'sankon-chance-notification';
    notification.innerHTML = `
      <div class="sankon-chance-image"></div>
      <span class="sankon-chance-text">サンコンチャンス！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 3秒後に非表示
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    }, 100);
  }
  function showFeverNotification() {
    const notification = document.createElement('div');
    notification.className = 'fever-notification';
    notification.innerHTML = `
      <div class="fever-notification-image"></div>
      <span class="fever-notification-text">フィーバータイム！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 3秒後に非表示
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    }, 100);
  }
  
  // フィーバーモード終了通知
  function showFeverEndNotification() {
    const notification = document.createElement('div');
    notification.className = 'fever-end-notification';
    notification.innerHTML = `
      <div class="fever-end-image"></div>
      <span class="fever-end-text">フィーバータイム終了！</span>
      <span class="fever-end-payout">獲得: ${feverTotalPayout}枚</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 3秒後に非表示
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
          
          // フィーバー終了通知の後にサンコンチャンス開始
          startSankonChanceMode();
        }, 500);
      }, 3000);
    }, 100);
  }
  
  // ぷんこす完成通知（より派手に）
  function showPunkosCompletion() {
    const notification = document.createElement('div');
    notification.className = 'punkos-completion-notification';
    notification.innerHTML = `
      <div class="punkos-chars-container">
        <span class="punkos-char" id="punkos-p">ぷ</span>
        <span class="punkos-char" id="punkos-n">ん</span>
        <span class="punkos-char" id="punkos-k">こ</span>
        <span class="punkos-char" id="punkos-s">す</span>
      </div>
      <span class="punkos-complete-text">完成！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 文字を一つずつ表示（より遅延をつけて表示）
      setTimeout(() => document.getElementById('punkos-p').classList.add('show'), 600);
      setTimeout(() => document.getElementById('punkos-n').classList.add('show'), 1200);
      setTimeout(() => document.getElementById('punkos-k').classList.add('show'), 1800);
      setTimeout(() => document.getElementById('punkos-s').classList.add('show'), 2400);
      
      // 完成テキストを表示（より長く待機）
      setTimeout(() => {
        document.querySelector('.punkos-complete-text').classList.add('show');
      }, 3600);
      
      // 6秒後に非表示（より長く表示）
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 6000);
    }, 100);
  }
  
  // トリガーコメントを取得
  function getTriggerComment(triggerId) {
    switch(triggerId) {
      case 'ぷんこす': return 'おめでとう、ぷんこすの完成だね。美味しいぷんこすをどうぞ！';
      case 'うんこ': return 'オエ...臭いよ...';
      case 'ちんこ': return 'ちん...ちょっと引くわ...';
      case 'うらすじ': return 'おい、うらすじだって？';
      case 'ちりめん': return 'ちりめん';
      case 'さんこん': return 'イッコンニコンサンコンです！！';
      case 'ぷんこ': return 'あれ...惜しいんじゃない？４択外した気分はどう？';
      default: return '';
    }
  }

  // サンコンチャンスモード終了
  function endSankonChanceMode() {
    isSankonChanceMode = false;
    
    // チャンスランプを消灯
    clearInterval(blinkTimer);
    chanceLamp.classList.remove('active');
    
    // フィーバーモード中でなければ虹色の縁を削除
    if (!isFeverMode) {
      faceDisplay.classList.remove('rainbow-border');
    }
  }
  
  // チャンスモード関連の追加機能
  function showChanceNotification() {
    const notification = document.createElement('div');
    notification.className = 'chance-notification';
    notification.innerHTML = `
      <div class="chance-image"></div>
      <span class="chance-text">チャンス！</span>
    `;
    document.body.appendChild(notification);
    
    // チャンス通知表示済みフラグをセット
    chanceNotificationShown = true;
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 5秒後に非表示
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
          
          // 顔画像の縁に虹色エフェクトを追加
          faceDisplay.classList.add('rainbow-border');
        }, 500);
      }, 5000);
    }, 100);
  }
  
  // 全てのリールを回転開始
  function startAll() {
    // 回転中であれば停止操作に変更
    if (gameState === 'spinning') {
      handleStopAction();
      return;
    }
    
    // チップが足りるか確認（フィーバーモード中は消費なし、リプレイ時も消費なし）
    if (!isFeverMode && !isReplay && chipCount < 5) {
      messageBubble.textContent = 'チップが足りません！';
      showGameOver();
      return;
    }
    
    // チップを消費（フィーバーモード中またはリプレイ時は消費なし）
    if (!isFeverMode && !isReplay) {
      chipCount -= 5;
      updateChipDisplay();
    }
    
    // リプレイフラグをリセット（次の処理のためにこの時点でリセット）
    const wasReplay = isReplay;
    isReplay = false;
    replayShown = false;
    
    // 新しいゲーム開始
    gameState = 'spinning';
    startButton.textContent = '停止';
    
    // 状態をリセット
    results = ['', '', '', ''];
    
    // 状態に応じたメッセージ表示
    if (isFeverMode) {
      messageBubble.textContent = 'フィーバータイム中';
    } else if (isSankonChanceMode) {
      messageBubble.textContent = 'サンコンチャンス！高確率でぷんこすを狙え！';
    } else {
      messageBubble.textContent = '回転中...';
    }
    
    // 新規トリガー獲得フラグをリセット
    newTriggerShown = false;
    
    // 虹色の縁があれば削除 (チャンスモード中やフィーバーモード中は削除しない)
    if (!isChanceMode && !isSankonChanceMode && !isFeverMode) {
      faceDisplay.classList.remove('rainbow-border');
      
      // フィーバーモード中は顔画像を変えない
      if (!isFeverMode) {
        setFaceDisplay('normal');
      }
    }
    
    // 状態に応じて顔画像をセット
    if (isFeverMode) {
      faceDisplay.style.backgroundImage = `url(assets/fever1.png)`;
    } else if (isSankonChanceMode && !isChanceMode) {
      setFaceDisplay('surprise3');
    } else if (!isChanceMode && !isSankonChanceMode && !isFeverMode) {
      setFaceDisplay('normal');
    }
    
    // チャンスモードの抽選
    if (isSankonChanceMode && !isChanceMode) {
      // サンコンチャンスモード中は高確率でぷんこす確定 (1/10)だけ有効
      isChanceMode = Math.random() < sankonChanceProbability;
      
      // 残り回転数をカウントダウン
      sankonChanceSpinsRemaining--;
      if (sankonChanceSpinsRemaining <= 0) {
        // 回転数が終了したらサンコンチャンスモード終了
        endSankonChanceMode();
      }
    } else if (!isChanceMode && !isSankonChanceMode && !isFeverMode) {
      // 通常時の低確率チャンスモード抽選 (1/200)
      isChanceMode = Math.random() < 1/200;
    }
    
    if (isChanceMode && !isFeverMode) {
      blinkChanceLight();
      setFaceDisplay('chance'); // チャンスモード時の画像表示
      
      // チャンスモードの演出が一度も表示されていない場合のみ表示
      if (!chanceNotificationShown) {
        showChanceNotification(); // チャンス告知表示
      }
    }
    
    // 全リール回転開始
    for (let i = 0; i < 4; i++) {
      spinning[i] = true;
      clearTimeout(timers[i]);
      startSpin(i);
      stopButtons[i].disabled = false;
    }
  }
  
  // スタートボタンでの連打停止処理
  function handleStopAction() {
    // 回転中のリールを見つけて最初の1つを停止
    for (let i = 0; i < 4; i++) {
      if (spinning[i]) {
        stopSpin(i);
        break;
      }
    }
    
    // すべて停止したら状態をリセット
    if (!spinning.some(s => s)) {
      gameState = 'idle';
      startButton.textContent = 'スタート';
    }
  }
  
  // 顔表示を設定
  function setFaceDisplay(type) {
    // フィーバー中は顔画像を変更しない
    if (isFeverMode) {
      faceDisplay.style.backgroundImage = `url(assets/fever1.png)`;
      return;
    }
    
    faceDisplay.textContent = '';
    faceDisplay.style.backgroundImage = `url(assets/${type}.png)`;
  }
  
  // チャンスライトの点滅
  function blinkChanceLight() {
    chanceLamp.classList.add('active');
    clearInterval(blinkTimer); // 既存のタイマーをクリア
    blinkTimer = setInterval(() => {
      chanceLamp.classList.toggle('active');
    }, 500);
  }
  
  // トリガーの達成状況を更新
  function updateTriggerAchievement(triggerId) {
    if (triggers[triggerId]) {
      // 初回達成の場合
      const isFirstAchievement = !triggers[triggerId].achieved;
      
      // カウント増加
      triggers[triggerId].count++;
      
      // 初回達成の場合
      if (isFirstAchievement) {
        triggers[triggerId].achieved = true;
        
        // 初回獲得の場合はスタートボタンを2秒間無効化
        startButton.disabled = true;
        setTimeout(() => {
          startButton.disabled = false;
        }, 2000);
        
        newTriggerShown = true;
        showNewTriggerNotification(triggerId);
      }
      
      updateTriggerList();
      updateTriggerCount();
      checkTriggerCompletion();
    }
  }
  
  // 新しいトリガー獲得通知
  function showNewTriggerNotification(triggerId) {
    const notification = document.createElement('div');
    notification.className = 'trigger-notification';
    notification.innerHTML = `
      <span class="notification-emoji">${triggers[triggerId].emoji}</span>
      <span class="notification-text">新しい画像を獲得！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション後に削除（表示時間を2秒に延長）
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
          newTriggerShown = false;
        }, 500);
      }, 2000); // ここを2000ms（2秒）に延長
    }, 100);
  }
  
  // トリガーリストの表示を更新
  function updateTriggerList() {
    triggerList.innerHTML = '';
    
    Object.entries(triggers).forEach(([key, trigger]) => {
      if (trigger.achieved) {
        const triggerItem = document.createElement('div');
        triggerItem.className = 'trigger-item';
        
        // 顔文字の代わりに画像を使用
        const imageType = getTriggerImageType(key);
        triggerItem.innerHTML = `
          <div class="trigger-image" style="background-image: url('assets/${imageType}.png')" data-image-type="${imageType}"></div>
          <span class="trigger-count">${trigger.count}</span>
        `;
        
        // クリックイベントを追加
        const imageElement = triggerItem.querySelector('.trigger-image');
        imageElement.addEventListener('click', () => {
          showEnlargedImage(imageType, key);
        });
        
        triggerList.appendChild(triggerItem);
      }
    });
  }

  // トリガーに対応する画像タイプを取得
  function getTriggerImageType(triggerId) {
    switch(triggerId) {
      case 'ぷんこす': return 'win';
      case 'うんこ': return 'stinky';
      case 'ちんこ': return 'naughty';
      case 'うらすじ': return 'surprise1';
      case 'ちりめん': return 'surprise2';
      case 'さんこん': return 'surprise3';
      case 'ぷんこ': return 'close';
      default: return 'normal';
    }
  }

  // トリガー名を取得
  function getTriggerName(triggerId) {
    switch(triggerId) {
      case 'ぷんこす': return 'ぷんこす';
      case 'うんこ': return 'うんこ';
      case 'ちんこ': return 'ちんこ';
      case 'うらすじ': return 'うらすじ';
      case 'ちりめん': return 'ちりめん';
      case 'さんこん': return 'さんこん';
      case 'ぷんこ': return 'ぷんこ（惜しい）';
      default: return triggerId;
    }
  }

  // 拡大画像表示
  // 拡大画像表示
// 拡大画像表示（トリガーコメント表示対応）
function showEnlargedImage(imageType, triggerId) {
  // すでに表示されていればそれを削除
  const existingPopup = document.getElementById('image-popup');
  if (existingPopup) {
    document.body.removeChild(existingPopup);
  }
  
  // トリガー名と説明コメントを取得
  const triggerName = getTriggerName(triggerId);
  const triggerComment = getTriggerComment(triggerId);
  const triggerCount = triggers[triggerId].count;
  
  // 新しいポップアップを作成
  const popup = document.createElement('div');
  popup.id = 'image-popup';
  popup.className = 'image-popup';
  
  popup.innerHTML = `
    <div class="popup-content">
      <div class="popup-header">
        <button class="close-button">&times;</button>
      </div>
      <div class="popup-image" style="background-image: url('assets/${imageType}.png')"></div>
      <div class="popup-info">
        <p class="popup-trigger-name">${triggerName}</p>
        <p class="popup-trigger-comment">${triggerComment}</p>
        <p>獲得回数: ${triggerCount}回</p>
      </div>
    </div>
  `;
  
  // 閉じるボタンイベント
  popup.querySelector('.close-button').addEventListener('click', () => {
    closePopup(popup);
  });
  
  // 背景クリックでも閉じる
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      closePopup(popup);
    }
  });
  
  // ESCキーでも閉じる
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('image-popup')) {
      closePopup(popup);
    }
  });
  
  // ポップアップを表示
  document.body.appendChild(popup);
  
  // アニメーション用にタイムアウト
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
}

  // ポップアップを閉じる
  function closePopup(popup) {
    popup.classList.remove('show');
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 300); // トランジション時間と合わせる
  }
  
  // トリガーカウントの更新
  function updateTriggerCount() {
    const achieved = Object.values(triggers).filter(t => t.achieved).length;
    const total = Object.values(triggers).length;
    triggerCount.textContent = `${achieved}/${total}種類`;
  }
  
  // トリガーコンプリート確認
  function checkTriggerCompletion() {
    const allCompleted = Object.values(triggers).every(trigger => trigger.achieved);
    if (allCompleted && !triggerCompMessage.classList.contains('completed')) {
      triggerCompMessage.classList.add('completed');
      showCompletionCelebration();
    }
  }
  
  // コンプリート達成時のお祝い演出（すべての画像を使用するよう更新）
  function showCompletionCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'completion-celebration';
    
    // 目立つ表示
    const content = document.createElement('div');
    content.className = 'celebration-content';
    
    // すべてのトリガー画像を表示
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'celebration-emojis';
    
    // すべてのトリガーとチャンス画像を表示
    const allImageTypes = [
      'win', 'stinky', 'naughty', 'surprise1', 
      'surprise2', 'surprise3', 'close', 'normal', 'chance'
    ];
    
    allImageTypes.forEach(imageType => {
      const imageElem = document.createElement('div');
      imageElem.className = 'celebration-image';
      imageElem.style.backgroundImage = `url('assets/${imageType}.png')`;
      imagesContainer.appendChild(imageElem);
    });
    
    // おめでとうメッセージ
    const message = document.createElement('div');
    message.className = 'celebration-message';
    message.textContent = 'コンプリート達成おめでとう！';
    
    content.appendChild(imagesContainer);
    content.appendChild(message);
    celebration.appendChild(content);
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.classList.add('show');
      setTimeout(() => {
        celebration.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(celebration);
        }, 1000);
      }, 5000); // 5秒間表示
    }, 100);
    
    // コンプリート特典としてチップを追加
    chipCount += 1000;
    updateChipDisplay();
    messageBubble.textContent = 'コンプリート記念に1000チップ獲得！';
  }
  
  // 結果チェック
  function checkResult() {
    const combination = results.join('');
    
    // フィーバーモード中は結果に関わらず終了確認のみ
    if (isFeverMode) {
      return;
    }
    
    let isNormalResult = false; // 通常結果かどうかのフラグ
    
    if (combination === 'ぷんこす') {
      messageBubble.textContent = 'おめでとう、ぷんこすの完成だね。美味しいぷんこすをどうぞ！';
      setFaceDisplay('win');
      // ぷんこす完成時にも虹色の縁を追加
      faceDisplay.classList.add('rainbow-border');
      
      // ぷんこす完成アニメーションを表示（より派手に）
      showPunkosCompletion();
      
      // 演出順序の整理：ぷんこす完成→新規獲得→フィーバータイム開始表示→フィーバータイム
      setTimeout(() => {
        // 新規獲得処理
        updateTriggerAchievement('ぷんこす');
        
        // サンコンチャンスモード中だった場合は終了
        if (isSankonChanceMode) {
          endSankonChanceMode();
        }
        
        // 2秒後にフィーバータイム開始表示
        setTimeout(() => {
          messageBubble.textContent = 'フィーバータイム開始！';
          
          // さらに2秒後にフィーバータイム開始
          setTimeout(() => {
            startFeverMode();
          }, 2000);
        }, 2000);
      }, 7000); // アニメーション終了後に処理を実行するため、時間を伸ばす（さらに1秒追加）
      
    } else if (combination.startsWith('ぷんこ') && !combination.endsWith('す')) {
      messageBubble.textContent = 'あれ...惜しいんじゃない？４択外した気分はどう？';
      setFaceDisplay('close');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('ぷんこ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // ぷんこは15枚還元
        chipCount += 15;
        updateChipDisplay();
        showChipEffect(15);
      }
      
    } else if (combination.includes('うんこ')) {
      messageBubble.textContent = 'オエ...臭いよ...';
      setFaceDisplay('stinky');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('うんこ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // うんこは10枚追加ダウン
        chipCount -= 10;
        updateChipDisplay();
        showChipEffect(-10);
      }
      
    } else if (combination.includes('ちんこ')) {
      messageBubble.textContent = 'ちん...ちょっと引くわ...';
      setFaceDisplay('naughty');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('ちんこ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // ちんこは5枚追加ダウン
        chipCount -= 5;
        updateChipDisplay();
        showChipEffect(-5);
      }
      
    } else if (combination.includes('うらすじ')) {
      messageBubble.textContent = 'おい、うらすじだって？';
      setFaceDisplay('surprise1');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('うらすじ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // うらすじは50枚還元
        chipCount += 50;
        updateChipDisplay();
        showChipEffect(50);
      }
      
    } else if (combination.includes('ちりめん')) {
      messageBubble.textContent = 'ちりめん';
      setFaceDisplay('surprise2');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('ちりめん');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // ちりめんは30枚還元
        chipCount += 30;
        updateChipDisplay();
        showChipEffect(30);
      }
      
    } else if (combination.includes('さんこん')) {
      messageBubble.textContent = 'イッコンニコンサンコンです！！';
      setFaceDisplay('surprise3');
      updateTriggerAchievement('さんこん');
      
      // サンコンチャンスモード中ではないときのみチップ効果
      if (!isSankonChanceMode) {
        // さんこんは25枚還元
        chipCount += 25;
        updateChipDisplay();
        showChipEffect(25);
        
        // サンコンチャンスモード開始
        startSankonChanceMode();
      } else {
        // サンコンチャンスモード中に再度サンコンが揃った場合
        messageBubble.textContent = 'サンコンチャンス継続！残り5回転追加！';
        sankonChanceSpinsRemaining = 5; // 回転数リセット
      }
      
    } else {
      // ハズレの場合、サンコンチャンスモード中はリプレイ無し
      if (!isSankonChanceMode && Math.random() < 0.1) {
        messageBubble.textContent = 'リプレイ！次回無料で回せます！';
        isReplay = true;
        
        // リプレイ表示
        if (!replayShown) {
          showChipEffect(0, 'replay');
          replayShown = true;
        }
      } else {
        messageBubble.textContent = 'はずれ...もう一回！';
      }
      
      // サンコンチャンスモード中はハズレでも顔をサンコンのままにする
      if (isSankonChanceMode) {
        setFaceDisplay('surprise3');
      } else {
        setFaceDisplay('normal');
      }
      
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      isNormalResult = true; // 通常結果フラグをオン
    }
    
    // チップが0以下になった場合のゲームオーバー処理
    if (chipCount <= 0) {
      chipCount = 0;
      updateChipDisplay();
      
      // フィーバーモード中でなければゲームオーバー
      if (!isFeverMode) {
        startButton.disabled = true;
        showGameOver();
      }
    }
    
    // 通常以外の結果の場合は待機（ぷんこす以外は0.5秒、ぷんこすは3秒）
    // ぷんこすの場合はcheckResult()内で別途処理されるため、ここではスキップ
    if (!isNormalResult && combination !== 'ぷんこす') {
      // スタートボタンを一時的に無効化して待機を表現
      startButton.disabled = true;
      
      setTimeout(() => {
        // 0.5秒後にスタートボタンを再度有効化（チップがない場合は除く）
        if (chipCount > 0 || isFeverMode || isReplay) {
          startButton.disabled = false;
        }
      }, 500);
    }
  }
  
  // イベントリスナーの設定
  startButton.addEventListener('click', startAll);
  
  stopButtons.forEach(button => {
    const index = parseInt(button.dataset.index);
    button.addEventListener('click', () => {
      if (spinning[index]) {
        stopSpin(index);
      }
    });
  });
  
  // デバッグモード用のイベントリスナー
  const debugTriggers = document.querySelectorAll('.debug-trigger');
  const debugComp = document.getElementById('debug-comp');
  const debugReset = document.getElementById('debug-reset');
  
  // 個別トリガー強制発動
  debugTriggers.forEach(button => {
    button.addEventListener('click', () => {
      const triggerId = button.dataset.trigger;
      updateTriggerAchievement(triggerId);
    });
  });
  
  // 全コンプ
  if (debugComp) {
    debugComp.addEventListener('click', () => {
      Object.keys(triggers).forEach(triggerId => {
        if (!triggers[triggerId].achieved) {
          triggers[triggerId].achieved = true;
          triggers[triggerId].count = 1;
        }
      });
      updateTriggerList();
      updateTriggerCount();
      checkTriggerCompletion();
    });
  }
  
  // リセット
  if (debugReset) {
    debugReset.addEventListener('click', () => {
      Object.keys(triggers).forEach(triggerId => {
        triggers[triggerId].achieved = false;
        triggers[triggerId].count = 0;
      });
      updateTriggerList();
      updateTriggerCount();
      triggerCompMessage.classList.remove('completed');
    });
  }
  
  // チップ追加デバッグボタン
  const debugAddChips = document.getElementById('debug-add-chips');
  if (debugAddChips) {
    debugAddChips.addEventListener('click', () => {
      chipCount += 100;
      updateChipDisplay();
      startButton.disabled = false;
      messageBubble.textContent = '100チップ追加しました！';
    });
  }
  
  // チャンス強制ボタン
  const debugChance = document.getElementById('debug-chance');
  if (debugChance) {
    debugChance.addEventListener('click', () => {
      // チャンスモードフラグを設定
      isChanceMode = true;
      
      // CHANCEランプを点滅させる
      blinkChanceLight();
      
      // 顔表示をチャンスモードに変更
      setFaceDisplay('chance');
      
      // チャンス通知表示（すでに表示されていなければかつフラグがfalseの場合のみ）
      if (!document.querySelector('.chance-notification') && !chanceNotificationShown) {
        showChanceNotification();
      } else {
        // フラグだけセットして演出はスキップ
        chanceNotificationShown = true;
        // 顔画像の縁に虹色エフェクトを追加
        faceDisplay.classList.add('rainbow-border');
      }
      
      // すでにゲームが回転中なら強制的に停止する
      if (gameState === 'spinning') {
        // 全てのリールを強制停止し、結果を「ぷんこす」に設定
        for (let i = 0; i < 4; i++) {
          if (spinning[i]) {
            clearTimeout(timers[i]);
            results[i] = ['ぷ', 'ん', 'こ', 'す'][i];
            reelElements[i].textContent = results[i];
            spinning[i] = false;
            stopButtons[i].disabled = true;
          }
        }
        
        // 結果確認と状態リセット
        gameState = 'idle';
        checkResult();
        startButton.textContent = 'スタート';
        
        // チャンスモードをリセット
        isChanceMode = false;
        chanceNotificationShown = false;
        clearInterval(blinkTimer);
        chanceLamp.classList.remove('active');
      } else {
        // 次回スタート時に必ずぷんこすを揃えるためのメッセージ
        messageBubble.textContent = 'チャンスモード発動！スタートを押してください';
      }
    });
  }
  
  // サンコンチャンスモードデバッグボタン
  const debugSankonChance = document.getElementById('debug-sankon-chance');
  if (debugSankonChance) {
    debugSankonChance.addEventListener('click', () => {
      startSankonChanceMode();
    });
  }
  
  // フィーバーモードデバッグボタン
  const debugFever = document.getElementById('debug-fever');
  if (debugFever) {
    debugFever.addEventListener('click', () => {
      startFeverMode();
    });
  }
  
  // リプレイデバッグボタン
  const debugReplay = document.getElementById('debug-replay');
  if (debugReplay) {
    debugReplay.addEventListener('click', () => {
      isReplay = true;
      showChipEffect(0, 'replay');
      messageBubble.textContent = 'リプレイ有効化！次回無料で回せます！';
    });
  }
});    // 状態に応じて顔画像をセット
    if (isFeverMode) {
      faceDisplay.style.backgroundImage = `url(assets/fever1.png)`;
    } else if (isSankonChanceMode && !isChanceMode) {
      setFaceDisplay('surprise3');
    } else if (!isChanceMode && !isSankonChanceMode && !isFeverMode) {
      setFaceDisplay('normal');
    }document.addEventListener('DOMContentLoaded', () => {
  // スロットの回転文字定義
  const reels = [
    ['ぷ', 'う', 'ち', 'さ'],
    ['ん', 'ら', 'う', 'り'],
    ['こ', 'め', 'ど', 'す'],
    ['す', 'じ', 'う', 'ん']
  ];
  
  // 顔文字マッピング (将来的に画像に置き換え)
  const faceEmojis = {
    'normal': '😐',    // 通常時
    'win': '😆',       // 大当たり（ぷんこす）
    'close': '😔',     // おしい（ぷんこ）
    'stinky': '🤢',    // うんこ
    'naughty': '😏',   // ちんこ
    'surprise1': '😮',  // うらすじ
    'surprise2': '😎',  // ちりめん
    'surprise3': '🎉',  // さんこん
    'chance': '🌟',     // チャンスモード
    'fever': '🔥'      // フィーバーモード
  };
  
  // トリガー状態管理 (顔文字を使用)
  const triggers = {
    'ぷんこす': { achieved: false, emoji: '😆', count: 0 },
    'うんこ': { achieved: false, emoji: '🤢', count: 0 },
    'ちんこ': { achieved: false, emoji: '😏', count: 0 },
    'うらすじ': { achieved: false, emoji: '😮', count: 0 },
    'ちりめん': { achieved: false, emoji: '😎', count: 0 },
    'さんこん': { achieved: false, emoji: '🎉', count: 0 },
    'ぷんこ': { achieved: false, emoji: '😔', count: 0 }
  };
  
  // DOM要素の取得
  const reelElements = Array.from({ length: 4 }, (_, i) => document.getElementById(`reel${i}`));
  const stopButtons = document.querySelectorAll('.stop-button');
  const startButton = document.getElementById('start-button');
  const faceDisplay = document.getElementById('face-display');
  const messageBubble = document.getElementById('message');
  const chanceLamp = document.getElementById('chance-lamp');
  const triggerList = document.getElementById('trigger-list');
  const triggerCount = document.getElementById('trigger-count');
  const triggerCompMessage = document.getElementById('trigger-comp-message');
  const chipCountDisplay = document.getElementById('chip-count');
  const feverImageLeft = document.querySelector('.fever-image.left');
  const feverImageRight = document.querySelector('.fever-image.right');
  const feverBanner = document.getElementById('fever-banner');
  
  // 状態管理
  let results = ['', '', '', ''];
  let spinning = [false, false, false, false];
  let isChanceMode = false;
  let chanceNotificationShown = false; // チャンス通知表示済みフラグ
  let timers = [null, null, null, null];
  let blinkTimer = null;
  let gameState = 'idle'; // 'idle', 'spinning'
  
  // チップシステム関連の変数
  let chipCount = 200; // 初期チップ数
  let isFeverMode = false; // フィーバーモードフラグ
  let feverSpinsRemaining = 0; // 残りフィーバー回転数
  let feverTotalPayout = 0; // フィーバー中の総払い出し
  let isSankonChanceMode = false; // サンコンチャンスモードフラグ
  let sankonChanceSpinsRemaining = 0; // 残りサンコンチャンス回転数
  let sankonChanceProbability = 0.1; // サンコンチャンス中のぷんこす確率 (1/10)
  let isReplay = false; // リプレイフラグ
  let replayShown = false; // リプレイ表示済みフラグ
  let newTriggerShown = false; // 新規トリガー獲得表示済みフラグ
  
  // 初期化: トリガーリストの表示
  updateTriggerList();
  updateTriggerCount();
  updateChipDisplay();
  
  // チップ表示を更新する
  function updateChipDisplay() {
    chipCountDisplay.textContent = chipCount;
  }
  
  // チップ獲得/消費の効果表示
  function showChipEffect(amount, type = '') {
    // 新規トリガー獲得表示中は表示を遅らせる
    if (newTriggerShown) {
      setTimeout(() => showChipEffect(amount, type), 1500);
      return;
    }
    
    // すでに表示されているものがあれば削除
    const existingEffect = document.querySelector('.chip-effect');
    if (existingEffect) {
      document.body.removeChild(existingEffect);
    }
    
    const effect = document.createElement('div');
    effect.className = 'chip-effect';
    
    // 金額に応じたクラスを追加
    if (amount > 0) {
      effect.classList.add('positive');
      effect.textContent = `+${amount}枚`;
    } else if (amount < 0) {
      effect.classList.add('negative');
      effect.textContent = `${amount}枚`;
    } else if (type === 'replay') {
      effect.classList.add('replay');
      effect.textContent = `リプレイ！`;
    }
    
    document.body.appendChild(effect);
    
    // アニメーション表示
    setTimeout(() => {
      effect.classList.add('show');
      
      // 一定時間後に消す
      setTimeout(() => {
        effect.classList.remove('show');
        setTimeout(() => {
          if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
          }
        }, 300);
      }, 1000);
    }, 10);
  }
  
  // ゲームオーバー表示
  function showGameOver() {
    const gameOver = document.createElement('div');
    gameOver.className = 'game-over';
    
    gameOver.innerHTML = `
      <div class="game-over-content">
        <h2>ゲームオーバー</h2>
        <p>チップがなくなりました！</p>
        <p>また遊んでね！</p>
        <button id="restart-button">もう一度遊ぶ</button>
      </div>
    `;
    
    document.body.appendChild(gameOver);
    
    // アニメーション表示
    setTimeout(() => {
      gameOver.classList.add('show');
      
      // リスタートボタンのイベント
      const restartButton = document.getElementById('restart-button');
      restartButton.addEventListener('click', () => {
        chipCount = 200;
        updateChipDisplay();
        startButton.disabled = false;
        messageBubble.textContent = 'チップをリセットしました！スタートを押してください。';
        
        // ゲームオーバー表示を閉じる
        gameOver.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(gameOver);
        }, 300);
      });
    }, 10);
  }
  
  // シンプルなリール回転ロジック
  function startSpin(reelIndex) {
    if (!spinning[reelIndex]) return;
    
    // 回転の表現としてランダムな文字を表示
    const randomChar = reels[reelIndex][Math.floor(Math.random() * reels[reelIndex].length)];
    reelElements[reelIndex].textContent = randomChar;
    
    // 次のフレームの予約
    timers[reelIndex] = setTimeout(() => startSpin(reelIndex), 100);
  }
  
  // リールの回転停止
  function stopSpin(reelIndex) {
    if (spinning[reelIndex]) {
      clearTimeout(timers[reelIndex]);
      
      // チャンスモードの場合は強制的に「ぷんこす」に
      if (isChanceMode) {
        results[reelIndex] = ['ぷ', 'ん', 'こ', 'す'][reelIndex];
      } else {
        // ランダムに結果を選択
        const randomIndex = Math.floor(Math.random() * reels[reelIndex].length);
        results[reelIndex] = reels[reelIndex][randomIndex];
      }
      
      // 表示を更新
      reelElements[reelIndex].textContent = results[reelIndex];
      spinning[reelIndex] = false;
      stopButtons[reelIndex].disabled = true;
      
      // 全て停止したかチェック
      if (!spinning.some(s => s)) {
        gameState = 'idle';
        checkResult();
        
        // フィーバーモード中は1回転ごとに15チップ獲得
        if (isFeverMode) {
          feverTotalPayout += 15;
          chipCount += 15;
          updateChipDisplay();
          showChipEffect(15);
          
          // 累計150枚の払い出しか10回転で終了
          feverSpinsRemaining--;
          if (feverSpinsRemaining <= 0 || feverTotalPayout >= 150) {
            endFeverMode();
          }
        }
        
        // チャンスモードをリセット（今回のゲームで使い切ったため）
        if (isChanceMode && !isSankonChanceMode) {
          isChanceMode = false;
          chanceNotificationShown = false; // 通知表示フラグもリセット
          clearInterval(blinkTimer);
          chanceLamp.classList.remove('active');
          // 虹色の縁は、checkResult()内で「ぷんこす」が完成した場合は保持される
        }
        
        startButton.textContent = 'スタート';
      }
    }
  }
  
  // フィーバーモード開始
  function startFeverMode() {
    isFeverMode = true;
    feverSpinsRemaining = 10;
    feverTotalPayout = 0;
    
    // フィーバー画像を表示
    feverImageLeft.classList.add('active');
    feverImageRight.classList.add('active');
    
    // フィーバーバナーを表示
    feverBanner.classList.add('active');
    
    // メッセージ表示
    messageBubble.textContent = 'フィーバータイム中';
    
    // 顔画像をフィーバー用に変更
    faceDisplay.style.backgroundImage = `url(assets/fever1.png)`;
    
    // 虹色の縁を維持
    faceDisplay.classList.add('rainbow-border');
  }
  
  // フィーバーモード終了
  function endFeverMode() {
    isFeverMode = false;
    
    // フィーバー画像を非表示
    feverImageLeft.classList.remove('active');
    feverImageRight.classList.remove('active');
    
    // フィーバーバナーを非表示
    feverBanner.classList.remove('active');
    
    // 顔画像を通常に戻す
    setFaceDisplay('normal');
    
    // サンコンチャンスモード中でなければ虹色の縁を削除
    if (!isSankonChanceMode) {
      faceDisplay.classList.remove('rainbow-border');
    }
    
    messageBubble.textContent = `フィーバータイム終了！合計${feverTotalPayout}枚獲得しました！`;
    
    // チップがない場合はゲームオーバー表示
    if (chipCount <= 0) {
      chipCount = 0;
      updateChipDisplay();
      startButton.disabled = true;
      showGameOver();
    }
  }
  
  // サンコンチャンスモード開始
  function startSankonChanceMode() {
    isSankonChanceMode = true;
    sankonChanceSpinsRemaining = 5;
    
    // チャンスランプを点滅
    blinkChanceLight();
    
    // 虹色の縁を追加
    faceDisplay.classList.add('rainbow-border');
    
    // サンコン画像を表示
    setFaceDisplay('surprise3');
    
    // メッセージ表示
    messageBubble.textContent = 'サンコンチャンスモード開始！5回転の間、高確率でぷんこすが狙えます！';
    
    // サンコンチャンスモード開始通知
    showSankonChanceNotification();
  }
  
  // サンコンチャンスモード開始通知
  function showSankonChanceNotification() {
    const notification = document.createElement('div');
    notification.className = 'sankon-chance-notification';
    notification.innerHTML = `
      <div class="sankon-chance-image"></div>
      <span class="sankon-chance-text">サンコンチャンス！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 3秒後に非表示
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    }, 100);
  }
  
  // サンコンチャンスモード終了
  function endSankonChanceMode() {
    isSankonChanceMode = false;
    
    // チャンスランプを消灯
    clearInterval(blinkTimer);
    chanceLamp.classList.remove('active');
    
    // フィーバーモード中でなければ虹色の縁を削除
    if (!isFeverMode) {
      faceDisplay.classList.remove('rainbow-border');
    }
  }
  
  // チャンスモード関連の追加機能
  function showChanceNotification() {
    const notification = document.createElement('div');
    notification.className = 'chance-notification';
    notification.innerHTML = `
      <div class="chance-image"></div>
      <span class="chance-text">チャンス！</span>
    `;
    document.body.appendChild(notification);
    
    // チャンス通知表示済みフラグをセット
    chanceNotificationShown = true;
    
    // アニメーション開始
    setTimeout(() => {
      notification.classList.add('show');
      
      // 5秒後に非表示
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
          
          // 顔画像の縁に虹色エフェクトを追加
          faceDisplay.classList.add('rainbow-border');
        }, 500);
      }, 5000);
    }, 100);
  }
  
  // 全てのリールを回転開始
  function startAll() {
    // 回転中であれば停止操作に変更
    if (gameState === 'spinning') {
      handleStopAction();
      return;
    }
    
    // チップが足りるか確認（フィーバーモード中は消費なし、リプレイ時も消費なし）
    if (!isFeverMode && !isReplay && chipCount < 5) {
      messageBubble.textContent = 'チップが足りません！';
      showGameOver();
      return;
    }
    
    // チップを消費（フィーバーモード中またはリプレイ時は消費なし）
    if (!isFeverMode && !isReplay) {
      chipCount -= 5;
      updateChipDisplay();
    }
    
    // リプレイフラグをリセット（次の処理のためにこの時点でリセット）
    const wasReplay = isReplay;
    isReplay = false;
    replayShown = false;
    
    // 新しいゲーム開始
    gameState = 'spinning';
    startButton.textContent = '停止';
    
    // 状態をリセット
    results = ['', '', '', ''];
    
    // 状態に応じたメッセージ表示
    if (isFeverMode) {
      messageBubble.textContent = 'フィーバータイム中';
    } else if (isSankonChanceMode) {
      messageBubble.textContent = 'サンコンチャンス！高確率でぷんこすを狙え！';
    } else {
      messageBubble.textContent = '回転中...';
    }
    
    // 新規トリガー獲得フラグをリセット
    newTriggerShown = false;
    
    // 虹色の縁があれば削除 (チャンスモード中やフィーバーモード中は削除しない)
    if (!isChanceMode && !isSankonChanceMode && !isFeverMode) {
      faceDisplay.classList.remove('rainbow-border');
      
      // フィーバーモード中は顔画像を変えない
      if (!isFeverMode) {
        setFaceDisplay('normal');
      }
    }
    
    // チャンスモードの抽選
    if (isSankonChanceMode && !isChanceMode) {
      // サンコンチャンスモード中は高確率でぷんこす確定 (1/10)だけ有効
      isChanceMode = Math.random() < sankonChanceProbability;
      
      // 残り回転数をカウントダウン
      sankonChanceSpinsRemaining--;
      if (sankonChanceSpinsRemaining <= 0) {
        // 回転数が終了したらサンコンチャンスモード終了
        endSankonChanceMode();
      }
    } else if (!isChanceMode && !isSankonChanceMode && !isFeverMode) {
      // 通常時の低確率チャンスモード抽選 (1/200)
      isChanceMode = Math.random() < 1/200;
    }
    
    if (isChanceMode && !isFeverMode) {
      blinkChanceLight();
      setFaceDisplay('chance'); // チャンスモード時の画像表示
      
      // チャンスモードの演出が一度も表示されていない場合のみ表示
      if (!chanceNotificationShown) {
        showChanceNotification(); // チャンス告知表示
      }
    }
    
    // 全リール回転開始
    for (let i = 0; i < 4; i++) {
      spinning[i] = true;
      clearTimeout(timers[i]);
      startSpin(i);
      stopButtons[i].disabled = false;
    }
  }
  
  // スタートボタンでの連打停止処理
  function handleStopAction() {
    // 回転中のリールを見つけて最初の1つを停止
    for (let i = 0; i < 4; i++) {
      if (spinning[i]) {
        stopSpin(i);
        break;
      }
    }
    
    // すべて停止したら状態をリセット
    if (!spinning.some(s => s)) {
      gameState = 'idle';
      startButton.textContent = 'スタート';
    }
  }
  
  // 顔表示を設定
  function setFaceDisplay(type) {
    // フィーバー中は顔画像を変更しない
    if (isFeverMode) {
      faceDisplay.style.backgroundImage = `url(assets/fever1.png)`;
      return;
    }
    
    faceDisplay.textContent = '';
    faceDisplay.style.backgroundImage = `url(assets/${type}.png)`;
  }
  
  // チャンスライトの点滅
  function blinkChanceLight() {
    chanceLamp.classList.add('active');
    clearInterval(blinkTimer); // 既存のタイマーをクリア
    blinkTimer = setInterval(() => {
      chanceLamp.classList.toggle('active');
    }, 500);
  }
  
  // トリガーの達成状況を更新
  function updateTriggerAchievement(triggerId) {
    if (triggers[triggerId]) {
      // 初回達成の場合
      const isFirstAchievement = !triggers[triggerId].achieved;
      
      // カウント増加
      triggers[triggerId].count++;
      
      // 初回達成の場合
      if (isFirstAchievement) {
        triggers[triggerId].achieved = true;
        
        // 初回獲得の場合はスタートボタンを2秒間無効化
        startButton.disabled = true;
        setTimeout(() => {
          startButton.disabled = false;
        }, 2000);
        
        newTriggerShown = true;
        showNewTriggerNotification(triggerId);
      }
      
      updateTriggerList();
      updateTriggerCount();
      checkTriggerCompletion();
    }
  }
  
  // 新しいトリガー獲得通知
  function showNewTriggerNotification(triggerId) {
    const notification = document.createElement('div');
    notification.className = 'trigger-notification';
    notification.innerHTML = `
      <span class="notification-emoji">${triggers[triggerId].emoji}</span>
      <span class="notification-text">新しい画像を獲得！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション後に削除（表示時間を2秒に延長）
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
          newTriggerShown = false;
        }, 500);
      }, 2000); // ここを2000ms（2秒）に延長
    }, 100);
  }
  
  // トリガーリストの表示を更新
  function updateTriggerList() {
    triggerList.innerHTML = '';
    
    Object.entries(triggers).forEach(([key, trigger]) => {
      if (trigger.achieved) {
        const triggerItem = document.createElement('div');
        triggerItem.className = 'trigger-item';
        
        // 顔文字の代わりに画像を使用
        const imageType = getTriggerImageType(key);
        triggerItem.innerHTML = `
          <div class="trigger-image" style="background-image: url('assets/${imageType}.png')" data-image-type="${imageType}"></div>
          <span class="trigger-count">${trigger.count}</span>
        `;
        
        // クリックイベントを追加
        const imageElement = triggerItem.querySelector('.trigger-image');
        imageElement.addEventListener('click', () => {
          showEnlargedImage(imageType, key);
        });
        
        triggerList.appendChild(triggerItem);
      }
    });
  }

  // トリガーに対応する画像タイプを取得
  function getTriggerImageType(triggerId) {
    switch(triggerId) {
      case 'ぷんこす': return 'win';
      case 'うんこ': return 'stinky';
      case 'ちんこ': return 'naughty';
      case 'うらすじ': return 'surprise1';
      case 'ちりめん': return 'surprise2';
      case 'さんこん': return 'surprise3';
      case 'ぷんこ': return 'close';
      default: return 'normal';
    }
  }

  // トリガー名を取得
  function getTriggerName(triggerId) {
    switch(triggerId) {
      case 'ぷんこす': return 'ぷんこす';
      case 'うんこ': return 'うんこ';
      case 'ちんこ': return 'ちんこ';
      case 'うらすじ': return 'うらすじ';
      case 'ちりめん': return 'ちりめん';
      case 'さんこん': return 'さんこん';
      case 'ぷんこ': return 'ぷんこ（惜しい）';
      default: return triggerId;
    }
  }

  // 拡大画像表示
  function showEnlargedImage(imageType, triggerId) {
    // すでに表示されていればそれを削除
    const existingPopup = document.getElementById('image-popup');
    if (existingPopup) {
      document.body.removeChild(existingPopup);
    }
    
    // 新しいポップアップを作成
    const popup = document.createElement('div');
    popup.id = 'image-popup';
    popup.className = 'image-popup';
    
    // トリガー名は表示せず、獲得回数だけ表示
    const triggerCount = triggers[triggerId].count;
    
    popup.innerHTML = `
      <div class="popup-content">
        <div class="popup-header">
          <button class="close-button">&times;</button>
        </div>
        <div class="popup-image" style="background-image: url('assets/${imageType}.png')"></div>
        <div class="popup-info">
          <p>獲得回数: ${triggerCount}回</p>
        </div>
      </div>
    `;
    
    // 閉じるボタンイベント
    popup.querySelector('.close-button').addEventListener('click', () => {
      closePopup(popup);
    });
    
    // 背景クリックでも閉じる
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        closePopup(popup);
      }
    });
    
    // ESCキーでも閉じる
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.getElementById('image-popup')) {
        closePopup(popup);
      }
    });
    
    // ポップアップを表示
    document.body.appendChild(popup);
    
    // アニメーション用にタイムアウト
    setTimeout(() => {
      popup.classList.add('show');
    }, 10);
  }

  // ポップアップを閉じる
  function closePopup(popup) {
    popup.classList.remove('show');
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 300); // トランジション時間と合わせる
  }
  
  // トリガーカウントの更新
  function updateTriggerCount() {
    const achieved = Object.values(triggers).filter(t => t.achieved).length;
    const total = Object.values(triggers).length;
    triggerCount.textContent = `${achieved}/${total}種類`;
  }
  
  // トリガーコンプリート確認
  function checkTriggerCompletion() {
    const allCompleted = Object.values(triggers).every(trigger => trigger.achieved);
    if (allCompleted && !triggerCompMessage.classList.contains('completed')) {
      triggerCompMessage.classList.add('completed');
      showCompletionCelebration();
    }
  }
  
  // コンプリート達成時のお祝い演出（すべての画像を使用するよう更新）
  function showCompletionCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'completion-celebration';
    
    // 目立つ表示
    const content = document.createElement('div');
    content.className = 'celebration-content';
    
    // すべてのトリガー画像を表示
    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'celebration-emojis';
    
    // すべてのトリガーとチャンス画像を表示
    const allImageTypes = [
      'win', 'stinky', 'naughty', 'surprise1', 
      'surprise2', 'surprise3', 'close', 'normal', 'chance'
    ];
    
    allImageTypes.forEach(imageType => {
      const imageElem = document.createElement('div');
      imageElem.className = 'celebration-image';
      imageElem.style.backgroundImage = `url('assets/${imageType}.png')`;
      imagesContainer.appendChild(imageElem);
    });
    
    // おめでとうメッセージ
    const message = document.createElement('div');
    message.className = 'celebration-message';
    message.textContent = 'コンプリート達成おめでとう！';
    
    content.appendChild(imagesContainer);
    content.appendChild(message);
    celebration.appendChild(content);
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.classList.add('show');
      setTimeout(() => {
        celebration.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(celebration);
        }, 1000);
      }, 5000); // 5秒間表示
    }, 100);
    
    // コンプリート特典としてチップを追加
    chipCount += 1000;
    updateChipDisplay();
    messageBubble.textContent = 'コンプリート記念に1000チップ獲得！';
  }
  
  // 結果チェック
  function checkResult() {
    const combination = results.join('');
    
    // フィーバーモード中は結果に関わらず終了確認のみ
    if (isFeverMode) {
      return;
    }
    
    let isNormalResult = false; // 通常結果かどうかのフラグ
    
    if (combination === 'ぷんこす') {
      messageBubble.textContent = 'おめでとう、ぷんこすの完成だね。美味しいぷんこすをどうぞ！';
      setFaceDisplay('win');
      // ぷんこす完成時にも虹色の縁を追加
      faceDisplay.classList.add('rainbow-border');
      
      // スタートボタンを無効化して演出の間表示
      startButton.disabled = true;
      
      // ぷんこす完成アニメーションを表示
      showPunkosCompletion();
      
      // 演出順序の整理：ぷんこす完成→新規獲得→フィーバータイム開始表示→フィーバータイム
      setTimeout(() => {
        // 新規獲得処理
        updateTriggerAchievement('ぷんこす');
        
        // サンコンチャンスモード中だった場合は終了
        if (isSankonChanceMode) {
          endSankonChanceMode();
        }
        
        // 2秒後にフィーバータイム開始表示
        setTimeout(() => {
          messageBubble.textContent = 'フィーバータイム開始！';
          
          // さらに2秒後にフィーバータイム開始
          setTimeout(() => {
            startFeverMode();
          }, 2000);
        }, 2000);
      }, 6000); // アニメーション終了後に処理を実行するため、時間を伸ばす
      
    } else if (combination.startsWith('ぷんこ') && !combination.endsWith('す')) {
      messageBubble.textContent = 'あれ...惜しいんじゃない？４択外した気分はどう？';
      setFaceDisplay('close');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('ぷんこ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // ぷんこは15枚還元
        chipCount += 15;
        updateChipDisplay();
        showChipEffect(15);
      }
      
    } else if (combination.includes('うんこ')) {
      messageBubble.textContent = 'オエ...臭いよ...';
      setFaceDisplay('stinky');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('うんこ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // うんこは10枚追加ダウン
        chipCount -= 10;
        updateChipDisplay();
        showChipEffect(-10);
      }
      
    } else if (combination.includes('ちんこ')) {
      messageBubble.textContent = 'ちん...ちょっと引くわ...';
      setFaceDisplay('naughty');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('ちんこ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // ちんこは5枚追加ダウン
        chipCount -= 5;
        updateChipDisplay();
        showChipEffect(-5);
      }
      
    } else if (combination.includes('うらすじ')) {
      messageBubble.textContent = 'おい、うらすじだって？';
      setFaceDisplay('surprise1');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('うらすじ');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // うらすじは50枚還元
        chipCount += 50;
        updateChipDisplay();
        showChipEffect(50);
      }
      
    } else if (combination.includes('ちりめん')) {
      messageBubble.textContent = 'ちりめん';
      setFaceDisplay('surprise2');
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      updateTriggerAchievement('ちりめん');
      
      // サンコンチャンス中はチップ効果を無効化
      if (!isSankonChanceMode) {
        // ちりめんは30枚還元
        chipCount += 30;
        updateChipDisplay();
        showChipEffect(30);
      }
      
    } else if (combination.includes('さんこん')) {
      messageBubble.textContent = 'イッコンニコンサンコンです！！';
      setFaceDisplay('surprise3');
      updateTriggerAchievement('さんこん');
      
      // サンコンチャンスモード中ではないときのみチップ効果
      if (!isSankonChanceMode) {
        // さんこんは25枚還元
        chipCount += 25;
        updateChipDisplay();
        showChipEffect(25);
        
        // サンコンチャンスモード開始
        startSankonChanceMode();
      } else {
        // サンコンチャンスモード中に再度サンコンが揃った場合
        messageBubble.textContent = 'サンコンチャンス継続！残り5回転追加！';
        sankonChanceSpinsRemaining = 5; // 回転数リセット
      }
      
    } else {
      // ハズレの場合、サンコンチャンスモード中はリプレイ無し
      if (!isSankonChanceMode && Math.random() < 0.1) {
        messageBubble.textContent = 'リプレイ！次回無料で回せます！';
        isReplay = true;
        
        // リプレイ表示
        if (!replayShown) {
          showChipEffect(0, 'replay');
          replayShown = true;
        }
      } else {
        messageBubble.textContent = 'はずれ...もう一回！';
      }
      
      // サンコンチャンスモード中はハズレでも顔をサンコンのままにする
      if (isSankonChanceMode) {
        setFaceDisplay('surprise3');
      } else {
        setFaceDisplay('normal');
      }
      
      // 虹色の縁は削除
      if (!isFeverMode && !isSankonChanceMode) {
        faceDisplay.classList.remove('rainbow-border');
      }
      isNormalResult = true; // 通常結果フラグをオン
    }
    
    // チップが0以下になった場合のゲームオーバー処理
    if (chipCount <= 0) {
      chipCount = 0;
      updateChipDisplay();
      
      // フィーバーモード中でなければゲームオーバー
      if (!isFeverMode) {
        startButton.disabled = true;
        showGameOver();
      }
    }
    
    // 通常以外の結果の場合は待機（ぷんこす以外は0.5秒、ぷんこすは3秒）
    // ぷんこすの場合はcheckResult()内で別途処理されるため、ここではスキップ
    if (!isNormalResult && combination !== 'ぷんこす') {
      // スタートボタンを一時的に無効化して待機を表現
      startButton.disabled = true;
      
      setTimeout(() => {
        // 0.5秒後にスタートボタンを再度有効化（チップがない場合は除く）
        if (chipCount > 0 || isFeverMode || isReplay) {
          startButton.disabled = false;
        }
      }, 500);
    }
  }
  
  // イベントリスナーの設定
  startButton.addEventListener('click', startAll);
  
  stopButtons.forEach(button => {
    const index = parseInt(button.dataset.index);
    button.addEventListener('click', () => {
      if (spinning[index]) {
        stopSpin(index);
      }
    });
  });
  
  // デバッグモード用のイベントリスナー
  const debugTriggers = document.querySelectorAll('.debug-trigger');
  const debugComp = document.getElementById('debug-comp');
  const debugReset = document.getElementById('debug-reset');
  
  // 個別トリガー強制発動
  debugTriggers.forEach(button => {
    button.addEventListener('click', () => {
      const triggerId = button.dataset.trigger;
      updateTriggerAchievement(triggerId);
    });
  });
  
  // 全コンプ
  if (debugComp) {
    debugComp.addEventListener('click', () => {
      Object.keys(triggers).forEach(triggerId => {
        if (!triggers[triggerId].achieved) {
          triggers[triggerId].achieved = true;
          triggers[triggerId].count = 1;
        }
      });
      updateTriggerList();
      updateTriggerCount();
      checkTriggerCompletion();
    });
  }
  
  // リセット
  if (debugReset) {
    debugReset.addEventListener('click', () => {
      Object.keys(triggers).forEach(triggerId => {
        triggers[triggerId].achieved = false;
        triggers[triggerId].count = 0;
      });
      updateTriggerList();
      updateTriggerCount();
      triggerCompMessage.classList.remove('completed');
    });
  }
  
  // チップ追加デバッグボタン
  const debugAddChips = document.getElementById('debug-add-chips');
  if (debugAddChips) {
    debugAddChips.addEventListener('click', () => {
      chipCount += 100;
      updateChipDisplay();
      startButton.disabled = false;
      messageBubble.textContent = '100チップ追加しました！';
    });
  }
  
  // チャンス強制ボタン
  const debugChance = document.getElementById('debug-chance');
  if (debugChance) {
    debugChance.addEventListener('click', () => {
      // チャンスモードフラグを設定
      isChanceMode = true;
      
      // CHANCEランプを点滅させる
      blinkChanceLight();
      
      // 顔表示をチャンスモードに変更
      setFaceDisplay('chance');
      
      // チャンス通知表示（すでに表示されていなければかつフラグがfalseの場合のみ）
      if (!document.querySelector('.chance-notification') && !chanceNotificationShown) {
        showChanceNotification();
      } else {
        // フラグだけセットして演出はスキップ
        chanceNotificationShown = true;
        // 顔画像の縁に虹色エフェクトを追加
        faceDisplay.classList.add('rainbow-border');
      }
      
      // すでにゲームが回転中なら強制的に停止する
      if (gameState === 'spinning') {
        // 全てのリールを強制停止し、結果を「ぷんこす」に設定
        for (let i = 0; i < 4; i++) {
          if (spinning[i]) {
            clearTimeout(timers[i]);
            results[i] = ['ぷ', 'ん', 'こ', 'す'][i];
            reelElements[i].textContent = results[i];
            spinning[i] = false;
            stopButtons[i].disabled = true;
          }
        }
        
        // 結果確認と状態リセット
        gameState = 'idle';
        checkResult();
        startButton.textContent = 'スタート';
        
        // チャンスモードをリセット
        isChanceMode = false;
        chanceNotificationShown = false;
        clearInterval(blinkTimer);
        chanceLamp.classList.remove('active');
      } else {
        // 次回スタート時に必ずぷんこすを揃えるためのメッセージ
        messageBubble.textContent = 'チャンスモード発動！スタートを押してください';
      }
    });
  }
  
  // サンコンチャンスモードデバッグボタン
  const debugSankonChance = document.getElementById('debug-sankon-chance');
  if (debugSankonChance) {
    debugSankonChance.addEventListener('click', () => {
      startSankonChanceMode();
    });
  }
  
  // フィーバーモードデバッグボタン
  const debugFever = document.getElementById('debug-fever');
  if (debugFever) {
    debugFever.addEventListener('click', () => {
      startFeverMode();
    });
  }
  
  // リプレイデバッグボタン
  const debugReplay = document.getElementById('debug-replay');
  if (debugReplay) {
    debugReplay.addEventListener('click', () => {
      isReplay = true;
      showChipEffect(0, 'replay');
      messageBubble.textContent = 'リプレイ有効化！次回無料で回せます！';
    });
  }
});