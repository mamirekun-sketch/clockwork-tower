/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第9階層：W9（Stage 81〜90：ゴールまでくりかえす＋複合センサー自律制御）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };
  var L = function (count, body) { return { type: 'loop', count: count, body: body }; };
  var IF = function (condition, thenBranch, elseBranch) {
    return { type: 'if', condition: condition, thenBranch: thenBranch || [], elseBranch: elseBranch || [] };
  };

  var CONDS_ALL = ['front_hole', 'front_wall', 'front_breakable', 'near_gear'];
  var PARTS_ALL = ['spring', 'drill', 'turbo', 'magnet'];

  var stages = [
    // W9-1 (intro, 6x5) - until_goal 入門：ゴールまで壁で右折
    {
      id: 81, world: 9, stageInWorld: 1, title: 'ゴールまで くりかえせ！', role: 'intro',
      hint: '「G」のブロックが ゴールまで ずっと くりかえすよ！曲がる向きを なおそう。',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 25,
      start: { x: 1, y: 3, dir: 0 },
      gear: { x: 3, y: 1 },
      map: [
        '######',
        '#...G#',
        '#.####',
        '#....#',
        '######'
      ],
      program: [
        L('until_goal', [
          IF('front_wall', [C('turn_left')], [C('move')])
        ])
      ]
    },

    // W9-2 (intro, 6x6) - until_goal + front_hole
    {
      id: 82, world: 9, stageInWorld: 2, title: 'あなを とびこえ つきすすめ', role: 'intro',
      hint: 'あなの まえで ドリルを ふりまわしてる！ほんとうに ひつような パーツは？',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 22,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '######',
        '#....#',
        '#O####',
        '#.O.G#',
        '#....#',
        '######'
      ],
      program: [
        L('until_goal', [
          IF('front_hole', [C('drill')], [C('move')])
        ])
      ]
    },

    // W9-3 (multi, 6x6) - until_goal + 複合センサー (front_breakable & front_wall)
    {
      id: 83, world: 9, stageInWorld: 3, title: 'ヒビカベを くだく ジリツロボ', role: 'multi',
      hint: 'ヒビカベを 見つけたら ドリルで くだくか、ジャンプで とびこえちゃおう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 28,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 3, y: 1 },
      map: [
        '######',
        '#.B.G#',
        '#.##.#',
        '#..#.#',
        '#..#.#',
        '######'
      ],
      program: [
        L('until_goal', [
          IF('front_breakable', [C('move')], [
            IF('front_wall', [C('turn_right')], [C('move')])
          ])
        ])
      ]
    },

    // W9-4 (multi, 7x7) - until_goal + コンベアと回転プレート
    {
      id: 84, world: 9, stageInWorld: 4, title: 'コンベアと かいてんの じどうルート', role: 'multi',
      hint: 'コンベアの さきの くるくるプレートで 南をむくよ！壁の まえで どっちに曲がる？',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 30,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 4, y: 3 },
      map: [
        '#######',
        '#.R.C.#',
        '####.##',
        '#.GB.^#',
        '#######',
        '#.....#',
        '#######'
      ],
      program: [
        L('until_goal', [
          IF('front_breakable', [C('drill')], [
            IF('front_wall', [C('turn_left')], [C('move')])
          ])
        ])
      ]
    },

    // W9-5 (multi, 7x7) - until_goal + マグネットレーダー＋壁ターン
    {
      id: 85, world: 9, stageInWorld: 5, title: 'マグネット・レーダー始動！', role: 'multi',
      hint: 'トゲのうえの 黄金ギア！ギアセンサーが 光ったら マグネットで ひきよせよう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 32,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 2, y: 2 },
      map: [
        '#######',
        '#....G#',
        '#.^##.#',
        '#.#...#',
        '#.#.###',
        '#.....#',
        '#######'
      ],
      program: [
        L('until_goal', [
          IF('near_gear', [C('turn_right')], [
            IF('front_wall', [C('turn_right')], [C('move')])
          ])
        ])
      ]
    },

    // W9-6 (hack, 7x7) - ターボ・ショートカット＆迂回両立
    {
      id: 86, world: 9, stageInWorld: 6, title: 'トゲごえ ターボ・ハック！', role: 'hack',
      hint: 'トゲのうえも ターボや ジャンプなら 一気にとびこせる！？ さいしょの 一歩をかえよう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 30,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.^..G#',
        '#.###.#',
        '#.....#',
        '#######'
      ],
      program: [
        C('move'),
        L('until_goal', [
          IF('front_wall', [C('turn_right')], [C('move')])
        ])
      ]
    },

    // W9-7 (hack, 8x8) - マグネットで鉄ブロックを穴へ引き寄せて橋にする
    {
      id: 87, world: 9, stageInWorld: 7, title: 'てつブロック橋の じどう運転', role: 'hack',
      hint: 'あなの むこうに 鉄ブロックがある！マグネットで ひきよせて 橋にしちゃおう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 36,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 4, y: 3 },
      map: [
        '########',
        '#......#',
        '#.####.#',
        '#.OI...#',
        '#.####.#',
        '#.....G#',
        '#......#',
        '########'
      ],
      program: [
        C('move'),
        L('until_goal', [
          IF('front_wall', [C('turn_right')], [C('move')])
        ])
      ]
    },

    // W9-8 (hack, 8x8) - ワープ土管2種＋複合センサー
    {
      id: 88, world: 9, stageInWorld: 8, title: 'ワープ回路の ぜんまい迷路', role: 'hack',
      hint: 'ヒビカベを ジャンプすると あなに 落ちちゃう！ドリルで しっかり こわそう。',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 3, y: 5 },
      map: [
        '########',
        '#1..BO2#',
        '#.####.#',
        '#......#',
        '######.#',
        '#2..B.G#',
        '#.1###.#',
        '########'
      ],
      program: [
        L('until_goal', [
          IF('front_breakable', [C('jump')], [
            IF('front_hole', [C('jump')], [C('move')])
          ])
        ])
      ]
    },

    // W9-9 (boss, 8x8) - 4センサー＋回転プレートのからくり庭園
    {
      id: 89, world: 9, stageInWorld: 9, title: 'からくり庭園の ジリツ警備', role: 'boss',
      hint: 'せまい 庭園を うまく まわりきろう！かべの まえで 曲がるむきに 気をつけて！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 5, y: 3 },
      map: [
        '########',
        '#..B.C.#',
        '#.###..#',
        '#.#...##',
        '#.#..O.#',
        '#.#....#',
        '#.#G...#',
        '########'
      ],
      program: [
        L('until_goal', [
          IF('front_breakable', [C('drill')], [
            IF('front_hole', [C('jump')], [
              IF('front_wall', [C('turn_left')], [C('move')])
            ])
          ])
        ])
      ]
    },

    // W9-10 (boss, 8x8) - 第9層ボス：無限ぜんまいの時計塔コア
    {
      id: 90, world: 9, stageInWorld: 10, title: '第9層ボス：自律制御の時計塔コア', role: 'boss',
      hint: 'すべての センサーと パーツが かみあう！ヒビカベを どう突破するかが カギ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 42,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#1..B.C#',
        '#.##.^.#',
        '#..#..O#',
        '##.#.#.#',
        '#..O...#',
        '#.1#..G#',
        '########'
      ],
      program: [
        L('until_goal', [
          IF('near_gear', [C('magnet')]),
          IF('front_breakable', [C('move')], [
            IF('front_hole', [C('jump')], [C('move')])
          ])
        ])
      ]
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
