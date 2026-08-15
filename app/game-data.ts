export type GameEffect = {
  san?: number;
  academics?: number;
  familySupport?: number;
  coachFavor?: number;
  peerFavor?: number;
  social?: number;
  mindset?: number;
  reasoning?: number;
  problemSpeed?: number;
  experiment?: number;
  module1?: number;
  module2?: number;
  module3?: number;
  module4?: number;
  pocketMoney?: number;
  competitionTime?: number;
  tags?: string[];
};

export type WeeklyAction = {
  id: string;
  category: "study" | "regular" | "relationship" | "recovery";
  title: string;
  description: string;
  cost: number;
  effects: GameEffect;
  experimentModule?: "module1" | "module2" | "module3" | "module4";
  supplementaryBookEffect?: {
    bookId: string;
    mastery: number;
    retention: number;
    mode: "browse" | "research";
  };
  bookEffect?: {
    bookId: string;
    course?: number;
    notes?: number;
    practice?: number;
    retention?: number;
    lectureSession?: number;
    mode: "lecture" | "notes" | "review-notes" | "practice" | "guided";
  };
};

export type Textbook = {
  id: string;
  title: string;
  shortTitle: string;
  module: "module1" | "module2" | "module3" | "module4";
  discipline: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  baseWeeks: number;
  lectureCap: number;
  maxLectureSessions: number;
  description: string;
};

export type Rival = {
  id: string;
  name: string;
  school: string;
  gradeRelation: "同届" | "上届" | "下届";
  scope: "school-peer" | "school-other" | "province" | "national";
  revealWeek: number;
  specialty: "module1" | "module2" | "module3" | "module4";
  personality: string;
  studyStyle: string;
  hiddenStrength: string;
  revealSocial: number;
};

export type GameChoice = {
  id: string;
  title: string;
  preview: string;
  result: string;
  effects: GameEffect;
};

import type { CausalEventRule } from "./narrative-causality";

export type GameEvent = {
  id: string;
  phase: "opening" | "weekly" | "training" | "exam" | "ending";
  title: string;
  label: string;
  body: string[];
  quote?: string;
  /** 视觉小说式事件：选择前不显示数值后果，结算后再揭示结果。 */
  concealConsequences?: boolean;
  /** 用于人物线与长剧情的版式标记。 */
  visualNovel?: boolean;
  inspiration?: "原创" | "真实经历改写" | "公开资料梗改写";
  /**
   * 开发者文本编辑器使用的稳定归档信息。
   * 运行周数属于 trigger，不应参与编辑器去重；同一事件的家长/NPC
   * 版本通过 variantKey 分开展示和保存。
   */
  archive?: {
    category?: string;
    group?: string;
    clusterKey?: string;
    variantKey?: string;
    variantLabel?: string;
    timingNote?: string;
    /** 同一事件群中的剧情顺序；数值越小越靠前。 */
    order?: number;
  };
  /** 结构化因果关系；用于前置校验、延迟后果和自动断链检查。 */
  causality?: CausalEventRule;
  trigger: {
    earliestWeek: number;
    latestWeek: number;
    requiredTags?: string[];
    blockedTags?: string[];
    /** 某个前置标签出现后至少等待若干周，避免因果事件紧挨着硬触发。 */
    minimumWeeksAfterTags?: Record<string, number>;
    /** 某个前置标签出现后的有效窗口上限；超过后不再补触发。 */
    maximumWeeksAfterTags?: Record<string, number>;
    minSocial?: number;
    minPeerFavor?: number;
    maxPeerFavor?: number;
    minCoachFavor?: number;
    maxSan?: number;
    minRegularNeglectWeeks?: number;
    allowedWeeks?: number[];
    probability?: number;
    requiredActionCounts?: Record<string, number>;
    maximumActionCounts?: Record<string, number>;
  };
  choices: GameChoice[];
};

/*
 * 事件与界面分离。后续私人事件包也使用同一结构：
 * - trigger 决定事件何时出现；
 * - preview 是选择前可见的提示；
 * - effects 交给统一结算器处理；
 * - result 是选择后的叙事文本。
 */
export const openingEvent: GameEvent = {
  id: "opening-selection-notice",
  phase: "opening",
  label: "事件 001 · 那张选拔通知",
  title: "“要不要试试生物竞赛？”",
  body: [
    "班主任把一张薄薄的通知压在桌面上，纸角被风扇吹得轻轻抬起。竞赛教室在实验楼四层，这个暑假将进行第一轮选拔；报名截止日期就在三天后。",
    "你听说那里的人已经开始看大学教材，也听说每年真正走到最后的只有很少一部分。通知背面没有写那些中途离开的人去了哪里，只列着课程时间、指导教师和一句语气笃定的“欢迎有志者参加”。",
  ],
  quote:
    "“先去看看吧。”老师说，“但一旦开始，你会比其他人少很多普通的暑假。”",
  trigger: {
    earliestWeek: 1,
    latestWeek: 1,
  },
  choices: [
    {
      id: "join",
      title: "立刻参加选拔",
      preview: "竞赛时间 +0.4周 · SAN -3 · 教练印象开始形成",
      result: "你在报名表上写下名字，笔尖在最后一画停了一下。第一次推开竞赛教室的门时，里面有人争论一道你完全看不懂的代谢题，教练只抬头问了你的姓名，便递来一份已经翻印得发灰的讲义。傍晚离开时，四层的灯还亮着；你第一次意识到，这张表不是兴趣社团的签到，而是一段会挤进生活中心的长期安排。",
      effects: {
        competitionTime: 0.4,
        san: -3,
        coachFavor: 2,
        tags: ["参加首轮选拔"],
      },
    },
    {
      id: "observe",
      title: "先试听一周",
      preview: "竞赛时间 +0.2周 · 常规能力保持 · 获得更多情报",
      result: "你坐在最后一排，没有领取正式教材，只在借来的讲义背面记下听不懂的词。老师把高中生物拆成生化、细胞、植物、动物、生态和遗传，前排的人已经能接上提问，你却连课程地图都还没看清。下课后教练没有催你报名，只让你一周后再来回答：是被陌生吓退了，还是因为陌生反而想继续。",
      effects: {
        competitionTime: 0.2,
        tags: ["谨慎入门"],
      },
    },
    {
      id: "talk",
      title: "先和家长认真谈谈",
      preview: "家庭支持可能变化 · 社交判定 · 本周不开始教材",
      result: "晚饭后，你把通知压在餐桌中央，从暑假课时讲到两次联赛机会，也坦白自己并不知道能走多远。父母问了培训费用、停课安排和如果失败会不会耽误高考；有些问题你答得具体，有些只能说还没想好。谈话持续到饭菜凉透，最后他们没有替你做决定，只要求你把第一阶段的时间表写出来，再一起判断这条路是否承担得起。",
      effects: {
        familySupport: 3,
        social: 1,
        tags: ["与家长讨论竞赛"],
      },
    },
  ],
};

export const leaveMilestoneEvents: Record<
  "temporary" | "formal" | "mandatory",
  GameEvent
> = {
  temporary: {
    id: "temporary-leave-application",
    phase: "weekly",
    label: "关键选择 · 临时停课申请",
    title: "距离第一次省赛还有大约三个月，教练问你是否申请临时停课。",
    body: [
      "停课会释放大量竞赛时间，早读到晚自习都能围绕四个模块重新分配；代价是常规作业、课堂节奏和年级排名会从日常中迅速退远。教练把申请表放到你面前，班主任则在旁边标出省赛后的返班日期。三个月听起来不长，却足够让同学学完一轮新课。你需要决定，是用这段缺口换一次集中冲刺，还是保留更稳妥但明显更拥挤的双线生活。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: "apply-temporary-leave",
        title: "申请临时停课",
        preview: "竞赛时间增加 · 常规遗忘加快 · 教练好感 +1",
        result: "你把临时停课申请交到年级组，班主任逐项确认缺课范围、作业交接和期中考试安排，最后才在表格上签字。接下来的三个月，原本熟悉的课表会出现大片空白，白天时间被完整交给竞赛训练；与此同时，班级不会停止向前。你获得了集中学习的条件，也第一次具体看见这项选择将留下多少需要日后补回的章节和关系。",
        effects: {
          coachFavor: 1,
          san: -1,
          tags: ["临时停课"],
        },
      },
      {
        id: "keep-regular-class",
        title: "继续正常上课",
        preview: "常规成绩更稳定 · 竞赛自由时间较少",
        result: "你没有立刻申请停课，仍按白天课表完成常规课程，再把竞赛学习放进晚自习与周末。两条路线让最初几周格外拥挤，作业和训练都只能保住重点，却也让你暂时不必用一次选择切断另一种可能。你在日历上圈出第一次省赛作为复盘节点：维持不是无限期拖延，而是一段用真实成绩、睡眠和兴趣判断自己能否继续承受的试行期。",
        effects: { mindset: 1, tags: ["拒绝临时停课"] },
      },
    ],
  },
  formal: {
    id: "formal-leave-application",
    phase: "weekly",
    label: "关键选择 · 正式停课申请",
    title: "高二九月，年级组开始受理竞赛生的正式停课申请。",
    body: [
      "这次申请不同于赛前几周的临时调整，一旦通过，你不会在下一次考试后自动回班。常规课堂、每日作业与校内排名会逐渐离开日常，竞赛教室则成为真正意义上的主场。年级组要求家长签字，也提醒所有人自行承担返班后的知识缺口。表格只有一页，背后却是一段没有现成撤销按钮的生活安排：你获得更完整的训练时间，也会越来越难用普通学生的进度衡量自己。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: "apply-formal-leave",
        title: "提交正式停课申请",
        preview: "竞赛时间大幅增加 · 常规分数快速遗忘",
        result: "班主任在正式停课申请上签下名字，又把需要保留的考试、返班和作业节点逐一写在备注栏。你将课桌里的常规教材搬回宿舍，只留下几本竞赛书和必要文具，原本属于你的桌面很快被班级公共资料占用。手续完成带来连续训练时间，也让离开不再只是口头安排；从这一刻起，错过的每一章都会成为以后需要自行接回的现实缺口。",
        effects: { coachFavor: 2, san: -2, tags: ["正式停课"] },
      },
      {
        id: "delay-formal-leave",
        title: "再维持两个月",
        preview: "继续正常上课 · 十一月仍会统一停课",
        result: "你决定再维持两个月常规课堂，把竞赛停课申请推迟到下一次阶段测试之后。早读、体育课和同桌的闲聊因此仍留在生活里，晚上的训练却被压得更紧。你在日历上写下明确截止日，也把需要观察的成绩与疲惫程度列在旁边。保留普通高中生活不是假装选择不存在，而是用最后一段并行时间确认自己真正愿意放弃什么。",
        effects: { academics: 1, tags: ["推迟正式停课"] },
      },
    ],
  },
  mandatory: {
    id: "mandatory-team-leave",
    phase: "weekly",
    label: "固定事件 · 竞赛队统一停课",
    title: "十一月，教练宣布竞赛队从下周起统一停课。",
    body: [
      "这不再是个人选择。所有人的课桌都要从常规教室搬进竞赛教室，早读、作业和晚自习也随之改成统一安排。班主任提醒你们自己补齐缺下的课程，教练则把新的周计划贴上墙。有人兴奋地收拾教材，有人站在原座位旁迟迟没动。一次集体决定把两种高中生活切开，而你们甚至还来不及验证自己是否适合其中更窄的那条路。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: "accept-mandatory-leave",
        title: "整理课桌，进入全面竞赛状态",
        preview: "正式停课 · 常规遗忘加快 · 教练好感 +1",
        result: "你清空课桌里不再随身使用的常规教材，把试卷、竞赛书和计时器重新按模块摆好，正式进入全面备赛状态。从第二天起，班级铃声不再决定你的日程，同桌偶尔发来的作业照片却提醒那边仍在继续。专注带来更连续的训练，也让退路成本逐周增加；下一次回到原教室时，黑板上的章节和同学间的共同话题都已经向前翻过许多页。",
        effects: { coachFavor: 1, san: -1, tags: ["统一停课"] },
      },
    ],
  },
};

export const trainingMilestoneEvents: Record<"nationalDay" | "winter", GameEvent> = {
  nationalDay: {
    id: "national-day-training-choice",
    phase: "training",
    label: "外培申请 · 高一国庆",
    title: "教练把三份国庆课程通知放到讲台上。",
    body: [
      "南辰学社资历老，教授讲课稳，但题目偶有争议；圆阶生科由年轻老师主讲，论文题多、节奏快，也可能创新过头。",
      "教练更推荐南辰，因为全队容易统一管理。你可以听从安排、选择另一家，或者留校自学。",
    ],
    trigger: { earliestWeek: 12, latestWeek: 12 },
    choices: [
      {
        id: "national-day-nanchen",
        title: "跟随教练去南辰学社",
        preview: "一周集中外培 · 教练好感 +2 · 家庭承担费用",
          result: "教练在报名表上勾好住宿和课程，又把交通、食宿和请假手续逐项核了一遍。几分钟后，课程群发来一张从早上七点排到晚上十点的作息表，连晚间测验后的订正时间都标得清清楚楚。你盯着那张几乎没有空白的表格，第一次具体意识到，所谓封闭培训不只是换个地方听课，而是把整段生活交给一套更紧、更快的节奏。",
        effects: {
          coachFavor: 2,
          familySupport: -0.5,
          tags: ["参加外培", "国庆外培", "国庆外培-南辰", "外培-南辰"],
        },
      },
      {
        id: "national-day-yuanjie",
        title: "改报圆阶生科",
        preview: "论文题与创新题更多 · 教练好感 -1",
          result: "教练提醒你不要只顾着追新题，基础概念一旦松动，再漂亮的技巧也很难落地。你听完仍提交了申请，课程群很快发来三篇英文预读论文，标题里挤满陌生术语。夜里翻到第二篇时，你才明白这次选择并不是简单换一家机构，而是主动把自己放进一套强调阅读、论证和前沿材料的训练方式里。兴奋仍在，只是其中多了一点必须兑现的压力。",
        effects: {
          reasoning: 1,
          coachFavor: -1,
          tags: ["参加外培", "国庆外培", "国庆外培-圆阶", "外培-圆阶"],
        },
      },
      {
        id: "national-day-self-study",
        title: "不外培，留校按自己的计划学",
        preview: "保留自由时间 · 心态 +1 · 错过机构模考",
          result: "国庆的教学楼比平时空得多，走廊里偶尔才传来保安推门的声音。你占住靠窗的位置，把错题、教材和实验记录摊成三堆，终于可以按自己的薄弱处安排一天。安静确实让思路变得完整，却也没有人替你提醒该停下、该换科或该吃饭。傍晚看着完成度并不整齐的计划表，你开始学习一种更难的能力：在没人监督时，自己判断什么值得继续，什么必须及时收束。",
        effects: { mindset: 1, tags: ["拒绝国庆外培"] },
      },
    ],
  },
  winter: {
    id: "winter-training-choice",
    phase: "training",
    label: "外培申请 · 高一寒假",
    title: "寒假只有几周，教练建议拿出其中两周集中外培。",
    body: [
      "这次课程不再只是入门：白天听课，晚上套卷，隔天公布模考排名。培训期间的睡眠和情绪管理会直接影响吸收。",
      "南辰偏重系统复习与传统题，圆阶偏重文献阅读与新题。你仍可以拒绝推荐，参加学校集训。",
    ],
    trigger: { earliestWeek: 28, latestWeek: 28 },
    choices: [
      {
        id: "winter-nanchen",
        title: "参加南辰两周封闭班",
        preview: "系统听课与高频套卷 · 教练好感 +2 · SAN压力较大",
          result: "行李清单的第一项是教材，第二项是插线板，后面还列着计时器、实验服和统一颜色的文件袋。抵达南辰后，教练把房卡逐一发下，宣布全队每天十点半前上交手机，迟到的人第二天负责搬整组资料。你和室友一边整理书桌，一边听隔壁房间争论谁先洗澡。封闭班还没正式开课，生活的边界已经被重新划好：接下来两周，吃饭、睡觉和每一次走神都将围着训练转。",
        effects: {
          coachFavor: 2,
          san: -1,
          tags: ["参加外培", "寒假外培", "寒假外培-南辰", "外培-南辰"],
        },
      },
      {
        id: "winter-yuanjie",
        title: "参加圆阶论文题专题班",
        preview: "思辨收益更高 · 课程深度波动较大",
        result: "你报名论文题专题班后，课程尚未开始，群文件便出现六篇英文论文、术语表和一份没有答案的预习题。第一晚你几乎被材料长度吓退，只能先按图表与摘要建立索引，再标出真正读不懂的方法部分。额外课程没有立即提高分数，却提前揭示接下来需要适应的阅读密度；你也清楚，这份选择会占用原本用于基础复习和恢复的时间。",
        effects: {
          reasoning: 1.5,
          san: -1,
          tags: ["参加外培", "寒假外培", "寒假外培-圆阶", "外培-圆阶"],
        },
      },
      {
        id: "winter-school",
        title: "不去机构，参加学校寒假集训",
        preview: "跟随校内进度 · 花费更少 · 心态 +1",
        result: "你没有去机构封闭班，而是参加学校寒假集训，继续在熟悉的教室、老师和资料体系里学习。课程密度没有外培宣传得那么高，晚上也能按时回家；可空白时段没有现成作息替你推进，哪些章节先补、何时模考都需要自己决定。熟悉环境减少了适应成本，也暴露了自主安排能力：自由不会自动转化为有效学习，必须由每天真实完成的计划填满。",
        effects: { mindset: 1, tags: ["拒绝寒假外培"] },
      },
    ],
  },
};

/*
 * 每周行动同样完全数据化。后续增加教材、培训班或自定义事件时，
 * 只需要继续添加对象，不需要改动结算界面。
 */
export const textbooks: Textbook[] = [
  {
    id: "biochemistry",
    title: "《生物化学教程》",
    shortTitle: "生物化学",
    module: "module1",
    discipline: "生物化学",
    difficulty: 5,
    baseWeeks: 8,
    lectureCap: 48,
    maxLectureSessions: 4,
    description: "代谢网络庞大，是第一模块最耗时间的基础书。",
  },
  {
    id: "molecular",
    title: "《分子生物学》",
    shortTitle: "分子生物学",
    module: "module1",
    discipline: "分子生物学",
    difficulty: 4,
    baseWeeks: 6,
    lectureCap: 50,
    maxLectureSessions: 4,
    description: "从复制转录到调控，机制题和论文题都会反复出现。",
  },
  {
    id: "cell",
    title: "《细胞生物学》",
    shortTitle: "细胞生物学",
    module: "module1",
    discipline: "细胞生物学",
    difficulty: 4,
    baseWeeks: 6,
    lectureCap: 50,
    maxLectureSessions: 4,
    description: "结构、运输与信号通路交织，需要不断回看前文。",
  },
  {
    id: "bioinformatics",
    title: "《生物信息学导论》",
    shortTitle: "生物信息学",
    module: "module1",
    discipline: "生物信息学",
    difficulty: 3,
    baseWeeks: 3,
    lectureCap: 58,
    maxLectureSessions: 4,
    description: "篇幅相对短，但算法和数据库对新手并不友好。",
  },
  {
    id: "botany",
    title: "《植物学》",
    shortTitle: "植物学",
    module: "module2",
    discipline: "植物学",
    difficulty: 3,
    baseWeeks: 5,
    lectureCap: 52,
    maxLectureSessions: 4,
    description: "名词和类群很多，图像记忆与野外经验都很重要。",
  },
  {
    id: "zoology",
    title: "《动物学》",
    shortTitle: "动物学",
    module: "module2",
    discipline: "动物学",
    difficulty: 4,
    baseWeeks: 8,
    lectureCap: 50,
    maxLectureSessions: 4,
    description: "门类繁杂，知识点细碎，容易出现偏怪考法。",
  },
  {
    id: "plant-physiology",
    title: "《植物生理学》",
    shortTitle: "植物生理",
    module: "module2",
    discipline: "植物生理学",
    difficulty: 4,
    baseWeeks: 6,
    lectureCap: 52,
    maxLectureSessions: 4,
    description: "激素、光合与逆境反应，是细节和实验图表的混合战。",
  },
  {
    id: "animal-physiology",
    title: "《动物生理学》",
    shortTitle: "动物生理",
    module: "module2",
    discipline: "动物生理学",
    difficulty: 5,
    baseWeeks: 10,
    lectureCap: 48,
    maxLectureSessions: 4,
    description: "系统多、机制深，常常需要和生化知识交叉。",
  },
  {
    id: "behavior",
    title: "《动物行为学》",
    shortTitle: "动物行为",
    module: "module3",
    discipline: "动物行为学",
    difficulty: 2,
    baseWeeks: 3,
    lectureCap: 70,
    maxLectureSessions: 4,
    description: "书不算厚，真正的难点在实验设计与情境分析。",
  },
  {
    id: "ecology",
    title: "《生态学》",
    shortTitle: "生态学",
    module: "module3",
    discipline: "生态学",
    difficulty: 3,
    baseWeeks: 4,
    lectureCap: 60,
    maxLectureSessions: 4,
    description: "模型、曲线和案例并重，直觉有时会误导你。",
  },
  {
    id: "genetics",
    title: "《遗传学》",
    shortTitle: "遗传学",
    module: "module4",
    discipline: "遗传学",
    difficulty: 5,
    baseWeeks: 5,
    lectureCap: 68,
    maxLectureSessions: 5,
    description: "计算与推理密度很高，做题比单纯阅读更重要。",
  },
  {
    id: "evolution",
    title: "《进化生物学》",
    shortTitle: "进化生物学",
    module: "module4",
    discipline: "进化生物学",
    difficulty: 3,
    baseWeeks: 3,
    lectureCap: 62,
    maxLectureSessions: 4,
    description: "篇幅适中，但要求把遗传、生态和系统发育连起来。",
  },
];

export const weeklyActions: WeeklyAction[] = [
  {
    id: "wrong-questions",
    category: "study",
    title: "复盘错题",
    description: "整理近期错误，分清知识漏洞、审题失误和思路断裂。",
    cost: 1,
    effects: { reasoning: 1.4, san: -1 },
  },
  {
    id: "regular-study",
    category: "regular",
    title: "维持常规课",
    description: "额外完成作业、订正和薄弱科目训练，追上本阶段已经解锁的高中内容。",
    cost: 2,
    effects: { academics: 10, san: -1.5 },
  },
  {
    id: "coach-talk",
    category: "relationship",
    title: "找教练讨论",
    description: "带着具体问题去办公室，也让教练逐渐记住你。",
    cost: 1,
    effects: { coachFavor: 3, social: 1, reasoning: 0.6 },
  },
  {
    id: "peer-time",
    category: "relationship",
    title: "和队友吃点东西",
    description: "交换资料与消息。零花钱减少，但你不再独自消化压力。",
    cost: 1,
    effects: { peerFavor: 3, social: 1, san: 2, mindset: 0.5, pocketMoney: -18 },
  },
  {
    id: "recovery",
    category: "recovery",
    title: "完整休息半天",
    description: "散步、睡觉或做点无关竞赛的事，停止自我审判。",
    cost: 1,
    effects: { san: 3, mindset: 2 },
  },
  {
    id: "slack-off",
    category: "recovery",
    title: "摸鱼",
    description: "刷视频、闲聊或者对着书发呆。恢复SAN很快，但会让长期心态更松散。",
    cost: 1,
    effects: { san: 7, mindset: -1, coachFavor: -1.5 },
  },
];

/*
 * 竞争对手使用虚构姓名与学校。社交越高，玩家得到的情报越完整。
 * 后续可把每届30—45名核心选手按同一结构批量生成。
 */
export const rivals: Rival[] = [
  {
    id: "rival-shen",
    name: "沈砚",
    school: "本校",
    gradeRelation: "同届",
    scope: "school-peer",
    revealWeek: 1,
    specialty: "module1",
    personality: "寡言、非常在意答案的证据链",
    studyStyle: "习惯先读论文图表，再反查教材机制。",
    hiddenStrength: "第一模块突出，材料题稳定性很高。",
    revealSocial: 48,
  },
  {
    id: "rival-tang",
    name: "唐榆",
    school: "本校",
    gradeRelation: "同届",
    scope: "school-peer",
    revealWeek: 1,
    specialty: "module2",
    personality: "健谈，消息灵通，喜欢在群里讨论问题",
    studyStyle: "用大量图谱与分类表记忆动植物学。",
    hiddenStrength: "基础题覆盖面极广，偏题也不容易失分。",
    revealSocial: 38,
  },
  {
    id: "rival-luo",
    name: "罗竞川",
    school: "本校",
    gradeRelation: "上届",
    scope: "school-other",
    revealWeek: 12,
    specialty: "module4",
    personality: "胜负欲强，但愿意和认真准备的人讨论",
    studyStyle: "遗传题一定完整写出假设与验证步骤。",
    hiddenStrength: "遗传计算和进化推理接近省队水平。",
    revealSocial: 50,
  },
  {
    id: "rival-xu",
    name: "许澄",
    school: "本校",
    gradeRelation: "同届",
    scope: "school-peer",
    revealWeek: 1,
    specialty: "module3",
    personality: "看起来松弛，考试时却异常专注",
    studyStyle: "喜欢用真实案例理解行为学与生态模型。",
    hiddenStrength: "第三模块很强，论文阅读速度也很快。",
    revealSocial: 44,
  },
  {
    id: "rival-zhou",
    name: "周蘅",
    school: "本校",
    gradeRelation: "下届",
    scope: "school-other",
    revealWeek: 35,
    specialty: "module1",
    personality: "好奇心很重，不怕问看起来幼稚的问题",
    studyStyle: "听课推进极快，再用错题反复补漏洞。",
    hiddenStrength: "进步速度惊人，后期可能成为强劲对手。",
    revealSocial: 54,
  },
  {
    id: "rival-qiao",
    name: "乔木",
    school: "本校",
    gradeRelation: "同届",
    scope: "school-peer",
    revealWeek: 1,
    specialty: "module2",
    personality: "朴素、耐心，很少参与无意义的争论",
    studyStyle: "教材逐行抄笔记，进度慢但遗忘率很低。",
    hiddenStrength: "动植物基础极扎实，发挥波动很小。",
    revealSocial: 40,
  },
  {
    id: "rival-he",
    name: "何闻野",
    school: "临江第一中学",
    gradeRelation: "同届",
    scope: "province",
    revealWeek: 18,
    specialty: "module3",
    personality: "培训课上很活跃，喜欢主动交换模拟题",
    studyStyle: "用论文和真实调查数据反推生态学模型。",
    hiddenStrength: "生态与行为学强，省级联考排名常在前列。",
    revealSocial: 56,
  },
  {
    id: "rival-lin",
    name: "林峤",
    school: "青屿高级中学",
    gradeRelation: "上届",
    scope: "province",
    revealWeek: 20,
    specialty: "module1",
    personality: "冷静，习惯在考试后精确估分",
    studyStyle: "第一轮看课很快，随后长期刷题维持手感。",
    hiddenStrength: "理论稳定性强，是本省上一届的省队热门。",
    revealSocial: 62,
  },
  {
    id: "rival-song",
    name: "宋令仪",
    school: "望河外国语学校",
    gradeRelation: "同届",
    scope: "province",
    revealWeek: 24,
    specialty: "module4",
    personality: "表达直接，不回避讨论自己的错误",
    studyStyle: "遗传题按题型建档，每月重新做一轮旧错题。",
    hiddenStrength: "遗传与思辨兼强，难题得分能力突出。",
    revealSocial: 60,
  },
  {
    id: "rival-gu",
    name: "顾惟真",
    school: "东海附中",
    gradeRelation: "同届",
    scope: "national",
    revealWeek: 82,
    specialty: "module1",
    personality: "国赛营里总坐在第一排，提问极其具体",
    studyStyle: "大量精读原始论文，并用代码复现图表。",
    hiddenStrength: "全国级理论选手，第一模块和思辨都接近顶尖。",
    revealSocial: 68,
  },
  {
    id: "rival-bai",
    name: "白芷",
    school: "北辰中学",
    gradeRelation: "同届",
    scope: "national",
    revealWeek: 82,
    specialty: "module2",
    personality: "温和但极有边界感，实验时几乎不说废话",
    studyStyle: "长期做观察记录，理论和实验相互验证。",
    hiddenStrength: "实验能力强，动植物基础也几乎没有短板。",
    revealSocial: 66,
  },
  {
    id: "rival-jiang",
    name: "江叙",
    school: "南岭实验学校",
    gradeRelation: "同届",
    scope: "national",
    revealWeek: 84,
    specialty: "module4",
    personality: "竞赛时锋利，离开考场后却很随和",
    studyStyle: "刷题量很大，同时坚持复盘每次随机失分。",
    hiddenStrength: "遗传推理和考场策略成熟，目标是国家队。",
    revealSocial: 72,
  },
];

export const weeklySocialEvents: GameEvent[] = [
  {
    id: "corridor-debate",
    phase: "weekly",
    label: "社交事件 · 走廊里的争论",
    title: "他们正在争论一道没有标准答案的材料题。",
    body: [
      "两名队友把打印出来的论文图表摊在窗台上，一个沿着对照组解释，另一个紧盯异常点，争论已经持续十分钟。题目没有提供标准答案，教练也暂时不在，谁都无法用权威一句话结束讨论。你能听出双方各自抓住了部分证据，也都在某个环节跳过了条件。加入意味着把自己的推理同样暴露给质疑，站在旁边听则能保留安全距离；无论怎样，这场争论都在测试大家是否真能区分结论、推测与尚未排除的解释。",
    ],
    trigger: {
      earliestWeek: 2,
      latestWeek: 104,
      minSocial: 48,
      probability: 0.32,
    },
    choices: [
      {
        id: "join-debate",
        title: "加入讨论，完整说出你的证据链",
        preview: "思辨可能提升 · 同学好感 +2 · SAN -1",
        result: "你加入讨论，没有先报选项，而是从图例、对照组和时间顺序完整讲出自己的证据链。结论说到最后仍有一处推断过度，被队友当场指出；但你提出的另一条反证也迫使所有人重新检查那张图，原本一致的答案随之出现缺口。你没有凭一次发言证明自己正确，却让讨论从人数表决回到可核对的材料，也留下了能够继续修正的推理过程。",
        effects: { reasoning: 2, peerFavor: 2, san: -1 },
      },
      {
        id: "listen-debate",
        title: "站在旁边听完",
        preview: "思辨 +1 · 无额外压力",
        result: "你站在旁边听完两个人从坐标轴、对照组和异常点分别开始的解释，没有急着用自己的答案打断。争论最后仍未统一，其中一人甚至误读了图例；可你记住了两套完全不同的读图顺序，也看见各自在什么位置更容易漏掉条件。回到座位后，你用同一张图重走两遍，发现旁听并非被动围观，它提供了自己独立作答时看不见的思维岔路。",
        effects: { reasoning: 1 },
      },
    ],
  },
  {
    id: "shared-notes",
    phase: "weekly",
    label: "关系事件 · 那份笔记",
    title: "一位队友问你能不能交换最近的教材笔记。",
    body: ["这份笔记不是简单抄书，页边留着你几次改写后的解释、易混概念和教练随口补充的例外，花了不少时间才形成现在的样子。对方手里也有一套你从未见过的周测错题，提出可以互相扫描交换。答应意味着更快接触新材料，也意味着让别人看见你的整理方式、漏洞和私人批注；拒绝则能保住边界，却可能让一段本可互惠的合作停在试探阶段。"],
    trigger: {
      earliestWeek: 3,
      latestWeek: 104,
      minPeerFavor: 18,
      probability: 0.26,
    },
    choices: [
      {
        id: "exchange-notes",
        title: "互相交换",
        preview: "同学好感 +4 · 思辨 +1",
        result: "你们交换各自整理的笔记，本以为只是补几处漏写内容，翻开后却发现重点几乎没有重合：你记录机制和例外，对方则保留图表、老师的口头提醒与常见误区。最初的意外很快变成一场逐页解释，双方也各自删掉几段其实只是机械抄写的文字。交换没有制造一份绝对完整的标准笔记，却让你们第一次看见同一堂课如何被不同注意力重新组织。",
        effects: { peerFavor: 4, reasoning: 1, tags: ["交换笔记"] },
      },
      {
        id: "decline-notes",
        title: "委婉拒绝",
        preview: "SAN +1 · 同学好感 -2",
        result: "你先肯定对方愿意交换资料，却说明这份笔记包含自己长期整理的方法和私人批注，现在不适合整本复制，只愿意挑相关章节一起讨论。对方说没关系，收回了准备好的U盘，之后的训练也照常进行；可接下来几次资料流转时，教室里的消息明显绕开了你。你保住了劳动成果和决定权，也感到拒绝即使足够委婉，仍可能让关系短暂降温。",
        effects: { san: 1, peerFavor: -2, tags: ["拒绝交换笔记"] },
      },
    ],
  },
  {
    id: "rival-study-invite",
    phase: "weekly",
    label: "竞争事件 · 临时约题",
    title: "你认识的对手发来一套题：“今晚对答案吗？”",
    body: ["对方刚好擅长你最近不太顺手的模块，发来的题目里有几道仅看标题就让你犹豫。邀请写得随意，像只是睡前顺手对一遍答案，可你知道真正开始讨论后，解题速度、知识缺口和判断习惯都会暴露出来。共同学习可能换来比独自订正更快的进步，也可能让一个潜在对手掌握你的弱点。屏幕上的“今晚有空吗”只是一句话，背后却同时包含合作、比较与尚未建立的信任。"],
    trigger: {
      earliestWeek: 5,
      latestWeek: 104,
      minSocial: 56,
      minPeerFavor: 24,
      probability: 0.22,
    },
    choices: [
      {
        id: "accept-rival",
        title: "接受邀请",
        preview: "思辨 +2 · 同学好感 +3 · SAN -2",
        result: "你接受对方共同对题的邀请，先各自保留答案，再轮流解释最不确定的判断。争论中，你们互相挑出三处思维漏洞：一处漏看限定词，一处把相关当因果，还有一处证据不足。谁都没有在口头上认输，结束时却各自修改了原答案。竞争没有被合作稀释，反而因为必须说清理由变得更扎实；两份答案也都比独自坚持时完整。",
        effects: { reasoning: 2, peerFavor: 3, san: -2 },
      },
      {
        id: "skip-rival",
        title: "今晚先休息",
        preview: "SAN +2",
        result: "你没有继续回复对手发来的追问，只说明今晚需要休息，约好第二天再交换剩余思路，随后关掉聊天框和提示音。躺下后，你仍会想象对方是否已经解出最后一问，也担心自己会因此少掌握一点信息；可第二天醒来时，头脑比连续几晚熬夜后清楚许多。竞争不会因为一个晚上停下，稳定睡眠却决定你明天是否还有能力真正参与。",
        effects: { san: 2 },
      },
    ],
  },
  {
    id: "notes-returned",
    phase: "weekly",
    label: "事件链 · 笔记的回音",
    title: "那份交换出去的笔记回来了，夹着几张密密麻麻的便签。",
    body: ["对方没有只说“看完了”，而是在页边夹回几张密密麻麻的便签，逐句标出两处可能写错的机制，并附上一道恰好能检验其中差异的旧题。一处质疑很快能由教材确认，另一处却牵涉不同版本的表述。你原本以为交换只是资料数量上的互惠，现在才发现别人真正阅读你的思路，会带来比借出笔记更强烈的不安，也可能替你发现独自复习时永远看不见的盲点。"],
    trigger: {
      earliestWeek: 6,
      latestWeek: 104,
      requiredTags: ["交换笔记"],
      minimumWeeksAfterTags: { "交换笔记": 2 },
      maximumWeeksAfterTags: { "交换笔记": 12 },
      minPeerFavor: 20,
      probability: 0.42,
    },
    choices: [
      {
        id: "check-comments",
        title: "逐条核对批注",
        preview: "思辨 +2 · 同学好感 +2 · SAN -1",
        result: "你没有因为批注语气直接接受或反驳，而是把每一条都重新对照题干、教材和自己的推理。其中一条来自对方误读你的符号，你写下说明后便能排除；另一条却准确指出你跳过了关键前提。逐条核对花掉整个课间，却让交换笔记不再变成礼貌收藏。你保住了自己的判断，也真正接住了别人愿意指出漏洞的那部分帮助。",
        effects: { reasoning: 2, peerFavor: 2, san: -1, tags: ["笔记互助"] },
      },
      {
        id: "thank-only",
        title: "先道谢，等有空再看",
        preview: "同学好感 +1",
        result: "你先认真道谢，没有为了表现热情当场翻完整本笔记，只把那张写着补充说明的便签夹进正在学习的章节。几天后真正用到相关内容时，你按便签留下的页码核对，又把自己的疑问写在背面还给对方。回应虽然迟了一点，却不是敷衍；一次资料交换因此有了第二轮讨论，也让关系没有停在“收下”和“谢谢”两个礼貌动作上。",
        effects: { peerFavor: 1 },
      },
    ],
  },
  {
    id: "quiz-collapse",
    phase: "weekly",
    label: "训练事件 · 小测失常",
    title: "竞赛小测的分数比你预想中低了很多。",
    body: ["错题里既有教材边角处才出现的偏题，也有你昨天刚抄进笔记、今天却仍无法独立调用的内容。分数写在卷首并不算灾难，刺眼的是几种失分混在一起：陌生、遗忘、读题跳步，还有自以为掌握后的草率。周围已经有人开始互报答案，你却需要先决定怎样解释这张卷子。把一切归咎于题偏会轻松一些，逐项拆开则可能迫使你承认，投入的时间并没有自动变成稳定能力。"],
    trigger: {
      earliestWeek: 10,
      latestWeek: 72,
      requiredActionCounts: { practice: 2 },
      probability: 0.2,
    },
    choices: [
      {
        id: "audit-errors",
        title: "当晚把失分原因全部分类",
        preview: "思辨 +2 · SAN -3 · 教练好感 +1",
        result: "你在当晚把失分按知识空白、审题偏差、时间不足和临场动摇逐一归类，又标出哪些错误在过去卷子里重复出现。原本密集的红叉被拆成几组可以安排的任务，其中两项甚至不需要增加题量，只要调整作答顺序。分数当然没有因此改变，难受也没有立刻消失；但这张卷子从一句“我不够好”的打击，变成了下一周可以逐格修补的漏洞地图。",
        effects: { reasoning: 2, san: -3, coachFavor: 1 },
      },
      {
        id: "put-away",
        title: "先把卷子收起来",
        preview: "SAN +2 · 心态 +1",
        result: "你没有在成绩刚发下来时强迫自己立刻订正，而是把卷子收进文件夹，在日历上写明第二天晚自习前重新打开。当天剩余时间里，失分仍会偶尔闯进脑中，却不必一边发抖一边给自己下结论。第二天期限到来时，你确实取出卷子，从第一道能看懂的错误开始。逃避和暂缓表面都像合上纸页，真正的区别是你是否为回来留下具体入口。",
        effects: { san: 2, mindset: 1 },
      },
    ],
  },
  {
    id: "coach-order-question",
    phase: "weekly",
    label: "教练事件 · 学习顺序",
    title: "教练要求全队暂时放下手中的书，跟着统一进度走。",
    body: ["你原本已经按自己的薄弱模块排好一周，教练却要求全队暂时放下手中的书，从同一章、同一套术语和同一份练习重新开始。几名进度更快的人明显不耐烦，基础薄弱的队友则终于能跟上讨论。教练认为这一轮统一课程必须先建立共同语言，否则之后的小组训练只会反复卡在概念差异上。你要在个人效率和团队协作之间做选择，也要判断所谓“走得快”是否真的建立在足够牢固的地面上。"],
    trigger: {
      earliestWeek: 12,
      latestWeek: 48,
      minCoachFavor: 8,
      probability: 0.24,
    },
    choices: [
      {
        id: "follow-order",
        title: "照安排走，并主动完成课后题",
        preview: "教练好感 +3 · 思辨 +1 · SAN -2",
        result: "你先完整跟随教练的统一安排，没有私下跳页，也主动完成了课后题来检验这套顺序。部分章节对你而言重复，另一些重点却与个人判断完全不同，尤其补上了此前忽略的考查口径。统一进度没有神奇地变成最适合你的路线，却让你看清教练为什么在这个阶段取舍内容。下一轮自行安排时，你可以有证据地调整，而不是只凭不耐烦反对。",
        effects: { coachFavor: 3, reasoning: 1, san: -2, tags: ["信任教练安排"] },
      },
      {
        id: "keep-own-plan",
        title: "课上跟随，课后维持自己的顺序",
        preview: "心态 +1 · 教练好感 -1",
        result: "课堂上你跟随教练统一顺序，完整记下这一轮训练强调的框架，没有当着全队争论谁的安排更合理。课后，你仍按个人复习表补回最薄弱的章节，并把两套进度的重合处重新标记。这样的折中让你理解教练判断重点的依据，也保住了此前建立的节奏；代价是必须更诚实地删去重复任务，否则所谓兼顾很快又会变成另一种超载。",
        effects: { mindset: 1, coachFavor: -1, tags: ["保留自主路线"] },
      },
    ],
  },
  {
    id: "training-group-chat",
    phase: "weekly",
    label: "社交事件 · 培训群邀请",
    title: "外校同学把你拉进了一个省内选手的小群。",
    body: ["群文件里不断出现各校周测、讲义和手写订正，聊天区却同样流传着真假难辨的排名消息与“内部口径”。几个发言者的名字你在联考榜上见过，现实中的竞争因此突然有了头像和语气。这里可能让你更快接触省内信息，也可能让每一次沉默都被理解为藏题。你需要判断哪些资料能够核验、哪些消息只是在制造焦虑，以及自己愿意用多少真实水平换取进入这个圈子的信任。"],
    trigger: {
      earliestWeek: 18,
      latestWeek: 80,
      minSocial: 58,
      minPeerFavor: 22,
      probability: 0.3,
    },
    choices: [
      {
        id: "join-group",
        title: "加入并主动交换一套题",
        preview: "社交 +2 · 同学好感 +2 · 解锁省内关系",
        result: "你加入外校同学的讨论，并主动拿出一套来源清楚、已经做过的题作为交换，而不是只下载别人分享的文件。很快有人补来另一版本解析，也有人指出其中一道题的答案存在争议。资料流动的速度远超过本校内部，你第一次看见教室之外那张正在形成的信息网络；同时也明白，要在其中长期获得信任，必须持续说明来源、反馈勘误并贡献自己的整理。",
        effects: { social: 2, peerFavor: 2, tags: ["进入省内选手群"] },
      },
      {
        id: "mute-group",
        title: "加入，但先设置免打扰",
        preview: "保留情报入口，也保护注意力",
        result: "你加入资料群后先阅读公告，把真正需要的文件保存到分类目录，随即关闭消息预览并设定每天只检查两次。群里仍不断出现新卷、传闻和临时讨论，你偶尔会担心错过重要内容，却没有再被每个红点拖走整晚。入口被保留下来，信息也能按需要进入计划；你第一次意识到，接入网络不等于必须把所有人的紧迫感实时搬进自己的桌面。",
        effects: { san: 2, tags: ["进入省内选手群"] },
      },
    ],
  },
  {
    id: "answer-key-conflict",
    phase: "weekly",
    label: "训练事件 · 答案和解析各说各话",
    title: "这道题的答案选C，但解析从头到尾都在论证D。",
    body: ["群里已经滚过几十条消息，截图、教材原句和情绪化的感叹混在一起。有人主张考试只认官方答案，先照着改最省时间；也有人坚持解析的论证方向与选项完全相反，不应假装没有矛盾。题目本身只占一行，争议却牵出两种训练习惯：把规则当作需要适应的现实，或把证据当作不能放弃的底线。你若加入，就得拿出能够被别人核对的理由，而不只是再投一票。"],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 8,
      latestWeek: 80,
      minSocial: 42,
      requiredActionCounts: { practice: 2 },
      probability: 0.24,
    },
    choices: [
      {
        id: "trace-source",
        title: "查教材和论文，把证据贴进群里",
        preview: "思辨 +2 · 同学好感 +2 · SAN -2",
        result: "你没有继续用直觉争论，而是查回教材章节和论文原图，把适用条件、图注和解析遗漏的限定逐项贴进群里。讨论持续到很晚，仍没人能确定命题人原本想选哪一项，也无法保证正式评分会更改；但至少所有人确认现有解析无法由证据推出。问题从“谁记得更像答案”变成了可复查的命题缺陷，之后的申诉也终于有材料可用。",
        effects: { reasoning: 2, peerFavor: 2, san: -2, tags: ["质疑错题"] },
      },
      {
        id: "memorize-key",
        title: "先记机构答案，考试再说",
        preview: "SAN +1 · 心态 -1",
        result: "你先把机构给出的答案记在题号旁，保证面对相同口径时知道如何作答，同时又画下一个醒目的问号，没有强迫自己把疑惑改写成理解。考试策略因此暂时与知识判断分开：短期内你能适应评分，之后仍需要回到教材和证据核验。这个问号不是第一次出现，也不会是最后一次；重要的是它没有在抄下标准答案时被顺手擦掉。",
        effects: { san: 1, mindset: -1 },
      },
    ],
  },
  {
    id: "dense-slides",
    phase: "training",
    label: "培训事件 · 一页PPT塞进了半本书",
    title: "投影上的字已经小到后排完全看不清。",
    body: ["投影里的图片彼此覆盖，几条不同颜色的箭头穿过六段小字，坐在后排的人连图例都只能靠猜。老师却用激光笔在整页来回画圈，说这里没有一句可以略过。前排仍在努力拍照，后排已经有人把同学肩膀当作临时三脚架。你可以继续追赶这张信息墙，也可以冒着打断课堂的尴尬要求老师停一下；真正的问题不是肯不肯吃苦，而是这种呈现方式还剩多少有效学习。"],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 9,
      latestWeek: 60,
      probability: 0.18,
    },
    choices: [
      {
        id: "rebuild-slide",
        title: "课后自己重画一版逻辑图",
        preview: "对应模块增长 · 思辨 +1 · SAN -2",
        result: "课后你没有照抄原板书，而是凭记忆重画逻辑图，把每条因果关系都改成能够独立说明的短句。重画到一半，许多看似重要的旁支无法接回主题，你才发现真正可用于解题的信息只有三条，其余大多是老师漫长的学术恩怨和历史背景。那些故事并非毫无价值，却不该与核心机制混在同一层级；你的笔记也因此从记录现场变成了重新组织理解。",
        effects: { module2: 1.5, reasoning: 1, san: -2 },
      },
      {
        id: "borrow-clear-notes",
        title: "找前排同学借清楚的笔记",
        preview: "社交 +1 · 同学好感 +1",
        result: "你在课间找到前排同学，说明自己刚才被投影反光挡住了几页，希望借笔记核对。对方没有只递来本子，还把当时拍下的板书原图一并发给你，并标出讲师口头补充却没写在幻灯片上的两处条件。你当晚重新整理时才发现，真正缺失的不是字迹清楚与否，而是那几分钟里自己已经跟丢的推理顺序；这份借来的记录让课程重新接上。",
        effects: { social: 1, peerFavor: 1 },
      },
    ],
  },
  {
    id: "microphone-failure",
    phase: "training",
    label: "培训事件 · 话筒罢工",
    title: "讲座开始十分钟，话筒只剩下断断续续的电流声。",
    body: ["老师没有察觉扩音设备已经失灵，仍沿着板书越讲越快，情绪最激动处只剩断续电流声。前排勉强能听见，后排只能根据口型、箭头和周围人的笔记猜测哪一句是结论。有人举手示意却没被看到，也有人索性开始自习。讲座内容也许重要，但沉默地坚持下去只会让位置决定收获。你得选择是当场提醒、设法换位，还是接受今天只能从残缺信息里拼出重点。"],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 12,
      latestWeek: 76,
      minSocial: 40,
      probability: 0.14,
    },
    choices: [
      {
        id: "move-forward",
        title: "和队友一起搬到前排",
        preview: "社交 +1 · 教练好感 +1 · SAN -1",
        result: "你和队友抱着书从后排挪到仅剩空隙的前排，桌面窄得只能叠放讲义，老师的翻页声却终于不再盖过解释。课程中段，讲师顺口补充了一条没有写进PPT的重要机制，恰好解释此前两页的矛盾。你们相视一眼同时记下，也更确定听课位置确实会改变信息质量。搬动带来拥挤和注视，却让这堂原本逐渐跟丢的课重新接上。",
        effects: { social: 1, coachFavor: 1, san: -1 },
      },
      {
        id: "self-study-back",
        title: "留在后排按讲义自学",
        preview: "心态 +1 · 对应模块小幅提升",
        result: "你留在后排，放弃追赶已经听不懂的口头推导，改为按照讲义目录逐段自学，并在每个断点旁记下待询问的问题。前排的互动与你无关，这堂课最终更像一场安静自习；进度没有讲师预设得快，却比一边假装听懂一边抄满纸更可靠。下课时你仍缺少几处解释，但已经能准确说出哪里不会，效率也没有最初想象中糟。",
        effects: { mindset: 1, module1: 0.8 },
      },
    ],
  },
  {
    id: "unexpected-classroom-animal",
    phase: "weekly",
    label: "校园事件 · 不请自来的观察材料",
    title: "暴雨之后，教室里闯进了一只所有人都想鉴定的动物。",
    body: ["讲课被迫暂停，那只湿漉漉的小动物贴着墙根移动，既让人好奇，也随时可能被一群鞋逼进角落。有人迅速翻动物学教材，有人举着手机寻找拍摄角度，还有人仅凭第一眼就开始争论它该分到哪一科。老师试图维持秩序，却也忍不住回头看。一次偶然闯入把课堂知识变成了现场对象，同时暴露出观察与围观的区别：若想鉴定，就必须先保证动物安全，再记录真正有用的特征。"],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 15,
      latestWeek: 60,
      minSocial: 44,
      probability: 0.12,
    },
    choices: [
      {
        id: "identify-animal",
        title: "加入鉴定，并负责查检索表",
        preview: "第二模块 +1.5 · 社交 +2 · SAN +1",
        result: "你加入大家的现场鉴定，负责翻检索表、核对形态特征，并提醒每一步都保留无法确认的分支。样本姿态和光线让几个特征始终模糊，最终结论未必正确，教练也要求不要随意捕捉；可当术语真正对应到眼前的翅、足和触角时，你第一次觉得动物学从书页里爬了出来。一次不完美观察让分类方法获得了触感，也留下继续核实的理由。",
        effects: { module2: 1.5, social: 2, san: 1 },
      },
      {
        id: "keep-distance",
        title: "保持距离，负责打开门窗",
        preview: "心态 +1 · 同学好感 +1",
        result: "你没有围上去抓那只突然闯进教室的小动物，只提醒同学后退，负责打开门窗并留出通往走廊的路线。几分钟后，它自行越过门槛，消失在走廊尽头，没有人受伤，也没有设备被碰倒。课堂恢复后，大家仍用整节课猜测它的种类和来处；你虽然没有获得近距离观察，却让一次意外停在安全、可以日后查证的范围。",
        effects: { mindset: 1, peerFavor: 1 },
      },
    ],
  },
  {
    id: "training-hidden-phone",
    phase: "training",
    label: "外培事件 · 熄灯后的屏幕",
    title: "查寝结束后，室友从枕头下面摸出了手机。",
    body: [
      "教练规定十点半统一收手机，查寝时也亲眼确认过桌面；室友却从枕头下摸出备用机，屏幕上正跳着外培群对当天争议题的新解释。几条消息似乎已经接近关键，明早又可能被更多聊天淹没。室友把亮度调到最低，问你要不要一起看，走廊里同时传来老师巡查的脚步声。此刻争的并不只是十分钟信息差，还包括睡眠、纪律和你愿不愿意与室友共同承担被发现的后果。",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      requiredTags: ["参加外培"],
      probability: 0.8,
    },
    choices: [
      {
        id: "phone-sleep",
        title: "拒绝，戴上耳塞睡觉",
        preview: "SAN +2 · 心态 +1 · 可能错过群消息",
        result: "你拒绝继续熄灯后的争题，把耳塞戴好并说明明早愿意听结论。第二天起床时，群里已经多出几十条消息，你确实漏掉了两种临时解释，其中一条后来还被证明有用；可早课开始后，你是少数能持续跟上讲师推导的人。选择睡觉没有让信息损失归零，只是把有限注意力从深夜即时参与，换到了第二天真正需要工作的时段。",
        effects: { san: 2, mindset: 1 },
      },
      {
        id: "phone-discuss",
        title: "只看十分钟争议题",
        preview: "思辨 +1 · SAN -2 · 被查到会影响教练好感",
        result: "你原本只想给争议题十分钟，却在补条件、画示意图和查教材之间一再延长计时。等最后一个矛盾被理顺，墙上的分针已经走过四十分钟，原定的两页复习几乎没有动。你确实弄懂了那道题，也恰好听见巡查老师的脚步在门口停了一下。把草稿迅速压进书下时，你意识到这次收获和冒险来自同一个决定：你赢回了一个解释，却也差点把整晚的安排和纪律一起押上去。",
        effects: { reasoning: 1, san: -2, coachFavor: -1, tags: ["外培熬夜看手机"] },
      },
    ],
  },
  {
    id: "training-bad-question-rage",
    phase: "training",
    label: "外培事件 · 痛骂烂题",
    title: "模考结束，整层楼都在骂最后那道题。",
    body: [
      "题干漏掉了一个决定结论的关键条件，解析却沿着单一路径推导，仿佛缺口从未存在。走廊里有人要求机构直接删题，有人拿着名单统计不同答案，还有人把怒气延伸到整套试卷。你也因失分恼火，却看见几种合理解释正被情绪挤成阵营。若想让争议真正被处理，就得把“题很烂”的共识变成可核对的条件、反例和评分影响；若只想发泄，这一晚也足够让所有人暂时站在同一边。",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      requiredTags: ["参加外培"],
      probability: 0.75,
    },
    choices: [
      {
        id: "bad-question-appeal",
        title: "整理证据，向命题组正式反馈",
        preview: "思辨 +2 · 社交 +1 · SAN -1",
        result: "你把题干缺失条件、不同答案版本和教材依据整理成一页证据，删去纯粹发泄的句子后交给命题组。晚上机构终于发出更正说明，承认该题无法唯一作答，并宣布从排名中剔除。题目本身没有因此变得合理，已经浪费的时间也不会回来；但你的反馈让所有参赛者不再为同一处命题错误承担分差，也留下了一次正式纠错的记录。",
        effects: { reasoning: 2, social: 1, san: -1, tags: ["外培申诉成功"] },
      },
      {
        id: "bad-question-rant",
        title: "在群里跟着痛骂半小时",
        preview: "SAN +2 · 心态 -1 · 无学习收益",
        result: "你在群里跟着大家把题目、解析和命题人从头骂了一遍，几条夸张的比喻很快获得满屏回应。半小时后，堵在胸口的火气确实散了不少，你也终于不再反复计算那道失分。第二天教练把完整聊天记录投到屏幕上，要求所有人区分证据与宣泄。你没有因批评否认题目存在问题，却不得不承担公开表达留下的语气和关系后果。",
        effects: { san: 2, mindset: -1, coachFavor: -1 },
      },
    ],
  },
  {
    id: "training-schedule-conflict",
    phase: "training",
    label: "外培事件 · 作息纠纷",
    title: "教练要求全队早起加练，机构课程却要上到晚上十点。",
    body: [
      "机构课程要上到晚上十点，洗漱和订正后真正入睡往往更晚；教练却希望全队六点半起床，再刷一套小题保持手感。自律最强的队友认为两周咬牙就能过去，另一些人则提醒上午已有学生在课堂上点头。教练没有立刻拍板，而是让你们先拿出统一意见。讨论表面在争一小时训练，实际上是在决定疲劳该由谁承担、个人差异能否被允许，以及团队纪律是否只能用完全相同来证明。",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      requiredTags: ["参加外培"],
      minCoachFavor: 5,
      probability: 0.7,
    },
    choices: [
      {
        id: "schedule-negotiate",
        title: "拿课程表协商取消晨练",
        preview: "社交 +1 · 心态 +1 · 教练好感视沟通而定",
        result: "你没有在训练现场和教练比谁声音更大，而是拿出课程表、睡眠记录和早课状态，说明每日晨练怎样影响文献课与恢复。教练起初认为这是逃避体能，最后同意改成隔天晨练，并在两周后复查效果。并非所有队员都满意，有人觉得统一纪律被削弱；但作息终于由可检查的安排决定，而不是由谁更能忍、谁更敢反对来决定。",
        effects: { social: 1, mindset: 1, coachFavor: 0.5 },
      },
      {
        id: "schedule-obey",
        title: "服从安排，早晚都练",
        preview: "教练好感 +2 · SAN -5 · 学习效率可能下滑",
        result: "你服从早晚都练的统一安排，晨练、操作和晚间订正一项不少地完成，打卡表上没有留下空格。第三天文献课开始后，持续疲劳终于让注意力断开，讲师解释最关键图表时你只记下一半箭头。全勤证明了执行力，却没有保证每个时段都有效；当训练数量开始挤压理解能力时，继续完成任务和真正吸收内容已经不再是同一件事。",
        effects: { coachFavor: 2, san: -5, mindset: -1 },
      },
    ],
  },
  {
    id: "training-mock-ranking",
    phase: "training",
    label: "外培事件 · 模考排名",
    title: "机构把模考排名投在大屏幕上，教室突然安静。",
    body: [
      "大屏幕把不同省份、不同年级的选手压进同一张表，姓名后只剩总分和名次，没有标出各自学了多久、课程体系或参赛目标。它当然不等于省赛结果，题型和竞争范围都不同，却仍让教室在几秒内安静下来。有人立刻拍照，有人故作轻松地找自己，也有人低头收拾卷子。接下来一整天，提问、吃饭和走路速度都像被那张表轻轻推了一下，你需要决定怎样使用这份不完整却极具煽动性的比较。",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      requiredTags: ["参加外培"],
      probability: 0.85,
    },
    choices: [
      {
        id: "ranking-audit",
        title: "只记录分科排名和失分类型",
        preview: "思辨 +1.5 · 心态 +1 · SAN -1",
        result: "你没有把总排名贴在桌前反复观看，只抄下各模块位置、失分类型和与个人基线的变化，再把原榜单折进书包。这样做没有抹去落后或领先带来的情绪，却阻止一个综合名次替所有问题下结论。分科差距被转写成下周能执行的任务：哪章需要回教材、哪类题该限时、哪次失误只是偶然，都有了不同处理方式。",
        effects: { reasoning: 1.5, mindset: 1, san: -1 },
      },
      {
        id: "ranking-compare",
        title: "把熟悉的名字全部圈出来比较",
        preview: "获得对手情报 · SAN -3 · 心态 -1",
        result: "你把榜单里熟悉的学校和名字全部圈出，逐一比较他们最近几次名次变化，还从群聊拼出几个人的训练路线。到熄灯时，你已经能背下十几个潜在对手，却仍说不清自己明天最该补哪一章。那些信息满足了对竞争格局的好奇，也放大了无法控制的部分；当计划表依旧空白时，你才发现认识更多名字并不自动等于更了解自己的下一步。",
        effects: { social: 1.2, san: -3, mindset: -1, tags: ["沉迷外培排名"] },
      },
    ],
  },
  {
    id: "training-professor-overrun",
    phase: "training",
    label: "外培事件 · 教授拖堂",
    title: "老教授从一个代谢通路讲到自己的博士论文，已经拖堂四十分钟。",
    body: [
      "老教授从一个代谢通路讲到自己当年的博士论文，语气越来越兴奋，黑板也被新出现的旁支填满。内容确实有趣，甚至让几名原本疲惫的学生重新抬头，却已经远远超出考试需要。晚饭时间过去，晚测被迫顺延，教练在门外反复看表又不好直接打断。你既舍不得一个难得的深讲，也能感觉整套集训安排正在被拖堂挤压；知识的价值并不会自动替大家支付饥饿和后续疲劳。",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      requiredTags: ["外培-南辰"],
      blockedTags: ["寒假外培-圆阶"],
      probability: 0.65,
    },
    choices: [
      {
        id: "professor-listen",
        title: "继续听，并把可考内容单独标记",
        preview: "第一模块 +课程进度 · SAN -2",
        result: "你决定继续听下去，却在笔记上另开一栏，只记录与考查范围相关的结论、条件和图表。讲师讲了一个非常漂亮的实验故事，过程远超当前需要，你仍完整听见其思路，同时把真正能够迁移到题目里的三条结论圈出。课程没有被粗暴压缩成考点，也没有让叙事淹没复习目标；你第一次较清楚地区分了值得欣赏的知识与眼下必须掌握的内容。",
        effects: { reasoning: 1, san: -2 },
      },
      {
        id: "professor-leave",
        title: "按原计划离场参加晚测",
        preview: "教练好感 +1 · 可能冒犯讲师",
        result: "你按原计划在晚测前收好讲义，从最后一排安静离场，没有因为教授临时延长内容而放弃既定安排。门边的教练看见你，点头确认集合时间；讲台上的教授仍沉浸在自己的推导里，似乎根本没有注意。你错过了课程最后一段故事，也保住了可比较的限时测试。离场并非对讲座价值的否定，而是承认同一晚无法完整容纳所有重要事项。",
        effects: { coachFavor: 1, mindset: 0.5 },
      },
    ],
  },
  {
    id: "training-paper-too-deep",
    phase: "training",
    label: "外培事件 · 创新过头",
    title: "圆阶的文献题引用了一个你连标题都读不懂的前沿模型。",
    body: [
      "题干引用的前沿模型连标题都充满陌生缩写，图例也没有给出足够解释。老师认为这正是训练选手从材料中提取信息，不需要事先掌握背景；后排却有人怀疑命题者只是想展示自己最近读过什么。你在两种判断之间来回：陌生不等于不合理，前沿也不能替代完整条件。真正值得检验的是，题目能否让一个没有接触原论文的人仅凭所给材料作答，而不是谁更能忍受被术语吓住。",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      requiredTags: ["外培-圆阶"],
      blockedTags: ["寒假外培-南辰"],
      probability: 0.7,
    },
    choices: [
      {
        id: "paper-extract",
        title: "忽略术语，只提取图表中的可证结论",
        preview: "思辨 +2.5 · SAN -2",
        result: "面对陌生模型，你暂时放弃逐个理解术语，只标出坐标、处理组、变化方向和材料明确支持的比较，再把无法证明的推断留空。交卷时你仍说不清模型全貌，也知道有一部分信息没有利用；但评分结果显示，大多数能由图表直接支持的判断都被保住。这个策略不是理解的替代品，却在时间有限时把“完全不会”拆成仍可获得的证据分。",
        effects: { reasoning: 2.5, san: -2 },
      },
      {
        id: "paper-dismiss",
        title: "把它归为机构炫技题",
        preview: "SAN +1 · 错过陌生题训练",
        result: "你把这道复杂材料题归为机构用来展示难度的炫技题，停止追逐每个陌生术语，也不再让它占据下一晚。情绪和时间因此获得解放，后续计划顺利推进；只是被整题丢开的还有两张本可训练坐标转换与证据强度的图。你拒绝了不合理的题量，却没有把可迁移部分单独捞出来。下次相似图表出现时，这块读图能力仍会以新的形式回来。",
        effects: { san: 1, reasoning: -0.5 },
      },
    ],
  },
  {
    id: "shen-yan-chart-night",
    phase: "weekly",
    label: "人物事件 · 沈砚的证据链",
    title: "晚自习结束后，沈砚仍盯着一道文献题的第三张图。",
    body: [
      "教室只剩下风扇声。他把你的答案推回来，指着横坐标说：“结论方向没错，但对照组根本不能排除这个解释。”",
      "你们从统计显著性争到实验设计，又翻回论文方法部分核对样本量。十一点二十，保安开始逐层关灯。",
    ],
    trigger: {
      earliestWeek: 8,
      latestWeek: 76,
      minSocial: 48,
      minPeerFavor: 16,
      probability: 0.22,
    },
    choices: [
      {
        id: "shen-finish-chain",
        title: "把所有替代解释逐条写完",
        preview: "思辨 +2.5 · 同学好感 +2 · SAN -2.5",
        result: "你和沈砚把每一种替代解释都写成“如果成立，还应观察到什么”，再逐条回到材料里寻找能够排除它的证据。几个看似漂亮的猜想很快倒下，最后仍有两个解释无法被现有条件区分。沈砚没有硬选一个答案，而是把写满箭头的纸对折收好，说这至少比揣测命题人想听什么更有用。你们没能得到唯一结论，却第一次把一道模糊题目拆成了清楚的问题边界，连“不知道”也变得有依据。",
        effects: { reasoning: 2.5, peerFavor: 2, san: -2.5, tags: ["沈砚-共同读图"] },
      },
      {
        id: "shen-stop-tonight",
        title: "约好明天继续，今晚先回寝室",
        preview: "SAN +1 · 同学好感 +1",
        result: "你看了眼熄灯时间，提议把没讲完的部分留到明天。沈砚没有反对，只把争议点整理成三行发进群里，随后又补上一篇相关论文。回寝室后，你强迫自己没有再点开附件，按原计划洗漱休息。第二天早晨重看聊天记录时，你发现他凌晨一点还修改过一次消息，把一句过于肯定的判断换成了更谨慎的表述。你们都没有提这件事，但也更清楚彼此对“先停下来”的理解并不完全相同。",
        effects: { san: 1, peerFavor: 1 },
      },
    ],
  },
  {
    id: "tang-yu-training-table",
    phase: "training",
    label: "外培人物事件 · 唐榆的课表",
    title: "唐榆把机构课表、食堂营业时间和晚自习座位画成了一张表。",
    body: [
      "早八到晚十的机构安排把一天切得很碎。真正能自由支配的只剩午饭后的四十分钟，以及查寝前那一小段时间。",
      "唐榆压低声音：“别想着在这里补常规了。你选，是去问讲师那道植物题，还是下楼买点吃的？”",
    ],
    trigger: {
      earliestWeek: 13,
      latestWeek: 70,
      minPeerFavor: 18,
      probability: 0.38,
    },
    choices: [
      {
        id: "tang-ask-lecturer",
        title: "带着唐榆去堵讲师",
        preview: "第二模块 +1.5 · 社交 +1 · SAN -1",
        result: "讲师本来已经背上包，听完问题后停在走廊，把文件夹垫在墙上，又画了十分钟维管束。唐榆负责追问，你则把每个转折匆忙记在课表背面，直到保洁阿姨推着车从你们身边绕过两次。答案终于讲清时，三个人都露出一种不合时宜的满足。等你们跑回房间，机构的热水刚好停了，只能一边抱怨一边用冷水洗漱。这笔交换很公平：疑问解决了，舒适也确实被挤掉了一块。",
        effects: { module2: 1.5, social: 1, san: -1, tags: ["唐榆-外培同行"] },
      },
      {
        id: "tang-night-snack",
        title: "去便利店补充糖分",
        preview: "SAN +2.5 · 心态 +0.5 · 零花钱 -18",
        result: "你和队友去便利店补充糖分，在路灯下分完一盒已经不太热的关东煮。最初有人还想讨论白天的错题，被另一人用最后一串鱼丸堵了回去，话题于是转到学校食堂和回家后最想吃什么。那十几分钟没有解决疲劳，也不能替代正餐，却让所有人短暂忘记排名、进度与明天的模考。回去继续训练时，关系也不再只由共同焦虑维持。",
        effects: { san: 2.5, mindset: 0.5, pocketMoney: -18 },
      },
    ],
  },
  {
    id: "qiao-mu-notebook-gap",
    phase: "weekly",
    label: "人物事件 · 乔木的旧笔记",
    title: "乔木发现你们都忘了一个月前学过的动物生理。",
    body: [
      "他从书包底层抽出一本已经翻软的笔记，准确找到膜电位那一页。你只能隐约记得当时上过课，却说不清每条离子通道的条件。",
      "乔木没有嘲笑你，只说：“进度条到过八十，不代表今天还剩八十。”",
    ],
    trigger: {
      earliestWeek: 20,
      latestWeek: 96,
      minPeerFavor: 20,
      probability: 0.2,
    },
    choices: [
      {
        id: "qiao-review-together",
        title: "跟着他的提纲做一次闭卷回忆",
        preview: "第二模块 +2 · SAN -1 · 同学好感 +2",
        result: "乔木把提纲翻到背面，只留下几个没有解释的关键词，让你在空白纸上闭卷还原。第一遍写到中段便断了，原先熟悉的句子离开笔记后只剩零散结论。你们没有立刻重抄，而是逐处标出因果链缺失的位置，对照资料补完，再次合上本子重来。第二遍终于能从条件一路推到结论，你也看清了“读过很多次”和“能够独立调出”之间，隔着怎样一段不太体面的空白。",
        effects: { module2: 2, san: -1, peerFavor: 2, tags: ["乔木-遗忘复盘"] },
      },
      {
        id: "qiao-return-own-plan",
        title: "记下漏洞，按自己的计划稍后巩固",
        preview: "心态 +0.5",
        result: "你把这次暴露的漏洞写进周计划，在对应章节旁画了一个醒目的红圈，却没有立刻打乱当天全部安排。这个选择保护了原有节奏，也避免每发现一个问题就临时换方向；但“稍后巩固”若没有具体时段，很容易成为温和的遗忘。你因此补上日期和最低任务量。红圈是否会变成真正完成的订正，仍要等下一周看行动，而不是靠此刻记得多清楚。",
        effects: { mindset: 0.5 },
      },
    ],
  },
  {
    id: "xu-cheng-mock-loss",
    phase: "weekly",
    label: "竞争事件 · 许澄的错题",
    title: "许澄在模考里赢了你，却主动拿着卷子坐到了旁边。",
    body: [
      "他的第三模块几乎没有失分，但第一模块错得比你更多。他没有安慰你，只把两张卷子并排摊开：“我们各讲三道，谁也别藏。”",
      "窗外是正常班放学的人群。你突然意识到，竞争并不总是把人推远，有时也会逼你们把模糊的地方讲清楚。",
    ],
    trigger: {
      earliestWeek: 24,
      latestWeek: 104,
      minSocial: 44,
      minPeerFavor: 12,
      probability: 0.2,
    },
    choices: [
      {
        id: "xu-trade-errors",
        title: "交换讲解各自最强的三道题",
        preview: "思辨 +2 · 第三模块 +1 · 同学好感 +2 · SAN -2",
        result: "你们各自挑出最有把握的三道题，约定不看解析，只讲为什么其余选项不成立。讲到第二道时，你忽然发现自己虽然选对，却无法把直觉翻译成完整解释。许澄没有替你圆场，而是连续追问条件、例外和证据，每一句都像在答案里凿开一道缝。轮到她讲解时，你也听出了相似的跳步。排名没有因此改变，彼此眼中的“强项”却从一个漂亮分数，变成了可以拆开、质疑并共同修补的东西。",
        effects: { reasoning: 2, module3: 1, peerFavor: 2, san: -2, tags: ["许澄-交换错题"] },
      },
      {
        id: "xu-avoid-comparison",
        title: "说今天状态不好，先不对卷",
        preview: "SAN +1 · 同学好感 -1",
        result: "你告诉许澄今天状态不好，不想立刻把两张卷子摊在一起。她停了半秒，只点点头，把原本准备好的排名表折回文件夹，转身去找别人讨论。走廊重新安静后，你确实不用面对当场比较带来的刺痛，呼吸也慢慢稳住；可桌上那几道失分题并没有随她离开。你把试卷翻到背面，意识到拒绝这一次对卷是在保护当下，却不能代替之后的复盘，更不会自动消除你对差距的在意。",
        effects: { san: 1, peerFavor: -1 },
      },
    ],
  },
  {
    id: "provincial-team-dorm-debrief",
    phase: "training",
    label: "省队人物事件 · 熄灯后的复盘",
    title: "省队宿舍熄灯后，外校选手仍在小声讨论白天的实验。",
    body: [
      "何闻野坚持样方数据的问题出在取样，宋令仪认为真正的漏洞是统计模型。你们来自不同学校，三个月后却会在同一张国赛名单上被排序。",
      "走廊传来带队老师的脚步声。讨论只剩最后一分钟，你必须决定是把问题说透，还是保存体力迎接明早的四科轮转。",
    ],
    trigger: {
      earliestWeek: 48,
      latestWeek: 60,
      requiredTags: ["第1次省赛-进入省队"],
      blockedTags: ["第1次国赛-进入实验", "第1次国赛-理论止步"],
      minSocial: 52,
      probability: 0.28,
    },
    choices: [
      {
        id: "camp-finish-debate",
        title: "用一分钟给出可检验的判别方案",
        preview: "实验 +1.5 · 思辨 +1 · SAN -2 · 社交 +1",
        result: "你没有直接争论谁的解释更像答案，而是在一分钟里提出补做一组分层取样：分别控制取样位置与时间，再比较两种假设会给出怎样不同的预测。起初周围还有人催你快选一个结论，何闻野却把你的方案完整写进小组纸上。第二天讲师公布参考方案时，其中一个关键步骤与你们的设计几乎一致。何闻野隔着两排座位向你比了个手势，那不是简单猜对后的庆祝，而是对一种可检验思路的确认。",
        effects: { experiment: 1.5, reasoning: 1, san: -2, social: 1, tags: ["省队-宿舍讨论"] },
      },
      {
        id: "camp-sleep-first",
        title: "叫停讨论，明早再说",
        preview: "SAN +2",
        result: "你叫停寝室里的争论，说明明早还有课程，剩下的显著性问题可以写在纸上醒来再谈，随后拉下眼罩。几个人嘴上答应，几分钟后隔壁床仍传来压低的气声，你却没有重新加入。答案没有在当晚统一，房间也未立刻安静；至少你为自己划出了结束时间。第二天早晨，那道争议仍在，而你是少数能完整复述双方理由的人。",
        effects: { san: 2 },
      },
    ],
  },
  {
    id: "textbook-altitude-typo",
    phase: "weekly",
    label: "教材趣事 · 迁徙到了近地轨道",
    title: "行为学教材写着：这种鸟会迁徙到“海拔两千九百公里”的高山。",
    body: [
      "你停下笔算了一遍：这个高度已经远远越过大气层。旁边还有一句“步行迁徙”，让整段话变得更加不可思议。",
      "队友坚持这只是单位笔误，另一位同学却认真查起了最初引用的外文资料。一次普通的抄笔记，突然变成了教材考据。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 14,
      latestWeek: 74,
      requiredActionCounts: { notes: 2 },
      probability: 0.18,
    },
    choices: [
      {
        id: "altitude-trace-source",
        title: "查找原始资料，在笔记中订正",
        preview: "思辨 +1.5 · 第三模块 +1 · SAN -1",
        result: "你顺着教材脚注找到原始资料，又核对了版本与图表说明，才发现原文采用的是完全不同的单位，换算时还省略了一个限定条件。原先看似离谱的数字因此有了合理范围，教材里的句子却仍需要订正。你没有只在答案旁打叉，而是在页边写清来源、换算过程和误差可能从何处产生，最后补上一句：教材是重要参考，却不是不可质疑的判决书。以后再遇到权威与证据冲突时，你至少知道该怎样查，而不只是凭感觉选边。",
        effects: { reasoning: 1.5, module3: 1, san: -1, tags: ["教材考据"] },
      },
      {
        id: "altitude-meme",
        title: "拍下来发进训练群",
        preview: "同学好感 +2 · 社交 +1",
        result: "你把教材里“海拔两千九百公里”的离谱句子拍下来发进训练群，几分钟内便出现卫星、候鸟和宇航服的表情包。当天晚上，群名被短暂改成“近地轨道迁徙研究所”，连教练也发了一个省略号。笑过以后，有人找出新版勘误和原始单位，大家才确认这是排版问题。一次玩笑没有妨碍求证，反而让纠错成为全队都记得的共同暗号。",
        effects: { peerFavor: 2, social: 1 },
      },
    ],
  },
  {
    id: "training-phone-audio",
    phase: "training",
    label: "外培趣事 · 手机突然外放",
    title: "安静的下午课上，后排突然响起一段完全不属于生物学的视频台词。",
    body: [
      "声音只持续了两秒，整个教室却同时转头。手机主人红着脸关掉播放器，随即高高举手，试图用一个临时想到的问题证明自己刚才一直在听课。",
      "讲师认真看了看PPT：“这个问题……和我们正在讲的内容相隔大概三百页。”",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 13,
      latestWeek: 30,
      allowedWeeks: [13, 29, 30],
      probability: 0.48,
    },
    choices: [
      {
        id: "phone-help-cover",
        title: "顺着问题补充一句，帮他把场面圆回来",
        preview: "同学好感 +3 · 社交 +1",
        result: "你顺着那位同学有些跑题的问题补上一句，把它改造成一个不至于让全场冷下来的玩笑。讲师也笑了，原本尴尬的人终于坐下，问题却仍没能真正接回课程内容。短暂笑声让昏沉的下午恢复一点精神，也保护了提问者不被公开嘲弄；只是你们共同圆过的场，不能替代课后把真正疑惑重新组织并认真问出的那一步。",
        effects: { peerFavor: 3, social: 1 },
      },
      {
        id: "phone-focus-back",
        title: "忍住笑，继续整理板书",
        preview: "对应课程保持 · SAN +1",
        result: "你忍住笑，没有加入台下越来越明显的起哄，只继续整理板书并标出讲师口误的位置。五分钟后，课程已经翻到下一张图，现场恢复正常；训练群里的表情包却仍在快速增加，几乎盖住真正的知识讨论。你保住了这段内容的完整记录，也看见一个小插曲怎样在群聊里获得远超本身的寿命。之后查笔记时，至少仍能找到被笑声短暂淹没的推导。",
        effects: { san: 1 },
      },
    ],
  },
  {
    id: "training-power-outage",
    phase: "training",
    label: "外培事故 · 全真模拟突然停电",
    title: "实验模考进行到一半，离心机、照明和投影同时停了。",
    body: [
      "讲师一开始说十分钟就能恢复，半小时后又宣布需要重新安排全部实验。黑暗中的考场只剩应急灯和一排无法继续处理的样品。",
      "机构工作人员搬来零食和冰棒安抚大家。有人说，这倒确实模拟了国赛最重要的能力：面对突发情况保持清醒。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 29,
      latestWeek: 112,
      probability: 0.16,
    },
    choices: [
      {
        id: "outage-replan",
        title: "和同组同学推演恢复供电后的操作顺序",
        preview: "实验 +1.5 · 思辨 +1 · SAN -1",
        result: "你们没有在黑暗里继续碰器材，而是借应急灯把尚未完成的步骤、样品位置和恢复供电后的先后顺序逐项写下，并提前分好谁检查温度、谁重设计时。电力真正恢复时，其他组还在争论从哪一步重来，你们已经按清单找回操作。被打断的实验最终仍不够完美，一组数据也因时间偏差只能弃用；但混乱没有继续扩大。那张临时流程表让你明白，实验能力不只体现在一切正常时做得多快，也体现在条件突然失控后能否安全、诚实地收住局面。",
        effects: { experiment: 1.5, reasoning: 1, san: -1 },
      },
      {
        id: "outage-eat-icecream",
        title: "先吃冰棒，接受今天无法全真",
        preview: "SAN +3 · 心态 +0.5",
        result: "突发停电让全真模考无法继续，你没有强迫同组用想象补完实验，而是先去买冰棒，承认今天已经不可能获得可比较结果。冰凉和甜味比不稳定设备更可靠，二十分钟里没人记录步骤或猜测分数。模考价值确实损失了一部分，却换来一次没有伪装成学习的休息。供电恢复后，你们从中断点重新整理，而不是把混乱数据当成完整训练。",
        effects: { san: 3, mindset: 0.5 },
      },
    ],
  },
  {
    id: "training-no-break",
    phase: "training",
    label: "外培日常 · 今天只讲两百多页",
    title: "讲师宣布“稍微提速”，随后连续翻过几十张PPT且没有下课。",
    body: [
      "第一排还在记笔记，中间几排开始轮流去洗手间，后排已经无法判断这一节课究竟持续了多久。",
      "讲师看了眼时间，很满意地总结：“今天讲得比较慢，只覆盖了两百多页。”屏幕右下角的页码仍在跳动，许多人连标题层级都没来得及分清。你必须决定继续追逐每一句，还是主动改变记录方式，至少让这场速度展示留下能够复习的结构。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 13,
      latestWeek: 70,
      probability: 0.2,
    },
    choices: [
      {
        id: "no-break-outline",
        title: "放弃逐字记录，只画章节框架",
        preview: "思辨 +1 · 课程掌握 +1 · SAN -2",
        result: "你停下逐字追赶，把已经写乱的半页纸翻过去，只保留章节标题、核心问题和它们之间的箭头。最初几分钟很不习惯，讲师说出的许多细节像从网眼里漏掉，让你担心之后再也找不回来；可当课程进入第三部分时，十几个框反而开始互相连接。下课铃响，你的笔记不再像一份残缺听写，而是一张能指出哪里已懂、哪里需要重听的地图。你没有记录全部内容，却终于保住了整堂课的方向感。",
        effects: { reasoning: 1, module4: 1, san: -2 },
      },
      {
        id: "no-break-restroom",
        title: "在下一次转身写板书时悄悄离场",
        preview: "SAN +2 · 心态 +0.5",
        result: "你等讲师再次转身写板书，悄悄从后门离场，在走廊尽头站了几分钟，让发胀的头脑和耳朵获得安静。冷空气带来的清醒十分真实，你也终于停止机械抄写；可回到座位时，PPT已经前进四十页，旁边同学只能简要指出错过的核心。短暂离开救回了状态，也制造了新的内容断层，之后仍需要主动决定哪些值得补、哪些可以放下。",
        effects: { san: 2, mindset: 0.5 },
      },
    ],
  },
  {
    id: "mock-thirty-two-pages",
    phase: "training",
    label: "机构模考 · 三十二页试卷",
    title: "监考老师把一叠厚得像讲义的试卷放到桌上：“一百分钟。”",
    body: [
      "翻到最后一页时，考场里出现了整齐的吸气声。题目充满没有中文注释的图表，前两页已经让许多人花掉近二十分钟。",
      "考试结束后，出题老师却说：“我并不要求你们做完，剩下的回去再做。”然后开始讲所有人都没来得及看的后半卷。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 25,
      latestWeek: 105,
      probability: 0.17,
    },
    choices: [
      {
        id: "pages-time-strategy",
        title: "复盘时间分配，而不是纠结总分",
        preview: "思辨 +2 · 心态 +1 · SAN -2",
        result: "你没有继续盯着总分，而是凭答题痕迹把每一页的开始与结束时间补写在卷首。第一篇材料吃掉了近一半时间，后面的简单题却因匆忙连续漏看条件。把这些节点画成一条线后，失分不再只是“状态不好”，而是一套能够调整的流程问题。你据此设下强制换页和回看标记，准备在下次模拟中验证。新方案不能保证立刻多得多少分，但至少再遇到厚卷时，你不会毫无察觉地把整场考试困在开头。",
        effects: { reasoning: 2, mindset: 1, san: -2, tags: ["厚卷时间策略"] },
      },
      {
        id: "pages-argue",
        title: "加入同学对题量的集体吐槽",
        preview: "同学好感 +2 · SAN +2",
        result: "你加入同学对题量的集体吐槽，把自己卡在第二篇材料、最后十页几乎空白的窘迫讲了出来。很快有人展示更惨的时间分配，也有人承认中途几乎想直接交卷。笑声没有让试卷变薄，问题也仍需复盘，却让“只有我完全做不完”的恐慌松开一点。等大家开始比较策略时，抱怨终于转成了可以共同讨论的页数、用时和弃题节点。",
        effects: { peerFavor: 2, san: 2 },
      },
    ],
  },
  {
    id: "answer-not-right-enough",
    phase: "weekly",
    label: "错题争议 · 不是错，只是不够对",
    title: "两个几乎同义的选项，一个被判正确，另一个被解释为“不够准确”。",
    body: [
      "同学引用题干证明两者在当前语境下无法区分，讲题人却不断强调科研表达必须严谨。",
      "争论逐渐从生物机制转向语言边界。你发现继续争辩既可能训练论证，也可能只是把整晚消耗在无法改变的答案上。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 18,
      latestWeek: 104,
      minSocial: 42,
      requiredActionCounts: { practice: 3 },
      probability: 0.19,
    },
    choices: [
      {
        id: "not-right-evidence",
        title: "限定题干语境，写出一份完整反驳",
        preview: "思辨 +2.5 · SAN -2 · 同学好感 +1",
        result: "你先限定题干中每个词的适用范围，再写出在不同语境下会导向什么结论，并引用教材原句说明争议来自表述而非基础知识。监考老师收下纸条，没有当场改动答案，只说会交给命题组复核。晚些时候，你的反驳被转进选手群，有人赞同，也有人指出其中仍有遗漏。最终结果尚未改变，讨论却不再停留在“这题烂不烂”。至少大家开始认真区分知识错误、条件不足与措辞歧义，而你的质疑也承担了被检查的责任。",
        effects: { reasoning: 2.5, san: -2, peerFavor: 1, tags: ["答案表述争议"] },
      },
      {
        id: "not-right-log-only",
        title: "记入争议题档案，到此为止",
        preview: "思辨 +1 · SAN +1",
        result: "你没有继续追着群聊争论，而是把题干、官方答案和两种主要解释并排贴进争议题档案，在错题类型一栏新建了“命题语言”。随后你标出真正影响判断的词语，并写明若换成更严格的表述，答案应如何变化。记录到这里便合上文件，不再让同一道题吞掉整晚。这个分类提醒你，不是所有失分都能靠多背一遍教材解决；有些时候，更重要的是识别问题究竟出在知识、阅读，还是题目本身没有把边界说清。",
        effects: { reasoning: 1, san: 1 },
      },
    ],
  },
  {
    id: "storm-frog-class",
    phase: "weekly",
    label: "校园趣事 · 暴雨夜的临时动物学",
    title: "晚课前，有人用纸箱带回了一只在暴雨里捡到的青蛙。",
    body: [
      "原定的遗传学课程被迫暂停。半个班围着纸箱判断物种，老师进门后的第一句话是：“先放回去，别让它陪你们上晚自习。”",
      "窗外的飞虫不断撞向灯光。几分钟后，大家又开始争论青蛙究竟会不会捕食静止的昆虫。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 34,
      latestWeek: 68,
      minPeerFavor: 16,
      probability: 0.12,
    },
    choices: [
      {
        id: "frog-observe-release",
        title: "简单观察记录后把它放回花园",
        preview: "第二模块 +1 · 实验 +0.5 · 心态 +1",
        result: "你先让围观的人退开一点，简单记录体色、趾端和出现环境，又拍下不会妨碍判断的几张照片。青蛙在湿润地砖上停了几秒，喉部有规律地起伏，随后借着墙根阴影跳进花园草丛。教室重新安静时，遗传学课程已经少讲了一页，老师只好把最后一张图留作自习。损失的进度很具体，但你也第一次把课本里的观察方法用在校园里一个活生生的对象上；那段记录并不宏大，却比表情包更值得留下。",
        effects: { module2: 1, experiment: 0.5, mindset: 1 },
      },
      {
        id: "frog-class-photo",
        title: "拍照发群，继续上课",
        preview: "同学好感 +1 · SAN +1",
        result: "你隔着安全距离拍了一张清楚的照片发进班群，没有再组织近距离观察。图片几分钟内就被加上文字做成表情包，讨论从物种判断一路歪到谁最怕青蛙。老师确认它已经跳到墙边后重新打开PPT，试图把大家拉回遗传学，台下却仍有人小声争论它到底是哪一种。课堂没有被长时间打断，也留下了一点共同记忆；只是关于这只动物的判断最终停在猜测，没有变成真正可核对的观察。",
        effects: { peerFavor: 1, san: 1 },
      },
    ],
  },
  {
    id: "national-list-midnight-revision",
    phase: "exam",
    label: "国赛突发事件 · 深夜更正名单",
    title: "凌晨一点，领队群突然出现了一份“重新核验后的实验资格名单”。",
    body: [
      "第一版名单已经盖章公布，许多落选者刚刚关掉手机。新通知却说阅卷数据需要复核，部分名次发生变化。",
      "有人从落选变成入选，也有人一觉醒来失去资格。走廊里的教练不断打电话确认消息真假，第二天实验时间被整体推迟。",
    ],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 50,
      latestWeek: 116,
      requiredTags: ["第1次国赛-进入实验"],
      probability: 0.1,
    },
    choices: [
      {
        id: "midnight-verify-rest",
        title: "只听领队确认，关闭群聊继续休息",
        preview: "心态 +1 · SAN +1",
        result: "你只听领队确认官方仍在核验，记录下一次明确更新时间，随后关闭群聊继续休息。夜里仍有人转发截图、预测补录和猜测学校名额，你无法控制名单什么时候最终确定，也不可能逐条证伪；但至少没有让每一种未经证实的说法占满整个夜晚。第二天醒来时正式通知仍未发布，你却保留了处理真实结果所需要的精神，而不是提前被几十个版本消耗。",
        effects: { mindset: 1, san: 1 },
      },
      {
        id: "midnight-support-friends",
        title: "陪状态崩溃的外省朋友等正式通知",
        preview: "社交 +2 · 同学好感 +2 · SAN -3",
        result: "你没有回房间刷新消息，而是陪那位状态崩溃的外省朋友留在大厅，一遍遍确认学校、机构和带队老师的通知是否一致。自动售货机的灯亮到后半夜，几个人轮流递水、借充电线，也有人说着说着突然沉默。最终名单在更晚的时候确认，对方的名字仍在其中，你们却都没有力气欢呼。第二天你几乎没睡，课程也听得发飘，但那一夜让你记住：竞赛关系并不只发生在排名相近的人之间，有时它从陪另一个人等一句确定消息开始。",
        effects: { social: 2, peerFavor: 2, san: -3, tags: ["国赛名单风波"] },
      },
    ],
  },
  {
    id: "origin-coach-family-dinner",
    phase: "weekly",
    label: "出身事件 · 餐桌也是教练席",
    title: "晚饭时，父亲随口问起你今天错的那道遗传题。",
    body: [
      "你原本只想用一句“粗心”结束话题，父亲却顺着题干一路问到知识漏洞、订正方式和下周训练计划，筷子间的停顿比教室里还短。别人需要预约才能获得的复盘，在你家会随着晚饭自然发生，专业建议和家庭关心也很难分开。你知道这份资源并非人人拥有，也逐渐感到自己很难真正下课；今晚要回应的不只是一道题，还有餐桌能否保留一点不由竞赛定义的时间。",
    ],
    inspiration: "原创",
    trigger: { earliestWeek: 5, latestWeek: 30, requiredTags: ["origin:coach-family"], probability: 0.42 },
    choices: [
      {
        id: "coach-family-accept-review",
        title: "把整道题讲完，接受一次家庭复盘",
        preview: "思辨 +2 · 家庭支持 +1 · SAN -2",
        result: "你从题干开始把整道题讲给家人听，试着说明每一步为什么成立。讲到中段，对方很快指出你略过的条件，又追问这种错误是否在最近几次考试里反复出现。原本十分钟的交流逐渐变成一场家庭复盘，等你们把学习安排也谈完，桌上的晚饭已经凉了。你确实获得了可执行的方向，却也更清楚家庭期待不会停在教室门口：支持、监督和评价常常绑在一起，而你需要学习的不只是把题做对，也包括怎样让关心不无限侵入自己的节奏。",
        effects: { reasoning: 2, familySupport: 1, san: -2, tags: ["家庭复盘常态化"] },
      },
      {
        id: "coach-family-set-boundary",
        title: "约定饭后只聊十五分钟",
        preview: "心态 +1 · 家庭支持 -1",
        result: "你提议饭后只谈十五分钟训练，闹钟响起便停止，其余费用、名次和未来安排留到周末集中讨论。父亲起初不习惯，几次想在夹菜时补问，最后还是把问题记在纸上。十五分钟没有消除家庭期待，却让晚饭不再无限延长成复盘会。餐桌第一次重新容得下饭菜、学校琐事和短暂沉默，而不是每一道题都必须当场交代。",
        effects: { mindset: 1, familySupport: -1, tags: ["与教练家长建立边界"] },
      },
    ],
  },
  {
    id: "origin-coach-family-failure",
    phase: "weekly",
    label: "出身事件 · 别人家的标准",
    title: "一次竞赛小测后，有人当着你的面说：“教练家的孩子也就这样？”",
    body: ["一句看似随口的玩笑把这次成绩和父母职业绑在了一起，周围有人笑，也有人假装没听见。你确实比许多同学更早接触训练方法、资料和复盘，这些资源不能被一句“全靠自己”抹掉；可卷面上的每个失误仍由你承担，也不该自动成为对整个家庭的评价。若立即反击，话题可能升级；若沉默，类似判断又会被当作默认事实。你需要找到一种既不否认优势、也不交出个人边界的回应。"],
    inspiration: "原创",
    trigger: { earliestWeek: 16, latestWeek: 70, requiredTags: ["origin:coach-family", "家庭复盘常态化"], minimumWeeksAfterTags: { "家庭复盘常态化": 4 }, maximumWeeksAfterTags: { "家庭复盘常态化": 32 }, probability: 0.34 },
    choices: [
      {
        id: "coach-family-own-route",
        title: "承认资源优势，但坚持成绩是自己的",
        preview: "心态 +2 · 社交 +1",
        result: "你承认家庭资源让自己更容易获得培训、资料和试错机会，没有用“大家都一样”回避差距；同时也说明课程不会替你理解教材，最终成绩仍来自具体训练和选择。话题没有立刻消失，有人仍觉得你低估了优势，也有人第一次愿意继续谈成本。你无法用一句话解决资源不平等，却终于不再照搬防御性的标准答案，而是用自己的语言描述这条路既受益于什么、又由自己承担什么。",
        effects: { mindset: 2, social: 1 },
      },
      {
        id: "coach-family-prove",
        title: "连夜加练，证明他们错了",
        preview: "思辨 +1.5 · SAN -4",
        result: "你把质疑当成必须当晚反驳的挑战，回宿舍后又加做一整套限时题，直到凌晨才停。第二天训练时，你的速度确实比平时更快，几道熟悉题型也做得漂亮；可一旦遇到卡顿，那句话便重新从脑海里冒出来，催促你继续加速。成绩可以回应一次评价，却无法自动处理被轻视后的愤怒；你赢下了当天的表现，也把休息和判断绑在了证明别人错上。",
        effects: { reasoning: 1.5, san: -4 },
      },
    ],
  },
  {
    id: "origin-top-scorer-spotlight",
    phase: "weekly",
    label: "出身事件 · 状元光环",
    title: "校内竞赛榜第一次公布，你的名字没有出现在前三。",
    body: ["班主任没有批评，只在放学后问了一句“是不是还没适应”，语气甚至称得上体谅。正因如此，那句话比责备更像提醒：老师、同学和家人仍把中考成绩当作你的默认水平，仿佛换到新领域后也应立刻领先。你自己也偷偷接受了这套预期，遇到不会的内容时更愿意遮掩而不是提问。榜单只公布了一次当前结果，却逼你决定，是继续维护过去的光环，还是承认竞赛需要一段真正的新手期。"],
    inspiration: "原创",
    trigger: { earliestWeek: 7, latestWeek: 35, requiredTags: ["origin:top-scorer"], probability: 0.45 },
    choices: [
      {
        id: "top-scorer-learn-biology",
        title: "承认竞赛需要重新从零学习",
        preview: "心态 +1 · 思辨 +1.5",
        result: "你承认中考成绩和过去的顺利并不能让自己自动掌握竞赛内容，把笔记里那句“我本来就应该会”划掉，改成“我正在学”。向教练提问时仍会感到丢脸，同学也没有因此忘记你曾经的光环；可问题终于能够在不会的阶段被说出口，而不必等到成绩暴露。期待没有消失，至少不再继续阻止你从零建立真正需要的知识。",
        effects: { mindset: 1, reasoning: 1.5, tags: ["状元开始接受新手期"] },
      },
      {
        id: "top-scorer-hide-score",
        title: "避开榜单，也不和同学讨论",
        preview: "暂时避开比较，也退出这轮共同交流",
        result: "你避开榜单发布后的讨论，别人问起时只说不想比较，很快便没有人继续追问。接下来几天，你确实免于反复确认名次，也不必接住安慰或炫耀；可同学们谈到如何调整低谷、怎样与家长解释时，你同样不在场。保持距离保护了情绪，也让你失去听见别人如何跨过相似阶段的机会。等重新加入时，很多共同经验已经在沉默中交换完毕。",
        effects: { peerFavor: -1, san: 2 },
      },
    ],
  },
  {
    id: "origin-top-scorer-double-duty",
    phase: "weekly",
    label: "出身事件 · 两张成绩单",
    title: "学校希望你同时维持常规年级排名和竞赛队表现。",
    body: ["年级组重新提起招生时关于常规成绩的承诺，竞赛教练则强调集训已经进入不能分心的阶段。对其他学生而言可以按节点取舍的两条路线，在你这里被默认都要漂亮，仿佛中考高分应当自动提供额外时间。两边都没有提出完全无理的要求，叠在一起却超过了一周能够承载的量。你必须让学校看见真实日程，并决定哪些目标只是为了维持“什么都能做好”的形象。"],
    inspiration: "原创",
    trigger: { earliestWeek: 22, latestWeek: 70, requiredTags: ["origin:top-scorer", "状元开始接受新手期"], minimumWeeksAfterTags: { "状元开始接受新手期": 5 }, maximumWeeksAfterTags: { "状元开始接受新手期": 36 }, probability: 0.35 },
    choices: [
      {
        id: "top-scorer-negotiate-priority",
        title: "拿计划表与学校谈阶段性优先级",
        preview: "社交 +1 · 学校关系改善 · SAN -1",
        result: "你带着完整计划表去和年级组谈，不只说竞赛更重要，而是列出联赛节点、最低常规维护时间和之后补回课程的安排。学校没有完全取消作业与考试，也要求班主任持续记录缺口，却同意在联赛前降低一次常规考核权重。协商没有让冲突消失，只把优先级从口头特例写成阶段规则；你也因此需要按约定交付训练与补课结果。",
        effects: { social: 1, san: -1, coachFavor: 1 },
      },
      {
        id: "top-scorer-promise-both",
        title: "答应两边都不落下",
        preview: "家庭支持 +1 · SAN -4",
        result: "面对学校与竞赛队同时提出的要求，你答应常规排名和训练进度两边都不会落下，希望先用态度换取所有人的信任。承诺当场确实让争执停了下来，班主任和教练也分别给了你一段观察时间。可下一周的日程并没有凭空多出一天：补作业挤掉睡眠，训练订正又侵占课堂准备。直到两边都出现迟交，你才不得不把漂亮保证拆成真实优先级。",
        effects: { familySupport: 1, san: -4 },
      },
    ],
  },
  {
    id: "origin-elite-resource-queue",
    phase: "weekly",
    label: "出身事件 · 资源也要排队",
    title: "学校只拿到六个外培名额，队里有十四个人报名。",
    body: ["成熟体系确实带来更多课程和外部机会，也意味着每份稀缺资源都会经过公开或隐形的排序。十四份申请摊在桌上，教练又摆出最近三次小测、实验记录和任务完成率，几名平时关系很好的队友忽然不再接话。六个名额无法照顾所有理由，单看分数也未必能衡量谁最需要培训。你既是竞争者，也是这套规则的承受者，需要决定怎样争取，才不会把队友简化成必须挤掉的名字。"],
    inspiration: "原创",
    trigger: { earliestWeek: 9, latestWeek: 40, requiredTags: ["origin:elite-school"], probability: 0.44 },
    choices: [
      {
        id: "elite-compete-openly",
        title: "按统一标准竞争名额",
        preview: "教练好感 +1 · SAN -2",
        result: "你支持用事先公布的统一标准竞争名额，把理论成绩、实验完成度和出勤权重写清，也接受自己可能因此落选。最终结果公布时，你未必排进前列，至少能逐项看见差距，而不必猜测关系或印象起了多大作用。队内竞争依然会伤人，标准也可能需要修订；可它从模糊的人情判断变成了能够质疑、复盘和为下一次准备的具体过程。",
        effects: { coachFavor: 1, san: -2, tags: ["接受名校队内竞争"] },
      },
      {
        id: "elite-share-notes",
        title: "提议入选者回来共享完整笔记",
        preview: "同学好感 +2 · 社交 +1",
        result: "你提议六名入选者培训结束后轮流做一次完整分享，把讲义目录、实验注意事项和个人踩过的坑留进公共文件夹。有人担心这样削弱名额价值，最终仍同意资料由全队可查、器材经验由实际参加者讲解。培训资格依旧只有六份，直接练习也无法复制；但学校付出的资源不再只沉淀在六个人手里，下一次选拔也多了更公平的起点。",
        effects: { peerFavor: 2, social: 1 },
      },
    ],
  },
  {
    id: "origin-elite-comparison",
    phase: "weekly",
    label: "出身事件 · 强者环绕",
    title: "你刚为一次进步高兴，隔壁桌已经开始做下一阶段的卷子。",
    body: ["你刚把比上次提高的分数写进复盘表，隔壁桌已经翻开下一阶段的卷子，讨论起你尚未接触的专题。在名校队伍里，参照系总能迅速移动并抹平满足感：资源带来的增长真实存在，持续比较造成的疲惫也同样真实。领先者可以成为路线提示，也很容易变成永远追不完的清单。你需要判断这次进步是否值得停下来确认，以及他人的下一步究竟该提供信息，还是接管你的节奏。"],
    inspiration: "原创",
    trigger: { earliestWeek: 18, latestWeek: 78, requiredTags: ["origin:elite-school", "接受名校队内竞争"], minimumWeeksAfterTags: { "接受名校队内竞争": 4 }, maximumWeeksAfterTags: { "接受名校队内竞争": 40 }, probability: 0.36 },
    choices: [
      {
        id: "elite-personal-baseline",
        title: "保留个人基线，只比较关键差距",
        preview: "心态 +2 · 思辨 +0.5",
        result: "你保留自己过去几次测试的正确率、用时和失分类型，只把榜单用来确认几个关键差距，不再逐一追踪所有人的波动。领先者仍能提醒你某个模块尚有空间，落后时也仍会难受，但下一天学什么由个人基线决定，而不是由最新名次临时改写。榜单没有被假装成毫无意义的纸，它只是从价值判决书退回一种有限的训练工具。",
        effects: { mindset: 2, reasoning: 0.5 },
      },
      {
        id: "elite-chase-everyone",
        title: "把每个领先者都当作追赶目标",
        preview: "思辨 +1.5 · SAN -4",
        result: "你把榜单上每个领先者都写进追赶表，为不同人的优势分别增加题量、计时和额外资料。最初两周，做题速度确实提高，几个差距也迅速缩小；可目标从来不会同时消失，你开始压缩睡眠，订正时也更急于确认输赢。后来一道本可排除的选项被你草率选中，才发现速度增长的同时，判断耐心和恢复能力也一起变薄。",
        effects: { reasoning: 1.5, san: -4 },
      },
    ],
  },
  {
    id: "origin-county-missing-resource",
    phase: "weekly",
    label: "出身事件 · 找不到的实验材料",
    title: "实验室没有你需要的显微切片，教练也不确定该向谁借。",
    body: ["器材柜里只有几张已经褪色的旧片，教练问过年级组后也不确定该向谁借。县中的训练自由度很高，一部分原因正是几乎没人能给出完整路线：没有固定实验时段，也没有成熟的校际借用渠道。你可以先把缺口换成理论学习，等待某次机会；也可以从学长、邻市学校和陌生老师开始询问，自己把外界关系一点点搭起来。后一条路更慢，还要承担被拒绝和归还材料的责任。"],
    inspiration: "原创",
    trigger: { earliestWeek: 10, latestWeek: 46, requiredTags: ["origin:county-school"], probability: 0.46 },
    choices: [
      {
        id: "county-contact-alumni",
        title: "联系学长和邻市学校借材料",
        preview: "社交 +2 · 实验 +1 · SAN -1",
        result: "你先联系已经毕业的学长，再由对方介绍邻市学校负责实验的老师，说明用途、借用时长和归还方式。经过三次转介绍，你终于拿到一盒边缘有些磨损却仍可使用的旧切片，还附带一张前人留下的染色问题清单。材料没有凭空变成学校资产，归还责任也更严格；但这次主动求助让你第一次建立起课表之外、能够继续维护的校外联系。",
        effects: { social: 2, experiment: 1, san: -1, tags: ["县中建立外部资源网"] },
      },
      {
        id: "county-theory-only",
        title: "先把实验换成理论学习",
        preview: "思辨 +1 · 实验路线延后",
        result: "实验室临时无法使用后，你没有让整周空过去，而是把原定时段换成相关理论、操作视频和误差分析，提前整理每一步为什么这样做。学习确实留下了成果，等设备恢复时你也更容易理解任务；可手感、计时和面对真实样本的判断仍没有被纸面练习替代。缺失的实验条件不会凭知识自动补齐，它只被推迟到之后必须重新安排的一次训练里。",
        effects: { reasoning: 1 },
      },
    ],
  },
  {
    id: "origin-county-first-result",
    phase: "weekly",
    label: "出身事件 · 第一次被看见",
    title: "一次联考里，你的成绩第一次排到省内前列。",
    body: ["原本只在旁边观望的老师开始主动询问竞赛队缺什么，实验室钥匙、外出请假和经费也第一次有了商量余地。家长把这张成绩截图保存了很久，又转给几位此前不理解你停课选择的亲友。县中的支持并非预先配置，它往往要由结果一点点换来；而成绩带来的窗口也不会永远敞开。你可以趁此提出长期条件，也可以避开新增关注，继续维持原先较自由但资源不足的节奏。"],
    inspiration: "原创",
    trigger: { earliestWeek: 24, latestWeek: 82, requiredTags: ["origin:county-school", "县中建立外部资源网"], minimumWeeksAfterTags: { "县中建立外部资源网": 6 }, maximumWeeksAfterTags: { "县中建立外部资源网": 44 }, probability: 0.34 },
    choices: [
      {
        id: "county-request-lab",
        title: "趁机申请固定实验时间",
        preview: "实验 +2 · 家庭支持 +2 · 教练好感 +1",
        result: "你没有只收下这次表扬，而是趁谈话还没结束，把近几周实验训练的中断记录和器材需求一并拿出来，申请固定使用时段。老师没有全批：晚间开放涉及值班，部分设备也不能单独操作；但实验室最终同意每周为你留出一个下午，并指定一位学长协助交接。离开办公室时，你手里多了一张需要长期遵守的安排表。一次成绩没有停在庆祝上，而是沉淀成持续条件，也意味着你得用之后每一次准时与复盘证明这份资源没有被浪费。",
        effects: { experiment: 2, familySupport: 2, coachFavor: 1 },
      },
      {
        id: "county-stay-quiet",
        title: "不提要求，继续按自己的节奏",
        preview: "心态 +1 · 支持不变",
        result: "你没有趁成绩好转提出固定实验时间或额外资料，担心要求太多会显得得意，只继续按原先节奏自行安排。教练因此认为你目前资源已经足够，学校也把新增名额给了更主动说明需求的人。你避开了被审视和被要求回报的额外关注，却也错过支持最容易被说服的窗口；之后真正遇到设备瓶颈时，再解释长期困难便需要更多证据。",
        effects: { mindset: 1 },
      },
    ],
  },
  {
    id: "origin-wealthy-shopping-distance",
    phase: "weekly",
    label: "出身事件 · 轻松买下的东西",
    title: "你随手买下的新资料，正是队友犹豫了两周仍没下单的那套。",
    body: ["你在推荐链接出现当天便完成付款，资料第二天就送到座位；队友却曾反复比较价格、运费和是否值得，购物车放了两周仍没有下单。支付能力替你解决了“买不买”的选择，却没有自动解决彼此怎样相处。公开炫耀会刺痛人，刻意假装价格无关紧要也可能显得虚伪，主动分享则需要考虑版权、保管和边界。你无法让家庭条件瞬间相同，只能决定如何让资源进入关系而不变成隐形的优越证明。"],
    inspiration: "原创",
    trigger: { earliestWeek: 6, latestWeek: 38, requiredTags: ["origin:wealthy-family"], probability: 0.45 },
    choices: [
      {
        id: "wealthy-share-resource",
        title: "扫描目录并邀请大家轮流借阅",
        preview: "同学好感 +2 · 社交 +1",
        result: "你先扫描目录和勘误页，把原书仍由自己保管的规则讲清，再邀请队友按登记顺序轮流借阅。有人补上缺页，有人归还时夹进一张检索索引，原本只属于你的资料逐渐长出共同使用的痕迹。信息没有因为共享而失去来源，也没有被拿来划分谁更值得接近你；当下一批新资料出现时，队友也更愿意主动把各自找到的版本带来交换。",
        effects: { peerFavor: 2, social: 1, tags: ["富裕但愿意共享"] },
      },
      {
        id: "wealthy-hide-price",
        title: "避开价格话题，只自己使用",
        preview: "SAN +1 · 同学好感 -1",
        result: "你避开资料价格和培训费用，只把买来的内容留给自己使用，队友问起时便说还没来得及整理。这样确实没有人需要当面比较家庭条件，最初的尴尬很快过去；但几次之后，大家也不再向你分享拼课、借书和报销信息。金钱差异被沉默盖住，没有变成公开冲突，却悄悄成为关系里的分界线，让成本问题只能由每个人各自猜测。",
        effects: { san: 1, peerFavor: -1 },
      },
    ],
  },
  {
    id: "origin-wealthy-result-condition",
    phase: "weekly",
    label: "出身事件 · 支持不是空白支票",
    title: "家长同意下一次外培，但要求你先给出最近三次测试的趋势。",
    body: ["报名通知刚发来，家长没有像过去那样直接转账，而是要求你先整理最近三次测试的趋势、上一次外培的复盘和本次预算。家里付得起并不等于永远愿意付，资源越多，他们越希望看见选择、反馈与结果形成闭环。你觉得信任似乎被附上了条件，对方却认为持续投入本就需要解释。接下来要谈的不只是金额，而是怎样证明培训并非焦虑驱动的重复消费，又不让每次学习选择都变成家庭审计。"],
    inspiration: "原创",
    trigger: { earliestWeek: 20, latestWeek: 78, requiredTags: ["origin:wealthy-family"], probability: 0.38 },
    choices: [
      {
        id: "wealthy-budget-plan",
        title: "整理培训预算和复盘目标",
        preview: "家庭支持 +3 · SAN -1",
        result: "你把报名费、交通、住宿和资料支出逐项列出，又在旁边写明这次培训想解决的三个具体问题，以及回来后如何检验。家长没有立刻同意，而是追问上一次课程究竟留下了什么，直到你拿出完成的订正记录，预算才被批准。对方同时约定下一次会检查复盘是否落实，若只是换地方刷题，后续投入就要重新评估。钱的问题暂时解决了，宽裕却没有变成无限许可，而是被转化为一种有条件、需要成果和沟通共同维持的长期支持。",
        effects: { familySupport: 3, san: -1 },
      },
      {
        id: "wealthy-just-pay",
        title: "强调家里并不缺这笔钱",
        preview: "获得短期自由 · 家庭支持 -3",
        result: "你强调家里完全承担得起这笔费用，希望父母不要把普通培训申请变成审判。款项最终按时支付，你也顺利进群上课；可那句“并不缺钱”让家人觉得自己的担忧只被理解成吝啬，而不是对效果和节奏的疑问。下一次申请时，他们要求更完整的成绩证明和预算说明。资源仍在，却不再像从前那样能靠一句需要便轻松获得。",
        effects: { familySupport: -3, pocketMoney: 50 },
      },
    ],
  },
  {
    id: "item-plant-sprout",
    phase: "weekly",
    label: "道具链 · 窗台植物 1/4",
    title: "那包看起来没什么用的种子，真的发芽了。",
    body: ["两片子叶从纸杯边缘探出来，种皮还挂在其中一侧，和包装袋上过分鲜艳的成株照片完全不同。你把纸杯移到能见光的位置，开始在每天的计划表旁记下浇水、温度和叶片变化，也第一次把教材里的萌发条件与窗台上的真实过程对应起来。它不会催你完成记录，更不会因省赛临近暂停生长；是否把这次偶然发芽变成持续观察，取决于你愿不愿意为一件不计分的小事留下固定位置。"],
    inspiration: "原创",
    trigger: { earliestWeek: 3, latestWeek: 70, requiredTags: ["shop:plant-seeds"], blockedTags: ["plant:sprouted"], probability: 0.65 },
    choices: [
      {
        id: "plant-record",
        title: "做一张简短观察表",
        preview: "第二模块 +0.8 · 心态 +1",
        result: "你没有建立复杂指标，只做了一张包含日期、叶片状态、浇水和光照的简短观察表，每次用一分钟更新。记录看起来远不如正式实验严谨，却让变化不再只依靠模糊印象：哪天萎蔫、移动位置后多久恢复都有迹可循。这盆植物从随手摆件变成一个很小的长期观察，也没有因为记录负担过重而在第三天就被计划表放弃。",
        effects: { module2: 0.8, mindset: 1, tags: ["plant:sprouted"] },
      },
      {
        id: "plant-decoration",
        title: "拍张照片，放着就好",
        preview: "SAN +2",
        result: "你给窗台植物拍了一张光线很好的照片，调完颜色后发进相册，却没有记录浇水时间或检查土壤。画面保存了它此刻最精神的样子，也让你产生“已经照顾过”的错觉。接下来几天，计划表继续把生活小事挤到末尾，下一次浇水被交给一个总会更有空的未来自己。照片没有伤害植物，但也不能替现实中的叶片获得水分和持续照料。",
        effects: { san: 2, tags: ["plant:sprouted", "plant:neglected"] },
      },
    ],
  },
  {
    id: "item-plant-drought",
    phase: "weekly",
    label: "道具链 · 窗台植物 2/4",
    title: "连续外培几天后，幼苗叶片软了下来。",
    body: ["你拖着行李回到教室，才发现幼苗的叶片已经失去支撑，贴在纸杯边缘。它没有发出通知，也不会因为你连续外培、忙着订正而暂停生长，表层土壤已经完全发白，杯壁也几乎看不见湿痕。植株尚未彻底枯死，却不能再靠一句“最近太忙”获得水分。你需要判断它还能否恢复，并决定这次补救之后，是重新建立照料节奏，还是承认自己没有余力继续承担。"],
    inspiration: "原创",
    trigger: { earliestWeek: 8, latestWeek: 85, requiredTags: ["plant:sprouted"], blockedTags: ["plant:rescued"], minimumWeeksAfterTags: { "plant:sprouted": 3 }, maximumWeeksAfterTags: { "plant:sprouted": 16 }, probability: 0.5 },
    choices: [
      {
        id: "plant-rescue",
        title: "补水、移到散射光并继续观察",
        preview: "心态 +1 · SAN +1",
        result: "你没有立刻丢掉那盆萎蔫的植株，而是先检查盆土与根部，把它移到散射光下，分次补水并记录叶片角度。夜里它仍显得毫无精神，第二天清晨却已有大半叶片重新挺起，新叶边缘仍留着轻微卷曲。它恢复得比你预想快，却没有回到从未受损的样子。你在观察表里写下时间和处理步骤，也顺手记住一个不只适用于植物的判断：恢复不是按下撤销键，及时调整能减少后果，却不能假装此前的消耗没有发生。",
        effects: { mindset: 1, san: 1, tags: ["plant:rescued"] },
      },
      {
        id: "plant-give-away",
        title: "交给更有空的队友照料",
        preview: "同学好感 +1 · 结束个人植物线",
        result: "你承认自己近期没有稳定时间照料，把植物和原先的观察本一起交给更有空的队友，并说明光照与浇水习惯。对方认真接手，几周后还发来新叶照片，植物确实比留在你桌边更稳定地活了下来。只是后来所有生长记录都写在另一张桌旁，你从照料者变成偶尔询问近况的人。放手保住了生命，也意味着这段长期观察不再主要属于你。",
        effects: { peerFavor: 1, tags: ["plant:rescued", "plant:shared"] },
      },
    ],
  },
  {
    id: "item-plant-aphids",
    phase: "weekly",
    label: "道具链 · 窗台植物 3/4",
    title: "嫩叶背面出现了一小群蚜虫。",
    body: ["几片叶面已经出现发黏的痕迹，队友担心蚜虫扩散到教室其他盆栽，第一反应是把整盆扔掉；你却想起趋集、取食与植物防御都能从这团麻烦里找到对应知识。观察具有价值，拖延处理也可能让虫害扩大。你得先隔离风险，再决定保留多长时间、记录哪些特征，以及什么时候结束这场并非为了竞赛而设计的小实验。"],
    inspiration: "原创",
    trigger: { earliestWeek: 14, latestWeek: 95, requiredTags: ["plant:rescued"], blockedTags: ["plant:observed"], minimumWeeksAfterTags: { "plant:rescued": 4 }, maximumWeeksAfterTags: { "plant:rescued": 22 }, probability: 0.48 },
    choices: [
      {
        id: "plant-observe-aphids",
        title: "隔离植株，观察后再处理",
        preview: "第二模块 +1 · 第三模块 +0.8 · SAN -1",
        result: "你先把受害植株移到窗边单独放置，用放大镜记录蚜虫在嫩叶与叶脉附近的取食位置，又连续观察它们随光照和触碰产生的趋集变化。确认不会扩散到其他盆栽后，你才采用温和方式处理，并保留几张不同时间点的照片。原本只是窗台上的小麻烦，意外把昆虫行为、植物防御与种群增长串到了一起。笔记里多出的不是一道标准答案，而是一段从发现问题、控制变量到结束观察的完整小实验。",
        effects: { module2: 1, module3: 0.8, san: -1, tags: ["plant:observed"] },
      },
      {
        id: "plant-clean-fast",
        title: "立刻清理，不让它影响书桌",
        preview: "SAN +1",
        result: "你没有为了观察行为继续容忍蚜虫扩散，而是立即隔离植株、清理受害叶片和桌面，并用温和方式完成处理。虫害很快消失，旁边的书和食物也没有受到影响；你只在观察本上留下出现日期，没有再追加完整实验。生物兴趣并不要求把每件生活小事都变成研究课题，有时及时恢复卫生和秩序就是最合适的处理。",
        effects: { san: 1, tags: ["plant:observed"] },
      },
    ],
  },
  {
    id: "item-plant-flower",
    phase: "weekly",
    label: "道具链 · 窗台植物 4/4",
    title: "在省赛前最忙的一周，窗台上开出第一朵花。",
    body: ["那株一路经历缺水与虫害的植物开出第一朵花，颜色比种子包装上朴素得多。它没有提高任何模考排名，也不能抵消当天错掉的题，却把几个月前那次几乎毫无理由的消费完整地照应回来。队友们轮流拍照，连催着集合的教练也停了一秒。你忽然面对一种不在训练计划中的完成感：它值得被认真记录，还是只应成为短暂休息后继续赶路的背景？"],
    inspiration: "原创",
    trigger: { earliestWeek: 34, latestWeek: 104, requiredTags: ["plant:observed"], minimumWeeksAfterTags: { "plant:observed": 8 }, maximumWeeksAfterTags: { "plant:observed": 42 }, probability: 0.7 },
    choices: [
      {
        id: "plant-keep-seeds",
        title: "保留种子，写下这段观察",
        preview: "心态 +3 · 同学好感 +1",
        result: "你没有把成熟果荚随手清掉，而是挑出几粒完整种子，装进写有日期与亲本状态的小纸袋，再把一粒压进观察本作为标记。翻到前几页时，你看见最初那株幼苗还只是两片模糊的子叶，旁边夹着当时匆忙写下的浇水记录。下一代种子不能直接换来考试分数，也算不上正式竞赛资料，却把两年的学习、搬动和等待压缩成一个可以握住的时间刻度。你决定留下它们，等合适季节再验证这段照料是否真的能延续。",
        effects: { mindset: 3, peerFavor: 1, tags: ["plant:completed"] },
      },
      {
        id: "plant-share-flower",
        title: "把花留在竞赛教室",
        preview: "SAN +3 · 同学好感 +2",
        result: "你没有把开花的植物搬回宿舍独自收藏，而是留在竞赛教室窗台，并在花盆旁贴上最初播种日期。曾经笑那包种子“买来没用”的队友现在会顺手检查土壤，新加入的人也从标签得知它怎样熬过外培和断水。花没有因此变成宏大象征，却成了公共空间里一段可见时间；此后每个来到教室的人，都知道它来自那包差点被丢掉的种子。",
        effects: { san: 3, peerFavor: 2, tags: ["plant:completed"] },
      },
    ],
  },
  {
    id: "item-lucky-pen-test",
    phase: "weekly",
    label: "道具链 · 幸运笔 1/2",
    title: "你第一次带着那支“玄学签字笔”参加模考。",
    body: ["开考前它只是队友塞进你手里的玩笑，笔杆颜色甚至和整套文具不搭；分数出来后，你却恰好比上周高了一截。有人立刻把进步归功于这支笔，开始认真讨论是否应当封存到联赛再用。你明知训练、题型和状态才是更合理的解释，也不能否认握住熟悉物件时确实少了一点紧张。接下来要决定的，是把它保留为轻松的仪式，还是让一次巧合逐渐承担成绩的因果。"],
    inspiration: "原创",
    trigger: { earliestWeek: 10, latestWeek: 85, requiredTags: ["shop:lucky-pen"], blockedTags: ["lucky:tested"], probability: 0.5 },
    choices: [
      {
        id: "lucky-enjoy",
        title: "享受仪式感，但照常复盘",
        preview: "心态 +2 · 思辨 +0.5",
        result: "你仍把那支所谓幸运笔放进考试笔袋，入场前看到它会想起队友的玩笑，紧张也确实松开一点；但成绩出来后，你没有把发挥归功于笔，也没有在失误时急着寻找新的吉祥物。你照常按题型和原因复盘，让错题本解释分数，让仪式感只负责提醒自己曾被陪伴。相信一个小物件可以带来安定，不必等于把判断和责任一起交给它。",
        effects: { mindset: 2, reasoning: 0.5, tags: ["lucky:tested"] },
      },
      {
        id: "lucky-believe",
        title: "宣布联赛必须用它",
        preview: "SAN +2 · 埋下遗失事件",
        result: "你宣布联赛必须使用这支幸运笔，队友顺势为它配了专用笔袋，还约好考前轮流检查是否带上。仪式最初让所有人觉得好笑，也确实缓解了紧张；可当笔尖一次短暂断墨时，你立刻把状态波动归咎于预兆。一个普通物件开始承担本不属于它的成绩责任。你仍能带它入场，却需要准备好即使换笔，自己的判断和训练也不会随之消失。",
        effects: { san: 2, tags: ["lucky:tested", "lucky:believed"] },
      },
    ],
  },
  {
    id: "item-lucky-pen-lost",
    phase: "weekly",
    label: "道具链 · 幸运笔 2/2",
    title: "考前整理文具时，幸运笔不见了。",
    body: ["你把文具袋倒在桌面上，那支被全队叫作幸运笔的签字笔却没有出现。它可能落在教室，也可能夹进某套卷子，距离入场只剩有限时间。真正让你心跳加快的不是价格，而是过去几次模考前，你已经把熟悉的重量与“状态会稳定”绑在一起。继续寻找或许能找回仪式感，也会打乱睡眠和准备流程；拿起普通备用笔，则要验证训练是否真能在吉祥物缺席时独立工作。"],
    inspiration: "原创",
    trigger: { earliestWeek: 28, latestWeek: 104, requiredTags: ["lucky:believed"], minimumWeeksAfterTags: { "lucky:believed": 6 }, maximumWeeksAfterTags: { "lucky:believed": 36 }, probability: 0.55 },
    choices: [
      {
        id: "lucky-use-normal-pen",
        title: "拿普通笔，按既定流程准备",
        preview: "心态 +2 · SAN -1",
        result: "你没有继续寻找丢失的幸运笔，而是从文具袋拿出一支普通备用笔，按既定顺序检查证件、涂卡和时间分配。起初少了熟悉重量让你有些不安，写完前几题后，字迹和判断并没有任何不同。仪式感没有被嘲笑或彻底否定，只是被收回到能够控制的准备流程里：真正提供稳定的，是备用方案和反复练习，而不是某一支笔必须在场。",
        effects: { mindset: 2, san: -1, tags: ["lucky:resolved"] },
      },
      {
        id: "lucky-search-night",
        title: "把教室翻到熄灯",
        preview: "找回熟悉的仪式感，但压缩睡眠和准备时间",
        result: "你坚持把整间竞赛教室翻到熄灯，抽屉、书架和废卷堆逐一检查，最后在一叠几个月前的旧卷子下面找到那支笔。失而复得的一刻让你明显松了口气，甚至更加相信它不能在考试前离开身边；可回宿舍时已经比计划晚了一小时。东西被找回，睡眠却无法一同补回，幸运物也因此承担了越来越重的焦虑。",
        effects: { san: 2, mindset: -1.5, competitionTime: -0.15, tags: ["lucky:resolved"] },
      },
    ],
  },
  {
    id: "item-card-game-night",
    phase: "weekly",
    label: "道具事件 · 一局卡牌",
    title: "外培酒店熄灯前，队友看见了你买的生物主题卡牌。",
    body: ["原本只打算在熄灯前玩十分钟，卡牌上的捕食、竞争与共生关系却很快引出一场生态学争论，连出牌规则都被拿来质疑教材表述。房间里笑声不断，第一次没有人主动比较当天模考分数。放松似乎终于有了入口，但墙上的时间也在继续走。你们需要约定何时结束，才能让这局游戏既不是另一套伪装成娱乐的题目，也不成为明早所有人注意力涣散的理由。"],
    inspiration: "原创",
    trigger: { earliestWeek: 12, latestWeek: 90, requiredTags: ["shop:card-game"], probability: 0.48 },
    choices: [
      {
        id: "card-play-one-round",
        title: "只玩一局，输了的人讲一道错题",
        preview: "同学好感 +3 · SAN +2 · 第三模块 +0.5",
        result: "你们约定只玩一局，输的人必须用刚才的卡牌机制讲一道错题。游戏结束时大家真的收起牌，没有用“最后一把”拖过熄灯时间；输家把种间关系讲得过分戏剧化，却意外留下几条很好记的生态学线索。娱乐没有伪装成高效学习，也没有吞掉第二天状态。更重要的是，你们第一次共同证明，放松可以有边界，而不是只能在彻底禁绝和失控熬夜之间二选一。",
        effects: { peerFavor: 3, san: 2, module3: 0.5, tags: ["卡牌夜"] },
      },
      {
        id: "card-play-late",
        title: "再来一局，反正明早只是模考",
        preview: "同学好感 +2 · SAN +3 · 心态 -1",
        result: "你说服大家再开一局，房间里很快又响起争牌和笑声。有人在最后一轮翻盘，你们为了复盘那步操作一直聊到熄灯后，关系确实比白天训练时自然许多。第二天模考发卷，第一道本来熟悉的材料题却读了三遍才看懂，昨夜的默契没有替你恢复睡眠。快乐是真实的，注意力透支也同样真实，两者没有互相抵消。",
        effects: { peerFavor: 2, san: 3, mindset: -1 },
      },
    ],
  },
  {
    id: "item-field-kit-outing",
    phase: "weekly",
    label: "道具事件 · 校园小样方",
    title: "周末午后，你把袖珍野外观察套装带到校园荒地。",
    body: ["套装里只有一根卷尺、一个放大镜和几张薄薄的记录纸，当然做不出能够代表整个校园的正式调查。可当你把边长真正量在荒地上，纸面里整齐的“样方”立刻遇到石块、匍匐茎和边界个体，连计数都不再理所当然。这些工具足以让抽象方法第一次落到真实地面，也可能把难得的周末再次变成任务。你要决定今天究竟想练习调查，还是只想重新看看生物本身。"],
    inspiration: "原创",
    trigger: { earliestWeek: 15, latestWeek: 90, requiredTags: ["shop:field-kit"], probability: 0.42 },
    choices: [
      {
        id: "field-kit-team",
        title: "叫两位队友一起做简易记录",
        preview: "第三模块 +1.5 · 同学好感 +2 · 实验 +0.5",
        result: "你叫来两位队友一起做简易记录，先为样方范围、个体数量和重复计数订下最低规则。样本量仍然很小，场地差异也让误差无法忽略，结果当然不能代表整个校园；但你们从“匍匐茎连着的到底算几株”争到统一标准，第一次真正理解操作定义为什么必须写在数据之前。一次粗糙观察没有产生可靠结论，却练到了结论成立所需的边界。",
        effects: { module3: 1.5, peerFavor: 2, experiment: 0.5, tags: ["校园样方记录"] },
      },
      {
        id: "field-kit-relax",
        title: "只随便看看，不把它变成任务",
        preview: "SAN +3 · 心态 +1",
        result: "你带着观察工具走到校园荒地，却没有划样方、统计物种或把周末再次变成一项必须完成的研究任务。你只是辨认几种熟悉植物，看蚂蚁绕过石缝，在风变凉时坐到草地边。没有数据可以写进报告，也没有知识点立刻增长；但那天下午真实的气味、风和阳光被完整记住，让“喜欢生物”暂时不必通过成绩或记录证明。",
        effects: { san: 3, mindset: 1 },
      },
    ],
  },
  {
    id: "item-slide-box-discovery",
    phase: "weekly",
    label: "道具事件 · 空切片盒",
    title: "实验启蒙后，你终于知道那个空切片盒可以装什么。",
    body: ["教练允许你从清理台上保存几张制作失败却有代表性的切片：有的过厚，有的起皱，还有一张染色深到几乎看不清结构。那个曾经只是随手买下的空盒终于有了用途，玻片按日期排进去，像一册可以透光查看的实验错题本。失败样本能够帮助比较，也需要编号、说明和安全保管；若只是把它们收集起来，盒子很快又会变成另一种没有复盘的纪念品。"],
    inspiration: "原创",
    trigger: { earliestWeek: 29, latestWeek: 100, requiredTags: ["shop:slide-box"], probability: 0.5 },
    choices: [
      {
        id: "slide-box-label",
        title: "按失败原因编号保存",
        preview: "实验 +2 · 思辨 +0.5",
        result: "你没有把失败切片直接丢掉，而是按过厚、褶皱、染色过深和气泡分别编号，记录对应操作与当时用时。几轮下来，同类问题开始聚集，你也看见某些失误其实来自同一个持刀角度。样本仍然不好看，却不再只是一次次模糊的“重做”。当失败原因能够被保存和比较，下一次练习便有了可验证的改动，而不是单纯重复相同步骤。",
        effects: { experiment: 2, reasoning: 0.5, tags: ["切片失败档案"] },
      },
      {
        id: "slide-box-give",
        title: "送给更需要的队友",
        preview: "同学好感 +2",
        result: "你把这份资料送给近期更需要的队友，没有要求交换同等价值的东西，只请对方真正使用后告诉你哪里有问题。TA起初怕欠下人情，确认你不是借机比较进度后才认真收好。几天后，对方带来自己做得最差的一张卷子，主动约你一起看。资料从单向赠送变成一次允许暴露漏洞的信任，回报也不是另一份昂贵材料。",
        effects: { peerFavor: 2 },
      },
    ],
  },
  {
    id: "item-mug-mistaken",
    phase: "weekly",
    label: "道具事件 · 奇怪的杯子",
    title: "教练端起了你那只印着错误细胞结构图的杯子。",
    body: ["教练本来只想喝口水，视线却在杯身停了几秒，随后用手指点出膜结构、细胞器位置和标注方向至少三处问题。周围队友立刻围过来，有人继续找错，也有人笑你竟然天天用它。原本只是恶趣味纪念品，突然成了竞赛教室的现场找茬题。你可以顺势把错误变成共同游戏，也可以提醒大家，杯子首先仍是用来喝水的普通物件，不必让每件东西都承担教学任务。"],
    inspiration: "原创",
    trigger: { earliestWeek: 8, latestWeek: 75, requiredTags: ["shop:strange-mug"], probability: 0.5 },
    choices: [
      {
        id: "mug-find-errors",
        title: "发起全队找错挑战",
        preview: "第一模块 +0.8 · 同学好感 +2",
        result: "你把错误细胞结构杯放到教室中央，邀请全队逐项找错并说明依据。最初大家只想凑热闹，后来连膜结构、细胞器比例和不可能出现的标注都被写成小标签，杯身最终贴满七处。教练没有把它列入正式训练，新队员却都会先被递来这只杯子接受非正式入队题。一个廉价道具因此变成共同维护、也会持续补充的队伍玩笑。",
        effects: { module1: 0.8, peerFavor: 2, tags: ["错误细胞杯传统"] },
      },
      {
        id: "mug-just-drink",
        title: "它就是个杯子，先喝水",
        preview: "SAN +2",
        result: "你没有因为杯子上印错的细胞结构立刻查书、拍照或发动一场找错挑战，只把它当作普通杯子，先接水喝完。那个明显错误仍留在图案上，之后也许会成为笑话或教学材料；但此刻身体发出的口渴比知识纠正更需要回应。你第一次允许一个生物学错误在桌面上暂时存在，也提醒自己，并非所有看见的问题都必须当场变成新的学习任务。",
        effects: { san: 2 },
      },
    ],
  },
  {
    id: "item-umbrella-rain",
    phase: "weekly",
    label: "道具事件 · 伞向哪边偏",
    title: "晚自习结束时突然下雨，门口站着一名没有带伞的队友。",
    body: ["门檐下的人越来越少，那名队友看了两次雨幕，显然还在等天气转小。你买的折叠伞勉强够两个人使用，若并肩走，总会有一侧肩膀被淋湿；把伞借出，自己则要继续等待。走到宿舍只需十分钟，却足以让一路沉默、一场普通谈话或一次清楚的边界被记住。雨没有替你规定关系该向哪里发展，只给了一个需要当场回应的具体处境。"],
    inspiration: "原创",
    trigger: { earliestWeek: 10, latestWeek: 86, requiredTags: ["shop:folding-umbrella"], probability: 0.46 },
    choices: [
      {
        id: "umbrella-walk-together",
        title: "一起走，把伞放在两人中间",
        preview: "结果取决于当前关系，不提前显示具体变化",
        result: "你把伞放在两人中间，没有刻意靠近，也没有让对方独自淋雨。一路上你们聊的只是今天错得最离谱的题、食堂关门时间和鞋里进水后的狼狈，几次沉默也被雨声自然填满。走到宿舍岔路时，你们才发现彼此都湿了一边肩膀，便笑着催对方快回去换衣服。十几分钟后，手机亮起一句很普通的“到了”。它没有替这段关系命名，却让共同走过的那段路不再只是偶然，也悄悄留下了下一次联络的理由。",
        effects: { peerFavor: 1.2, san: 0.8, tags: ["道具:雨中同行"] },
      },
      {
        id: "umbrella-lend",
        title: "把伞借给TA，自己等雨小一点",
        preview: "结果取决于对方是否记得归还",
        result: "你把伞借给没有带伞的TA，自己留在门厅等雨势变小，没有借机要求同行。半小时后你才独自出发，鞋边仍被积水打湿。第二天，那把伞已经被擦干净、整齐放回桌边，伞柄还多了一张写着你名字的小贴纸，旁边压着一句简短的谢谢。你错过了共同走雨路的机会，却收到一种尊重距离、也认真归还善意的回应。",
        effects: { peerFavor: 1, mindset: 0.4, tags: ["道具:伞柄姓名贴"] },
      },
      {
        id: "umbrella-go-alone",
        title: "说明自己今晚很累，先独自回去",
        preview: "保护精力，但可能错过一次相处",
        result: "你坦白今晚已经很累，想一个人走回去，没有因为担心显得冷淡而勉强延长聊天。对方看了看雨，只提醒你到宿舍后发一句消息，便在路口转向另一边。你独自撑伞，听雨声盖过训练楼里的讨论，十几分钟里不必照顾任何人的语气。一次偶遇没有被强行变成人际任务，清楚表达需要独处也没有让关系立刻受损。",
        effects: { san: 1.2, peerFavor: -0.2, tags: ["道具:雨夜边界"] },
      },
    ],
  },
  {
    id: "item-gift-bag-choice",
    phase: "weekly",
    label: "道具事件 · 没写名字的礼袋",
    title: "牛皮纸礼袋在抽屉里放了一周，你仍然没有写下收件人。",
    body: ["礼袋已经装好，纸绳却仍保持着刚买来的整齐形状。你几次想写名字，又在落笔前停下：送礼可以是对长期帮助的感谢，也可能被理解为亲密试探、事后补偿或一笔需要回报的人情。真正困难的不是把东西递出去，而是先承认自己希望对方怎样理解，并接受对方未必给出相同答案。继续空着也不是毫无选择，它只是把这句尚未说清的话再保存一段时间。"],
    inspiration: "原创",
    trigger: { earliestWeek: 14, latestWeek: 92, requiredTags: ["shop:gift-bag"], probability: 0.42 },
    choices: [
      {
        id: "gift-thank-teammate",
        title: "送给最近帮助过自己的队友，只认真道谢",
        preview: "不公开具体关系收益",
        result: "你把礼袋递给最近反复帮你核对实验记录的队友，只认真说明这是对那些具体帮助的感谢，没有借机暗示别的期待。对方先愣了一下，谨慎地问是不是出了什么事；听见你把几次帮忙逐一说清，又确认不需要回礼，才笑着把东西收下。你们都在那一刻松了口气。礼物没有把关系推向暧昧，也没有制造一笔必须偿还的人情，它只是让原本容易被当作理所当然的照顾被看见，并为这段合作补上一句及时、明确的谢谢。",
        effects: { peerFavor: 1.5, social: 0.3, tags: ["道具:礼物送达"] },
      },
      {
        id: "gift-say-more",
        title: "在卡片上写下比感谢更多一点的话",
        preview: "可能拉近关系，也可能制造短暂尴尬",
        result: "你没有只在卡片上写一句谢谢，而是具体提到对方替你补过的通知、默默留下的座位和一次没有追问的陪伴。那段话没有给关系下定义，也没有要求收礼的人作出同等回应，却让TA知道，那些没有被旁人看见的帮助并未被当成理所当然。礼袋终于承载了你能确认的心意：不是借物品替你告白，而是把长期记得的细节认真交还。",
        effects: { peerFavor: 1, san: -0.4, mindset: 0.4, tags: ["道具:礼物与未命名心意"] },
      },
      {
        id: "gift-keep-empty",
        title: "暂时不送，保留这个空袋子",
        preview: "没有人际收益",
        result: "你没有因为礼袋已经买好就仓促挑一个收件人，而是把它留在抽屉里，承认自己还没想清这份礼物究竟是感谢、安慰还是更亲密的试探。空袋子偶尔会在拿文具时被看见，提醒你有一句话尚未准备好；它没有过期，也没有被用来制造必须回应的场面。有些礼物并非错过，只是你暂时不愿让一个包装替自己说出连自己都未确认的意思。",
        effects: { san: 0.5, tags: ["道具:未送出的礼袋"] },
      },
    ],
  },
  {
    id: "item-usb-backup",
    phase: "weekly",
    label: "道具事件 · 最终版_真的最终版",
    title: "电脑突然死机时，你第一次庆幸买了那个旧U盘。",
    body: ["自动恢复只找回一部分内容，旧U盘里则完整留着几周前的错题、图片和多份来源复杂的讲义。备份确实保护了已经投入的劳动，也把重复版本、错误答案和不明来源的内部文件一起保存下来。重新复制全部内容最省事，却会让混乱继续扩张；逐项整理需要时间，也迫使你判断哪些资料可靠、哪些文件有权继续传播。数据没有丢失只是第一层安全，能否解释其出处才决定它以后会不会反过来误导你。"],
    inspiration: "原创",
    trigger: { earliestWeek: 16, latestWeek: 100, requiredTags: ["shop:data-usb"], probability: 0.45 },
    choices: [
      {
        id: "usb-organize",
        title: "按来源、版本和勘误重新整理",
        preview: "耗费精力，但以后查找更稳定",
        result: "你没有继续往文件夹里塞新资料，而是按来源、年份、版本和是否经过勘误重新建立目录。三份名字都叫“最终版”的重复文件被逐一比对后删除，来源不明或答案存疑的资料则被加上醒目标记，暂时移到待核区。整理过程中，你还发现一份常用讲义引用了旧版结论，于是补上新的参考链接。几个小时后，文件数量少了一截，却终于能回答“这份东西为什么值得信”。资料库不再像随机生成的遗迹，也降低了你以后被错误版本反复误导的机会。",
        effects: { reasoning: 0.35, problemSpeed: 0.2, san: -0.5, tags: ["道具:资料完成备份"] },
      },
      {
        id: "usb-share-boundary",
        title: "只保存自己的整理，不复制来源不明的内部文件",
        preview: "没有直接学习收益",
        result: "你只保存自己整理、来源清楚且允许共享的文件，没有因为“大家都有”就复制来历不明的内部题和培训资料。清理后U盘空出不少容量，也意味着你主动放弃了一些可能有用的内容；可目录终于能够标明出处、版本和勘误，不再混着无法验证的所谓最终版。你第一次把资源边界也当成学习的一部分：能拿到什么之外，还要判断什么应当被保留。",
        effects: { mindset: 0.5, social: 0.3, tags: ["道具:资料边界"] },
      },
      {
        id: "usb-save-all",
        title: "先全部塞进去，以后再分类",
        preview: "获得安全感，但问题被推迟",
        result: "你来不及分类，先把桌面、聊天文件和各个所谓最终版全部塞进U盘，确认重要内容至少有第二份副本。死机风险暂时解除，整周笔记也没有再次丢失；可文件名重复、来源混杂，之后查找某张图时要打开好几个版本。紧急备份完成了它最基本的职责，也把整理成本完整推迟到未来。下次若不补索引，安全感很快会被失控目录抵消。",
        effects: { san: 0.8, tags: ["道具:收藏即整理"] },
      },
    ],
  },
];
