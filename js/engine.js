/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * コア・シミュレーションエンジン（js/engine.js）
 *
 * 順次処理、反復（ループ）、ネスト、条件分岐（センサー）、
 * 進化パーツアクション、地形ギミックを決定論的にシミュレートする。
 * ブラウザ（グローバル空間）と Node.js（ソルバー検証）の両方で動作する。
 */
(function (root) {
  'use strict';

  const DIRS = [
    { dx: 0, dy: -1, name: '上', arrow: '↑' }, // 0: North
    { dx: 1, dy: 0, name: '右', arrow: '→' },  // 1: East
    { dx: 0, dy: 1, name: '下', arrow: '↓' },  // 2: South
    { dx: -1, dy: 0, name: '左', arrow: '←' }  // 3: West
  ];

  const PARTS = {
    spring: {
      id: 'spring',
      name: 'スプリング脚',
      op: 'jump',
      shortLabel: 'ジャンプ',
      description: '1マス先の穴やトゲをピョーンと飛び越えるバネの脚！壁の前で使うと頭をぶつけて気絶するよ。',
      bugNote: '壁に向かってジャンプすると頭をゴツン！1ターン気絶しちゃうバグがあるぞ。',
      color: '#ff8c24'
    },
    drill: {
      id: 'drill',
      name: 'ドリル腕',
      op: 'drill',
      shortLabel: 'ドリル',
      description: '目の前の「ひび割れビスケット壁」をガガッと粉砕して前に進む強力ドリル！',
      bugNote: '壁がない場所で使うと空振りして1ターン無駄にしちゃうぞ。',
      color: '#ff6b35'
    },
    turbo: {
      id: 'turbo',
      name: 'ターボ歯車',
      op: 'turbo',
      shortLabel: 'ターボ',
      description: '一気に2マス猛ダッシュ！途中の1マス目が穴やトゲでも勢いで飛び越えるぞ。',
      bugNote: '2マス目が穴や壁だとコースアウトして大激突！勢いの制御がカギだ。',
      color: '#e84855'
    },
    magnet: {
      id: 'magnet',
      name: 'マグネット頭脳',
      op: 'magnet',
      shortLabel: 'じしゃく',
      description: '周囲1マスの黄金ギアを引き寄せて回収！さらに前方の鉄ブロックを引き寄せて足場にするぞ。',
      bugNote: '周りに鉄もギアもないと空回りしちゃうけど、離れたお宝を回収する神ハックに大活躍！',
      color: '#3b82f6'
    }
  };

  const CHIPS = {
    spring_mk2: {
      id: 'spring_mk2',
      basePart: 'spring',
      name: 'ハイパースプリングMk-II',
      description: 'バネの弾力がさらにアップ！見た目も金色のコイルに進化するぞ。',
      bonusBug: 'ワクワクしすぎて跳びたくなるおちゃめなチューニング！'
    },
    drill_mk2: {
      id: 'drill_mk2',
      basePart: 'drill',
      name: 'ダイヤモンドドリルMk-II',
      description: 'キラキラ輝くビスケット砕き用ビット！回転音がちょっぴり豪華になる。',
      bonusBug: '硬そうなものを見るとつい回したくなる職人魂チップ！'
    },
    turbo_mk2: {
      id: 'turbo_mk2',
      basePart: 'turbo',
      name: 'ゴールドターボMk-II',
      description: '黄金のオイルで滑らか加速！背中のゼンマイも超高速回転するぞ。',
      bonusBug: '止まるタイミングを忘れがちなスピード狂ギア！'
    },
    magnet_mk2: {
      id: 'magnet_mk2',
      basePart: 'magnet',
      name: 'ネオジム頭脳Mk-II',
      description: 'U字磁石がピカピカに進化！ネジ丸のアンテナから磁力オーラが輝く。',
      bonusBug: '近くのお宝に反応してピピッと反応しちゃう探知センサー！'
    }
  };

  const CMD_META = {
    move: { op: 'move', label: 'まえ', category: 'basic', color: '#2563eb' },
    turn_right: { op: 'turn_right', label: 'みぎ', category: 'basic', color: '#2563eb' },
    turn_left: { op: 'turn_left', label: 'ひだり', category: 'basic', color: '#2563eb' },
    wait: { op: 'wait', label: 'たいき', category: 'basic', color: '#0284c7' },
    jump: { op: 'jump', label: 'ジャンプ', category: 'part', partId: 'spring', color: '#ea580c' },
    drill: { op: 'drill', label: 'ドリル', category: 'part', partId: 'drill', color: '#ea580c' },
    turbo: { op: 'turbo', label: 'ターボ', category: 'part', partId: 'turbo', color: '#dc2626' },
    magnet: { op: 'magnet', label: 'じしゃく', category: 'part', partId: 'magnet', color: '#d97706' }
  };

  const CONDITION_META = {
    front_hole: { id: 'front_hole', label: 'まえが あな・トゲ', short: 'あな？' },
    front_wall: { id: 'front_wall', label: 'まえが カベ', short: 'カベ？' },
    front_breakable: { id: 'front_breakable', label: 'まえが ヒビカベ', short: 'ヒビ？' },
    near_gear: { id: 'near_gear', label: 'ちかくに ギア', short: 'ギア？' }
  };

  const WORLD_THEMES = [
    { world: 1, name: '第1層：つみきの玄関ホール', subtitle: '順次処理①（基本移動）', accent: '#f59e0b', bgTop: '#fef3c7', bgBottom: '#fde68a' },
    { world: 2, name: '第2層：ビスケット工房', subtitle: '順次処理②（跳躍と破壊）', accent: '#ea580c', bgTop: '#ffedd5', bgBottom: '#fed7aa' },
    { world: 3, name: '第3層：マグネット貨物室', subtitle: '順次処理③（加速と磁力）', accent: '#dc2626', bgTop: '#fee2e2', bgBottom: '#fecaca' },
    { world: 4, name: '第4層：ぜんまい反復回廊', subtitle: '反復（ループ）①', accent: '#7c3aed', bgTop: '#ede9fe', bgBottom: '#ddd6fe' },
    { world: 5, name: '第5層：ぐるぐる歯車コンベア', subtitle: '反復（ループ）②＋歯車床', accent: '#2563eb', bgTop: '#dbeafe', bgBottom: '#bfdbfe' },
    { world: 6, name: '第6層：からくり多重時計室', subtitle: 'ネスト（入れ子）ループ', accent: '#0891b2', bgTop: '#cffafe', bgBottom: '#a5f3fc' },
    { world: 7, name: '第7層：ひかりのセンサー塔', subtitle: '条件分岐①（基本センサー）', accent: '#059669', bgTop: '#d1fae5', bgBottom: '#a7f3d0' },
    { world: 8, name: '第8層：ワープ土管の迷宮', subtitle: '条件分岐②（状態センサー）', accent: '#4f46e5', bgTop: '#e0e7ff', bgBottom: '#c7d2fe' },
    { world: 9, name: '第9層：自律からくり天文台', subtitle: 'ループ × 条件分岐の融合', accent: '#9333ea', bgTop: '#f3e8ff', bgBottom: '#e9d5ff' },
    { world: 10, name: '第10層：時計塔最上階（大聖堂）', subtitle: 'フル装備・最終からくり試験', accent: '#b45309', bgTop: '#fef9c3', bgBottom: '#fde047' }
  ];

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * プログラムツリー内の各ノードへ決定論的なパスIDを付与する
   */
  function assignNodeIds(nodes, prefix) {
    const base = prefix || '';
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const id = base ? base + '.' + i : String(i);
      node._id = id;
      if (node.type === 'loop' && Array.isArray(node.body)) {
        assignNodeIds(node.body, id + '.body');
      } else if (node.type === 'if') {
        if (Array.isArray(node.thenBranch)) {
          assignNodeIds(node.thenBranch, id + '.then');
        }
        if (Array.isArray(node.elseBranch)) {
          assignNodeIds(node.elseBranch, id + '.else');
        }
      }
    }
    return nodes;
  }

  /**
   * 編集可能な全ノードの参照とパス一覧を収集する
   */
  function collectEditableNodes(nodes) {
    const list = [];
    function walk(arr) {
      for (let i = 0; i < arr.length; i++) {
        const node = arr[i];
        if (node.type === 'cmd') {
          list.push({ nodeId: node._id, kind: 'cmd', node: node });
        } else if (node.type === 'loop') {
          if (node.count !== 'until_goal') {
            list.push({ nodeId: node._id, kind: 'loop', node: node });
          }
          if (Array.isArray(node.body)) walk(node.body);
        } else if (node.type === 'if') {
          list.push({ nodeId: node._id, kind: 'if', node: node });
          if (Array.isArray(node.thenBranch)) walk(node.thenBranch);
          if (Array.isArray(node.elseBranch)) walk(node.elseBranch);
        }
      }
    }
    walk(nodes);
    return list;
  }

  /**
   * ステージで選択可能なコマンド一覧を返す
   */
  function getAvailableOps(stage, extraParts) {
    const ops = ['move', 'turn_right', 'turn_left', 'wait'];
    const partSet = new Set(stage.availableParts || []);
    if (Array.isArray(extraParts)) {
      for (let i = 0; i < extraParts.length; i++) {
        partSet.add(extraParts[i]);
      }
    }
    if (partSet.has('spring')) ops.push('jump');
    if (partSet.has('drill')) ops.push('drill');
    if (partSet.has('turbo')) ops.push('turbo');
    if (partSet.has('magnet')) ops.push('magnet');
    return ops;
  }

  /**
   * ステージで選択可能な条件一覧を返す
   */
  function getAvailableConditions(stage) {
    if (Array.isArray(stage.availableConditions) && stage.availableConditions.length > 0) {
      return stage.availableConditions.slice();
    }
    if (stage.world >= 8) {
      return ['front_hole', 'front_wall', 'front_breakable', 'near_gear'];
    }
    return ['front_hole', 'front_wall'];
  }

  /**
   * 指定ノードを別の有効値へ書き換える際の候補リスト（現在値以外）を返す
   */
  function getEditCandidates(stage, node, extraParts) {
    if (!node) return [];
    if (node.type === 'cmd') {
      const ops = getAvailableOps(stage, extraParts);
      return ops
        .filter(function (op) { return op !== node.op; })
        .map(function (op) { return { kind: 'cmd', value: op }; });
    }
    if (node.type === 'loop') {
      if (node.count === 'until_goal') return [];
      if (stage.allowLoopEdit === false) return [];
      const counts = [2, 3, 4];
      return counts
        .filter(function (c) { return c !== node.count; })
        .map(function (c) { return { kind: 'loop', value: c }; });
    }
    if (node.type === 'if') {
      const conds = getAvailableConditions(stage);
      return conds
        .filter(function (c) { return c !== node.condition; })
        .map(function (c) { return { kind: 'if', value: c }; });
    }
    return [];
  }

  /**
   * 複数ノードIDを指定してプログラムのクローン内のノードを一括書き換える
   */
  function applyPatches(program, patchesMap) {
    const cloned = assignNodeIds(deepClone(program));
    if (!patchesMap) return cloned;
    const list = collectEditableNodes(cloned);
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      if (Object.prototype.hasOwnProperty.call(patchesMap, entry.nodeId)) {
        const newValue = patchesMap[entry.nodeId];
        if (entry.kind === 'cmd') entry.node.op = newValue;
        else if (entry.kind === 'loop') entry.node.count = newValue;
        else if (entry.kind === 'if') entry.node.condition = newValue;
      }
    }
    return cloned;
  }

  /**
   * ノードIDを指定してプログラムのクローン内のノードを1箇所書き換える
   */
  function applySingleEdit(program, nodeId, newValue) {
    const map = {};
    map[nodeId] = newValue;
    return applyPatches(program, map);
  }

  /**
   * 階層（W1〜W10）に応じた段階的プログラミングルールを返す
   */
  function getStageProgrammingRule(stage) {
    const w = stage ? stage.world : 1;
    if (w <= 3) {
      return { mode: 'single', maxEdits: 1, allowBuild: false, label: '1てデバッグ' };
    }
    if (w <= 6) {
      return { mode: 'multi', maxEdits: 3, allowBuild: false, label: '3カ所デバッグ' };
    }
    return { mode: 'free', maxEdits: Infinity, allowBuild: true, label: '自由ビルドOK' };
  }

  function createAstNode(spec) {
    if (spec.type === 'loop') {
      return {
        type: 'loop',
        count: spec.count !== undefined ? spec.count : 2,
        body: Array.isArray(spec.body) ? deepClone(spec.body) : [{ type: 'cmd', op: 'move' }]
      };
    }
    if (spec.type === 'if') {
      return {
        type: 'if',
        condition: spec.condition || 'front_wall',
        thenBranch: Array.isArray(spec.thenBranch) ? deepClone(spec.thenBranch) : [{ type: 'cmd', op: 'turn_right' }],
        elseBranch: Array.isArray(spec.elseBranch) ? deepClone(spec.elseBranch) : [{ type: 'cmd', op: 'move' }]
      };
    }
    return { type: 'cmd', op: spec.op || 'move' };
  }

  /**
   * 自由プログラミング用のAST変更操作（追加・挿入・削除・移動・値変更）
   */
  function mutateProgramAst(program, action) {
    const cloned = assignNodeIds(deepClone(program || []));
    if (!action) return cloned;

    function findContainer(arr, targetId) {
      for (let i = 0; i < arr.length; i++) {
        const node = arr[i];
        if (node._id === targetId) {
          return { parentArray: arr, index: i, node: node };
        }
        if (node.type === 'loop' && Array.isArray(node.body)) {
          const hit = findContainer(node.body, targetId);
          if (hit) return hit;
        }
        if (node.type === 'if') {
          if (Array.isArray(node.thenBranch)) {
            const hitThen = findContainer(node.thenBranch, targetId);
            if (hitThen) return hitThen;
          }
          if (Array.isArray(node.elseBranch)) {
            const hitElse = findContainer(node.elseBranch, targetId);
            if (hitElse) return hitElse;
          }
        }
      }
      return null;
    }

    if (action.type === 'append_root') {
      cloned.push(createAstNode(action.nodeSpec));
      return assignNodeIds(cloned);
    }

    const found = action.nodeId ? findContainer(cloned, action.nodeId) : null;
    if (!found) return cloned;

    if (action.type === 'replace_value') {
      if (found.node.type === 'cmd') found.node.op = action.newValue;
      else if (found.node.type === 'loop') found.node.count = action.newValue;
      else if (found.node.type === 'if') found.node.condition = action.newValue;
    } else if (action.type === 'delete_node') {
      found.parentArray.splice(found.index, 1);
    } else if (action.type === 'move_node') {
      const nextIdx = found.index + (action.delta || 0);
      if (nextIdx >= 0 && nextIdx < found.parentArray.length) {
        const tmp = found.parentArray[found.index];
        found.parentArray[found.index] = found.parentArray[nextIdx];
        found.parentArray[nextIdx] = tmp;
      }
    } else if (action.type === 'insert_after') {
      found.parentArray.splice(found.index + 1, 0, createAstNode(action.nodeSpec));
    } else if (action.type === 'append_child') {
      const branch = action.branchKey || 'body';
      if (!Array.isArray(found.node[branch])) found.node[branch] = [];
      found.node[branch].push(createAstNode(action.nodeSpec));
    }
    return assignNodeIds(cloned);
  }

  /**
   * ワープ土管のペア座標テーブルを構築する
   */
  function buildWarpMap(grid) {
    const positions = {};
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const ch = grid[y][x];
        if (ch === '1' || ch === '2' || ch === '3' || ch === '4') {
          if (!positions[ch]) positions[ch] = [];
          positions[ch].push({ x: x, y: y });
        }
      }
    }
    const pairs = {};
    Object.keys(positions).forEach(function (ch) {
      const arr = positions[ch];
      if (arr.length >= 2) {
        pairs[arr[0].x + ',' + arr[0].y] = { x: arr[1].x, y: arr[1].y };
        pairs[arr[1].x + ',' + arr[1].y] = { x: arr[0].x, y: arr[0].y };
      }
    });
    return pairs;
  }

  function isWallTile(ch) {
    return ch === '#' || ch === 'B' || ch === 'I';
  }

  function isHazardTile(ch) {
    return ch === 'O' || ch === '^';
  }

  function getTile(grid, x, y) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
      return null;
    }
    return grid[y][x];
  }

  function cloneStateSnapshot(robot, grid, gearCollected) {
    return {
      x: robot.x,
      y: robot.y,
      dir: robot.dir,
      gearCollected: gearCollected,
      grid: grid.map(function (row) { return row.join(''); })
    };
  }

  /**
   * 条件分岐（センサー）の判定を行う
   */
  function evaluateCondition(condition, robot, grid, stage, gearCollected) {
    const d = DIRS[robot.dir];
    const fx = robot.x + d.dx;
    const fy = robot.y + d.dy;
    const front = getTile(grid, fx, fy);

    if (condition === 'front_hole') {
      return front === 'O' || front === '^';
    }
    if (condition === 'front_wall') {
      return front === null || isWallTile(front);
    }
    if (condition === 'front_breakable') {
      return front === 'B';
    }
    if (condition === 'near_gear') {
      if (gearCollected || !stage.gear) return false;
      const distX = Math.abs(stage.gear.x - robot.x);
      const distY = Math.abs(stage.gear.y - robot.y);
      return distX <= 1 && distY <= 1;
    }
    return false;
  }

  /**
   * 決定論的シミュレーター本体
   * プログラム全体を実行し、結果と全ステップのトレース配列を返す
   */
  function simulate(stage, programInput) {
    const program = assignNodeIds(deepClone(programInput || stage.program));
    const grid = stage.map.map(function (row) { return row.split(''); });
    const height = grid.length;
    const width = grid[0].length;
    const warpPairs = buildWarpMap(grid);
    const maxSteps = stage.maxSteps || 50;

    const robot = {
      x: stage.start.x,
      y: stage.start.y,
      dir: stage.start.dir
    };

    let gearCollected = false;
    let steps = 0;
    let evalCount = 0;
    const maxEvalCount = maxSteps * 8 + 40;
    const traces = [];
    let lastCmdNodeId = null;

    function checkGearAt(x, y) {
      if (!gearCollected && stage.gear && stage.gear.x === x && stage.gear.y === y) {
        gearCollected = true;
        return true;
      }
      return false;
    }

    // スタート地点にギアがある場合の初期回収チェック
    checkGearAt(robot.x, robot.y);

    function finishResult(status, reason, errorNodeId, errorType) {
      return {
        status: status, // 'clear' | 'fail'
        reason: reason,
        errorNodeId: errorNodeId || null,
        errorType: errorType || null, // 'wall' | 'hole' | 'spike' | 'timeout' | 'not_goal' | 'infinite'
        gearCollected: gearCollected,
        rank: status === 'clear' ? (gearCollected ? 'S' : 'A') : null,
        steps: steps,
        finalState: cloneStateSnapshot(robot, grid, gearCollected),
        traces: traces
      };
    }

    function applyTileEffects(events, moved) {
      const ch = getTile(grid, robot.x, robot.y);
      if (ch === 'G') {
        events.push('goal');
        return { outcome: 'goal' };
      }

      // ワープ土管（同じ場所にとどまる向き変え等では再発動しない）
      if (moved && (ch === '1' || ch === '2' || ch === '3' || ch === '4')) {
        const dest = warpPairs[robot.x + ',' + robot.y];
        if (dest) {
          robot.x = dest.x;
          robot.y = dest.y;
          events.push('warp');
          if (checkGearAt(robot.x, robot.y)) events.push('gear');
        }
      }

      // ワープ先、あるいは現在地の回転プレート
      const afterWarpCh = getTile(grid, robot.x, robot.y);
      if (afterWarpCh === 'C') {
        robot.dir = (robot.dir + 1) % 4;
        events.push('rotate_cw');
      } else if (afterWarpCh === 'W') {
        robot.dir = (robot.dir + 3) % 4;
        events.push('rotate_ccw');
      }

      // 歯車コンベア（U, R, D, L）
      const convMap = { U: 0, R: 1, D: 2, L: 3 };
      if (convMap[afterWarpCh] !== undefined) {
        const cd = DIRS[convMap[afterWarpCh]];
        const nx = robot.x + cd.dx;
        const ny = robot.y + cd.dy;
        const nextTile = getTile(grid, nx, ny);
        if (nextTile === null || isWallTile(nextTile)) {
          events.push('conveyor_blocked');
        } else {
          robot.x = nx;
          robot.y = ny;
          events.push('conveyor');
          if (nextTile === 'O') {
            events.push('fall');
            return { outcome: 'fail', errorType: 'hole', reason: 'コンベアに運ばれて落とし穴に落ちちゃった！' };
          }
          if (nextTile === '^') {
            events.push('spike');
            return { outcome: 'fail', errorType: 'spike', reason: 'コンベアの先がトゲだった！イタタ…！' };
          }
          if (checkGearAt(robot.x, robot.y)) events.push('gear');
          if (nextTile === 'G') {
            events.push('goal');
            return { outcome: 'goal' };
          }
          // コンベアで乗り込んだ先のワープ・回転プレートのみ追加発動
          if (nextTile === '1' || nextTile === '2' || nextTile === '3' || nextTile === '4') {
            const dest2 = warpPairs[robot.x + ',' + robot.y];
            if (dest2) {
              robot.x = dest2.x;
              robot.y = dest2.y;
              events.push('warp');
              if (checkGearAt(robot.x, robot.y)) events.push('gear');
            }
          } else if (nextTile === 'C') {
            robot.dir = (robot.dir + 1) % 4;
            events.push('rotate_cw');
          } else if (nextTile === 'W') {
            robot.dir = (robot.dir + 3) % 4;
            events.push('rotate_ccw');
          }
        }
      }

      return { outcome: 'ok' };
    }

    function executeCmd(node) {
      steps++;
      lastCmdNodeId = node._id;
      const prev = cloneStateSnapshot(robot, grid, gearCollected);
      const events = [];
      const d = DIRS[robot.dir];
      const op = node.op;
      let outcome = 'ok';
      let errorType = null;
      let reason = '';

      if (op === 'move') {
        const nx = robot.x + d.dx;
        const ny = robot.y + d.dy;
        const tile = getTile(grid, nx, ny);
        if (tile === null || isWallTile(tile)) {
          outcome = 'fail';
          errorType = 'wall';
          reason = tile === 'B' ? 'ヒビ割れカベにガツン！ドリルで壊さなきゃ！' : 'カベに激突！ゼンマイが飛び出ちゃった！';
          events.push('bump');
        } else if (tile === 'O') {
          robot.x = nx;
          robot.y = ny;
          outcome = 'fail';
          errorType = 'hole';
          reason = '落とし穴にストン！目が回っちゃうよ〜！';
          events.push('fall');
        } else if (tile === '^') {
          robot.x = nx;
          robot.y = ny;
          outcome = 'fail';
          errorType = 'spike';
          reason = 'トゲトゲを踏んじゃった！アチチチ！';
          events.push('spike');
        } else {
          robot.x = nx;
          robot.y = ny;
          events.push('move');
          if (checkGearAt(robot.x, robot.y)) events.push('gear');
        }
      } else if (op === 'turn_right') {
        robot.dir = (robot.dir + 1) % 4;
        events.push('turn_right');
      } else if (op === 'turn_left') {
        robot.dir = (robot.dir + 3) % 4;
        events.push('turn_left');
      } else if (op === 'wait') {
        events.push('wait');
      } else if (op === 'jump') {
        const midX = robot.x + d.dx;
        const midY = robot.y + d.dy;
        const landX = robot.x + d.dx * 2;
        const landY = robot.y + d.dy * 2;
        const midTile = getTile(grid, midX, midY);
        const landTile = getTile(grid, landX, landY);

        if (midTile === null || isWallTile(midTile) || landTile === null || isWallTile(landTile)) {
          // スプリング脚のバグ演出：壁に頭をぶつけて1ターン気絶（位置は変わらず時間ロス）
          events.push('stun');
        } else if (landTile === 'O') {
          robot.x = landX;
          robot.y = landY;
          outcome = 'fail';
          errorType = 'hole';
          reason = 'ジャンプの着地点が落とし穴だった〜！';
          events.push('jump', 'fall');
        } else if (landTile === '^') {
          robot.x = landX;
          robot.y = landY;
          outcome = 'fail';
          errorType = 'spike';
          reason = 'ジャンプの着地点がトゲだった〜！';
          events.push('jump', 'spike');
        } else {
          robot.x = landX;
          robot.y = landY;
          events.push('jump');
          if (checkGearAt(robot.x, robot.y)) events.push('gear');
        }
      } else if (op === 'drill') {
        const nx = robot.x + d.dx;
        const ny = robot.y + d.dy;
        const tile = getTile(grid, nx, ny);
        if (tile === 'B') {
          grid[ny][nx] = '.';
          robot.x = nx;
          robot.y = ny;
          events.push('drill_break');
          if (checkGearAt(robot.x, robot.y)) events.push('gear');
        } else {
          // ドリル腕のバグ演出：何もない空間で空振りして時間ロス
          events.push('drill_whiff');
        }
      } else if (op === 'turbo') {
        const x1 = robot.x + d.dx;
        const y1 = robot.y + d.dy;
        const t1 = getTile(grid, x1, y1);
        if (t1 === null || isWallTile(t1)) {
          outcome = 'fail';
          errorType = 'wall';
          reason = 'ターボ加速でカベにドカーン！止まれないよ〜！';
          events.push('turbo_crash');
        } else {
          // 1マス目通過（穴やトゲは勢いで飛び越え、床なら通過してギア判定）
          if (!isHazardTile(t1)) {
            if (checkGearAt(x1, y1)) events.push('gear');
          } else {
            events.push('turbo_skim');
          }
          // 途中でゴールの上を通過したらゴールで止まれる（ご褒美ハック！）
          if (t1 === 'G') {
            robot.x = x1;
            robot.y = y1;
            events.push('turbo', 'goal');
            outcome = 'goal';
          } else {
            const x2 = robot.x + d.dx * 2;
            const y2 = robot.y + d.dy * 2;
            const t2 = getTile(grid, x2, y2);
            if (t2 === null || isWallTile(t2)) {
              robot.x = x1;
              robot.y = y1;
              if (isHazardTile(t1)) {
                outcome = 'fail';
                errorType = t1 === 'O' ? 'hole' : 'spike';
                reason = 'ターボでカベに跳ね返されて危険マスへ落ちちゃった！';
                events.push('turbo_crash');
              } else {
                outcome = 'fail';
                errorType = 'wall';
                reason = 'ターボの勢いが余ってカベに激突！！';
                events.push('turbo_crash');
              }
            } else if (t2 === 'O') {
              robot.x = x2;
              robot.y = y2;
              outcome = 'fail';
              errorType = 'hole';
              reason = 'ターボで飛びすぎて落とし穴にダイブ！！';
              events.push('turbo', 'fall');
            } else if (t2 === '^') {
              robot.x = x2;
              robot.y = y2;
              outcome = 'fail';
              errorType = 'spike';
              reason = 'ターボでトゲの上に着地しちゃった！';
              events.push('turbo', 'spike');
            } else {
              robot.x = x2;
              robot.y = y2;
              events.push('turbo');
              if (checkGearAt(robot.x, robot.y)) events.push('gear');
            }
          }
        }
      } else if (op === 'magnet') {
        let pulledSomething = false;
        // 1. 周囲8マス＋現在マスの黄金ギアを磁力回収
        if (!gearCollected && stage.gear) {
          const dxG = Math.abs(stage.gear.x - robot.x);
          const dyG = Math.abs(stage.gear.y - robot.y);
          if (dxG <= 1 && dyG <= 1) {
            gearCollected = true;
            pulledSomething = true;
            events.push('magnet_gear');
          }
        }
        // 2. 前方1〜3マス以内の鉄ブロック 'I' を1マス手前に引き寄せる
        for (let dist = 1; dist <= 3; dist++) {
          const tx = robot.x + d.dx * dist;
          const ty = robot.y + d.dy * dist;
          const tt = getTile(grid, tx, ty);
          if (tt === null || tt === '#' || tt === 'B') {
            break;
          }
          if (tt === 'I') {
            if (dist === 1) {
              // 目の前にある鉄ブロック：足元と反対側には引けないため、もし自分の後ろが空いていなければ引き寄せ不可だが、
              // 目の前の鉄ブロック自体を磁石パワーで自分の足元に引き込み「鉄足場化」または前を空ける演出は？
              // 仕様：「目の前の鉄ブロックを引き寄せて足場にする」
              // もし目の前（距離1）にあるのが鉄ブロックで、ロボットの「2マス先」等ではなく
              // 目の前が穴でその奥が鉄（dist >= 2）なら穴に落ちて 'F' になる。
              // dist === 1 のときは動かせない（自分の位置に引くことはできないため）として空振りにするか、
              // あるいは目の前が鉄のときはロボットと入れ替わるように引き寄せると道が開く！
              // 安全のため dist >= 2 なら1マス手前へ引き寄せ、dist === 1 のときは磁力で鉄ブロックを「引き抜いて後ろへ回す」のは混乱を招くので、
              // 「鉄ブロックは1マス以上離れた位置（主に穴の向こう）から引き寄せて手前の穴を埋める／道を変える」と明確化する。
              events.push('magnet_clank');
            } else {
              const px = robot.x + d.dx * (dist - 1);
              const py = robot.y + d.dy * (dist - 1);
              const pt = getTile(grid, px, py);
              if (pt === 'O' || pt === '^') {
                grid[ty][tx] = '.';
                grid[py][px] = 'F'; // 鉄ブロックが穴やトゲを埋めて安全な鉄足場に！
                pulledSomething = true;
                events.push('magnet_bridge');
              } else if (pt === '.') {
                grid[ty][tx] = '.';
                grid[py][px] = 'I';
                pulledSomething = true;
                events.push('magnet_pull');
              }
            }
            break;
          }
        }
        if (!pulledSomething && events.length === 0) {
          events.push('magnet_whiff');
        }
      }

      if (outcome === 'ok') {
        const moved = (prev.x !== robot.x || prev.y !== robot.y);
        const eff = applyTileEffects(events, moved);
        outcome = eff.outcome;
        if (eff.errorType) errorType = eff.errorType;
        if (eff.reason) reason = eff.reason;
      }

      const next = cloneStateSnapshot(robot, grid, gearCollected);
      traces.push({
        step: steps,
        kind: 'cmd',
        nodeId: node._id,
        op: op,
        prevState: prev,
        nextState: next,
        events: events,
        outcome: outcome,
        errorType: errorType,
        reason: reason
      });

      if (outcome === 'goal') {
        return { halted: true, result: finishResult('clear', 'ゴールにとうちゃく！', null, null) };
      }
      if (outcome === 'fail') {
        return { halted: true, result: finishResult('fail', reason, node._id, errorType) };
      }
      if (steps >= maxSteps) {
        return {
          halted: true,
          result: finishResult('fail', 'ゼンマイが切れちゃった！（ステップじょうげん）', node._id, 'timeout')
        };
      }
      return { halted: false };
    }

    function runBlock(nodes) {
      for (let i = 0; i < nodes.length; i++) {
        evalCount++;
        if (evalCount > maxEvalCount) {
          return {
            halted: true,
            result: finishResult('fail', 'からくりが空回りして止まらなくなっちゃった！', lastCmdNodeId || nodes[i]._id, 'infinite')
          };
        }
        const node = nodes[i];
        if (node.type === 'cmd') {
          const res = executeCmd(node);
          if (res.halted) return res;
        } else if (node.type === 'loop') {
          if (node.count === 'until_goal') {
            let guard = 0;
            while (guard < maxSteps + 5) {
              guard++;
              const stepsBefore = steps;
              const res = runBlock(node.body || []);
              if (res.halted) return res;
              if (steps === stepsBefore) {
                // ループ内で1つも実アクションが起きなかった＝無限空ループ防止
                return {
                  halted: true,
                  result: finishResult('fail', 'センサーが反応せず、ずーっと空回りしちゃった！', node._id, 'infinite')
                };
              }
            }
          } else {
            const count = Number(node.count) || 1;
            for (let c = 0; c < count; c++) {
              const res = runBlock(node.body || []);
              if (res.halted) return res;
            }
          }
        } else if (node.type === 'if') {
          const matched = evaluateCondition(node.condition, robot, grid, stage, gearCollected);
          traces.push({
            step: steps,
            kind: 'if',
            nodeId: node._id,
            condition: node.condition,
            matched: matched,
            prevState: cloneStateSnapshot(robot, grid, gearCollected),
            nextState: cloneStateSnapshot(robot, grid, gearCollected),
            events: [matched ? 'cond_true' : 'cond_false'],
            outcome: 'ok'
          });
          if (matched && Array.isArray(node.thenBranch) && node.thenBranch.length > 0) {
            const res = runBlock(node.thenBranch);
            if (res.halted) return res;
          } else if (!matched && Array.isArray(node.elseBranch) && node.elseBranch.length > 0) {
            const res = runBlock(node.elseBranch);
            if (res.halted) return res;
          }
        }
      }
      return { halted: false };
    }

    const runRes = runBlock(program);
    if (runRes.halted) {
      return runRes.result;
    }

    // 最後まで実行したがゴール未到達
    const finalNodeId = lastCmdNodeId || (program.length > 0 ? program[program.length - 1]._id : null);
    return finishResult('fail', 'プログラムが最後まで動いたけど、ゴールに着かなかったよ！', finalNodeId, 'not_goal');
  }

  const Engine = {
    DIRS: DIRS,
    PARTS: PARTS,
    CHIPS: CHIPS,
    CMD_META: CMD_META,
    CONDITION_META: CONDITION_META,
    WORLD_THEMES: WORLD_THEMES,
    deepClone: deepClone,
    assignNodeIds: assignNodeIds,
    collectEditableNodes: collectEditableNodes,
    getAvailableOps: getAvailableOps,
    getAvailableConditions: getAvailableConditions,
    getEditCandidates: getEditCandidates,
    applySingleEdit: applySingleEdit,
    applyPatches: applyPatches,
    getStageProgrammingRule: getStageProgrammingRule,
    mutateProgramAst: mutateProgramAst,
    simulate: simulate
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Engine;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Engine = Engine;
  }
})(typeof window !== 'undefined' ? window : globalThis);
