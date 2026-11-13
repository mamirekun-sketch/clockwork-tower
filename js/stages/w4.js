/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第4階層：W4（Stage 31〜40：反復（ループ）①）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };
  var L = function (count, body) { return { type: 'loop', count: count, body: body }; };

  var stages = [
    // W4-1 (intro, 7x5) - ループの回数変更入門
    {
      id: 31, world: 4, stageInWorld: 1, title: 'くりかえしの まほう', role: 'intro',
      hint: 'むらさきの「×2」を タップして かいすうを ふやしてみよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 30,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#....G#',
        '#.....#',
        '#######'
      ],
      // ×2 [move] だと (3,2) で止まって未達 FAIL! ×4 にすると (5,2)G！
      // もしくは ×2 [move] の中身を turbo にすると (1,2)->(3,2)->(5,2)G (おや、(4,2)ギアはturboでも踏む！)
      program: [L(2, [C('move')])]
    },
    // W4-2 (intro, 6x6) - 階段ループの向きバグ
    {
      id: 32, world: 4, stageInWorld: 2, title: 'かいだんループの むき', role: 'intro',
      hint: 'ループの なかの「まがる」むきが ぎゃくだよ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 30,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 2, y: 3 },
      map: [
        '######',
        '#...G#',
        '#....#',
        '#....#',
        '#....#',
        '######'
      ],
      // 階段3回: [move, turn_right, move, turn_left] x 3 -> (1,4)->(1,3)->(2,3 gear)->(2,2)->(3,2)->(3,1)->(4,1 G)!
      // バグ: 1番目が turn_left になっていて左壁(0,3)へ激突！
      program: [L(3, [C('move'), C('turn_left'), C('move'), C('turn_left')])]
    },
    // W4-3 (multi, 7x6) - 回数変更(A) vs 中身変更(S)
    {
      id: 33, world: 4, stageInWorld: 3, title: 'ふたつの ループかいほう', role: 'multi',
      hint: 'かいすうを かえるか、なかの めいれいを かえるか… ギアもねらおう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#...OG#',
        '#.....#',
        '#.....#',
        '#######'
      ],
      program: [L(3, [C('move')]), C('jump')]
    },
    // W4-4 (multi, 8x7) - ビスケット壁をループで連続粉砕！
    {
      id: 34, world: 4, stageInWorld: 4, title: 'ドリル・連打ループ', role: 'multi',
      hint: 'ヒビカベが いくつ ならんでいるか かぞえてみよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 5, y: 3 },
      map: [
        '########',
        '#......#',
        '#.####.#',
        '#.BBB.G#',
        '#.####.#',
        '#......#',
        '########'
      ],
      program: [L(2, [C('drill')]), C('move'), C('move')]
    },
    // W4-5 (multi, 7x7) - ぐるっと回ってギアか近道か
    {
      id: 35, world: 4, stageInWorld: 5, title: 'くるくるぜんまい広場', role: 'multi',
      hint: 'ループで ぐるっと まわると お宝に とどくかも！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 5, y: 1 },
      map: [
        '#######',
        '#....G#',
        '#.##..#',
        '#.##..#',
        '#.....#',
        '#.....#',
        '#######'
      ],
      // (1,5)north -> L(3, [turbo, turn_right]):
      // iter1: (1,5)->turbo(1,3)->turn_right(east)
      // iter2: (1,3)->turbo(3,3? # at 2,3 and 3,3!) -> let's clear row 1 and col 5!
      // Clear outer ring:
      // Wait: from (1,5) north: turbo(1,3)->turbo(1,1)->turn_right(east)->turbo(3,1)->turbo(5,1)[gear!] -> move(5,2? no, G is at (5,1) or (5,3)!)
      // Even cleaner 4-step outer loop:
      // start(1,5, dir:0), gear(5,1), G(5,5):
      // L(3, [turbo, turbo, turn_right]) ->
      // iter1: (1,5)->(1,3)->(1,1), right(east)
      // iter2: (1,1)->(3,1)->(5,1)[gear!], right(south)
      // iter3: (5,1)->(5,3)->(5,5)[G!]!
      // Bug: count is 2 (stops at 5,1 [gear], doesn't reach 5,5 G!) -> Fix count 2 -> 3 (or 4)!
      // Plus: if (1,3)->(3,3)->(5,3)->(5,5)G? Keep it clean: outer loop with bug count=2!
      program: [L(2, [C('turbo'), C('turbo'), C('turn_right')])]
    },
    // W4-6 (hack, 7x7) - 穴越えジャンプの連続ループ＋神ハック
    {
      id: 36, world: 4, stageInWorld: 6, title: 'とびいしジャンプ回路', role: 'hack',
      hint: '3れんぞく ジャンプの さきに 落とし穴！どこを なおす？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 5, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.#.#.#',
        '#..O.G#', // wait G at (5,3) -> put gear at (5,5) and G at (5,1)!
        '#.#.#O#',
        '#.O.O.#',
        '#######'
      ],
      // Let's trace:
      // map[1] = '#....G#' (5,1)G
      // map[2] = '#.#.#O#' -> wait (5,2) is O so jump over it!
      // map[3] = '#.#...#' (5,3) is '.'
      // map[4] = '#.#.#O#' (5,4) is O!
      // map[5] = '#.O.O.#' -> (1,5)start, (2,5)O, (3,5)., (4,5)O, (5,5).[gear!]
      // Trace: L(2, [jump]) -> (1,5)->(3,5)->(5,5)[gear!]. Then turn_left(north). Then L(2, [jump]) -> (5,5)->(5,3)->(5,1)G!
      // Bug: first loop is count 3 (hits wall at 5,5 -> stuns, or hits 6,5 wall -> stuns, wait: at 5,5 facing east, jump hits (6,5)# wall and stuns! Then turn_left(north), then L(2,[jump]) -> (5,5)->(5,3)->(5,1)G! OH! Stun wouldn't fail!).
      // To make stun FAIL or base fail: put `O` at (6,5)? No, outer border is `#`. Instead put `move` or make `L(1...` -> make second loop count 2 with `move` instead of `jump`, OR make first loop count 3 AND put `O` at (4,5) and `.` at (5,5) and `G` at (5,1), wait if 2nd loop is `L(2, [move])` it falls in `(5,4)O`!
      // Yes!! Look:
      // program: [L(2, [C('jump')]), C('turn_left'), L(2, [C('move')])]
      // Base: (1,5)->(3,5)->(5,5)[gear]->turn_left(north)->move hits (5,4)O落下 FAIL!
      // Fix `2.body.0` (`move` -> `jump`): (5,5)[gear]->jump(5,3)->jump(5,1)G (**S-rank!!**)!
      // Plus: what if `map[3]` has `^` at (4,3) and `(5,3)` is `.`, and `L(2, [C('turbo')])` also works? Both `jump` and `turbo` jump over `(5,4)O` and `(5,2)O`!
      //Wait: `turbo` lands on 2nd step (5,3) and (5,1)G, skipping (5,4)O and (5,2)O too!
      program: [L(2, [C('jump')]), C('turn_left'), L(2, [C('move')])]
    },
    // W4-7 (hack, 7x7) - ターボの飛びすぎとマグネットのコンボ
    {
      id: 37, world: 4, stageInWorld: 7, title: 'じしゃく×ターボ・リレー', role: 'hack',
      hint: 'ループの まえに「じしゃく」を はさむか、ループの なかを なおすか！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#.....#',
        '#.OI.G#',
        '#.....#',
        '#.....#',
        '#######'
      ],
      // Wait: map[3] is '#.OI.G#' (x=1:., x=2:O, x=3:I, x=4:., x=5:G)
      // Program: [C('wait'), L(4, [C('move')])]
      // Base: wait -> move hits (2,3)O落下 FAIL!
      // Fix 0 (`wait` -> `magnet`): pulls gear (2,2) AND bridges (2,3)O with I -> (2,3)F! Then 4 moves reach (5,3)G (**S-rank!!**)!
      // Fix `1.body.0` (`move` -> `jump`)? (1,3)->jump(3,3? I block! stuns!).
      // What if we put a lower A-rank path or make 0:`wait`->`jump`? Wait if (3,3) is I, jump hits I.
      // Put `I` at (4,3)? No, `(1,3)` -> `O` at `(2,3)` -> `I` at `(3,3)` -> `.` at `(4,3)` -> `G` at `(5,3)`:
      // Fix 0 (`wait` -> `magnet`) = S-rank! And let's also add `L(3, [C('move')])` -> change `1` count `2` vs `3` vs `4`:
      // If `program` is `[C('wait'), L(2, [C('move')]), C('move')]`: wait(->magnet) + 2 moves(3,3) + 1 move(4,3) -> needs 4 moves! So `[C('wait'), L(4, [C('move')])]`.
      program: [C('wait'), L(4, [C('move')])]
    },
    // W4-8 (hack, 8x7) - 鉄橋を2回つくるループハック！
    {
      id: 38, world: 4, stageInWorld: 8, title: 'ダブル鉄橋の じゅもん', role: 'hack',
      hint: '「じしゃく と 2ほあるく」を くりかえして 2つの あなを わたろう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#......#',
        '#.OI.OIG', // Wait 8 chars: 0:#, 1:.(start), 2:O, 3:I, 4:., 5:O, 6:I, 7:G -> no right border wall! Let's make G at 6 or use 9 cols? No, grid 8x7:
        '#......#',
        '#......#',
        '########'
      ],
      // Use 8x7 with vertical or 7-step horizontal:
      // 0:#, 1:., 2:O, 3:I, 4:., 5:O, 6:I? Need G at (7,3) or turn!
      // Turn after first bridge!
      // Row 3: '#.OI...#' -> (1,3)start(east), (2,3)O, (3,3)I, (4,3).
      // Col 4 going up: (4,2)O, (4,1)I? Need space for G!
      // Instead: start (1,5, dir:0 north):
      // Col 1: (1,5)start, (1,4)O, (1,3)I, (1,2)., (1,1).
      // Row 1: (2,1)O, (3,1)I, (4,1)., (5,1)G!
      // Let's trace!
      // Loop 2 times: [magnet, move, move, turn_right] ?
      // iter1 at (1,5)north: magnet -> pulls (1,3)I into (1,4)O->F -> move(1,4 F)->move(1,3)->turn_right(east). Wait we are at (1,3), not (1,1)!
      // Make (1,5)start -> magnet -> move(1,4 F) -> move(1,3) -> move(1,2) -> ...
      // Even cleaner: [magnet, turbo, move, turn_right] x 2?
      // At (1,5)north: magnet -> bridges (1,4)F -> turbo lands (1,3) -> move(1,2) -> wait(1,1)? No!
      // Put `G` at (4,3) and turn at (1,3)!
      // Check:
      // (1,5)north: magnet (bridges 1,4 O->F) -> move(1,4 F) -> move(1,3) -> turn_right(east)!
      // Now at (1,3)east: (2,3) is O, (3,3) is I, (4,3) is '.', (5,3) is 'G'!
      // iter2: magnet (bridges 2,3 O->F AND if gear is at (2,2), collects gear at (2,2)!) -> move(2,3 F) -> move(3,3) -> turn_right(south)! Wait facing south at (3,3) instead of east to (4,3)G!
      // So don't turn_right inside the loop, OR turn at the end:
      // At (1,5)north: iter1 -> (1,3), turn_right(east); iter2 -> (3,3), turn_right(south); iter3 -> (3,5)G!!
      // OH!! SQUARE SPIRAL!! Check that:
      // (1,5)north -> (1,4)O, (1,3)I -> turn_right(east) at (1,3)
      // (1,3)east -> (2,3)O, (3,3)I -> turn_right(south) at (3,3)
      // (3,3)south -> (3,4)O, (3,5)I -> (3,5) is G? No, (3,5) has I! So put G at (4,5) or (3,6)!
      // Wait 8x8:
      // (1,6)north -> (1,5)O, (1,4)I -> at (1,4) turn_right(east)
      // (1,4)east -> (2,4)O, (3,4)I -> at (3,4) turn_right(south)
      // (3,4)south -> (3,5)O, (3,6)I -> turn_right(west)... no, only 2 loops:
      // L(2, [magnet, move, move, turn_right]) -> ends at (3,4) facing south -> then `move(3,5) -> move(3,6)G`!
      // Check gear at `(2,3)` (magnet at `(1,4)` grabs gear `(2,3)` AND bridges `(2,4)`!)
      // Bug: loop count is 3 (over-rotates/hits I) or `magnet` is `wait`!
      // Wait: if `program` is `[L(2, [C('wait'), C('move'), C('move'), C('turn_right')]), C('move'), C('move')]`:
      // Base: hits (1,5)O FAIL!
      // Fix `0.body.0` (`wait` -> `magnet`): bridges (1,5)O->F, then bridges (2,4)O->F & grabs (2,3)gear, then moves down to (3,6)G!!
      program: []
    },
    // W4-9 (boss, 8x8)
    {
      id: 39, world: 4, stageInWorld: 9, title: 'ふたごループのからくり門', role: 'boss',
      hint: '2つの ループの どちらかを 1かしょだけ なおそう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#.#..#G#',
        '#.^..#.#',
        '#.#.##.#',
        '#.O....#',
        '#......#',
        '########'
      ],
      // (1,6)north -> L(2, [jump]) -> (1,4)->(1,2)
      // turn_right(east) -> L(2, [turbo]) -> (1,2)->(3,2)->(5,2)[gear!]
      // wait: (6,2) is G! So move(6,2 G)!
      // Check map[2]: '#.#..#G#' -> (2,2) is '#', (5,2) is '#'!!
      // Fix map[2] to '#....#G#' -> (2,2),(3,2),(4,2) are '.', (5,2) is '.'!Wait: '#.....G#'!
      // Check map[4]: (1,4) is '.', (1,3) is '^' (jumped over!).
      // Check map[5]: (1,5) is 'O' (jumped over!).
      // Bug: 1st loop count is 3 (hits 1,0 wall -> stuns at 1,2? Wait stun doesn't fail! Put `move` instead of `turbo` in 2nd loop, or make 2nd loop count 2 and bug=3 where (7,2) is wall so turbo crashes!).
      // Yes! If 2nd loop is `L(3, [C('turbo')])`? No, it hits `(6,2)G` during the 3rd turbo? No, at (5,2) 3rd turbo sees (6,2)G on step 1 so it stops at G!
      // Instead put `G` at (6,3) and turn_right at (5,2):
      // [L(2, [C('jump')]), C('turn_right'), L(2, [C('turbo')]), C('turn_right'), C('move')]
      // Bug: `0` loop count = 3 -> no, stun! Put `0.body.0` = `turbo`? At (1,6) facing north, turbo skips (1,5)O -> (1,4), then 2nd turbo skips (1,3)^ -> (1,2)! Wait then both jump and turbo work!
      // Make bug: `2` (2nd loop) count = 1 (stops at 3,2 -> turn_right -> hits 3,3 '.' -> ends at 3,3 not G!).
      // Fix `2` count 1 -> 2: reaches (5,2)[gear] -> turn_right -> move(5,3)G!
      program: []
    },
    // W4-10 (boss, 8x8)
    {
      id: 40, world: 4, stageInWorld: 10, title: '第4層ボス：ぜんまい大時計の心臓', role: 'boss',
      hint: '第4層の しめくくり！ループの 力を みせつけろ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 50,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 6, y: 4 },
      map: [
        '########',
        '#......#',
        '#.####.#',
        '#.#..#.#',
        '#.#BB.G#',
        '#.O..#.#',
        '#......#',
        '########'
      ],
      // Let's trace a super crisp route for S040:
      // start(1,6, dir:1 east)
      // L(2, [move]) -> (3,6) -> turn_left(north) -> L(2, [move]) -> (3,4) -> turn_right(east) -> L(2, [drill]) -> wait (3,4) facing east:
      // (4,4)B, (5,4)B, (6,4).[gear!], (6,3)G? Let's put G at (6,2) and gear at (6,4)!
      // Put map[4] = '#..BB..#' -> (3,4) is '.', (4,4)B, (5,4)B, (6,4).[gear]!
      // Put map[3] = '#.#..#G#' -> wait (6,3) is G, or map[2] = '#.####G#' -> (6,2)G!
      // Trace:
      // 0: L(2, [move]) -> (3,6)
      // 1: turn_left (north)
      // 2: L(2, [move]) -> (3,4)
      // 3: turn_right (east)
      // 4: L(2, [drill]) -> breaks (4,4)B, (5,4)B -> lands on (5,4)
      // 5: move -> (6,4)[gear!]
      // 6: turn_left (north)
      // 7: L(2, [move]) -> (6,3)->(6,2)G!
      // Bug: loop 4 count is 3 (at (5,4), 3rd drill whiffs? No, 3rd drill whiffs so it still moves to (6,4)!).
      // Instead make bug: loop 4 body is `move` (crashes into (4,4)B wall!) OR loop 2 count is 3 (lands on (3,3) `#` or misses row 4!).
      // Check `(3,3)` is `.`, `(3,2)` is `#` -> if loop 2 count is 3, it crashes into `(3,3)`? No, make `(3,3)` `#` or `^`! Then count 3 crashes into `(3,3)^`! Fix count 3 -> 2 -> reaches (6,4)[gear] -> (6,2)G!
      program: []
    }
  ];

  // S035 クリーン設定
  stages[4].gear = { x: 5, y: 1 };
  stages[4].map = [
    '#######',
    '#.....#',
    '#.##..#',
    '#.##..#',
    '#.##..#',
    '#....G#',
    '#######'
  ];
  stages[4].program = [L(2, [C('turbo'), C('turbo'), C('turn_right')])];

  // S036 クリーン設定
  stages[5].gear = { x: 5, y: 5 };
  stages[5].map = [
    '#######',
    '#....G#',
    '#.#.#O#',
    '#.#...#',
    '#.#.#O#',
    '#.O.O.#',
    '#######'
  ];

  // S038 クリーン設定
  stages[7].start = { x: 1, y: 6, dir: 0 };
  stages[7].gear = { x: 2, y: 3 };
  stages[7].map = [
    '########',
    '#......#',
    '#......#',
    '#......#',
    '#.OI...#',
    '#.O....#',
    '#.I..G.#',
    '########'
  ];
  // Wait let's set S038 map carefully:
  // (1,6)north -> (1,5)O, (1,4)I -> (1,4)turn_right(east) -> (2,4)O, (3,4)I -> (3,4)turn_right(south) -> (3,5)., (3,6)G!
  stages[7].map = [
    '########',
    '#......#',
    '#......#',
    '#......#',
    '#.OI...#',
    '#.O....#',
    '#..G...#',
    '########'
  ];
  // Wait (1,4)I is map[4][1], (2,4)O is map[4][2], (3,4)I is map[4][3]!
  // Let's write row 4 & 5 & 6 clearly:
  stages[7].map = [
    '########',
    '#......#',
    '#......#',
    '#......#',
    '#IOI...#', // (1,4)I, (2,4)O, (3,4)I
    '#O.....#', // (1,5)O
    '#..G...#', // (1,6)start, (3,6)G
    '########'
  ];
  stages[7].program = [L(2, [C('wait'), C('move'), C('move'), C('turn_right')]), C('move'), C('move')];

  // S039 クリーン設定
  stages[8].map = [
    '########',
    '#......#',
    '#......#',
    '#....G.#',
    '#.#.##.#',
    '#.O....#',
    '#......#',
    '########'
  ];
  stages[8].gear = { x: 5, y: 2 };
  stages[8].program = [L(2, [C('jump')]), C('turn_right'), L(1, [C('turbo')]), C('turn_right'), C('move')];
  // Note: L(1,...) can't be edited unless count is 2/3/4, so make count=3 (overshoots? Wait (5,2)+turbo=hits (7,2)# wall -> crashes! Fix count 3 -> 2!).
  stages[8].program = [L(2, [C('jump')]), C('turn_right'), L(3, [C('turbo')]), C('turn_right'), C('move')];
  // Wait: at (5,2), 3rd turbo hits (7,2)# wall -> crash FAIL! Fix count 3 -> 2 -> lands (5,2)[gear] -> turn_right(south) -> move(5,3)G!

  // S040 クリーン設定
  stages[9].start = { x: 1, y: 6, dir: 1 };
  stages[9].gear = { x: 6, y: 4 };
  stages[9].map = [
    '########',
    '#......#',
    '#.####G#',
    '#.#^.#.#',
    '#...BB.#',
    '#.O..#.#',
    '#......#',
    '########'
  ];
  stages[9].program = [
    L(2, [C('move')]),
    C('turn_left'),
    L(3, [C('move')]),
    C('turn_right'),
    L(2, [C('drill')]),
    C('move'),
    C('turn_left'),
    L(2, [C('move')])
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
