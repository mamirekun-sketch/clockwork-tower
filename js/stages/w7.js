/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第7階層：W7（Stage 61〜70：条件分岐①・基本センサー）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };
  var L = function (count, body) { return { type: 'loop', count: count, body: body }; };
  var IF = function (condition, thenBranch, elseBranch) {
    return { type: 'if', condition: condition, thenBranch: thenBranch || [], elseBranch: elseBranch || [] };
  };

  var CONDS_W7 = ['front_hole', 'front_wall'];
  var PARTS_ALL = ['spring', 'drill', 'turbo', 'magnet'];

  var stages = [
    // W7-1 (intro, 7x5) - 基本センサー：もし前に穴なら ジャンプ！
    {
      id: 61, world: 7, stageInWorld: 1, title: 'あなみつけセンサー', role: 'intro',
      hint: '「もし まえが あな・トゲ」のなかの めいれいを なおそう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#.O..G#',
        '#.....#',
        '#######'
      ],
      // (1,2)->L(3, [IF(front_hole, [wait], [move])])!
      // wait: もし(2,2)がOなら wait(そのまま止まる) -> (2,2)Oが前なので次のループも wait! タイムアウト/未達 FAIL!
      // Fix `wait` -> `jump`:
      // iter1: front is (2,2)O -> jump to (3,2)!
      // iter2: front is (4,2). -> else: move to (4,2 gear)!
      // iter3: front is (5,2)G -> else: move to (5,2 G)!
      program: [L(3, [IF('front_hole', [C('wait')], [C('move')])])]
    },
    // W7-2 (intro, 6x6) - 条件ひし形の書き換え入門！
    {
      id: 62, world: 7, stageInWorld: 2, title: 'カベみつけセンサー', role: 'intro',
      hint: 'きいろい ひしがた「じょうけん」を タップして カベセンサーに かえよう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 1, y: 1 },
      map: [
        '######',
        '#...G#',
        '#....#',
        '#....#',
        '#....#',
        '######'
      ],
      // (1,4)north -> L(4, [IF(front_hole, [turn_right], [move]), C('wait')?])
      // Wait: if L(4, [IF(front_hole, [turn_right]), move]):
      // If condition is changed to `front_wall`:
      // iter1 at (1,4): not wall -> move(1,3)
      // iter2 at (1,3): not wall -> move(1,2)
      // iter3 at (1,2): not wall -> move(1,1 gear!)
      // iter4 at (1,1): front IS (1,0)# wall! -> turn_right(east) -> move(2,1)!
      // Then after loop: `L(2, [move])` -> (3,1)->(4,1 G)!
      // Base: condition is `front_hole` -> never turns -> hits (1,0)# wall FAIL!
      program: [L(4, [IF('front_hole', [C('turn_right')]), C('move')]), L(2, [C('move')])]
    },
    // W7-3 (multi, 7x6) - カベで曲がるか、穴を飛び越えるか（複数解）
    {
      id: 63, world: 7, stageInWorld: 3, title: 'ふたつのセンサーえらび', role: 'multi',
      hint: 'カベをよける(A)か、トゲをとびこえて ギアをねらう(S)か！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 5, y: 4 },
      map: [
        '#######',
        '#.....#',
        '#....G#',
        '#.#.#.#',
        '#..^..#',
        '#######'
      ],
      // Look! (1,4)east -> (2,4)., (3,4)^, (4,4)., (5,4)[gear!], (5,3)., (5,2)G!
      // Look at `program`:
      // [L(3, [IF('front_hole', [C('move')], [C('move')])]), C('turn_left'), L(2, [C('move')])]
      // Trace:
      // Base: hits (3,4)^ spike FAIL!
      // Fix `front_hole` branch `move` -> `jump`:
      // iter1 at (1,4): front(2,4). -> else move(2,4)
      // iter2 at (2,4): front(3,4)^ -> then jump(4,4)!
      // iter3 at (4,4): front(5,4). -> else move(5,4)[gear!]
      // After loop: turn_left(north) -> L(2, [move]) -> (5,3)->(5,2 G) (**S-rank!!**)
      // Wait: what if `else` branch `move` is changed to `turbo`?
      // iter1 at (1,4): else turbo -> (3,4)^ FAIL!
      // What if we ALSO give an A-rank route by turning north at (2,4) via (2,2)->(5,2)G?
      // Put `(2,3)` `.` and `(2,2)` `.` (open row 3 col 2), and check:
      // If `0.body.0.then.0` (`move` -> `turn_left`), then at `(2,4)` facing east, front is `(3,4)^` -> `turn_left`(north), then `L(3...)`? No, iter3 moves `(2,3)` and `turn_left` turns west!
      // Still, `move -> jump` vs `move -> turbo` (both jump/turbo over `^`? Let's check `turbo` on `(2,4)` facing `(3,4)^` -> lands `(4,4)`! Both `jump` and `turbo` work!).
      program: [L(3, [IF('front_hole', [C('move')], [C('move')])]), C('turn_left'), L(2, [C('move')])]
    },
    // W7-4 (multi, 7x7) - カベなら右折、さもなくば直進！
    {
      id: 64, world: 7, stageInWorld: 4, title: 'まがりかど・パトロール', role: 'multi',
      hint: 'カベに ぶつかるまえに みぎか ひだりか、どっちに まがる？',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 1, dir: 1 },
      gear: { x: 5, y: 1 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.###.#',
        '#G....#',
        '#######',
        '#######'
      ],
      // (1,1)east -> L(3, [L(4, [IF(front_wall, [turn_left], [move])])])?
      //Wait: (1,1)east: 4 moves -> (5,1)[gear!]. Wait on 5th step it sees wall `(6,1)#`.
      // Let's trace L(3, [L(3, [move]), IF(front_wall, [turn_left])]):
      // Wait: if inner is L(4, [move]), after 4 moves at (1,1)->(5,1)[gear!], front IS (6,1)# wall!
      // Then IF(front_wall) triggers turn_right(south)!
      // Iter2: 4 moves -> (5,5? row 5 is #! Make 7x7 with row 5 open!):
      // Let's make row 5: '#G....#' (5,5) is '.', (1,5) is G!
      // Trace L(3, [L(4, [move]), IF(front_wall, [turn_left])]):
      // Bug: `turn_left` instead of `turn_right` -> turns north into (5,0)# wall!
      // Fix `turn_left` -> `turn_right`:
      // iter1: (1,1)->(5,1 gear)->wall(6,1)# -> south!
      // iter2: (5,1)->(5,5)->wall(5,6)# -> west!
      // iter3: (5,5)->(1,5 G)!
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.###.#',
        '#.###.#',
        '#G....#',
        '#######'
      ],
      program: [L(3, [L(4, [C('move')]), IF('front_wall', [C('turn_left')])])]
    },
    // W7-5 (multi, 7x7) - 穴のときはジャンプ、カベのときはドリル
    {
      id: 65, world: 7, stageInWorld: 5, title: 'ダブル判定の 廊下', role: 'multi',
      hint: '「まえが あな」と「まえが カベ」の ふたつのセンサーが ならんでるよ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.O.BG#', // (1,3)start, (2,3)O, (3,3).[gear!], (4,3)B, (5,3)G
        '#.###.#',
        '#.....#',
        '#######'
      ],
      // Trace: L(3, [IF('front_hole', [jump]), IF('front_wall', [move]), C('move')])?
      // Let's trace!
      // iter1 at (1,3): front(2,3)O -> front_hole TRUE -> jump(3,3 gear)! front_wall FALSE -> move(4,3)??
      // Oops, after jump(3,3) front is (4,3)B so front_wall IS TRUE!
      // If front_wall action is `drill`, it breaks (4,3)B -> (4,3)! Then `move` reaches (5,3)G in iter1!
      // Wait if bug is front_wall action = `move` -> crashes into (4,3)B!
      // Fix `front_wall` action `move` -> `drill`:
      // iter1: front(2,3)O -> jump(3,3 gear) -> front(4,3)B -> front_wall TRUE -> drill(4,3) -> move(5,3 G)!
      // Make it 2 steps so the loop actually iterates:
      // Put G at (5,5) and `C('turn_right')` on wall? No, `B` at (4,3) and `O` at (4,3)? Keep it super clean:
      // [L(2, [IF('front_hole', [C('jump')]), IF('front_wall', [C('move')])])] -> wait Base hits (4,3)B! Fix `move -> drill`:
      // iter1: (1,3) -> front(2,3)O -> jump(3,3 gear) -> front(4,3)B -> drill(4,3)!
      // iter2: (4,3) -> front(5,3)G -> neither hole nor wall -> wait we need a `move` at end or in else!
      // Add `C('wait')`? No, add `elseBranch: [C('move')]` on the 2nd IF:
      // iter1: (1,3) -> front(2,3)O -> jump(3,3 gear) -> front(4,3)B -> then: drill(4,3)!
      // iter2: (4,3) -> front(5,3)G -> front_hole FALSE -> front_wall FALSE -> else: move(5,3 G)!!
      // Double check Base: `then` of 2nd IF is `move` -> hits (4,3)B wall FAIL!
      program: [L(2, [IF('front_hole', [C('jump')]), IF('front_wall', [C('move')], [C('move')])])]
    },
    // W7-6 (hack, 7x7) - 条件書き換え神ハック！
    {
      id: 66, world: 7, stageInWorld: 6, title: 'センサー逆転ハック！', role: 'hack',
      hint: '「まえが カベ」じゃなくて「まえが あな」に かえると ギアのみちへ まがるぞ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#O....#',
        '#....G#',
        '#.#...#',
        '#.....#',
        '#######'
      ],
      // Look at (1,5) north:
      // (1,4) is '.', (1,3) is 'O'!
      //Wait: if condition is `front_hole` at (1,4):
      // iter1 at (1,5): front(1,4). -> move(1,4)
      // iter2 at (1,4): front(1,3)O -> turn_right(east)! -> move(2,4)
      // Wait we want to turn at (1,4) toward (2,4) -> (3,4) -> (3,3 gear) -> ...
      // Put `O` at `(1,2)` and `gear` at `(3,3)` and `G` at `(5,3)`:
      // map:
      // 0: #######
      // 1: #.....#
      // 2: #O....#  (1,2)O
      // 3: #....G#  (3,3)[gear!], (5,3)G
      // 4: #.#...#  (1,4)., (2,4)#
      // 5: #.....#  (1,5)start(north)
      // 6: #######
      // Trace if condition is `front_hole`:
      // iter1 at (1,5): front(1,4). -> move(1,4)
      // iter2 at (1,4): front(1,3). -> move(1,3)
      // iter3 at (1,3): front(1,2)O -> then: turn_right(east) -> move(2,3)
      // iter4 at (2,3): front(3,3). -> move(3,3 gear!)
      // iter5 at (3,3): front(4,3). -> move(4,3)
      // iter6 at (4,3): front(5,3)G -> move(5,3 G!)
      // Wait: we want Base (with `front_wall`) to FAIL!
      // Check Base (`front_wall`):
      // iter1(1,5)->(1,4), iter2(1,4)->(1,3), iter3(1,3)->front(1,2)O is NOT wall -> moves into (1,2)O FALL FAIL!
      // Fix condition `front_wall` -> `front_hole`: turns right at (1,3) BEFORE falling into (1,2)O -> walks across row 3 grabbing (3,3)gear to (5,3)G!!
      // Also what if `then` (`turn_right`) is changed to `jump`?
      // With `front_wall`: hits (1,2)O! So ONLY changing the condition diamond `front_wall` -> `front_hole` clears!
      program: [L(4, [IF('front_wall', [C('turn_right')]), C('move')]), L(2, [C('move')])]
    },
    // W7-7 (hack, 8x7) - ターボで駆け抜けてギアを拾うセンサー神ハック
    {
      id: 67, world: 7, stageInWorld: 7, title: 'センサー×ターボ かけぬけ', role: 'hack',
      hint: '「ジャンプ」で とびこすと ギアを とりのがす！なにに かえる？',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 4, y: 3 },
      map: [
        '########',
        '#......#',
        '#.####.#',
        '#..O..G#', // (1,3)start, (2,3)., (3,3)O, (4,3).[gear!], (5,3)., (6,3)G
        '#.####.#',
        '#......#',
        '########'
      ],
      // Wait: if from (2,3) facing (3,3)O:
      // `jump` lands on (4,3 gear) too! To make `jump` SKIP the gear and `turbo` COLLECT the gear:
      // Put `gear` at `(3,3)` and `O` at `(2,3)`!! No, `turbo` at `(1,3)` skips `(2,3)O` and lands on `(3,3)gear`, `jump` also lands on `(3,3)gear`!
      // How does `turbo` collect a gear that `jump` misses?
      // When the gear is on the **1st step** (`2,3` or `4,3`), i.e., `1st step = .(gear)`, `2nd step = .`, and AFTER that is `O`!
      // Wait: if `IF(front_hole)` triggers BEFORE `O`, the 1st step IS `O`!
      // Ah! What if `IF(front_wall)` triggers BEFORE `B`? No, `turbo` hits `B`.
      // How about `IF(front_hole)` -> `turbo`? No, `turbo` skips 1st step which is `O`, so 1st step has no gear.
      // Instead, put `gear` at `(4,2)` and `IF(front_hole, [turn_left])`? No, what if `IF(front_hole)` triggers on `(2,3)O` -> `jump` to `(4,3)`?
      // Let's make `IF(front_hole, [jump])` vs `else` has `move` (bug: `else` has `wait`? No: `then` has `move`, `else` has `turbo`!):
      // Let's check:
      // map[3]: `#.O.O.G#` -> (1,3)start, (2,3)O, (3,3).[gear], (4,3)O, (5,3)., (6,3)G? Wait 8 chars: 0:#, 1:., 2:O, 3:., 4:O, 5:., 6:G, 7:#!
      // Wait: if `program` is `[L(3, [IF('front_hole', [C('move')], [C('move')])])]`:
      // Base: hits (2,3)O FALL!
      // Fix `then`: `move` -> `jump`:
      // iter1 at (1,3): front(2,3)O -> jump(3,3 gear!)
      // iter2 at (3,3): front(4,3)O -> jump(5,3)
      // iter3 at (5,3): front(6,3)G -> else move(6,3 G)!
      // AND what if there's an A-rank route above? Put a side path at `(1,2)->(6,2)->(6,3)G` if `then` is `turn_left`? No, keep it crisp:
      // Let's put `gear` at `(5,3)` and `O` at `(2,3)` and `O` at `(4,3)` and make `L(4, ...)` where `magnet` at `(3,3)` or `turbo` at `(3,3)` works!
      // Even simpler: `map[3] = '#.O..OG#'`? No, `#.O..G.#`: (1,3)start, (2,3)O, (3,3)., (4,3).[gear], (5,3)G!
      // If `program` is `[L(3, [IF('front_hole', [C('jump')], [C('wait')])])]`:
      // Base: jumps (1,3)->(3,3), then front(4,3). -> else `wait` forever!
      // Fix `else`: `wait` -> `move` -> (3,3)->(4,3 gear)->(5,3 G)!
      // Fix `else`: `wait` -> `turbo` -> (3,3)->(5,3 G) skipping (4,3 gear) -> **A-rank!!**
      // WHOA!! Look at that:
      // - Base: `wait` stops at `(3,3)` FAIL!
      // - Fix `else` (`wait` -> `turbo`): jumps over `(4,3)`? No, `turbo` lands on `(5,3)G` through `(4,3)`gear so it collects gear too!
      // - Fix `else` (`wait` -> `jump`): jumps over `(4,3)`gear and lands on `(5,3)G` -> **A-rank (gear missed)!!**
      // - Fix `else` (`wait` -> `move`): walks through `(4,3)`gear to `(5,3)G` -> **S-rank!!**
      // BRILLIANT!!
      map: [
        '########',
        '#......#',
        '#.####.#',
        '#.O..G.#',
        '#.####.#',
        '#......#',
        '########'
      ],
      gear: { x: 4, y: 3 },
      program: [L(3, [IF('front_hole', [C('jump')], [C('wait')])])]
    },
    // W7-8 (hack, 8x7) - 回転プレート＋センサー分岐
    {
      id: 68, world: 7, stageInWorld: 8, title: 'プレートとセンサーの わな', role: 'hack',
      hint: 'プレートで まがったあとに、まえの カベを どうするかだ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 5, y: 1 },
      map: [
        '########',
        '#.....G#',
        '#..###.#',
        '#....#.#',
        '#..C.#.#', // (3,4)C -> wait: from (1,5) east -> move(2,5)->move(3,5) -> need C at (3,5)!
        '#..C...#',
        '########'
      ],
      // Let's trace with (3,5)C:
      // map:
      // 0: ########
      // 1: #..O..G#  (3,1)O? Wait (3,1) is '.', (5,1).[gear!], (6,1)G!
      // 2: #..###.#
      // 3: #..###.#
      // 4: #..###.#
      // 5: #..W...#  (3,5)W -> CCW rotates east to north!
      // 6: ########
      //Wait: (3,4), (3,3), (3,2) need to be open if we go north from (3,5)W!
      // Let's trace:
      // 0: ########
      // 1: #....G.#  (5,1)G? No, (5,1).[gear], (6,1)G!
      // 2: #..#...#  (3,2) is '.', (3,1) is '.'!
      // 3: #..#...#
      // 4: #..#...#
      // 5: #..W...#  (3,5)W
      // 6: ########
      // Wait: if (3,1) is '.', front of (3,1) north is (3,0)# wall!
      // Program: [L(4, [IF('front_wall', [C('turn_left')], [C('move')])]), L(3, [C('move')])]
      // Trace if `turn_left` is fixed to `turn_right`:
      // iter1 at (1,5)east: front(2,5). -> move(2,5)
      // iter2 at (2,5)east: front(3,5)W -> move(3,5 W -> rotates CCW to north!)
      // iter3 at (3,5)north: front(3,4). -> move(3,4)
      // ... wait (3,5)->(3,4)->(3,3)->(3,2)->(3,1) needs 4 moves after W, so outer loop count 4 isn't enough unless we use L(2,...) or start at (2,5)!
      // Put `start` at `(2,5, dir:1 east)` and `W` at `(3,5)` and `G` at `(6,1)` and `gear` at `(5,1)`:
      // And make row 1..4 height 6 (7x6 or 8x6):
      // Row 5: `#..W...#` (start 2,5 -> 1 step to 3,5 W -> north!)
      // Row 4: `#......#` (3,4)
      // Row 3: `#......#` (3,3)
      // Row 2: `#......#` (3,2) -> wait 3 steps north lands on (3,2), where (3,1) is `#` wall!
      // So at (3,2) facing north, front IS `(3,1)#` wall!!
      // Let's trace `L(4, ...)` with 5 iterations -> Wait loop counts are 2, 3, 4!
      // Use `L(3, [IF('front_wall', [C('turn_left')], [C('move')])])`? No, 1 move to (3,5 W) + 3 moves to (3,2) = 4 moves!
      // Then on iter 5? If loop is `L(2, [L(2, ...)])` -> 4 moves puts us at `(3,2)`, then `IF('front_wall', [C('turn_left')])` AFTER the move loop!
      // Wait: `L(2, [L(2, [C('move')]), IF('front_wall', [C('turn_left')])])` ->
      // iter1: (2,5)->(3,5 W->north)->(3,4), front(3,3) not wall.
      // iter2: (3,4)->(3,3)->(3,2), front(3,1)# IS wall -> `turn_left`(west) (BUG! Fix to `turn_right`(east)!)
      // Then `L(3, [C('move')])`: (3,2)->(4,2)->(5,2 gear)->(6,2 G)!
      // Check Base: turns west at (3,2) -> moves into `(2,2)` (put `O` at `(1,2)` or `(2,2)` so it falls, or hits wall/not_goal)!
      map: [
        '########',
        '#..#...#',
        '#.O...G#',
        '#....#.#',
        '#......#',
        '#..W...#',
        '########'
      ],
      start: { x: 2, y: 5, dir: 1 },
      gear: { x: 5, y: 2 },
      program: [L(2, [L(2, [C('move')]), IF('front_wall', [C('turn_left')])]), L(3, [C('move')])]
    },
    // W7-9 (boss, 8x8)
    {
      id: 69, world: 7, stageInWorld: 9, title: 'ダブルセンサー迷路', role: 'boss',
      hint: 'あなも カベも センサーで 切りぬけて ゴールへたどりつけ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 50,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#.O..#G#',
        '#..#...#',
        '#.O....#',
        '#......#',
        '#......#',
        '########'
      ],
      // Let's trace a crisp 8x8 boss for W7-9!
      // start(1,6, dir:0 north):
      // Row 2: '#.O..G.#' -> wait (1,2) is '.', (2,2) is 'O', (3,2) is '.', (4,2) is '.', (5,2).[gear], (6,2)G!
      // Wait from (1,6) north:
      // (1,5)., (1,4)O -> jump over (1,4)O to (1,3)!
      // (1,2)., (1,1)# wall! -> turn_right(east) at (1,2)!
      // Then east from (1,2): (2,2)O -> jump over (2,2)O to (3,2)! -> (4,2)->(5,2 gear)->(6,2 G)!
      // Look! ALL handled by ONE loop with 2 IFs:
      // L(4, [IF('front_hole', [C('jump')]), IF('front_wall', [C('turn_right')], [C('move')])])?
      // Let's trace iter by iter if `front_wall` is checked when front is NOT hole:
      // Wait: if we put `#` at `(1,1)` and `O` at `(1,4)`:
      // start(1,6)north:
      // iter1: front(1,5). -> neither -> move(1,5)
      // iter2: front(1,4)O -> jump(1,3)! Now front is (1,2)., not wall -> else: move(1,2)!
      // iter3: front(1,1)# -> front_wall TRUE -> turn_right(east)! (doesn't move!)
      // iter4: at (1,2)east, front(2,2)O -> jump(3,2)! Now front is (4,2). -> else: move(4,2)!
      // Then we just need `L(2, [move])` -> (5,2 gear)->(6,2 G)!
      // Let's trace carefully!
      // Put bug in `0.body.0`: `IF('front_wall', [C('jump')])` (or `turn_left` instead of `turn_right` in 2nd IF)!
      // Check Base with `turn_left`: turns west at (1,2) -> hits (0,2)# wall FAIL!
      // Fix `turn_left` -> `turn_right`:
      // iter1: (1,6)->move(1,5)
      // iter2: (1,5)->jump(1,3)->move(1,2)
      // iter3: (1,2)->front(1,1)#->turn_right(east)
      // iter4: (1,2)east->jump(3,2)->move(4,2)
      // after loop: L(2, [move]) -> (5,2 gear)->(6,2 G)!
      map: [
        '########',
        '######.#',
        '#.O...G#',
        '#......#',
        '#O.....#', // Wait O at (1,4) is index 1: `#O.....#`!
        '#......#',
        '#......#',
        '########'
      ],
      program: [L(4, [IF('front_hole', [C('jump')]), IF('front_wall', [C('turn_left')], [C('move')])]), L(2, [C('move')])]
    },
    // W7-10 (boss, 8x8)
    {
      id: 70, world: 7, stageInWorld: 10, title: '第7層ボス：ひかりのセンサー大聖堂', role: 'boss',
      hint: '第7層の だいけっせん！センサーと ねじまきで 迷宮を 制覇せよ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W7, allowLoopEdit: true, maxSteps: 55,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#.O..G.#', // Wait: let's trace carefully!
        '#....#.#',
        '#..###.#',
        '#......#',
        '#.O..#.#',
        '########'
      ],
      // Let's trace a grand W7 finale!
      // start(1,6, dir:1 east):
      // Row 6: `#.O..#.#` -> (1,6)start, (2,6)O, (3,6)., (4,6)., (5,6)#
      // Row 2: `#.O..G.#` -> wait let's go up col 4!
      // Let's trace:
      // (1,6)east -> jump(over 2,6 O -> 3,6) -> move(4,6) -> front(5,6)# wall -> turn_left(north)!
      // Col 4 going north: (4,5)O, (4,4)., (4,3)^, (4,2).[gear?], (4,1)#!
      // Put `G` at `(6,2)`, `gear` at `(5,2)`, `#` at `(4,1)`!
      // Trace from `(4,6)` facing north with `L(4, ...)`:
      // Wait let's use TWO outer loops of `[IF(front_hole, [jump]), IF(front_wall, [turn_left], [move])]`:
      // If `0` is `L(2, [L(3, [IF('front_hole', [C('jump')]), IF('front_wall', [C('turn_right')], [C('move')])])])`?
      // Let's trace what happens with `turn_left` vs `turn_right`!
      // Map:
      // 0: ########
      // 1: #...#..#  (4,1)#
      // 2: #....G.#  Wait: put gear at (5,2), G at (6,2)! `####..G#` -> (4,2).,(5,2).[gear],(6,2)G!
      // 3: #...^..#  (4,3)^
      // 4: #......#  (4,4).
      // 5: #...O..#  (4,5)O
      // 6: #.O..#.#  (1,6)start, (2,6)O, (3,6)., (4,6)., (5,6)#
      // 7: ########
      // Let's trace `L(3, [IF(front_hole, [jump]), IF(front_wall, [turn_left], [move])])` from `(1,6)` east!
      // iter1 at (1,6)east: front(2,6)O -> jump(3,6) -> front(4,6). -> else: move(4,6)!
      // iter2 at (4,6)east: front(5,6)# -> front_wall TRUE -> turn_left(north)!
      // iter3 at (4,6)north: front(4,5)O -> jump(4,4) -> front(4,3)^ -> NOT wall! -> else: move(4,3)^ SPIKE!!
      // OOPS! In iter3, after `jump(4,4)`, `IF(front_wall)` runs! Since `(4,3)^` is NOT wall, `else: move` steps onto `(4,3)^`!!
      // Good catch! Let's replace `(4,3)^` with `(4,3).` and `(4,2).` and `(4,1)#`:
      // iter3 at (4,6)north: front(4,5)O -> jump(4,4) -> front(4,3). -> move(4,3)!
      // Now at (4,3) facing north!
      // Put `O` at `(4,2)`? No, put `.` at `(4,2)` and `#` at `(4,1)`:
      // Next `L(3, [IF(front_hole, [jump]), IF(front_wall, [turn_right], [move])])`?
      // iter1: (4,3) -> move(4,2)
      // iter2: (4,2) -> front(4,1)# -> turn_right(east)
      // iter3: (4,2)east -> move(5,2 gear!) -> then `move(6,2 G)`!
      // Wait: BOTH loops can be ONE nested loop `L(2, [L(3, [IF('front_hole', [C('jump')]), IF('front_wall', [C('turn_left')], [C('move')])])])`?
      // No, at `(4,2)` we turn RIGHT (`turn_right`), while at `(4,6)` we turned LEFT (`turn_left`)!
      // If we put `C` or `W`? No, W7 doesn't need W5 plates, OR just use `turn_right` at BOTH corners by going clockwise from top-left `(1,2)`!
      // CHECK CLOCKWISE FROM `(1,2)` EAST:
      // 0: ########
      // 1: #......#
      // 2: #.O..#.#  (1,2)start(east), (2,2)O, (3,2)., (4,2)., (5,2)#
      // 3: #......#
      // 4: #...O..#  (4,4)O -> (4,6)
      // 5: #......#
      // 6: #.G....#  Wait: from (4,6) turn_right(west) -> (3,6)->(2,6)G!
      // Let's trace `L(2, [L(3, [IF('front_hole', [C('jump')]), IF('front_wall', [C('turn_right')], [C('move')])])])`!
      // From `(1,2)` east:
      // Outer iter 1:
      //   inner1: (1,2)->front(2,2)O->jump(3,2)->front(4,2).->move(4,2)!
      //   inner2: (4,2)->front(5,2)#->turn_right(south)!
      //   inner3: (4,2)south->front(4,3).->move(4,3)!
      // Outer iter 2:
      //   inner1: (4,3)south->front(4,4)O->jump(4,5)->front(4,6).->move(4,6)!
      //   inner2: (4,6)south->front(4,7)#->turn_right(west)!
      //   inner3: (4,6)west->front(3,6).->move(3,6)!
      // Then after outer loop: `C('move')` -> `(2,6 G)` (with `gear` at `(3,6)` or `(4,6)`)!!
      // Bug: inner `turn_right` is `turn_left` (turns north at `(5,2)#` instead of south) OR outer count is `3`? No, `turn_left` -> turns north into `(4,1)#`!
      // Let's make `(4,1)` `#` or `^`? No, if `turn_left` at `(4,2)` turns north -> inner3 moves `(4,1)` -> outer iter2 moves into `(4,0)#` wall FAIL!
      // Fix `turn_left` -> `turn_right`:
      // Reaches `(4,6)[gear]` -> turns west -> `(3,6)` -> `move` -> `(2,6)G`!!
      // Wait: what if `jump` in `IF('front_hole')` is `move` instead? No, let's check both!
      map: [
        '########',
        '#......#',
        '#.O..#.#',
        '#......#',
        '#...O..#',
        '#......#',
        '#.G....#',
        '########'
      ],
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 4, y: 6 },
      program: [L(2, [L(3, [IF('front_hole', [C('jump')]), IF('front_wall', [C('turn_left')], [C('move')])])]), C('move')]
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
