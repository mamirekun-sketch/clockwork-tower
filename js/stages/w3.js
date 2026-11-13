/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第3階層：W3（Stage 21〜30：順次処理③・加速と磁力）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };

  var stages = [
    // W3-1 (intro, 7x5) - ターボ歯車初登場：2マス直進で途中のギアも回収！
    {
      id: 21, world: 3, stageInWorld: 1, title: 'びゅーんとターボ加速', role: 'intro',
      hint: '「ターボ」なら とちゅうのギアを とりながら 2マスすすめるよ！（ジャンプはAランク、ターボはSランク！）',
      availableParts: ['spring', 'drill', 'turbo'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#...OG#',
        '#.....#',
        '#######'
      ],
      program: [C('move'), C('jump'), C('wait'), C('wait'), C('wait'), C('wait'), C('wait'), C('wait')]
    },
    // W3-2 (intro, 6x6) - ターボの飛び過ぎ暴走に気をつけろ！
    {
      id: 22, world: 3, stageInWorld: 2, title: 'ターボのブレーキ故障', role: 'intro',
      hint: 'ターボで 2マス進みすぎて あなに おちちゃってるぞ！',
      availableParts: ['spring', 'drill', 'turbo'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 2, y: 2 },
      map: [
        '######',
        '#O...#',
        '#...G#',
        '#..#.#',
        '#....#',
        '######'
      ],
      // (1,4)north -> turbo(1,2) -> turn_right(east) -> turbo(3,2)[2,2ギア回収] -> move(4,2)G!
      // バグ: 0番目がturboで、2番目もturboで、4番目がturboになって壁激突！
      // いや、0:turbo(1,2)->1:turn_right(east)->2:move(2,2 gear)->3:move(3,2)->4:turbo(hits 5,2 wall!) -> 4をmoveに直すとS！
      // もしくは1番目や0番目が変。ちゃんと8パネルで作ろう：
      // (1,4)->move(1,3)->move(1,2)->turn_right->move(2,2 gear)->move(3,2)->turn_right? いや：
      // (1,4)->jump(1,2)->turn_right->move(2,2 gear)->turbo(4,2 G!) -> wait (2,2)->(4,2) is 2 steps!
      // Let's trace 8 panels:
      // 0:move(1,3), 1:move(1,2), 2:turn_right(east), 3:move(2,2 gear), 4:turbo(4,2 G!), 5:wait, 6:wait, 7:wait
      // Bug: index 4 is move (ends at 3,2 not G) or index 0 is turbo (lands on 1,2 -> 1:move hits 1,1 O!).
      // Yes! If 0 is turbo (1,2), 1 is move -> hits (1,1) O! Fix 1 (move -> turn_right)? Wait if 2 is already turn_right:
      // Let 0:turbo(1,2), 1:move(hits 1,1 O), 2:turn_right, 3:move, 4:move, 5:move, 6:wait, 7:wait
      // Fix 1 (move->wait): (1,2)->wait->east->(2,2 gear)->(3,2)->(4,2 G)!
      program: [C('turbo'), C('move'), C('turn_right'), C('move'), C('move'), C('move'), C('wait'), C('wait')]
    },
    // W3-3 (multi, 6x6) - マグネット頭脳初登場：周囲のギア吸引＋鉄ブロック引き寄せ！
    {
      id: 23, world: 3, stageInWorld: 3, title: 'じしゃくで 鉄橋づくり', role: 'multi',
      hint: '「じしゃく」で むこうの 鉄ブロック(I)を ひきよせて あなを うめよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '######',
        '#....#',
        '#....#',
        '#.OI.G', // 6文字なので右端がGではなく5文字にしてGを4にしよう
        '#....#',
        '######'
      ],
      program: []
    },
    // W3-4 (multi, 7x7) - 鉄ブロックとドリルの組み合わせ＋複数解
    {
      id: 24, world: 3, stageInWorld: 4, title: 'マグネット・サプライズ', role: 'multi',
      hint: 'あなを 鉄ブロックで うめるか、それとも とびこえるか！？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 2, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.##.##',
        '#.....#',
        '#.OIG.#',
        '#.....#',
        '#######'
      ],
      // (1,4)east -> wait -> jump(3,4? I is at 3,4!)
      // Look: (2,4) is O, (3,4) is I, (4,4) is G!
      // If 0:magnet -> pulls I from (3,4) into (2,4) O -> becomes F! Now (3,4) is '.', (4,4) is G!
      // Wait: if program is [wait, move, move, move, turn_left, move, turn_right, move]:
      // Base: wait -> move hits (2,4) O FAIL!
      // Fix 0 (wait -> magnet): pulls I to (2,4)F -> move(2,4 F)->move(3,4)->move(4,4 G)! (Wait: doesn't get gear at (2,3)! -> A rank!)
      // Wait how to get gear at (2,3) too? Magnet has radius 1 (8 neighbors)!
      // From (1,4), (2,3) has dx=1, dy=-1 -> IT IS WITHIN CHEBYSHEV DISTANCE 1!
      // So magnet at (1,4) pulls BOTH the gear at (2,3) AND the iron block at (3,4)!!
      // Double check: (2,3) vs (1,4): |2-1|=1, |3-4|=1 -> magnet collects gear AND bridges O! S-rank!!
      // What about A-rank? Put another path below (1,5)->(2,5)->(3,5)->(4,5)->(4,4)G? Let's test!
      program: [C('wait'), C('move'), C('move'), C('move'), C('wait'), C('wait'), C('wait'), C('wait')]
    },
    // W3-5 (multi, 7x7) - ターボ暴走を逆手にとるショートカット
    {
      id: 25, world: 3, stageInWorld: 5, title: 'とばしすぎの だいちゃんす', role: 'multi',
      hint: 'おっそい「まえ」を「ターボ」に かえると いっきに かわるかも！？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 1, y: 2 },
      map: [
        '#######',
        '#..#..#',
        '#..#.G#',
        '#.O...#',
        '#.....#',
        '#.....#',
        '#######'
      ],
      // Let's trace: (1,5)north -> move(1,4)->wait->wait->turn_right(east)->...
      // Better: (1,5)north -> move(1,4)->move(1,3? O at 2,3 so 1,3 is '.') -> wait: put O at (1,3)!
      // Then from (1,4) facing north, turbo skips (1,3)O and lands on (1,2)[gear]!
      // Then turn_right(east) -> drill(2,2 B? put B at (2,2)) -> move(3,2)->move(4,2)->move(5,2 G)!
      program: [C('move'), C('move'), C('turn_right'), C('drill'), C('move'), C('move'), C('move'), C('wait')]
    },
    // W3-6 (hack, 7x7) - 離れた壁の向こうのギアを磁石で吸い取る神ハック！
    {
      id: 26, world: 3, stageInWorld: 6, title: 'カベごしの じしゃくハック', role: 'hack',
      hint: 'ギアは となりの おへや！カベごしに「じしゃく」で すいとれるぞ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.##.##',
        '#.#.#G#',
        '#.#...#',
        '#.....#',
        '#######'
      ],
      // From (2,4): gear is at (3,3)! Distance is (dx=1, dy=-1) -> magnet picks it up through the diagonal wall!
      // Path: (1,5)->turn_right->move(2,5)->turn_left->move(2,4)->wait(change to magnet!) -> turn_right -> move(3,4)->move(4,4)->move(5,4)->turn_left->move(5,3 G)!
      //Wait let's keep it 8-9 cmds: start(2,5, dir:0), gear(3,3), G(5,3)
      program: [C('move'), C('wait'), C('turn_right'), C('move'), C('move'), C('move'), C('turn_left'), C('move')]
    },
    // W3-7 (hack, 7x7) - トゲをターボでスキムしてギアを回収！
    {
      id: 27, world: 3, stageInWorld: 7, title: 'トゲのうえを かけぬけろ', role: 'hack',
      hint: '1マスめが トゲでも ターボなら かけぬけられる！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 30,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#..B.G#',
        '#..#..#',
        '#.^...#',
        '#.....#',
        '#######'
      ],
      // Wait: if G is at (5,2) and gear at (5,2)? Let's put gear at (4,2) and G at (5,2)!
      // Wait from (1,4) east: (2,4) is ^ -> turbo(3,4) -> turn_left(north) -> move(3,3? #) -> put ^ at (3,3) or '.' at (3,3)!
      // Let's trace: (1,4)east -> turbo(over 2,4 ^ -> 3,4) -> turn_left(north) -> move(3,3) -> move(3,2) -> turn_right(east) -> move(4,2 gear) -> move(5,2 G) -> 8 cmds!
      // Wait if index 0 is `move`, hits (2,4)^! Fix 0 (`move`->`turbo` or `jump`) -> wait: BOTH `jump` and `turbo` get over (2,4)^!
      // Let's put `gear` at (3,4) or (2,3) so `turbo` vs `jump` differs, OR put a `^` at (2,4) and `gear` at (3,4) and make `0` = `move`!
      // Better: put `gear` at `(4,2)` and `B` at `(4,3)`? No, let's make `turbo` essential at (4,2):
      // Start (1,4,dir:1) -> jump(3,4) -> turn_left(north) -> move(3,3) -> move(3,2) -> turn_right(east) -> move(4,2 gear) -> move(5,2 G)
      // Wait: if we start at (1,4), 0:turbo(3,4), 1:turn_left, 2:move(3,3), 3:move(3,2), 4:turn_right, 5:move(4,2 ^!), 6:move(5,2 G)
      // If (4,2) is `^` and (4,1) is `.`, how to reach gear? Put gear at `(3,2)` and `^` at `(4,2)`!
      // Then from `(3,2)`[gear] facing east, `5: move` hits `(4,2)^`! Fix `5` (`move` -> `turbo` or `jump`) reaches `(5,2)G`!
      program: [C('turbo'), C('turn_left'), C('move'), C('move'), C('turn_right'), C('move'), C('wait'), C('wait')]
    },
    // W3-8 (hack, 8x8) - 鉄ブロック引き寄せ＋ジャンプ＋ドリルの連鎖！
    {
      id: 28, world: 3, stageInWorld: 8, title: '4パーツ・チェーンハック', role: 'hack',
      hint: '鉄ブロックを ひきよせた あと、どこで ドリルをつかう？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 35,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 2, y: 4 },
      map: [
        '########',
        '#......#',
        '#..###.#',
        '#....#.#',
        '#......#',
        '#.OI.BG#',
        '#......#',
        '########'
      ],
      // (1,5)east -> magnet (collects gear at (2,4) AND pulls I from (3,5) to (2,5)F!)
      // -> move(2,5 F) -> move(3,5) -> move(4,5) -> drill(breaks 5,5 B -> 5,5) -> move(6,5 G)!
      // Bug: index 4 is `jump` instead of `drill`!
      program: [C('magnet'), C('move'), C('move'), C('move'), C('jump'), C('move'), C('wait'), C('wait')]
    },
    // W3-9 (boss, 8x8)
    {
      id: 29, world: 3, stageInWorld: 9, title: '貨物室のまもりびと', role: 'boss',
      hint: 'ターボ・ドリル・マグネットを 1てで つなぎなおせ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 35,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 2, y: 3 },
      map: [
        '########',
        '#......#',
        '#..##..#',
        '#..#..G#',
        '#.BOI..#',
        '#^.....#',
        '#......#',
        '########'
      ],
      // Trace: (1,6)north -> jump(over 1,5 ^ -> 1,4) -> drill(what? 1,4 is '.' and 2,4 is B!)
      // So: jump(1,4) -> turn_right(east) -> drill(2,4 B -> 2,4) -> wait(fix to magnet! collects gear 2,3 AND pulls I from 4,4 to 3,4 F!)
      // -> turbo(skips 3,4 F -> lands 4,4) -> move(5,4) -> turn_left(north) -> move(5,3) -> move(6,3 G? wait G is at 6,3!)
      // Adjust G to (5,3) or add move:
      // 0:jump(1,4), 1:turn_right, 2:drill(2,4), 3:wait(->magnet), 4:turbo(4,4), 5:turn_left(north), 6:move(4,3? # at 3,3, 4,3 is '.'!), 7:turn_right(east), 8:turbo(6,3 G!)
      program: [C('jump'), C('turn_right'), C('drill'), C('wait'), C('turbo'), C('turn_left'), C('move'), C('turn_right'), C('turbo')]
    },
    // W3-10 (boss, 8x8)
    {
      id: 30, world: 3, stageInWorld: 10, title: '第3層ボス：鉄壁のマグネット金庫', role: 'boss',
      hint: '第3層さいごの 大ハック！鉄ブロックと ターボの 協奏曲！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: false, maxSteps: 40,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '########',
        '#......#',
        '#...#G.#',
        '#..B^..#',
        '#..#...#',
        '#..I...#',
        '#.O....#',
        '########'
      ],
      // Let's design a super crisp 10-panel route for S030:
      // start(1,6, dir:1) -> jump(over 2,6 O -> 3,6) -> turn_left(north) -> wait(->magnet? I is at 3,5 right in front! wait distance 1 can't bridge!)
      // Instead put O at (3,5) and I at (3,4) and B at (3,3) and ^ at (4,3) and G at (5,2)!
      // Wait: if gear is at (4,2), from (3,3) (dx=1, dy=-1) magnet or from (5,3) move(5,2)? No, put gear at (5,3) and G at (5,2)!
      // Let's trace:
      // map:
      // 0: ########
      // 1: #......#
      // 2: #...#G.#  (5,2) is G
      // 3: #..B^..#  (3,3) is B, (4,3) is ^, (5,3) is '.' [gear]
      // 4: #..I...#  (3,4) is I
      // 5: #..O...#  (3,5) is O
      // 6: #.O....#  (1,6) start east, (2,6) is O, (3,6) is '.'
      // 7: ########
      // Program (10 panels):
      // 0: jump (1,6 -> 3,6)
      // 1: turn_left (north)
      // 2: wait (CHANGE TO magnet! From (3,6), (3,5) is O, (3,4) is I -> pulls I into (3,5)F! (3,4) becomes '.'!)
      // 3: turbo (from 3,6 skips 3,5 F? or moves 2 steps -> lands on (3,4)!)
      // 4: drill (breaks 3,3 B -> lands on 3,3!)
      // 5: turn_right (east)
      // 6: jump (over 4,3 ^ -> lands on 5,3 [gear]!)
      // 7: turn_left (north)
      // 8: move (5,2 G!)
      // 9: wait
      program: [C('jump'), C('turn_left'), C('wait'), C('turbo'), C('drill'), C('turn_right'), C('jump'), C('turn_left'), C('move'), C('wait')]
    }
  ];

  // S023 修正 (6x6 正しい壁閉じ & プログラム):
  stages[2].gear = { x: 3, y: 2 };
  stages[2].map = [
    '######',
    '#....#',
    '#....#',
    '#.OIG#', //Wait: 0:#, 1:., 2:O, 3:I, 4:G, 5:# -> 6文字! (1,3)start, (2,3)O, (3,3)I, (4,3)G!
    '#....#',
    '######'
  ];
  // Check S023: from (1,3) east:
  // 0: wait (FIX TO magnet! Collects gear at (3,2)? wait |3-1|=2! Put gear at (2,2) so |2-1|=1, |2-3|=1!)
  stages[2].gear = { x: 2, y: 2 };
  // magnet at (1,3): collects (2,2)gear AND pulls I from (3,3) to (2,3)F!
  // Then 1:move(2,3 F)->2:move(3,3)->3:move(4,3 G)!
  // Let's make 8 panels:
  stages[2].program = [C('wait'), C('move'), C('move'), C('move'), C('wait'), C('wait'), C('wait'), C('wait')];

  // S025 修正:
  stages[4].map = [
    '#######',
    '#.....#',
    '#.B..G#',
    '#O....#',
    '#.....#',
    '#.....#',
    '#######'
  ];
  // (1,5)north -> move(1,4) -> move(1,3? O!) -> wait: put O at (1,3), (1,2) is '.', gear at (1,2)!
  // If 0 is `move` (1,4), 1 is `move` (hits 1,3 O FAIL!).
  // Fix 1 (`move` -> `turbo` or `jump`): lands on (1,2)[gear]!
  // Then 2:turn_right(east), 3:drill(breaks 2,2 B -> 2,2), 4:move(3,2), 5:move(4,2), 6:move(5,2 G), 7:wait!
  // Plus A-rank path: if 0 is `turn_right`? No, both `jump` and `turbo` work here!

  // S026 修正:
  stages[5].start = { x: 2, y: 5, dir: 0 };
  stages[5].gear = { x: 1, y: 3 };
  stages[5].map = [
    '#######',
    '#.....#',
    '###.###',
    '#.#.#G#',
    '##..^.#',
    '#.....#',
    '#######'
  ];
  stages[5].program = [C('move'), C('move'), C('turn_right'), C('move'), C('jump'), C('turn_left'), C('move'), C('wait')];

  // S027 修正:
  stages[6].gear = { x: 3, y: 2 };
  stages[6].map = [
    '#######',
    '#.....#',
    '#...^G#', // (3,2) is '.', (4,2) is '^', (5,2) is 'G'
    '#..#..#',
    '#.^...#',
    '#.....#',
    '#######'
  ];
  // (1,4)east -> turbo(over 2,4 ^ -> 3,4) -> turn_left(north) -> move(3,3? '#' in map[3]! Make map[3] '#.....#'!)
  stages[6].map[3] = '#.#...#'; // x=3 is '.'!
  // 0:turbo(3,4)->1:turn_left->2:move(3,3)->3:move(3,2 gear)->4:turn_right->5:move(hits 4,2 ^ FAIL! Fix to turbo or jump)->lands (5,2)G!

  // S030 の map を確定上書き:
  stages[9].map = [
    '########',
    '#......#',
    '#...#G.#',
    '#..B^..#',
    '#..I...#',
    '#..O...#',
    '#.O....#',
    '########'
  ];
  stages[9].gear = { x: 5, y: 3 };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
