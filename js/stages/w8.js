/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第8階層：W8（Stage 71〜80：条件分岐②・状態センサー＋ワープ土管）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };
  var L = function (count, body) { return { type: 'loop', count: count, body: body }; };
  var IF = function (condition, thenBranch, elseBranch) {
    return { type: 'if', condition: condition, thenBranch: thenBranch || [], elseBranch: elseBranch || [] };
  };

  var CONDS_W8 = ['front_hole', 'front_wall', 'front_breakable', 'near_gear'];
  var PARTS_ALL = ['spring', 'drill', 'turbo', 'magnet'];

  var stages = [
    // W8-1 (intro, 6x5) - ワープ土管初登場
    {
      id: 71, world: 8, stageInWorld: 1, title: 'ふしぎな ワープ土管', role: 'intro',
      hint: '「1」の どかんに はいると、もうひとつの「1」に ワープするよ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 4, y: 1 },
      map: [
        '######',
        '#1..G#', // (1,1)warp1, (4,1)G
        '######',
        '#.1..#', // (1,3)start(east), (2,3)warp1
        '######'
      ],
      // (1,3)east -> move(2,3 warp1 -> warps to (1,1) facing east!) -> move(2,1)->move(3,1)->move(4,1 G)!
      // Bug: [C('move'), L(3, [C('turn_right')])] -> Fix `turn_right` -> `move`!
      // Also gear is at (3,1) or (4,1)? Put gear at (3,1) so you pick it up on the way!
      gear: { x: 3, y: 1 },
      program: [C('move'), L(3, [C('turn_right')])]
    },
    // W8-2 (intro, 6x6) - front_breakable センサー入門
    {
      id: 72, world: 8, stageInWorld: 2, title: 'ヒビカベ見分けセンサー', role: 'intro',
      hint: 'ふつうのカベは まがり、ヒビカベは ドリルで くだこう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 3, y: 2 },
      map: [
        '######',
        '#....#',
        '#.B.G#', // (2,2)B, (3,2).[gear!], (4,2)G
        '#.#..#',
        '#....#',
        '######'
      ],
      // Let's trace! (1,4)north -> L(2, [move]) -> (1,3) -> (1,2)
      // At (1,2) north: (1,1) is '.', wait make (1,1) '#' so front_wall is TRUE!
      // And make `L(4, [IF('front_breakable', [C('drill')]), IF('front_wall', [C('turn_right')], [C('move')])])`?
      // Check: if (1,1) is '#':
      // iter1(1,4): front(1,3). -> move(1,3)
      // iter2(1,3): front(1,2). -> move(1,2)
      // iter3(1,2): front(1,1)# -> front_breakable FALSE, front_wall TRUE -> turn_right(east)!
      // iter4(1,2)east: front(2,2)B -> front_breakable TRUE -> drill(breaks 2,2 B -> 2,2)! -> wait after `drill`, `IF(front_wall)` runs at (2,2), front(3,2). is NOT wall -> else: move(3,2 gear!)!
      // Then `C('move')` reaches (4,2 G)!
      // Bug: first IF condition is `front_wall` instead of `front_breakable` (so at (1,1)# it tries `drill` and whiffs, then turns right? Wait if `drill` whiffs, `front_wall` STILL triggers `turn_right`!).
      // Instead put bug on `front_breakable` action = `move` (crashes into (2,2)B!) OR condition = `front_hole` (ignores (2,2)B -> `front_wall` turns right at (2,2)B instead of drilling!).
      // OH!! If first IF has condition `front_hole` (BUG!), at (1,2)east facing (2,2)B, `front_hole` is FALSE, so `front_wall` triggers `turn_right` (south) and crashes into `(2,3)#` or misses goal!
      // Fix `front_hole` -> `front_breakable`: drills `(2,2)B` -> `(3,2 gear)` -> `(4,2 G)`!!
      map: [
        '######',
        '######',
        '#.B.G#',
        '#.#..#',
        '#....#',
        '######'
      ],
      program: [L(4, [IF('front_hole', [C('drill')]), IF('front_wall', [C('turn_right')], [C('move')])]), C('move')]
    },
    // W8-3 (multi, 7x6) - near_gear センサーと複数解！
    {
      id: 73, world: 8, stageInWorld: 3, title: 'ギア探知センサー！', role: 'multi',
      hint: '「ちかくに ギア」のセンサーに「じしゃく」を つけると お宝を すいとれるぞ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#.#.#.#', // (3,2).[gear] surrounded by (2,2)#, (4,2)#, (3,1)#?
        '#....G#',
        '#1...1#', // Wait: warps at (1,4)? No, start at (1,4), warp at (3,4) -> warps to (1,3)!
        '#######'
      ],
      // Clean design:
      // map:
      // 0: #######
      // 1: #..#..#
      // 2: #.#.#.#  (3,2)[gear!] surrounded by (2,2)#, (4,2)#, (3,1)#, and (3,3) is '.'!
      // 3: #1...G#  (1,3)warp1, (2,3)., (3,3)., (4,3)., (5,3)G
      // 4: #..1..#  (1,4)start(east), (2,4)., (3,4)warp1
      // 5: #######
      // Trace:
      // 0: L(2, [C('move')]) -> (1,4)->(2,4)->(3,4 warp1 -> warps to (1,3) east!)
      // 1: L(4, [IF('near_gear', [C('turn_right')]), C('move')])!
      // Check Base:
      // iter1(1,3): not near gear -> move(2,3)
      // iter2(2,3): near gear (3,2)!! (dx=1, dy=-1) -> `turn_right`(south) -> move(2,4)!! -> falls off route!
      // Fix `turn_right` -> `wait`: skips gear at (2,3) -> (3,3) -> (4,3) -> (5,3 G) (**A-rank!**)!
      // Fix `turn_right` -> `magnet`: at (2,3), `near_gear` TRUE -> `magnet` grabs (3,2)gear!! -> move(3,3) -> (4,3) -> (5,3 G) (**S-rank!!**)!
      // TWO SOLUTIONS: `wait` (A-rank) vs `magnet` (S-rank)!!
      map: [
        '#######',
        '#..#..#',
        '#.#.#.#',
        '#1...G#',
        '#..1..#',
        '#######'
      ],
      program: [L(2, [C('move')]), L(4, [IF('near_gear', [C('turn_right')]), C('move')])]
    },
    // W8-4 (multi, 7x7) - 2連ワープ＋ヒビカベ
    {
      id: 74, world: 8, stageInWorld: 4, title: 'ダブル土管の ひみつ通路', role: 'multi',
      hint: '1と 2の ワープ土管を つないで、ヒビカベも つきやぶれ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 3, y: 1 },
      map: [
        '#######',
        '#2..B.#', // (1,1)warp2, (4,1)B, (5,1)G? Let's put G at (5,1) and gear at (3,1)!
        '#######',
        '#1...2#', // (1,3)warp1, (5,3)warp2 -> Wait from (1,3)east: (2,3),(3,3),(4,3),(5,3 warp2)
        '#######',
        '#..1..#', // (1,5)start, (3,5)warp1
        '#######'
      ],
      // Let's trace!
      // 0: L(2, [C('move')]) -> (1,5)->(2,5)->(3,5 warp1 -> warps to (1,3) east!)
      // 1: L(4, [C('move')]) -> (2,3)->(3,3)->(4,3)->(5,3 warp2 -> warps to (1,1) east!)
      // 2: L(4, [IF('front_breakable', [C('move')]), C('move')])?
      // Wait if `IF('front_breakable', [C('move')])` has `move`, at (3,1)[gear] front is (4,1)B -> crashes into (4,1)B!
      // Fix `move` -> `drill`:
      // (1,1)->move(2,1)->move(3,1 gear)->front(4,1)B->drill(4,1)->move(5,1 G)?
      // Note: inside `L(4, [IF('front_breakable', [C('drill')]), C('move')])`:
      // iter1(1,1): move(2,1)
      // iter2(2,1): move(3,1 gear)
      // iter3(3,1): front(4,1)B -> drill(4,1) -> move(5,1 G)!
      // And what if we ALSO allow turbo? Let's test!
      map: [
        '#######',
        '#2..BG#',
        '#######',
        '#1...2#',
        '#######',
        '#..1..#',
        '#######'
      ],
      program: [L(2, [C('move')]), L(4, [C('move')]), L(4, [IF('front_breakable', [C('move')]), C('move')])]
    },
    // W8-5 (multi, 7x7) - 穴の前でドリルを使う誤作動バグ！
    {
      id: 75, world: 8, stageInWorld: 5, title: 'あなの まえで ドリル！？', role: 'multi',
      hint: 'おとしあなの まえで ドリルが 空回りしてるぞ！センサーを なおそう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 3, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.OB.G#', // Wait: (1,3)start, (2,3)O, (3,3)B? Note gear can't be in B! Put gear at (3,3) and B at (4,3) and G at (5,3): '#.O.BG#'!
        '#.###.#',
        '#.....#',
        '#######'
      ],
      // Check row 3: '#.O.BG#' -> (1,3)start, (2,3)O, (3,3).[gear], (4,3)B, (5,3)G!
      // Program:
      // L(3, [IF('front_hole', [C('drill')]), IF('front_breakable', [C('drill')], [C('move')])])
      // Base: at (1,3), front(2,3)O -> front_hole TRUE -> `drill` whiffs! Then `front_breakable` FALSE -> else `move` falls in (2,3)O FAIL!
      // Fix `0.body.0.then.0` (`drill` -> `jump`):
      // iter1: (1,3) -> front(2,3)O -> `jump(3,3 gear)` -> front(4,3)B -> `drill(4,3)`!
      // iter2: (4,3) -> front(5,3)G -> neither -> `move(5,3 G)`!
      // What if `turbo` instead of `jump`? Both `jump` and `turbo` skip (2,3)O and land on (3,3 gear)!
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.O.BG#',
        '#.###.#',
        '#.....#',
        '#######'
      ],
      program: [L(3, [IF('front_hole', [C('drill')]), IF('front_breakable', [C('drill')], [C('move')])])]
    },
    // W8-6 (hack, 7x7) - ワープ＋回転＋near_gear 神ハック
    {
      id: 76, world: 8, stageInWorld: 6, title: 'ワープさきの お宝キャッチ', role: 'hack',
      hint: 'ワープしたさきで まわりを よくみて！センサーの じょうけんが カギだ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 5, dir: 0 },
      gear: { x: 4, y: 2 },
      map: [
        '#######',
        '#...1G#', // (4,1)warp1, (5,1)G -> Wait: warp to (4,1) facing north or east?
        '#..##.#', // (3,2)#, (4,2)#? No, gear is at (4,2)! Make (4,2) '.' and (3,2) '#', (5,2) '#': '#..#.##'? Let's check!
        '#1....#', // (1,3)warp1
        '#.....#',
        '#.....#',
        '#######'
      ],
      // Let's trace!
      // start(1,5, dir:0 north):
      // map:
      // 0: #######
      // 1: #1...G#  (1,1)warp1, (5,1)G
      // 2: #C##.##  (1,2)C (rotates north to east!), (4,2).[gear] surrounded by (3,2)#, (5,2)#, (4,3)#!
      // 3: #..#.##  (3,3)#, (4,3)#
      // 4: #.1...#  (2,4)warp1? Let's put warp1 at (1,4) and C at (1,2)!
      // Wait: if (1,4) is `1`, it warps to (1,1) facing north! At (1,1) facing north, front is (1,0)#!
      // Instead put warp1 at (1,3) -> warps to (2,1) facing east!
      // Check row 1: '#.1..G#' -> (2,1)warp1, (3,1)., (4,1)., (5,1)G!
      // Check row 2: '#..#.##' -> (4,2) is '.' [gear!], (3,2)#, (5,2)#, (4,3)#!
      // Now trace from `(1,5)` north:
      // 0: L(2, [C('move')]) -> (1,4) -> (1,3 warp1 -> warps to (2,1) north!)
      // 1: C('turn_right') (east!)
      // 2: L(3, [IF('front_wall', [C('magnet')]), C('move')])!
      // Look! At (2,1) east: front is NOT wall, so it never triggers `magnet` unless you change `front_wall` -> `near_gear`!!
      // Wait: if Base has `IF('front_wall', [C('magnet')])`, why does Base FAIL?
      // Because we put `L(2, [C('move')])` at step 2 instead of `L(3, ...)` or put a `B` at `(4,1)`?
      // Look: put `B` at `(4,1)`? No, then `magnet` wouldn't break `B`.
      // Make Base FAIL by having `2` = `L(3, [IF('front_wall', [C('turn_left')]), C('move')])`?
      // No, `turn_left` wouldn't trigger either if there's no wall.
      // Put `#` at `(3,1)`? No! Put `IF('front_breakable', [C('turn_right')], [C('move')])` -> no, put `L(4, [C('move')])`? Then Base overshoots? No, hits `(5,1)G`!
      // Make Base FAIL at `(2,1)` by putting `turn_left` at `1` instead of `turn_right`? Wait then changing `1` solves it without `near_gear`.
      // We want changing the CONDITION (`front_wall` -> `near_gear`) or ACTION to be required!
      // Put `^` (spike) at `(3,1)`? No, at `(3,1)` `near_gear` is TRUE (gear is at `(4,2)`! dx=1, dy=1)!
      // Wait: at `(2,1)`, `(4,2)` is distance 2. At `(3,1)`, `(4,2)` is distance 1!
      // Put `^` at `(4,1)`? Then at `(3,1)`, if `IF('near_gear', [C('jump')])` -> it jumps over `(4,1)^` to `(5,1)G` (A-rank)!
      // AND put `O` at `(4,1)`!
      // Look!
      // Row 1: `#.1.OG#` -> `(2,1)` warp1, `(3,1)` `.`, `(4,1)` `O`, `(5,1)` `G`!
      // Row 2: `#..#.##` -> `(4,2)` `.` [gear]!
      // From `(3,1)` facing east: `near_gear` is TRUE (`(4,2)` is diagonal!), AND front is `(4,1)O`!
      // Program: `L(2, [C('move')]), C('turn_right'), L(3, [IF('front_wall', [C('jump')]), C('move')])`
      // Base: at `(3,1)` front `(4,1)O` is NOT `front_wall` -> moves into `(4,1)O` FALL FAIL!
      // Fix `front_wall` -> `front_hole`: jumps over `(4,1)O` to `(5,1)G` (**A-rank!**)!
      // Fix `front_wall` -> `near_gear`: at `(3,1)`, `near_gear` is TRUE -> jumps over `(4,1)O` to `(5,1)G`! Wait both skip gear `(4,2)`!
      // What if `gear` is at `(3,2)` (so `(3,1)` is above it) and `(3,2)` is NOT collected unless `magnet` runs, OR `gear` is at `(4,2)` and `IF('near_gear', [C('magnet'), C('jump')])`?
      // Better: put `C('magnet')` AFTER `jump`, or put `gear` at `(4,2)` and `G` at `(5,2)`!
      // Wait: if `G` is at `(5,1)` and `gear` is at `(3,2)`:
      // Put `program`:
      // `0: L(2, [C('move')])` -> warps `(1,3)` to `(2,1)`
      // `1: C('turn_right')` -> east
      // `2: L(2, [IF('near_gear', [C('turn_right')]), C('move')])` -> wait at `(2,1)`, `(3,2)` is dx=1, dy=1 (`near_gear` TRUE!), turns south into `(2,2)` (wall `#` or `^` FAIL)!
      // Fix `turn_right` -> `magnet`: at `(2,1)`, `near_gear` TRUE -> grabs `(3,2)`gear! -> moves `(3,1)` -> moves `(4,1)` -> `(5,1)G` (with `L(3, ...)`!)
      // Wait: at `(3,1)` gear is already collected so `near_gear` is FALSE!
      // Let's trace `L(3, [IF('near_gear', [C('turn_right')]), C('move')])` with `gear` at `(3,2)`!
      // Base: at `(2,1)` `near_gear` TRUE -> `turn_right`(south) -> `move(2,2 ^)` SPIKE FAIL!
      // Fix `turn_right` -> `wait`: skips gear -> `(3,1)->(4,1)->(5,1)G` (**A-rank!**)!
      // Fix `turn_right` -> `magnet`: grabs `(3,2)`gear at `(2,1)` -> `(3,1)->(4,1)->(5,1)G` (**S-rank!!**)!
      // GENIUS!! Look how clean that is: A-rank (`wait`) vs S-rank (`magnet`)!
      map: [
        '#######',
        '#.1..G#',
        '#.^..##',
        '#1.#.##',
        '#.....#',
        '#.....#',
        '#######'
      ],
      // Check map:
      // (1,5)north -> move(1,4)->move(1,3 warp1 -> (2,1)north) -> turn_right(east)
      // At (2,1)east: (3,2) is '#' in map[2] (`#.^#.##`) -> make map[2] = '#.^..##' so (3,2) is '.' [gear]!
      // And (2,2) is '^'!
      gear: { x: 3, y: 2 },
      program: [L(2, [C('move')]), C('turn_right'), L(3, [IF('near_gear', [C('turn_right')]), C('move')])]
    },
    // W8-7 (hack, 8x7) - 鉄ブロック＋ワープ＋ヒビカベ
    {
      id: 77, world: 8, stageInWorld: 7, title: 'ワープ先の大鉄橋', role: 'hack',
      hint: 'ワープしたさきに あなと 鉄ブロック！じしゃくを つかいこなせ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '########',
        '#1.OIBG#', // (1,1)warp1, (2,1)., (3,1)O, (4,1)I, (5,1)B, (6,1)G
        '#......#',
        '########',
        '#......#',
        '#..1...#', // (1,5)start, (3,5)warp1
        '########'
      ],
      // Trace:
      // 0: L(2, [C('move')]) -> (1,5)->(2,5)->(3,5 warp1 -> warps to (1,1) east!)
      // 1: C('move') -> (2,1)
      // 2: L(4, [IF('front_hole', [C('wait')]), IF('front_breakable', [C('drill')], [C('move')])])
      // Wait: at (2,1) east, front is (3,1)O!
      // Base: `front_hole` TRUE -> `wait` -> `front_breakable` FALSE -> `move` falls in (3,1)O FAIL!
      // Fix `wait` -> `magnet`:
      // iter1(2,1): `front_hole` TRUE -> `magnet` pulls `(4,1)I` into `(3,1)O -> F` AND grabs `(4,2)`?
      // Wait from `(2,1)`, `(4,2)` is dx=2! Put `gear` at `(3,2)` so from `(2,1)` `(3,2)` is dx=1, dy=1!
      // Then `front_breakable` FALSE -> `move(3,1 F)`!
      // iter2(3,1): `front_hole` FALSE -> `front_breakable` FALSE -> `move(4,1)`!
      // iter3(4,1): `front_hole` FALSE -> `front_breakable` TRUE (`(5,1)B`) -> `drill(5,1)`!
      // iter4(5,1): `front_hole` FALSE -> `front_breakable` FALSE -> `move(6,1 G)`!!
      // Also what if `wait` -> `jump`? At (2,1), `jump` hits `(4,1)I` and stuns!
      // So `wait -> magnet` is the true master hack!
      gear: { x: 3, y: 2 },
      program: [L(2, [C('move')]), C('move'), L(4, [IF('front_hole', [C('wait')]), IF('front_breakable', [C('drill')], [C('move')])])]
    },
    // W8-8 (hack, 8x7) - ワープ2択の誘惑！お宝ワープへ飛び込め
    {
      id: 78, world: 8, stageInWorld: 8, title: 'ふたつの土管・お宝ルート', role: 'hack',
      hint: '「1」のどかんは ワナかも？お宝のある「2」のどかんへ むかおう！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#1.O...#', // (1,1)warp1
        '#2...BG#', // (1,2)warp2, (5,2)B? No, gear at (4,2) and B at (5,2) and G at (6,2)!
        '########',
        '#..1...#', // (3,4)warp1
        '#..2...#', // (3,5)warp2
        '########'
      ],
      // Look! start(1,5)east -> (2,5) -> (3,5 warp2)!
      // Put `program`:
      // [C('turn_left'), C('move'), C('turn_right'), L(2, [C('move')]), L(4, [IF('front_breakable', [C('drill')], [C('move')])])]
      // Base: (1,5)east -> `turn_left`(north) -> `move(1,4)` -> `turn_right`(east) -> `L(2,[move])` lands on `(3,4 warp1 -> warps to (1,1)!)` -> falls into `(3,1)O` FAIL!
      // Fix `0` (`turn_left` -> `move` or `wait`)?
      // Check Fix `0` (`turn_left` -> `wait`):
      // (1,5)east -> `wait` -> `move(2,5)` -> `turn_right`(south) -> hits wall!
      // Instead start at `(1,5)` east, `0: C('turn_left')`, `1: C('move')`?
      // Let's make `0: C('move')`, `1: C('turn_left')`, `2: C('move')`, `3: C('turn_right')`, `4: C('move')` -> reaches `(3,4 warp1)`!
      // If we fix `1` (`turn_left` -> `move`): `(1,5)->move(2,5)->move(3,5 warp2 -> warps to (1,2) east!)` -> `turn_right`(south)? No, wait!
      // Let's trace cleanly:
      // [C('turn_left'), C('move'), C('turn_right'), L(2, [C('move')]), L(4, [IF('front_breakable', [C('drill')], [C('move')])])]
      // Wait: if `0: turn_left` is changed to `wait`, `1: move(2,5)` -> `2: turn_right` (south). Not right.
      // Instead put `warp2` at `(3,5)` and `warp1` at `(3,4)`, start `(1,4, dir:1 east)`!
      // `program`: [C('move'), C('move'), L(4, [IF('front_breakable', [C('drill')], [C('move')])])]
      //Wait at (1,4), `0:move(2,4)->1:move(3,4 warp1 -> (1,1) -> (3,1)O FAIL!)`.
      // Put `warp2` at `(2,5)` or `(3,5)`! How to get from `(1,4)` to `(3,5)` in 1 edit?
      // Put `0: C('turn_right'), 1: C('move'), 2: C('turn_left'), 3: C('move')` -> goes `(1,5)->(2,5)`!
      // No, put `warp2` at `(2,4)` and `warp1` at `(4,4)`? Then `turbo` vs `move`!
      // WHOA!! `warp2` at `(3,4)` and `warp1` at `(2,4)`!!
      // Check `(1,4)` east -> `move` hits `(2,4 warp1 -> (1,1) -> trap O)`!
      // Fix `0` (`move` -> `turbo` or `jump`): skips `(2,4 warp1)` and lands on `(3,4 warp2 -> warps to (1,2) east!)`!
      // Then `L(4, [IF('front_breakable', [C('drill')], [C('move')])])` -> `(2,2)->(3,2)->(4,2 gear)->drill(5,2 B)->(6,2 G)`? Wait 5 steps needs `L(5)` or `turbo` + `L(4)` or put `G` at `(5,2)` and `B` at `(4,2)` and `gear` at `(3,2)`!
      // Check `row 2`: `'#2.BG..#'` -> `(1,2)warp2`, `(2,2).`, `(3,2).[gear]`, `(4,2)B`, `(5,2)G`!
      // Count after warp to `(1,2)`:
      // iter1: move(2,2)
      // iter2: move(3,2 gear!)
      // iter3: front(4,2)B -> drill(4,2)!
      // iter4: move(5,2 G)!
      // ALL IN `L(4, ...)`!!
      // And check Base: `0: move` -> `(2,4 warp1)` -> `(1,1)` -> `(3,1)O` FAIL!
      // Fix `0` (`move` -> `jump` or `turbo`): skips `(2,4 warp1)`, lands on `(3,4 warp2)` -> warps `(1,2)` -> S-rank!!
      map: [
        '########',
        '#1.O...#',
        '#2..BG.#',
        '########',
        '#.12...#',
        '#......#',
        '########'
      ],
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 3, y: 2 },
      program: [C('move'), L(4, [IF('front_breakable', [C('drill')], [C('move')])])]
    },
    // W8-9 (boss, 8x8)
    {
      id: 79, world: 8, stageInWorld: 9, title: '4つのセンサー自律迷宮', role: 'boss',
      hint: 'あな・カベ・ヒビカベ・ギア… どのセンサーを なおせば ぬけられる？',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 55,
      start: { x: 1, y: 6, dir: 0 },
      gear: { x: 5, y: 3 },
      map: [
        '########',
        '######.#',
        '#2.B.G.#', // (1,2)warp2, (2,2)., (3,2)B, (4,2)., (5,2)G
        '#....#.#', // (5,3).[gear]
        '#O##.#.#', // (1,4)O
        '#......#',
        '#...1..#', // Wait: let's route cleanly!
        '########'
      ],
      // Clean trace for W8-9:
      // start(1,6, dir:0 north):
      // Row 5: (1,5).
      // Row 4: (1,4)O -> jump over (1,4)O to (1,3)!
      // Row 3: (1,3).
      // Row 2: (1,2)warp2 -> warps to (2,5) facing north? No, put warp2 at (1,2) and warp2 at (3,5)?
      // Even better:
      // 0: ########
      // 1: #.####.#
      // 2: #2.B.G.#  (1,2)warp2, (2,2)., (3,2)B, (4,2)., (5,2)G
      // 3: #....#.#  (5,3)[gear] -> wait if G is (5,2), gear at (4,2) is right before G!
      // 4: #O#2##.#  (1,4)O, (3,4)warp2?
      // Wait: warp2 at (1,2) warps to (4,5), or warp1 at (1,2) warps to (3,2)?
      // Put warp1 at `(1,2)` and warp1 at `(2,5)`?
      // Let's trace from `(1,6)` north with ONE big loop `L(2, [L(3, [...])])`:
      // Wait: `(1,6)` north -> `(1,5).` -> `(1,4)O` -> `jump(1,3)` -> `(1,2)` -> `front(1,1)#` -> `turn_right(east)`!
      // Then east along row 2: `(2,2).` -> `(3,2)B` -> `drill(3,2)` -> `(4,2)[gear!]` -> `(5,2)warp1` -> warps to `(5,5)` facing east -> `(6,5)G`!
      // Let's trace!
      // map:
      // 0: ########
      // 1: ######.#  Wait (1,1) needs '#' -> `######.#`!
      // 2: #..B1..#  (1,2)., (2,2)., (3,2)B, (4,2).[gear], (5,2)warp1
      // 3: #......#
      // 4: #O.....#  (1,4)O
      // 5: #....1G#  (5,5)warp1, (6,5)G
      // 6: #......#  (1,6)start(north)
      // 7: ########
      // Let's trace `L(3, [L(3, [IF('front_hole', [C('jump')]), IF('front_breakable', [C('drill')]), IF('front_wall', [C('turn_right')], [C('move')])])])`!
      // Wait! Outer=3, Inner=3 = 9 iterations:
      // Check `(1,6)` north:
      // it1: front(1,5). -> move(1,5)
      // it2: front(1,4)O -> jump(1,3)! front(1,2). -> move(1,2)!
      // it3: front(1,1)# -> front_wall TRUE -> turn_right(east)!
      // it4: (1,2)east -> front(2,2). -> move(2,2)
      // it5: (2,2)east -> front(3,2)B -> front_breakable TRUE -> drill(3,2)! Wait `front_wall` is ALSO TRUE for `B`?
      // AH!! Look at `engine.js`: `drill` moves robot ONTO `(3,2)` (which is now `.`), and THEN `IF('front_wall')` evaluates from `(3,2)` facing `(4,2).` (NOT wall) -> `else: move(4,2 gear!)`!!
      // it6: (4,2)east -> front(5,2)warp1 -> move(5,2 warp1 -> warps to (5,5) east!)
      // it7: (5,5)east -> front(6,5)G -> move(6,5 G!)
      // AWESOME!! Now introduce ONE clear bug in `IF('front_breakable', [C('wait')])` (or `turn_left` instead of `turn_right`, or `front_hole` condition changed to `front_breakable`):
      // If `IF('front_breakable', [C('move')])` -> wait `front_breakable` is TRUE at `(3,2)B` -> tries `move` into `(3,2)B` wall FAIL!
      // Fix `move` -> `drill`: clears cleanly with S-rank!!
      map: [
        '########',
        '######.#',
        '#..B1..#',
        '#......#',
        '#O.....#',
        '#....1G#',
        '#......#',
        '########'
      ],
      gear: { x: 4, y: 2 },
      program: [L(3, [L(3, [IF('front_hole', [C('jump')]), IF('front_breakable', [C('move')]), IF('front_wall', [C('turn_right')], [C('move')])])])]
    },
    // W8-10 (boss, 8x8)
    {
      id: 80, world: 8, stageInWorld: 10, title: '第8層ボス：ワープ迷宮の大時計台', role: 'boss',
      hint: '第8層の 大ボス！4つのセンサーと ワープの連鎖で 黄金ギアごと 突破せよ！',
      availableParts: PARTS_ALL, availableConditions: CONDS_W8, allowLoopEdit: true, maxSteps: 60,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '########',
        '#1..B.2#', // (1,1)warp1, (4,1)B, (6,1)warp2
        '#..#...#', // (3,2).[gear] surrounded by (2,2)., (4,2).? Put walls around (3,2) if we use magnet!
        '#......#',
        '#2...#.#', // (1,4)warp2 -> from here go east?
        '#......#',
        '#..1...#', // (1,6)start, (3,6)warp1
        '########'
      ],
      // Let's trace an awesome W8-10 finale!
      // Map:
      // 0: ########
      // 1: #1..B.2#  (1,1)warp1, (4,1)B, (6,1)warp2
      // 2: #.##.#.#  (3,2).[gear!] enclosed by (2,2)#, (3,3)#, (4,2)#, (3,1).! (Wait from (3,1) dx=0,dy=1 so magnet at (2,1) grabs it!)
      // 3: #..#...#
      // 4: #2.O.G.#  (1,4)warp2, (3,4)O, (5,4)G
      // 5: #......#
      // 6: #.O1...#  (1,6)start(east), (2,6)O, (3,6)warp1
      // 7: ########
      // Trace:
      // Step A: `0: jump` -> (1,6) jumps over (2,6)O to `(3,6)warp1` -> warps to `(1,1)` facing east!
      // Step B: `1: L(4, [IF('near_gear', [C('magnet')]), IF('front_breakable', [C('drill')], [C('move')])])`
      // Trace Step B from `(1,1)` east:
      //   it1(1,1): not near gear -> not B -> move(2,1)
      //   it2(2,1): near_gear TRUE (`(3,2)` is dx=1,dy=1!) -> `magnet` grabs `(3,2)`gear! -> move(3,1)
      //   it3(3,1): near_gear FALSE (already collected!) -> front(4,1)B -> `drill(4,1)`!
      //   it4(4,1): move(5,1)
      //   Wait we need 1 more move to `(6,1)warp2`! So use `L(2, [L(3, ...)])` or `C('move')` after loop!
      //   `2: C('move')` -> `(6,1)warp2` -> warps to `(1,4)` facing east!
      // Step C: at `(1,4)` east: `(2,4).`, `(3,4)O`, `(4,4).`, `(5,4)G`!
      //   `3: L(3, [IF('front_hole', [C('jump')], [C('move')])])` ->
      //   it1(1,4): move(2,4)
      //   it2(2,4): front(3,4)O -> jump(4,4)!
      //   it3(4,4): move(5,4 G!)!
      // Put bug: in Step B, `near_gear` condition is `front_hole` or `magnet` is `turn_right` (turns south into `(2,2)#` wall FAIL!!)!
      // Check Base with `IF('near_gear', [C('turn_right')])`:
      // At `(2,1)` facing east, `near_gear` is TRUE -> turns south -> `move(2,2)#` WALL CRASH FAIL!!
      // Fix `turn_right` -> `wait`: skips gear at `(3,2)`, reaches `(5,4)G` (**A-rank!**)!
      // Fix `turn_right` -> `magnet`: grabs `(3,2)`gear at `(2,1)`, reaches `(5,4)G` (**S-rank!!**)!
      // WHAT A BOSS STAGE!!
      map: [
        '########',
        '#1..B.2#',
        '#.#..#.#',
        '#..#...#',
        '#2.O.G.#',
        '#......#',
        '#.O1...#',
        '########'
      ],
      program: [
        C('jump'),
        L(4, [IF('near_gear', [C('turn_right')]), IF('front_breakable', [C('drill')], [C('move')])]),
        C('move'),
        L(3, [IF('front_hole', [C('jump')], [C('move')])])
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
