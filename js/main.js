/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * アプリケーション統合コントローラー（js/main.js）
 */
(function (root) {
  'use strict';

  var BS = root.BugSweeper = root.BugSweeper || {};

  var state = {
    screen: 'title', // 'title' | 'tower' | 'game'
    savesData: null,
    currentWorld: 1,
    currentStage: null,
    patches: {}, // nodeId: newValue（単一・複数デバッグ両対応）
    customAst: null, // 自由ビルド／ゼロからつくるモード時の編集済みAST
    scratchMode: false, // true のとき空プログラムから自分で組み立てる
    workingProgram: null,
    playMode: 'idle', // 'idle' | 'playing' | 'paused_step' | 'cleared' | 'failed'
    speed: 1, // 1 or 2
    simResult: null,
    traceIndex: -1,
    animState: {
      x: 0,
      y: 0,
      fromX: 0,
      fromY: 0,
      dir: 1,
      grid: [],
      gearCollected: false,
      emotion: 'normal',
      animProgress: 1,
      executingNodeId: null,
      errorNodeId: null
    },
    stepTimer: null,
    lastRafTime: 0,
    globalTime: 0,
    renderer: null,
    editingNode: null,
    insertTarget: null,
    pendingNameMode: null, // 'add' | 'rename'
    pendingSlotIndex: -1
  };

  function getActiveSave() {
    var d = state.savesData;
    return d.slots[d.activeSlot] || d.slots[0];
  }

  function saveNow() {
    BS.UI.persistAllSaves(state.savesData);
  }

  function getAllStages() {
    var list = [];
    if (Array.isArray(BS.Stages)) {
      list = BS.Stages.slice().sort(function (a, b) { return a.id - b.id; });
    }
    return list;
  }

  function getStageById(id) {
    var all = getAllStages();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  /**
   * 現在のステージ＋セーブデータに基づく装着パーツ配列を返す
   */
  function getDisplayPartsForStage(stage) {
    var save = getActiveSave();
    var set = new Set(save.parts || []);
    if (stage && Array.isArray(stage.availableParts)) {
      for (var i = 0; i < stage.availableParts.length; i++) {
        set.add(stage.availableParts[i]);
      }
    }
    return Array.from(set);
  }

  function showScreen(name) {
    state.screen = name;
    var screens = ['title', 'tower', 'game'];
    screens.forEach(function (s) {
      var el = document.getElementById('screen-' + s);
      if (el) el.classList.toggle('is-active', s === name);
    });
    if (name === 'title') {
      renderTitleScreen();
    } else if (name === 'tower') {
      renderTowerScreen();
    }
  }

  /* =========================================================
   * タイトル画面 & プレイヤー（セーブデータ）管理
   * ========================================================= */
  function renderTitleScreen() {
    var container = document.getElementById('save-slots-list');
    if (!container) return;
    container.innerHTML = '';
    var d = state.savesData;
    for (var i = 0; i < d.slots.length; i++) {
      var slot = d.slots[i];
      var clearCount = Object.keys(slot.results || {}).length;
      var gearCount = 0;
      Object.keys(slot.results || {}).forEach(function (k) {
        if (slot.results[k].gear) gearCount++;
      });

      var card = document.createElement('div');
      card.className = 'save-slot-card' + (d.activeSlot === i ? ' is-selected' : '');

      var mainBtn = document.createElement('button');
      mainBtn.type = 'button';
      mainBtn.className = 'slot-select-main';
      mainBtn.innerHTML =
        '<div class="slot-title"></div>' +
        '<div class="slot-stats">★ クリア: ' + clearCount + '/100　⚙ ギア: ' + gearCount + '</div>';
      mainBtn.querySelector('.slot-title').textContent = slot.name;

      var actionsDiv = document.createElement('div');
      actionsDiv.className = 'slot-actions';

      var renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'slot-icon-btn';
      renameBtn.title = 'なまえを かえる';
      renameBtn.textContent = '✏️';

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'slot-icon-btn is-del';
      delBtn.title = 'セーブを けす';
      delBtn.textContent = '🗑';

      (function (idx) {
        mainBtn.addEventListener('click', function () {
          BS.Audio.unlock();
          BS.Audio.playClick();
          state.savesData.activeSlot = idx;
          saveNow();
          renderTitleScreen();
        });
        renameBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          BS.Audio.unlock();
          BS.Audio.playClick();
          openPlayerNameModal('rename', idx);
        });
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          BS.Audio.unlock();
          BS.Audio.playClick();
          openDeleteSaveModal(idx);
        });
      })(i);

      actionsDiv.appendChild(renameBtn);
      actionsDiv.appendChild(delBtn);
      card.appendChild(mainBtn);
      card.appendChild(actionsDiv);
      container.appendChild(card);
    }

    var addBtn = document.getElementById('btn-add-player');
    if (addBtn) {
      addBtn.disabled = d.slots.length >= BS.UI.MAX_SLOTS;
      addBtn.textContent = d.slots.length >= BS.UI.MAX_SLOTS
        ? 'プレイヤー上限 (' + BS.UI.MAX_SLOTS + '人)'
        : '＋ プレイヤーをふやす';
    }
    updateAudioButtons();
  }

  function openPlayerNameModal(mode, slotIdx) {
    state.pendingNameMode = mode;
    state.pendingSlotIndex = slotIdx;
    var modal = document.getElementById('player-name-modal');
    var titleEl = document.getElementById('player-name-modal-title');
    var inputEl = document.getElementById('player-name-input');
    if (mode === 'add') {
      titleEl.textContent = 'あたらしい プレイヤーを つくる';
      inputEl.value = 'プレイヤー ' + (state.savesData.slots.length + 1);
    } else {
      var target = state.savesData.slots[slotIdx];
      titleEl.textContent = 'プレイヤーの なまえを かえる';
      inputEl.value = target ? target.name : '';
    }
    modal.classList.add('is-open');
    setTimeout(function () {
      inputEl.focus();
      inputEl.select();
    }, 40);
  }

  function closePlayerNameModal() {
    var modal = document.getElementById('player-name-modal');
    if (modal) modal.classList.remove('is-open');
    state.pendingNameMode = null;
    state.pendingSlotIndex = -1;
  }

  function confirmPlayerNameModal() {
    var inputEl = document.getElementById('player-name-input');
    var raw = (inputEl ? inputEl.value : '').trim();
    if (!raw) return;
    BS.Audio.playPatch();
    if (state.pendingNameMode === 'add') {
      BS.UI.addPlayerSlot(state.savesData, raw);
    } else if (state.pendingNameMode === 'rename') {
      BS.UI.renamePlayerSlot(state.savesData, state.pendingSlotIndex, raw);
    }
    closePlayerNameModal();
    renderTitleScreen();
  }

  function openDeleteSaveModal(slotIdx) {
    state.pendingSlotIndex = slotIdx;
    var target = state.savesData.slots[slotIdx];
    if (!target) return;
    var clearCount = Object.keys(target.results || {}).length;
    var isLast = state.savesData.slots.length <= 1;
    var descEl = document.getElementById('delete-save-desc');
    descEl.textContent = isLast
      ? '「' + target.name + '」（クリア ' + clearCount + '/100）の きろくを リセットして さいしょからにします。もとに もどせません！'
      : '「' + target.name + '」（クリア ' + clearCount + '/100）の セーブデータを さくじょします。もとに もどせません！';
    document.getElementById('delete-save-modal').classList.add('is-open');
  }

  function closeDeleteSaveModal() {
    var modal = document.getElementById('delete-save-modal');
    if (modal) modal.classList.remove('is-open');
    state.pendingSlotIndex = -1;
  }

  function confirmDeleteSaveModal() {
    if (state.pendingSlotIndex < 0) return;
    BS.Audio.playFail('wall');
    BS.UI.deletePlayerSlot(state.savesData, state.pendingSlotIndex);
    closeDeleteSaveModal();
    renderTitleScreen();
  }

  /* =========================================================
   * タワーマップ画面（全10階層・100面）
   * ========================================================= */
  function renderTowerScreen() {
    var Engine = BS.Engine;
    var save = getActiveSave();
    var allStages = getAllStages();

    // サマリー更新
    var clearCount = 0;
    var gearCount = 0;
    Object.keys(save.results || {}).forEach(function (id) {
      clearCount++;
      if (save.results[id].gear) gearCount++;
    });
    var summaryEl = document.getElementById('tower-summary');
    if (summaryEl) {
      summaryEl.textContent = save.name + ' ｜ クリア: ' + clearCount + '/100 ｜ 黄金ギア: ' + gearCount + '/100';
    }

    var unlockAllBtn = document.getElementById('btn-toggle-unlock-all');
    if (unlockAllBtn) {
      unlockAllBtn.textContent = save.unlockAllMode ? '全ステージかいほう中 (ON)' : '全ステージかいほう (OFF)';
      unlockAllBtn.classList.toggle('is-on', Boolean(save.unlockAllMode));
    }

    // 階層タブ
    var tabsEl = document.getElementById('world-tabs');
    tabsEl.innerHTML = '';
    for (var w = 1; w <= 10; w++) {
      var theme = Engine.WORLD_THEMES[w - 1];
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'world-tab' + (state.currentWorld === w ? ' is-active' : '');
      tab.style.borderColor = theme.accent;
      if (state.currentWorld === w) {
        tab.style.background = theme.accent;
        tab.style.color = '#ffffff';
      }
      tab.innerHTML = '<span class="wt-num">W' + w + '</span>';
      (function (worldNum) {
        tab.addEventListener('click', function () {
          BS.Audio.playClick();
          state.currentWorld = worldNum;
          renderTowerScreen();
        });
      })(w);
      tabsEl.appendChild(tab);
    }

    var curTheme = Engine.WORLD_THEMES[state.currentWorld - 1];
    document.getElementById('world-banner-title').textContent = curTheme.name;
    document.getElementById('world-banner-sub').textContent = curTheme.subtitle;
    document.getElementById('world-banner').style.borderLeftColor = curTheme.accent;

    var gridEl = document.getElementById('stage-select-grid');
    gridEl.innerHTML = '';
    var worldStages = allStages.filter(function (s) { return s.world === state.currentWorld; });
    if (worldStages.length === 0) {
      gridEl.innerHTML = '<div class="empty-msg">この階層のステージデータは準備中だよ！</div>';
      return;
    }

    worldStages.forEach(function (st) {
      var res = save.results[st.id];
      var isUnlocked = save.unlockAllMode || st.id <= (save.unlockedStage || 1);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stage-tile' +
        (isUnlocked ? ' is-unlocked' : ' is-locked') +
        (res ? ' is-cleared' : '') +
        (res && res.rank === 'S' ? ' is-s-rank' : '');
      btn.disabled = !isUnlocked;

      var roleLabel = st.role === 'intro' ? 'きほん' : (st.role === 'multi' ? 'べつかい' : (st.role === 'hack' ? '神ハック' : 'ボス試験'));
      var rankHtml = res
        ? (res.rank === 'S' ? '<span class="st-rank rank-s">S ⚙</span>' : '<span class="st-rank rank-a">A ★</span>')
        : (isUnlocked ? '<span class="st-rank rank-new">挑戦</span>' : '<span class="st-rank rank-lock">🔒</span>');

      btn.innerHTML =
        '<div class="st-top"><span class="st-num">STAGE ' + st.id + '</span>' + rankHtml + '</div>' +
        '<div class="st-title">' + st.title + '</div>' +
        '<div class="st-role">' + roleLabel + '</div>';

      btn.addEventListener('click', function () {
        BS.Audio.playClick();
        startStage(st.id);
      });
      gridEl.appendChild(btn);
    });
  }

  /* =========================================================
   * ゲーム画面初期化＆実行制御
   * ========================================================= */
  function getEffectiveEditRule() {
    if (!state.currentStage) {
      return { mode: 'single', maxEdits: 1, allowBuild: false, label: '1てデバッグ' };
    }
    var rule = BS.Engine.getStageProgrammingRule(state.currentStage);
    if (state.scratchMode) {
      return { mode: 'free', maxEdits: Infinity, allowBuild: true, label: 'ゼロからビルド' };
    }
    return rule;
  }

  function startStage(stageId) {
    var stage = getStageById(stageId);
    if (!stage) return;
    stopPlayback();

    state.currentStage = stage;
    state.currentWorld = stage.world;
    state.patches = {};
    state.customAst = null;
    state.scratchMode = false;
    rebuildWorkingProgram();
    resetSimulationToStart();
    showScreen('game');
    updateGameHeader();
    renderProgramArea();
    updateControlButtons();
    setSpeechBubble(stage.hint || '「▶ うごかす」をおして バグを かんさつしよう！', 'info');
  }

  function rebuildWorkingProgram() {
    var Engine = BS.Engine;
    if (state.scratchMode || state.customAst !== null) {
      state.workingProgram = Engine.assignNodeIds(Engine.deepClone(state.customAst || []));
      return;
    }
    var prog = Engine.assignNodeIds(Engine.deepClone(state.currentStage.program));
    prog = Engine.applyPatches(prog, state.patches);
    state.workingProgram = prog;
  }

  function toggleScratchMode() {
    if (state.playMode === 'playing' || !state.currentStage) return;
    BS.Audio.playClick();
    state.scratchMode = !state.scratchMode;
    state.patches = {};
    state.customAst = state.scratchMode ? [] : null;
    rebuildWorkingProgram();
    resetSimulationToStart();
    updateGameHeader();
    renderProgramArea();
    updateControlButtons();
    if (state.scratchMode) {
      setSpeechBubble('ゼロから じぶんだけの プログラムを くみたてよう！', 'info');
    } else {
      setSpeechBubble('もとの バグプログラムに もどしたよ！', 'info');
    }
  }

  function resetSimulationToStart() {
    stopPlayback();
    var st = state.currentStage;
    state.playMode = 'idle';
    state.simResult = null;
    state.traceIndex = -1;
    state.animState = {
      x: st.start.x,
      y: st.start.y,
      fromX: st.start.x,
      fromY: st.start.y,
      dir: st.start.dir,
      grid: st.map.slice(),
      gearCollected: st.gear && st.gear.x === st.start.x && st.gear.y === st.start.y,
      emotion: 'normal',
      animProgress: 1,
      executingNodeId: null,
      errorNodeId: null
    };
    if (state.renderer) {
      state.renderer.particles = [];
    }
    clearTraceBeam();
    renderProgramArea();
    updateControlButtons();
  }

  function stopPlayback() {
    if (state.stepTimer) {
      clearTimeout(state.stepTimer);
      state.stepTimer = null;
    }
  }

  function clearTraceBeam() {
    var svg = document.getElementById('trace-beam-svg');
    if (svg) svg.innerHTML = '';
  }

  function updateGameHeader() {
    var st = state.currentStage;
    var theme = BS.Engine.WORLD_THEMES[st.world - 1];
    var rule = getEffectiveEditRule();
    var patchCount = Object.keys(state.patches || {}).length;
    var hasCustomAst = state.customAst !== null;

    document.getElementById('game-stage-badge').textContent = 'W' + st.world + '-' + st.stageInWorld + ' (STAGE ' + st.id + ')';
    document.getElementById('game-stage-title').textContent = st.title;
    document.getElementById('game-world-pill').textContent = theme.subtitle + ' ｜ ' + rule.label;

    var patchInd = document.getElementById('patch-indicator');
    if (state.scratchMode) {
      patchInd.innerHTML = BS.UI.getWrenchSvg() + '<span>ゼロから ビルド中！</span>';
      patchInd.className = 'patch-indicator is-done';
    } else if (hasCustomAst) {
      patchInd.innerHTML = BS.UI.getWrenchSvg() + '<span>自由ビルド かいてん中！</span>';
      patchInd.className = 'patch-indicator is-done';
    } else if (patchCount > 0) {
      if (rule.mode === 'multi') {
        patchInd.innerHTML = BS.UI.getWrenchSvg() + '<span>' + patchCount + '/' + rule.maxEdits + 'カ所 しゅうせい！</span>';
      } else {
        patchInd.innerHTML = BS.UI.getWrenchSvg() + '<span>' + patchCount + 'かしょ しゅうせいずみ！</span>';
      }
      patchInd.className = 'patch-indicator is-done';
    } else {
      if (rule.mode === 'single') {
        patchInd.innerHTML = '<span>パネルを 1つだけ なおせるよ</span>';
      } else if (rule.mode === 'multi') {
        patchInd.innerHTML = '<span>最大 ' + rule.maxEdits + 'カ所まで なおせるよ</span>';
      } else {
        patchInd.innerHTML = '<span>しゅうせい・ついか・ならべかえ自由！</span>';
      }
      patchInd.className = 'patch-indicator';
    }

    var codeTitleEl = document.getElementById('code-pane-title');
    if (codeTitleEl) {
      codeTitleEl.textContent = rule.allowBuild
        ? 'ネジ丸の プログラム（編集・追加・消去OK！）'
        : (rule.mode === 'multi'
          ? 'ネジ丸の プログラム（' + rule.maxEdits + 'カ所まで直せるよ）'
          : 'ネジ丸の プログラム（1つタップして なおそう！）');
    }

    var scratchBtn = document.getElementById('btn-scratch-toggle');
    if (scratchBtn) {
      scratchBtn.classList.toggle('is-on', state.scratchMode);
      scratchBtn.textContent = state.scratchMode ? '🐞 バグ問題にもどる' : '🧩 ゼロからつくる';
    }

    var save = getActiveSave();
    var res = save.results[st.id];
    var gearInd = document.getElementById('gear-indicator');
    gearInd.className = 'gear-indicator' + ((state.animState.gearCollected || (res && res.gear)) ? ' is-got' : '');
    gearInd.textContent = (state.animState.gearCollected || (res && res.gear)) ? '⚙ 黄金ギア GET!' : '⚙ 黄金ギア 未回収';
  }

  function setSpeechBubble(text, mood) {
    var el = document.getElementById('nejimaru-speech');
    if (!el) return;
    el.textContent = text;
    el.className = 'speech-bubble mood-' + (mood || 'info');
  }

  function renderProgramArea() {
    var container = document.getElementById('program-list');
    if (!container || !state.workingProgram) return;
    var locked = state.playMode === 'playing';
    var rule = getEffectiveEditRule();
    BS.UI.renderProgramTree(container, state.workingProgram, {
      patches: state.patches,
      executingNodeId: state.animState.executingNodeId,
      errorNodeId: state.animState.errorNodeId,
      stage: state.currentStage,
      locked: locked,
      allowBuild: rule.allowBuild,
      onSelectNode: function (node, targetEl) {
        openEditModal(node, targetEl);
      },
      onAddChild: function (parentNode, branchKey) {
        openInsertModal({ type: 'child', nodeId: parentNode._id, branchKey: branchKey });
      },
      onAddRoot: function () {
        openInsertModal({ type: 'root' });
      }
    });
  }

  function updateControlButtons() {
    var isPlaying = state.playMode === 'playing';
    var playBtn = document.getElementById('btn-play');
    var stepBtn = document.getElementById('btn-step');
    var speedBtn = document.getElementById('btn-speed');
    var undoBtn = document.getElementById('btn-undo-patch');
    var scratchBtn = document.getElementById('btn-scratch-toggle');

    var hasAnyEdit = Object.keys(state.patches || {}).length > 0 || state.customAst !== null;

    if (playBtn) {
      playBtn.disabled = isPlaying || !state.workingProgram || state.workingProgram.length === 0;
      playBtn.innerHTML = isPlaying ? '▶ じっこうちゅう…' : '▶ うごかす';
    }
    if (stepBtn) {
      stepBtn.disabled = isPlaying || !state.workingProgram || state.workingProgram.length === 0;
    }
    if (speedBtn) {
      speedBtn.textContent = state.speed === 2 ? '⏩ 2ばいそく' : '▶ 1ばいそく';
      speedBtn.classList.toggle('is-fast', state.speed === 2);
    }
    if (undoBtn) {
      undoBtn.disabled = isPlaying || !hasAnyEdit;
    }
    if (scratchBtn) {
      scratchBtn.disabled = isPlaying;
    }
  }

  /* =========================================================
   * パネル編集＆自由ビルドモーダル
   * ========================================================= */
  function ensureCustomAstForBuild() {
    if (state.customAst === null) {
      state.customAst = BS.Engine.deepClone(state.workingProgram || []);
      state.patches = {};
    }
  }

  function openEditModal(node) {
    if (state.playMode === 'playing') return;
    if (state.playMode !== 'idle') {
      resetSimulationToStart();
    }
    var Engine = BS.Engine;
    var rule = getEffectiveEditRule();
    var candidates = Engine.getEditCandidates(state.currentStage, node);
    // 自由ビルド時は until_goal 含むループ回数変更も選べる
    if (rule.allowBuild && node.type === 'loop') {
      candidates = [2, 3, 4, 'until_goal']
        .filter(function (c) { return c !== node.count; })
        .map(function (c) { return { kind: 'loop', value: c }; });
    }
    if (candidates.length === 0 && !rule.allowBuild) return;

    BS.Audio.playClick();
    state.editingNode = node;
    state.insertTarget = null;

    var modal = document.getElementById('edit-modal');
    var titleEl = document.getElementById('edit-modal-title');
    var gridEl = document.getElementById('edit-candidates-grid');
    var toolsEl = document.getElementById('edit-build-tools');
    gridEl.innerHTML = '';

    var patchCount = Object.keys(state.patches || {}).length;
    var alreadyPatched = Boolean(state.patches[node._id]);
    var multiLimitReached = (rule.mode === 'multi' && patchCount >= rule.maxEdits && !alreadyPatched);

    if (multiLimitReached) {
      titleEl.textContent = 'さいだい ' + rule.maxEdits + 'カ所まで！ どれか「もとに もどす」か リセットしてね';
    } else if (node.type === 'cmd') {
      titleEl.textContent = 'どの めいれいに なおす？';
    } else if (node.type === 'loop') {
      titleEl.textContent = 'くりかえす かいすうを なおそう！';
    } else if (node.type === 'if') {
      titleEl.textContent = 'センサーの じょうけんを なおそう！';
    }

    if (!multiLimitReached) {
      candidates.forEach(function (cand) {
        var btn = document.createElement('button');
        btn.type = 'button';
        if (cand.kind === 'cmd') {
          var meta = Engine.CMD_META[cand.value];
          btn.className = 'cand-btn cat-' + meta.category;
          btn.innerHTML =
            '<span class="cand-icon">' + BS.UI.getOpIconSvg(cand.value) + '</span>' +
            '<span class="cand-label">' + meta.label + '</span>';
        } else if (cand.kind === 'loop') {
          btn.className = 'cand-btn cat-loop';
          var lbl = cand.value === 'until_goal' ? 'ゴールまで' : (cand.value + 'かい');
          var badge = cand.value === 'until_goal' ? '∞' : ('×' + cand.value);
          btn.innerHTML =
            '<span class="cand-loop-num">' + badge + '</span>' +
            '<span class="cand-label">' + lbl + '</span>';
        } else if (cand.kind === 'if') {
          var cm = Engine.CONDITION_META[cand.value];
          btn.className = 'cand-btn cat-if';
          btn.innerHTML =
            '<span class="cand-icon">' + BS.UI.getConditionIconSvg(cand.value) + '</span>' +
            '<span class="cand-label">' + cm.label + '</span>';
        }
        btn.addEventListener('click', function () {
          applyPatchChoice(node._id, cand.value);
        });
        gridEl.appendChild(btn);
      });
    }

    // このノード自身が修正済みなら個別解除ボタンを表示
    if (alreadyPatched && state.customAst === null) {
      var revertBtn = document.createElement('button');
      revertBtn.type = 'button';
      revertBtn.className = 'cand-btn cat-revert';
      revertBtn.innerHTML = '<span class="cand-label">このパネルを もどす</span>';
      revertBtn.addEventListener('click', function () {
        BS.Audio.playClick();
        delete state.patches[node._id];
        closeEditModal();
        rebuildWorkingProgram();
        resetSimulationToStart();
        updateGameHeader();
        renderProgramArea();
        updateControlButtons();
      });
      gridEl.appendChild(revertBtn);
    }

    if (toolsEl) {
      toolsEl.style.display = rule.allowBuild ? 'block' : 'none';
    }
    modal.classList.add('is-open');
  }

  function openInsertModal(target) {
    if (state.playMode === 'playing') return;
    if (state.playMode !== 'idle') {
      resetSimulationToStart();
    }
    BS.Audio.playClick();
    state.editingNode = null;
    state.insertTarget = target;

    var Engine = BS.Engine;
    var modal = document.getElementById('edit-modal');
    var titleEl = document.getElementById('edit-modal-title');
    var gridEl = document.getElementById('edit-candidates-grid');
    var toolsEl = document.getElementById('edit-build-tools');
    if (toolsEl) toolsEl.style.display = 'none';

    titleEl.textContent = 'ついかする ブロックを えらぼう！';
    gridEl.innerHTML = '';

    var ops = Engine.getAvailableOps(state.currentStage);
    ops.forEach(function (op) {
      var meta = Engine.CMD_META[op];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cand-btn cat-' + meta.category;
      btn.innerHTML =
        '<span class="cand-icon">' + BS.UI.getOpIconSvg(op) + '</span>' +
        '<span class="cand-label">' + meta.label + '</span>';
      btn.addEventListener('click', function () {
        applyInsertNode({ type: 'cmd', op: op });
      });
      gridEl.appendChild(btn);
    });

    // ループブロック追加（×2, ×3, ∞ゴールまで）
    [2, 3, 'until_goal'].forEach(function (cnt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cand-btn cat-loop';
      btn.innerHTML =
        '<span class="cand-loop-num">' + (cnt === 'until_goal' ? '∞' : '×' + cnt) + '</span>' +
        '<span class="cand-label">' + (cnt === 'until_goal' ? 'ゴールまで' : cnt + 'かいくりかえす') + '</span>';
      btn.addEventListener('click', function () {
        applyInsertNode({ type: 'loop', count: cnt, body: [{ type: 'cmd', op: 'move' }] });
      });
      gridEl.appendChild(btn);
    });

    // センサー条件分岐ブロック追加
    var conds = Engine.getAvailableConditions(state.currentStage);
    if (conds.length > 0) {
      var defaultCond = conds[0];
      var ifBtn = document.createElement('button');
      ifBtn.type = 'button';
      ifBtn.className = 'cand-btn cat-if';
      ifBtn.innerHTML =
        '<span class="cand-icon">' + BS.UI.getConditionIconSvg(defaultCond) + '</span>' +
        '<span class="cand-label">もし〜なら (分岐)</span>';
      ifBtn.addEventListener('click', function () {
        applyInsertNode({
          type: 'if',
          condition: defaultCond,
          thenBranch: [{ type: 'cmd', op: 'turn_right' }],
          elseBranch: [{ type: 'cmd', op: 'move' }]
        });
      });
      gridEl.appendChild(ifBtn);
    }

    modal.classList.add('is-open');
  }

  function applyInsertNode(nodeSpec) {
    var target = state.insertTarget;
    if (!target) return;
    BS.Audio.playPatch();
    ensureCustomAstForBuild();
    if (target.type === 'root') {
      state.customAst = BS.Engine.mutateProgramAst(state.customAst, { type: 'append_root', nodeSpec: nodeSpec });
    } else if (target.type === 'after') {
      state.customAst = BS.Engine.mutateProgramAst(state.customAst, { type: 'insert_after', nodeId: target.nodeId, nodeSpec: nodeSpec });
    } else if (target.type === 'child') {
      state.customAst = BS.Engine.mutateProgramAst(state.customAst, {
        type: 'append_child',
        nodeId: target.nodeId,
        branchKey: target.branchKey,
        nodeSpec: nodeSpec
      });
    }
    closeEditModal();
    rebuildWorkingProgram();
    resetSimulationToStart();
    updateGameHeader();
    renderProgramArea();
    updateControlButtons();
    setSpeechBubble('あたらしい ブロックを ついかしたよ！', 'info');
  }

  function runAstBuildAction(actionType, extra) {
    if (!state.editingNode) return;
    BS.Audio.playPatch();
    ensureCustomAstForBuild();
    var nodeId = state.editingNode._id;
    var act = { type: actionType, nodeId: nodeId };
    if (extra) {
      Object.keys(extra).forEach(function (k) { act[k] = extra[k]; });
    }
    state.customAst = BS.Engine.mutateProgramAst(state.customAst, act);
    closeEditModal();
    rebuildWorkingProgram();
    resetSimulationToStart();
    updateGameHeader();
    renderProgramArea();
    updateControlButtons();
  }

  function closeEditModal() {
    var modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('is-open');
    state.editingNode = null;
    state.insertTarget = null;
  }

  function applyPatchChoice(nodeId, newValue) {
    BS.Audio.playPatch();
    var rule = getEffectiveEditRule();
    if (state.customAst !== null) {
      state.customAst = BS.Engine.mutateProgramAst(state.customAst, {
        type: 'replace_value',
        nodeId: nodeId,
        newValue: newValue
      });
    } else {
      if (rule.mode === 'single') {
        state.patches = {};
      }
      state.patches[nodeId] = newValue;
    }
    closeEditModal();
    rebuildWorkingProgram();
    resetSimulationToStart();
    updateGameHeader();
    renderProgramArea();
    updateControlButtons();
    var cnt = Object.keys(state.patches || {}).length;
    setSpeechBubble(
      state.customAst !== null
        ? 'ブロックを かきかえたよ！「▶ うごかす」で たしかめよう！'
        : 'スパナで ' + cnt + 'かしょ しゅうせいしたよ！「▶ うごかす」で たしかめよう！',
      'info'
    );
  }

  function undoPatch() {
    BS.Audio.playClick();
    state.patches = {};
    state.customAst = state.scratchMode ? [] : null;
    rebuildWorkingProgram();
    resetSimulationToStart();
    updateGameHeader();
    renderProgramArea();
    updateControlButtons();
    setSpeechBubble(state.scratchMode ? 'プログラムを ぜんぶ 消したよ！' : 'もとの バグプログラムに もどしたよ。', 'info');
  }

  /* =========================================================
   * 実行＆トレースアニメーション
   * ========================================================= */
  function startRun(autoPlay) {
    BS.Audio.unlock();
    if (!state.simResult || state.playMode === 'cleared' || state.playMode === 'failed') {
      resetSimulationToStart();
      state.simResult = BS.Engine.simulate(state.currentStage, state.workingProgram);
      state.traceIndex = -1;
    }

    if (autoPlay) {
      BS.Audio.playWindup();
      state.playMode = 'playing';
      updateControlButtons();
      advanceNextTrace(true);
    } else {
      state.playMode = 'paused_step';
      updateControlButtons();
      advanceNextTrace(false);
    }
  }

  function advanceNextTrace(continueAuto) {
    var res = state.simResult;
    if (!res) return;

    state.traceIndex++;
    if (state.traceIndex >= res.traces.length) {
      finalizeRunOutcome();
      return;
    }

    var tr = res.traces[state.traceIndex];
    var a = state.animState;
    a.fromX = tr.prevState.x;
    a.fromY = tr.prevState.y;
    a.x = tr.nextState.x;
    a.y = tr.nextState.y;
    a.dir = tr.nextState.dir;
    a.grid = tr.nextState.grid;
    a.gearCollected = tr.nextState.gearCollected;
    a.animProgress = 0;
    a.executingNodeId = tr.nodeId;
    a.errorNodeId = null;

    // 感情と効果音とパーティクル
    var ev = tr.events || [];
    if (tr.kind === 'if') {
      a.emotion = 'normal';
      BS.Audio.playClick();
      var cm = BS.Engine.CONDITION_META[tr.condition];
      setSpeechBubble('センサー：' + cm.label + ' → ' + (tr.matched ? '○ そうだよ！' : '× ちがうよ！'), 'info');
    } else {
      a.emotion = 'normal';
      if (ev.indexOf('jump') >= 0) {
        a.emotion = 'jump';
        BS.Audio.playJump();
      } else if (ev.indexOf('stun') >= 0) {
        a.emotion = 'stun';
        BS.Audio.playStun();
        state.renderer.spawnParticles(a.x, a.y, 'smoke', 8);
        setSpeechBubble('ゴツン！カベに ぶつかって ピヨピヨ…！', 'warn');
      } else if (ev.indexOf('drill_break') >= 0) {
        a.emotion = 'drill';
        BS.Audio.playDrillBreak();
        state.renderer.spawnParticles(a.x, a.y, 'biscuit', 18);
      } else if (ev.indexOf('drill_whiff') >= 0) {
        a.emotion = 'drill';
        BS.Audio.playDrillWhiff();
      } else if (ev.indexOf('turbo') >= 0) {
        a.emotion = 'turbo';
        BS.Audio.playTurbo();
        state.renderer.spawnParticles(a.fromX, a.fromY, 'turbo', 12);
      } else if (ev.indexOf('magnet_gear') >= 0 || ev.indexOf('magnet_bridge') >= 0 || ev.indexOf('magnet_pull') >= 0 || ev.indexOf('magnet_whiff') >= 0 || ev.indexOf('magnet_clank') >= 0) {
        a.emotion = 'magnet';
        BS.Audio.playMagnet();
        state.renderer.spawnParticles(a.x, a.y, 'magnet', 12);
      } else if (tr.op === 'turn_right' || tr.op === 'turn_left') {
        BS.Audio.playTurn();
      } else if (tr.op === 'wait') {
        BS.Audio.playWait();
      } else if (ev.indexOf('move') >= 0) {
        BS.Audio.playMove();
      }

      if (ev.indexOf('gear') >= 0 || ev.indexOf('magnet_gear') >= 0) {
        BS.Audio.playGear();
        state.renderer.spawnParticles(a.x, a.y, 'gear', 22);
        updateGameHeader();
        setSpeechBubble('やったー！黄金のギアを ゲットしたよ！', 'happy');
      }
      if (ev.indexOf('warp') >= 0) {
        BS.Audio.playWarp();
        state.renderer.spawnParticles(a.x, a.y, 'magnet', 14);
      }
      if (ev.indexOf('conveyor') >= 0) {
        BS.Audio.playConveyor();
      }
    }

    renderProgramArea();

    // パネルが画面外なら自動スクロールして見やすくする
    var activeEl = document.querySelector('[data-node-id="' + tr.nodeId + '"]');
    if (activeEl && activeEl.scrollIntoView) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (tr.outcome === 'fail' || tr.outcome === 'goal') {
      var delay = Math.floor(360 / state.speed);
      if (continueAuto) {
        state.stepTimer = setTimeout(finalizeRunOutcome, delay);
      } else {
        finalizeRunOutcome();
      }
      return;
    }

    if (continueAuto && state.playMode === 'playing') {
      var stepDuration = tr.kind === 'if' ? Math.floor(260 / state.speed) : Math.floor(420 / state.speed);
      state.stepTimer = setTimeout(function () {
        advanceNextTrace(true);
      }, stepDuration);
    }
  }

  function finalizeRunOutcome() {
    var res = state.simResult;
    if (!res) return;
    stopPlayback();

    if (res.status === 'clear') {
      state.playMode = 'cleared';
      state.animState.emotion = 'happy';
      state.animState.executingNodeId = null;
      state.animState.errorNodeId = null;
      clearTraceBeam();
      var isSRank = res.rank === 'S';
      BS.Audio.playClear(isSRank);
      state.renderer.spawnParticles(state.animState.x, state.animState.y, 'clear', isSRank ? 40 : 22);
      setSpeechBubble(isSRank ? 'すごーい！！神ハック（Sランク）たっせい！！' : 'やったね！ゴールに とうちゃく！！', 'happy');
      renderProgramArea();
      updateControlButtons();
      handleStageClear(res);
    } else {
      state.playMode = 'failed';
      state.animState.emotion = 'fail';
      state.animState.executingNodeId = null;
      state.animState.errorNodeId = res.errorNodeId;
      clearTraceBeam();
      BS.Audio.playFail(res.errorType);
      state.renderer.spawnParticles(state.animState.x, state.animState.y, 'smoke', 22);
      setSpeechBubble(res.reason + '（赤い「！」の パネルが あやしいぞ！）', 'fail');
      renderProgramArea();
      updateControlButtons();
      recordDiscoveredBug(res.errorType);
    }
  }

  function recordDiscoveredBug(errorType) {
    if (!errorType) return;
    var save = getActiveSave();
    if (!Array.isArray(save.discoveredBugs)) save.discoveredBugs = [];
    if (save.discoveredBugs.indexOf(errorType) < 0) {
      save.discoveredBugs.push(errorType);
      saveNow();
    }
  }

  /* =========================================================
   * クリア処理＆ローグライク進化パーツ3択
   * ========================================================= */
  function handleStageClear(res) {
    var st = state.currentStage;
    var save = getActiveSave();
    var prev = save.results[st.id];
    var bestRank = (prev && prev.rank === 'S') || res.rank === 'S' ? 'S' : 'A';
    var gotGear = Boolean((prev && prev.gear) || res.gearCollected);
    save.results[st.id] = { rank: bestRank, gear: gotGear };

    var isFirstClear = !prev;
    if (st.id >= (save.unlockedStage || 1) && st.id < 100) {
      save.unlockedStage = st.id + 1;
    }
    // ステージで登場したパーツは図鑑にも登録
    if (Array.isArray(st.availableParts)) {
      st.availableParts.forEach(function (pid) {
        if (save.parts.indexOf(pid) < 0) {
          save.parts.push(pid);
          save.partLevels[pid] = save.partLevels[pid] || 1;
        }
      });
    }
    saveNow();
    updateGameHeader();

    // 初回クリア時または節目（3, 6, 10など、またはSランク達成時）にパーツ進化3択を提示
    var shouldOfferEvolution = isFirstClear && (st.stageInWorld === 2 || st.stageInWorld === 5 || st.stageInWorld === 10 || st.id === 1);
    setTimeout(function () {
      openClearModal(res, shouldOfferEvolution);
    }, 650);
  }

  function getEvolutionChoices() {
    var save = getActiveSave();
    var Engine = BS.Engine;
    var owned = save.parts || [];
    var allPartIds = ['spring', 'drill', 'turbo', 'magnet'];
    var choices = [];

    // まだ持っていないパーツがあれば優先的に候補へ
    allPartIds.forEach(function (pid) {
      if (owned.indexOf(pid) < 0 && choices.length < 3) {
        choices.push({ kind: 'part', id: pid, data: Engine.PARTS[pid] });
      }
    });
    // 足りない分は強化チップ（Mk-II）で3択にする
    var chipKeys = Object.keys(Engine.CHIPS);
    for (var i = 0; i < chipKeys.length && choices.length < 3; i++) {
      var ch = Engine.CHIPS[chipKeys[i]];
      choices.push({ kind: 'chip', id: ch.id, data: ch });
    }
    return choices.slice(0, 3);
  }

  function openClearModal(res, showEvolution) {
    var st = state.currentStage;
    var modal = document.getElementById('clear-modal');
    var badge = document.getElementById('clear-rank-badge');
    var title = document.getElementById('clear-modal-title');
    var desc = document.getElementById('clear-modal-desc');
    var evoBox = document.getElementById('evolution-box');
    var evoCards = document.getElementById('evolution-cards');
    var nextBtn = document.getElementById('btn-clear-next');

    var isS = res.rank === 'S';
    var patchCount = Object.keys(state.patches || {}).length;
    var methodTxt = state.scratchMode
      ? 'ゼロからの じぶんプログラミングで'
      : (state.customAst !== null
        ? '自由ビルドで'
        : (patchCount <= 1 ? '1手しゅうせいで' : patchCount + 'カ所デバッグで'));

    badge.textContent = isS ? 'S ランク' : 'A ランク';
    badge.className = 'clear-rank-badge ' + (isS ? 'is-s' : 'is-a');
    title.textContent = isS ? '神ハック大せいこう！！' : 'ステージ クリア！！';
    desc.textContent = isS
      ? methodTxt + ' 黄金のギアも回収してゴール！みごとなハッキングだね！（' + res.steps + ' ステップ）'
      : methodTxt + ' みごと突破！（黄金のギアを集めると Sランクになるよ！）';

    if (showEvolution) {
      evoBox.style.display = 'block';
      evoCards.innerHTML = '';
      var choices = getEvolutionChoices();
      choices.forEach(function (c) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'evo-card';
        var titleTxt = c.data.name;
        var subTxt = c.kind === 'part' ? c.data.description : c.data.description;
        var bugTxt = c.kind === 'part' ? ('バグのクセ：' + c.data.bugNote) : ('バグのクセ：' + c.data.bonusBug);
        card.innerHTML =
          '<div class="evo-name">' + titleTxt + '</div>' +
          '<div class="evo-desc">' + subTxt + '</div>' +
          '<div class="evo-bug">' + bugTxt + '</div>';
        card.addEventListener('click', function () {
          BS.Audio.playPatch();
          var save = getActiveSave();
          if (c.kind === 'part') {
            if (save.parts.indexOf(c.id) < 0) save.parts.push(c.id);
            save.partLevels[c.id] = (save.partLevels[c.id] || 0) + 1;
          } else {
            var bp = c.data.basePart;
            if (save.parts.indexOf(bp) < 0) save.parts.push(bp);
            save.partLevels[bp] = (save.partLevels[bp] || 1) + 1;
          }
          saveNow();
          var allCards = evoCards.querySelectorAll('.evo-card');
          for (var j = 0; j < allCards.length; j++) {
            allCards[j].classList.remove('is-picked');
            allCards[j].disabled = true;
          }
          card.classList.add('is-picked');
          document.getElementById('evo-picked-msg').textContent = 'ガチャン！ネジ丸に「' + titleTxt + '」が合体したぞ！（次のバグに気をつけて！）';
        });
        evoCards.appendChild(card);
      });
      document.getElementById('evo-picked-msg').textContent = 'すきな 進化パーツを 1つ えらんで ネジ丸に合体させよう！';
    } else {
      evoBox.style.display = 'none';
    }

    var hasNext = Boolean(getStageById(st.id + 1));
    nextBtn.style.display = hasNext ? 'inline-flex' : 'none';
    modal.classList.add('is-open');
  }

  function closeClearModal() {
    var modal = document.getElementById('clear-modal');
    if (modal) modal.classList.remove('is-open');
  }

  /* =========================================================
   * パーツ＆バグ図鑑モーダル
   * ========================================================= */
  function openZukanModal() {
    BS.Audio.playClick();
    var modal = document.getElementById('zukan-modal');
    var save = getActiveSave();
    var Engine = BS.Engine;
    var listEl = document.getElementById('zukan-parts-list');
    listEl.innerHTML = '';

    ['spring', 'drill', 'turbo', 'magnet'].forEach(function (pid) {
      var p = Engine.PARTS[pid];
      var owned = (save.parts || []).indexOf(pid) >= 0;
      var lv = (save.partLevels && save.partLevels[pid]) || 0;
      var item = document.createElement('div');
      item.className = 'zukan-item' + (owned ? ' is-owned' : ' is-locked');
      item.innerHTML =
        '<div class="zk-head"><strong>' + (owned ? p.name : '？？？パーツ') + '</strong>' +
        (owned ? '<span class="zk-lv">Lv.' + lv + '</span>' : '') + '</div>' +
        '<div class="zk-desc">' + (owned ? p.description : 'タワーを進めると解放される進化パーツだよ！') + '</div>' +
        (owned ? '<div class="zk-bug">🐞 ' + p.bugNote + '</div>' : '');
      listEl.appendChild(item);
    });

    modal.classList.add('is-open');
  }

  function closeZukanModal() {
    var modal = document.getElementById('zukan-modal');
    if (modal) modal.classList.remove('is-open');
  }

  function updateAudioButtons() {
    var muted = BS.Audio.isMuted();
    var btns = document.querySelectorAll('.btn-audio-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = muted ? '🔇 おと OFF' : '🔊 おと ON';
      btns[i].classList.toggle('is-muted', muted);
    }
  }

  /* =========================================================
   * アニメーションループ（60fps滑らか描画＆プレビューCanvas更新）
   * ========================================================= */
  function animationLoop(ts) {
    if (!state.lastRafTime) state.lastRafTime = ts;
    var dt = Math.min(0.05, (ts - state.lastRafTime) / 1000);
    state.lastRafTime = ts;
    state.globalTime += dt;

    if (state.screen === 'game' && state.currentStage && state.renderer) {
      var a = state.animState;
      var stepRate = state.speed === 2 ? 7.5 : 4.2;
      if (a.animProgress < 1) {
        a.animProgress = Math.min(1, a.animProgress + dt * stepRate);
      }
      var t = a.animProgress;
      var ease = 1 - Math.pow(1 - t, 3);
      var drawX = a.fromX + (a.x - a.fromX) * ease;
      var drawY = a.fromY + (a.y - a.fromY) * ease;

      state.renderer.updateParticles(dt);
      state.renderer.renderScene({
        stage: state.currentStage,
        grid: a.grid,
        theme: BS.Engine.WORLD_THEMES[state.currentStage.world - 1],
        robotX: drawX,
        robotY: drawY,
        robotDir: a.dir,
        parts: getDisplayPartsForStage(state.currentStage),
        partLevels: getActiveSave().partLevels,
        gearCollected: a.gearCollected,
        emotion: a.emotion,
        animProgress: a.animProgress,
        time: state.globalTime
      });

      var svgBeam = document.getElementById('trace-beam-svg');
      if (a.executingNodeId) {
        BS.UI.updateTraceBeam(svgBeam, state.renderer.canvas, state.renderer, drawX, drawY, a.executingNodeId);
      }
    }

    // タイトル画面のライブ時計塔背景＆動くネジ丸ステージデモ
    if (state.screen === 'title') {
      var bgCanvas = document.getElementById('title-bg-canvas');
      if (bgCanvas && BS.Renderer.renderTitleBackdrop) {
        BS.Renderer.renderTitleBackdrop(bgCanvas, state.globalTime);
      }
      var titleCanvas = document.getElementById('title-robot-canvas');
      if (titleCanvas) {
        var saveT = getActiveSave();
        if (BS.Renderer.renderTitleStageDemo) {
          BS.Renderer.renderTitleStageDemo(titleCanvas, saveT.parts, saveT.partLevels, state.globalTime);
        } else {
          BS.Renderer.renderPreview(titleCanvas, saveT.parts, saveT.partLevels, state.globalTime);
        }
      }
    }

    // 図鑑モーダルが開いていたらプレビュー更新
    var zkModal = document.getElementById('zukan-modal');
    if (zkModal && zkModal.classList.contains('is-open')) {
      var zkCanvas = document.getElementById('zukan-robot-canvas');
      if (zkCanvas) {
        var saveZ = getActiveSave();
        BS.Renderer.renderPreview(zkCanvas, saveZ.parts, saveZ.partLevels, state.globalTime);
      }
    }

    root.requestAnimationFrame(animationLoop);
  }

  /* =========================================================
   * 初期化＆イベント配線
   * ========================================================= */
  function init() {
    state.savesData = BS.UI.loadAllSaves();
    var canvas = document.getElementById('stage-canvas');
    if (canvas) {
      state.renderer = new BS.Renderer(canvas);
    }

    // タイトル画面イベント
    document.getElementById('btn-start-adventure').addEventListener('click', function () {
      BS.Audio.unlock();
      BS.Audio.playWindup();
      BS.Audio.startBgm();
      showScreen('tower');
    });
    document.getElementById('btn-title-zukan').addEventListener('click', function () {
      BS.Audio.unlock();
      openZukanModal();
    });
    document.getElementById('btn-add-player').addEventListener('click', function () {
      BS.Audio.unlock();
      BS.Audio.playClick();
      openPlayerNameModal('add', -1);
    });

    // プレイヤー名入力＆セーブ削除モーダルイベント
    document.getElementById('btn-player-name-cancel').addEventListener('click', function () {
      BS.Audio.playClick();
      closePlayerNameModal();
    });
    document.getElementById('btn-player-name-save').addEventListener('click', confirmPlayerNameModal);
    document.getElementById('player-name-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') confirmPlayerNameModal();
    });
    document.getElementById('btn-delete-save-cancel').addEventListener('click', function () {
      BS.Audio.playClick();
      closeDeleteSaveModal();
    });
    document.getElementById('btn-delete-save-confirm').addEventListener('click', confirmDeleteSaveModal);

    // 自由ビルド操作イベント
    document.getElementById('btn-scratch-toggle').addEventListener('click', toggleScratchMode);
    document.getElementById('btn-node-move-up').addEventListener('click', function () {
      runAstBuildAction('move_node', { delta: -1 });
    });
    document.getElementById('btn-node-move-down').addEventListener('click', function () {
      runAstBuildAction('move_node', { delta: 1 });
    });
    document.getElementById('btn-node-insert-after').addEventListener('click', function () {
      if (!state.editingNode) return;
      var targetId = state.editingNode._id;
      openInsertModal({ type: 'after', nodeId: targetId });
    });
    document.getElementById('btn-node-delete').addEventListener('click', function () {
      runAstBuildAction('delete_node');
    });

    // タワー画面イベント
    document.getElementById('btn-tower-back').addEventListener('click', function () {
      BS.Audio.playClick();
      showScreen('title');
    });
    document.getElementById('btn-tower-zukan').addEventListener('click', openZukanModal);
    document.getElementById('btn-toggle-unlock-all').addEventListener('click', function () {
      BS.Audio.playClick();
      var save = getActiveSave();
      save.unlockAllMode = !save.unlockAllMode;
      saveNow();
      renderTowerScreen();
    });

    // ゲーム画面コントロール
    document.getElementById('btn-game-map').addEventListener('click', function () {
      BS.Audio.playClick();
      stopPlayback();
      showScreen('tower');
    });
    document.getElementById('btn-game-zukan').addEventListener('click', openZukanModal);
    document.getElementById('btn-play').addEventListener('click', function () {
      startRun(true);
    });
    document.getElementById('btn-step').addEventListener('click', function () {
      startRun(false);
    });
    document.getElementById('btn-reset').addEventListener('click', function () {
      BS.Audio.playClick();
      resetSimulationToStart();
      setSpeechBubble('スタートいちに リセットしたよ！', 'info');
    });
    document.getElementById('btn-speed').addEventListener('click', function () {
      BS.Audio.playClick();
      state.speed = state.speed === 1 ? 2 : 1;
      updateControlButtons();
    });
    document.getElementById('btn-undo-patch').addEventListener('click', undoPatch);

    // モーダル閉じる系
    document.getElementById('btn-edit-cancel').addEventListener('click', function () {
      BS.Audio.playClick();
      closeEditModal();
    });
    document.getElementById('btn-zukan-close').addEventListener('click', function () {
      BS.Audio.playClick();
      closeZukanModal();
    });
    document.getElementById('btn-clear-retry').addEventListener('click', function () {
      BS.Audio.playClick();
      closeClearModal();
      resetSimulationToStart();
      setSpeechBubble('もういちど べつの「神ハック」を さがしてみよう！', 'info');
    });
    document.getElementById('btn-clear-map').addEventListener('click', function () {
      BS.Audio.playClick();
      closeClearModal();
      showScreen('tower');
    });
    document.getElementById('btn-clear-next').addEventListener('click', function () {
      BS.Audio.playClick();
      closeClearModal();
      var nextId = state.currentStage.id + 1;
      if (getStageById(nextId)) {
        startStage(nextId);
      } else {
        showScreen('tower');
      }
    });

    // 全音声ミュート切替ボタン
    var audioBtns = document.querySelectorAll('.btn-audio-toggle');
    for (var i = 0; i < audioBtns.length; i++) {
      audioBtns[i].addEventListener('click', function () {
        BS.Audio.unlock();
        BS.Audio.setMuted(!BS.Audio.isMuted());
        updateAudioButtons();
      });
    }

    showScreen('title');
    root.requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
