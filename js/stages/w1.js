/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第1階層：W1（Stage 1〜10：順次処理①・基本移動）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };

  var stages = [
    // W1-1 (intro, 5x5)
    {
      id: 1, world: 1, stageInWorld: 1, title: 'はじめてのいっぽ', role: 'intro',
      hint: '2ばんめの「みぎ」が バグってるみたい！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 20,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '#####',
        '#..##',
        '#..G#',
        '#.O.#',
        '#####'
      ],
      program: [C('move'), C('turn_right'), C('move'), C('move')]
    },
    // W1-2 (intro, 5x5)
    {
      id: 2, world: 1, stageInWorld: 2, title: 'まがりかどのわな', role: 'intro',
      hint: 'おとしあなに おちないように まがろう！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 20,
      start: { x: 1, y: 3, dir: 0 },
      gear: { x: 1, y: 1 },
      map: [
        '#####',
        '#..G#',
        '#.O.#',
        '#...#',
        '#####'
      ],
      program: [C('move'), C('move'), C('turn_left'), C('move'), C('move')]
    },
    // W1-3 (multi, 6x6)
    {
      id: 3, world: 1, stageInWorld: 3, title: 'ふたつのみち', role: 'multi',
      hint: 'したから まがる(A)か、うえから ギアをとる(S)か！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '######',
        '#....#',
        '#..G.#',
        '#....#',
        '#.O..#',
        '######'
      ],
      program: [C('move'), C('move'), C('turn_right'), C('move'), C('move'), C('turn_left')]
    },
    // W1-4 (multi, 6x6)
    {
      id: 4, world: 1, stageInWorld: 4, title: 'つみきのさんぽみち', role: 'multi',
      hint: 'どこで ひとやすみ してるのかな？',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '######',
        '#..G.#',
        '#....#',
        '#..O.#',
        '#....#',
        '######'
      ],
      program: [C('move'), C('turn_left'), C('move'), C('move'), C('wait'), C('turn_right'), C('move')]
    },
    // W1-5 (multi, 6x6)
    {
      id: 5, world: 1, stageInWorld: 5, title: 'あなあきブリッジ', role: 'multi',
      hint: 'さいごの 1ぽが たりないみたい！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 3, y: 1 },
      map: [
        '######',
        '#...G#',
        '#.OO.#',
        '#....#',
        '#....#',
        '######'
      ],
      program: [C('turn_left'), C('move'), C('turn_right'), C('move'), C('move'), C('turn_right')]
    },
    // W1-6 (hack, 7x7)
    {
      id: 6, world: 1, stageInWorld: 6, title: 'きけんないっぽさき', role: 'hack',
      hint: 'ギアのあと、カベに ぶつかるまえに まがれ！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 1, y: 2 },
      map: [
        '#######',
        '#O...O#',
        '#..G..#',
        '#.#.#.#',
        '#.###.#',
        '#.....#',
        '#######'
      ],
      program: [C('move'), C('move'), C('move'), C('turn_left'), C('move'), C('move')]
    },
    // W1-7 (hack, 7x7)
    {
      id: 7, world: 1, stageInWorld: 7, title: 'ぐるっと大まわり', role: 'hack',
      hint: 'うっかり うえの カベに つっこんでるぞ！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '#######',
        '#...O.#',
        '#.#.#.#',
        '#..G..#',
        '#.###.#',
        '#.....#',
        '#######'
      ],
      program: [C('move'), C('move'), C('turn_left'), C('move'), C('move'), C('wait')]
    },
    // W1-8 (hack, 7x7)
    {
      id: 8, world: 1, stageInWorld: 8, title: 'ジグザグ・クロック', role: 'hack',
      hint: 'ギアをとったあとの むきに ちゅうい！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#..O..#',
        '#.#.#.#',
        '#....G#',
        '#.#.O.#',
        '#.....#',
        '#######'
      ],
      program: [C('move'), C('move'), C('turn_left'), C('move'), C('move'), C('turn_left'), C('move'), C('move')]
    },
    // W1-9 (boss, 8x8)
    {
      id: 9, world: 1, stageInWorld: 9, title: 'つみき回廊のまもりびと', role: 'boss',
      hint: 'とおいゴールへ、かどで ただしく まがろう！',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 35,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 1, y: 3 },
      map: [
        '########',
        '#O....O#',
        '#.####.#',
        '#....G.#',
        '#.##.#.#',
        '#......#',
        '#..OO..#',
        '########'
      ],
      program: [C('move'), C('move'), C('turn_left'), C('move'), C('move'), C('move'), C('move')]
    },
    // W1-10 (boss, 8x8)
    {
      id: 10, world: 1, stageInWorld: 10, title: '第1層ボス：おっきなぜんまい門', role: 'boss',
      hint: '第1層の さいしゅうテスト！ギアをとったら どっちにまがる？',
      availableParts: [], availableConditions: [], allowLoopEdit: false, maxSteps: 35,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 6 },
      map: [
        '########',
        '#..O...#',
        '#.##.#.#',
        '#....G.#',
        '#.##..##',
        '#..O..##',
        '#......#',
        '########'
      ],
      program: [C('move'), C('move'), C('move'), C('move'), C('turn_right'), C('move'), C('move'), C('move')]
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
