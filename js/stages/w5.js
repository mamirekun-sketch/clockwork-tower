/**
 * バグ・スイーパー ～おもちゃ工房の迷宮（クロックワーク・タワー）～
 * 第5階層：W5（Stage 41〜50：反復（ループ）②＋歯車床）
 */
(function (root) {
  'use strict';

  var C = function (op) { return { type: 'cmd', op: op }; };
  var L = function (count, body) { return { type: 'loop', count: count, body: body }; };

  var stages = [
    // W5-1 (intro, 6x5) - 歯車コンベア初登場
    {
      id: 41, world: 5, stageInWorld: 1, title: 'うごく歯車コンベア', role: 'intro',
      hint: 'コンベア(→)に のると じどうで 1マス はこんでくれるよ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 30,
      start: { x: 1, y: 2, dir: 1 },
      gear: { x: 3, y: 2 },
      map: [
        '######',
        '#....#',
        '#.R.G#',
        '#....#',
        '######'
      ],
      // (1,2)->move(2,2 R -> conveys to 3,2 gear!)->move(4,2 G)!
      // バグ: 2つともmoveではなく [move, turn_right] 等や ×3 [move] で通り過ぎ？
      // Wait: if 0:move -> conveys to (3,2), then 1:move -> (4,2 G)!
      // Bug: [C('jump'), C('move')] -> (1,2) jumps over (2,2 R) to (3,2 gear), then move(4,2 G) clears! So break it:
      // [C('move'), C('turn_right'), C('move')] -> Base: (1,2)->move(2,2 R->3,2 gear)->turn_right(south)->move(3,3) FAIL!
      // Fix 1 (`turn_right` -> `move`): (3,2)->move(4,2 G) (**S-rank**)!
      // Fix 0 (`move` -> `turbo`): (1,2)->turbo(3,2 gear)->turn_right(south)->move(3,3) FAIL.
      program: [C('move'), C('turn_right'), C('move')]
    },
    // W5-2 (intro, 6x6) - 回転プレート初登場
    {
      id: 42, world: 5, stageInWorld: 2, title: 'くるっと矢印プレート', role: 'intro',
      hint: 'プレートが まげてくれるから、じぶんで まがると まわりすぎちゃうぞ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 30,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 3, y: 2 },
      map: [
        '######',
        '#....#',
        '#.C.G#',
        '#....#',
        '#....#',
        '######'
      ],
      // (1,4)north -> move(1,3) -> move(1,2? C is at 2,2!)
      // Put C at (1,2): map[2] = '#C..G#'!
      // Trace: (1,4)north -> L(2, [move]) -> (1,3)->(1,2 C -> rotates CW to east!)
      // Then if bug has turn_right -> turns south! Fix turn_right -> move -> (2,2)->(3,2 gear)->(4,2 G)!
      // Let's write map[2] = '#C..G#', program: [L(2, [C('move')]), C('turn_right'), C('move'), C('move')]
      // Base: (1,2) rotated east -> turn_right(south) -> (1,3)->(1,4) FAIL!
      // Fix 1 (`turn_right` -> `move`): (2,2)->(3,2 gear)->(4,2 G) (**S-rank**)!
      program: [L(2, [C('move')]), C('turn_right'), C('move'), C('move')]
    },
    // W5-3 (multi, 7x6) - コンベアで2倍速移動！ループ回数調整
    {
      id: 43, world: 5, stageInWorld: 3, title: 'コンベア・ベルトのリズム', role: 'multi',
      hint: 'コンベアに のると 1ほで 2マスぶん すすむよ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#....G#',
        '#.R.U.#',
        '#.....#',
        '#######'
      ],
      // Let's trace! (1,3)east:
      // move -> (2,3 R) -> conveys to (3,3)!
      // move -> (4,3 U) -> conveys to (4,2 gear)!
      // turn_left(north)? No, facing east at (4,2 gear), move -> (5,2 G)!!
      // Wait: if program is [L(3, [C('move')]), C('move')]:
      // ×3 move: move1->(2,3 R)->(3,3), move2->(4,3 U)->(4,2 gear), move3->(5,2 G)! Wait that clears!
      // So break count to 4? No, count 3 clears on step 3! Break count to 2: stops at (4,2 gear) -> wait what if `1` is `wait`?
      // [L(2, [C('move')]), C('wait')]:
      // Base: move1->(3,3), move2->(4,2 gear), wait->(4,2) FAIL!
      // Fix 0 (2 -> 3): clears! Fix 1 (wait -> move): (4,2)->(5,2 G) clears too! (Multi-solution!)
      program: [L(2, [C('move')]), C('wait')]
    },
    // W5-4 (multi, 7x6) - 反時計回りプレート W とループ
    {
      id: 44, world: 5, stageInWorld: 4, title: 'くるくるループの交差点', role: 'multi',
      hint: 'プレートの むきと ループを かみあわせよう！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 4, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#G..W.#',
        '#...#.#',
        '#...W.#',
        '#######'
      ],
      // (1,4)east -> L(3, [move]) -> (2,4)->(3,4)->(4,4 W -> rotates CCW to north!)
      // Then L(2, [move]) -> (4,3? # at 4,3!) -> open (4,3)!
      // map[3] = '#.#...#' -> (4,3) is '.'!
      // Then (4,4)north -> move(4,3)->move(4,2 W -> rotates CCW to west, AND gear at (4,2)!)
      // Then L(3, [move]) -> (3,2)->(2,2)->(1,2 G)!
      // Bug: first loop count is 2 -> stops at (3,4), then moves into (3,3) or misses W!
      // Wait: if map[3] is '#.#...#', from (3,4) facing east, 2nd loop moves (4,4 W -> north)->(5,4)? No, if first loop is count 2: (1,4)->(3,4), then 2nd loop moves (4,4 W->north)->(4,3)! Then 3rd loop moves (4,2 W->west)->(3,2)->(2,2)! Stops short of (1,2 G)!
      // Fix 0 (2 -> 3) OR Fix 2 (3 -> 4)! Multi-solution!
      program: [L(2, [C('move')]), L(2, [C('move')]), L(3, [C('move')])]
    },
    // W5-5 (multi, 7x7) - コンベアの先の落とし穴を飛び越えろ！
    {
      id: 45, world: 5, stageInWorld: 5, title: 'コンベア終点の 大ジャンプ', role: 'multi',
      hint: 'コンベアで はこばれた あと、そのさきは あぶないぞ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 3, dir: 1 },
      gear: { x: 5, y: 3 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#.RO.G#', // Wait: (1,3)start, (2,3)R -> conveys into (3,3)O (FALL!).
        '#.###.#',
        '#.....#',
        '#######'
      ],
      // If (2,3) is R and (3,3) is O, stepping on (2,3)R dumps you into (3,3)O!
      // So you MUST jump over (2,3)R onto (3,3)O? No, if (2,3) is '.' and (3,3) is 'R' and (4,3) is 'O':
      // Wait: '#.R.O.G#' -> (1,3)start, (2,3)R->(3,3)., (4,3)O, (5,3)G!
      // Look: if map[3] = '#R.O..#' (7 chars) and G at (5,3):
      // Wait: map[3] = '#.R.OG#' -> (1,3)start, (2,3)R->conveys to (3,3)., (4,3)O, (5,3)G!
      // Then from (3,3), if you `move`, you fall in (4,3)O! You must `jump` from (3,3) to (5,3)G!
      // Put gear at (3,3) or (5,3)? Put gear at (3,3)!
      // Trace: [C('move'), C('move'), C('wait')] -> Base: (1,3)->move(2,3 R)->conveys to (3,3 gear)->move(4,3 O) FAIL!
      // Fix 1 (`move` -> `jump` or `turbo`): (3,3 gear)->(5,3 G)!
      // Also what if you `jump` at 0 over (2,3)R to (3,3 gear)? Then `1` is `move` -> hits (4,3)O.
      // Let's make it a 2-loop puzzle!
      // Start (1,3)east, map[3] = '#.R.O.#' (wait 7 chars: 0:#,1:.,2:R,3:.,4:O,5:.,6:#), G at (5,2), gear at (3,3):
      // Wait if G at (5,3), map[3] = '#.R.OG#':
      // [L(2, [C('move')])] -> Base: move1(2,3 R->3,3 gear), move2(4,3 O) FAIL!
      // Fix `0.body.0`? No, if body.0 is `jump`, jump1->(3,3 gear), jump2->(5,3 G)!!
      // Wait: what if `0` is `L(2, [C('move')])` and we change `0.body.0` (`move` -> `jump`) OR `move` -> `turbo`!
      // Wait: `turbo` from (1,3) lands on (3,3 gear), then 2nd `turbo` skips (4,3)O and lands on (5,3)G!
      // Let's make BOTH `jump` and `turbo` work as multi-solutions!
      program: [L(2, [C('move')]), C('wait')]
    },
    // W5-6 (hack, 7x7) - コンベアに乗らずにマグネットで引き寄せる／乗って引き寄せる神ハック
    {
      id: 46, world: 5, stageInWorld: 6, title: 'すれちがい マグネット', role: 'hack',
      hint: 'コンベアに 運ばれるまえに ギアを じしゃくで キャッチできるかも？',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 1, y: 4, dir: 1 },
      gear: { x: 2, y: 2 },
      map: [
        '#######',
        '#.....#',
        '#.###.#',
        '#..R.G#',
        '#..U..#',
        '#.....#',
        '#######'
      ],
      // Wait: gear(2,2) is in a walled room? map[2] = '#.###.#', so (2,2) is '#'!! Fix map[2] to '#.#.#.#', or put gear at (1,2) and '#' at (2,2)!
      // Trace: (1,4)east -> wait -> move(2,4)->move(3,4 U -> conveys to 3,3 R -> conveys to 4,3!) -> wait: conveyor only triggers once per turn!
      // Let's trace: (1,4) -> move(2,4) -> move(3,4 U -> conveys to 3,3)!
      // From (3,3), map[3] has 'R' at (3,3), so next action on (3,3) is NOT conveyor unless you land on (3,3)!
      // Wait: if you land on (3,4 U), U moves you to (3,3 R), and conveyor does NOT chain!
      // Good to remember! Only warp chains into rotate/conveyor, conveyor does NOT chain into another conveyor in the same turn.
      // So put U at (3,4), '.' at (3,3), 'R' at (4,3)? Wait:
      // (1,4)east -> wait(change to magnet? from (1,4), gear at (1,3) or (2,3)!) ->
      // Let's put gear at (2,2) with map[2] = '#.###.#'? No, map[2] = '#..##.#', so (2,2) is '.'!
      // Wait from (1,3) to (2,2) is distance 1!
      // Let's trace: start(1,4, dir:0 north), gear(2,2), G(5,3):
      // map:
      // 0: #######
      // 1: #.....#
      // 2: #..##.#  (2,2) is '.' [gear]
      // 3: #.U..G#  (2,3) is 'U'
      // 4: #.....#  (1,4) start north
      // 5: #######
      // Wait: (1,4)north -> move(1,3) -> turn_right(east) -> move(2,3 U -> conveys to 2,2 gear!) -> ...
      // Better hack: make (2,2) a dead-end with `O` around it, or put gear at (1,2) and `O` at (1,3)!
      // Then from (2,3), `magnet` grabs (1,2)gear diagonally (dx=-1, dy=-1)!!
      // Trace: start(1,5, dir:1 east), gear(1,2), G(5,3):
      // map:
      // 0: #######
      // 1: #.....#
      // 2: #.#.#.#  (1,2) is '.' [gear!]
      // 3: #O...G#  (1,3) is 'O', (2,3) is '.', (3,3) is '.', (4,3) is '.', (5,3) is 'G'
      // 4: #..U..#  (3,4) is 'U'
      // 5: #.....#  (1,5) start? Make start (1,4, dir:1 east)!
      // Let's trace from (1,4)east:
      // 0: move -> (2,4)
      // 1: move -> (3,4 U -> conveys to 3,3!)
      // 2: move -> (4,3)? Wait if we want to grab (1,2)gear, at (2,3) facing east, distance to (1,2) is dx=-1, dy=-1!
      // So if U is at (2,4) -> conveys to (2,3)!
      // Check: (1,4)east -> 0:move(2,4 U -> conveys to 2,3!) -> 1:wait (FIX TO magnet! grabs (1,2)gear!) -> 2:L(3, [move]) -> (3,3)->(4,3)->(5,3 G)!!
      // And what if 1 is left as `wait`? Wait: if 1 is `wait`, base would clear (A-rank)! So make Base FAIL by putting `turn_right` at `1` instead of `wait`!
      // Base: (2,3)->turn_right(south)->L(3,[move]) lands on (2,6)# wall FAIL!
      // Fix 1 (`turn_right` -> `wait` or `jump`?): wait -> **A-rank!**
      // Fix 1 (`turn_right` -> `magnet`): grabs (1,2)gear AND stays facing east -> **S-rank神ハック!!**
      program: []
    },
    // W5-7 (hack, 7x7) - 回転プレート上で「たいき」して180度ターンする神ハック！
    {
      id: 47, world: 5, stageInWorld: 7, title: 'プレートの上の たいきハック', role: 'hack',
      hint: 'プレートの うえで「たいき」すると もう90ど まわれるぞ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 35,
      start: { x: 3, y: 4, dir: 0 },
      gear: { x: 3, y: 5 },
      map: [
        '#######',
        '#.....#',
        '#.#C#.#', // (3,2) is 'C'
        '#.....#',
        '#.....#',
        '#..G..#', // Wait G at (3,5)? If gear is at (3,5) and G is at (3,5), you get both! Put gear at (3,1) and G at (3,5), OR gear at (3,5) and G at (3,6)? Let's put gear at (4,2) and G at (3,5):
        '#######'
      ],
      // Let's trace! start(3,4, dir:0 north):
      // 0: L(2, [move]) -> (3,3) -> (3,2 C -> rotates CW to east!)
      // Now at (3,2) facing east!
      // If you `move` -> (4,2)[gear!]
      // Wait: if we want `wait` on `C` to turn 180 deg (east -> south):
      // Put `G` at `(3,5)` and `gear` at `(3,1)`? No, at `(3,2) C`, facing east -> `wait` turns south!
      // Better: start(1,3, dir:1 east), C at (3,3), gear at (3,1), G at (3,5):
      // No, if you go to (3,1)[gear] first, how do you turn 180 to go down to (3,5)?
      // Put `C` at `(3,2)`!
      // From (1,2)east -> move(2,2) -> move(3,2 C -> turns south!) -> ...
      // Wait: if you want to grab (3,1)gear BEFORE going down to (3,5)G:
      // Put `C` at `(3,2)`, `gear` at `(4,2)`? No, `magnet` at `(3,2)` grabs `(3,1)`gear!
      // Even cooler pure plate hack:
      // Start `(1,3, dir: 1 east)`, `C` at `(3,3)`, `G` at `(1,5)`, `gear` at `(3,5)`:
      // Let's trace:
      // 0: L(2, [move]) -> (2,3) -> (3,3 C -> turns south!)
      // 1: move -> (3,4) -> wait, we want to go to (3,5)gear, then turn west to (1,5)G!
      // So put `C` at `(3,5)`? If `(3,5)` is `C` and `gear` is at `(3,5)`!
      //Wait: at `(3,3)` facing east, `C` turns you south. Then `L(2,[move])` goes `(3,4)->(3,5 C [gear!] -> turns west!)`!
      // Then `L(2,[move])` goes `(2,5)->(1,5 G)`!!
      // Now let's make `wait` on `C` be the S-rank hack!
      // Suppose `start(2,3, dir:1 east)`, `C` at `(3,3)`, `gear` at `(4,3)`, `G` at `(1,3)`!
      // Look at that:
      // (2,3)east -> `move`(3,3 C -> turns south).
      // Wait if `1` is `wait` at `(3,3)` -> turns west! Then `L(2, [move])` goes `(2,3)->(1,3 G)`! (**A-rank!**)
      // What if `1` is `magnet`? At `(3,3)`, `magnet` grabs `(4,3)`gear AND since you ended a command on `(3,3 C)`, `C` rotates you AGAIN from south to west!!
      // THEN `L(2, [move])` goes `(2,3)->(1,3 G)` for **S-rank!!**
      // And Base: `1` is `move` -> falls down into `(3,4)O` FAIL!
      // OH MY GOD!! Check that!!
      // - Base: `move`(3,3 C -> south) -> `move` -> falls in `(3,4)O` FAIL!
      // - Fix `1` (`move` -> `wait`): rotates on `C` to west -> `L(2,[move])` reaches `(1,3)G` (**A-rank!**)
      // - Fix `1` (`move` -> `magnet`): grabs `(4,3)`gear AND `C` rotates you to west -> `L(2,[move])` reaches `(1,3)G` (**S-rank神ハック!!**)
      program: []
    },
    // W5-8 (hack, 8x7) - コンベアぐるぐる大回転
    {
      id: 48, world: 5, stageInWorld: 8, title: '歯車コンベア・サーキット', role: 'hack',
      hint: 'コンベアの ながれにのって、ぐるっと お宝をとって ゴールへ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 40,
      start: { x: 1, y: 4, dir: 0 },
      gear: { x: 4, y: 1 },
      map: [
        '########',
        '#..R..G#', // (3,1)R -> (4,1 gear)
        '#..U...#', // (3,2)U -> (3,1)
        '#..U...#', // (3,3)U -> (3,2)
        '#..U...#', // (3,4)U -> (3,3)
        '#......#',
        '########'
      ],
      // Let's trace: start(1,4, dir:1 east) ->
      // 0: move(2,4) -> 1: move(3,4 U -> conveys 3,3? Note conveyor triggers once per turn!)
      // At (3,3), next turn: if you `wait`, you stay on (3,3 U -> conveys 3,2)!
      // Next `wait`: (3,2 U -> conveys 3,1)!
      // Next `wait`: (3,1 R -> conveys 4,1 gear)!
      // Wait: if `program` is `[C('move'), C('move'), L(3, [C('wait')]), C('move'), C('move')]`:
      // Wait at (4,1 gear) facing east -> move(5,1) -> move(6,1 G)!!
      // Let's make bug: `2` loop count is `2` (stops at (3,1), facing east -> `move` steps on (4,1 gear), `move` stops at (5,1) short of (6,1 G)!)
      // Fix `2` count `2 -> 3` (wait3 -> (4,1 gear), move(5,1), move(6,1 G))!!
      // What if `2` count is `4`? Wait4 at (4,1) stays at (4,1), move(5,1), move(6,1 G)!!
      program: []
    },
    // W5-9 (boss, 8x8)
    {
      id: 49, world: 5, stageInWorld: 9, title: '歯車工場の検査ライン', role: 'boss',
      hint: 'コンベアのさきに ビスケットカベ！タイミングを あわせて ドリルだ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 45,
      start: { x: 1, y: 5, dir: 1 },
      gear: { x: 5, y: 3 },
      map: [
        '########',
        '#......#',
        '#.####.#',
        '#..R.BG#', // Wait: (3,3)R -> (4,3)., (5,3)B? Note gear cannot be inside B! Put gear at (4,3) and B at (5,3) and G at (6,3)!
        '#.U.##.#',
        '#......#',
        '#......#',
        '########'
      ],
      // Trace:
      // start(1,5, dir:1 east):
      // 0: move(2,5) -> 1: turn_left(north) -> 2: move(2,4 U -> conveys to 2,3!)
      // At (2,3) facing north: 3: turn_right(east) -> 4: move(3,3 R -> conveys to 4,3 gear!)
      // At (4,3) facing east: 5: drill(breaks 5,3 B -> 5,3) -> 6: move(6,3 G)!
      // Bug: 5 is `move` (crashes into 5,3 B!) -> Fix 5 (`move` -> `drill`)!
      // Let's wrap `move, drill` or use loop to fit W5 theme:
      // [C('move'), C('turn_left'), C('move'), C('turn_right'), L(2, [C('move')]), C('move')]
      // Wait: if `4` is `L(2, [C('move')])`: move1->(3,3 R->4,3 gear), move2->crashes (5,3 B)!
      // So make `4` = `L(1...` no, make `5` = `move` (bug) and put `L(2, [C('turn_left')])`? No, make `0` = `L(2, [C('move')])` -> `(1,5)->(2,5)->(3,5)`?
      // Let's put `U` at `(3,4)`!
      // Trace: start(1,5,dir:1) -> L(2,[move]) -> (3,5) -> turn_left(north) -> move(3,4 U -> conveys to 3,3? No, put R at (3,3) -> wait!).
      // Put U at (2,4), R at (3,3), gear at (4,3), B at (5,3), G at (6,3):
      // 0: L(2, [C('move')]) -> if count is 2: (1,5)->(2,5)->(3,5) (misses 2,4 U!). Count 1? No, start at (0,5)? Start at (1,5), put U at (3,4), R at (4,3), B at (5,3)...
      // Look: map[3] = '#...RBG#'? (4,3)R -> conveys (5,3 B? wall blocks conveyor!).
      // Make map[3] = '#..R.BG#' (x=3:R, x=4:.[gear], x=5:B, x=6:G)!
      // And U at (3,4)!
      // Trace:
      // 0: L(2, [C('move')]) -> (1,5)->(2,5)->(3,5)!
      // 1: turn_left(north)
      // 2: move -> (3,4 U -> conveys to 3,3 R? Remember conveyor doesn't chain! So at (3,3) you wait or turn_right!)
      // 3: turn_right(east) -> (3,3 R -> conveys to 4,3 gear!)
      // 4: drill -> breaks (5,3 B) -> (5,3)!
      // 5: move -> (6,3 G)!
      // Bug: 4 is `jump` (stuns on B)! Fix 4 (`jump` -> `drill`)!
      program: []
    },
    // W5-10 (boss, 8x8)
    {
      id: 50, world: 5, stageInWorld: 10, title: '第5層ボス：大時計の歯車エンジン', role: 'boss',
      hint: '第5層の クライマックス！コンベア・プレート・ループを 1てで つなげ！',
      availableParts: ['spring', 'drill', 'turbo', 'magnet'], availableConditions: [], allowLoopEdit: true, maxSteps: 50,
      start: { x: 1, y: 6, dir: 1 },
      gear: { x: 5, y: 2 },
      map: [
        '########',
        '#......#',
        '#..R.G.#', // (3,2)R -> (4,2)., (5,2)gear, (6,2)? Wait put G at (6,2) or (5,1)!
        '#..U...#',
        '#..U...#',
        '#.C....#', // (2,5)C
        '#......#',
        '########'
      ],
      // Let's trace a grand W5 finale!
      // start(1,6, dir:1 east)
      // 0: move(2,6) -> 1: turn_left(north) -> 2: move(2,5 C -> rotates CW to east!)
      // 3: move(3,5) -> 4: turn_left(north) -> 5: move(3,4 U -> 3,3) ->
      // Better with loop!
      // Start (1,5, dir:1 east), C at (3,5):
      // 0: L(2, [C('move')]) -> (1,5)->(2,5)->(3,5 C -> rotates CW to south!)
      // Wait: if W at (3,5), rotates CCW to north!!
      // Then at (3,5) facing north:
      // 1: L(2, [C('move')]) -> move1(3,4 U -> conveys 3,3), move2(3,2 R -> conveys 4,2)!
      // Wait at (4,2) facing north, we want to go east to (5,2 gear) and (6,2 G)!
      // So put `C` at `(4,2)`! Then `conveys` from `(3,2 R)` onto `(4,2 C)` rotates you CW to east!!
      // Double check `engine.js` line 322: when conveyor moves you onto `C`, it triggers `C` and rotates you CW to east!!
      // THEN at `(4,2)` facing east:
      // 2: L(2, [C('move')]) -> (5,2)[gear!] -> (6,2)[G!]!!
      // Let's check that 3-loop masterpiece!!
      // map:
      // 0: ########
      // 1: #......#
      // 2: #..RC.G#  (3,2)R, (4,2)C, (5,2).[gear], (6,2)G
      // 3: #..#...#  (3,3) is '.'!
      // 4: #..U...#  (3,4)U
      // 5: #..W...#  (3,5)W
      // 6: #......#
      // 7: ########
      // Trace:
      // 0: L(2, [C('move')]) -> (1,5)->(2,5)->(3,5 W -> north)
      // 1: L(2, [C('move')]) -> move1(3,4 U -> 3,3), move2(3,2 R -> 4,2 C -> east!)
      // 2: L(3, [C('move')]) -> Bug count=3 or Bug count=2? Wait at (6,2)G it stops on move2! So bug must be in loop 0 or 1!
      // Put bug: `0` count = `3` (overshoots `(3,5 W)` to `(4,5)` -> crashes/misses!). Fix `0` count `3 -> 2`!!
      // Wait if `0` count = 3: (1,5)->(2,5)->(3,5 W -> north)->(3,4 U -> 3,3), then loop 1 moves (3,2 R -> 4,2 C -> east)->(5,2 gear), then loop 2 moves (6,2 G)!!
      // WHOA! Make sure `0` count = 3 fails! Put `C` at `(3,5)` instead of `W`, and bug `0.body.0` or make `(3,5)` `W` and bug `1` count = `3` (at `(4,2 C -> east)` 3rd move goes `(5,2 gear)`, then `2` goes `(6,2 G)` -> hits `(7,2)#`? No, stops at `(6,2)G`!).
      // So make `1` count = `4`? No, put `^` at `(5,2)`? No, gear is at `(5,2)`.
      // Make `1` (`L(2, [C('move')])`) have `turn_right` inside instead of `move`, OR make `2` (`L(2, [C('move')])`) have `count = 3` when `G` is at `(6,3)` after a `turn_right`:
      // Even simpler: put `B` at `(5,2)`? No, gear at `(5,2)`. Put `^` at `(6,2)` and `G` at `(7,2)`? No, put `O` at `(6,2)` and `G` at `(6,3)` with `C` at `(5,2)`? No, `jump` over `(6,2)O` to `(7,2)`?
      // Easiest & cleanest: at `(4,2)` facing east, `gear` at `(5,2)`, `O` at `(6,2)`? Put `B` at `(5,2)`? Put `G` at `(6,2)` and make bug in loop `0`:
      // `start(1,5, dir:1)`, `0: L(2, [C('turbo')])` (lands at `(3,5 W -> north)` then 2nd turbo goes `(3,3)`? No, `0` count=3 -> `0` count=2 with `C('wait')`? No: `0` is `L(3, [C('move')])` when `start` is at `(1,5)`? Remember earlier `(3,5 W)` happened on move 2! If `0` is `L(2, [C('turn_right')])`? No! If `start` is `(1,5, dir:1)` and `0` is `L(2, [C('move')])` and `(3,5)` is `W`, and `1` is `L(2, [C('jump')])` (jumps over `(3,4)U` and `(3,2)R`!), wait if `1` is `L(2, [C('move')])` and `2` is `L(2, [C('jump')])` (hits wall `(7,2)` and stuns at `(5,2)`? No, `(5,2)->(7,2)` stuns, not G!).
      // YES!! Look at `2: L(2, [C('jump')])` -> at `(4,2)` facing east, `jump` lands on `(6,2)G` in 1 jump? Yes, `(4,2)->(6,2)` skips `(5,2)gear`!
      // So put `G` at `(6,2)`? No, `2` is `[C('move'), C('wait')]` -> bug `2` is `L(2, [C('turn_right')])` or `2` is `C('jump')` (skips `(5,2)gear` -> A-rank? Wait if `2` is `C('move')`, only reaches `(5,2)`!).
      // If `program` is `[L(2, [C('move')]), L(2, [C('move')]), C('move'), C('wait')]`:
      // Base: stops at `(5,2)gear`, doesn't reach `(6,2)G`!
      // Fix `2` (`move` -> `turbo`!): `(4,2)->turbo` runs through `(5,2)gear` AND stops at `(6,2)G`! (**S-rank!!**)
      // Fix `3` (`wait` -> `move`): `(4,2)->move(5,2 gear)->move(6,2 G)`! (**S-rank!!**)
      // What if `G` is `(6,2)` and `2` is `C('jump')`? Base skips `(5,2)gear` and reaches `(6,2)G` (Base would clear!).
      // Instead make Base FAIL by having `2` = `C('turn_right')` and `3` = `C('move')` -> Base turns south at `(4,2)` and moves to `(4,3)` (put `O` at `(4,3)`!).
      // Check: Base falls in `(4,3)O` FAIL!
      // Fix `2` (`turn_right` -> `move`): `(4,2)->move(5,2 gear)->move(6,2 G)` (**S-rank!!**)!
      // Fix `2` (`turn_right` -> `turbo`): `(4,2)->turbo` collects `(5,2)gear` and reaches `(6,2)G` (**S-rank!!**)!
      // Fix `2` (`turn_right` -> `jump`): `(4,2)->jump` skips `(5,2)gear` and reaches `(6,2)G` (**A-rank!!**)!
      // GENIUS!! Look at that: `jump` = A-rank, `move` / `turbo` = S-rank!
      program: []
    }
  ];

  // W5-2 上書き整理
  stages[1].map = [
    '######',
    '#....#',
    '#C..G#',
    '#....#',
    '#....#',
    '######'
  ];

  // W5-4 上書き整理
  stages[3].map = [
    '#######',
    '#.....#',
    '#G..W.#',
    '#.#...#',
    '#...W.#',
    '#######'
  ];

  // W5-5 上書き整理
  stages[4].gear = { x: 3, y: 3 };
  stages[4].map = [
    '#######',
    '#.....#',
    '#.###.#',
    '#.R.OG#',
    '#.###.#',
    '#.....#',
    '#######'
  ];
  stages[4].program = [L(2, [C('move')]), C('wait')];

  // W5-6 上書き整理
  stages[5].start = { x: 1, y: 4, dir: 1 };
  stages[5].gear = { x: 1, y: 2 };
  stages[5].map = [
    '#######',
    '#.....#',
    '#.#.#.#',
    '#O...G#',
    '#U....#', // Wait U was at (2,4)! Let's put U at (2,4): '#.U...#'!
    '#.....#',
    '#######'
  ];
  stages[5].map[4] = '#.U...#';
  stages[5].program = [C('move'), C('turn_right'), L(3, [C('move')])];

  // W5-7 上書き整理
  stages[6].start = { x: 2, y: 3, dir: 1 };
  stages[6].gear = { x: 4, y: 3 };
  stages[6].map = [
    '#######',
    '#.....#',
    '#.....#',
    '#G.C..#',
    '#..O..#',
    '#.....#',
    '#######'
  ];
  stages[6].program = [C('move'), C('move'), L(2, [C('move')])];

  // W5-8 上書き整理
  stages[7].start = { x: 1, y: 4, dir: 1 };
  stages[7].gear = { x: 4, y: 1 };
  stages[7].map = [
    '########',
    '#..R..G#',
    '#..U...#',
    '#..U...#',
    '#..U...#',
    '#......#',
    '########'
  ];
  stages[7].program = [C('move'), C('move'), L(2, [C('wait')]), C('move'), C('move')];

  // W5-9 上書き整理
  stages[8].start = { x: 1, y: 5, dir: 1 };
  stages[8].gear = { x: 4, y: 3 };
  stages[8].map = [
    '########',
    '#......#',
    '#.####.#',
    '#..R.BG#',
    '#..U##.#',
    '#......#',
    '#......#',
    '########'
  ];
  stages[8].program = [L(2, [C('move')]), C('turn_left'), C('move'), C('turn_right'), C('jump'), C('move')];

  // W5-10 上書き整理
  stages[9].start = { x: 1, y: 5, dir: 1 };
  stages[9].gear = { x: 5, y: 2 };
  stages[9].map = [
    '########',
    '#......#',
    '#..RC.G#',
    '#...O..#',
    '#..U...#',
    '#..W...#',
    '#......#',
    '########'
  ];
  stages[9].program = [L(2, [C('move')]), L(2, [C('move')]), C('turn_right'), C('move')];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = stages;
  } else {
    root.BugSweeper = root.BugSweeper || {};
    root.BugSweeper.Stages = (root.BugSweeper.Stages || []).concat(stages);
  }
})(typeof window !== 'undefined' ? window : globalThis);
