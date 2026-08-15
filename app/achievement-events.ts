import type { GameEvent } from "./game-data.ts";

export type AchievementEventContext = {
  week: number;
  seed: string;
  san: number;
  mindset: number;
  experiment: number;
  modules: [number, number, number, number];
  resolvedEvents: string[];
  storyTags: string[];
  inventory: Record<string, number>;
  actionCounts: Record<string, number>;
  weeksToProvincial?: number;
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

const hidden = (
  id: string,
  title: string,
  result: string,
  effects: GameEvent["choices"][number]["effects"],
) => ({ id, title, preview: "先作出判断。结果将在行动后揭晓。", result, effects });

function event(
  ctx: AchievementEventContext,
  id: string,
  label: string,
  title: string,
  body: string[],
  choices: GameEvent["choices"],
): GameEvent {
  return {
    id,
    phase: "weekly",
    label,
    title,
    body,
    choices,
    concealConsequences: true,
    visualNovel: true,
    trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
  };
}

export function nextAchievementStoryEvent(
  ctx: AchievementEventContext,
): GameEvent | null {
  const seen = (id: string) => ctx.resolvedEvents.includes(id);
  const roll = (key: string) => hashSeed(`${ctx.seed}-${ctx.week}-${key}`) % 100;

  if (
    ctx.weeksToProvincial !== undefined &&
    ctx.weeksToProvincial >= 0 &&
    ctx.weeksToProvincial <= 1 &&
    (ctx.actionCounts["book-study"] ?? 0) <= 2 &&
    !seen("achievement-king-of-kings")
  ) {
    return event(
      ctx,
      "achievement-king-of-kings",
      "极限路线 · 省赛前三天",
      "你几乎没有认真学过竞赛，却在最后三天拿到一套机构模考。",
      [
        "前面的日子已经无法追回。桌上这套卷也不是什么神奇押题，只是最后一次让你熟悉题量、节奏和答题卡的机会。",
        "队友劝你别把侥幸当计划，教练甚至不愿再预测结果。可正式考试依然会给每个人八十道题，运气也不会因为准备不足而自动离场。",
      ],
      [
        hidden("king-sprint", "用最后三天完整模考、对答案、再重做", "你关掉所有不必要的消息，严格按正式时限做完一套八十题模考，第一次感到题量怎样一点点吞掉犹豫的时间。对答案后，你只重做最常见的误读与节奏问题，没有幻想三天补齐两年知识。走进考场时漏洞依然很多，但答题卡、取舍顺序和时间节点已经不再陌生；剩下的，只能诚实交给那一年的卷子。", { problemSpeed: 2.2, reasoning: 0.8, san: -7, mindset: -1, tags: ["王中王冲刺"] }),
        hidden("king-sleep", "不再制造奇迹叙事，先保证考试状态", "你放下“最后三天逆袭”的故事，只确认答题规则、考试路线和几道最基础的旧错题，随后把闹钟放远，按时关灯。半夜仍会想象意外爆冷，也会担心自己过早放弃，但清晨醒来时头脑至少完整。你未必因此创造奇迹，却避免在准备本就不足的情况下，再用失眠把仅剩的判断力彻底耗空。", { san: 3, mindset: 0.8, tags: ["省赛前选择保状态"] }),
        hidden("king-give-up", "承认这一次没有准备，回去学常规", "你把模考卷收进抽屉，向教练和家长承认自己没有为这次比赛做好足够准备，也不想把几乎裸考包装成勇气。第二天的日程重新出现积欠的常规作业，你开始补上此前逃开的章节。竞赛结果仍会到来，却不再承担证明天赋、价值和未来的全部任务；这次退回常规线不是漂亮结局，但它是清醒选择。", { academics: 5, san: 1, mindset: 0.5, tags: ["省赛前放弃奇迹"] }),
      ],
    );
  }

  if (
    ctx.inventory["plant-seeds"] > 0 &&
    ctx.week >= 12 &&
    !seen("achievement-first-rain")
  ) {
    return event(
      ctx,
      "achievement-first-rain",
      "特殊道具事件 · 第一场雨",
      "那包来历不明的种子在连续阴雨后发了芽。",
      [
        "你原本只是把它放在竞赛教室窗台。没有标签，没有期待，甚至几次忘了浇水。",
        "第一场真正的雨落下时，细小的绿色从土里顶出来。队友围过来看，争论它属于哪一科、是否应该做切片，以及谁该为它负责。",
        "它没法提高省赛分数，却让这间只剩排名和倒计时的教室，重新出现一点不以结果为目的的生命。",
      ],
      [
        hidden("seed-observe", "建立一本认真但不过度的观察记录", "你找来旧本子记录叶形、光照、浇水和每天的生长，却先约定不为了验证每个猜想就拆叶、移栽或增加刺激。观察渐渐成为晚自习前短暂的共同仪式，几名队友也会补上自己看见的变化。那株没有标签的植物后来留在窗台，成为每届新队员都会问起、却始终没人舍得拿去做切片的传说。", { mindset: 1.5, san: 2, module2: 0.3, tags: ["achievement:first-rain"] }),
        hidden("seed-share", "把幼苗分给愿意照料的队友", "你等幼苗稍微稳定后，把拥挤的植株分进几只写着日期的纸杯，交给真正愿意照料的队友。它们散落在不同宿舍与教室窗边，有的长得很好，有的只留下两片小叶。你们偶尔在群里交换照片和浇水提醒，那些画面不讨论排名，倒像是在确认彼此被竞赛占满的日子之外，也仍认真照顾着一些活物。", { peerFavor: 2, san: 1.5, tags: ["achievement:first-rain"] }),
        hidden("seed-ignore", "先放着，等它自己决定", "你没有建立严密计划，只把花盆留在能接到雨水和散射光的位置，偶尔想起时才浇一点水。它没有按照任何人的预测生长，茎歪向窗外，叶片也并不整齐，却顽强地越过了几次无人照看的周末。没有人能确定这算种植成功还是管理失控，但在一间凡事都要量化的教室里，它至少以自己的节奏活了下来。", { san: 1, mindset: 0.5, tags: ["achievement:first-rain"] }),
      ],
    );
  }

  if (
    ctx.inventory["plant-seeds"] > 0 &&
    ctx.experiment >= 15 &&
    ctx.week >= 28 &&
    !seen("achievement-biohazard") &&
    roll("biohazard") < 60
  ) {
    return event(
      ctx,
      "achievement-biohazard",
      "植物实验支线 · 生化危机",
      "紫外灯下，那只培养皿里的东西不像原来的材料了。",
      [
        "你原本只想比较不同处理对萌发的影响。可标签在搬动中被蹭花，照射时间也因为一次聊天多出了几分钟。",
        "几天后，培养皿里出现一团颜色可疑、边缘扩张得过分积极的组织。队友建议立刻封存，另一个人已经开始给它起名字。",
      ],
      [
        hidden("biohazard-seal", "停止玩梗，按安全流程封存并报告", "你制止队友继续靠近，按流程封住培养皿、标明未知风险，并把标签受损和照射超时如实写进记录。教练先批评前期记录不完整，核对处置后却承认你在关键时刻没有隐瞒。那团可疑组织最终被规范处理，没有留下事故；群聊里流传的版本却越来越夸张，仿佛你们真的阻止了一场校园灾难。", { experiment: 1, mindset: 0.5, coachFavor: 0.5, tags: ["achievement:biohazard"] }),
        hidden("biohazard-observe", "隔着防护继续记录一天", "你没有打开培养皿，只隔着防护拍照、标记边缘并记录扩张速度，试图多保留一天变化数据。照片呈现出几种难以解释的色泽，也让你短暂获得发现未知现象的兴奋。第二天实验老师看到后，立刻连人带培养皿安排规范处置，并让全组补做安全培训；好奇心得到材料，代价则是一份格外详细的检讨。", { experiment: 0.8, san: 1, coachFavor: -1, tags: ["achievement:biohazard"] }),
        hidden("biohazard-name", "先给它取一个足够灾难片的名字", "你脱口而出一个像灾难电影续集的名字，队友立刻为它设计缩写和警示标志。名字在群聊里飞快传播，培养条件、颜色和大小却在每次转述中继续突变，甚至有人询问学校是否需要封锁。玩笑结束后，你们仍按规定报告并处理了材料；只是等事实安全落地，已经没人说得清它最初究竟长什么样。", { san: 1.5, social: 0.5, tags: ["achievement:biohazard"] }),
      ],
    );
  }

  if (
    ctx.experiment >= 18 &&
    ctx.week >= 32 &&
    !seen("achievement-zero-plus-five")
  ) {
    return event(
      ctx,
      "achievement-zero-plus-five",
      "实验课风味 · 0+5",
      "老师离开五分钟，实验材料和零食出现在同一张桌上。",
      [
        "一袋正常食物旁边，放着几份为了行为观察准备的材料。有人随口问了一句“这个是不是也能吃”，空气立刻变得危险起来。",
        "你很清楚笑话的边界应该停在哪里。问题在于，全组已经笑得没人能把说明书读完整。",
      ],
      [
        hidden("zero-stop", "把可食物与实验材料彻底分开", "你把零食全部装回袋子移到门外，又用不同托盘重新归置实验材料，逼着全组洗手后再继续。五分钟后老师回来，只看到一张异常整洁的桌子和几张因为憋笑而表情古怪的脸。没有食物进入实验区，也没有材料被误尝；事故没有发生，可那句危险问题已经足够成为此后每次实验课都会被翻出的故事。", { experiment: 0.8, mindset: 0.4, tags: ["achievement:zero-plus-five"] }),
        hidden("zero-label", "重新贴标签，再给全组讲一遍安全边界", "你重新检查每个容器，用醒目的颜色区分可食物与实验材料，再让所有人停下来复述一次安全边界。严肃气氛只维持到某个同学举手问标签是否应该补写拉丁名，全组又笑成一团。玩笑归玩笑，这次重贴之后再没人仅凭外观伸手，也没人把“应该没事”当作足以继续操作的依据。", { experiment: 1, social: 0.4, tags: ["achievement:zero-plus-five"] }),
        hidden("zero-photo", "拍下混乱现场作为反面教材", "你先确保没有人触碰错误材料，随后拍下零食袋、培养材料和无人读完的说明书挤在同一桌面的混乱现场。照片被附进实验记录，旁边逐项标明可能产生的交叉污染与误食风险。后来它出现在下一届实验启蒙的第一张幻灯片上，老师称其为“真实案例”，所有能被认出的当事人却一致否认自己曾经在场。", { san: 1, experiment: 0.5, tags: ["achievement:zero-plus-five"] }),
      ],
    );
  }

  if (
    ctx.experiment >= 24 &&
    ctx.modules[1] >= 42 &&
    !seen("achievement-pokemon")
  ) {
    return event(
      ctx,
      "achievement-pokemon",
      "动物实验支线 · 宝可梦大师",
      "行为实验的动物，似乎只听你的指令。",
      [
        "同样的刺激、同样的装置，换一个人操作就得到完全不同的反应。组员开始怀疑你偷偷训练过它，教练则怀疑所有人都没有控制好气味和动作。",
        "一个玩笑式的“技能名”脱口而出，实验室里第一次响起整齐的倒计时。",
      ],
      [
        hidden("pokemon-control", "把玩笑收住，逐项排查操作差异", "你让每个人按相同顺序复现动作，记录站位、手势、气味残留与光源方向，不再把差异归因于神秘亲和力。几轮交换后，你们定位到操作者遮挡光线和靠近速度造成的偏差，并重新统一条件。所谓特殊能力随之消失，略有遗憾；但从变量里找出真正原因后，全组的实验能力终于实实在在上升。", { experiment: 1.5, reasoning: 0.4, tags: ["achievement:pokemon-master"] }),
        hidden("pokemon-command", "再试一次中二但统一的口令", "你保留那个夸张的技能名，让每个人在固定口令后同时开始动作、计时与记录。整组操作意外因此变得同步，重复间差异也明显缩小。动物当然听不懂你们的中二台词，真正被训练的是实验者自己的节奏与注意力。笑声没有替代控制变量，却给原本各自为战的步骤提供了一个谁都不会忘记的共同信号。", { experiment: 1.2, san: 1, tags: ["achievement:pokemon-master"] }),
        hidden("pokemon-retire", "见好就收，避免过度刺激材料", "队友想再录一次反应最整齐的画面，你却注意到材料已经出现应激迹象，便终止额外刺激，按规范完成恢复与记录。你放弃了可能最好笑、最适合传播的一段录像，却保住实验边界和动物福利。老师检查记录时没有多夸奖，只把下一组材料放心交给你；那个眼神第一次像在看一个可靠的实验搭档。", { experiment: 1, mindset: 0.6, coachFavor: 0.5, tags: ["achievement:pokemon-master"] }),
      ],
    );
  }

  if (
    ctx.experiment >= 30 &&
    ctx.week >= 45 &&
    !seen("achievement-inception")
  ) {
    return event(
      ctx,
      "achievement-inception",
      "实验模考支线 · 盗梦空间",
      "移液枪的刻度、你的手感和称量结果，只有两个能同时为真。",
      [
        "你重复操作三次，读数仍像从不同世界线送来。隔壁组已经开始下一步，你却必须决定是相信仪器、相信自己，还是承认整个校准过程可能有问题。",
        "国赛实验不奖励固执。它只奖励在有限时间里识别哪个现实更可信的人。",
      ],
      [
        hidden("inception-calibrate", "立即用标准液复核并更换枪头", "你暂停后续步骤，用标准液重新检查量程，并逐一更换可能漏气的枪头。问题最终落在一个不起眼的密封圈上，发现时计时器已经损失不少时间。你不得不压缩后面的观察，却阻止所有样本沿着同一错误继续处理。那次停顿看似拖慢流程，实际把整组数据从相互矛盾的世界线拉回了同一现实。", { experiment: 1.6, problemSpeed: 0.2, san: -1, tags: ["achievement:inception"] }),
        hidden("inception-parallel", "保留两套假设，平行推进关键步骤", "你没有立即判定仪器或手感谁错，而是给两套读数分别编号，只推进各自最关键且可比较的步骤，同时完整记录假设。时间因此更加紧张，操作也承担更高风险；但当仪器误差最终被确认时，其中一组结果仍能通过对照解释。你学到的不是永远同时做两份，而是在无法迅速排除不确定性时，怎样给实验留下可追溯的退路。", { experiment: 1.4, reasoning: 0.5, san: -1.5, tags: ["achievement:inception"] }),
        hidden("inception-hand", "相信长期形成的手感，先完成流程", "你选择相信长期训练形成的阻力与刻度感，没有中断流程，只在记录旁标出疑点。最终结果的误差仍落在可接受范围，说明这一次判断碰巧站在正确一侧。喜悦过后，你却把异常枪头单独封存，并在复盘第一行写下：手感可以提示故障，却不能成为下次跳过校准的理由；一次侥幸更不该被改写成可靠方法。", { experiment: 1, mindset: 0.4, tags: ["achievement:inception"] }),
      ],
    );
  }

  if (
    ctx.experiment >= 36 &&
    ctx.san <= 48 &&
    !seen("achievement-metamorphosis")
  ) {
    return event(
      ctx,
      "achievement-metamorphosis",
      "低SAN实验事件 · 变形记",
      "盯着解剖镜太久以后，边界开始变得不可靠。",
      [
        "连续训练让你的手还在按步骤移动，意识却像慢了半拍。镜下结构清晰得过分，你忽然产生一种荒唐错觉：观察者和材料之间的距离正在缩短。",
        "你可以继续完成这次计时，也可以承认当前状态已经影响安全。",
      ],
      [
        hidden("meta-stop", "放下器材，报告自己需要休息", "你把器材归位，明确告诉教练自己的视觉与判断已经不可靠，请求暂停计时。走出镜头后，你喝水、看向远处，让呼吸和视野慢慢恢复；十分钟后，世界终于回到正常比例。你没有完成当天最快的一次训练，甚至丢掉一轮数据，却在状态最糟时作出了比速度更重要的风险判断，也为以后识别极限留下经验。", { san: 2.5, experiment: 0.6, mindset: 0.8, tags: ["achievement:metamorphosis"] }),
        hidden("meta-ground", "逐项念出结构名称，让自己回到步骤", "你停下手中的刀，按顺序念出视野里的结构、器材位置和下一步动作，让每个名称都对应一个可以核验的现实对象。命名像一根绳，把漂开的意识重新系回步骤；操作最终完成，却比平时慢得多。复盘时你没有只记成功，而是写下低SAN怎样改变距离感、时间感和自信，以免下次把同样的错觉误认成专注。", { experiment: 1.2, san: -0.8, tags: ["achievement:metamorphosis", "achievement:enlightenment"] }),
        hidden("meta-tell", "把错觉告诉可信任的队友，请TA监护", "你压低声音告诉身旁的队友，镜下结构正在变得不真实，请TA暂时监护器材与每一步判断。对方没有嘲笑，也没有替你隐瞒风险，而是接过危险操作，让你只负责核对记录，并在结束后陪你向教练说明。两个人安全收尾了这次训练；从那以后，你们的关系不再只是默契并肩，也包含在对方失去把握时真正接住彼此。", { experiment: 0.8, peerFavor: 1.5, san: 1, tags: ["achievement:metamorphosis", "achievement:enlightenment"] }),
      ],
    );
  }

  if (
    ctx.experiment >= 42 &&
    ctx.week >= 50 &&
    !seen("achievement-divine-move")
  ) {
    return event(
      ctx,
      "achievement-divine-move",
      "实验考场支线 · 神之一手",
      "最后七码的时间，只够你救一组数据。",
      [
        "一个对照异常，一支试剂将尽，计时器已经进入最后几分钟。标准流程无法完整重来，你只能依据现有证据选择最值得保存的环节。",
        "这不是赌运气。真正困难的是在压力下承认哪些信息可靠、哪些已经无法挽回。",
      ],
      [
        hidden("divine-control", "优先重做关键对照", "你判断失效的对照会让所有样本都失去解释基础，于是果断放弃一部分来不及处理的材料，把最后试剂用于重建关键基线。新的对照出现后，原本混乱的数据终于显出一致趋势。样本数量少了，表格也不再漂亮，但你保住了结论能够成立的前提；最后七码没有创造奇迹，只完成了最必要的取舍。", { experiment: 1.8, reasoning: 0.5, san: -1.2, tags: ["achievement:divine-move"] }),
        hidden("divine-sample", "保住稀缺样本，用现有对照校正", "你确认稀缺样本无法重新取得，便保留现有材料，依据尚可用的对照进行校正，并把每一步假设写在答题纸边缘。你没有把修正值伪装成原始观察，也明确说明结论在哪些条件下可能失效。这个方案并不完美，却让阅卷者看见完整的判断链：你知道自己牺牲了什么，也知道最终答案不能声称什么。", { experiment: 1.6, reasoning: 0.7, san: -1.5, tags: ["achievement:divine-move"] }),
        hidden("divine-stop", "停止追加操作，整理最可信的已有结果", "计时器还剩一点，你却没有把最后试剂押在一次未经验证的追加操作上，而是停止实验，按可信程度整理已有结果，标出异常值和未完成步骤。克制看上去不如翻盘壮烈，却避免把最后一份清楚记录也搅乱。最终，不完整的数据仍因边界明确而获得分数；你抵抗的不是机会，而是压力下那句危险的“再试一下”。", { experiment: 1.4, mindset: 0.6, tags: ["achievement:divine-move"] }),
      ],
    );
  }

  if (
    ctx.experiment >= 26 &&
    ctx.actionCounts["rival-study"] >= 4 &&
    !seen("achievement-old-artist")
  ) {
    return event(
      ctx,
      "achievement-old-artist",
      "队友实验支线 · 老艺术家",
      "你的实验结果失败得很有观赏性。",
      [
        "显色梯度没有出现预期的单调变化，反而组成了从浅到深再突然消失的一整套色阶。全组沉默几秒，随后有人认真评价构图。",
        "笑过以后，仍然要决定怎样面对失败：藏起来、怪试剂，还是让这次失败变成下一次不会再犯的东西。",
      ],
      [
        hidden("artist-present", "把失败结果做成三分钟复盘", "你把最荒谬的显色照片放在第一页，允许全组先笑够，再用剩下时间按试剂顺序、混匀方式和计时节点逐项排查。复盘没有假装这是一场成功实验，却从失败里准确找出最可能的断点。笑声并未削弱严谨，反而让每个人都把那个容易忽略的步骤牢牢记住；下一次操作前，他们会主动互相提醒。", { experiment: 1.2, social: 0.8, san: 1, tags: ["achievement:old-artist"] }),
        hidden("artist-gallery", "给色阶命名，再认真重做", "你们给每一段离谱色阶取了像画展作品一样的名字，拍照发进群聊，约定只让它存活一晚。玩笑结束后，全组重新配液、统一计时，第二天的梯度终于恢复应有的单调变化。那幅“名作”后来仍被偶尔翻出，每当有人出现相同错误，大家都会先引用它的标题，再检查当初遗漏的步骤。", { experiment: 1, san: 1.5, tags: ["achievement:old-artist"] }),
        hidden("artist-own", "直接承认是自己的操作问题", "你回忆起自己在关键步骤提前停止混匀，便直接说明问题可能出在操作，没有把责任推给试剂，也没有用过度自责要求全组安慰。队友陪你按慢速重新走一遍动作，指出手腕角度和计时之间的配合。下一轮换TA主操作时，你也替TA守住计时与记录；一次失败没有划分责任阵营，反而建立起更可靠的互相校验。", { experiment: 1.3, peerFavor: 1, tags: ["achievement:old-artist"] }),
      ],
    );
  }

  if (
    ctx.san <= 24 &&
    ctx.week >= 36 &&
    !seen("achievement-re-zero")
  ) {
    return event(
      ctx,
      "achievement-re-zero",
      "低SAN梦境 · 从零开始的生竞生活",
      "你梦见自己回到了第一次推开竞赛教室门的那天。",
      [
        "桌上的书恢复洁白，省赛倒计时重新变成三百多天。你记得后来发生的一切，却无法向梦里的人证明。",
        "你试图修正每一次失误，时间却总在同一张榜单前重新开始。直到你意识到，真正困住你的不是失败，而是相信必须重来才能原谅自己。",
      ],
      [
        hidden("rezero-wake", "接受已经发生的经历，强迫自己醒来", "你不再追赶梦里不断重置的榜单，而是一遍遍说出真实年份、真实房间和已经发生过的选择，直到那扇竞赛教室的门终于远去。清晨醒来，书页仍有折角，时间也没有倒流，损失当然没有被取消。可你第一次把“继续”理解成承认这些痕迹后仍向前走，而不是必须抹掉一切、从零开始才配原谅自己。", { san: 2.5, mindset: 1.2, tags: ["achievement:re-zero-bio"] }),
        hidden("rezero-rest", "在梦里坐下，不再参加那场考试", "当广播再次催你进入考场，你没有奔跑，而是在走廊长椅上坐下，看着梦里的人从身边经过。循环失去你的配合后逐渐安静，榜单与倒计时也像褪色纸张一样散开。醒来后，你没有立刻拿书证明自己仍在努力，而是给自己留出半天吃饭、散步和补觉；短暂停止不再意味着整个生活会因此坍塌。", { san: 3.5, mindset: 0.8, tags: ["achievement:re-zero-bio"] }),
        hidden("rezero-note", "给第一次入门的自己留一张纸条", "你在梦里找到那张最初的报名表，却没有写押题、书单或避免失败的捷径，只在背面留下一句话：你可以认真开始，也可以在任何时候重新选择。年少的自己读完后没有立刻理解，只把纸条折进口袋。清晨醒来，梦境迅速消散，那句话却仍清楚地留着，像一份迟到许久、终于由你亲手补上的许可。", { san: 2, mindset: 1.5, tags: ["achievement:re-zero-bio"] }),
      ],
    );
  }

  return null;
}

export function achievementStoryDeveloperCatalog(seed = "developer-achievement"): GameEvent[] {
  const contexts: AchievementEventContext[] = [
    { week: 60, seed, san: 18, mindset: 20, experiment: 80, modules: [90, 90, 90, 90], resolvedEvents: [], storyTags: [], inventory: { "field-kit": 1, "slide-box": 1 }, actionCounts: { "book-study": 0, slack: 12 }, weeksToProvincial: 1 },
    { week: 60, seed: `${seed}-steady`, san: 72, mindset: 75, experiment: 80, modules: [90, 90, 90, 90], resolvedEvents: [], storyTags: ["实验失败"], inventory: { "field-kit": 1, "slide-box": 1 }, actionCounts: { "book-study": 40, slack: 0 }, weeksToProvincial: 12 },
    { week: 40, seed: `${seed}-low`, san: 12, mindset: 12, experiment: 8, modules: [5, 8, 6, 4], resolvedEvents: [], storyTags: [], inventory: {}, actionCounts: { "book-study": 0, slack: 20 }, weeksToProvincial: 8 },
  ];
  const catalog = new Map<string, GameEvent>();
  for (const base of contexts) {
    const resolvedEvents: string[] = [];
    for (let index = 0; index < 20; index += 1) {
      const event = nextAchievementStoryEvent({ ...base, resolvedEvents });
      if (!event) break;
      catalog.set(event.id, event);
      resolvedEvents.push(event.id);
    }
  }
  return [...catalog.values()];
}
