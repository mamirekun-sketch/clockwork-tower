/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第6階層：W6（Stage 51〜60：ネスト（入れ子）ループ）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };
  var L = function (count, body) { return { type: 'loop', count: count, body: body }; };

  var stages = [
    // W6-1 (intro, 6x6) - ネストループ入門：2辺の正方形移動
    {
      id: 51, world: 6, stageInWorld: 1, title: '入れ子ループの だいぼうけん', role: 'intro',
      hint: 'ループの なかに ループがあるよ！うちの「×2」を なおしてみよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 4, y: 4 },
      map: [
        '######',
        '#...G#',
        '#.##.#',
        '#.##.#',
        '#....#',
        '######'
      ],
      // (1,4)east -> L(2, [L(3, [move]), turn_left]) ->
      // iter1: (1,4)->(2,4)->(3,4)->(4,4)[gear!] -> turn_left(north)
      // iter2: (4,4)->(4,3)->(4,2)->(4,1)[G!]!
      // バグ: 内側ループが count=2 になっている -> (1,4)->(3,4)->north->(3,3)#[壁激突!]
      program: [L(2, [L(2, [C('move')]), C('turn_left')])]
    },
    // W6-2 (intro, 6x6) - ネストループの向きミス
    {
      id: 52, world: 6, stageInWorld: 2, title: 'まがりかど・ダブルループ', role: 'intro',
      hint: 'そとの ループの さいごの まがるむきに きをつけて！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '######',
        '#....#',
        '#.##.#',
        '#.##.#',
        '#G...#',
        '######'
      ],
      // wait: 2x2 or 3x3!
      // (1,1)east -> L(3, [L(3, [move]), turn_right])?
      // iter1: (1,1)->(4,1), south; iter2: (4,1)->(4,4), west; iter3: (4,4)->(1,4)G!
      // Wait: gear is at (3,3)! Let's put gear at (4,4) so it sits on the corner!
      // Bug: `turn_left` inside outer loop instead of `turn_right` -> hits (4,0)# wall!
      gear: { x: 4, y: 4 },
      program: [L(3, [L(3, [C('move')]), C('turn_left')])]
    },
    // W6-3 (multi, 7x6) - ネストでジャンプ＆別解
    {
      id: 53, world: 6, stageInWorld: 3, title: 'ピョンピョン・ネスト回路', role: 'multi',
      hint: 'ループのなかの「まえ」を「ジャンプ」にする？それとも かいすう？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 3, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#.O..G#',
        '#.....#',
        '#.....#',
        '#######'
      ],
      // Let's trace: (1,4)north -> move(1,3)->move(1,2)->turn_right(east)->jump(over 2,2 O -> 3,2 gear!)->jump(5,2 G? map[2] G at 5,2!)
      // Use nested loop: L(2, [L(2, [C('move')]), C('turn_right')]) ->
      // If `0.body.0.body.0` is `move`: (1,4)->(1,3)->(1,2)->east->(2,2 O)落下 FAIL!
      // If `0.body.0.body.0` is `turbo`:
      //   iter1: (1,4)north -> turbo(1,2) -> turbo(1,0)# wall? Wait! 6 rows means y=0 is #, y=1 is '.', y=4 is start!
      //   Let's check 7x7: start (1,5, dir:0), map[3]='#.O..G#', map[1]='#.....#', y=5->y=3(1st jump)->y=1(2nd jump)?
      //   No, put `O` at (1,4) and `O` at (2,3)??
      //   Clean 7x7:
      //   0: #######
      //   1: #.....#
      //   2: #.....#
      //   3: #.O.O.# -> Wait: G at (5,1), gear at (3,1)!
      //   Let's make:
      //   (1,5)north -> L(2, [C('jump')]) -> (1,3)->(1,1)
      //   Then turn_right(east) -> L(2, [C('jump')]) -> (3,1)[gear]->(5,1)[G]!
      //   That's a single nested loop: L(2, [L(2, [C('move')]), C('turn_right')])!
      //   Put hazards at (1,4)O, (1,2)O, (2,1)O, (4,1)O!
      //   Now trace L(2, [L(2, [C('jump')]), C('turn_right')]):
      //   iter1: (1,5)north -> jump(1,3) -> jump(1,1) -> turn_right(east)!
      //   iter2: (1,1)east -> jump(3,1)[gear!] -> jump(5,1)[G!]!!
      //   And what if we change `0.body.0.body.0` (`move` -> `turbo`)?
      //   iter1: (1,5)->turbo(over 1,4 O -> 1,3)->turbo(over 1,2 O -> 1,1)->east!
      //   iter2: (1,1)->turbo(over 2,1 O -> 3,1 gear)->turbo(over 4,1 O -> 5,1 G)!!
      //   Both `jump` AND `turbo` clear with S-rank! Plus if we also leave (3,3) open, what about A-rank?
      map: [
        '#######',
        '#.O.OG#',
        '#O....#',
        '#.....#',
        '#O....#',
        '#.....#',
        '#######'
      ],
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 3, y: 1 },
      program: [L(2, [L(2, [C('move')]), C('turn_right')])]
    },
    // W6-4 (multi, 7x7) - ビスケット迷路の階段ネスト
    {
      id: 54, world: 6, stageInWorld: 4, title: 'ビスケット階段のらせん', role: 'multi',
      hint: 'ドリルで カベをわりながら、らせん状に すすむネスト！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#....G#',
        '#.###.#',
        '#.#B#.#',
        '#.#.#.#',
        '#.B...#',
        '#######'
      ],
      // Let's design a crisp 3-step staircase with nested loop:
      // Wait: each step of staircase = [drill, turn_right, move, turn_left] x 3!
      // Let's trace from (1,5) north:
      // step1: drill(1,4 B -> 1,4) -> turn_right(east) -> move(2,4) -> turn_left(north)
      // step2: drill(2,3 B -> 2,3) -> turn_right(east) -> move(3,3 gear!) -> turn_left(north)
      // step3: drill(3,2 B -> 3,2) -> turn_right(east) -> move(4,2) -> turn_left(north) -> (4,2) is G? Put G at (4,2)!
      // Put B at (1,4), (2,3), (3,2)!
      // And make it nested: L(3, [L(1... no, L(3, [drill, turn_right, move, turn_left])]) isn't nested unless we have an inner loop!
      // Let's make an inner loop: each corner has 2 drills!
      // L(2, [L(2, [C('drill')]), C('turn_right')]) ->
      // From (1,5) north: (1,4)B, (1,3)B -> at (1,3) turn_right(east) -> (2,3)B, (3,3)B -> at (3,3) turn_right(south)!
      // Wait if G is at (5,3) and we use `turn_right` -> south, no: if we use `L(2, [L(2, [drill]), turn_right])` then `L(2, [move])`?
      // Better: [L(2, [L(2, [C('drill')]), C('turn_right')]), C('turn_left'), C('move')] -> no, after iter2 we face south, turn_left -> east, move -> (4,3)!
      // Check:
      // (1,5)north:
      // iter1: drill(1,4 B)->drill(1,3 B)->turn_right(east)
      // iter2: drill(2,3 B)->drill(3,3 B)->turn_right(south)
      // after outer loop: turn_left(east) -> move(4,3 gear) -> move(5,3 G)!
      // Bug: inner loop has `move` instead of `drill`, OR outer loop has `turn_left` instead of `turn_right`!
      // If `turn_left` at `0.body.1`: (1,5)->drill(1,4)->drill(1,3)->turn_left(west) -> crashes (0,3)# wall!
      // Wait: if inner loop is `L(2, [C('drill')])` and `0.body.1` is `C('turn_left')`, fixing `0.body.1` (`turn_left` -> `turn_right`) works!
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#BBB.G#',
        '#B###.#',
        '#.....#',
        '#######'
      ],
      // Wait check (1,4)B is row 4 col 1 (`#B###.#`), (1,3)B is row 3 col 1 (`#B..#.#` -> wait row 3 needs B at 1, 2, 3!):
      // Let's write row 3: `#BBB.G#` -> col1:B, col2:B, col3:B, col4:.[gear!], col5:G!
      // Check iter1: (1,5)->drill(1,4 B)->drill(1,3 B)->turn_right(east)
      // iter2: at (1,3) facing east -> drill(2,3 B)->drill(3,3 B)->turn_right(south)!
      // then turn_left(east)->move(4,3 gear)->move(5,3 G)!
      gear: { x: 4, y: 3 },
      program: [L(2, [L(2, [C('drill')]), C('turn_left')]), C('turn_left'), C('move'), C('move')]
    },
    // W6-5 (multi, 7x7) - 回転プレート×ネストループ
    {
      id: 55, world: 6, stageInWorld: 5, title: 'ダブル回転の 時計部屋', role: 'multi',
      hint: 'プレートの うえで むきが かわるのを ループと あわせよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 5, y: 5 },
      map: [
        '#######',
        '#C...C#', // Wait: (1,1)C, (5,1)C
        '#.....#',
        '#.....#',
        '#.....#',
        '#....G#', // Wait: G at (5,5) and gear at (5,1)!
        '#######'
      ],
      // Wait let's trace a cool 3-iteration loop with C plates!
      // Start (1,1, dir:1 east) -> L(3, [L(4, [C('move')])]):
      // iter1: (1,1)->(2,1)->(3,1)->(4,1)->(5,1 C -> rotates south!)
      // iter2: (5,1)->(5,2)->(5,3)->(5,4)->(5,5 C [gear!] -> rotates west!)
      // iter3: (5,5)->(4,5)->(3,5)->(2,5)->(1,5 G!)
      // Bug: inner loop count is 3 (stops at (4,1), misses (5,1 C)!)
      // Fix inner loop count 3 -> 4: hits all corners cleanly!
      // Also what if outer loop count is 2 and inner is 4? No, outer is 3 so inner 3 -> 4 reaches (1,5 G)!
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 5, y: 5 },
      map: [
        '#######',
        '#....C#',
        '#.....#',
        '#.....#',
        '#.....#',
        '#G...C#',
        '#######'
      ],
      program: [L(3, [L(3, [C('move')])])]
    },
    // W6-6 (hack, 7x7) - コンベアとネストでマグネット神ハック
    {
      id: 56, world: 6, stageInWorld: 6, title: 'コンベア迷宮の 磁力ハック', role: 'hack',
      hint: 'コンベアを わたるあいだに、じしゃくを さく裂させよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 2, y: 2 },
      map: [
        '#######',
        '#....G#',
        '#.#.#.#',
        '#.U.R.#', // (2,3)U? No, put U at (1,4)->(1,3), R at (2,3)->(3,3)
        '#.U...#',
        '#.....#',
        '#######'
      ],
      // Let's trace neatly:
      // start(1,5, dir:0 north), gear(2,2), G(5,1)
      // map:
      // 0: #######
      // 1: #....G#
      // 2: #.#.#.#  (2,2) is '.' [gear] surrounded by walls? Let's put walls at (1,2)#, (3,2)#, (2,1)#, (2,3)R!
      // Wait: if (1,1)#, (2,1)#, (3,1).? No, G at (5,1) needs row 1 open from x=3..5!
      // Put gear at (1,2) in a walled alcove: (0,2)#, (2,2)#, (1,1)#, (1,3)O!
      // Look at (2,3): from (2,3), (1,2) is dx=-1, dy=-1!
      // Trace:
      // 0: ########? 7x7:
      // 0: #######
      // 1: ##...G#  (1,1)#
      // 2: #.#.#.#  (1,2).[gear!], (2,2)#
      // 3: #O..R.#  (1,3)O, (2,3)., (3,3)., (4,3)R -> conveys (5,3)
      // 4: #.....#
      // 5: #.....#  start(2,5, dir:0 north)
      // 6: #######
      // Program: [L(2, [C('move')]), C('wait'), C('turn_right'), L(3, [C('move')]), C('turn_left'), L(2, [C('move')])]
      // Let's trace!
      // 0: (2,5)->(2,4)->(2,3)
      // 1: wait (CHANGE TO magnet! grabs (1,2)gear through the corner!)
      // 2: turn_right(east)
      // 3: move1(3,3), move2(4,3 R -> conveys 5,3), move3(6,3 # wall!) -> oh! 3 moves hits wall!
      // So make `3` count = 2: move1(3,3), move2(4,3 R -> conveys 5,3)!
      // 4: turn_left(north)
      // 5: L(2, [move]) -> (5,2)->(5,1)G!
      // And make Base FAIL at `1` by putting `turn_left` instead of `wait` (walks into O or wall)!
      // Then: Fix 1 (`turn_left` -> `wait`) = A-rank, Fix 1 (`turn_left` -> `magnet`) = S-rank!!
      // Wait, make it a proper nested loop stage!
      // Put `L(2, [L(2, [C('move')]), C('turn_right')])`?
      // At (2,5) north:
      // iter1: move(2,4)->move(2,3) -> turn_right(east)
      // iter2: move(3,3)->move(4,3 R -> 5,3) -> turn_right(south!) -> oops faces south. If `W` at (5,3), rotates CCW back to north? No, `turn_right` happens AFTER conveyor!
      // Even simpler nested loop for W6-6:
      // Outer loop `L(2, [L(2, [C('move')]), C('turn_right'), C('wait')])`?
      // Let's trace with `start(1,5, dir:0)`, `gear(2,2)` (in walled box `(2,1)#, (1,2)#, (3,2)#, (2,3)#`? wait `(2,3)#` means approach from `(3,3)`):
      // Let's trace:
      // L(2, [L(2, [C('move')]), C('turn_right')]) ->
      // iter1: (1,5)->(1,3), east!
      // iter2: (1,3)->(3,3), south!
      //Wait at (3,3), `magnet` grabs `(2,2)`gear!
      // So `program = [L(2, [L(2, [C('move')]), C('turn_right'), C('turn_left')]), C('move'), C('move')]`:
      // Wait if `0.body.2` is `turn_left` (bug):
      // iter1: (1,5)->(1,3)->right->left(north)!
      // iter2: (1,3)->(1,1)->right->left(north)->move hits (1,0)# wall FAIL!
      // Fix `0.body.2` (`turn_left` -> `wait`):
      // iter1: (1,5)->(1,3)->east->wait
      // iter2: (1,3)->(3,3)->south->wait -> then `move(3,4)->move(3,5 G)` (**A-rank!**)
      // Fix `0.body.2` (`turn_left` -> `magnet`):
      // iter1: (1,5)->(1,3)->east->magnet(whiff)
      // iter2: (1,3)->(3,3)->south->magnet(grabs (2,2)gear!!) -> then `move(3,4)->move(3,5 G)` (**S-rank!!**)
      // AMAZING!! Look at that clean 7x7 nested loop stage!
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#...#.#',
        '#.#.#.#',
        '#..G..#',
        '#######'
      ],
      // Check (2,2): map[2]='###' -> make (2,2) '.' and surround it:
      // map[1]='#.###.#', map[2]='#.#.#.#', map[3]='#...#.#', map[4]='#.#.#.#', map[5]='#..G..#'
      // Trace: (1,5)->(1,4)->(1,3)->east->(2,3)->(3,3)->south->(3,4)->(3,5 G)!
      // And (2,2) is surrounded by (2,1)#, (1,2)#, (3,2)#, (2,3). -> let's put '#' at (1,2),(3,2),(2,1), and 'O' at (2,3)? Wait we walk through (2,3)! So (2,2) has # on N, W, E, and from (3,3) dx=-1,dy=-1 grabs it!
      program: [L(2, [L(2, [C('move')]), C('turn_right'), C('turn_left')]), C('move'), C('move')]
    },
    // W6-7 (hack, 8x7) - ターボ2重ループ暴走ハック
    {
      id: 57, world: 6, stageInWorld: 7, title: 'ターボ連打の 暴走トラップ', role: 'hack',
      hint: 'ターボの くりかえしが おおすぎる！かいすうを へらして ギアへ着地！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 5, y: 1 },
      map: [
        '########',
        '#.....G#',
        '#O#O#O.#',
        '#......#',
        '#O#O#O.#',
        '#......#',
        '########'
      ],
      // Trace: (1,5)north -> L(2, [L(2, [turbo]), turn_right]):
      // iter1: (1,5)->turbo(1,3)->turbo(1,1)->east!
      // iter2: (1,1)->turbo(3,1)->turbo(5,1)[gear!]->south!
      // Then move(5,2)? No, (6,1) is G! So if we don't turn_right at the end, or if outer is L(2,...) and inner is L(2,[turbo]):
      //Wait: if inner is `L(3, [turbo])` (BUG! hits wall (1,0)# or (7,1)#!):
      // Base: iter1 hits (1,0)# wall FAIL!
      // Fix `0.body.0` count `3 -> 2`:
      // iter1: (1,5)->(1,3)->(1,1)->east!
      // iter2: (1,1)->(3,1)->(5,1)[gear]->south? Wait G is at (6,1), or put G at (5,3)!
      // Put G at (5,3) (and map[2][5] is 'O' -> turbo skips (5,2)O to (5,3)G? Or '.' at (5,2) and move to (5,3)G!):
      // Let's put G at (5,3) and '.' at (5,2), and `move, move` after outer loop:
      // Base: hits (1,0)# wall FAIL!
      // Fix `0.body.0` count `3 -> 2`: ends outer loop at (5,1)[gear] facing south -> `move(5,2)` -> `move(5,3 G)`!
      program: [L(2, [L(3, [C('turbo')]), C('turn_right')]), C('move'), C('move')]
    },
    // W6-8 (hack, 8x7) - 鉄橋＋ジャンプのネスト
    {
      id: 58, world: 6, stageInWorld: 8, title: '鉄とバネの 2重奏', role: 'hack',
      hint: '鉄ブロックを ひきよせた あと、あなを どう わたる？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 2, y: 4 },
      map: [
        '########',
        '#......#',
        '#......#',
        '#......#',
        '#....G.#',
        '#.OIOI.#',
        '########'
      ],
      // Look at row 5: (1,5)start, (2,5)O, (3,5)I, (4,5)., (5,5)O, (6,5)G!
      // If program is:
      // [C('wait'), L(2, [L(2, [C('move')]), C('wait')]), C('jump')] ->
      // Wait: if 0 is `wait` (FIX TO `magnet`!):
      // Base: `wait` -> move hits (2,5)O FAIL!
      // Fix 0 (`wait` -> `magnet`): grabs (2,4)gear AND bridges (2,5)O->F!
      // Then L(2, [L(2, [move]), wait]) -> 4 moves -> (2,5)->(3,5)->(4,5)->(5,5)O!!
      // Oh! 4 moves hits (5,5)O! We only want 3 moves to (4,5), then `jump` over (5,5)O to (6,5)G!
      // Let's put O at (6,5) and G at (7,5)? No, 8 cols means index 6 is max before wall 7!
      // So make row 5: `#.OI..G#`? No, make `L(2, [L(2, [move])])` move 4 steps onto `(5,5)` and `(6,5)` is `O` and `(6,4)` is `G`?
      // Better: 0:`magnet`, 1:`L(2, [L(2, [move])])`? No, make the bug INSIDE the nested loop!
      // Suppose start(1,5,dir:1), map[5]='#.OI.O.#', map[4]='#.....G#' -> G at (6,4)?
      // Check:
      // (1,5)->magnet(bridges 2,5 F, grabs 2,4 gear)->L(3, [move]) -> (2,5)->(3,5)->(4,5)->jump(6,5)->turn_left(north)->move(6,4 G)!
      // Make it nested: [L(2, [C('magnet'), L(2, [C('move')])]), C('turn_left'), C('move')] ->
      // iter1 at (1,5)east: magnet(grabs 2,4 gear, bridges 2,5 F) -> move(2,5 F)->move(3,5)
      // iter2 at (3,5)east: magnet(bridges 4,5 O with 5,5 I!!) -> move(4,5 F)->move(5,5)!!
      // THEN turn_left(north) -> move(5,4 G)!!
      // CHECK ROW 5: `#.OI.I.#` -> wait from (3,5), dist 1 is (4,5)O, dist 2 is (5,5)I! So `#.OIOI.#`!!
      // Trace `#.OIOI.#`:
      // 0:#, 1:.(start), 2:O, 3:I, 4:O, 5:I, 6:., 7:#!
      // iter1 at (1,5): magnet -> pulls (3,5)I to (2,5)F! (3,5) becomes '.'! move1(2,5 F)->move2(3,5)!
      // iter2 at (3,5): magnet -> pulls (5,5)I to (4,5)F! (5,5) becomes '.'! move1(4,5 F)->move2(5,5)!
      // Then turn_left(north) -> move(5,4 G)!!
      // Bug: inner loop is `L(3, [move])` (falls into 4,5 O on step 3!) or `magnet` is `wait` (falls into 2,5 O!)!
      // Let's make bug: `0` outer loop has `C('wait')` instead of `C('magnet')`? Wait if `0.body.0` is `wait`, fixing `wait -> magnet` solves BOTH bridges in one nested loop edit!!
      // Wait: what if `0.body.1` is `L(3, [move])`? Then fixing `3 -> 2` fixes it too! Let's put `magnet` and `L(3, [move])` so `3 -> 2` is the fix!
      program: [L(2, [C('magnet'), L(3, [C('move')])]), C('turn_left'), C('move')]
    },
    // W6-9 (boss, 8x8)
    {
      id: 59, world: 6, stageInWorld: 9, title: '3だん階段の 大からくり', role: 'boss',
      hint: 'ネストループで トゲと ヒビカベを いっきに のぼりきれ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 55,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#....#G#', //Wait: put G at (6,2) or (5,1)?
        '#...B..#',
        '#..B^..#',
        '#.B^...#',
        '#......#',
        '########'
      ],
      // Let's trace a clean 3-iteration nested boss!
      // Start (1,6, dir:1 east):
      // Loop 3 times: [drill_or_jump?]:
      // Wait: (1,6)east -> L(3, [L(2, [move]), turn_left, move, turn_right])?
      // Let's put B at (2,6), (4,5), (6,4)?
      // Even cleaner:
      // 0: ########
      // 1: #......#
      // 2: #....#.#
      // 3: #....#G#  (6,3)G
      // 4: #...BB.#  (4,4)B, (5,4)B, (6,4).[gear?]
      // 5: #..^...#
      // 6: #.O....#
      // 7: ########
      // Trace:
      // Start (1,6, dir:1 east) ->
      // L(2, [C('jump'), C('turn_left'), C('jump'), C('turn_right')])?
      // iter1: (1,6)east -> jump(over 2,6 O -> 3,6) -> left(north) -> jump(over 3,5 ^ -> 3,4) -> right(east)
      // Wait at (3,4)east -> iter2 would try to jump over (4,4)B and stun!
      // So put `B` at `(4,4)` and `(5,4)`, `gear` at `(6,4)` and `G` at `(6,2)`:
      // 0: L(2, [L(1... no, 0: L(2, [C('jump'), C('turn_left')]), wait: [L(2, [C('jump')]), C('turn_right')]?
      // Let's make:
      // [L(2, [C('jump'), C('turn_left'), C('jump'), C('turn_right')])] ->
      // If `0` is `L(2, [...])` and `(1,6)`->jump(3,6)->left(north)->jump(3,4)->right(east)!
      // Next at (3,4)east, `O` at `(4,4)` and `^` at `(5,3)`!
      // Trace iter2 from (3,4)east: jump(over 4,4 O -> 5,4) -> left(north) -> jump(over 5,3 ^ -> 5,2 [gear!]) -> right(east)!
      // Then at (5,2)east: `L(2, [drill])`? No, `drill` breaks `(6,2)B` and `move` -> `(6,2)`? Put `B` at `(6,2)`? No, `G` at `(6,2)`? Wait if `G` is at `(6,2)`, just `move`! Put `B` at `(6,2)` and `G` at `(6,1)` or `B` at `(5,2)`?
      // Put `gear` at `(5,2)`, `B` at `(6,2)`? No, put `gear` at `(5,2)`, `B` at `(6,2)`? Then `drill` breaks `(6,2)B` and steps to `(6,2)`, then `turn_left`, `move` -> `(6,1)G`? Or put `G` at `(6,2)` and `B` at `(5,2)`? No, gear is at `(5,2)`.
      // Put `gear` at `(5,4)` (stepped on in iter2!), `B` at `(6,2)`, `G` at `(6,1)`?
      // Look:
      // [L(2, [C('jump'), C('turn_left'), C('jump'), C('turn_right')]), C('drill'), C('turn_left'), C('move')]
      // Let's trace!
      // map:
      // 0: ########
      // 1: #.....G#  (6,1)G
      // 2: #....#B#  (5,2)., (6,2)B
      // 3: #....^.#  (5,3)^
      // 4: #...O..#  (4,4)O, (5,4).[gear!]
      // 5: #..^...#  (3,5)^
      // 6: #.O....#  (1,6)start, (2,6)O, (3,6).
      // 7: ########
      // iter1: (1,6)->jump(3,6)->left->jump(3,4)->right
      // iter2: (3,4)->jump(5,4 gear!)->left->jump(5,2)->right
      // after loop: drill(breaks 6,2 B -> 6,2) -> turn_left(north) -> move(6,1 G)!
      // Bug: `0` loop has `C('move')` at index 2 instead of `C('jump')` (hits (3,5)^ spike)!
      // Wait: also `L(2, [C('jump'), C('turn_left')])`? Let's keep outer loop nested!
      // Replace `1: drill` with `L(2, [C('drill')])` and put `B` at `(6,2)` AND `(6,1)` and `G` at `(6,1)`? No, `B` at `(6,2)` and `G` at `(7,2)`? No, `B` at `(6,2)` and `B` at `(6,1)`? No, `G` at `(6,1)` can't also be `B`. Put `B` at `(5,2)`? No, `L(2, [L(2, [C('jump'), C('turn_left')])])`? No, `[L(2, [L(2, [C('jump'), C('turn_left')]), C('turn_right')])]`:
      //Wait: `L(2, [C('jump'), C('turn_left'), C('jump'), C('turn_right')])` has 1 loop, so to make it nested in W6-9, wrap `[drill]` or put inner loop `[C('jump'), C('turn_left')]`? No, `[C('jump'), C('turn_left'), C('jump'), C('turn_right')]` is 2x `[jump, turn_left]`? Wait `[jump, turn_left]` x 2 turns 180 deg! Instead `[jump, turn_left, jump, turn_right]` + inner `L(2, [drill])` for 2 B's `(6,2)B`, `(7,2)`? Wait 8 cols is 0..7 so `(6,2)` is col 6! If `(5,2)` is `.`, `(6,2)` is `B`, `(6,1)` is `G`: what if we start at `(1,6)` and end at `(5,2)` facing east, `drill` (6,2)B, `turn_left`, `move` (6,1)G, and put a nested loop in `0` like `L(2, [L(1...` (no count 1).
      // Even better nested loop for W6-9:
      // `L(2, [L(2, [C('turbo')]), C('turn_right')])`? Already used in 57.
      // How about `L(2, [C('drill'), L(2, [C('move')]), C('turn_left')])`!
      // Trace from (1,6, dir:1 east):
      // iter1: drill(2,6 B -> 2,6) -> move(3,6) -> move(4,6) -> turn_left(north)
      // iter2: drill(4,5 B -> 4,5) -> move(4,4) -> move(4,3) -> turn_left(west)
      // Then `L(2, [C('jump')])` -> (4,3)west -> jump(over 3,3 O -> 2,3 gear!) -> jump(over 1,3 O -> 0,3)? No, put G at (2,3) and gear at (4,4)!!
      // Trace:
      // iter1: (1,6)east -> drill(2,6 B->2,6) -> move(3,6)->move(4,6)->turn_left(north)
      // iter2: (4,6)north -> drill(4,5 B->4,5) -> move(4,4 gear!)->move(4,3)->turn_left(west)
      // after loop: jump(over 3,3 ^ -> 2,3 G)!!
      // Check map:
      // 0: ########
      // 1: #......#
      // 2: #......#
      // 3: #.G^...#  (2,3)G, (3,3)^, (4,3).
      // 4: #......#  (4,4).[gear]
      // 5: #...B..#  (4,5)B
      // 6: #.B....#  (1,6)start, (2,6)B, (3,6)., (4,6).
      // 7: ########
      // Bug: `0.body.1` (inner loop) count is `3` (overshoots `(4,6)` into `(5,6)` or `(4,2)#`!) -> Fix `3 -> 2`!
      // Wait: if `0.body.1` count is `3`:
      // iter1: (1,6)->drill(2,6)->(3,6)->(4,6)->(5,6)->left(north) -> hits `(5,5)`! Put `^` at `(5,5)` so Base fails on spike!!
      program: []
    },
    // W6-10 (boss, 8x8)
    {
      id: 60, world: 6, stageInWorld: 10, title: '第6層ボス：多重時計の迷宮', role: 'boss',
      hint: '第6層の 大ボス！ネスト×プレート×じしゃくの 神ハックを さがしだせ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 60,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 2, y: 3 },
      map: [
        '########',
        '#......#',
        '#C...C.#', // (1,2)C, (5,2)C
        '#.###..#',
        '#..IO..#', // Wait: let's trace carefully!
        '#......#',
        '#......#',
        '########'
      ],
      // Let's design an epic W6-10 finale!
      // Start (1,6, dir:1 east):
      // 0: L(2, [L(2, [C('move')]), C('turn_left')]) ->
      //   iter1: (1,6)->(2,6)->(3,6)->left(north)
      //   iter2: (3,6)->(3,5)->(3,4)->left(west)
      // Look! At (3,4) facing west:
      // Put `O` at `(2,4)` and `I` at `(1,4)` and `gear` at `(2,3)`!
      // Then `1: C('wait')` (BUG! Fix to `magnet`! Or `jump` for A-rank? Wait `(1,4)` has `I`, so `jump` stuns! Wait what if `(1,4)` is `I`, `(1,3)` is `C`? No, from `(3,4)` facing west: `magnet` grabs `(2,3)`gear AND pulls `(1,4)I` into `(2,4)O -> F`!)
      // Then `2: L(2, [C('move')])` -> `(2,4 F) -> (1,4)`!
      // Wait at `(1,4)` put `C` (clockwise plate -> rotates from west to north!)
      // Wait: `I` was at `(1,4)`, so `(1,4)` cannot also be `C`. Put `W`/`C` at `(1,3)` or put `I` at `(1,4)`, move to `(1,4)`, then `turn_right`(north), `L(2, [turbo])` -> `(1,2)` -> `(1,0)`?
      // Better:
      // (3,4) facing west -> `magnet` (bridges `(2,4)O->F`, grabs `(2,3)gear`) -> `move(2,4 F)` -> `move(1,4)` -> `turn_right(north)` -> `turbo`(skips `(1,3)^` -> `(1,2 C -> rotates CW to east!)`) -> `L(2, [turbo])` -> `(3,2)` -> `(5,2 G)`!
      // Make it 2 nested loops!
      // 0: L(2, [L(2, [C('move')]), C('turn_left')]) -> (3,4) facing west
      // 1: C('wait') -> (FIX TO `magnet`!)
      // 2: L(2, [C('move')]) -> (2,4 F) -> (1,4)
      // 3: C('turn_right') (north)
      // 4: C('turbo') -> skips `(1,3)^` -> `(1,2 C -> east!)`
      // 5: L(2, [C('turbo')]) -> `(3,2)` -> `(5,2 G)`!
      // Wait: what if `G` is at `(5,2)` and `^` is at `(1,3)` and `I` is at `(1,4)` and `O` is at `(2,4)` and `gear` is at `(2,3)`?
      // Check Base: `1` is `wait` -> `2` hits `(2,4)O` FALL FAIL!
      // Check Fix `1` (`wait` -> `magnet`): bridges `(2,4)F` + grabs `(2,3)gear` -> reaches `(1,4)` -> north -> `turbo` over `(1,3)^` to `(1,2 C -> east!)` -> `turbo` x2 to `(5,2)G`! (**S-rank!!**)
      // Let's also check if `C` at `(1,2)` works on `turbo`: yes, `turbo` ends on `(1,2)`, `applyTileEffects` sees `C` and rotates CW to `east`!
      program: []
    }
  ];

  // W6-6 map 確定上書き
  stages[5].map = [
    '#######',
    '#.###.#',
    '##.##.#',
    '#...#.#',
    '#.#.#.#',
    '#..G..#',
    '#######'
  ];

  // W6-7 map 確定上書き
  stages[6].map = [
    '########',
    '#......#',
    '#O#O#..#',
    '#....G.#',
    '#O#O#O.#',
    '#......#',
    '########'
  ];

  // W6-9 map & program 確定上書き
  stages[8].start = { x: 1, y: 6, dir: 1 };
  stages[8].map = [
    '########',
    '#......#',
    '#......#',
    '#.G^...#',
    '#......#',
    '#...B^.#',
    '#.B....#',
    '########'
  ];
  stages[8].gear = { x: 4, y: 4 };
  stages[8].program = [L(2, [C('drill'), L(3, [C('move')]), C('turn_left')]), C('jump')];

  // W6-10 map & program 確定上書き
  stages[9].map = [
    '########',
    '#......#',
    '#C...G.#',
    '#^^....#',
    '#IO....#',
    '#......#',
    '#......#',
    '########'
  ];
  stages[9].gear = { x: 2, y: 3 };
  stages[9].program = [
    L(2, [L(2, [C('move')]), C('turn_left')]),
    C('wait'),
    L(2, [C('move')]),
    C('turn_right'),
    C('turbo'),
    L(2, [C('turbo')])
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
