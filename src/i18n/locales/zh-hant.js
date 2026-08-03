export const ZH_HANT = Object.freeze({
  meta: {
    htmlLang: "zh-Hant",
    title: "Voice Arcana｜聽見你的聲音肖像",
    description:
      "Voice Arcana：在瀏覽器本機分析一分鐘聲音，生成一張原創聲音牌與六軸聲音肖像。",
  },
  header: {
    brandAria: "Voice Arcana 首頁",
    subtitle: "聲音肖像",
    context: "聲音肖像牌探索",
    langSwitch: "English",
    langSwitchAria: "Switch to English",
  },
  hero: {
    eyebrow: "VOICE ARCANA · 聲音肖像",
    titleLine1: "讓你的聲音，",
    titleLine2: "成為一張牌。",
    lead: "朗讀一段短文。我們會直接在瀏覽器裡描繪聲音的明暗、質地與能量，找出此刻與你共鳴的聲音牌。",
    privacy: "錄音與分析都只發生在這台裝置，不會上傳。",
    deckAria: "八種原創聲音牌",
    deckTitle: "八種聲音原型",
    deckHint: "這一分鐘，會翻出哪一張牌？",
  },
  reading: {
    eyebrow: "今日朗讀・約一分鐘",
    sectionTitle: "讀出一段關於美的片刻",
    topic: "裝飾藝術",
    duration: "建議 50–60 秒",
    title: "〈讓幾何學會發光〉",
    paragraphs: [
      "一九二〇年代的城市，用直線、扇形與金色描畫未來。建築和海報把古老秩序與機械速度放在一起。對稱安定視線，向上的輪廓像城市起飛；一扇門、一盞燈，也帶著舞台般的光。",
      "夜色落下，車站亮起層層線條，玻璃映著銅色，石材托住節奏。裝飾藝術相信，日常值得安排：線條引導腳步，色彩改變呼吸，幾何讓人找到方向。美不再遙遠，藏在停留與抬頭之間。",
    ],
  },
  recorder: {
    panelAria: "錄音控制",
    recording: "錄音中",
    done: "錄音完成",
    start: "開始錄音",
    stop: "結束錄音",
    requesting: "正在開啟麥克風…",
    validating: "正在確認錄音…",
    retake: "重新錄製",
    submit: "送出並描繪聲音",
    levelQuiet: "輕聲",
    levelFull: "飽滿",
    levelWaiting: "等待聲音",
    levelSoft: "聲音偏輕",
    levelClear: "聲音清楚",
    levelStrong: "聲音飽滿",
    playPlayback: "播放錄音",
    pausePlayback: "暫停錄音",
    seekPlayback: "調整播放進度",
    mutePlayback: "靜音",
    unmutePlayback: "恢復聲音",
    playbackError: "這段錄音無法在此瀏覽器試聽，請重新錄製或改用最新版瀏覽器。",
    lowSignalWarning: "錄音訊號偏小。你仍可繼續分析，或靠近麥克風後重新錄製。",
  },
  errors: {
    noRecordingData: "沒有收到有效的錄音資料，請檢查麥克風後重新錄製。",
    tooShort: "請至少錄製 {seconds} 秒，讓聲音肖像有足夠線索。",
    decodeFailed: "這段錄音無法讀取，請重新錄製或改用最新版瀏覽器。",
    silentRecording: "這段錄音沒有可用的聲音資料，請檢查麥克風後重新錄製。",
    analysisFailed: "這段錄音暫時無法分析，請重新錄製後再試一次。",
    unsupportedBrowser:
      "這個瀏覽器不支援網頁錄音，請改用最新版 Chrome、Edge、Firefox 或 Safari。",
    micDenied: "麥克風權限尚未開啟。請允許此網站使用麥克風後再試一次。",
    micNotFound: "找不到可使用的麥克風，請確認裝置已連接。",
    micFailed: "無法啟動麥克風，請檢查瀏覽器權限與裝置設定。",
  },
  processing: {
    eyebrow: "LOCAL AUDIO ANALYSIS",
    title: "正在聆聽聲音的形狀",
    preparing: "正在準備本機分析",
    progressAria: "聲音分析進度",
    privacy: "聲音不會離開這台裝置",
    steps: ["波形", "音色", "聲音牌"],
    stages: {
      decode: "正在拆解聲音的光譜",
      temporal: "正在辨認聲音與停頓",
      spectral: "正在閱讀音色的明暗",
      pitch: "正在追蹤音高的輪廓",
      axes: "正在比對節奏與能量",
      portrait: "正在描繪六個聲音維度",
      matching: "正在尋找與你共鳴的聲音牌",
      done: "聲音肖像已完成",
    },
  },
  result: {
    localSeal: "你的聲音沒有離開這台裝置",
    eyebrow: "VOICE ARCANA · SOUND CARD {number}",
    titlePrefix: "你的聲音牌：",
    portraitTitle: "聲音肖像",
    questionLabel: "給你的提問",
    retake: "再錄一次",
    tryMine: "換我測測看",
    preparingImage: "正在準備圖片",
    share: "分享結果",
    imageFailed: "無法產生圖片",
    imageFailedStatus: "分享圖片產生失敗，請稍後再試。",
    overlayAria: "結果分享圖",
    overlayImageAlt: "聲音牌結果分享圖：{name}",
    overlayHint: "長按（電腦按右鍵）儲存圖片，貼到限時動態或聊天室。",
    close: "關閉",
    axisRangeAria: "{low}到{high}",
  },
  resultImage: {
    banner: "VOICE ARCANA · YOUR SOUND PORTRAIT",
    soundCard: "SOUND CARD {number}",
    yourCard: "你的聲音牌",
    portraitTitle: "聲音肖像",
    questionLabel: "給你的提問",
    cta: "你也來測你的聲音牌",
    blobFailed: "分享圖片產生失敗，請稍後再試。",
    cannotCreate: "此瀏覽器無法建立分享圖片。",
  },
  sharePage: {
    title: "我的聲音牌是「{name}」｜Voice Arcana",
    description:
      "{tagline}。錄一段聲音，看看你會翻出哪一張聲音牌——分析只在你的裝置上進行。",
    opening: "正在開啟你的聲音牌…",
    goto: "前往 Voice Arcana",
  },
  axes: {
    brightness: { low: "低沉", high: "明亮", description: "音色明暗" },
    sharpness: { low: "柔和", high: "銳利", description: "高頻輪廓" },
    bounce: { low: "沉穩", high: "跳躍", description: "節奏起伏" },
    openness: { low: "親密", high: "開闊", description: "空間感" },
    raspiness: { low: "乾淨", high: "沙啞", description: "聲帶質地" },
    energy: { low: "平靜", high: "充滿能量", description: "整體動能" },
  },
  cards: {
    "blank-keeper": {
      name: "留白者",
      tagline: "讓沉默保有它的形狀",
      reading:
        "你的聲音懂得退後一步，讓意義在停頓之間浮現。你不急著填滿空間，因此細小的情緒反而更容易被聽見。",
      question: "如果不必立刻回答，你真正想留下的是什麼？",
      profile:
        "屬於留白者的聲音，多半安靜而節制：音色沉在低處，句子與句子之間留著呼吸，不急著把空間填滿。這樣的聲音讓停頓也成為內容的一部分——聽的人會在那些空隙裡，聽見還沒說出口的部分。留白者回應的正是這種節制：它相信沉默有自己的形狀，等待也是一種表達。",
      artAlt: "人物站在空門與消退的聲波之間，雙手托住一段留白",
    },
    "fire-starter": {
      name: "點火者",
      tagline: "把第一束光交給世界",
      reading:
        "你的聲音帶著推進的熱度，能把模糊的想法點亮。當你相信一件事，節奏會先於語句抵達他人。",
      question: "此刻最值得你先踏出一步的是哪件事？",
      profile:
        "與點火者共鳴的聲音，通常亮而有推力：音色靠前、節奏帶著起伏，整段朗讀從頭到尾維持著向前的動能。這樣的聲音天生會點亮句子——往往還沒說完，注意力已經聚集過來。點火者呼應的就是這股熱度：把第一束光交給世界的，往往正是這樣的聲音。",
      artAlt: "人物高舉火光，放射線與星火向上展開",
    },
    listener: {
      name: "傾聽者",
      tagline: "在靠近以前，先聽見",
      reading:
        "你的聲音不搶奪注意，而是建立容納感。柔和與穩定讓人願意把尚未整理好的心情交給你。",
      question: "你是否也把同樣的耐心留給自己？",
      profile:
        "屬於傾聽者的聲音溫和而穩定：音量收斂、輪廓柔軟，幾乎不與任何人搶奪空間。這樣的聲音建立的是容納感——它讓對面的人放心地把還沒整理好的心情放進來。傾聽者回應的正是這種質地：在靠近以前先聽見，本身就是一種少見的能力。",
      artAlt: "人物懷抱螺旋聲音容器，聲波向中心聚合",
    },
    traveler: {
      name: "旅行者",
      tagline: "用聲音測量未知的遠方",
      reading:
        "你的聲音有明顯的移動感，語句像沿著地平線尋路。變化不是不安，而是你理解世界的方法。",
      question: "下一段旅程，你想帶走什麼，又願意放下什麼？",
      profile:
        "與旅行者共鳴的聲音有明顯的移動感：語調起伏鮮明、動態開闊，句子像沿著地平線一路往前探。這樣的聲音不安於停在原地，變化是它理解世界的方式。旅行者呼應的正是這種移動——用聲音測量未知的遠方。",
      artAlt: "人物穿越層疊拱門，沿著路徑走向遠方星光",
    },
    "dream-builder": {
      name: "築夢者",
      tagline: "為還不存在的事搭一座橋",
      reading:
        "你的聲音同時保有想像與秩序。明亮的輪廓讓願景可見，而溫和的推進讓它不只停在夢裡。",
      question: "哪一個反覆出現的念頭，正在等待你為它命名？",
      profile:
        "屬於築夢者的聲音明亮而乾淨，卻不張揚：它有清楚的輪廓，也有溫和的推進，像把想像一層層搭成看得見的結構。這樣的聲音同時保有秩序與願景——同一件事由它說出來，聽起來就多了一分可能成真的樣子。築夢者回應的正是這種質地：為還不存在的事，搭一座橋。",
      artAlt: "人物將幾何拱門與階梯組成一座夢境建築",
    },
    "night-keeper": {
      name: "守夜人",
      tagline: "在安靜裡，聽見尚未說完的事",
      reading:
        "你的聲音帶著夜色般的重量，不炫目，卻能陪伴。你擅長守住混亂中的微光，直到事情顯出真正的輪廓。",
      question: "有什麼需要被守護，而不是立刻被解決？",
      profile:
        "屬於守夜人的聲音低而沉靜，質地帶著一點被時間磨過的紋理。它不炫目，卻有陪伴的重量——像深夜裡壓低的交談，讓重要的話顯得更重。守夜人回應的正是這種沉穩：守住混亂中的微光，直到事情顯出真正的輪廓。",
      artAlt: "守護人物捧著微光，身後展開同心聲波與夜色拱門",
    },
    "echo-bearer": {
      name: "迴響者",
      tagline: "讓一句話走得比當下更遠",
      reading:
        "你的聲音富有空間與餘韻，容易在他人心裡留下第二次發生。你說出的不只是內容，也是一種可被記住的氣候。",
      question: "你希望今天的哪句話，在未來仍被聽見？",
      profile:
        "與迴響者共鳴的聲音自帶空間感：它不急著抵達，字句之間留有餘韻，質地裡帶著一絲讓人回頭的沙啞。這樣的聲音容易在別人心裡發生第二次——說過的話，過一陣子仍會被想起。迴響者呼應的正是這種餘韻：讓一句話走得比當下更遠。",
      artAlt: "人物與半透明迴聲並肩，懷抱一只中空圓環",
    },
    "wave-breaker": {
      name: "破浪者",
      tagline: "把阻力變成前進的節拍",
      reading:
        "你的聲音有清楚的稜角與動能，像船首切開水面。它不迴避摩擦，反而能在阻力中形成方向。",
      question: "哪一道浪，正邀請你證明自己的力量？",
      profile:
        "屬於破浪者的聲音有清楚的稜角：咬字銳利、質地帶勁，整段聲音像船首切開水面般帶著動能。它不迴避摩擦，反而在阻力裡找到自己的節拍。破浪者回應的就是這股力量——把阻力變成前進的節奏。",
      artAlt: "人物穿過左右分開的聲浪，向光線升起的方向前進",
    },
  },
  cardArt: {
    fallbackAlt: "以聲波與幾何人物構成的裝飾藝術牌面",
    altTemplate: "{name}聲音牌：{artAlt}",
  },
});
