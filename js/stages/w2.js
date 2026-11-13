/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第2階層：W2（Stage 11〜20：順次処理②・跳躍と破壊）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };

  var stages = [
    // W2-1 (intro, 5x5) - スプリング脚初登場
    {
      id: 11, world: 2, stageInWorld: 1, title: 'ピョーンとおとしあな', role: 'intro',
      hint: 'あなの まえで「ジャンプ」に なおしてみよう！',
      availableParts: ['spring'], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '#####',
        '#...#',
        '#.O.#',
        '#..G#',
        '#####'
      ],
      program: [C('move'), C('turn_right'), C('move'), C('wait'), C('wait'), C('wait')]
    },
    // W2-2 (intro, 6x6) - トゲ飛び越え
    {
      id: 12, world: 2, stageInWorld: 2, title: 'トゲトゲをとびこえろ', role: 'intro',
      hint: 'トゲのうえも ジャンプなら とびこえられるよ！',
      availableParts: ['spring'], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 1, y: 2 },
      map: [
        '######',
        '#....#',
        '#..G.#',
        '#.^..#',
        '#....#',
        '######'
      ],
      program: [C('move'), C('turn_right'), C('move'), C('move'), C('wait'), C('wait')]
    },
    // W2-3 (multi, 6x6) - ドリル腕初登場
    {
      id: 13, world: 2, stageInWorld: 3, title: 'ガガッとビスケットわり', role: 'multi',
      hint: 'ヒビのついたカベは「ドリル」で くだこう！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 3, y: 3 },
      map: [
        '######',
        '#....#',
        '#.##.#',
        '#.B.G#',
        '#....#',
        '######'
      ],
      program: [C('move'), C('turn_right'), C('jump'), C('move'), C('move'), C('wait')]
    },
    // W2-4 (multi, 6x6) - 空振りバグと迂回別解
    {
      id: 14, world: 2, stageInWorld: 4, title: 'からぶりドリルのなぞ', role: 'multi',
      hint: 'なにもない ところで ドリルしてるぞ！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 25,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '######',
        '#....#',
        '#..B.#',
        '#.O.G#',
        '#....#',
        '######'
      ],
      // (1,2)->move(2,2)->drill(whiff at (3,2)?) 2,2から前は(3,2)B！
      // 0:drill(whiff) -> 1:move(2,2) -> 2:drill(breaks 3,2 -> 3,2) -> 3:move(4,2 gear) -> 4:turn_right(south) -> 5:move(4,3 G)!
      // バグ: 2番目がjump(気絶して3でBに激突) または 3番目がjump(4,2飛び越え壁)
      program: [C('move'), C('drill'), C('move'), C('turn_right'), C('move'), C('wait')]
    },
    // W2-5 (multi, 7x7)
    {
      id: 15, world: 2, stageInWorld: 5, title: 'バネとドリルのきょうどう', role: 'multi',
      hint: 'ジャンプと ドリル、じゅんばんが だいじだよ！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.B.G.#',
        '#.^.#.#',
        '#.....#',
        '#######'
      ],
      // (1,5)->jump(1,3)->turn_right(east)->drill(2,3 B -> 2,3)->move(3,3 gear)->move(4,3 G)
      // バグ: 2番目がjumpになっている
      program: [C('jump'), C('turn_right'), C('jump'), C('move'), C('move'), C('wait')]
    },
    // W2-6 (hack, 7x7)
    {
      id: 16, world: 2, stageInWorld: 6, title: 'ほりこえギアハック', role: 'hack',
      hint: 'あえて カベのまえの 1つを なおして ギアをとろう！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 5, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.##.##',
        '#...O.#',
        '#.#B#.#',
        '#...G.#',
        '#######'
      ],
      // Let's trace: start (1,5) east -> move(2,5)->move(3,5)->turn_left(north)->drill(3,4 B -> 3,4)->move(3,3) -> wait (4,3) is O!
      // Instead: from (5,5) or (3,3) jump east over (4,3)O to (5,3)[gear]! Then need to reach G!
      // Put G at (5,5) and gear at (5,3):
      // (1,5)east -> move(2,5)->move(3,5)->move(4,5) -> if turn_left at (3,5)?
      // Let's place G at (5,4) and gear at (5,3)!
      // (1,5)->move(2,5)->move(3,5)->turn_left(north)->drill(3,4 B->3,4)->move(3,3)->turn_right(east)->jump(over 4,3 O -> 5,3 gear)->turn_right(south)->move(5,4 G) -> 10 cmds!
      // Let's shorten to 8 cmds: start (3,5) dir:0(north)!
      // drill(3,4 B)->move(3,3)->turn_right(east)->jump(5,3 gear)->turn_right(south)->move(5,4 G) (6 cmds!)
      // Plus an A-rank path via (4,5)->(5,5)->(5,4)G!
      program: [C('move'), C('move'), C('turn_left'), C('move'), C('move'), C('wait')]
    },
    // W2-7 (hack, 7x7)
    {
      id: 17, world: 2, stageInWorld: 7, title: 'ダブル・ビスケット門', role: 'hack',
      hint: '2まいの ヒビカベと おとしあなを 1てで とっぱ！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 5, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.BO..G', // 注意：7文字、右端がGではなく # にしよう
        '#.###.#',
        '#.....#',
        '#######'
      ],
      program: [C('drill'), C('jump'), C('move'), C('move'), C('wait'), C('wait')]
    },
    // W2-8 (hack, 7x7)
    {
      id: 18, world: 2, stageInWorld: 8, title: 'トゲばたけの大跳躍', role: 'hack',
      hint: 'トゲと トゲの あいだに ギアが 光ってるぞ！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#..^..#',
        '#.#^#.#',
        '#....G#',
        '#.^B^.#',
        '#.....#',
        '#######'
      ],
      // (1,1)east -> move(2,1) -> turn_right -> move(2,2)... wait:
      // (1,1)east -> jump(over 2,1?) -> (3,1) -> turn_right(south) -> jump(over 3,2 ^ -> 3,3 gear!) -> turn_left(east) -> move(4,3)->move(5,3)G!
      // Wait (2,1) is '.', (3,1) is '^'! So put '^' at (2,1) and '.' at (3,1)!
      program: [C('jump'), C('turn_right'), C('move'), C('turn_left'), C('move'), C('move')]
    },
    // W2-9 (boss, 8x8)
    {
      id: 19, world: 2, stageInWorld: 9, title: 'ビスケット城の防衛線', role: 'boss',
      hint: 'ジャンプと ドリルを つかいわけて 城をぬけろ！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 35,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 3, y: 2 },
      map: [
        '########',
        '#......#',
        '#.B..G.#',
        '#.^.##.#',
        '#...##.#',
        '#.O....#',
        '#......#',
        '########'
      ],
      // (1,6)north -> jump(over 1,5 O -> 1,4) -> move(1,3? ^!) -> jump(over 1,3 ^ -> 1,2)!
      // Then turn_right(east) -> drill(2,2 B -> 2,2) -> move(3,2 gear) -> move(4,2) -> move(5,2 G)! (7 cmds!)
      program: [C('jump'), C('move'), C('turn_right'), C('drill'), C('move'), C('move'), C('move')]
    },
    // W2-10 (boss, 8x8)
    {
      id: 20, world: 2, stageInWorld: 10, title: '第2層ボス：大ビスケット要塞', role: 'boss',
      hint: '第2層の だいしれん！ばくそうを 1てで せいぎょせよ！',
      availableParts: ['spring', 'drill'], availableConditions: [], allowLoopEdit: false, maxSteps: 35,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#.###.G#',
        '#..B^..#',
        '#..#...#',
        '#.O..B.#',
        '#....#.#',
        '########'
      ],
      // (1,6)east -> move(2,6)->move(3,6)->turn_left(north)->move(3,5)->...
      // Better clean path for 8 cmds:
      // start(1,6, dir:1) -> jump(over 2,6? make 2,6 O) -> (3,6)->turn_left(north)->move(3,5)->drill(3,4? make 3,4 B)->move(3,3)->turn_right(east)->jump(over 4,3 ^ -> 5,3)->turn_left(north)->move(5,2 gear)->move(6,2 G? wait G at 6,2!)
      program: [C('jump'), C('turn_left'), C('move'), C('drill'), C('turn_right'), C('jump'), C('turn_left'), C('move')]
    }
  ];

  // S014, S016, S017, S018, S020 の細部調整（座標合わせ）
  // S014: start(1,2,dir:1), map[2]='#..B.#', (1,2)->move(2,2)->drill(breaks 3,2 B -> 3,2)->move(4,2 gear)->turn_right->move(4,3 G)
  stages[3].program = [C('move'), C('jump'), C('move'), C('turn_right'), C('move'), C('wait')];

  // S016: start(3,5,dir:0), gear(5,3), G(5,4)
  stages[5].start = { x: 3, y: 5, dir: 0 };
  stages[5].map = [
    '#######',
    '#.....#',
    '#.##.##',
    '#...O.#',
    '#.#B#G#',
    '#.....#',
    '#######'
  ];
  // (3,5)->drill(3,4 B -> 3,4)->move(3,3)->turn_right(east)->jump(5,3 gear)->turn_right(south)->move(5,4 G)
  // バグ: 3番目(jump)がmoveになっていて穴(4,3)に落ちる！またAルート(4,5)->(5,5)->(5,4)は(3,5)からturn_rightで開始すれば行けるかも？
  stages[5].program = [C('drill'), C('move'), C('turn_right'), C('move'), C('turn_right'), C('move')];

  // S017: 7x7 wall-bounded
  stages[6].start = { x: 1, y: 3, dir: 1 };
  stages[6].gear = { x: 4, y: 3 };
  stages[6].map = [
    '#######',
    '#.....#',
    '#.###.#',
    '#.BO.G#',
    '#.###.#',
    '#.....#',
    '#######'
  ];
  // (1,3)->drill(2,3 B -> 2,3)->jump(over 3,3 O -> 4,3 gear)->move(5,3 G) -> 3 cmds!
  // もっと面白く7パネルにしよう: start(1,5, dir:0), gear(4,2), G(5,2)
  stages[6].start = { x: 1, y: 5, dir: 0 };
  stages[6].gear = { x: 4, y: 2 };
  stages[6].map = [
    '#######',
    '#.....#',
    '#.BO.G#',
    '#.#.#.#',
    '#.B.#.#',
    '#.....#',
    '#######'
  ];
  // (1,5)->drill(1,4 B? x=2 is B! Wait x=1 is '.'!) -> let's put B at (1,4) and (2,2):
  stages[6].map = [
    '#######',
    '#.....#',
    '#.BO.G#',
    '#.#.#.#',
    '#B..#.#',
    '#.....#',
    '#######'
  ];
  // (1,5)north -> drill(1,4 B -> 1,4)->move(1,3)->move(1,2)->turn_right(east)->drill(2,2 B -> 2,2)->jump(over 3,2 O -> 4,2 gear)->move(5,2 G) (7 cmds!)
  // Bug at index 5 (`jump` -> `move`)
  stages[6].program = [C('drill'), C('move'), C('move'), C('turn_right'), C('drill'), C('move'), C('move')];

  // S018:
  stages[7].map = [
    '#######',
    '#^.^..#',
    '#.#^#.#',
    '#....G#',
    '#.^B^.#',
    '#.....#',
    '#######'
  ];
  // map[1]: index 1 is '^' (start!). Make index 1 '.', index 2 '^', index 3 '.':
  stages[7].map[1] = '#.^...#';
  // (1,1)east -> jump(3,1)->turn_right(south)->jump(3,3 gear)->turn_left(east)->move(4,3)->move(5,3 G)
  // Bug at index 2 (`jump` -> `move` hits 3,2 ^!)
  stages[7].program = [C('jump'), C('turn_right'), C('move'), C('turn_left'), C('move'), C('move')];

  // S020: start(1,6, dir:1), gear(5,3), G(6,2)
  stages[9].gear = { x: 5, y: 3 };
  stages[9].map = [
    '########',
    '#......#',
    '#.###.G#',
    '#..#^..#',
    '#..B...#',
    '#.O..#.#',
    '#.O....#',
    '########'
  ];
  // (1,6)east -> jump(over 2,6 O -> 3,6) -> turn_left(north) -> move(3,5) -> drill(3,4 B -> 3,4) -> move(3,3? '#'!)
  // Make (3,3) '.' and (4,3) '^' and (5,3) '.' (gear), (6,3) '.', (6,2) 'G'!
  stages[9].map[3] = '#...^..#';
  // Trace: (1,6)->jump(3,6)->turn_left(north)->move(3,5)->drill(3,4)->move(3,3)->turn_right(east)->jump(over 4,3 ^ -> 5,3 gear)->move(6,3)->turn_left(north)->move(6,2 G) -> 10 cmds!
  // Shorten by starting at (3,6, dir:0):
  // drill at (3,4) -> jump over (4,3)^ -> gear at (5,3) -> move(6,3) -> turn_left -> move(6,2)G -> 8 cmds!
  stages[9].start = { x: 1, y: 5, dir: 1 };
  stages[9].map = [
    '########',
    '#......#',
    '#.###.G#',
    '#..#^..#',
    '#..B...#',
    '#.O....#',
    '#......#',
    '########'
  ];
  // Wait (1,5)east -> jump(over 2,5 O -> 3,5) -> turn_left(north) -> drill(3,4 B -> 3,4) -> turn_right? (3,3) is '#' so can't go 3,3!
  // Let's make (3,3) '.' and (3,4) 'B':
  stages[9].map[3] = '#...^..#';
  // (1,5)east -> jump(3,5)->turn_left(north)->drill(3,4 B)->move(3,3)->turn_right(east)->jump(5,3 gear)->turn_left(north)->move(5,2? '#'!) -> make (5,2) '.' and (6,2) 'G', or put G at (5,2):
  stages[9].map[2] = '#.###G.#';
  // Trace: (1,5)->jump(3,5)->turn_left->drill(3,4)->move(3,3)->turn_right->jump(5,3 gear)->turn_left->move(5,2 G) = 9 cmds!
  // Make (3,5)->(3,4)B immediately by having start(1,4, dir:1) and (2,4) O!
  stages[9].start = { x: 1, y: 4, dir: 1 };
  stages[9].map = [
    '########',
    '#......#',
    '#.###G.#',
    '#...^..#',
    '#.O.B..#',
    '#......#',
    '#......#',
    '########'
  ];
  // Wait (2,4) is O, (3,4) is '.', (4,4) is B!
  // (1,4)east -> jump(3,4)->drill(4,4 B? no, gear is at (5,3) -> let's put B at (4,4) and turn_left at (4,4)? No, (4,3) is ^!)
  // Trace: (1,4)->jump(3,4)->turn_left(north)->move(3,3)->turn_right(east)->jump(over 4,3 ^ -> 5,3 gear)->turn_left(north)->move(5,2 G)!
  // Let's include drill too! Put B at (3,3):
  stages[9].map[3] = '#..B^..#';
  // Trace: (1,4)east -> jump(3,4)->turn_left(north)->drill(3,3 B -> 3,3)->turn_right(east)->jump(5,3 gear)->turn_left(north)->move(5,2 G) = 7 cmds!
  // Bug at index 2 (`drill` -> `move` hits B at 3,3!)
  stages[9].program = [C('jump'), C('turn_left'), C('move'), C('turn_right'), C('jump'), C('turn_left'), C('move')];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
