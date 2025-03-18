document.addEventListener('DOMContentLoaded', () => {
  // スロットの回転文字定義
  const reels = [
    ['ぷ', 'う', 'ち', 'さ'],
    ['ん', 'ら', 'う', 'り'],
    ['こ', 'め', 'ど', 'す'],
    ['す', 'じ', 'う', 'ん']
  ];
  
  // DOM要素の取得
  const reelElements = Array.from({ length: 4 }, (_, i) => document.getElementById(`reel${i}`));
  const stopButtons = document.querySelectorAll('.stop-button');
  const startButton = document.getElementById('start-button');
  const faceDisplay = document.getElementById('face-display');
  const messageBubble = document.getElementById('message');
  const chanceLamp = document.getElementById('chance-lamp');
  
  // 状態管理
  let results = ['', '', '', ''];
  let spinning = [false, false, false, false];
  let isChanceMode = false;
  let timers = [null, null, null, null];
  let blinkTimer = null;
  
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
        checkResult();
        if (isChanceMode) {
          isChanceMode = false;
          clearInterval(blinkTimer);
          chanceLamp.classList.remove('active');
        }
      }
    }
  }
  
  // 全てのリールを回転開始
  function startAll() {
    // 状態をリセット
    results = ['', '', '', ''];
    messageBubble.textContent = '回転中...';
    faceDisplay.textContent = '😐';
    faceDisplay.style.backgroundImage = 'none';
    
    // チャンスモードの抽選 (1/10の確率に一時的に変更)
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
    
    startButton.disabled = true;
  }
  
  // チャンスライトの点滅
  function blinkChanceLight() {
    chanceLamp.classList.add('active');
    blinkTimer = setInterval(() => {
      chanceLamp.classList.toggle('active');
    }, 500);
  }
  
  // 結果チェック
  function checkResult() {
    const combination = results.join('');
    
    if (combination === 'ぷんこす') {
      messageBubble.textContent = '大当たり！！ ぷんこす完成！';
      faceDisplay.textContent = '😆';
    } else if (combination.startsWith('ぷんこ') && !combination.endsWith('す')) {
      messageBubble.textContent = 'おしい！ あと一歩！';
      faceDisplay.textContent = '😔';
    } else if (combination.includes('うんこ') || combination.includes('うんご')) {
      messageBubble.textContent = 'うーん...ちょっと臭いかも';
      faceDisplay.textContent = '🤢';
    } else if (combination.includes('ちんこ') || combination.includes('ちん')) {
      messageBubble.textContent = '恥ずかしいね...';
      faceDisplay.textContent = '😏';
    } else {
      messageBubble.textContent = 'はずれ...もう一回！';
      faceDisplay.textContent = '😐';
    }
    
    startButton.disabled = false;
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
});