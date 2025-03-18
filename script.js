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
    'surprise3': '🎉'   // さんこん
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
  
  // 状態管理
  let results = ['', '', '', ''];
  let spinning = [false, false, false, false];
  let isChanceMode = false;
  let timers = [null, null, null, null];
  let blinkTimer = null;
  let gameState = 'idle'; // 'idle', 'spinning'
  
  // 初期化: トリガーリストの表示
  updateTriggerList();
  updateTriggerCount();
  
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
        if (isChanceMode) {
          isChanceMode = false;
          clearInterval(blinkTimer);
          chanceLamp.classList.remove('active');
        }
        startButton.textContent = 'スタート';
      }
    }
  }
  
  // 全てのリールを回転開始
  function startAll() {
    // 回転中であれば停止操作に変更
    if (gameState === 'spinning') {
      handleStopAction();
      return;
    }
    
    // 新しいゲーム開始
    gameState = 'spinning';
    startButton.textContent = '停止';
    
    // 状態をリセット
    results = ['', '', '', ''];
    messageBubble.textContent = '回転中...';
    setFaceDisplay('normal');
    
    // チャンスモードの抽選 (1/200の確率)
    isChanceMode = Math.random() < 1/200;
    
    if (isChanceMode) {
      blinkChanceLight();
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
    //faceDisplay.textContent = faceEmojis[type];
    //faceDisplay.style.backgroundImage = 'none';
    
    // 将来的に画像が準備できたらこのコメントを外す
    faceDisplay.textContent = '';
    faceDisplay.style.backgroundImage = `url(assets/${type}.png)`;
  }
  
  // チャンスライトの点滅
  function blinkChanceLight() {
    chanceLamp.classList.add('active');
    blinkTimer = setInterval(() => {
      chanceLamp.classList.toggle('active');
    }, 500);
  }
  
  // トリガーの達成状況を更新
  function updateTriggerAchievement(triggerId) {
    if (triggers[triggerId]) {
      // カウント増加
      triggers[triggerId].count++;
      
      // 初回達成の場合
      if (!triggers[triggerId].achieved) {
        triggers[triggerId].achieved = true;
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
      <span class="notification-text">新しいトリガー獲得！</span>
    `;
    document.body.appendChild(notification);
    
    // アニメーション後に削除
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 2000);
    }, 100);
  }
  
  // トリガーリストの表示を更新
  // トリガーリストの表示を更新
// script.js に追加するコード

// トリガーリストの表示を更新（拡大表示機能つき）
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
// 拡大画像表示（トリガー名なし）
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
  
  // コンプリート達成時のお祝い演出（画像版）
function showCompletionCelebration() {
  const celebration = document.createElement('div');
  celebration.className = 'completion-celebration';
  
  // 目立つ表示
  const content = document.createElement('div');
  content.className = 'celebration-content';
  
  // すべてのトリガー画像を表示
  const imagesContainer = document.createElement('div');
  imagesContainer.className = 'celebration-emojis';
  
  // すべてのトリガーを画像で表示
  Object.entries(triggers).forEach(([key, trigger]) => {
    const imageType = getTriggerImageType(key);
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
}
  
  // 結果チェック
  function checkResult() {
    const combination = results.join('');
    
    if (combination === 'ぷんこす') {
      messageBubble.textContent = '大当たり！！ ぷんこす完成！';
      setFaceDisplay('win');
      updateTriggerAchievement('ぷんこす');
    } else if (combination.startsWith('ぷんこ') && !combination.endsWith('す')) {
      messageBubble.textContent = 'おしい！ あと一歩！';
      setFaceDisplay('close');
      updateTriggerAchievement('ぷんこ');
    } else if (combination.includes('うんこ')) {
      messageBubble.textContent = 'うーん...ちょっと臭いかも';
      setFaceDisplay('stinky');
      updateTriggerAchievement('うんこ');
    } else if (combination.includes('ちんこ') || combination.includes('ちん')) {
      messageBubble.textContent = '恥ずかしいね...';
      setFaceDisplay('naughty');
      updateTriggerAchievement('ちんこ');
    } else if (combination.includes('うらすじ')) {
      messageBubble.textContent = 'うらすじって...';
      setFaceDisplay('surprise1');
      updateTriggerAchievement('うらすじ');
    } else if (combination.includes('ちりめん')) {
      messageBubble.textContent = 'ちりめん';
      setFaceDisplay('surprise2');
      updateTriggerAchievement('ちりめん');
    } else if (combination.includes('さんこん')) {
      messageBubble.textContent = 'サンコン';
      setFaceDisplay('surprise3');
      updateTriggerAchievement('さんこん');
    } else {
      messageBubble.textContent = 'はずれ...もう一回！';
      setFaceDisplay('normal');
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
  
  // リセット
  debugReset.addEventListener('click', () => {
    Object.keys(triggers).forEach(triggerId => {
      triggers[triggerId].achieved = false;
      triggers[triggerId].count = 0;
    });
    updateTriggerList();
    updateTriggerCount();
    triggerCompMessage.classList.remove('completed');
  });
});