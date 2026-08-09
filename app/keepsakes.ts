import type { GameEffect } from "./game-data";

export type KeepsakeRarity = "white" | "green" | "blue" | "purple" | "gold";
export type KeepsakeCategory =
  | "shop"
  | "competition"
  | "relationship"
  | "fantasy"
  | "future";

export type KeepsakeContext = {
  week: number;
  storyTags: string[];
  resolvedEvents: string[];
  actionCounts: Record<string, number>;
  inventory: Record<string, number>;
  experimentUnlocked: boolean;
  experiment: number;
  experimentModules: number[];
  retiredRivalCount: number;
  relationships: Array<{ route: string; bond: number; trust: number }>;
  provincialAttempts: Array<{
    finalAward?: string;
    enteredTeam?: boolean;
  }>;
  nationalAttempts: Array<{
    finalRank: number | null;
    medal: string;
    theoryRank: number;
  }>;
  postCareer?: {
    stage?: string;
    admissionRoute?: string;
    gaokaoTotal?: number;
    nationalSelected?: boolean;
    internationalMedal?: string;
  };
};

export type KeepsakeDefinition = {
  id: string;
  name: string;
  rarity: KeepsakeRarity;
  category: KeepsakeCategory;
  atlasIndex: number;
  description: string;
  effectText?: string;
  reward?: GameEffect;
  shopItemId?: string;
  unlock: (context: KeepsakeContext) => boolean;
  variant?: (context: KeepsakeContext) => Pick<KeepsakeDefinition, "name" | "rarity" | "description">;
};

export type KeepsakeRecord = {
  acquiredWeek: number;
  acquiredAt: string;
};

export const rarityLabels: Record<KeepsakeRarity, string> = {
  white: "普通纪念",
  green: "常见",
  blue: "稀有",
  purple: "珍贵",
  gold: "传奇",
};

const hasTag = (context: KeepsakeContext, fragment: string) =>
  context.storyTags.some((tag) => tag.includes(fragment));
const hasEvent = (context: KeepsakeContext, fragment: string) =>
  context.resolvedEvents.some((eventId) => eventId.includes(fragment));
const bought = (context: KeepsakeContext, itemId: string) =>
  (context.actionCounts[`shop:${itemId}`] ?? 0) > 0 ||
  (context.inventory[itemId] ?? 0) > 0;
const actionTotal = (context: KeepsakeContext, fragment: string) =>
  Object.entries(context.actionCounts)
    .filter(([id]) => id.includes(fragment))
    .reduce((total, [, count]) => total + count, 0);
const hasCloseRoute = (context: KeepsakeContext, route: string) =>
  context.relationships.some((relationship) => relationship.route === route);

const shopKeepsake = (
  id: string,
  name: string,
  rarity: KeepsakeRarity,
  atlasIndex: number,
  description: string,
  shopItemId = id,
): KeepsakeDefinition => ({
  id: `shop-${id}`,
  name,
  rarity,
  category: "shop",
  atlasIndex,
  description,
  shopItemId,
  unlock: (context) => bought(context, shopItemId),
});

export const keepsakeDefinitions: KeepsakeDefinition[] = [
  shopKeepsake("coffee", "黑咖啡", "green", 0, "一杯被用来向睡眠借时间的咖啡。", "coffee"),
  shopKeepsake("chocolate", "抽屉里的巧克力", "green", 1, "糖分不能解决问题，但有时能让人先撑过问题。", "chocolate"),
  shopKeepsake("energy-drink", "功能饮料", "blue", 2, "它提供的不是精力，只是把疲惫推迟到下一页。"),
  shopKeepsake("mint", "薄荷糖盒", "green", 3, "清凉感只持续了一会儿，卷子却真的多做了几题。", "mint"),
  shopKeepsake("earplugs", "隔音耳塞", "green", 4, "隔得住室友的键盘，隔不住脑子里的排名。", "earplugs"),
  shopKeepsake("hardback-notebook", "硬壳笔记本", "green", 5, "第一页写得最整齐，后面的字逐渐只对自己可读。"),
  shopKeepsake("lucky-pen", "据说很灵的考试笔", "green", 6, "所谓幸运，多半来自它让你记得提前检查笔芯。", "lucky-pen"),
  shopKeepsake("plant-seeds", "一包植物种子", "blue", 7, "包装没有标明物种。对竞赛生而言，这几乎是一种挑衅。", "plant-seeds"),
  {
    id: "clay-pot",
    name: "粗陶小花盆",
    rarity: "white",
    category: "shop",
    atlasIndex: 8,
    description: "窗台上的土留下了一圈干掉的水迹。",
    unlock: (context) => hasEvent(context, "achievement-first-rain"),
  },
  shopKeepsake("microbe-blindbox", "微生物盲盒", "white", 9, "它没有任何效果，却一直端正地看着你的错题。"),
  shopKeepsake("folding-umbrella", "便利店折叠伞", "green", 10, "真正被记住的不是雨，而是伞向谁那边偏了一点。"),
  shopKeepsake("shared-snack", "双人分享装零食", "blue", 11, "包装上写着两人份，实际分配从来没有那么公平。"),
  shopKeepsake("gift-bag", "牛皮纸礼袋", "green", 12, "纸袋很普通，里面装什么却很难决定。"),
  shopKeepsake("data-usb", "16GB旧U盘", "blue", 13, "装过讲义、错题、群文件，以及几个没有命名的深夜。"),
  {
    id: "coach-schedule",
    name: "第一轮课表",
    rarity: "white",
    category: "competition",
    atlasIndex: 14,
    description: "那时所有安排都显得确定，仿佛只要按顺序学完就会抵达终点。",
    unlock: (context) => context.week >= 1,
  },
  {
    id: "first-quiz",
    name: "第一次队内小测卷",
    rarity: "white",
    category: "competition",
    atlasIndex: 15,
    description: "分数并不漂亮，红叉却第一次有了竞赛的形状。",
    unlock: (context) => context.week >= 4,
  },
  {
    id: "worn-red-pen",
    name: "写秃的红笔",
    rarity: "green",
    category: "competition",
    atlasIndex: 16,
    description: "墨水用在重写证据链上，比用在圈出分数上更有意义。",
    effectText: "首次获得时，思辨与心态各获得极小幅提升。",
    reward: { reasoning: 0.4, mindset: 0.3 },
    unlock: (context) => actionTotal(context, "wrong-questions") >= 4,
  },
  {
    id: "team-photo",
    name: "尚未站满的队伍合照",
    rarity: "white",
    category: "competition",
    atlasIndex: 17,
    description: "后来有人离开了。照片没有把他们从最初的位置上删掉。",
    unlock: (context) => context.week >= 8,
  },
  {
    id: "annotated-book",
    name: "退队同学留下的批注书",
    rarity: "blue",
    category: "competition",
    atlasIndex: 18,
    description: "页边写着问题、抱怨和一条没有走完的路线。",
    effectText: "首次获得时恢复少量心态；不会直接增加教材进度。",
    reward: { mindset: 0.6 },
    unlock: (context) => context.retiredRivalCount >= 1,
  },
  {
    id: "temporary-leave-form",
    name: "临时停课申请表",
    rarity: "white",
    category: "competition",
    atlasIndex: 19,
    description: "签字栏比想象中多，每个人的担心都写得很正式。",
    unlock: (context) => hasTag(context, "临时停课") || hasTag(context, "正式停课"),
  },
  {
    id: "hotel-card",
    name: "联赛酒店房卡",
    rarity: "white",
    category: "competition",
    atlasIndex: 20,
    description: "刷开房门时，第二天的八十道题还没有成为记忆。",
    unlock: (context) => hasEvent(context, "hotel") || context.provincialAttempts.length > 0,
  },
  {
    id: "parent-thermos",
    name: "父母塞来的保温杯",
    rarity: "green",
    category: "competition",
    atlasIndex: 21,
    description: "他们不一定理解竞赛，却仍然记得你喝水时总嫌烫。",
    effectText: "首次获得时恢复1点SAN；每局只触发一次。",
    reward: { san: 1 },
    unlock: (context) => (hasEvent(context, "hotel") || context.provincialAttempts.length > 0) && hasTag(context, "父母") ,
  },
  {
    id: "provincial-admission-ticket",
    name: "全国联赛准考证",
    rarity: "white",
    category: "competition",
    atlasIndex: 22,
    description: "照片里的你还不知道，那一年的题会怎样排列。",
    unlock: (context) => context.provincialAttempts.length > 0,
  },
  {
    id: "estimate-scratch",
    name: "写满估分的草稿纸",
    rarity: "white",
    category: "competition",
    atlasIndex: 23,
    description: "同一道题被算进又划掉，直到纸面比答案更不确定。",
    unlock: (context) => context.provincialAttempts.length > 0,
  },
  {
    id: "evaluation-manuscript",
    name: "答案评议稿打印件",
    rarity: "blue",
    category: "competition",
    atlasIndex: 24,
    description: "三周争议被压成几页纸，仍没有替任何人结束等待。",
    unlock: (context) => hasEvent(context, "evaluation-draft"),
  },
  {
    id: "appeal-dossier",
    name: "装订好的申诉材料",
    rarity: "purple",
    category: "competition",
    atlasIndex: 25,
    description: "教材页码、论文图表和一段被反复删改的论证。",
    unlock: (context) => hasTag(context, "省赛-提交申诉"),
  },
  {
    id: "provincial-first-prize",
    name: "省级一等奖证书",
    rarity: "blue",
    category: "competition",
    atlasIndex: 26,
    description: "奖项线和省队线之间，仍然隔着许多名字。",
    unlock: (context) => hasTag(context, "省赛-省一等奖") || context.provincialAttempts.some((attempt) => attempt.finalAward === "省一等奖"),
  },
  {
    id: "provincial-team-notice",
    name: "省队入选通知",
    rarity: "purple",
    category: "competition",
    atlasIndex: 27,
    description: "从这一页开始，实验、全国对手和三个月集训都成为现实。",
    unlock: (context) => hasTag(context, "省赛-进入省队") || context.provincialAttempts.some((attempt) => attempt.enteredTeam),
  },
  {
    id: "lab-gloves",
    name: "一副用皱的实验手套",
    rarity: "green",
    category: "competition",
    atlasIndex: 28,
    description: "手套挡不住所有事故，至少提醒你实验安全不是风味文本。",
    unlock: (context) => context.experimentUnlocked && context.experiment >= 6,
  },
  {
    id: "four-color-lab-book",
    name: "四色实验记录册",
    rarity: "purple",
    category: "competition",
    atlasIndex: 29,
    description: "四个模块都留下了失败、重做和终于稳定的操作。",
    effectText: "首次完成时实验获得极小幅提升；不会重复触发。",
    reward: { experiment: 0.6 },
    unlock: (context) => context.experimentModules.length === 4 && Math.min(...context.experimentModules) >= 12,
  },
  {
    id: "national-badge",
    name: "国赛代表证",
    rarity: "white",
    category: "competition",
    atlasIndex: 30,
    description: "在开幕式的人群里，它证明你属于某一支省队。",
    unlock: (context) => context.nationalAttempts.length > 0 || hasEvent(context, "national-1-opening") || hasEvent(context, "national-2-opening"),
  },
  {
    id: "theory-rank-slip",
    name: "理论考试排名条",
    rarity: "white",
    category: "competition",
    atlasIndex: 31,
    description: "名单在前240处划线。那晚每个人都记得自己在线的哪一边。",
    unlock: (context) => context.nationalAttempts.length > 0,
  },
  {
    id: "national-medal",
    name: "国赛奖牌",
    rarity: "blue",
    category: "competition",
    atlasIndex: 32,
    description: "奖牌比想象中轻，资格与记忆比金属更重。",
    unlock: (context) => context.nationalAttempts.some((attempt) => Boolean(attempt.medal)),
    variant: (context) => {
      const attempts = context.nationalAttempts;
      const bestRank = Math.min(...attempts.map((attempt) => attempt.finalRank ?? 999));
      const medal = bestRank <= 150 ? "金牌" : bestRank <= 240 ? "真银牌" : bestRank <= 260 ? "银牌" : "铜牌";
      return {
        name: `国赛${medal}`,
        rarity: bestRank <= 150 ? "gold" : bestRank <= 240 ? "purple" : "blue",
        description: bestRank <= 50
          ? "金牌与国家集训队资格同时落在手里；它记录结果，不额外增加数值。"
          : `${medal}记录了这一届全国赛场的真实位置；它本身不额外增加数值。`,
      };
    },
  },
  {
    id: "training-team-roster",
    name: "国家集训队五十人名单",
    rarity: "gold",
    category: "competition",
    atlasIndex: 33,
    description: "名单只留下五十行。保送资格已经确定，下一张名单却只会有五个人。",
    unlock: (context) => context.nationalAttempts.some((attempt) => (attempt.finalRank ?? 999) <= 50) || Boolean(context.postCareer?.nationalSelected),
  },
  {
    id: "international-boarding-pass",
    name: "国际赛登机牌",
    rarity: "gold",
    category: "competition",
    atlasIndex: 34,
    description: "最终五人从训练名单中走出来，前往另一张更大的考场。",
    unlock: (context) => Boolean(context.postCareer?.nationalSelected),
  },
  {
    id: "exchanged-wrong-book",
    name: "交换错题本",
    rarity: "blue",
    category: "relationship",
    atlasIndex: 35,
    description: "你们逐渐熟悉的，不只是对方会做什么，还有对方总会错在哪里。",
    unlock: (context) => actionTotal(context, "rival-study-") >= 2,
  },
  {
    id: "repaired-bookmark",
    name: "修好的旧书签",
    rarity: "blue",
    category: "relationship",
    atlasIndex: 36,
    description: "折痕仍在，修补没有假装它从未坏过。",
    unlock: (context) => hasEvent(context, "reserved-fixed-bookmark"),
  },
  {
    id: "earbud-splitter",
    name: "共用耳机转接头",
    rarity: "green",
    category: "relationship",
    atlasIndex: 37,
    description: "两个人听着同一段课，进度条却停在不同的位置。",
    unlock: (context) => hasEvent(context, "shared-earphone"),
  },
  {
    id: "date-receipt",
    name: "便利店约会小票",
    rarity: "white",
    category: "relationship",
    atlasIndex: 38,
    description: "没有电影票和鲜花，只有两杯饮料与四十分钟。",
    unlock: (context) => hasEvent(context, "ordinary-date") || hasEvent(context, "cheap-date"),
  },
  {
    id: "ugly-animal-drawing",
    name: "画得很丑的小动物",
    rarity: "white",
    category: "relationship",
    atlasIndex: 39,
    description: "物种鉴定失败，但你一直没舍得扔。",
    unlock: (context) => hasEvent(context, "playful-prank-note") || hasEvent(context, "birthday"),
  },
  {
    id: "umbrella-name-tag",
    name: "雨伞柄上的姓名贴",
    rarity: "white",
    category: "relationship",
    atlasIndex: 40,
    description: "字迹被雨洇开一点，仍能看出是谁写的。",
    unlock: (context) => hasEvent(context, "-rain") || hasEvent(context, "reserved-quiet-umbrella"),
  },
  {
    id: "emergency-kit",
    name: "塞得过满的应急包",
    rarity: "green",
    category: "relationship",
    atlasIndex: 41,
    description: "药、糖、创可贴和一张写着“先休息”的便签。",
    effectText: "首次获得时恢复少量SAN；同一道具不重复救场。",
    reward: { san: 1.2 },
    unlock: (context) => hasEvent(context, "emergency-kit") || hasEvent(context, "warm-receive-care"),
  },
  {
    id: "unsent-letter",
    name: "没有寄出去的信",
    rarity: "white",
    category: "relationship",
    atlasIndex: 42,
    description: "没有送达的文字并不虚假，只是没有成为两个人共同的现实。",
    unlock: (context) => hasEvent(context, "-confession") && !hasCloseRoute(context, "dating"),
  },
  {
    id: "delivered-letter",
    name: "已经送到手里的信",
    rarity: "blue",
    category: "relationship",
    atlasIndex: 43,
    description: "坦白没有解决所有问题，却结束了一段互相猜测。",
    unlock: (context) => hasCloseRoute(context, "dating") && context.relationships.some((relationship) => relationship.trust >= 30),
  },
  {
    id: "matching-pens",
    name: "一对不同颜色的笔",
    rarity: "blue",
    category: "relationship",
    atlasIndex: 44,
    description: "后来总有人拿错，谁也没有认真换回来。",
    effectText: "首次获得时同学好感小幅提升。",
    reward: { peerFavor: 0.8 },
    unlock: (context) => context.relationships.some((relationship) => ["dating", "friend"].includes(relationship.route) && relationship.bond >= 42),
  },
  {
    id: "friend-promise",
    name: "挚友约定纸",
    rarity: "purple",
    category: "relationship",
    atlasIndex: 45,
    description: "谁先走不动，另一个就负责提醒：还有退路。",
    effectText: "首次获得时恢复1点SAN与0.5点心态。",
    reward: { san: 1, mindset: 0.5 },
    unlock: (context) => hasEvent(context, "friend-vow"),
  },
  {
    id: "shared-lab-record",
    name: "两个人的实验记录",
    rarity: "purple",
    category: "relationship",
    atlasIndex: 46,
    description: "同一页上有两种笔迹，也有一次被重新装订的裂口。",
    unlock: (context) => hasCloseRoute(context, "dating") && context.experiment >= 22 && actionTotal(context, "rival-study-") >= 4,
  },
  {
    id: "ginkgo-leaf",
    name: "压在书里的银杏叶",
    rarity: "purple",
    category: "relationship",
    atlasIndex: 47,
    description: "叶片已经干燥，那次共同抵抗或认真修复仍然鲜明。",
    effectText: "首次获得时心态小幅提升。",
    reward: { mindset: 0.7 },
    unlock: (context) => hasTag(context, "共同抵抗") || hasTag(context, "完成修复谈话") || hasTag(context, "重建边界"),
  },
  {
    id: "after-admission-letter",
    name: "“录取以后再拆”的信",
    rarity: "gold",
    category: "relationship",
    atlasIndex: 48,
    description: "它没有保证永远同行，只证明两个人认真走到了这一页。",
    effectText: "里程碑金色：只扩充后日谈，不额外提供数值。",
    unlock: (context) => context.postCareer?.stage === "ending" && context.relationships.some((relationship) => ["dating", "friend"].includes(relationship.route) && relationship.bond >= 55),
  },
  {
    id: "fantasy-screenshot",
    name: "模糊的群聊截图",
    rarity: "white",
    category: "fantasy",
    atlasIndex: 49,
    description: "一次摸鱼留下的截图，边缘还露着没看完的视频进度条。",
    unlock: (context) => hasEvent(context, "fantasy-join") || hasEvent(context, "fantasy-return-invite"),
  },
  {
    id: "fantasy-invite",
    name: "一次性邀请链接",
    rarity: "green",
    category: "fantasy",
    atlasIndex: 50,
    description: "链接会失效，是否进入却会改变以后遇见的人。",
    unlock: (context) => hasTag(context, "幻想乡:加入"),
  },
  {
    id: "fantasy-errata",
    name: "群友整理的错题勘误",
    rarity: "blue",
    category: "fantasy",
    atlasIndex: 51,
    description: "每一处修正后面，都有人真的去找过原文。",
    unlock: (context) => hasEvent(context, "fantasy-bad-question") || hasTag(context, "追到原文"),
  },
  {
    id: "legendary-notes-zip",
    name: "“传说级笔记”压缩包",
    rarity: "purple",
    category: "fantasy",
    atlasIndex: 52,
    description: "它没有替你学会任何东西，只把前人的弯路留在了这里。",
    unlock: (context) => hasTag(context, "achievement:legendary-notes"),
  },
  {
    id: "fantasy-dinner-receipt",
    name: "群友聚餐的收据",
    rarity: "white",
    category: "fantasy",
    atlasIndex: 53,
    description: "菜名已经看不清，但仍记得有人笑到邻桌换了位置。",
    unlock: (context) => hasEvent(context, "fantasy-restaurant"),
  },
  {
    id: "province-snack-parcel",
    name: "不知道谁寄来的省赛零食",
    rarity: "green",
    category: "fantasy",
    atlasIndex: 54,
    description: "寄件人只写了群昵称，包装里没有押题。",
    unlock: (context) => hasEvent(context, "fantasy-province-eve"),
  },
  {
    id: "retired-voice-transcript",
    name: "退役前辈的语音转写",
    rarity: "blue",
    category: "fantasy",
    atlasIndex: 55,
    description: "退役不是从共同记忆里消失，也不意味着必须继续提供经验。",
    unlock: (context) => hasEvent(context, "fantasy-retired-veteran") || hasEvent(context, "fantasy-retirement-return"),
  },
  {
    id: "fantasy-archive-badge",
    name: "生竞幻想乡档案徽章",
    rarity: "gold",
    category: "fantasy",
    atlasIndex: 56,
    description: "你从被帮助的人，变成了愿意给后来者留下一盏灯的人。",
    effectText: "功能型金色：首次获得时心态+1、社交+0.5；作为难得的群友祝福，为正式联赛与国赛提供极小的运气修正，并扩充成年后日谈。",
    reward: { mindset: 1, social: 0.5 },
    unlock: (context) => hasEvent(context, "fantasy-archive") && hasTag(context, "幻想乡:"),
  },
  {
    id: "retirement-application",
    name: "写到一半的退赛申请",
    rarity: "white",
    category: "future",
    atlasIndex: 57,
    description: "它可能被撕掉、撤回，也可能最终落下所有签字。",
    unlock: (context) => hasTag(context, "已退赛") || hasTag(context, "逆势退赛完成") || hasTag(context, "曾被家长或教练劝退"),
  },
  {
    id: "returned-room-key",
    name: "归还的竞赛教室钥匙",
    rarity: "white",
    category: "future",
    atlasIndex: 58,
    description: "门还在那里，只是你的课表不再需要它。",
    unlock: (context) => hasTag(context, "已退赛") || hasTag(context, "第2次省赛-最终名单确认") && !hasTag(context, "第2次省赛-进入省队"),
  },
  {
    id: "regular-notes",
    name: "重新整理的常规笔记",
    rarity: "green",
    category: "future",
    atlasIndex: 59,
    description: "空缺很多，但第一页不再假装自己从未离开。",
    unlock: (context) => Boolean(context.postCareer?.stage) && actionTotal(context, "regular-study") >= 3,
  },
  {
    id: "homeroom-plan",
    name: "班主任制定的复习表",
    rarity: "blue",
    category: "future",
    atlasIndex: 60,
    description: "计划没有承诺逆袭，只把下一步重新变得可执行。",
    unlock: (context) => ["first-review", "second-review", "mock1", "mock2"].includes(context.postCareer?.stage ?? ""),
  },
  {
    id: "strong-foundation-folder",
    name: "强基材料袋",
    rarity: "blue",
    category: "future",
    atlasIndex: 61,
    description: "里面装着申请表、证明与一条仍需走完的招生路线。",
    unlock: (context) => Boolean(context.postCareer?.admissionRoute && context.postCareer.admissionRoute !== "普通高考"),
    variant: (context) => {
      const route = context.postCareer?.admissionRoute ?? "普通强基";
      const exceptional = route.includes("破格") || route.includes("保送");
      return {
        name: `${route}材料袋`,
        rarity: route.includes("保送") ? "gold" : exceptional ? "purple" : "blue",
        description: "它只记录资格与选择，不额外提供数值奖励。",
      };
    },
  },
  {
    id: "gaokao-ticket",
    name: "高考准考证",
    rarity: "white",
    category: "future",
    atlasIndex: 62,
    description: "有人靠它决定去向，也有人带着已经确定的录取结果来体验生活。",
    unlock: (context) => Boolean(context.postCareer?.gaokaoTotal) || ["gaokao", "ending"].includes(context.postCareer?.stage ?? ""),
  },
  {
    id: "admission-letter",
    name: "大学录取通知书",
    rarity: "gold",
    category: "future",
    atlasIndex: 63,
    description: "正式流程在这里结束。它只具有纪念意义，不提供额外数值。",
    unlock: (context) => context.postCareer?.stage === "ending",
  },
];

export const keepsakeById = Object.fromEntries(
  keepsakeDefinitions.map((keepsake) => [keepsake.id, keepsake]),
) as Record<string, KeepsakeDefinition>;

export function displayKeepsake(
  keepsake: KeepsakeDefinition,
  context: KeepsakeContext,
) {
  return keepsake.variant
    ? { ...keepsake, ...keepsake.variant(context) }
    : keepsake;
}

export function newlyUnlockedKeepsakes(
  context: KeepsakeContext,
  owned: Record<string, KeepsakeRecord>,
) {
  return keepsakeDefinitions.filter(
    (keepsake) => !owned[keepsake.id] && keepsake.unlock(context),
  );
}
