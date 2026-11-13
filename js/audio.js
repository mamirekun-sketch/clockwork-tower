/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * Web Audio API プロシージャル効果音＆オルゴールBGM（js/audio.js）
 */
(function (root) {
  'use strict';

  var ctx = null;
  var muted = false;
  var bgmEnabled = true;
  var bgmTimer = null;
  var bgmStep = 0;

  // おもちゃ工房風のやさしいオルゴール音階（Cメジャースケール・ワルツ調）
  var BGM_MELODY = [
    523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.00, 698.46,
    523.25, 659.25, 783.99, 1046.50, 987.77, 783.99, 659.25, 587.33,
    440.00, 523.25, 659.25, 523.25, 493.88, 587.33, 783.99, 587.33,
    523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 523.25, 0
  ];

  function ensureContext() {
    if (muted) return null;
    if (!ctx) {
      var AudioCtx = root.AudioContext || root.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function playTone(freq, duration, type, volume, delay, slideTo) {
    var ac = ensureContext();
    if (!ac || muted || !freq) return;
    var start = ac.currentTime + (delay || 0);
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume || 0.15, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playNoise(duration, volume, filterFreq, delay) {
    var ac = ensureContext();
    if (!ac || muted) return;
    var start = ac.currentTime + (delay || 0);
    var sampleCount = Math.floor(ac.sampleRate * duration);
    var buffer = ac.createBuffer(1, sampleCount, ac.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    var src = ac.createBufferSource();
    src.buffer = buffer;
    var filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq || 900, start);
    var gain = ac.createGain();
    gain.gain.setValueAtTime(volume || 0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(start);
  }

  var Audio = {
    unlock: function () {
      ensureContext();
    },

    setMuted: function (isMuted) {
      muted = Boolean(isMuted);
      if (muted) {
        this.stopBgm();
      } else if (bgmEnabled) {
        this.startBgm();
      }
    },

    isMuted: function () {
      return muted;
    },

    setBgmEnabled: function (enabled) {
      bgmEnabled = Boolean(enabled);
      if (!bgmEnabled || muted) {
        this.stopBgm();
      } else {
        this.startBgm();
      }
    },

    isBgmEnabled: function () {
      return bgmEnabled;
    },

    startBgm: function () {
      if (bgmTimer || muted || !bgmEnabled) return;
      bgmTimer = setInterval(function () {
        if (muted || !bgmEnabled || !ctx || ctx.state !== 'running') return;
        var note = BGM_MELODY[bgmStep % BGM_MELODY.length];
        bgmStep++;
        if (note > 0) {
          // 柔らかいオルゴール風の倍音
          playTone(note, 0.38, 'triangle', 0.032, 0);
          playTone(note * 2, 0.2, 'sine', 0.012, 0.01);
        }
        // 4拍ごとの軽いぜんまいカチカチ音
        if (bgmStep % 2 === 0) {
          playTone(180, 0.04, 'sine', 0.018, 0, 110);
        }
      }, 360);
    },

    stopBgm: function () {
      if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
      }
    },

    // UIタップ・パネル書き換え
    playClick: function () {
      playTone(680, 0.07, 'triangle', 0.12, 0, 880);
    },

    playPatch: function () {
      // スパナでカチャッと直す音
      playTone(440, 0.08, 'square', 0.08, 0, 660);
      playTone(880, 0.12, 'triangle', 0.14, 0.06, 1046);
    },

    playWindup: function () {
      // ゼンマイを巻くカリカリ音
      playTone(520, 0.04, 'sawtooth', 0.06, 0, 720);
      playTone(580, 0.04, 'sawtooth', 0.06, 0.06, 780);
      playTone(640, 0.05, 'sawtooth', 0.07, 0.12, 860);
    },

    // アクション効果音
    playMove: function () {
      playTone(260, 0.07, 'triangle', 0.12, 0, 340);
      playTone(190, 0.05, 'sine', 0.08, 0.04, 150);
    },

    playTurn: function () {
      playTone(390, 0.06, 'sine', 0.1, 0, 480);
    },

    playWait: function () {
      playTone(760, 0.04, 'sine', 0.06, 0);
      playTone(580, 0.05, 'sine', 0.05, 0.07);
    },

    playJump: function () {
      // バネのビヨーン音
      playTone(240, 0.24, 'triangle', 0.16, 0, 780);
      playTone(320, 0.16, 'sine', 0.1, 0.04, 920);
    },

    playStun: function () {
      // 頭ゴツン＋ピヨピヨ
      playNoise(0.1, 0.18, 420, 0);
      playTone(880, 0.12, 'sine', 0.1, 0.08, 1200);
      playTone(1200, 0.12, 'sine', 0.1, 0.18, 880);
    },

    playDrillBreak: function () {
      playNoise(0.22, 0.22, 1200, 0);
      playTone(150, 0.18, 'sawtooth', 0.12, 0, 90);
    },

    playDrillWhiff: function () {
      playTone(220, 0.16, 'sawtooth', 0.08, 0, 140);
    },

    playTurbo: function () {
      playTone(320, 0.22, 'sawtooth', 0.11, 0, 980);
      playNoise(0.18, 0.1, 2200, 0.02);
    },

    playMagnet: function () {
      playTone(330, 0.2, 'sine', 0.12, 0, 660);
      playTone(495, 0.2, 'triangle', 0.09, 0.05, 990);
    },

    playGear: function () {
      // 黄金ギア獲得のキラキラ音
      playTone(880, 0.12, 'triangle', 0.15, 0);
      playTone(1174.66, 0.14, 'triangle', 0.15, 0.07);
      playTone(1567.98, 0.28, 'sine', 0.18, 0.14);
    },

    playWarp: function () {
      playTone(400, 0.18, 'sine', 0.14, 0, 1200);
      playTone(1200, 0.18, 'sine', 0.12, 0.1, 500);
    },

    playConveyor: function () {
      playTone(210, 0.09, 'square', 0.05, 0, 260);
    },

    // コミカルな失敗音（穴落ち・激突・ゼンマイ飛び出し）
    playFail: function (errorType) {
      if (errorType === 'hole') {
        playTone(620, 0.42, 'sine', 0.16, 0, 130);
        playTone(440, 0.15, 'triangle', 0.1, 0.38, 220);
      } else if (errorType === 'wall' || errorType === 'spike') {
        playNoise(0.18, 0.25, 500, 0);
        playTone(180, 0.2, 'sawtooth', 0.14, 0, 75);
        playTone(540, 0.15, 'triangle', 0.1, 0.14, 240);
      } else {
        // ゼンマイ切れ：プシュ〜
        playTone(440, 0.15, 'triangle', 0.12, 0, 320);
        playTone(320, 0.2, 'triangle', 0.12, 0.15, 220);
        playTone(220, 0.25, 'sine', 0.1, 0.35, 130);
      }
    },

    playClear: function (isSRank) {
      var notes = isSRank
        ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
        : [523.25, 659.25, 783.99, 1046.50];
      for (var i = 0; i < notes.length; i++) {
        playTone(notes[i], i === notes.length - 1 ? 0.55 : 0.16, 'triangle', 0.16, i * 0.09);
      }
      if (isSRank) {
        playTone(1046.50, 0.6, 'sine', 0.12, 0.45);
      }
    }
  };

  root.BugSweeper = root.BugSweeper || {};
  root.BugSweeper.Audio = Audio;
})(typeof window !== 'undefined' ? window : globalThis);
