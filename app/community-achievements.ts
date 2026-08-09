export type CommunityAchievementDefinition = {
  id: string;
  title: string;
  description: string;
  creditedBy?: string;
  category: "竞赛" | "关系" | "实验" | "生活" | "幻想乡" | "结局";
};

/**
 * 玩家解锁后看到的“达成方式”。这里必须逐项对应
 * communityAchievementConditions，不能拿风味描述代替判定条件。
 */
export const communityAchievementUnlockMethods: Record<string, string> = {
  "swift-retreat": "在距离省赛不超过一周时，主动发起并正式完成退赛。",
  biohazard: "完成植物实验支线“生化危机”，并作出任意一种收尾选择。",
  "ordinary-heart": "全程未参加南辰、圆阶的国庆或寒假外培，最终进入国家集训队（国赛前50）。",
  "zero-plus-five": "触发实验材料与食物混放事件，并完成安全处置。",
  "members-only": "在幻想乡线触发“会员制餐厅”聚餐事件。",
  "paper-survival": "在幻想乡烂题讨论中，完成改题、追原文或认真辩论。",
  "legendary-notes": "在幻想乡线获得并认真处理一份代代流传的讲义。",
  "world-visit": "进入全国或国际阶段后，在幻想乡线完成一次跨地区串门。",
  "pokemon-master": "触发动物实验异常配合事件，并完成该次实验处理。",
  inception: "在实验训练中察觉器材或操作异常，并完成“盗梦空间”事件。",
  rhaast: "累计刷题与看错题至少90次，同时第四模块掌握达到65。",
  sisyphus: "累计参加至少12次竞赛测试，并触发“长期模考却遗忘”。",
  "five-biochemistry": "第一模块掌握达到78；生化、分子、细胞、生信四本书均达到72；且累计刷题至少20次。",
  "re-zero-bio": "在低SAN实验梦境中完成“从零开始的生竞生活”事件。",
  metamorphosis: "在低SAN实验训练中触发并完成“变形记”事件。",
  enlightenment: "在“变形记”事件里选择命名结构自我稳定，或请可信任的队友监护。",
  analects: "在后日谈中走向教师或竞赛教练职业。",
  "one-punch": "在同一周安排极端数量的刷题行动，触发“一周极端刷题”。",
  "unlicensed-coach": "从未参加国赛，并在后日谈中成为教师或竞赛教练。",
  "caffeine-drive": "累计使用至少3杯咖啡，并实际参加过国赛。",
  "divine-move": "在实验事故中保住关键证据并完成“神之一手”事件。",
  "old-artist": "把一次异常实验结果转化为有效复盘或队内共同记忆。",
  "lobotomy-corp": "最近四周内SAN净下降至少50点。",
  activated: "任意一本教材的课程进度达到90。",
  "remember-you": "连续九周每周食用一次巧克力。",
  "great-luck": "任意一次省赛取得全省第1，且领先第2名至少5分（160分制）。",
  faust: "解锁成就柜中除“浮士德”之外的全部基础与共创成就。",
  "eat-no-pressure": "曾被家长或教练劝退，后来仍在国赛获得金牌。",
  "sword-holder": "正式进入省队时，本校竞赛队只剩你一名在役队员。",
  "x-god": "摸鱼依赖达到9。",
  oritis: "在SAN低于45时参加国赛，并取得实验考试第1名。",
  "middle-finger": "第一次省赛仅获省三或未获奖，第二次进入省队，随后在国赛获得金牌。",
  "no-watching": "同一周的全部自主行动都选择摸鱼。",
  "command-god": "教练好感达到35，并正式进入省队。",
  "command-district": "教练好感达到35，但任意一次省赛仅获省三或未获奖。",
  furioso: "已解锁“指令是神”，并在之后进入国家集训队（国赛前50）。",
  "dream-end": "第二次省赛恰好排在省队线后一名。",
  outsider: "两次省赛都只获得省三或未获奖。",
  "kill-kill-kill": "在低SAN状态下被教练劝退，并最终正式退赛。",
  revival: "经历分手后仍正式进入省队。",
  "solo-walk": "从未与竞争对手共同学习，仍正式进入省队。",
  "tiger-shark": "与已经确认的挚友一同进入省队。",
  "new-world": "通过摸鱼偶然发现并正式加入生竞幻想乡。",
  "elysian-realm": "在幻想乡累计聊天至少12次。",
  "bio-degree-ability": "加入幻想乡后进入国家集训队（国赛前50）。",
  "first-rain": "购买并种下种子，完成“第一场雨”植物支线。",
  "spider-thread": "进入国家集训队时，家庭支持不高于5、教练好感不高于-20、同学好感不高于5。",
  hardman: "教练好感不高于-25、同学好感不高于5时，仍正式进入省队。",
  "guardian-angel": "国赛理论排名在230—240名之间，并成功取得实验考试资格。",
  "gensokyo-beloved": "加入幻想乡，并最终入选五人国家队。",
  "baka-nine": "四模块掌握均不高于30时参加省赛。",
  "great-parent": "家庭支持达到100。",
  "king-of-kings": "触发“王中王冲刺”事件，并正式进入省队。",
  "golden-mother": "家庭支持降至0。",
};

export const communityAchievementDefinitions: CommunityAchievementDefinition[] = [
  { id: "swift-retreat", title: "急流勇退", description: "答案尚未揭晓，但你已经作出了自己的选择。", creditedBy: "Glaucophytes", category: "结局" },
  { id: "biohazard", title: "生化危机", description: "你只是想养点什么。它显然有自己的想法。", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "ordinary-heart", title: "平常心", description: "不押题，不追风，也不向任何一次模考借取勇气。", category: "竞赛" },
  { id: "zero-plus-five", title: "0+5", description: "实验课上，有些东西从一开始就不该进入食谱。", creditedBy: "天天哭的菟丝子😭😭😭", category: "实验" },
  { id: "members-only", title: "会员制餐厅", description: "菜单从不公开，食材也最好不要追问。", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "paper-survival", title: "论文的存废", description: "自有大儒为我辩经。", creditedBy: "扣1送地狱火", category: "竞赛" },
  { id: "legendary-notes", title: "讲义在哪里？", description: "想要我的细胞生物学讲义吗？", creditedBy: "扣1送地狱火", category: "幻想乡" },
  { id: "world-visit", title: "世界级串门", description: "赛场之外，大家首先是同一种生物。", creditedBy: "扣1送地狱火", category: "幻想乡" },
  { id: "pokemon-master", title: "我要成为宝可梦大师！", description: "十万伏特！", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "inception", title: "盗梦空间", description: "你相信自己的手感，直到仪器开始怀疑现实。", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "rhaast", title: "现在只有拉亚斯特了！", description: "你握住了笔，还是笔握住了你？", creditedBy: "扣1送地狱火", category: "竞赛" },
  { id: "sisyphus", title: "西西弗斯", description: "那么，再来一次吧，就一次。", creditedBy: "扣1送地狱火", category: "竞赛" },
  { id: "five-biochemistry", title: "五等分的生化", description: "一本书装不下的知识，被命运分成了五份。", creditedBy: "扣1送地狱火", category: "竞赛" },
  { id: "re-zero-bio", title: "从零开始的生竞生活", description: "醒来时，省队名单又一次贴在那面墙上。", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "metamorphosis", title: "变形记", description: "某一日，突然……", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "enlightenment", title: "点化", description: "观察者与被观察者之间，只差一次顿悟。", creditedBy: "Glaucophytes", category: "实验" },
  { id: "analects", title: "论语", description: "后来，你也站到了讲台的另一边。", creditedBy: "扣1送地狱火", category: "结局" },
  { id: "one-punch", title: "一拳超人", description: "题海没有尽头，但你的笔已经突破限制器。", creditedBy: "扣1送地狱火", category: "竞赛" },
  { id: "unlicensed-coach", title: "无证上岗", description: "你没有参加那场考试，却成了最有名的竞赛教练。", creditedBy: "扣1送地狱火", category: "结局" },
  { id: "caffeine-drive", title: "咖啡因驱动", description: "意识抵达了终点，身体还在追赶。", creditedBy: "扣1送地狱火", category: "生活" },
  { id: "divine-move", title: "神之一手", description: "那么今天，是我赢了。", creditedBy: "扣1送地狱火", category: "实验" },
  { id: "old-artist", title: "老艺术家", description: "实验不一定成功，但你成功活跃了气氛。", creditedBy: "Glaucophytes", category: "关系" },
  { id: "lobotomy-corp", title: "脑叶公司", description: "无视他，无视他，无视他。", creditedBy: "商落", category: "生活" },
  { id: "activated", title: "我已启动", description: "偏差认知了偏差认知。", creditedBy: "商落", category: "竞赛" },
  { id: "remember-you", title: "我还记得你", description: "你跑不过我你信不信？", creditedBy: "商落", category: "生活" },
  { id: "great-luck", title: "大运", description: "借过一下。", creditedBy: "商落", category: "竞赛" },
  { id: "faust", title: "浮士德", description: "万象皆俄顷，无非是映影。", category: "结局" },
  { id: "eat-no-pressure", title: "不吃压力", description: "无人扶我青云志，我自踏雪至山巅。", category: "竞赛" },
  { id: "sword-holder", title: "执剑人", description: "把字刻在石头上。", category: "关系" },
  { id: "x-god", title: "X神，启动！", description: "哒哒哒哒哒，好想玩X神。", category: "生活" },
  { id: "oritis", title: "欧利蒂斯", description: "好秀啊好秀啊。", category: "实验" },
  { id: "middle-finger", title: "中指，永不遗忘！", description: "哈哈，伊利哇啦！", creditedBy: "Shu_Leaf", category: "竞赛" },
  { id: "no-watching", title: "不思观望", description: "哇（^_^）。", creditedBy: "Shu_Leaf", category: "生活" },
  { id: "command-god", title: "指令是神", description: "哔哔。", creditedBy: "聿", category: "竞赛" },
  { id: "command-district", title: "指令是区", description: "哔哔！", creditedBy: "聿", category: "竞赛" },
  { id: "furioso", title: "Furioso-Replica", description: "Neuf。九。完成。", creditedBy: "聿", category: "竞赛" },
  { id: "dream-end", title: "梦之终焉", description: "生竞……结束了。", creditedBy: "Shu_Leaf", category: "竞赛" },
  { id: "outsider", title: "局外人", description: "今天，我落榜了，或许是昨天，我不知道。", creditedBy: "聿", category: "竞赛" },
  { id: "kill-kill-kill", title: "杀、杀、杀！", description: "我最讨厌事后道歉！", category: "结局" },
  { id: "revival", title: "复活", description: "玛丝洛娃，请原谅我。", category: "关系" },
  { id: "solo-walk", title: "踽踽独行", description: "单通侠。", creditedBy: "聿", category: "关系" },
  { id: "tiger-shark", title: "笑面虎与乌角鲨", description: "一对笑面虎，两头乌角鲨。", category: "关系" },
  { id: "new-world", title: "致新世界", description: "流淌着黄金的土地啊……", category: "幻想乡" },
  { id: "elysian-realm", title: "往世乐土", description: "嗨🎶，想我了吗？", category: "幻想乡" },
  { id: "bio-degree-ability", title: "生物竞赛程度的能力", description: "时间，热爱与不曾割舍的幻想。", creditedBy: "聿", category: "幻想乡" },
  { id: "first-rain", title: "第一场雨", description: "那天，我们回到了二十世纪。", category: "生活" },
  { id: "spider-thread", title: "蜘蛛丝", description: "「无我梦中，支离灭裂，阿鼻叫唤。」", creditedBy: "Shu_Leaf", category: "竞赛" },
  { id: "hardman", title: "哈德曼的妖怪少年（女）", description: "小石说她不知道哦。", creditedBy: "聿", category: "关系" },
  { id: "guardian-angel", title: "他出了一个名刀司命！", description: "真正想赢的人脸上是没有笑容的。", category: "竞赛" },
  { id: "gensokyo-beloved", title: "众神眷恋的幻想乡", description: "……以及眷恋着幻想乡的我们啊。", creditedBy: "聿", category: "幻想乡" },
  { id: "baka-nine", title: "⑨", description: "BAKA。", creditedBy: "聿", category: "竞赛" },
  { id: "great-parent", title: "中国好家长", description: "也许你应该考虑一下什么时候对他们说一声谢谢。", creditedBy: "聿", category: "关系" },
  { id: "king-of-kings", title: "王中王", description: "四星烬能输？", creditedBy: "Shu_Leaf", category: "竞赛" },
  { id: "golden-mother", title: "金母", description: "东亚原生家庭这一块。", creditedBy: "聿", category: "关系" },
];

export type AchievementCheckContext = {
  week: number;
  stats: {
    san: number;
    mindset: number;
    social: number;
    coachFavor: number;
    peerFavor: number;
    familySupport: number;
    slackDependence: number;
    experiment: number;
    module1: number;
    module2: number;
    module3: number;
    module4: number;
    bookStudy: Record<string, { course: number; retention: number }>;
  };
  storyTags: string[];
  actionCounts: Record<string, number>;
  currentWeekUses: Record<string, number>;
  chocolateStreak: number;
  weekRecords: Array<{ week: number; changes: Array<{ label: string; value: number }>; sanAfter?: number }>;
  provincialAttempts: Array<{
    attemptNumber: 1 | 2;
    finalRank?: number;
    finalAward?: string;
    finalScore?: number;
    teamPlaces: number;
    competitorScores: number[];
  }>;
  nationalAttempts: Array<{
    attemptNumber: 1 | 2;
    theoryRank: number;
    finalRank: number | null;
    medal: string;
    qualifiedForExperiment: boolean;
    experimentRank?: number;
    sanAtExam?: number;
  }>;
  activeTeamSize: number;
  relationships: Record<string, {
    bond: number;
    route?: string;
  }>;
  unlocked: Record<string, string>;
  postCareer?: {
    nationalSelection?: { selected?: boolean };
    ending?: { futureRouteId?: string };
  } | null;
};

const hasAny = (tags: string[], candidates: string[]) =>
  candidates.some((tag) => tags.includes(tag));

export function communityAchievementConditions(ctx: AchievementCheckContext) {
  const { stats, storyTags: tags, actionCounts, provincialAttempts, nationalAttempts } = ctx;
  const enteredTeam = hasAny(tags, ["第1次省赛-进入省队", "第2次省赛-进入省队"]);
  const trainingTeam = nationalAttempts.some((attempt) => (attempt.finalRank ?? 999) <= 50);
  const nationalTeam = Boolean(ctx.postCareer?.nationalSelection?.selected);
  const first = provincialAttempts.find((attempt) => attempt.attemptNumber === 1);
  const second = provincialAttempts.find((attempt) => attempt.attemptNumber === 2);
  const latestNational = [...nationalAttempts].sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
  const lastFour = ctx.weekRecords.slice(-4);
  const monthlySanLoss = lastFour.length >= 4
    ? (lastFour[0].sanAfter ?? stats.san) - (lastFour.at(-1)?.sanAfter ?? stats.san)
    : 0;
  const allCommunityExceptFaust = communityAchievementDefinitions
    .filter((item) => item.id !== "faust")
    .every((item) => Boolean(ctx.unlocked[item.id]));
  const allModulesAtMost30 = [stats.module1, stats.module2, stats.module3, stats.module4]
    .every((value) => value <= 30);
  const highCoach = stats.coachFavor >= 35;
  const lowProvinceResult = (attempt?: typeof first) =>
    Boolean(attempt && ["省三等奖", "未获奖"].includes(attempt.finalAward ?? ""));

  return {
    "swift-retreat": tags.includes("省赛前一周正式退赛"),
    biohazard: tags.includes("achievement:biohazard"),
    "ordinary-heart": trainingTeam && !hasAny(tags, ["国庆外培-南辰", "国庆外培-圆阶", "寒假外培-南辰", "寒假外培-圆阶"]),
    "zero-plus-five": tags.includes("achievement:zero-plus-five"),
    "members-only": tags.includes("achievement:members-only"),
    "paper-survival": tags.includes("achievement:paper-survival"),
    "legendary-notes": tags.includes("achievement:legendary-notes"),
    "world-visit": tags.includes("achievement:world-visit"),
    "pokemon-master": tags.includes("achievement:pokemon-master"),
    inception: tags.includes("achievement:inception"),
    rhaast: (actionCounts.practice ?? 0) + (actionCounts["wrong-questions"] ?? 0) >= 90 && stats.module4 >= 65,
    sisyphus: (actionCounts["competition-assessment"] ?? 0) >= 12 && tags.includes("长期模考却遗忘"),
    "five-biochemistry":
      stats.module1 >= 78 &&
      ["biochemistry", "molecular", "cell", "bioinformatics"].every(
        (bookId) => (stats.bookStudy[bookId]?.course ?? 0) >= 72,
      ) &&
      (actionCounts.practice ?? 0) >= 20,
    "re-zero-bio": tags.includes("achievement:re-zero-bio"),
    metamorphosis: tags.includes("achievement:metamorphosis"),
    enlightenment: tags.includes("achievement:enlightenment"),
    analects: ctx.postCareer?.ending?.futureRouteId === "teacher",
    "one-punch": tags.includes("一周极端刷题"),
    "unlicensed-coach": ctx.postCareer?.ending?.futureRouteId === "teacher" && nationalAttempts.length === 0,
    "caffeine-drive": (actionCounts["use:coffee"] ?? 0) >= 3 && nationalAttempts.length > 0,
    "divine-move": tags.includes("achievement:divine-move"),
    "old-artist": tags.includes("achievement:old-artist"),
    "lobotomy-corp": monthlySanLoss >= 50,
    activated: Object.values(stats.bookStudy).some((book) => book.course >= 90),
    "remember-you": ctx.chocolateStreak >= 9,
    "great-luck": Boolean(first?.finalRank === 1 || second?.finalRank === 1) && [first, second].some((attempt) => {
      if (!attempt || attempt.finalRank !== 1 || typeof attempt.finalScore !== "number") return false;
      const runnerUp = [...attempt.competitorScores].sort((a, b) => b - a)[0] ?? 0;
      return attempt.finalScore - runnerUp >= 5;
    }),
    faust: allCommunityExceptFaust,
    "eat-no-pressure": latestNational?.medal === "金牌" && tags.includes("曾被家长或教练劝退"),
    "sword-holder": enteredTeam && ctx.activeTeamSize <= 1,
    "x-god": stats.slackDependence >= 9,
    oritis: nationalAttempts.some((attempt) => attempt.experimentRank === 1 && (attempt.sanAtExam ?? 100) < 45),
    "middle-finger": lowProvinceResult(first) && tags.includes("第2次省赛-进入省队") && latestNational?.medal === "金牌",
    "no-watching": tags.includes("一周全部摸鱼"),
    "command-god": highCoach && enteredTeam,
    "command-district": highCoach && [first, second].some(lowProvinceResult),
    furioso: Boolean(ctx.unlocked["command-god"]) && trainingTeam,
    "dream-end":
      second?.finalRank === (second?.teamPlaces ?? Number.NEGATIVE_INFINITY) + 1,
    outsider: lowProvinceResult(first) && lowProvinceResult(second),
    "kill-kill-kill":
      tags.includes("低SAN时被教练劝退") && tags.includes("已退赛"),
    revival: tags.includes("关系:分手") && enteredTeam,
    "solo-walk": enteredTeam && (actionCounts["rival-study"] ?? 0) === 0,
    "tiger-shark": enteredTeam && tags.includes("挚友一同进入省队"),
    "new-world": tags.includes("幻想乡:加入"),
    "elysian-realm": (actionCounts["fantasy-chat"] ?? 0) >= 12,
    "bio-degree-ability": tags.includes("幻想乡:加入") && trainingTeam,
    "first-rain": tags.includes("achievement:first-rain"),
    "spider-thread": trainingTeam && stats.familySupport <= 5 && stats.coachFavor <= -20 && stats.peerFavor <= 5,
    hardman: enteredTeam && stats.coachFavor <= -25 && stats.peerFavor <= 5,
    "guardian-angel": nationalAttempts.some((attempt) => attempt.theoryRank >= 230 && attempt.theoryRank <= 240 && attempt.qualifiedForExperiment),
    "gensokyo-beloved": tags.includes("幻想乡:加入") && nationalTeam,
    "baka-nine": tags.includes("低掌握参加省赛") || (allModulesAtMost30 && provincialAttempts.length > 0),
    "great-parent": stats.familySupport >= 100,
    "king-of-kings": tags.includes("王中王冲刺") && enteredTeam,
    "golden-mother": stats.familySupport <= 0,
  } satisfies Record<string, boolean>;
}
