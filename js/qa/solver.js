/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 全ステージ自動検証ソルバー（js/qa/solver.js）
 *
 * 3つの数学的合格条件を全数探索で検証する：
 *   1. 無修正状態（初期プログラム）で100%ゴール失敗すること
 *   2. 任意の1パネルのみ書き換えでゴール到達解（Aランク以上）が1通り以上存在すること
 *   3. 任意の1パネルのみ書き換えで黄金のギア回収＋ゴール到達解（Sランク：神ハック）が1通り以上存在すること
 *
 * CLI実行例:
 *   node js/qa/solver.js w1
 *   node js/qa/solver.js all
 */
(function (root) {
  'use strict';

  var EngineRef = (typeof require === 'function' && typeof module !== 'undefined' && module.exports)
    ? require('../engine.js')
    : (root.BugSweeper && root.BugSweeper.Engine);

  /**
   * ステージデータの構造整合性チェック
   */
  function validateStructure(stage) {
    var errors = [];
    if (!stage || typeof stage !== 'object') {
      return ['ステージオブジェクトが不正です'];
    }
    if (!Array.isArray(stage.map) || stage.map.length < 4 || stage.map.length > 10) {
      errors.push('map の行数が範囲外です');
      return errors;
    }
    var h = stage.map.length;
    var w = stage.map[0].length;
    var goalCount = 0;
    var warps = {};
    for (var y = 0; y < h; y++) {
      if (stage.map[y].length !== w) {
        errors.push('map の行 ' + y + ' の幅が不一致です');
      }
      for (var x = 0; x < stage.map[y].length; x++) {
        var ch = stage.map[y][x];
        if (ch === 'G') goalCount++;
        if (ch === '1' || ch === '2' || ch === '3' || ch === '4') {
          warps[ch] = (warps[ch] || 0) + 1;
        }
      }
    }
    if (goalCount !== 1) {
      errors.push('ゴール G の数が ' + goalCount + ' 個です（1個である必要があります）');
    }
    Object.keys(warps).forEach(function (k) {
      if (warps[k] !== 2) {
        errors.push('ワープ土管 ' + k + ' の数が ' + warps[k] + ' 個です（ペアで2個必要）');
      }
    });
    if (!stage.start || stage.start.x < 0 || stage.start.x >= w || stage.start.y < 0 || stage.start.y >= h) {
      errors.push('start 座標が盤外です');
    } else {
      var st = stage.map[stage.start.y][stage.start.x];
      if (st === '#' || st === 'O' || st === '^' || st === 'B' || st === 'I') {
        errors.push('start 座標が障害物・危険マス (' + st + ') の上です');
      }
    }
    if (!stage.gear || stage.gear.x < 0 || stage.gear.x >= w || stage.gear.y < 0 || stage.gear.y >= h) {
      errors.push('gear 座標が盤外または未定義です');
    } else {
      var gt = stage.map[stage.gear.y][stage.gear.x];
      if (gt === '#' || gt === 'B' || gt === 'I') {
        errors.push('gear 座標が壁 (' + gt + ') の中です');
      }
    }
    if (!Array.isArray(stage.program) || stage.program.length === 0) {
      errors.push('program が空です');
    }
    return errors;
  }

  /**
   * 1ステージの完全検証
   */
  function verifyStage(stage, engine) {
    var eng = engine || EngineRef;
    var structErrors = validateStructure(stage);
    if (structErrors.length > 0) {
      return {
        id: stage ? stage.id : -1,
        passed: false,
        structErrors: structErrors,
        unmodifiedFailed: false,
        clearSolutions: [],
        sRankSolutions: []
      };
    }

    var clonedProg = eng.assignNodeIds(eng.deepClone(stage.program));
    var baseResult = eng.simulate(stage, clonedProg);
    var unmodifiedFailed = (baseResult.status === 'fail');

    var editableNodes = eng.collectEditableNodes(clonedProg);
    var clearSolutions = [];
    var sRankSolutions = [];

    for (var i = 0; i < editableNodes.length; i++) {
      var entry = editableNodes[i];
      var candidates = eng.getEditCandidates(stage, entry.node);
      for (var j = 0; j < candidates.length; j++) {
        var cand = candidates[j];
        var editedProg = eng.applySingleEdit(clonedProg, entry.nodeId, cand.value);
        var res = eng.simulate(stage, editedProg);
        if (res.status === 'clear') {
          var sol = {
            nodeId: entry.nodeId,
            kind: entry.kind,
            from: entry.kind === 'cmd' ? entry.node.op : (entry.kind === 'loop' ? entry.node.count : entry.node.condition),
            to: cand.value,
            rank: res.rank,
            steps: res.steps
          };
          clearSolutions.push(sol);
          if (res.rank === 'S') {
            sRankSolutions.push(sol);
          }
        }
      }
    }

    var passed = unmodifiedFailed && clearSolutions.length > 0 && sRankSolutions.length > 0;

    return {
      id: stage.id,
      world: stage.world,
      stageInWorld: stage.stageInWorld,
      title: stage.title,
      passed: passed,
      structErrors: [],
      unmodifiedFailed: unmodifiedFailed,
      unmodifiedReason: baseResult.reason,
      unmodifiedErrorType: baseResult.errorType,
      clearSolutions: clearSolutions,
      sRankSolutions: sRankSolutions
    };
  }

  /**
   * 複数ステージの一括検証
   */
  function verifyStages(stages, engine) {
    var results = [];
    var passCount = 0;
    for (var i = 0; i < stages.length; i++) {
      var r = verifyStage(stages[i], engine);
      if (r.passed) passCount++;
      results.push(r);
    }
    return {
      total: stages.length,
      passed: passCount,
      failed: stages.length - passCount,
      allPassed: passCount === stages.length,
      results: results
    };
  }

  var Solver = {
    validateStructure: validateStructure,
    verifyStage: verifyStage,
    verifyStages: verifyStages
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Solver;

    // CLI直接実行時のエントリーポイント
    if (require.main === module) {
      var path = require('path');
      var fs = require('fs');
      var arg = process.argv[2] || 'all';
      var targets = [];
      if (arg === 'all') {
        for (var w = 1; w <= 10; w++) {
          var p = path.join(__dirname, '..', 'stages', 'w' + w + '.js');
          if (fs.existsSync(p)) targets.push(p);
        }
      } else {
        var single = path.join(__dirname, '..', 'stages', arg.endsWith('.js') ? arg : arg + '.js');
        if (!fs.existsSync(single)) {
          console.error('Stage file not found:', single);
          process.exit(1);
        }
        targets.push(single);
      }

      if (targets.length === 0) {
        console.error('No stage files found to verify.');
        process.exit(1);
      }

      var allStages = [];
      targets.forEach(function (filePath) {
        var loaded = require(filePath);
        if (Array.isArray(loaded)) {
          allStages = allStages.concat(loaded);
        }
      });

      var summary = verifyStages(allStages, EngineRef);
      console.log('=== Bug Sweeper Auto-Solver Verification ===');
      console.log('Target:', arg, '| Total Stages:', summary.total);
      summary.results.forEach(function (r) {
        var statusTag = r.passed ? '[PASS]' : '[FAIL]';
        if (r.structErrors.length > 0) {
          console.log(statusTag, 'Stage', r.id, ':', r.structErrors.join('; '));
        } else {
          var sEx = r.sRankSolutions[0]
            ? (r.sRankSolutions[0].nodeId + ': ' + r.sRankSolutions[0].from + ' -> ' + r.sRankSolutions[0].to + ' (' + r.sRankSolutions[0].steps + ' steps)')
            : 'NONE';
          var aEx = r.clearSolutions[0]
            ? (r.clearSolutions[0].nodeId + ': ' + r.clearSolutions[0].from + ' -> ' + r.clearSolutions[0].to)
            : 'NONE';
          console.log(
            statusTag,
            'S' + String(r.id).padStart(3, '0'),
            '(W' + r.world + '-' + r.stageInWorld + ')',
            r.title,
            '| BaseFail:', r.unmodifiedFailed ? 'OK' : 'NG(CLEARED!)',
            '| 1-Edit Clears:', r.clearSolutions.length,
            '| S-Rank Hacks:', r.sRankSolutions.length,
            '| A-Ex:', aEx,
            '| S-Ex:', sEx
          );
        }
      });
      console.log('Summary: ' + summary.passed + '/' + summary.total + ' PASSED');
      if (!summary.allPassed) {
        process.exit(2);
      }
    }
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Solver = Solver;
  }
})(typeof window !== 'undefined' ? window : globalThis);
