/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * UI・コマンドパネル・ベクターアイコン・セーブ管理（js/ui.js）
 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'bug_sweeper_clockwork_saves_v1';

  /**
   * 大きなベクターSVGアイコン（文字を読めない幼児でも直感理解できるデザイン）
   */
  function getOpIconSvg(op) {
    switch (op) {
      case 'move':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><path d="M24 7 L39 23 H30 V40 H18 V23 H9 Z" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/></svg>';
      case 'turn_right':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><path d="M16 36 C10 30 10 18 18 13 C24 9 32 11 35 17 L41 13 L39 27 L26 23 L31 20 C29 16 24 15 20 17 C15 20 15 28 20 33 Z" fill="#ffffff" stroke="#1e3a8a" stroke-width="2" stroke-linejoin="round"/></svg>';
      case 'turn_left':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><path d="M32 36 C38 30 38 18 30 13 C24 9 16 11 13 17 L7 13 L9 27 L22 23 L17 20 C19 16 24 15 28 17 C33 20 33 28 28 33 Z" fill="#ffffff" stroke="#1e3a8a" stroke-width="2" stroke-linejoin="round"/></svg>';
      case 'wait':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><circle cx="24" cy="24" r="16" fill="#ffffff" stroke="#0c4a6e" stroke-width="3"/><path d="M24 13 V24 L32 28" fill="none" stroke="#0284c7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      case 'jump':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><path d="M8 33 Q24 8 38 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M39 16 L41 27 L30 25 Z" fill="#fef08a" stroke="#7c2d12" stroke-width="1.5"/><path d="M12 40 L20 36 L13 33 L21 29" fill="none" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/></svg>';
      case 'drill':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><polygon points="8,14 40,24 8,34" fill="#fef08a" stroke="#7c2d12" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 17 L18 31 M23 19 L26 29 M31 21 L33 27" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/></svg>';
      case 'turbo':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><path d="M8 14 L21 24 L8 34 Z M23 14 L36 24 L23 34 Z" fill="#fef08a" stroke="#7f1d1d" stroke-width="2" stroke-linejoin="round"/><line x1="39" y1="14" x2="39" y2="34" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>';
      case 'magnet':
        return '<svg viewBox="0 0 48 48" class="cmd-svg"><path d="M14 14 V26 A10 10 0 0 0 34 26 V14" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="butt"/><rect x="10.5" y="10" width="7" height="7" fill="#fef08a"/><rect x="30.5" y="10" width="7" height="7" fill="#fef08a"/><path d="M20 7 L24 3 L28 7" fill="none" stroke="#bae6fd" stroke-width="2.5" stroke-linecap="round"/></svg>';
      default:
        return '';
    }
  }

  function getConditionIconSvg(cond) {
    switch (cond) {
      case 'front_hole':
        return '<svg viewBox="0 0 40 40" class="cond-svg"><ellipse cx="20" cy="24" rx="14" ry="8" fill="#0f172a" stroke="#fde047" stroke-width="2"/><path d="M20 6 V17 M15 13 L20 18 L25 13" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/></svg>';
      case 'front_wall':
        return '<svg viewBox="0 0 40 40" class="cond-svg"><rect x="7" y="10" width="26" height="22" rx="4" fill="#ea580c" stroke="#7c2d12" stroke-width="2"/><circle cx="15" cy="17" r="3" fill="#fdba74"/><circle cx="25" cy="17" r="3" fill="#fdba74"/><circle cx="15" cy="25" r="3" fill="#fdba74"/><circle cx="25" cy="25" r="3" fill="#fdba74"/></svg>';
      case 'front_breakable':
        return '<svg viewBox="0 0 40 40" class="cond-svg"><rect x="7" y="9" width="26" height="22" rx="4" fill="#d97706" stroke="#78350f" stroke-width="2"/><path d="M14 11 L21 20 L16 24 L25 30" fill="none" stroke="#451a03" stroke-width="2.5" stroke-linecap="round"/></svg>';
      case 'near_gear':
        return '<svg viewBox="0 0 40 40" class="cond-svg"><circle cx="20" cy="20" r="10" fill="#facc15" stroke="#854d0e" stroke-width="2.5"/><circle cx="20" cy="20" r="4" fill="#854d0e"/><path d="M20 5 V9 M20 31 V35 M5 20 H9 M31 20 H35" stroke="#fde047" stroke-width="3" stroke-linecap="round"/></svg>';
      default:
        return '';
    }
  }

  function getWrenchSvg() {
    return '<svg viewBox="0 0 24 24" class="wrench-svg"><path d="M21.7 6.3a6 6 0 0 1-7.8 7.8l-7.2 7.2a2.1 2.1 0 0 1-3-3l7.2-7.2a6 6 0 0 1 7.8-7.8l-3.2 3.2 2.2 2.2 3.2-3.2z" fill="#fef08a" stroke="#92400e" stroke-width="1.6"/></svg>';
  }

  var MAX_SLOTS = 10;

  /**
   * セーブデータ管理（可変長プレイヤー管理：追加・名前変更・削除対応）
   */
  function createEmptySlot(slotIndex, customName) {
    var defaultName = 'プレイヤー ' + (slotIndex + 1);
    var cleaned = typeof customName === 'string' ? customName.trim().slice(0, 14) : '';
    return {
      id: 'p_' + Date.now() + '_' + slotIndex + '_' + Math.floor(Math.random() * 1000),
      slot: slotIndex,
      name: cleaned || defaultName,
      unlockedStage: 1,
      unlockAllMode: false,
      results: {}, // stageId: { rank: 'A'|'S', gear: boolean }
      parts: [],   // ['spring', 'drill', 'turbo', 'magnet']
      partLevels: {}, // { spring: 1, ... }
      discoveredBugs: [] // 体験したバグ種別
    };
  }

  function normalizeSlot(rawSlot, idx) {
    var base = createEmptySlot(idx);
    if (!rawSlot || typeof rawSlot !== 'object') return base;
    return {
      id: rawSlot.id || base.id,
      slot: idx,
      name: (typeof rawSlot.name === 'string' && rawSlot.name.trim()) ? rawSlot.name.trim().slice(0, 14) : base.name,
      unlockedStage: typeof rawSlot.unlockedStage === 'number' ? Math.max(1, Math.min(100, rawSlot.unlockedStage)) : 1,
      unlockAllMode: Boolean(rawSlot.unlockAllMode),
      results: (rawSlot.results && typeof rawSlot.results === 'object') ? rawSlot.results : {},
      parts: Array.isArray(rawSlot.parts) ? rawSlot.parts.slice() : [],
      partLevels: (rawSlot.partLevels && typeof rawSlot.partLevels === 'object') ? rawSlot.partLevels : {},
      discoveredBugs: Array.isArray(rawSlot.discoveredBugs) ? rawSlot.discoveredBugs.slice() : []
    };
  }

  function loadAllSaves() {
    try {
      var raw = root.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.slots) && parsed.slots.length >= 1) {
          var normalized = parsed.slots.slice(0, MAX_SLOTS).map(normalizeSlot);
          var active = typeof parsed.activeSlot === 'number' ? parsed.activeSlot : 0;
          if (active < 0 || active >= normalized.length) active = 0;
          return {
            activeSlot: active,
            slots: normalized
          };
        }
      }
    } catch (e) {
      // localStorage無効環境でも安全に継続
    }
    return {
      activeSlot: 0,
      slots: [createEmptySlot(0), createEmptySlot(1), createEmptySlot(2)]
    };
  }

  function persistAllSaves(data) {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore quota error
    }
  }

  function addPlayerSlot(data, name) {
    if (!data || !Array.isArray(data.slots)) return -1;
    if (data.slots.length >= MAX_SLOTS) return -1;
    var idx = data.slots.length;
    var slot = createEmptySlot(idx, name);
    data.slots.push(slot);
    data.activeSlot = idx;
    persistAllSaves(data);
    return idx;
  }

  function renamePlayerSlot(data, idx, newName) {
    if (!data || !data.slots || !data.slots[idx]) return false;
    var trimmed = typeof newName === 'string' ? newName.trim().slice(0, 14) : '';
    if (!trimmed) return false;
    data.slots[idx].name = trimmed;
    persistAllSaves(data);
    return true;
  }

  function deletePlayerSlot(data, idx) {
    if (!data || !data.slots || !data.slots[idx]) return false;
    if (data.slots.length <= 1) {
      // 最後の1人は初期状態にリセット
      data.slots[0] = createEmptySlot(0);
      data.activeSlot = 0;
    } else {
      data.slots.splice(idx, 1);
      for (var i = 0; i < data.slots.length; i++) {
        data.slots[i].slot = i;
      }
      if (data.activeSlot === idx) {
        data.activeSlot = Math.max(0, idx - 1);
      } else if (data.activeSlot > idx) {
        data.activeSlot -= 1;
      }
    }
    persistAllSaves(data);
    return true;
  }

  /**
   * プログラムツリーDOMをレンダリングする
   */
  function renderProgramTree(container, program, options) {
    var Engine = root.BugSweeper.Engine;
    container.innerHTML = '';

    var patches = options.patches || {};
    var executingId = options.executingNodeId || null;
    var errorId = options.errorNodeId || null;
    var stage = options.stage;
    var locked = options.locked || false;
    var allowBuild = Boolean(options.allowBuild);
    var onSelectNode = options.onSelectNode;
    var onAddChild = options.onAddChild;
    var onAddRoot = options.onAddRoot;

    function createAddBtn(label, title, onClickFn, extraClass) {
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'ast-add-btn' + (extraClass ? ' ' + extraClass : '');
      addBtn.textContent = label;
      addBtn.title = title;
      addBtn.disabled = locked;
      addBtn.addEventListener('click', function () {
        if (!locked && onClickFn) onClickFn();
      });
      return addBtn;
    }

    function buildNodes(nodes, parentEl) {
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.type === 'cmd') {
          var meta = Engine.CMD_META[node.op] || { label: node.op, category: 'basic' };
          var isPatched = Boolean(patches[node._id]);
          var isExec = executingId === node._id;
          var isErr = errorId === node._id;

          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cmd-panel cat-' + meta.category +
            (isPatched ? ' is-patched' : '') +
            (isExec ? ' is-executing' : '') +
            (isErr ? ' is-error' : '') +
            (locked ? ' is-locked' : '');
          btn.setAttribute('data-node-id', node._id);
          btn.innerHTML =
            '<span class="cmd-icon">' + getOpIconSvg(node.op) + '</span>' +
            '<span class="cmd-label">' + meta.label + '</span>' +
            (isPatched ? '<span class="patch-badge" title="しゅうせいずみ">' + getWrenchSvg() + '</span>' : '') +
            (isErr ? '<span class="error-badge">！</span>' : '');

          (function (n) {
            btn.addEventListener('click', function () {
              if (!locked && onSelectNode) onSelectNode(n, btn);
            });
          })(node);

          parentEl.appendChild(btn);
        } else if (node.type === 'loop') {
          var isLoopPatched = Boolean(patches[node._id]);
          var isLoopErr = errorId === node._id;
          var canEditLoop = (stage.allowLoopEdit !== false && node.count !== 'until_goal') || allowBuild;

          var wrap = document.createElement('div');
          wrap.className = 'loop-frame' + (isLoopPatched ? ' is-patched' : '') + (isLoopErr ? ' is-error' : '');
          wrap.setAttribute('data-node-id', node._id);

          var header = document.createElement('div');
          header.className = 'loop-header';

          var badgeBtn = document.createElement('button');
          badgeBtn.type = 'button';
          badgeBtn.className = 'loop-badge' + (canEditLoop && !locked ? ' is-editable' : ' is-fixed');
          badgeBtn.innerHTML = (node.count === 'until_goal' ? '∞ ゴールまで' : '×' + node.count) +
            (isLoopPatched ? '<span class="patch-badge-inline">' + getWrenchSvg() + '</span>' : '');
          if (canEditLoop) {
            (function (n, el) {
              el.addEventListener('click', function () {
                if (!locked && onSelectNode) onSelectNode(n, el);
              });
            })(node, badgeBtn);
          }

          var titleSpan = document.createElement('span');
          titleSpan.className = 'loop-title';
          titleSpan.textContent = node.count === 'until_goal' ? 'くりかえす' : 'かいくりかえす';

          header.appendChild(badgeBtn);
          header.appendChild(titleSpan);
          wrap.appendChild(header);

          var bodyEl = document.createElement('div');
          bodyEl.className = 'loop-body';
          buildNodes(node.body || [], bodyEl);
          if (allowBuild && onAddChild) {
            (function (n) {
              bodyEl.appendChild(createAddBtn('＋', 'ループのなかに ついか', function () {
                onAddChild(n, 'body');
              }, 'is-mini'));
            })(node);
          }
          wrap.appendChild(bodyEl);
          parentEl.appendChild(wrap);
        } else if (node.type === 'if') {
          var isIfPatched = Boolean(patches[node._id]);
          var isIfExec = executingId === node._id;
          var isIfErr = errorId === node._id;
          var cMeta = Engine.CONDITION_META[node.condition] || { label: node.condition, short: '?' };

          var ifWrap = document.createElement('div');
          ifWrap.className = 'if-frame' + (isIfPatched ? ' is-patched' : '') + (isIfExec ? ' is-executing' : '') + (isIfErr ? ' is-error' : '');
          ifWrap.setAttribute('data-node-id', node._id);

          var condBtn = document.createElement('button');
          condBtn.type = 'button';
          condBtn.className = 'if-diamond-btn' + (!locked ? ' is-editable' : '');
          condBtn.innerHTML =
            '<span class="if-diamond-icon">' + getConditionIconSvg(node.condition) + '</span>' +
            '<span class="if-label">もし ' + cMeta.label + '</span>' +
            (isIfPatched ? '<span class="patch-badge-inline">' + getWrenchSvg() + '</span>' : '');

          (function (n, el) {
            el.addEventListener('click', function () {
              if (!locked && onSelectNode) onSelectNode(n, el);
            });
          })(node, condBtn);

          ifWrap.appendChild(condBtn);

          var thenBox = document.createElement('div');
          thenBox.className = 'if-branch';
          var thenTag = document.createElement('div');
          thenTag.className = 'if-branch-tag is-yes';
          thenTag.textContent = '○ そうなら';
          thenBox.appendChild(thenTag);
          var thenNodes = document.createElement('div');
          thenNodes.className = 'if-branch-nodes';
          buildNodes(node.thenBranch || [], thenNodes);
          if (allowBuild && onAddChild) {
            (function (n) {
              thenNodes.appendChild(createAddBtn('＋', '「そうなら」に ついか', function () {
                onAddChild(n, 'thenBranch');
              }, 'is-mini'));
            })(node);
          }
          thenBox.appendChild(thenNodes);
          ifWrap.appendChild(thenBox);

          if ((Array.isArray(node.elseBranch) && node.elseBranch.length > 0) || allowBuild) {
            var elseBox = document.createElement('div');
            elseBox.className = 'if-branch';
            var elseTag = document.createElement('div');
            elseTag.className = 'if-branch-tag is-no';
            elseTag.textContent = '× ちがうなら';
            elseBox.appendChild(elseTag);
            var elseNodes = document.createElement('div');
            elseNodes.className = 'if-branch-nodes';
            buildNodes(node.elseBranch || [], elseNodes);
            if (allowBuild && onAddChild) {
              (function (n) {
                elseNodes.appendChild(createAddBtn('＋', '「ちがうなら」に ついか', function () {
                  onAddChild(n, 'elseBranch');
                }, 'is-mini'));
              })(node);
            }
            elseBox.appendChild(elseNodes);
            ifWrap.appendChild(elseBox);
          }

          parentEl.appendChild(ifWrap);
        }
      }
    }

    if (program.length === 0) {
      var emptyHint = document.createElement('div');
      emptyHint.className = 'program-empty-hint';
      emptyHint.textContent = 'まだ ブロックが ないよ！「＋ ブロックを ついか」から くみたてよう！';
      container.appendChild(emptyHint);
    }

    buildNodes(program, container);

    if (allowBuild && onAddRoot) {
      container.appendChild(createAddBtn('＋ ブロックを ついか', 'プログラムの さいごに ブロックを ついか', onAddRoot, 'is-root-add'));
    }
  }

  /**
   * 実行中パネルとCanvas上のネジ丸を結ぶ光のラインを更新する
   */
  function updateTraceBeam(svgEl, canvasEl, renderer, robotX, robotY, activeNodeId) {
    if (!svgEl) return;
    svgEl.innerHTML = '';
    if (!activeNodeId || !canvasEl || !renderer) return;

    var panelEl = document.querySelector('[data-node-id="' + activeNodeId + '"]');
    if (!panelEl) return;

    var canvasRect = canvasEl.getBoundingClientRect();
    var panelRect = panelEl.getBoundingClientRect();
    if (panelRect.width === 0 || canvasRect.width === 0) return;

    var rc = renderer.getRobotScreenCenter(robotX, robotY);
    var x1 = canvasRect.left + rc.x;
    var y1 = canvasRect.top + rc.y;
    var x2 = panelRect.left + 14;
    var y2 = panelRect.top + panelRect.height * 0.5;

    var cx1 = (x1 + x2) * 0.5;
    var cy1 = Math.min(y1, y2) - 45;

    var ns = 'http://www.w3.org/2000/svg';
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' Q ' + cx1 + ' ' + cy1 + ' ' + x2 + ' ' + y2);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#facc15');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', '10 6');
    path.setAttribute('class', 'trace-beam-path');

    var c1 = document.createElementNS(ns, 'circle');
    c1.setAttribute('cx', x1);
    c1.setAttribute('cy', y1);
    c1.setAttribute('r', '7');
    c1.setAttribute('fill', '#fef08a');

    var c2 = document.createElementNS(ns, 'circle');
    c2.setAttribute('cx', x2);
    c2.setAttribute('cy', y2);
    c2.setAttribute('r', '7');
    c2.setAttribute('fill', '#facc15');

    svgEl.appendChild(path);
    svgEl.appendChild(c1);
    svgEl.appendChild(c2);
  }

  root.BugSweeper = root.BugSweeper || {};
  root.BugSweeper.UI = {
    MAX_SLOTS: MAX_SLOTS,
    getOpIconSvg: getOpIconSvg,
    getConditionIconSvg: getConditionIconSvg,
    getWrenchSvg: getWrenchSvg,
    createEmptySlot: createEmptySlot,
    loadAllSaves: loadAllSaves,
    persistAllSaves: persistAllSaves,
    addPlayerSlot: addPlayerSlot,
    renamePlayerSlot: renamePlayerSlot,
    deletePlayerSlot: deletePlayerSlot,
    renderProgramTree: renderProgramTree,
    updateTraceBeam: updateTraceBeam
  };
})(typeof window !== 'undefined' ? window : globalThis);
