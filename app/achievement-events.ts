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
        hidden("king-sprint", "用最后三天完整模考、对答案、再重做", "你第一次真正感到八十道题会怎样压缩时间。三天不可能补齐两年，却让你至少不是毫无准备地走进考场。剩下的，只能交给那一年的卷子。", { problemSpeed: 2.2, reasoning: 0.8, san: -7, mindset: -1, tags: ["王中王冲刺"] }),
        hidden("king-sleep", "不再制造奇迹叙事，先保证考试状态", "你只看了答题规则和最基本的错题，随后按时睡觉。也许不会爆冷，至少不会因为最后三天把自己彻底耗空。", { san: 3, mindset: 0.8, tags: ["省赛前选择保状态"] }),
        hidden("king-give-up", "承认这一次没有准备，回去学常规", "你没有把一场几乎裸考包装成勇气。第二天的日程重新出现常规作业，竞赛结果也不再承担证明一切的任务。", { academics: 5, san: 1, mindset: 0.5, tags: ["省赛前放弃奇迹"] }),
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
        hidden("seed-observe", "建立一本认真但不过度的观察记录", "你记录叶形、光照和生长，却没有为了验证猜想把它拆掉。那株植物后来成为每届队员都会问起的窗台传说。", { mindset: 1.5, san: 2, module2: 0.3, tags: ["achievement:first-rain"] }),
        hidden("seed-share", "把幼苗分给愿意照料的队友", "几只纸杯散落在不同宿舍。你们偶尔交换照片，像确认彼此在竞赛之外也还活着。", { peerFavor: 2, san: 1.5, tags: ["achievement:first-rain"] }),
        hidden("seed-ignore", "先放着，等它自己决定", "它歪歪扭扭地长向窗外。没有人能确定这算成功还是失控，但至少它活了下来。", { san: 1, mindset: 0.5, tags: ["achievement:first-rain"] }),
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
        hidden("biohazard-seal", "停止玩梗，按安全流程封存并报告", "教练先批评记录不完整，随后承认你的处置正确。那团东西被规范处理，只在群聊里留下一个夸张得多的版本。", { experiment: 1, mindset: 0.5, coachFavor: 0.5, tags: ["achievement:biohazard"] }),
        hidden("biohazard-observe", "隔着防护继续记录一天", "你获得了几张难以解释的照片，也在第二天被实验老师连人带培养皿赶去补安全培训。", { experiment: 0.8, san: 1, coachFavor: -1, tags: ["achievement:biohazard"] }),
        hidden("biohazard-name", "先给它取一个足够灾难片的名字", "名字迅速传播，事实则在每次转述中继续突变。最终你仍然按规定处理了它，只是已经没人记得最初长什么样。", { san: 1.5, social: 0.5, tags: ["achievement:biohazard"] }),
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
        hidden("zero-stop", "把可食物与实验材料彻底分开", "五分钟后老师回来，只看到一张异常整洁的桌子和一群努力不笑的人。事故没有发生，故事却已经形成。", { experiment: 0.8, mindset: 0.4, tags: ["achievement:zero-plus-five"] }),
        hidden("zero-label", "重新贴标签，再给全组讲一遍安全边界", "你的严肃只维持到某个同学问标签要不要写拉丁名。至少，从此没人真的拿错。", { experiment: 1, social: 0.4, tags: ["achievement:zero-plus-five"] }),
        hidden("zero-photo", "拍下混乱现场作为反面教材", "照片后来出现在下一届实验启蒙的第一张幻灯片里，所有当事人都否认自己在场。", { san: 1, experiment: 0.5, tags: ["achievement:zero-plus-five"] }),
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
        hidden("pokemon-control", "把玩笑收住，逐项排查操作差异", "你们最终找到站位和光照造成的偏差。神秘能力消失了，实验能力真正上升了一点。", { experiment: 1.5, reasoning: 0.4, tags: ["achievement:pokemon-master"] }),
        hidden("pokemon-command", "再试一次中二但统一的口令", "整组操作意外地因此同步。动物当然不懂口令，实验者却终于控制住了自己的节奏。", { experiment: 1.2, san: 1, tags: ["achievement:pokemon-master"] }),
        hidden("pokemon-retire", "见好就收，避免过度刺激材料", "你放弃了最好笑的一次录像机会，却保住了规范和动物福利。老师看你的眼神第一次像在看可靠的实验搭档。", { experiment: 1, mindset: 0.6, coachFavor: 0.5, tags: ["achievement:pokemon-master"] }),
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
        hidden("inception-calibrate", "立即用标准液复核并更换枪头", "问题来自一个不起眼的密封圈。你损失了时间，却阻止了后续所有数据一起坠入梦境。", { experiment: 1.6, problemSpeed: 0.2, san: -1, tags: ["achievement:inception"] }),
        hidden("inception-parallel", "保留两套假设，平行推进关键步骤", "这是危险的选择，却让你在发现仪器误差后仍有一组可用结果。你学会了给实验留退路。", { experiment: 1.4, reasoning: 0.5, san: -1.5, tags: ["achievement:inception"] }),
        hidden("inception-hand", "相信长期形成的手感，先完成流程", "最终误差仍在可接受范围。你赢了一次，却在复盘里写下：侥幸不能成为下次的校准方法。", { experiment: 1, mindset: 0.4, tags: ["achievement:inception"] }),
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
        hidden("meta-stop", "放下器材，报告自己需要休息", "离开镜头十分钟后，世界重新恢复正常比例。你没有完成最快的一次训练，却完成了更重要的风险判断。", { san: 2.5, experiment: 0.6, mindset: 0.8, tags: ["achievement:metamorphosis"] }),
        hidden("meta-ground", "逐项念出结构名称，让自己回到步骤", "命名像一根绳，把意识重新系回现实。你完成了操作，也记住低SAN会怎样扭曲判断。", { experiment: 1.2, san: -0.8, tags: ["achievement:metamorphosis", "achievement:enlightenment"] }),
        hidden("meta-tell", "把错觉告诉可信任的队友，请TA监护", "对方没有嘲笑，也没有替你隐瞒风险。两个人把实验安全地收尾，关系从并肩变成了真正的照看。", { experiment: 0.8, peerFavor: 1.5, san: 1, tags: ["achievement:metamorphosis", "achievement:enlightenment"] }),
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
        hidden("divine-control", "优先重做关键对照", "新对照让原本混乱的数据突然可解释。你失去了一部分样本，却保住了整个结论。", { experiment: 1.8, reasoning: 0.5, san: -1.2, tags: ["achievement:divine-move"] }),
        hidden("divine-sample", "保住稀缺样本，用现有对照校正", "校正不是完美答案，但你完整写明假设与限制。阅卷者认可了你的判断链。", { experiment: 1.6, reasoning: 0.7, san: -1.5, tags: ["achievement:divine-move"] }),
        hidden("divine-stop", "停止追加操作，整理最可信的已有结果", "你抵抗了“再试一下”的冲动。清楚、克制的记录让不完整的数据仍然获得了分数。", { experiment: 1.4, mindset: 0.6, tags: ["achievement:divine-move"] }),
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
        hidden("artist-present", "把失败结果做成三分钟复盘", "你先展示最荒谬的照片，再逐项排查误差。笑声没有削弱严谨，反而让全组记住了那一步。", { experiment: 1.2, social: 0.8, san: 1, tags: ["achievement:old-artist"] }),
        hidden("artist-gallery", "给色阶命名，再认真重做", "作品只在群聊存活一晚，第二天的数据终于恢复正常。后来大家看到相同错误，都会引用那幅“名作”。", { experiment: 1, san: 1.5, tags: ["achievement:old-artist"] }),
        hidden("artist-own", "直接承认是自己的操作问题", "没有甩锅，也没有过度自责。队友帮你检查动作，你也在下一轮替他看住了计时。", { experiment: 1.3, peerFavor: 1, tags: ["achievement:old-artist"] }),
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
        hidden("rezero-wake", "接受已经发生的经历，强迫自己醒来", "清晨的书仍有折角，时间也没有倒流。你第一次把“继续”理解成带着损失向前，而不是假装一切从零开始。", { san: 2.5, mindset: 1.2, tags: ["achievement:re-zero-bio"] }),
        hidden("rezero-rest", "在梦里坐下，不再参加那场考试", "循环因为你的停下而失去力量。醒来后，你给自己留出半天，不用学习证明存在。", { san: 3.5, mindset: 0.8, tags: ["achievement:re-zero-bio"] }),
        hidden("rezero-note", "给第一次入门的自己留一张纸条", "纸条上没有押题，只有一句：你随时可以重新选择。醒来时，那句话仍然清楚。", { san: 2, mindset: 1.5, tags: ["achievement:re-zero-bio"] }),
      ],
    );
  }

  return null;
}
