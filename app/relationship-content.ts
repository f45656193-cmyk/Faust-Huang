import type { GameEvent, Rival } from "./game-data.ts";

export type PlayerGender = "male" | "female";
export type CharacterGender = "male" | "female";
export type RelationshipInnerConflict =
  | "abandonment"
  | "burden"
  | "achievement"
  | "distance"
  | "caretaking"
  | "family";
export type RelationshipRoute =
  | "neutral"
  | "friend"
  | "crush"
  | "dating"
  | "rival"
  | "strained"
  | "broken-up";

export type DeepRelationship = {
  bond: number;
  tension: number;
  romance: number;
  trust: number;
  careDebt: number;
  conflict: number;
  route: RelationshipRoute;
  lastInteractionWeek: number;
};

export type RelationshipCandidate = {
  rival: Rival;
  gender: CharacterGender;
  personalityKey: "reserved" | "warm" | "competitive" | "playful" | "curious";
  innerConflictKey?: RelationshipInnerConflict;
};

export type RelationshipStoryContext = {
  week: number;
  seed: string;
  playerGender: PlayerGender;
  candidates: RelationshipCandidate[];
  relationships: Record<string, DeepRelationship>;
  resolvedEvents: string[];
  retiredRivalIds: string[];
  storyTags: string[];
  san: number;
  coachFavor: number;
  familySupport: number;
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function defaultRelationship(seed = "", rivalId = ""): DeepRelationship {
  return {
    bond: 4 + (hashSeed(`${seed}-${rivalId}-bond`) % 8),
    tension: hashSeed(`${seed}-${rivalId}-tension`) % 5,
    romance: 0,
    trust: 2,
    careDebt: 0,
    conflict: 0,
    route: "neutral",
    lastInteractionWeek: 0,
  };
}

export function normalizeRelationship(
  value: Partial<DeepRelationship> | undefined,
  seed = "",
  rivalId = "",
): DeepRelationship {
  return { ...defaultRelationship(seed, rivalId), ...(value ?? {}) };
}

export function relationshipRouteLabel(relation: DeepRelationship) {
  if (relation.route === "dating") return relation.conflict >= 45 ? "恋人 · 关系紧张" : "恋人";
  if (relation.route === "broken-up") return "已经分手";
  if (relation.route === "friend") return relation.bond >= 62 ? "挚友" : "好友";
  if (relation.route === "rival") return "宿敌";
  if (relation.route === "strained") return "逐渐疏远";
  if (relation.route === "crush") return relation.romance >= 32 ? "朦胧心意" : "似乎有些在意";
  if (relation.tension >= 35) return "竞争升温";
  if (relation.bond >= 20) return "逐渐熟悉";
  return "普通队友";
}

function personalityLine(key: RelationshipCandidate["personalityKey"], name: string) {
  const lines = {
    reserved: `${name}很少直接评价感情，却会记住你在每一道题上犹豫过多久。`,
    warm: `${name}习惯先问你有没有吃饭，再问你今天的错题订正完没有。`,
    competitive: `${name}把关心藏在下一张榜单里，语气听起来总像在下战书。`,
    playful: `${name}总能把最沉重的话题说得像玩笑，但沉默时又比谁都认真。`,
    curious: `${name}喜欢追问那些没有标准答案的问题，也包括你为什么还在这里。`,
  };
  return lines[key];
}

function candidateFamilyPortrait(seed: string, rivalId: string) {
  const profiles = [
    { label: "高焦虑家庭", contest: "每次排名都会重新讨论是否退赛", romance: "明确反对高中恋爱" },
    { label: "结果导向家庭", contest: "成绩好时投入很多，连续失利时迅速收紧", romance: "只要成绩不掉就暂时不追问" },
    { label: "长期规划家庭", contest: "愿意讨论两年路线和退出预案", romance: "要求边界，但不把感情直接视为错误" },
    { label: "包容沟通家庭", contest: "更关心当事人是否仍愿意继续", romance: "愿意认识对方，再讨论作息与责任" },
    { label: "放任独立家庭", contest: "很少干预，却也不总能提供情绪支持", romance: "通常不过问私人关系" },
  ];
  return profiles[hashSeed(`${seed}-${rivalId}-family-profile`) % profiles.length];
}

function firstContactScene(seed: string, rivalId: string, name: string) {
  const scenes = [
    {
      key: "blackout",
      title: "停电后的手电光",
      body: `晚自习突然停电，${name}用手机照着你没画完的代谢图。你们在黑暗里把最后两个箭头争论清楚。`,
      choices: [
        ["warm", "把手机接过来，也替TA照亮草稿", "两束光在纸面上交叠。来电时，你们才发现彼此已经靠得很近。", { peerFavor: 2, reasoning: 0.4, san: 0.5 }],
        ["practical", "先拍下图，约到明早继续核对", "你们没有在黑暗里逞强。第二天，那张照片成了第一次共同完成的笔记。", { peerFavor: 1, reasoning: 0.5 }],
        ["tease", "说这算一次无氧条件下的代谢讨论", `${name}笑得手电晃了一下，最后一个箭头差点又画错。`, { peerFavor: 1.4, san: 1 }],
        ["avoid", "借口去找应急灯，提前离开", "等你回来，图已经被独自补完。右下角空着一小块，像原本准备留给另一种笔迹。", { peerFavor: -0.6 }],
      ],
    },
    {
      key: "last-supper",
      title: "食堂最后一份夜宵",
      body: `训练结束太晚，食堂只剩一份热食。${name}掰开一次性筷子，问你要不要一人一半。`,
      choices: [
        ["warm", "接受，再去买两杯热水", "夜宵被分得不算公平，你们却都把更大的一半往对面推。", { peerFavor: 2, san: 1, pocketMoney: -2 }],
        ["practical", "一人吃夜宵，一人去便利店补充", "你们用最现实的方式解决饥饿，回来时还记得替对方带一支顺手的笔。", { peerFavor: 1.2, pocketMoney: -10, san: 0.5 }],
        ["tease", "宣布按体重和今日做题量分配", "荒谬的分配公式算了五分钟，最后还是一人一半。", { peerFavor: 1.4, san: 1.2 }],
        ["avoid", "说自己不饿，让TA全部吃掉", `${name}没有勉强你。夜里你胃痛时，才看见TA发来一句“真的没事吗”。`, { san: -0.5, peerFavor: -0.3 }],
      ],
    },
    {
      key: "lab-rain",
      title: "被雨困住的实验楼",
      body: `大雨封住了回宿舍的路。${name}隔着玻璃数闪电，你们第一次没有用题目填满沉默。`,
      choices: [
        ["warm", "问TA每次数闪电时都在想什么", "话题从天气落到童年。雨停以前，你第一次听见一个不属于竞赛队的TA。", { peerFavor: 2, san: 1 }],
        ["practical", "查看雷达图，规划一条不淋湿的路线", "计划只成功了一半。跑到宿舍门口时，你们都狼狈得笑了出来。", { peerFavor: 1.2, san: 0.8 }],
        ["tease", "认真估算雷声传播距离", `${name}指出你的估算漏了回声。无用的争论让等待突然不再漫长。`, { reasoning: 0.3, peerFavor: 1.3, san: 0.8 }],
        ["avoid", "戴上耳机，一个人等雨停", "玻璃上仍不断亮起闪电。你们站得很近，却各自拥有一场完全不同的雨。", { peerFavor: -0.5 }],
      ],
    },
    {
      key: "wrong-song",
      title: "广播站点错的歌",
      body: `午休广播放了一首不合时宜的旧歌。${name}忽然说自己小时候也听过，话题从细胞周期一路偏到了家乡。`,
      choices: [
        ["warm", "分享自己记得的那段旧生活", "两段互不相干的童年第一次在午休里并排出现。铃声响起时，话还没有说完。", { peerFavor: 2, mindset: 0.4 }],
        ["practical", "把歌名记下来，晚训后再发给TA", "那晚你收到一份同样克制的歌单，标题只有日期。", { peerFavor: 1.3, san: 0.6 }],
        ["tease", "吐槽广播站的年代定位出了问题", `${name}和你争论这首歌到底算不算老，直到你们都暴露了更多年龄不符的歌单。`, { peerFavor: 1.2, san: 1 }],
        ["avoid", "说自己从不听歌，把话题拉回题目", "细胞周期重新占满桌面。刚才打开的那扇小窗没有关上，只是暂时没人再靠近。", { peerFavor: -0.4, reasoning: 0.2 }],
      ],
    },
    {
      key: "paper-argument",
      title: "走廊尽头的争论",
      body: `${name}和教练对一道题的答案争到所有人都走了。你留下来核对原论文，发现TA真正介意的是“不能把错答案教给下一届”。`,
      choices: [
        ["warm", "留下来和TA一起整理完整证据链", "你们把争执改写成一页勘误。第二天，教练没有道歉，却悄悄换掉了答案。", { peerFavor: 2, reasoning: 0.6, san: -0.4 }],
        ["practical", "先保存论文和页码，等情绪过去再谈", "证据没有在争吵里耗尽。隔天的讨论短得多，也真正解决了问题。", { peerFavor: 1.2, reasoning: 0.5 }],
        ["tease", "说TA以后一定会成为最难缠的教练", `${name}没忍住笑了，随后认真回答：“至少不会把错答案传下去。”`, { peerFavor: 1.4, san: 0.8 }],
        ["avoid", "劝TA别和教练较真，先回宿舍", "TA点头收起论文。从那以后，涉及答案争议时很少再主动看向你。", { peerFavor: -0.8, coachFavor: 0.2 }],
      ],
    },
    {
      key: "vending-machine",
      title: "体测后的自动贩卖机",
      body: `跑完八百米后，${name}靠着贩卖机喘气，还不忘问你上午那道遗传题是不是少分了一类。`,
      choices: [
        ["warm", "先替TA买水，等呼吸平稳再谈题", "水递过去时，TA终于承认自己刚才差点跑不下来。遗传题第一次排在身体后面。", { peerFavor: 1.8, san: 0.8, pocketMoney: -4 }],
        ["practical", "在瓶身上画出缺失的那一类", "一张临时遗传图随着水一起被喝皱。后来TA还把那个瓶盖留了很久。", { peerFavor: 1.2, reasoning: 0.4 }],
        ["tease", "说氧债还没还完就别挑战孟德尔", `${name}试图反驳，却因为喘气把一句话拆成了四段。`, { peerFavor: 1.3, san: 1 }],
        ["avoid", "说回教室再讲，先一个人离开", "你走出几步才听见贩卖机掉下一瓶水。那声闷响在空操场上格外清楚。", { peerFavor: -0.4 }],
      ],
    },
    {
      key: "moth",
      title: "一只飞进教室的蛾",
      body: `一只蛾绕着投影仪打转。所有人都嫌它碍事，${name}却拿纸杯把它送到窗外。你第一次注意到TA做题以外的耐心。`,
      choices: [
        ["warm", "替TA打开窗，护住纸杯边缘", "蛾在两个人的手之间停了一瞬才飞走。回座位后，谁都没有立刻翻书。", { peerFavor: 1.8, module2: 0.2, san: 0.7 }],
        ["practical", "提醒先关灯，只留窗边光源", "办法很快奏效。TA看你的眼神像在确认，你们对很多无关紧要的生命有同一种认真。", { peerFavor: 1.3, reasoning: 0.2 }],
        ["tease", "给它补记一次非计划行为观察", "你们在草稿角落写下三行不够科学的记录，最后一行是“成功逃逸”。", { peerFavor: 1.2, san: 1 }],
        ["avoid", "催TA快一点，课程还没结束", "窗户很快关上。你没有做错什么，只是后来总会想起TA当时停顿的半秒。", { peerFavor: -0.5 }],
      ],
    },
    {
      key: "wrong-jacket",
      title: "错拿的校服外套",
      body: `你们训练后拿错了外套。交换时，${name}从口袋里翻出一张写满家长电话后的情绪速记。两个人都假装没看清。`,
      choices: [
        ["warm", "只问一句：今晚需要有人一起走吗", "你没有提那张纸。TA也没有解释，只在回宿舍的路上走得比平时慢。", { peerFavor: 2, san: 0.4 }],
        ["practical", "交换外套，也把自己的口袋逐一检查清楚", "你用对等的谨慎保住了这次意外的边界。第二天，TA主动提起了电话。", { peerFavor: 1.4, mindset: 0.3 }],
        ["tease", "只吐槽你们的校服辨识度太低", "尴尬被轻轻放过。那张纸没有消失，却不必在走廊里被迫解释。", { peerFavor: 1.1, san: 0.8 }],
        ["avoid", "立刻说自己什么都没看见，然后走开", "否认说得太用力，反而证明你确实看见了。此后几天，TA把所有口袋都扣得很紧。", { peerFavor: -0.7 }],
      ],
    },
    {
      key: "ranking-board",
      title: "月考榜前的停步",
      body: `${name}在常规排名榜前停了很久，最后却问你要不要去操场走一圈。你们一路都没谈名次。`,
      choices: [
        ["warm", "陪TA走完一圈，再问要不要说说", "第一圈只有脚步声。第二圈开始时，TA终于承认家里已经在讨论退赛。", { peerFavor: 2, san: 0.6 }],
        ["practical", "约好今晚不看榜，明天再一起复盘", "一天的距离没有让问题消失，却让成绩不再决定你们今晚的全部情绪。", { peerFavor: 1.2, mindset: 0.5 }],
        ["tease", "提议给排名榜也安排一次遗忘曲线", `${name}笑着说最好忘得比常规课还快。那句笑话替真正的难过留了一个入口。`, { peerFavor: 1.3, san: 1 }],
        ["avoid", "说自己还要订正月考，不去操场", "TA一个人走了。后来你才知道，那晚操场上的问题并不是一道题。", { peerFavor: -0.8, reasoning: 0.2 }],
      ],
    },
    {
      key: "first-bus",
      title: "清晨第一班公交",
      body: `外培集合太早，车上只有你和${name}醒着。城市还没亮，TA把一只耳机递过来，什么也没解释。`,
      choices: [
        ["warm", "接过耳机，和TA听完这一首", "耳机线把两个人限制在很近的距离。歌结束后，谁都没有急着归还。", { peerFavor: 2, san: 1 }],
        ["practical", "先调低音量，约好到站互相叫醒", "你们在同一首歌里睡着，又在同一个急刹车里醒来。", { peerFavor: 1.2, san: 0.8 }],
        ["tease", "问这是不是机构培训限定叫醒服务", `${name}说不想听可以还来，手却没有真的伸回去。`, { peerFavor: 1.4, san: 1 }],
        ["avoid", "摇头，继续戴自己的耳机", "两段音乐在相邻座位里互不相干。天亮以后，这件事像从未发生。", { peerFavor: -0.5 }],
      ],
    },
  ] as const;
  return scenes[hashSeed(`${seed}-${rivalId}-first-contact`) % scenes.length];
}

function hiddenChoice(
  id: string,
  title: string,
  result: string,
  effects: GameEvent["choices"][number]["effects"],
) {
  return { id, title, preview: "你的回答会被记住。", result, effects };
}

function chooseLead(ctx: RelationshipStoryContext) {
  return ctx.candidates
    .filter(({ rival }) =>
      rival.scope === "school-peer" &&
      !ctx.retiredRivalIds.includes(rival.id),
    )
    .sort((a, b) => {
      const ra = normalizeRelationship(ctx.relationships[a.rival.id], ctx.seed, a.rival.id);
      const rb = normalizeRelationship(ctx.relationships[b.rival.id], ctx.seed, b.rival.id);
      return rb.bond + rb.trust * 0.5 + rb.romance - (ra.bond + ra.trust * 0.5 + ra.romance);
    })[0];
}

export function nextRelationshipStoryEvent(
  ctx: RelationshipStoryContext,
): GameEvent | null {
  if (ctx.week < 6) return null;
  const candidate = chooseLead(ctx);
  if (!candidate) return null;
  const { rival } = candidate;
  const relation = normalizeRelationship(ctx.relationships[rival.id], ctx.seed, rival.id);
  const seen = (chapter: string) =>
    ctx.resolvedEvents.includes(`bondstory-${rival.id}-${chapter}`);
  const base = {
    phase: "weekly" as const,
    trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
    concealConsequences: true,
    visualNovel: true,
  };

  if (relation.bond >= 10 && !seen("desk")) {
    const contact = firstContactScene(ctx.seed, rival.id, rival.name);
    return {
      ...base,
      id: `bondstory-${rival.id}-desk`,
      label: "人物共通线 · 留在桌角的笔记",
      title: contact.title,
      body: [
        contact.body,
        "这不是一场正式的关系转折，也没有任何提示告诉你该选哪句话。只是从这天起，你开始在一天结束时记得另一个人的表情。",
        personalityLine(candidate.personalityKey, rival.name),
      ],
      choices: contact.choices.map(([tone, title, result, effects]) =>
        hiddenChoice(
          `rel-${tone}-${rival.id}-${contact.key}`,
          title,
          result,
          {
            ...effects,
            tags: [
              `关系:${rival.id}:初动:${contact.key}`,
              `关系:${rival.id}:${tone === "avoid" ? "错过一次" : "认真回应"}`,
            ],
          },
        ),
      ),
    };
  }

  if (relation.bond >= 20 && relation.trust >= 8 && !seen("night")) {
    const family = candidateFamilyPortrait(ctx.seed, rival.id);
    return {
      ...base,
      id: `bondstory-${rival.id}-night`,
      label: "人物共通线 · 晚自习以后",
      title: `教学楼的灯灭了一半，${rival.name}仍坐在楼梯口。`,
      body: [
        "竞赛小测的排名刚发进群里。有人立刻开始比较分数，有人把手机反扣在桌面，假装自己没有看见。",
        `${rival.name}说家里刚刚问起这次成绩，问得很平静，却把每一句话都变成了“还值不值得继续”。`,
        `${family.label}：对竞赛，家里${family.contest}；对恋爱，家里${family.romance}。这些立场会在以后的选择里继续出现。`,
        "这不是一道需要你给出解决方案的题。你甚至不确定，对方是想听建议，还是只是不想一个人坐在这里。",
      ],
      choices: [
        hiddenChoice(`rel-listen-${rival.id}`, "坐下来，先听TA把话说完", "你们没有得出结论。保安第三次催促时，对方才站起来，小声说了一句“谢谢你没急着劝我”。", { peerFavor: 2.5, san: -0.5, tags: [`关系:${rival.id}:听见脆弱`] }),
        hiddenChoice(`rel-plan-${rival.id}`, "拿出纸，帮TA把选择逐项列出来", "你把退赛、继续、调整课程和向教练求助写成四列。纸上的字不能代替决定，却让混乱第一次有了边界。", { peerFavor: 1.5, reasoning: 0.6, san: -0.5, tags: [`关系:${rival.id}:共同计划`] }),
        hiddenChoice(`rel-share-${rival.id}`, "说起自己也曾经想过离开", "坦白让这场谈话突然变得对等。你们都没有承诺永远坚持，只答应下一次动摇时不要独自消失。", { peerFavor: 2, mindset: 0.5, san: -1, tags: [`关系:${rival.id}:交换秘密`] }),
        hiddenChoice(`rel-dismiss-${rival.id}`, "告诉TA大家都是这样，熬过去就好", `${rival.name}点了点头，像接受一道标准答案。回教室的路上，你们之间第一次出现了比沉默更明显的距离。`, { peerFavor: -1.5, mindset: -0.5, tags: [`关系:${rival.id}:敷衍`] }),
      ],
    };
  }

  if (relation.bond >= 28 && relation.trust >= 14 && relation.route === "neutral" && !seen("turn")) {
    const oppositeGender = candidate.gender !== ctx.playerGender;
    return {
      ...base,
      id: `bondstory-${rival.id}-turn`,
      label: "人物共通线 · 这段关系叫什么",
      title: `月考后的操场很空，${rival.name}忽然问起很久以后的事。`,
      body: [
        "你们已经熟悉彼此订正错题时的笔迹、喝咖啡后的语速，也知道对方什么时候是真的没事，什么时候只是不想被追问。",
        "话题从省赛绕到大学，又从大学绕回眼前。谁都没有直接谈论关系，但有些问题一旦问出来，原来的距离就很难完全恢复。",
        oppositeGender
          ? "你第一次认真意识到，这份在意也许并不只属于普通队友。"
          : "你意识到这份信任已经越过普通队友，却更接近一种不需要证明的并肩。",
      ],
      choices: [
        hiddenChoice(`relationship-friend-${rival.id}`, "约定无论谁先退赛，都继续做朋友", "你们没有说什么煽情的话，只把下一次一起吃饭写进日程。第一次，见面的理由和竞赛无关。", { peerFavor: 3, san: 1.5, tags: [`${rival.id}-好友路线`, `${rival.id}-关系定型`] }),
        ...(oppositeGender
          ? [hiddenChoice(`relationship-crush-${rival.id}`, "试着聊一些从未对队友说过的事", "谈话结束得很晚。回去以后，你发现自己记得的不是问题和答案，而是对方停顿时看向你的那一眼。", { mindset: 1, san: 0.5, tags: [`${rival.id}-朦胧好感`, `${rival.id}-关系定型`] })]
          : []),
        hiddenChoice(`relationship-rivalry-${rival.id}`, "约定下一次模考必须分出胜负", "你们把下一张榜单当作约定。竞争从模糊的不安变成了一个具体的人，也因此更锋利。", { reasoning: 0.7, san: -1, tags: [`${rival.id}-宿敌路线`, `${rival.id}-关系定型`] }),
        hiddenChoice(`rel-distance-${rival.id}`, "把话题重新带回下一周的学习计划", "你们默契地退回安全的话题。有些东西没有消失，只是被压进了计划表的背面。", { peerFavor: 0.5, tags: [`关系:${rival.id}:保持距离`] }),
      ],
    };
  }

  if (relation.route === "crush" && relation.bond >= 35 && !seen("rain")) {
    return {
      ...base,
      id: `bondstory-${rival.id}-rain`,
      label: "朦胧好感线 · 第一场雨",
      title: `雨落下来时，你和${rival.name}被留在没有关灯的竞赛教室。`,
      body: [
        "窗外的跑道很快空了。你们本来约好只讨论一道遗传题，却在停电前把话题说到了各自最害怕的结果。",
        `${rival.name}说，真正害怕的不是没有奖，而是两年之后回头看，发现自己只剩下一张排名表。`,
        "雨声盖住了走廊的脚步。你知道这会是一个被记住很久的晚上，却不知道该怎样命名。",
      ],
      choices: [
        hiddenChoice(`rel-heart-${rival.id}`, "说自己更害怕以后再也见不到TA", "话说出口后，谁都没有立刻接下去。过了很久，对方把伞向你这边偏了一点。", { peerFavor: 2, san: 1, tags: [`关系:${rival.id}:心动确认`] }),
        hiddenChoice(`rel-future-${rival.id}`, "认真谈论两个人可能选择的大学", "你们第一次把彼此写进未来的假设。它还不是承诺，却已经比玩笑更重。", { peerFavor: 1.5, reasoning: 0.3, tags: [`关系:${rival.id}:共同未来`] }),
        hiddenChoice(`rel-joke-${rival.id}`, "用一句玩笑把沉默接过去", `${rival.name}笑了，紧绷的气氛松开一些。只有你知道，那句没有说完的话仍然留在雨里。`, { san: 1.5, peerFavor: 0.5, tags: [`关系:${rival.id}:未说出口`] }),
      ],
    };
  }

  if (relation.route === "crush" && relation.romance >= 24 && relation.trust >= 20 && relation.bond >= 40 && !seen("confession")) {
    const baseChance = relation.bond * 0.45 + relation.trust * 0.7 + relation.romance * 0.8 - relation.conflict * 0.5;
    const goodTiming = ctx.week % 26 > 3 && ctx.week % 26 < 22;
    const directSuccess = baseChance + (goodTiming ? 8 : -5) + (hashSeed(`${ctx.seed}-${rival.id}-confess`) % 17) >= 58;
    return {
      ...base,
      id: `bondstory-${rival.id}-confession`,
      label: "个人线 · 没有标准答案的问题",
      title: `${rival.name}在消息里问：“你是不是有话一直没说？”`,
      body: [
        "你把输入框里的文字删了三次。明天仍有训练，下一次考试也不会因为任何人的心意推迟。",
        "可你已经明白，等待所谓最合适的时机，有时只是把决定交给时间。",
        personalityLine(candidate.personalityKey, rival.name),
      ],
      choices: [
        hiddenChoice(
          `${directSuccess ? "rel-date" : "rel-rejected"}-${rival.id}`,
          "不再绕弯，把喜欢说清楚",
          directSuccess
            ? `${rival.name}看了你很久，像在确认这不是一道需要抢答的题。最后，TA说：“那就试试。但省赛前谁都不许拿这个当逃避学习的理由。”`
            : `${rival.name}没有嘲笑，也没有装作没听懂。TA说现在承担不起另一段关系，希望你们仍能把已经建立的信任保存下来。`,
          { san: directSuccess ? 2 : -3, mindset: directSuccess ? 1 : -1, peerFavor: directSuccess ? 3 : -1, tags: [directSuccess ? `关系:${rival.id}:正式恋爱` : `关系:${rival.id}:表白失败`] },
        ),
        hiddenChoice(`rel-wait-${rival.id}`, "承认在意，但希望比赛之后再回答", "你没有得到一个确定关系，却也没有再假装毫不在意。你们约好先走完眼前这一段路。", { peerFavor: 1.5, mindset: 0.5, tags: [`关系:${rival.id}:等待赛后`] }),
        hiddenChoice(`relationship-friend-${rival.id}`, "告诉TA，自己更珍惜现在的朋友关系", "对方沉默了一会儿，然后点头。你们都知道有些可能性被轻轻放下了，但这并不意味着此前的一切失去价值。", { peerFavor: 1, san: -0.5, tags: [`${rival.id}-好友路线`, `关系:${rival.id}:主动止步`] }),
      ],
    };
  }

  if (
    relation.route === "crush" &&
    seen("confession") &&
    ctx.storyTags.includes(`关系:${rival.id}:等待赛后`) &&
    ctx.storyTags.some((tag) => tag.includes("省赛-最终名单确认")) &&
    !seen("after-exam-answer")
  ) {
    return {
      ...base,
      id: `bondstory-${rival.id}-after-exam-answer`,
      label: "朦胧好感线 · 被推迟的回答",
      title: `名单已经落定，${rival.name}重新提起那句“比赛以后”。`,
      body: [
        "你们曾把回答推迟到考试结束，仿佛省赛之后会自动出现一个更轻松、更正确的时刻。真正走到这里，喜悦、失落和下一段路线却仍然挤在一起。",
        `${rival.name}没有催促，只说：“现在不用再拿备赛当理由了。无论答案是什么，我都想听真的。”`,
        "推迟没有替你作出决定，只替这场对话保存到了今天。",
      ],
      choices: [
        hiddenChoice(`rel-date-${rival.id}`, "告诉TA，自己的答案没有改变", "没有烟花，也没有谁保证以后一定顺利。你们只把关系说清楚，并约好下一场考试、下一所学校都不能代替任何一个人作决定。", { san: 2, mindset: 1, peerFavor: 2, tags: [`关系:${rival.id}:赛后正式恋爱`] }),
        hiddenChoice(`relationship-friend-${rival.id}`, "承认在意，但选择把这段关系留作挚友", "遗憾没有立刻消失，可两个人都不必再猜。你们把没有开始的恋爱认真放下，也把已经存在的信任保留下来。", { san: -0.5, peerFavor: 1, tags: [`${rival.id}-好友路线`, `关系:${rival.id}:赛后成为挚友`] }),
        hiddenChoice(`rel-rejected-${rival.id}`, "说自己已经走向另一条路，不再继续等待", "这不是谁辜负了谁。只是被推迟的心意也会改变形状。你们道别后没有立刻删掉联系方式，却都知道旧的可能性到此为止。", { san: -2, mindset: -0.5, tags: [`关系:${rival.id}:赛后错过`] }),
      ],
    };
  }

  if (relation.route === "dating" && !seen("ordinary-date")) {
    return {
      ...base,
      id: `bondstory-${rival.id}-ordinary-date`,
      label: "恋爱线 · 没有纪念意义的一天",
      title: `你和${rival.name}第一次为了见面，而不是为了某一道题留在学校。`,
      body: [
        "你们只在小卖部买了两杯饮料，沿操场走了一圈。没有精心准备的台词，也没有突然响起的音乐。",
        "聊到一半时，对方还是拿出了手机里的错题截图。你们一起笑起来：竞赛已经渗进生活太久，连约会都很难彻底避开。",
        "但那四十分钟里，没有人问排名，也没有人要求你证明继续下去是否值得。",
      ],
      choices: [
        hiddenChoice(`rel-date-study-${rival.id}`, "顺势把错题讲完，再一起去吃东西", "题被讲明白，饮料也彻底化了冰。你们第一次发现，共同学习不一定等于互相消耗。", { san: 1.5, reasoning: 0.3, pocketMoney: -12, tags: [`关系:${rival.id}:健康约会`] }),
        hiddenChoice(`rel-date-life-${rival.id}`, "收起手机，坚持今天不谈竞赛", "一开始有些不习惯，后来话题慢慢落到音乐、家里和小时候。你们终于认识了竞赛选手之外的彼此。", { san: 2.5, mindset: 0.5, pocketMoney: -18, tags: [`关系:${rival.id}:生活记忆`] }),
        hiddenChoice(`rel-date-cheap-${rival.id}`, "坦白最近没什么零花钱，只在操场多走一圈", `${rival.name}没有介意。你们分掉一块抽屉里翻出的巧克力，反而比计划好的约会更轻松。`, { san: 1.5, peerFavor: 1, tags: [`关系:${rival.id}:坦白窘迫`] }),
      ],
    };
  }

  if (relation.route === "dating" && ctx.week >= 42 && !seen("interference")) {
    const family = candidateFamilyPortrait(ctx.seed, rival.id);
    const harsh = ctx.coachFavor < 10 || ctx.familySupport < 45 || family.romance.includes("反对");
    return {
      ...base,
      id: `bondstory-${rival.id}-interference`,
      label: "恋爱线 · 被看见的关系",
      title: harsh ? "教练把你们分别叫进办公室。" : "家长从过长的聊天记录里察觉了什么。",
      body: [
        "谈话没有使用“喜欢”这个词。成年人更习惯讨论时间、排名、投入和责任，仿佛只要把这些词摆够整齐，人的感情就会自动让路。",
        `${rival.name}来自${family.label}：${family.romance}。你面对的不只是教练和自己的家长，也包括对方回家后必须解释的那套规则。`,
        `你和${rival.name}被要求减少单独相处。对方没有当场反驳，只在离开前问你：“我们要不要先把话说清楚？”`,
        "抵抗可能让压力落到两个人身上；退让也可能把暂时的距离变成真正的裂缝。",
      ],
      choices: [
        hiddenChoice(`rel-resist-${rival.id}`, "承认关系，但共同制定不影响训练的边界", "你们把计划、成绩底线和见面频率写成一张近乎可笑的协议。它没有换来理解，却暂时保住了选择权。", { san: -2.5, mindset: 0.5, coachFavor: -2, familySupport: -1, tags: [`关系:${rival.id}:共同抵抗`] }),
        hiddenChoice(`rel-hide-${rival.id}`, "表面减少联系，私下继续", "你们开始删掉聊天记录，也学会在人群里保持距离。秘密保护了关系，同时让每一次误解都更难解释。", { san: -1.5, peerFavor: -0.5, tags: [`关系:${rival.id}:地下恋情`] }),
        hiddenChoice(`rel-pause-${rival.id}`, "约定到省赛后再恢复联系", "没有人说分手，但消息停在了那一天。你们都把注意力转向考试，也都知道沉默未必能够原样结束。", { san: -2, mindset: -0.5, tags: [`关系:${rival.id}:暂停联系`] }),
        hiddenChoice(`rel-breakup-${rival.id}`, "不让对方继续承受压力，提出分手", "你把理由说得非常完整，像在写一道论述题。对方听完后只问了一句：“这是你真正想要的吗？”你没有回答。", { san: -5, mindset: -2, peerFavor: -2, tags: ["关系:分手", `关系:${rival.id}:被迫分手`] }),
      ],
    };
  }

  if (
    relation.route === "dating" &&
    seen("interference") &&
    (relation.conflict >= 18 || relation.careDebt >= 3) &&
    !seen("repair")
  ) {
    return {
      ...base,
      id: `bondstory-${rival.id}-repair`,
      label: "恋爱线 · 不是所有沉默都叫体谅",
      title: `${rival.name}把你约到空教室，说最近的关系让TA越来越累。`,
      body: [
        "你们为了不影响训练压缩见面、删掉消息，也默认对方能够理解所有没有说出口的情绪。结果是每个人都在独自猜测。",
        `“我不需要你在比赛和我之间选一个。”${rival.name}说，“我只需要知道，你现在还有没有把我当成可以商量的人。”`,
        "修复需要时间，也需要承认喜欢并不会自动带来成熟。分开同样可能是诚实的选择。",
      ],
      choices: [
        hiddenChoice(`rel-repair-talk-${rival.id}`, "把最近回避的矛盾逐件说清楚", "谈话并不温柔，你们第一次承认彼此都造成过伤害。它没有立刻消除压力，却让关系重新变成两个人共同承担的事。", { san: -1, peerFavor: 2, mindset: 0.8, tags: [`关系:${rival.id}:完成修复谈话`] }),
        hiddenChoice(`rel-repair-boundary-${rival.id}`, "重新约定联系频率与各自的学习边界", "你们取消了随时在线的要求，也约好情绪最坏时至少发一句“我需要暂停”。边界没有减少亲密，反而停止了无休止的猜测。", { san: 1, mindset: 0.6, tags: [`关系:${rival.id}:重建边界`] }),
        hiddenChoice(`rel-repair-apology-${rival.id}`, "先承认自己把沉默当成了体谅", `${rival.name}没有马上原谅，只说愿意再观察一段时间。这不是完美和解，但你的道歉第一次没有附带辩解。`, { peerFavor: 1.5, san: -0.5, tags: [`关系:${rival.id}:不辩解的道歉`] }),
        hiddenChoice(`rel-breakup-${rival.id}`, "承认现在无法维持，认真结束关系", "你们没有把责任全部推给老师和家长。离开教室时，谁都没有回头；很多年后却仍会记得，这场分手至少保留了最后的诚实。", { san: -4, mindset: -1.5, tags: ["关系:分手", `关系:${rival.id}:主动分手`] }),
      ],
    };
  }

  if (
    relation.route === "dating" &&
    ctx.storyTags.some((tag) => tag.includes("省赛-最终名单确认")) &&
    !seen("different-results")
  ) {
    return {
      ...base,
      id: `bondstory-${rival.id}-different-results`,
      label: "恋爱线 · 两张不同的名单",
      title: "成绩公布后，你们第一次不知道应该先祝贺还是先安慰。",
      body: [
        "竞赛把同一段共同学习切成了不同结果。胜利的人害怕喜悦会刺痛对方，失利的人又不愿让自己的难过变成对方必须道歉的理由。",
        "你们坐在操场边，把手机都调成静音。关系无法消除结果差异，只能决定怎样不让差异抹掉彼此。",
      ],
      choices: [
        hiddenChoice(`rel-result-honest-${rival.id}`, "允许两个人分别说出喜悦与难过", "没有人把情绪包装得体面。正因为都被允许存在，祝贺和眼泪最后才没有互相取消。", { san: 1, peerFavor: 2, mindset: 0.8, tags: [`关系:${rival.id}:容纳不同结果`] }),
        hiddenChoice(`rel-result-space-${rival.id}`, "先给彼此一天，再约定明晚见面", "短暂距离阻止了仓促的伤人话。第二天，你们仍然无法解决一切，却能够坐在同一张桌边。", { san: 0.5, peerFavor: 1, tags: [`关系:${rival.id}:给情绪空间`] }),
        hiddenChoice(`rel-result-future-${rival.id}`, "立刻讨论接下来是否还会走同一条路", "未来问题太大，谈话几次陷入僵局。但你们至少没有假装结果不会改变生活。", { reasoning: 0.2, san: -1.5, tags: [`关系:${rival.id}:赛后路线谈判`] }),
      ],
    };
  }

  if (relation.route === "friend" && relation.bond >= 42 && !seen("friend-vow")) {
    return {
      ...base,
      id: `bondstory-${rival.id}-friend-vow`,
      label: "挚友线 · 谁先离开教室",
      title: `${rival.name}问：“如果最后只剩一个人，还算一起学过吗？”`,
      body: [
        "竞赛队的人数正在减少。有人转回常规，有人不再出现在模考名单里，也有人离开前没有和任何人告别。",
        "你们无法保证一起进省队，甚至无法保证明年还会坐在这里。能够保证的只有：不把失败的人从共同经历里删掉。",
      ],
      choices: [
        hiddenChoice(`rel-friend-promise-${rival.id}`, "答应无论结果怎样都告诉对方", "你们没有击掌，只互相保存了一个与竞赛群无关的联系方式。后来很多关键消息，都是从那里最先发出。", { peerFavor: 3, san: 1, tags: [`关系:${rival.id}:挚友约定`] }),
        hiddenChoice(`rel-friend-compete-${rival.id}`, "约定至少有一个人要把两个人的份走完", "这句话听起来像鼓励，也像负担。你们最终把它改成：谁先走不动，另一个就负责提醒他还有退路。", { mindset: 1, reasoning: 0.3, tags: [`关系:${rival.id}:共同目标`] }),
        hiddenChoice(`rel-friend-honest-${rival.id}`, "坦白自己也不知道能坚持多久", `${rival.name}反而松了一口气。真正的朋友不要求永远坚定，只要求动摇时不要假装消失。`, { san: 1.5, peerFavor: 2, tags: [`关系:${rival.id}:挚友坦白`] }),
      ],
    };
  }

  if (
    relation.route === "friend" &&
    seen("friend-vow") &&
    ctx.san <= 42 &&
    !seen("friend-crisis")
  ) {
    return {
      ...base,
      id: `bondstory-${rival.id}-friend-crisis`,
      label: "挚友线 · 今晚先不证明任何事",
      title: `${rival.name}发现你在同一页停留了快一个小时。`,
      body: [
        "你说自己只是困，对方却合上了你的书。竞赛教室里最容易做的事，是把明显的耗竭重新命名成勤奋。",
        `“你不需要为了让我相信你会坚持，今晚继续坐在这里。”${rival.name}把你的水杯推过来，“我们先把人带回去。”`,
      ],
      choices: [
        hiddenChoice(`rel-friend-go-${rival.id}`, "听TA的话，提前离开教室", "回宿舍的路上你没有复盘损失的时间。有人替你守住边界时，休息第一次不再像独自认输。", { san: 3, mindset: 0.8, peerFavor: 1.5, tags: [`关系:${rival.id}:被挚友接住`] }),
        hiddenChoice(`rel-friend-call-${rival.id}`, "请TA陪你联系家长或老师", "求助没有立刻解决问题，却让危险不再只存在于你一个人的判断里。", { san: 1.5, mindset: 1, familySupport: 0.5, tags: [`关系:${rival.id}:共同求助`] }),
        hiddenChoice(`rel-friend-one-page-${rival.id}`, "答应只整理桌面，不再追加学习", "你们把任务缩小到能够结束。关灯时，那一页仍未读完，但你已经重新能够感知疲惫。", { san: 2, peerFavor: 1, tags: [`关系:${rival.id}:一起收尾`] }),
      ],
    };
  }

  return null;
}

export function applyRelationshipChoice(
  current: DeepRelationship,
  choiceId: string,
  week: number,
) {
  const next = { ...current, lastInteractionWeek: week, careDebt: Math.max(0, current.careDebt - 1) };
  if (choiceId.startsWith("rel-daily-")) {
    const parts = choiceId.split("-");
    const tone = parts[2];
    const personality = ["reserved", "warm", "competitive", "playful", "curious"].includes(parts[3])
      ? parts[3]
      : null;
    const innerConflict = ["abandonment", "burden", "achievement", "distance", "caretaking", "family"].includes(parts[4])
      ? parts[4]
      : null;
    if (tone === "care") {
      next.bond = clamp(next.bond + 2.8);
      next.trust = clamp(next.trust + 2.2);
      next.romance = clamp(next.romance + (next.route === "crush" || next.route === "dating" ? 1.6 : 0));
      next.conflict = clamp(next.conflict - 1.2);
      next.careDebt = Math.max(0, next.careDebt - 1.4);
    } else if (tone === "light") {
      next.bond = clamp(next.bond + 2.2);
      next.trust = clamp(next.trust + 0.8);
      next.romance = clamp(next.romance + (next.route === "crush" || next.route === "dating" ? 1.2 : 0));
    } else if (tone === "honest") {
      next.bond = clamp(next.bond + 2.5);
      next.trust = clamp(next.trust + 3);
      next.romance = clamp(next.romance + (next.route === "crush" || next.route === "dating" ? 1.4 : 0));
      next.conflict = clamp(next.conflict - 1.4);
    } else if (tone === "practical") {
      next.bond = clamp(next.bond + 1.2);
      next.trust = clamp(next.trust + 1.8);
    } else if (tone === "boundary") {
      next.bond = clamp(next.bond + 1.5);
      next.trust = clamp(next.trust + 2.5);
      next.conflict = clamp(next.conflict - 1.8);
      next.careDebt = Math.max(0, next.careDebt - 1.2);
    } else if (tone === "avoid") {
      next.bond = clamp(next.bond - 0.8);
      next.trust = clamp(next.trust - 0.7);
      next.tension = clamp(next.tension + 1.4);
      if (next.route === "dating") next.careDebt = clamp(next.careDebt + 1, 0, 20);
    } else if (tone === "hurt") {
      next.bond = clamp(next.bond - 2.2);
      next.trust = clamp(next.trust - 2.4);
      next.tension = clamp(next.tension + 2.5);
      next.conflict = clamp(next.conflict + 3.5);
      if (next.route === "dating") next.careDebt = clamp(next.careDebt + 1.5, 0, 20);
    }
    if (personality === "reserved" && (tone === "honest" || tone === "boundary"))
      next.trust = clamp(next.trust + 0.6);
    if (personality === "warm" && tone === "care") next.bond = clamp(next.bond + 0.5);
    if (personality === "warm" && tone === "hurt") next.conflict = clamp(next.conflict + 0.8);
    if (personality === "competitive" && tone === "practical") next.trust = clamp(next.trust + 0.6);
    if (personality === "competitive" && tone === "hurt") next.tension = clamp(next.tension + 0.8);
    if (personality === "playful" && tone === "light") next.bond = clamp(next.bond + 0.6);
    if (personality === "curious" && (tone === "honest" || tone === "practical"))
      next.trust = clamp(next.trust + 0.6);
    if (personality === "curious" && tone === "avoid") next.tension = clamp(next.tension + 0.5);
    if (innerConflict === "abandonment") {
      if (tone === "avoid" || tone === "hurt") next.bond = clamp(next.bond - 0.7);
      if (tone === "care" || tone === "honest") next.trust = clamp(next.trust + 0.4);
    }
    if (innerConflict === "burden" && tone === "hurt") next.trust = clamp(next.trust - 0.6);
    if (innerConflict === "achievement") {
      if (tone === "practical" || tone === "honest") next.trust = clamp(next.trust + 0.4);
      if (tone === "hurt") next.tension = clamp(next.tension + 0.5);
    }
    if (innerConflict === "distance" && tone === "boundary") next.trust = clamp(next.trust + 0.6);
    if (innerConflict === "caretaking" && (tone === "care" || tone === "honest"))
      next.trust = clamp(next.trust + 0.5);
    if (innerConflict === "family") {
      if (tone === "boundary" || tone === "care") next.trust = clamp(next.trust + 0.4);
      if (tone === "hurt") next.conflict = clamp(next.conflict + 0.5);
    }
    return next;
  }
  const positive = /warm|listen|share|heart|future|promise|honest|date-life|date-study|date-cheap|resist|repair-talk|repair-boundary|repair-apology|result-honest|friend-go|friend-call|friend-one-page/.test(choiceId);
  const practical = /practical|plan/.test(choiceId);
  const avoided = /avoid|dismiss|distance/.test(choiceId);
  if (positive) {
    next.bond = clamp(next.bond + 6);
    next.trust = clamp(next.trust + 5);
    next.romance = clamp(next.romance + (next.route === "crush" ? 5 : 1));
    next.conflict = clamp(next.conflict - 2);
  } else if (practical) {
    next.bond = clamp(next.bond + 4);
    next.trust = clamp(next.trust + 4);
  } else if (avoided) {
    next.bond = clamp(next.bond - 2);
    next.trust = clamp(next.trust - 2);
    next.tension = clamp(next.tension + 4);
  }
  if (choiceId.startsWith("relationship-friend-")) {
    next.route = "friend";
    next.bond = clamp(next.bond + 10);
    next.trust = clamp(next.trust + 8);
    next.romance = 0;
  }
  if (choiceId.startsWith("relationship-crush-")) {
    next.route = "crush";
    next.romance = clamp(next.romance + 20);
    next.bond = clamp(next.bond + 7);
  }
  if (choiceId.startsWith("relationship-rivalry-")) {
    next.route = "rival";
    next.tension = clamp(next.tension + 18);
  }
  if (choiceId.startsWith("rel-date-")) {
    next.route = "dating";
    next.romance = clamp(next.romance + 24);
    next.bond = clamp(next.bond + 8);
    next.trust = clamp(next.trust + 6);
  }
  if (choiceId.startsWith("rel-rejected-")) {
    next.route = "strained";
    next.romance = clamp(next.romance - 14);
    next.conflict = clamp(next.conflict + 12);
  }
  if (choiceId.startsWith("rel-breakup-")) {
    next.route = "broken-up";
    next.romance = clamp(next.romance - 24);
    next.conflict = clamp(next.conflict + 25);
  }
  if (choiceId.startsWith("rel-hide-") || choiceId.startsWith("rel-pause-")) {
    next.conflict = clamp(next.conflict + 8);
    next.careDebt = clamp(next.careDebt + 2, 0, 20);
  }
  return next;
}

export function settleRelationshipWeek(
  relation: DeepRelationship,
  interacted: boolean,
  week: number,
) {
  const next = { ...relation };
  if (interacted && relation.route === "neutral") {
    next.bond = clamp(next.bond + 2.8);
    next.trust = clamp(next.trust + 1.8);
    next.lastInteractionWeek = week;
    return next;
  }
  if (!(["dating", "friend", "crush"] as RelationshipRoute[]).includes(relation.route)) return relation;
  if (interacted) {
    next.bond = clamp(next.bond + (next.route === "dating" ? 1.2 : 0.8));
    next.trust = clamp(next.trust + 0.7);
    next.careDebt = Math.max(0, next.careDebt - 1.2);
    next.conflict = Math.max(0, next.conflict - 0.5);
    next.lastInteractionWeek = week;
  } else if (next.route === "dating") {
    next.careDebt = clamp(next.careDebt + 0.45, 0, 20);
    const silentWeeks = week - next.lastInteractionWeek;
    if (silentWeeks >= 3) {
      next.bond = clamp(next.bond - Math.min(1.6, 0.35 + (silentWeeks - 3) * 0.18));
      next.trust = clamp(next.trust - Math.min(1.1, 0.2 + (silentWeeks - 3) * 0.12));
    }
    if (silentWeeks >= 4) next.conflict = clamp(next.conflict + 0.8);
  } else if (!interacted) {
    const silentWeeks = week - next.lastInteractionWeek;
    if (silentWeeks >= 5) {
      next.bond = clamp(next.bond - Math.min(0.9, 0.2 + (silentWeeks - 5) * 0.1));
      if (next.route === "crush") next.romance = clamp(next.romance - 0.35);
    }
  }
  return next;
}

export function relationshipLearningBoost(relationships: Record<string, DeepRelationship>) {
  const partner = Object.values(relationships).find((relation) => relation.route === "dating");
  if (!partner) return 0;
  if (partner.conflict >= 55 || partner.careDebt >= 8) return -0.04;
  return Math.min(0.06, 0.015 + partner.bond / 2000 + partner.trust / 2500);
}

export function relationshipWeeklyMoodEffect(
  relationships: Record<string, DeepRelationship>,
  week: number,
) {
  const partner = Object.values(relationships).find(
    (relation) => relation.route === "dating",
  );
  if (!partner) return 0;
  const silentWeeks = week - partner.lastInteractionWeek;
  if (partner.conflict >= 55 || partner.careDebt >= 8 || silentWeeks >= 7)
    return -1.2;
  if (silentWeeks >= 4) return -0.6;
  if (silentWeeks <= 1 && partner.bond >= 55) return 0.45;
  return 0.1;
}
