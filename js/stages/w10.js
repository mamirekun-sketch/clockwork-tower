/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第10階層：W10（Stage 91〜100：最上階クロックワーク・タワー頂上決戦・総集編）
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
    // W10-1 (intro, 6x6) - 最上階へのとびら：ドリル＆回転プレート＆センサー
    {
      id: 91, world: 10, stageInWorld: 1, title: '最上階への とびら', role: 'intro',
      hint: 'ついに 最上階！ヒビカベを くだいて プレートで まがった さきの トゲに 注意！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 28,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '######',
        '#.BC.#',
        '#.#.##',
        '#.#..#',
        '#G..^#',
        '######'
      ],
      program: [
        L('until_goal', [
          IF('front_breakable', [C('drill')], [
            IF('front_wall', [C('turn_left')], [C('move')])
          ])
        ])
      ]
    },

    // W10-2 (intro, 6x6) - ターボ・ダイブ！大時計の橋
    {
      id: 92, world: 10, stageInWorld: 2, title: 'ターボ・ダイブ！大時計の橋', role: 'intro',
      hint: 'トゲを 一気に とびこえて コンベアに のろう！タイミングを よく 見てね。',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 20,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '######',
        '#....#',
        '#.^R.#',
        '#.##.#',
        '#...G#',
        '######'
      ],
      program: [
        C('move'),
        C('turn_right'),
        L(2, [C('move')])
      ]
    },

    // W10-3 (multi, 7x7) - 鉄ブロックとマグネットの天秤
    {
      id: 93, world: 10, stageInWorld: 3, title: 'てつブロックと マグネットの天秤', role: 'multi',
      hint: 'さいしょに じしゃくで 鉄ブロックを あなに おとせば、あとは じどうで ゴール！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 32,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#.OI.B#',
        '#.###.#',
        '#....G#',
        '#.....#',
        '#######'
      ],
      program: [
        C('wait'),
        L('until_goal', [
          IF('front_breakable', [C('drill')], [
            IF('front_wall', [C('turn_right')], [C('move')])
          ])
        ])
      ]
    },

    // W10-4 (multi, 7x7) - 回転コンベアのらせん階段
    {
      id: 94, world: 10, stageInWorld: 4, title: 'かいてんコンベアの らせん階段', role: 'multi',
      hint: 'コンベアに のったあと、あなの まえで ドリルが 空回りしてるみたい！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 32,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 3, y: 5 },
      map: [
        '#######',
        '#.R..D#',
        '#####.#',
        '#....O#',
        '#.....#',
        '#G...C#',
        '#######'
      ],
      program: [
        L('until_goal', [
          IF('front_hole', [C('drill')], [
            IF('front_wall', [C('turn_right')], [C('move')])
          ])
        ])
      ]
    },

    // W10-5 (multi, 7x7) - 二重ワープとセンサー判断
    {
      id: 95, world: 10, stageInWorld: 5, title: '二重ワープと センサー判断', role: 'multi',
      hint: 'ワープさきには トゲと ギアが まってるよ！センサーの 種類を しっかり 見きわめて！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '#######',
        '#1..B2#',
        '#.#^#.#',
        '#2...G#',
        '#.###.#',
        '#.1...#',
        '#######'
      ],
      program: [
        L('until_goal', [
          IF('near_gear', [C('magnet')]),
          IF('front_breakable', [C('move')], [
            IF('front_wall', [C('turn_right')], [C('move')])
          ])
        ])
      ]
    },

    // W10-6 (hack, 8x8) - 黄金のからくり神ハック（複数解法＆ショートカット）
    {
      id: 96, world: 10, stageInWorld: 6, title: '黄金の からくり神ハック', role: 'hack',
      hint: 'トゲの むこうの ワープ土管に とびこめる！？ 大たんに さいしょの動きを かえてみよう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 34,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 5, y: 1 },
      map: [
        '########',
        '#1..B.G#',
        '#.####.#',
        '#.^1...#',
        '#.####.#',
        '#..O...#',
        '#.....^#',
        '########'
      ],
      program: [
        C('move'),
        L('until_goal', [
          IF('front_breakable', [C('drill')], [
            IF('front_hole', [C('jump')], [C('move')])
          ])
        ])
      ]
    },

    // W10-7 (hack, 8x8) - ネスト×センサーの大歯車回路
    {
      id: 97, world: 10, stageInWorld: 7, title: 'ネスト×センサーの 大歯車回路', role: 'hack',
      hint: 'くりかえしの 回数が あわないみたい！2重の ループが どう動くか 観察しよう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 38,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 4, y: 3 },
      map: [
        '########',
        '#..B...#',
        '#.##...#',
        '#.##...#',
        '#...G..#',
        '#......#',
        '#......#',
        '########'
      ],
      program: [
        L(2, [
          L(3, [IF('front_breakable', [C('drill')], [C('move')])]),
          C('turn_right')
        ])
      ]
    },

    // W10-8 (hack, 8x8) - ぜんまい騎士の試練の間（鉄＋穴＋ワープ＋ヒビカベ）
    {
      id: 98, world: 10, stageInWorld: 8, title: 'ぜんまい騎士の 試練の間', role: 'hack',
      hint: '鉄ブロック、ワープ、ヒビカベ、すべてが そろう 試練！1カ所だけ パーツを いれかえよう。',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#1..B.C#',
        '#.##.^.#',
        '#..#..O#',
        '#..#.#.#',
        '#..#...#',
        '#.OI.1G#',
        '########'
      ],
      program: [
        C('move'),
        L('until_goal', [
          IF('near_gear', [C('magnet')]),
          IF('front_breakable', [C('drill')], [
            IF('front_hole', [C('jump')], [C('move')])
          ])
        ])
      ]
    },

    // W10-9 (boss, 8x8) - 時計塔の守護者・大ぜんまい
    {
      id: 99, world: 10, stageInWorld: 9, title: '時計塔の守護者・大ぜんまい', role: 'boss',
      hint: 'コンベア、ワープ、かいてんプレートが まわりつづける 大装置！センサーループの 1カ所を なおせ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 2, y: 5 },
      map: [
        '########',
        '#.R..1.#',
        '######.#',
        '#1..B.C#',
        '#.####O#',
        '#G.B...#',
        '########',
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

    // W10-10 (boss, 8x8) - 最終ボス：クロックワーク・タワー頂上！
    {
      id: 100, world: 10, stageInWorld: 10, title: '最終ボス：クロックワーク・タワー頂上！', role: 'boss',
      hint: 'ついに 最上階の 頂上！ぜんまいの すべてを とぎすませて、黄金ギアと ゴールを つかみとれ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_ALL, allowLoopEdit: true, maxSteps: 48,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#1..B.C#',
        '#.##.^.#',
        '#..#..O#',
        '#..#...#',
        '#GB.2.2#',
        '#.OI..1#',
        '########'
      ],
      program: [
        C('magnet'),
        L('until_goal', [
          IF('near_gear', [C('magnet')]),
          IF('front_breakable', [C('drill')], [
            IF('front_hole', [C('jump')], [
              IF('front_wall', [C('turn_left')], [C('move')])
            ])
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
