import type { GameEvent } from "./game-data.ts";
import {
  normalizeRelationship,
  type DeepRelationship,
  type RelationshipCandidate,
  type RelationshipInnerConflict,
  type RelationshipStoryContext,
} from "./relationship-content.ts";

export type RelationshipDailyContext = RelationshipStoryContext & {
  isTraining: boolean;
  pocketMoney: number;
  weeksToProvincial?: number;
  hasNationalAttempt: boolean;
};

type DailyStage = "neutral" | "crush" | "dating" | "friend";
type DailyTone = "care" | "light" | "honest" | "practical" | "boundary" | "avoid" | "hurt";
type PersonalityKey = RelationshipCandidate["personalityKey"];

type DailyOption = {
  tone: DailyTone;
  title: string;
  result: string;
  effects: GameEvent["choices"][number]["effects"];
};

type DailyTemplate = {
  key: string;
  stage: DailyStage;
  title: (name: string) => string;
  body: (name: string) => string[];
  choices: (name: string) => DailyOption[];
  minWeek?: number;
  when?: (ctx: RelationshipDailyContext, relation: DeepRelationship) => boolean;
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function personalityAside(candidate: RelationshipCandidate) {
  const { name } = candidate.rival;
  const lines = {
    reserved: `${name}仍旧不把关心说得很满，真正的意思藏在提前整理好的东西里。`,
    warm: `${name}总会先照顾人的感受，再讨论那件事究竟应该怎样解决。`,
    competitive: `${name}连表达在意都像在下战书，好像温柔也必须附带一个可以检验的目标。`,
    playful: `${name}习惯用玩笑替沉默开一道口子，等你笑了，才把真正想说的话放进去。`,
    curious: `${name}没有急着给结论，而是继续追问你当时为什么会那样想。`,
  };
  return lines[candidate.personalityKey];
}

function innerConflictFor(candidate: RelationshipCandidate, seed: string) {
  if (candidate.innerConflictKey) return candidate.innerConflictKey;
  const conflicts: RelationshipInnerConflict[] = [
    "abandonment",
    "burden",
    "achievement",
    "distance",
    "caretaking",
    "family",
  ];
  return conflicts[hashSeed(`${seed}-${candidate.rival.id}-inner-conflict`) % conflicts.length];
}

function personalityReaction(candidate: RelationshipCandidate, tone: DailyTone) {
  const { name } = candidate.rival;
  const positive = ["care", "honest", "boundary"].includes(tone);
  const negative = ["avoid", "hurt"].includes(tone);
  const reactions: Record<PersonalityKey, string> = {
    reserved: positive
      ? `${name}没有立刻回应，却在之后用一个很具体的行动把答案补了回来。`
      : negative
        ? `${name}没有争辩，只把原本愿意交给你的那部分悄悄收了回去。`
        : `${name}接受了这份不需要当场表态的分寸。`,
    warm: positive
      ? `${name}明显放松下来，也第一次让照顾不再只是自己单方面承担。`
      : negative
        ? `${name}仍试图替你找理由，笑容却比平时更像一种维持。`
        : `${name}很快接住了气氛，也留意着你是否真的自在。`,
    competitive: positive
      ? `${name}嘴上仍不肯把话说软，却把这次回应视为一种平等和可靠。`
      : negative
        ? `${name}把受伤迅速改写成胜负，下一次见面明显更锋利。`
        : `${name}习惯把在意藏进下一次较量，关系也因此带上一点灼热。`,
    playful: positive
      ? `${name}先用玩笑掩过去，过了一会儿才很轻地说了一句认真的谢谢。`
      : negative
        ? `${name}仍然笑着，真正想说的话却没有再从玩笑后面出现。`
        : `${name}把尴尬变成了只有你们听得懂的梗，让这件事留下另一种记忆。`,
    curious: positive
      ? `${name}没有把回应当作结论，而是更认真地理解你为什么会这样选择。`
      : negative
        ? `${name}追问到一半停了下来；敷衍让TA第一次失去继续理解的兴趣。`
        : `${name}从细节里提出了新的问题，你们因此比原计划多聊了很久。`,
  };
  return reactions[candidate.personalityKey];
}

function conflictReaction(conflict: RelationshipInnerConflict, tone: DailyTone) {
  if (conflict === "abandonment") {
    if (tone === "avoid" || tone === "hurt") return "这次撤退碰到了TA最不愿承认的恐惧：重要的人总会在没有解释时离开。";
    if (tone === "honest" || tone === "care") return "明确而稳定的回应，比任何夸张承诺都更能缓解TA对失去关系的警惕。";
  }
  if (conflict === "burden") {
    if (tone === "care") return "TA起初想拒绝，担心自己的需要会拖累你；你留下选择余地后，照顾才没有变成亏欠。";
    if (tone === "hurt") return "这句话让TA更加确信，表达需要只会给别人增加负担。";
  }
  if (conflict === "achievement") {
    if (tone === "practical" || tone === "honest") return "当关系不再只评价成绩，TA紧绷的自我证明短暂松开了一点。";
    if (tone === "hurt") return "TA把这次伤害迅速记进了胜负表，仿佛只要下次赢回来就能不再难过。";
  }
  if (conflict === "distance") {
    if (tone === "boundary") return "被允许拥有个人空间以后，TA反而更愿意主动回来。";
    if (tone === "care") return "TA接受关心，却也认真确认这不会变成随时汇报的义务。";
  }
  if (conflict === "caretaking") {
    if (tone === "care" || tone === "honest") return "习惯照顾所有人的TA第一次没有立刻说自己没事。";
    if (tone === "avoid") return "TA很快恢复了那个可靠的样子，只是再次确认自己的疲惫应该独自处理。";
  }
  if (conflict === "family") {
    if (tone === "boundary" || tone === "care") return "你没有把反抗家庭说成轻松的浪漫，这份克制让TA更敢谈论真实处境。";
    if (tone === "hurt") return "对家庭压力的轻视，让TA觉得最难解释的部分依旧只能留在家门以内。";
  }
  return "";
}

const personalityFavoredKeys: Record<PersonalityKey, Set<string>> = {
  reserved: new Set(["saved-seat", "borrowed-pen", "margin-message", "late-message", "library-silence", "exam-voice", "secret-breakfast", "family-call", "mock-silence", "notes-exchange"]),
  warm: new Set(["canteen-run", "cold-medicine", "drink-order", "birthday", "separate-training", "sick-day", "cheap-date", "night-food", "forgotten-birthday", "different-road"]),
  competitive: new Set(["wrong-key", "training-seat", "punishment", "jealous-ranking", "exam-voice", "ranking-gap", "study-boundary", "day-off", "coach-defense", "emergency-kit"]),
  playful: new Set(["shared-earphone", "bus-stop", "bus-sleep", "photo-frame", "small-festival", "coffee-cup", "lecture-chat", "cheap-date", "shared-photo-distance", "training-roommate"]),
  curious: new Set(["wrong-key", "bus-stop", "margin-message", "library-silence", "separate-training", "study-boundary", "national-reunion", "notes-exchange", "mock-silence", "different-road"]),
};

const templates: DailyTemplate[] = [
  // 普通队友：先让关系从“共同上课”长出具体的生活记忆。
  {
    key: "saved-seat",
    stage: "neutral",
    title: (name) => `${name}用一本厚教材替你占了座。`,
    body: (name) => [
      "你到竞赛教室时只剩最后几分钟。靠窗的位置放着一本横过来的动物学，旁边还压着一张写有你名字的草稿纸。",
      `${name}没有解释为什么记得你喜欢坐这里，只把插线板往两张桌子中间推了推。`,
    ],
    choices: (name) => [
      { tone: "care", title: "坐下后替TA也接一杯水", result: `${name}接过杯子，像是这次互相照顾本来就不需要道谢。`, effects: { peerFavor: 0.8, san: 0.4 } },
      { tone: "light", title: "说这本书的占座面积已经违规", result: `你们认真计算了一会儿教材投影面积，直到教练进门才同时闭嘴。`, effects: { peerFavor: 0.6, san: 0.8 } },
      { tone: "practical", title: "道谢，然后立刻开始今天的任务", result: `${name}点点头。你们没有多聊，却在整晚都替对方留着插座。`, effects: { reasoning: 0.1 } },
    ],
  },
  {
    key: "canteen-run",
    stage: "neutral",
    title: (name) => `晚饭只剩二十分钟，${name}问你要不要一起跑去食堂。`,
    body: (name) => [
      "下一节训练不会因为食堂排队而推迟。很多人已经默认用面包解决晚饭，仿佛吞咽也是可以从日程里删除的步骤。",
      `${name}站在门口等着，没有催你，只把“回来路上可以对一道题”说成了一个并不高明的借口。`,
    ],
    choices: () => [
      { tone: "care", title: "一起去，二十分钟也应该认真吃饭", result: "你们端着餐盘在最后五分钟坐下。题没有讨论，胃终于先被当作身体的一部分。", effects: { san: 1, pocketMoney: -8 } },
      { tone: "practical", title: "帮彼此带饭，轮流节省时间", result: "从这天起，你们偶尔替对方记住食堂窗口和忌口。关系被许多不起眼的小事固定下来。", effects: { peerFavor: 0.8, san: 0.4, pocketMoney: -8 } },
      { tone: "avoid", title: "留下来继续看书", result: "门很快关上。你多看了几页，却在晚上九点开始无法集中注意。", effects: { san: -0.8, reasoning: 0.1 } },
    ],
  },
  {
    key: "borrowed-pen",
    stage: "neutral",
    title: (name) => `小测开始前，${name}把唯一一支顺手的笔递给你。`,
    body: (name) => [
      "你的笔偏偏在涂第一道答题卡时断墨。监考老师还在读规则，桌边悄悄滚来一支贴着姓名标签的黑笔。",
      `${name}自己换了一支明显不太好写的备用笔，始终没有往你这边看。`,
    ],
    choices: (name) => [
      { tone: "care", title: "考完立刻买一支新的还给TA", result: `${name}说原来的还能用，却把新笔认真收进了笔袋。`, effects: { pocketMoney: -6, peerFavor: 0.8 } },
      { tone: "honest", title: "在笔帽上贴一张很小的感谢便签", result: "便签第二天不见了，笔却又被放到两张桌子的中间。", effects: { peerFavor: 1, mindset: 0.2 } },
      { tone: "light", title: "宣布这支笔已经见证过命运", result: `${name}让你少演一点，嘴角却一直没有完全压下去。`, effects: { san: 0.8 } },
    ],
  },
  {
    key: "wrong-key",
    stage: "neutral",
    title: (name) => `${name}发现你们为同一道错题争了半小时，答案却印错了。`,
    body: (name) => [
      "你们分别写满一页推导，甚至开始怀疑对方是不是漏看了题干。直到翻到勘误表，那个字母安静地证明所有争论都建立在错误答案上。",
      "尴尬只停留了几秒。真正的问题变成：要不要承认刚才说过的那些重话。",
    ],
    choices: () => [
      { tone: "honest", title: "先为自己的语气道歉", result: "对方也承认自己把求证变成了胜负。那页推导被留下，作为你们第一次认真和解的证据。", effects: { peerFavor: 0.8, mindset: 0.3 } },
      { tone: "light", title: "共同把题目钉上“烂题墙”", result: "墙上从此多了一道署着两个人名字的坏题。以后争论太凶时，你们会先去检查勘误。", effects: { san: 1, reasoning: 0.15 } },
      { tone: "hurt", title: "坚持刚才仍然是对方推理不严谨", result: "话在答案失效后显得格外多余。下一次讨论时，对方明显少说了几步。", effects: { peerFavor: -1, mindset: -0.2 } },
    ],
  },
  {
    key: "shared-earphone",
    stage: "neutral",
    title: (name) => `投影没有声音，${name}递来一边耳机。`,
    body: (name) => [
      "教练临时安排了一段课程，却忘了教室音响早已坏掉。你们只好在同一台电脑前保持一个并不自然的距离。",
      "耳机线很短，每次有人低头记笔记，另一个人都会被轻轻拽一下。",
    ],
    choices: () => [
      { tone: "care", title: "把电脑挪到两个人都舒服的位置", result: "你们终于不用小心维持距离，课程结束时却都没有立刻摘下耳机。", effects: { peerFavor: 0.7, san: 0.4 } },
      { tone: "practical", title: "打开字幕，各看各的笔记", result: "尴尬被字幕解决。你们课后交换了各自漏掉的部分。", effects: { reasoning: 0.15 } },
      { tone: "avoid", title: "说自己回宿舍再看", result: "你离开了那张桌子，也错过了课后自然发生的十分钟聊天。", effects: { san: 0.3 } },
    ],
  },
  {
    key: "bus-stop",
    stage: "neutral",
    title: (name) => `晚训结束，公交迟迟不来，站台只剩你和${name}。`,
    body: (name) => [
      "你们在教室里总有题目可以说，离开那幢楼以后，沉默却忽然变得明显。城市的灯从湿漉漉的路面反射回来。",
      `${name}问你最初为什么会选择生物。这个问题比任何模块的目录都更难回答。`,
    ],
    choices: () => [
      { tone: "honest", title: "把那个并不漂亮的真实理由说出来", result: "你的理由里有偶然、期待和一点不愿承认的虚荣。对方听完，也交换了自己的版本。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "light", title: "说是因为别的竞赛都没抢到自己", result: "笑声让站台不再那么冷。公交到来时，你们已经聊到各自最讨厌的教材插图。", effects: { san: 1 } },
      { tone: "avoid", title: "说以后再讲", result: "车很快来了。那个“以后”没有日期，却第一次存在于两个人之间。", effects: { peerFavor: 0.2 } },
    ],
  },
  {
    key: "cold-medicine",
    stage: "neutral",
    title: (name) => `${name}把一板感冒药和热水放到你桌上。`,
    body: (name) => [
      "你说自己只是嗓子有点哑，还能继续训练。对方没有争论，只把说明书展开，指给你看服药间隔。",
      "竞赛教室里的人很容易互相监督进度，却很少有人监督另一个人是不是还在正常生活。",
    ],
    when: (ctx) => ctx.san <= 62,
    choices: () => [
      { tone: "care", title: "接受，并答应今晚早点回去", result: "药没有立刻治好疲惫，但这份照顾让你停止把硬撑当作唯一选择。", effects: { san: 1.5, mindset: 0.3 } },
      { tone: "honest", title: "承认最近确实睡得太少", result: "你们一起删掉了今晚计划表里最后一项。说出限度以后，失败感反而减轻了一些。", effects: { san: 1, peerFavor: 0.7 } },
      { tone: "avoid", title: "把药收下，仍然学到关门", result: "药留在抽屉里。第二天对方没说什么，只把你桌上的新任务划掉了一项。", effects: { san: -0.8, peerFavor: -0.2 } },
    ],
  },
  {
    key: "training-seat",
    stage: "neutral",
    title: (name) => `外培大巴上，${name}问旁边的位置有没有人。`,
    body: (name) => [
      "窗外还是清晨，车里已经有人戴上耳机看讲义。接下来一周，你们会被课程、模考和陌生宿舍切成新的生活节奏。",
      `${name}背着包站在过道，像只是随口一问，又像提前想过这个位置。`,
    ],
    when: (ctx) => ctx.isTraining,
    choices: () => [
      { tone: "care", title: "把里面的位置让出来，一路交换歌单", result: "到达培训点时，你们没有多学一页，却第一次知道彼此在竞赛之外听什么。", effects: { san: 1, peerFavor: 0.8 } },
      { tone: "practical", title: "一起核对这一周的课程安排", result: "你们把容易冲突的任务提前标了出来，也约好模考后一起复盘。", effects: { reasoning: 0.15, peerFavor: 0.4 } },
      { tone: "avoid", title: "说自己想在车上补觉", result: "对方坐去了后排。你确实睡了一路，醒来时却下意识寻找了一次那个座位。", effects: { san: 1.2 } },
    ],
  },

  // 暧昧期：不急着告白，让不确定性本身拥有生活纹理。
  {
    key: "drink-order",
    stage: "crush",
    title: (name) => `${name}从小卖部回来，递给你一杯没有问过口味的饮料。`,
    body: (name) => [
      "甜度、温度，甚至你总会先撕掉哪一侧的吸管包装都没有错。你想不起自己什么时候明确说过。",
      "真正让人慌乱的不是饮料，而是有人在许多普通日子里一直留意。",
    ],
    choices: (name) => [
      { tone: "care", title: "问TA是不是一直记得", result: `${name}避开视线，只说“买多了”。但柜台小票上分明只有两杯。`, effects: { peerFavor: 1, san: 0.8, pocketMoney: -1 } },
      { tone: "light", title: "故意猜错TA喜欢的口味作为反击", result: "对方当场纠正。第二天你真的买对了，像完成一次没有被布置的作业。", effects: { peerFavor: 0.8, san: 1 } },
      { tone: "honest", title: "小声说自己很高兴", result: "一句简单的话让两个人同时安静下来。那杯饮料喝得比平时慢很多。", effects: { peerFavor: 1.2, mindset: 0.2 } },
    ],
  },
  {
    key: "margin-message",
    stage: "crush",
    title: (name) => `你在教材页边发现了${name}留下的一句无关批注。`,
    body: (name) => [
      "那一页讲的是信号转导，页边却写着：“今天别忘了吃晚饭。”字迹很轻，像写的人随时准备否认。",
      "你盯着那句话的时间已经超过正文，开始怀疑自己的注意力究竟出了什么问题。",
    ],
    choices: () => [
      { tone: "care", title: "在下面补一句“你也一样”", result: "书第二次回到你手里时，后面多了一个很小的句号。", effects: { peerFavor: 1, san: 0.6 } },
      { tone: "light", title: "批注：与本章知识点相关性不足", result: "对方用红笔回复：但与实验对象存活率显著相关。", effects: { san: 1.2, reasoning: 0.05 } },
      { tone: "avoid", title: "装作没有看到", result: "那句话仍留在页边。你翻过好几页，注意力却总会绕回来。", effects: { mindset: -0.2 } },
    ],
  },
  {
    key: "late-message",
    stage: "crush",
    title: (name) => `零点以后，${name}发来一句：“睡了吗？”`,
    body: (name) => [
      "紧接着的第二条消息是一张题目截图，像是给第一句话补上的合理解释。可那道题并没有紧急到必须现在讨论。",
      "手机屏幕在黑暗里亮着。你知道继续聊会损失睡眠，也知道自己已经完全清醒。",
    ],
    choices: () => [
      { tone: "honest", title: "回复：没睡，但我们不一定非要聊题", result: "对话从一道题慢慢偏到今天发生的小事，最后以互相催促睡觉结束。", effects: { san: -0.6, peerFavor: 1.2 } },
      { tone: "boundary", title: "约好明早一起看，现在先睡", result: "对方发来一个晚安。第二天清晨，那道题真的在桌上等你。", effects: { san: 1, peerFavor: 0.8 } },
      { tone: "avoid", title: "假装已经睡着", result: "第二天你仍然看见了那张截图，只是再也无法确认第一句话原本想通向哪里。", effects: { san: 0.4, peerFavor: -0.3 } },
    ],
  },
  {
    key: "bus-sleep",
    stage: "crush",
    title: (name) => `返程大巴颠了一下，睡着的${name}靠到你肩上。`,
    body: (name) => [
      "车内很暗，前排还在小声讨论模考。你的肩膀很快发酸，却不敢确认对方到底睡得有多沉。",
      "这件事甚至称不上剧情。正因为如此，你才更清楚自己正在怎样在意。",
    ],
    when: (ctx) => ctx.isTraining,
    choices: () => [
      { tone: "care", title: "保持不动，让TA睡到服务区", result: "醒来后对方明显愣了一下，只低声说谢谢。之后一路都没有再看你的肩膀。", effects: { san: 0.8, peerFavor: 1 } },
      { tone: "light", title: "轻轻叫醒，笑TA错过了窗外景色", result: "尴尬被一句玩笑接住。对方换了姿势，却把耳机分给了你一边。", effects: { san: 1, peerFavor: 0.7 } },
      { tone: "avoid", title: "悄悄往窗边挪开", result: "对方没有醒。你保住了距离，也在之后莫名想起那半分钟。", effects: { mindset: -0.1 } },
    ],
  },
  {
    key: "birthday",
    stage: "crush",
    title: (name) => `${name}似乎从来没告诉过你生日。`,
    body: (name) => [
      "你从队内登记表角落看见日期，正好是下周。竞赛队不会为每个人停下训练，公开庆祝又可能让一件私事变得过分醒目。",
      "你必须决定自己究竟想表达什么，以及是否允许对方拒绝被特别对待。",
    ],
    choices: () => [
      { tone: "care", title: "送一份很小、与竞赛无关的礼物", result: "对方拆开后没有立即说话。那件东西后来一直出现在书桌上，却从未被拿来炫耀。", effects: { pocketMoney: -28, peerFavor: 1.3, san: 0.5 } },
      { tone: "light", title: "在错题本最后画一只很丑的生日动物", result: "画被拍进了手机。你要求删除，对方回答这属于珍贵实验数据。", effects: { san: 1.3, peerFavor: 0.9 } },
      { tone: "boundary", title: "只在当天私下说一句生日快乐", result: "没有礼物，也没有围观。对方说这正是自己最舒服的方式。", effects: { peerFavor: 1, mindset: 0.3 } },
    ],
  },
  {
    key: "jealous-ranking",
    stage: "crush",
    title: (name) => `${name}和另一名队友讨论了一整晚，你比预想中更在意。`,
    body: (name) => [
      "他们只是共同解决了一道题，站得近了一点，笑得自然了一点。你很清楚这不足以构成任何指控。",
      "未被命名的关系没有资格要求忠诚，却不妨碍嫉妒真实出现。",
    ],
    choices: () => [
      { tone: "honest", title: "承认自己有一点失落，但不要求TA负责", result: "对方先是惊讶，随后认真解释了那场讨论。没有谁被审问，暧昧却第一次获得了诚实。", effects: { san: -0.3, peerFavor: 1 } },
      { tone: "practical", title: "加入讨论，把情绪带回题目本身", result: "三个人最终解出了题。你的不安没有被否认，却不再主导接下来的晚上。", effects: { reasoning: 0.15, san: 0.3 } },
      { tone: "hurt", title: "故意几天不再主动说话", result: "对方并不知道自己做错了什么。沉默没有证明在意，只制造了新的猜测。", effects: { san: -0.6, peerFavor: -1 } },
    ],
  },
  {
    key: "photo-frame",
    stage: "crush",
    title: (name) => `集体照里，你和${name}恰好站在一起。`,
    body: (name) => [
      "照片发进群后，大家只关心谁闭了眼、谁被挡住。你却把画面放大，发现两个人的肩膀之间只剩很窄的距离。",
      "保存一张集体照本来不需要理由。单独裁出其中一角却似乎需要。",
    ],
    choices: () => [
      { tone: "light", title: "把最丑的一张发给TA", result: "对方迅速回敬了一张你更糟糕的抓拍。你们各自保存了对方要求删除的证据。", effects: { san: 1, peerFavor: 0.7 } },
      { tone: "honest", title: "问TA要一张没有压缩的原图", result: "原图发来时附带一句：“我也觉得这张比较好。”你没有追问好在哪里。", effects: { peerFavor: 1, san: 0.4 } },
      { tone: "avoid", title: "关掉图片，不再多想", result: "你成功关闭了窗口，没有成功阻止自己记住那张照片。", effects: { mindset: -0.1 } },
    ],
  },
  {
    key: "library-silence",
    stage: "crush",
    title: (name) => `图书馆停电前，你和${name}已经相对坐了三个小时。`,
    body: (name) => [
      "你们没有说话，只偶尔交换草稿纸。窗外变暗时，你忽然意识到今天的安静并不让人难受。",
      "真正稀有的不是有人陪你聊天，而是有人允许你不说话。",
    ],
    choices: () => [
      { tone: "care", title: "收书后一起慢慢走回去", result: "你们把整晚没说的话留到路上，最后发现并不需要全部说完。", effects: { san: 1, peerFavor: 0.8 } },
      { tone: "honest", title: "告诉TA，今天这样很好", result: "对方点头。那句评价后来成了你们邀请彼此陪伴的暗号。", effects: { peerFavor: 1.2, mindset: 0.3 } },
      { tone: "practical", title: "在关灯前交换今天完成的清单", result: "两张清单进度不同，却都在最后写着同一句：没有白来。", effects: { reasoning: 0.1, san: 0.4 } },
    ],
  },
  {
    key: "punishment",
    stage: "crush",
    title: (name) => `因为竞赛教室没有按时锁门，你和${name}一起被留下整理资料。`,
    body: (name) => [
      "教练把一整柜混乱的讲义交给你们，语气像这是一项足以矫正生活态度的劳动。",
      "分类到一半，你们翻出许多前几届留下的涂鸦和没有署名的祝福。惩罚突然像一次考古。",
    ],
    choices: () => [
      { tone: "light", title: "偷偷给这一届也留一句话", result: "你们写下“别相信所有答案”，夹进最不可能被教练翻开的文件夹。", effects: { san: 1.2, peerFavor: 0.7 } },
      { tone: "practical", title: "认真建立新的资料索引", result: "柜子第一次真正能用。你们的名字没有出现在索引上，却一起记住了那晚。", effects: { reasoning: 0.1, coachFavor: 0.3 } },
      { tone: "honest", title: "问TA以后会不会怀念这间教室", result: "对方说可能会怀念某些人，而不是柜子。你们都没有继续追问。", effects: { peerFavor: 1.1, mindset: 0.3 } },
    ],
  },
  {
    key: "separate-training",
    stage: "crush",
    title: (name) => `这次外培名单里没有${name}。`,
    body: (name) => [
      "你们第一次连续一周不在同一张课表里。白天的信息被课程挤压，晚上又都累得不想组织完整句子。",
      "尚未确认的关系最怕距离，因为双方甚至不知道自己有没有资格要求一条消息。",
    ],
    when: (ctx) => ctx.isTraining,
    choices: () => [
      { tone: "care", title: "每天只分享一件真正想说的小事", result: "消息不长，也不要求立即回复。一周结束时，你们都没有觉得被另一份日程遗忘。", effects: { peerFavor: 1, san: 0.5 } },
      { tone: "practical", title: "约定回来后交换培训笔记", result: "关系被安放进一个明确的计划。重逢时，你们有很多页知识，也有很多没写进去的话。", effects: { reasoning: 0.15, peerFavor: 0.6 } },
      { tone: "avoid", title: "谁也不主动打扰谁", result: "这一周顺利结束，沉默却在回来后多停留了几天。", effects: { peerFavor: -0.5, san: 0.2 } },
    ],
  },
  {
    key: "exam-voice",
    stage: "crush",
    title: (name) => `联赛前夜，${name}发来一条十几秒的语音。`,
    body: (name) => [
      "内容只有准考证、身份证和早点睡，像群公告的私人版本。最后两秒没有说话，却也没有立刻松开录音键。",
      "你知道今晚不适合确认任何关系。可明天之后，许多事情可能会走向不同方向。",
    ],
    when: (ctx) => ctx.weeksToProvincial !== undefined && ctx.weeksToProvincial <= 1,
    choices: () => [
      { tone: "care", title: "也发一条语音，只说平安考完就好", result: "你们都没有许诺名次。那句“明天见”反而成为最可靠的部分。", effects: { san: 1, mindset: 0.6 } },
      { tone: "boundary", title: "回复晚安，然后关闭手机", result: "消息停在适合停下的地方。你带着未说完的话睡着，却保住了第二天的清醒。", effects: { san: 1.5, mindset: 0.4 } },
      { tone: "hurt", title: "追问TA到底想说什么", result: "压力让对话变得生硬。对方最后只说没什么，你们都带着一点不必要的失落入睡。", effects: { san: -1.5, peerFavor: -0.5 } },
    ],
  },
  {
    key: "small-festival",
    stage: "crush",
    title: (name) => `校园活动的音乐传进竞赛教室，${name}问要不要下楼看五分钟。`,
    body: (name) => [
      "你们已经错过开场，也不可能完整参加。窗外的普通高中生活听起来像另一个世界。",
      "五分钟不会改变省赛结果，却可能成为今天唯一不属于训练的片段。",
    ],
    choices: () => [
      { tone: "care", title: "一起下楼，真的只看五分钟", result: "你们站在人群最后，什么节目都没看清。回去时却都觉得那五分钟没有被浪费。", effects: { san: 1.5, peerFavor: 0.8 } },
      { tone: "light", title: "在窗边替楼下节目打分", result: "评分标准很快从艺术性滑向行为生态学。你们笑得被隔壁班敲了窗。", effects: { san: 1.2 } },
      { tone: "avoid", title: "继续学习，等以后有完整时间", result: "活动结束得很快。你做完了计划，也开始怀疑“以后”究竟还剩多少次。", effects: { reasoning: 0.1, mindset: -0.3 } },
    ],
  },
  {
    key: "coffee-cup",
    stage: "crush",
    title: (name) => `${name}喝错了你的咖啡，发现后停顿了很久。`,
    body: (name) => [
      "两个纸杯放得太近，杯盖又完全一样。真正令人尴尬的事情本来可以用一句“拿错了”解决。",
      "但你们同时想到了同一层含义，于是简单的错误忽然获得了过量的空气。",
    ],
    choices: () => [
      { tone: "light", title: "认真讨论间接接触的生物安全风险", result: "一本正经的胡说终于让两个人笑出来。杯子被换回去，话题却被记了很久。", effects: { san: 1.3, peerFavor: 0.7 } },
      { tone: "honest", title: "说自己其实不介意", result: "对方的耳朵明显红了一点。接下来十分钟，谁也没能读懂眼前那页。", effects: { peerFavor: 1.1, san: 0.6 } },
      { tone: "boundary", title: "重新买一杯，把尴尬停在这里", result: "新的杯子解决了问题，也让你们都松了一口气。边界清楚不等于拒绝靠近。", effects: { pocketMoney: -12, mindset: 0.2 } },
    ],
  },

  // 正式恋爱：甜蜜、照护、摩擦和边界都必须存在。
  {
    key: "secret-breakfast",
    stage: "dating",
    title: (name) => `${name}每天早到十分钟，后来你才发现是在等你吃早饭。`,
    body: (name) => [
      "对方从不催促，也没有把这件事叫约会。两杯豆浆放在最后一排，你们在教练来之前各自回到座位。",
      "秘密最温柔的时候只是共同拥有一小段时间，最危险的时候则是让两个人逐渐依赖不能被看见。",
    ],
    choices: () => [
      { tone: "care", title: "轮流带早饭，不让照顾只由一个人承担", result: "等待变成双向的习惯。即使某天没有见面，也不会有人把它解释成感情下降。", effects: { san: 1, pocketMoney: -8, peerFavor: 0.8 } },
      { tone: "boundary", title: "约定忙的时候可以取消，不需要补偿", result: "你们第一次主动为亲密设置出口。关系因此没有变淡，反而少了许多猜测。", effects: { mindset: 0.4, peerFavor: 0.6 } },
      { tone: "avoid", title: "默认对方继续准备", result: "早饭仍然每天出现，照顾却逐渐像一项无人讨论的义务。", effects: { san: 0.4, peerFavor: -0.4 } },
    ],
  },
  {
    key: "cheap-date",
    stage: "dating",
    title: (name) => `你和${name}的约会预算只够两串关东煮。`,
    body: (name) => [
      "零花钱在培训和咖啡之间消失得很快。你担心坦白会显得扫兴，也担心为了维持某种恋爱样板继续花掉没有的钱。",
      "真正的问题不是去哪，而是两个人能否在不体面的地方仍然感到平等。",
    ],
    when: (ctx) => ctx.pocketMoney <= 45,
    choices: () => [
      { tone: "honest", title: "把预算直接说清楚", result: "对方没有替你付全部，也没有取消见面。你们买了两串关东煮，在操场坐到灯熄。", effects: { san: 1.3, pocketMoney: -10, peerFavor: 1 } },
      { tone: "light", title: "举办一次十元以内约会挑战", result: "你们为了找到最便宜的快乐绕了半个校园，最后奖品是一张很丑的合照。", effects: { san: 1.5, pocketMoney: -10 } },
      { tone: "hurt", title: "假装临时有事，取消见面", result: "对方接受了理由。真正让关系变远的不是没钱，而是你没有允许TA知道真实处境。", effects: { san: -0.5, peerFavor: -0.8 } },
    ],
  },
  {
    key: "lecture-chat",
    stage: "dating",
    title: (name) => `机构讲师还在翻幻灯片，${name}从后排发来一条消息。`,
    body: (name) => [
      "消息只是吐槽一道明显有问题的例题，却附带了一个只有你们才懂的称呼。你差点在安静的教室里笑出声。",
      "手机能让枯燥培训变得可忍受，也能让两个人一起错过真正重要的内容。",
    ],
    when: (ctx) => ctx.isTraining,
    choices: () => [
      { tone: "light", title: "只回一个表情，等下课再聊", result: "你保住了笑意，也保住了这页笔记。下课后，吐槽被完整延长了二十分钟。", effects: { san: 0.8, reasoning: 0.05 } },
      { tone: "boundary", title: "提醒TA先听课，晚上再统一骂题", result: "对方回了一个敬礼。晚上你们真的从命题逻辑骂到了证据标准。", effects: { reasoning: 0.15, peerFavor: 0.5 } },
      { tone: "hurt", title: "一直聊到讲师点名", result: "短暂的快乐以两个人一起被警告结束。教练后来也听说了这件事。", effects: { san: 0.8, coachFavor: -1, reasoning: -0.1 } },
    ],
  },
  {
    key: "confiscated-phone",
    stage: "dating",
    title: (name) => `教练收走了${name}的手机，屏幕上正停着你们的聊天。`,
    body: (name) => [
      "教练没有当场念出内容，只意味深长地看了你一眼。消息本身并不过界，却足够暴露两个人远超普通队友的熟悉。",
      "恋情被发现的风险忽然从想象变成一台被放在办公桌上的手机。",
    ],
    minWeek: 30,
    choices: () => [
      { tone: "honest", title: "课后共同承担，不让TA一个人解释", result: "教练并不理解你们，却无法把责任全部压在一个人身上。离开办公室时，你们都很狼狈，也更确定彼此会站在哪里。", effects: { san: -1.5, coachFavor: -1, peerFavor: 1 } },
      { tone: "practical", title: "先整理聊天内容和训练完成情况", result: "你们用事实证明关系没有吞掉全部学习，却也看见某些晚上确实聊得太久。", effects: { reasoning: 0.1, mindset: 0.3 } },
      { tone: "hurt", title: "对教练说都是TA主动联系", result: "手机最后被归还，某种信任却没有一起回来。", effects: { peerFavor: -2, san: -1 } },
    ],
  },
  {
    key: "anniversary",
    stage: "dating",
    title: (name) => `${name}记得你们确认关系的日期，你却忘了。`,
    body: (name) => [
      "那天正好夹在两场模考之间。你并不是不在意，只是日期在计划表里被写成了另一种形式。",
      "对方说没关系，说得太快。你必须决定是补偿、解释，还是先理解TA为什么失落。",
    ],
    minWeek: 36,
    choices: () => [
      { tone: "honest", title: "不找借口，先承认自己忘记了", result: "道歉没有立刻换来笑容，却停止了对方继续假装不在意。你们把纪念方式重新商量了一次。", effects: { san: -0.5, peerFavor: 0.8 } },
      { tone: "care", title: "补一段不昂贵但专门留下的时间", result: "你们没有重演那一天，只在操场坐了半小时。被记住最终不等于收到礼物。", effects: { san: 1, pocketMoney: -8, peerFavor: 0.7 } },
      { tone: "hurt", title: "反问备赛期间为什么要计较日期", result: "问题从忘记纪念日变成了谁有资格需要被在意。沉默持续到第二天。", effects: { san: -1, peerFavor: -1.3 } },
    ],
  },
  {
    key: "sick-day",
    stage: "dating",
    title: (name) => `${name}发烧了，却还在问今天布置了什么。`,
    body: (name) => [
      "对方把体温计照片发来，又紧接着问课程进度，像只要保持学习就能否认身体已经停下。",
      "照顾不等于替TA决定，但你也不能把明显的耗竭包装成尊重选择。",
    ],
    choices: () => [
      { tone: "care", title: "整理最必要的内容，送药后让TA休息", result: "你只留下三行重点，没有留下整晚陪聊的压力。第二天对方退烧，先问你有没有按时睡觉。", effects: { pocketMoney: -15, san: -0.5, peerFavor: 1.2 } },
      { tone: "boundary", title: "联系宿管或家长，不独自承担照护", result: "对方起初觉得你小题大做，真正烧到更高时却庆幸有人已经知道。", effects: { mindset: 0.5, peerFavor: 0.7 } },
      { tone: "hurt", title: "把整套笔记和作业全部发过去", result: "你以为这叫不让TA落后，对方却在病中继续熬夜。关心被焦虑改写成了另一种压力。", effects: { san: -1, peerFavor: -0.8 } },
    ],
  },
  {
    key: "ranking-gap",
    stage: "dating",
    title: (name) => `这次模考，你和${name}之间隔了四十多个名次。`,
    body: (name) => [
      "成绩好的人不敢太高兴，成绩差的人又不愿让恋爱变成安慰奖。你们都试图表现得和平时一样，于是每一句普通的话都显得刻意。",
      "亲密无法消除竞争。它只能让人选择是否把嫉妒、羞耻和喜悦带到可以被讨论的地方。",
    ],
    choices: () => [
      { tone: "honest", title: "分别说出羡慕、骄傲和不甘心", result: "情绪并不体面，却因为被承认而没有继续变形。你们最后只共同复盘了一道最值得的题。", effects: { san: -0.3, peerFavor: 1, mindset: 0.4 } },
      { tone: "boundary", title: "今天不互相讲题，各自处理成绩", result: "距离不是惩罚，而是边界。第二天再见时，两个人已经能更平静地讨论差距。", effects: { san: 0.8, mindset: 0.3 } },
      { tone: "hurt", title: "用玩笑反复强调谁考得更高", result: "笑话每说一次都更像真实的比较。对方最后没有生气，只是不再展示错题。", effects: { peerFavor: -1.2, san: -0.5 } },
    ],
  },
  {
    key: "study-boundary",
    stage: "dating",
    title: (name) => `${name}说，你们最近每次见面都只剩互相监督。`,
    body: (name) => [
      "几点睡、做几套卷、为什么没有回复。关心逐渐变成一张更私人的考勤表。两个人都在付出，却都越来越累。",
      "恋人可以帮助学习，但不应该成为另一个教练。",
    ],
    choices: () => [
      { tone: "boundary", title: "取消互相查进度，只保留自愿求助", result: "失去监督的第一周有些不安，随后你们发现信任比持续汇报更能让关系呼吸。", effects: { san: 1, mindset: 0.5, peerFavor: 0.8 } },
      { tone: "honest", title: "承认自己把焦虑转移给了TA", result: "对方也承认曾经用你的进度缓解自己的恐惧。问题没有立即消失，却终于有了正确名字。", effects: { san: 0.4, peerFavor: 1 } },
      { tone: "hurt", title: "坚持互相监督才说明认真", result: "关系继续高效运转，像一台没有任何人愿意靠近的机器。", effects: { reasoning: 0.1, peerFavor: -1, san: -0.8 } },
    ],
  },
  {
    key: "family-call",
    stage: "dating",
    title: (name) => `假期晚上，${name}在电话里突然压低声音。`,
    body: (name) => [
      "门外有人询问在和谁聊天。对方很快把话题切回题目，却在挂断前说家里最近开始检查手机。",
      "你无法代替TA面对家庭，也不能把“为爱反抗”说成没有代价的漂亮台词。",
    ],
    minWeek: 38,
    choices: () => [
      { tone: "boundary", title: "约定安全的联系方式与暂停信号", result: "你们不再要求随时回复，也不把突然失联理解成背叛。秘密仍有压力，却少了一些失控。", effects: { mindset: 0.5, peerFavor: 0.8 } },
      { tone: "care", title: "告诉TA不必为了证明感情冒险", result: "这句话没有制造英雄情节，却让对方第一次相信退一步也不会失去你。", effects: { san: 0.8, peerFavor: 1 } },
      { tone: "hurt", title: "抱怨TA总在家长面前退缩", result: "你把自己无法承受的焦虑压回了对方身上。电话结束后，屏幕很久没有再亮。", effects: { san: -1.2, peerFavor: -1.5 } },
    ],
  },
  {
    key: "training-lobby",
    stage: "dating",
    title: (name) => `外培熄灯后，你和${name}只剩酒店大堂能见面。`,
    body: (name) => [
      "摄像头、带队老师和第二天七点的早课共同规定了这次见面的长度。你们隔着一张过大的桌子，小声分享今天最荒谬的一道题。",
      "偷来的时间很珍贵，也因此容易让人忘记明天仍然需要清醒。",
    ],
    when: (ctx) => ctx.isTraining,
    choices: () => [
      { tone: "boundary", title: "聊二十分钟，设闹钟准时回房", result: "闹钟响时谁都舍不得，却还是一起站起来。第二天你们都没有在课上睡着。", effects: { san: 1, peerFavor: 0.8 } },
      { tone: "care", title: "只交换今天最想记住的一件事", result: "短短几句话让漫长培训重新有了人的尺度。告别时，不需要靠熬夜证明见面值得。", effects: { san: 1.2, mindset: 0.3 } },
      { tone: "hurt", title: "一直聊到带队老师下来找人", result: "见面被迫结束，第二天的课程也变得模糊。共同违规很刺激，却给彼此留下了额外压力。", effects: { san: -1, coachFavor: -1.2, peerFavor: -0.4 } },
    ],
  },
  {
    key: "day-off",
    stage: "dating",
    title: (name) => `难得的空白下午，${name}问：“约会，还是把那套卷做完？”`,
    body: (name) => [
      "两个选择都不是错误。真正麻烦的是，你们已经习惯把每一次休息都解释成对未来的背叛。",
      "也许成熟不是永远选学习，而是能共同承担任何一个选择的真实代价。",
    ],
    choices: () => [
      { tone: "care", title: "出去走一小时，回来各自完成一半", result: "下午没有被任何一方完全占有。你们既得到一段生活，也没有把剩余任务推给深夜。", effects: { san: 1.5, mindset: 0.4, pocketMoney: -16 } },
      { tone: "practical", title: "先做卷，晚上一起吃饭", result: "约会被写进计划，而不是被无限推迟。完成最后一道题时，你们都知道今天还有下一部分。", effects: { reasoning: 0.15, san: 0.5, pocketMoney: -12 } },
      { tone: "hurt", title: "让TA决定，结果不好就怪TA", result: "选择看似交给了对方，责任却也被一起推了过去。无论下午做什么，都变得不再轻松。", effects: { peerFavor: -1.2, mindset: -0.4 } },
    ],
  },
  {
    key: "national-reunion",
    stage: "dating",
    title: (name) => `全国赛住地大厅里，${name}从另一支队伍的人群后看见你。`,
    body: (name) => [
      "不同省份的队服、教练和行程把你们隔开。直到这一刻，你才意识到两个人已经从同一间教室走到了真正意义上的全国赛场。",
      "明天以后可能是不同奖牌、不同城市，甚至完全不同的道路。今晚却只够说几句话。",
    ],
    when: (ctx) => ctx.hasNationalAttempt,
    choices: () => [
      { tone: "care", title: "不讨论名次，只交换一路带来的小东西", result: "礼物都不贵，却各自携带着对方错过的那段旅程。离开大厅时，你们没有许诺相同结果。", effects: { san: 1.5, peerFavor: 1 } },
      { tone: "honest", title: "谈清楚赛后可能去往不同地方", result: "这不是浪漫的谈话，却让未来第一次不再靠回避维持。你们决定等结果出来后继续商量。", effects: { mindset: 0.6, san: -0.3 } },
      { tone: "avoid", title: "只说加油，等颁奖后再谈", result: "人群很快重新合拢。你们都理解这个选择，也都知道有些话又被交给了未知结果。", effects: { san: 0.4 } },
    ],
  },
  {
    key: "shared-photo-distance",
    stage: "dating",
    title: (name) => `队伍合照时，老师刻意把你和${name}安排到两端。`,
    body: (name) => [
      "没有人直接说明原因。快门按下时，所有人都在笑，只有你们知道这张照片里存在一段被人为拉开的距离。",
      "关系是否公开不该由一张照片决定，但被控制的感觉仍然真实。",
    ],
    minWeek: 42,
    choices: () => [
      { tone: "light", title: "拍完后再单独拍一张很普通的照片", result: "照片没有亲密动作，只是两个人自然地站在一起。它因此比集体照更像真实记忆。", effects: { san: 1, peerFavor: 0.8 } },
      { tone: "boundary", title: "接受队伍安排，不让照片承担证明关系", result: "你们没有把每一次退让都解释成背叛。离开镜头后，关系仍然属于两个人。", effects: { mindset: 0.5 } },
      { tone: "hurt", title: "当场质问老师为什么这样安排", result: "你说出了不满，也让关系成为全队注视的中心。对方并没有准备好共同承受这一刻。", effects: { san: -1.3, coachFavor: -1, peerFavor: -0.6 } },
    ],
  },

  // 挚友：不以恋爱为残缺版本，拥有独立的照看、冲突与共同记忆。
  {
    key: "night-food",
    stage: "friend",
    title: (name) => `${name}从书包里翻出两包已经压碎的饼干。`,
    body: (name) => [
      "晚训结束时食堂早已关门。饼干碎得无法保持尊严，你们只好把包装袋折成临时小碗。",
      "很多年后也许没人记得今晚学了哪一章，却会记得有人把最后一包食物分成两份。",
    ],
    choices: () => [
      { tone: "care", title: "去小卖部再买两盒牛奶", result: "这顿夜宵仍然简陋，却至少不再像惩罚。你们边吃边约定明天必须正常吃晚饭。", effects: { pocketMoney: -10, san: 1.2, peerFavor: 0.8 } },
      { tone: "light", title: "评价这属于高能量实验口粮", result: "你们用营养学术语给碎饼干写了一份荒谬说明书。疲惫暂时失去了一点权威。", effects: { san: 1.3 } },
      { tone: "honest", title: "承认最近总在错过吃饭", result: "对方没有教育你，只把明天的晚饭时间写进两个人的计划。", effects: { mindset: 0.4, peerFavor: 0.9 } },
    ],
  },
  {
    key: "notes-exchange",
    stage: "friend",
    title: (name) => `你和${name}决定交换最不愿给别人看的错题本。`,
    body: (name) => [
      "漂亮笔记可以展示能力，错题本却保存着反复误解、低级失误和最不想被别人知道的薄弱处。",
      "真正的信任不是分享最好的一面，而是相信对方不会把你的漏洞变成排名优势。",
    ],
    choices: () => [
      { tone: "honest", title: "只标出自己也犯过的错误", result: "批注没有居高临下。两本错题本最后都多了许多“我也是”。", effects: { reasoning: 0.2, peerFavor: 1 } },
      { tone: "care", title: "先约定哪些内容不拿去和别人讨论", result: "边界让交换变得安全。你们第一次能够直视彼此真正薄弱的地方。", effects: { mindset: 0.4, peerFavor: 0.9 } },
      { tone: "hurt", title: "顺手比较谁犯的低级错误更多", result: "玩笑很快变得不再好笑。对方收回本子，下一次只给你看整理后的版本。", effects: { peerFavor: -1, san: -0.3 } },
    ],
  },
  {
    key: "coach-defense",
    stage: "friend",
    title: (name) => `教练当众批评${name}“态度有问题”。`,
    body: (name) => [
      "真正的问题只是一场模考下降和一次忘带讲义。教练把它们连成对人格的判断，教室里没人接话。",
      "替朋友说话可能让压力转向自己；完全沉默也会成为对方记住的一部分。",
    ],
    choices: () => [
      { tone: "care", title: "陈述事实，说明TA最近完成了哪些任务", result: "你没有和教练正面争吵，只把被忽略的事实放回谈话。批评没有撤回，却不再是唯一叙述。", effects: { coachFavor: -0.6, peerFavor: 1.2, san: -0.5 } },
      { tone: "practical", title: "课后陪TA整理一份真实进度", result: "表格不能消除羞辱，却让下一次沟通不必只依赖情绪。", effects: { reasoning: 0.1, peerFavor: 0.8 } },
      { tone: "avoid", title: "暂时不说话，等教练离开再安慰", result: "安慰确实有用，但对方也诚实告诉你：刚才最难受的是全教室都没有声音。", effects: { peerFavor: 0.2, san: -0.4 } },
    ],
  },
  {
    key: "mock-silence",
    stage: "friend",
    title: (name) => `${name}模考失利后说：“你不用安慰我。”`,
    body: (name) => [
      "这句话可能是真的，也可能只是对方已经听够了“下次会更好”。你不知道陪伴应该是说话、分析，还是允许沉默。",
      "挚友不是自动拥有正确答案的人，只是更愿意留在无法解决的时刻。",
    ],
    choices: () => [
      { tone: "care", title: "坐在旁边，不急着说任何话", result: "很久以后，对方主动开口谈了第一道错题。沉默没有逼迫，也没有离开。", effects: { san: -0.3, peerFavor: 1.1 } },
      { tone: "honest", title: "问TA现在希望自己留下还是离开", result: "把选择权还给对方以后，你终于不用猜测怎样才算合格的朋友。", effects: { mindset: 0.4, peerFavor: 1 } },
      { tone: "hurt", title: "坚持说大家都会有考差的时候", result: "正确的话没有进入正确的时机。对方点头，却把真正的难过收了回去。", effects: { peerFavor: -0.7 } },
    ],
  },
  {
    key: "forgotten-birthday",
    stage: "friend",
    title: (name) => `全队都忘了${name}的生日，包括你。`,
    body: (name) => [
      "直到晚训后看到家里发来的蛋糕照片，你才意识到日期。对方说没关系，今天本来也没有时间庆祝。",
      "补偿不能把一天重新来过，但你仍然可以决定是否认真面对这次忽略。",
    ],
    choices: () => [
      { tone: "honest", title: "承认忘记，不用借口稀释道歉", result: "对方没有马上说没关系，只问明天能不能一起吃顿饭。真实的失望终于不必被快速跳过。", effects: { peerFavor: 0.8, san: -0.4 } },
      { tone: "care", title: "第二天补一顿简单的早餐", result: "没有惊喜布置，也没有围观。你们用二十分钟把生日从训练表里重新找了回来。", effects: { pocketMoney: -18, san: 1, peerFavor: 0.7 } },
      { tone: "hurt", title: "说竞赛生本来就不过这些", result: "你替自己的忘记发明了一条集体规则。对方笑了一下，之后不再告诉你类似日期。", effects: { peerFavor: -1.2, mindset: -0.2 } },
    ],
  },
  {
    key: "emergency-kit",
    stage: "friend",
    title: (name) => `进考场前，${name}的文具袋整个落在了酒店。`,
    body: (name) => [
      "距离入场只剩几分钟。对方站在检查口外翻遍所有口袋，平时最稳定的人第一次明显慌乱。",
      "你没有能力替TA考试，却可以决定自己愿意分出多少准备好的安全感。",
    ],
    when: (ctx) => ctx.weeksToProvincial !== undefined && ctx.weeksToProvincial <= 1,
    choices: () => [
      { tone: "care", title: "把自己的备用文具全部分一半", result: "两个人的装备都不再完美，却都足够完成考试。入场前，对方只来得及用力点一下头。", effects: { san: -0.3, peerFavor: 1.2, mindset: 0.4 } },
      { tone: "practical", title: "立刻联系带队老师并向其他队员借用", result: "慌乱被拆成几个可以执行的步骤。最后一分钟，文具袋从出租车窗口递了回来。", effects: { problemSpeed: 0.1, peerFavor: 0.8 } },
      { tone: "hurt", title: "责怪TA为什么连这种事都会忘", result: "文具最终借到了，责备却跟着对方一起进了考场。", effects: { peerFavor: -1, san: -0.6 } },
    ],
  },
  {
    key: "training-roommate",
    stage: "friend",
    title: (name) => `外培宿舍熄灯后，${name}说自己其实想家。`,
    body: (name) => [
      "白天对方仍然抢答、记笔记、评价机构题。直到看不清彼此表情时，这句与竞赛无关的话才被说出来。",
      "你不需要把想家解释成软弱，也不需要马上把气氛变得积极。",
    ],
    when: (ctx) => ctx.isTraining,
    choices: () => [
      { tone: "honest", title: "承认自己也有同样感觉", result: "黑暗让坦白变得容易一些。你们没有互相鼓励，只交换了各自最想念的一顿饭。", effects: { san: 1, peerFavor: 1 } },
      { tone: "care", title: "陪TA给家里发一条消息", result: "消息很短。收到回复后，对方终于不再反复翻身。", effects: { san: 0.8, peerFavor: 0.8 } },
      { tone: "light", title: "开始列举培训结束后要吃的东西", result: "名单越来越长，最后变成一份不可能完成的返乡食谱。你们笑着睡着了。", effects: { san: 1.3 } },
    ],
  },
  {
    key: "different-road",
    stage: "friend",
    title: (name) => `${name}认真问你：如果TA退赛，你会不会失望。`,
    body: (name) => [
      "这不是一时抱怨。对方已经比较过常规成绩、家庭意见和继续投入的代价，只是不确定离开以后是否还配得上此前的共同目标。",
      "朋友最容易犯的错误，是把自己的不舍伪装成对对方负责。",
    ],
    minWeek: 34,
    choices: () => [
      { tone: "care", title: "说会舍不得，但决定必须由TA自己作出", result: "你没有否认情绪，也没有用情绪绑住对方。无论最后是否退赛，这场谈话都保住了关系。", effects: { san: -0.5, peerFavor: 1.3, mindset: 0.5 } },
      { tone: "practical", title: "陪TA把继续与退出的真实代价列出来", result: "表格没有替对方决定，却排除了许多由恐惧制造的假前提。", effects: { reasoning: 0.1, peerFavor: 0.9 } },
      { tone: "hurt", title: "说真正的朋友就应该陪自己学到最后", result: "不舍被说成义务。对方没有当场反驳，却开始独自处理接下来的选择。", effects: { peerFavor: -1.5, mindset: -0.4 } },
    ],
  },
];

function chooseLead(ctx: RelationshipDailyContext) {
  return ctx.candidates
    .filter(({ rival }) => rival.scope === "school-peer" && !ctx.retiredRivalIds.includes(rival.id))
    .map((candidate) => ({
      candidate,
      relation: normalizeRelationship(ctx.relationships[candidate.rival.id], ctx.seed, candidate.rival.id),
    }))
    .filter(({ relation }) => ["neutral", "crush", "dating", "friend"].includes(relation.route))
    .sort((a, b) =>
      b.relation.bond + b.relation.trust * 0.6 + b.relation.romance -
      (a.relation.bond + a.relation.trust * 0.6 + a.relation.romance),
    )[0];
}

export function nextRelationshipDailyEvent(ctx: RelationshipDailyContext): GameEvent | null {
  if (ctx.week < 8) return null;
  const lead = chooseLead(ctx);
  if (!lead) return null;
  const { candidate, relation } = lead;
  const stage = relation.route as DailyStage;
  const lastDailyWeek = ctx.storyTags
    .filter((tag) => tag.startsWith("关系日常:发生周:"))
    .map((tag) => Number(tag.split(":").at(-1)))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  if (lastDailyWeek !== undefined && ctx.week - lastDailyWeek < 2) return null;
  const chance = stage === "crush" ? 72 : stage === "dating" ? 62 : stage === "friend" ? 56 : 42;
  if (hashSeed(`${ctx.seed}-${ctx.week}-${candidate.rival.id}-daily-roll`) % 100 >= chance)
    return null;
  const eligible = templates.filter((template) => {
    if (template.stage !== stage) return false;
    if ((template.minWeek ?? 0) > ctx.week) return false;
    if (template.when && !template.when(ctx, relation)) return false;
    return !ctx.resolvedEvents.includes(`bondstory-${candidate.rival.id}-daily-${template.key}`);
  });
  if (!eligible.length) return null;
  const weightedEligible = eligible.flatMap((template) =>
    personalityFavoredKeys[candidate.personalityKey].has(template.key)
      ? [template, template, template]
      : [template],
  );
  const picked = weightedEligible[
    hashSeed(`${ctx.seed}-${ctx.week}-${candidate.rival.id}-daily-pick`) % weightedEligible.length
  ];
  const { name } = candidate.rival;
  const innerConflict = innerConflictFor(candidate, ctx.seed);
  return {
    id: `bondstory-${candidate.rival.id}-daily-${picked.key}`,
    phase: ctx.isTraining ? "training" : "weekly",
    label:
      stage === "crush"
        ? "朦胧好感 · 日常"
        : stage === "dating"
          ? "恋爱日常"
          : stage === "friend"
            ? "挚友日常"
            : "人物共通线 · 日常",
    title: picked.title(name),
    body: [...picked.body(name), personalityAside(candidate)],
    concealConsequences: true,
    visualNovel: true,
    trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
    choices: picked.choices(name).map((option) => ({
      id: `rel-daily-${option.tone}-${candidate.personalityKey}-${innerConflict}-${candidate.rival.id}-${picked.key}`,
      title: option.title,
      preview: "这次回应不会立刻告诉你关系将走向哪里。",
      result: `${option.result}${personalityReaction(candidate, option.tone)}${conflictReaction(innerConflict, option.tone)}`,
      effects: {
        ...option.effects,
        tags: [
          ...(option.effects.tags ?? []),
          `关系日常:${stage}:${picked.key}`,
          `关系日常:性格:${candidate.personalityKey}`,
          `关系日常:发生周:${ctx.week}`,
        ],
      },
    })),
  };
}

export const relationshipDailyCount = templates.length;
export const relationshipDailyStageCounts = templates.reduce<Record<DailyStage, number>>(
  (counts, template) => ({ ...counts, [template.stage]: counts[template.stage] + 1 }),
  { neutral: 0, crush: 0, dating: 0, friend: 0 },
);
