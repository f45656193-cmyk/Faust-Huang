export type GameEffect = {
  san?: number;
  academics?: number;
  familySupport?: number;
  coachFavor?: number;
  peerFavor?: number;
  social?: number;
  mindset?: number;
  reasoning?: number;
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

export type GameEvent = {
  id: string;
  phase: "opening" | "weekly" | "training" | "exam" | "ending";
  title: string;
  label: string;
  body: string[];
  quote?: string;
  inspiration?: "原创" | "真实经历改写" | "公开资料梗改写";
  trigger: {
    earliestWeek: number;
    latestWeek: number;
    requiredTags?: string[];
    blockedTags?: string[];
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
    "班主任把一张薄薄的通知压在桌面上。竞赛教室在实验楼四层，这个暑假将进行第一轮选拔。",
    "你听说那里的人已经开始看大学教材，也听说每年真正走到最后的只有很少一部分。",
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
      result: "你在报名表上写下名字。实验楼四层的灯一直亮到傍晚。",
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
      result: "你坐在最后一排，第一次听见老师把高中生物拆成十几个陌生学科。",
      effects: {
        competitionTime: 0.2,
        tags: ["谨慎入门"],
      },
    },
    {
      id: "talk",
      title: "先和家长认真谈谈",
      preview: "家庭支持可能变化 · 社交判定 · 本周不开始教材",
      result: "晚饭后，你把通知放在桌上。父母沉默了一会儿，开始询问这条路究竟要走多久。",
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
      "停课会释放大量竞赛时间，但常规成绩会开始明显下滑。省赛结束后，你需要重新回到班级。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: "apply-temporary-leave",
        title: "申请临时停课",
        preview: "竞赛时间增加 · 常规遗忘加快 · 教练好感 +1",
        result: "申请表被递交到年级组。接下来的三个月，课表上会出现大片空白。",
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
        result: "你决定暂时维持两条路线，至少走到第一次省赛。",
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
      "这次停课不会在一次考试后自动结束。你的常规课堂、作业与校内排名都会逐渐离开日常。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: "apply-formal-leave",
        title: "提交正式停课申请",
        preview: "竞赛时间大幅增加 · 常规分数快速遗忘",
        result: "班主任签下名字。你把课桌里的常规教材搬回宿舍，只留下几本竞赛书。",
        effects: { coachFavor: 2, san: -2, tags: ["正式停课"] },
      },
      {
        id: "delay-formal-leave",
        title: "再维持两个月",
        preview: "继续正常上课 · 十一月仍会统一停课",
        result: "你决定再保留一段普通高中生活，但倒计时已经开始。",
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
      "这不再是个人选择。所有人的课桌从常规教室搬到了竞赛教室，作息也随之改变。",
    ],
    trigger: { earliestWeek: 1, latestWeek: 104 },
    choices: [
      {
        id: "accept-mandatory-leave",
        title: "整理课桌，进入全面竞赛状态",
        preview: "正式停课 · 常规遗忘加快 · 教练好感 +1",
        result: "班级课表从你的日常里消失。下一次回去，很多章节已经翻过去了。",
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
        result: "教练在报名表上勾好住宿和课程。你收到一张从早上七点排到晚上十点的作息表。",
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
        result: "教练提醒你不要只顾着追新题。你仍提交了申请，课程群很快发来三篇预读论文。",
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
        result: "国庆教室里只剩下很少几个人。安静是一种优势，也意味着没有现成的节奏替你推进。",
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
        result: "行李清单的第一项是教材，第二项是插线板。教练要求全队每天十点半前上交手机。",
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
        result: "开课前，群文件已经出现六篇英文论文和一份没有答案的预习题。",
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
        result: "你留在熟悉的竞赛教室。节奏没那么密集，但每天的安排需要自己补全。",
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
    effects: { reasoning: 2, san: -1 },
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
    effects: { coachFavor: 3, social: 1, reasoning: 1 },
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
      "两名队友把打印出来的论文图表摊在窗台上。争论已经持续了十分钟，谁也没能彻底说服谁。",
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
        result: "你的结论并不完全正确，但其中一条反证让所有人重新看了一遍图。",
        effects: { reasoning: 2, peerFavor: 2, san: -1 },
      },
      {
        id: "listen-debate",
        title: "站在旁边听完",
        preview: "思辨 +1 · 无额外压力",
        result: "你没有插话，却记住了两种完全不同的读图顺序。",
        effects: { reasoning: 1 },
      },
    ],
  },
  {
    id: "shared-notes",
    phase: "weekly",
    label: "关系事件 · 那份笔记",
    title: "一位队友问你能不能交换最近的教材笔记。",
    body: ["这份笔记花了你不少时间。对方手里也有一套你没见过的周测错题。"],
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
        result: "你们很快发现，两个人标出的重点几乎没有重合。",
        effects: { peerFavor: 4, reasoning: 1, tags: ["交换笔记"] },
      },
      {
        id: "decline-notes",
        title: "委婉拒绝",
        preview: "SAN +1 · 同学好感 -2",
        result: "你保住了自己的整理成果，也感到教室里的空气稍微冷了一点。",
        effects: { san: 1, peerFavor: -2, tags: ["拒绝交换笔记"] },
      },
    ],
  },
  {
    id: "rival-study-invite",
    phase: "weekly",
    label: "竞争事件 · 临时约题",
    title: "你认识的对手发来一套题：“今晚对答案吗？”",
    body: ["对方刚好擅长你最近不太顺手的模块。你也清楚，共同学习意味着彼此暴露水平。"],
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
        result: "你们互相挑出了三处思维漏洞。谁都没有认输，但答案都变得更完整了。",
        effects: { reasoning: 2, peerFavor: 3, san: -2 },
      },
      {
        id: "skip-rival",
        title: "今晚先休息",
        preview: "SAN +2",
        result: "你关掉聊天框。竞争不会因为一个晚上停下，但睡眠确实很重要。",
        effects: { san: 2 },
      },
    ],
  },
  {
    id: "notes-returned",
    phase: "weekly",
    label: "事件链 · 笔记的回音",
    title: "那份交换出去的笔记回来了，夹着几张密密麻麻的便签。",
    body: ["对方标出了两处可能写错的机制，还附上了一道恰好对应的旧题。"],
    trigger: {
      earliestWeek: 6,
      latestWeek: 104,
      requiredTags: ["交换笔记"],
      minPeerFavor: 20,
      probability: 0.42,
    },
    choices: [
      {
        id: "check-comments",
        title: "逐条核对批注",
        preview: "思辨 +2 · 同学好感 +2 · SAN -1",
        result: "其中一条批注是误解，另一条却真的帮你补上了漏洞。",
        effects: { reasoning: 2, peerFavor: 2, san: -1, tags: ["笔记互助"] },
      },
      {
        id: "thank-only",
        title: "先道谢，等有空再看",
        preview: "同学好感 +1",
        result: "你把便签收进书页。至少这段关系没有停在一次交换上。",
        effects: { peerFavor: 1 },
      },
    ],
  },
  {
    id: "quiz-collapse",
    phase: "weekly",
    label: "训练事件 · 小测失常",
    title: "竞赛小测的分数比你预想中低了很多。",
    body: ["错题里既有没见过的偏题，也有你昨天才抄进笔记的内容。"],
    trigger: {
      earliestWeek: 10,
      latestWeek: 72,
      probability: 0.2,
    },
    choices: [
      {
        id: "audit-errors",
        title: "当晚把失分原因全部分类",
        preview: "思辨 +2 · SAN -3 · 教练好感 +1",
        result: "分数没有改变，但这张卷子从一次打击变成了一张漏洞地图。",
        effects: { reasoning: 2, san: -3, coachFavor: 1 },
      },
      {
        id: "put-away",
        title: "先把卷子收起来",
        preview: "SAN +2 · 心态 +1",
        result: "你决定等情绪平稳后再看。逃避和暂缓，有时只隔着一个期限。",
        effects: { san: 2, mindset: 1 },
      },
    ],
  },
  {
    id: "coach-order-question",
    phase: "weekly",
    label: "教练事件 · 学习顺序",
    title: "教练要求全队暂时放下手中的书，跟着统一进度走。",
    body: ["你原本的计划被打乱了，但教练认为这一轮课程必须先建立共同语言。"],
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
        result: "统一进度并不完全适合你，但你更清楚教练判断重点的方式了。",
        effects: { coachFavor: 3, reasoning: 1, san: -2, tags: ["信任教练安排"] },
      },
      {
        id: "keep-own-plan",
        title: "课上跟随，课后维持自己的顺序",
        preview: "心态 +1 · 教练好感 -1",
        result: "你没有公开反对，但把自己的复习表夹在了讲义下面。",
        effects: { mindset: 1, coachFavor: -1, tags: ["保留自主路线"] },
      },
    ],
  },
  {
    id: "training-group-chat",
    phase: "weekly",
    label: "社交事件 · 培训群邀请",
    title: "外校同学把你拉进了一个省内选手的小群。",
    body: ["群里既有共享资料，也有真假难辨的排名消息。几个人的名字你在联考榜上见过。"],
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
        result: "你第一次意识到，本校教室之外还有一张正在快速交换信息的网络。",
        effects: { social: 2, peerFavor: 2, tags: ["进入省内选手群"] },
      },
      {
        id: "mute-group",
        title: "加入，但先设置免打扰",
        preview: "获得情报 · SAN不变",
        result: "你保留了入口，也没有让滚动的消息占据整个晚上。",
        effects: { tags: ["进入省内选手群"] },
      },
    ],
  },
  {
    id: "answer-key-conflict",
    phase: "weekly",
    label: "训练事件 · 答案和解析各说各话",
    title: "这道题的答案选C，但解析从头到尾都在论证D。",
    body: ["群里已经吵了几十条消息。有人说按答案改，有人坚持教材原文不可能错。"],
    inspiration: "公开资料梗改写",
    trigger: {
      earliestWeek: 8,
      latestWeek: 80,
      minSocial: 42,
      probability: 0.24,
    },
    choices: [
      {
        id: "trace-source",
        title: "查教材和论文，把证据贴进群里",
        preview: "思辨 +2 · 同学好感 +2 · SAN -2",
        result: "最后没人能确定命题人想选什么，但你们确定了解析确实站不住脚。",
        effects: { reasoning: 2, peerFavor: 2, san: -2, tags: ["质疑错题"] },
      },
      {
        id: "memorize-key",
        title: "先记机构答案，考试再说",
        preview: "SAN +1 · 心态 -1",
        result: "你在题号旁边画了一个问号。这不是第一次，也不会是最后一次。",
        effects: { san: 1, mindset: -1 },
      },
    ],
  },
  {
    id: "dense-slides",
    phase: "weekly",
    label: "培训事件 · 一页PPT塞进了半本书",
    title: "投影上的字已经小到后排完全看不清。",
    body: ["图片互相覆盖，箭头穿过六段文字。老师却说：“这一页都是重点。”"],
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
        result: "重画之后，你发现真正有用的信息只有三条，剩下的是老师漫长的学术恩怨。",
        effects: { module2: 1.5, reasoning: 1, san: -2 },
      },
      {
        id: "borrow-clear-notes",
        title: "找前排同学借清楚的笔记",
        preview: "社交 +1 · 同学好感 +1",
        result: "对方把拍下来的原图也一起发给了你。",
        effects: { social: 1, peerFavor: 1 },
      },
    ],
  },
  {
    id: "microphone-failure",
    phase: "weekly",
    label: "培训事件 · 话筒罢工",
    title: "讲座开始十分钟，话筒只剩下断断续续的电流声。",
    body: ["老师越讲越激动，后排只能通过板书和口型猜测重点。"],
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
        result: "你们抱着书挤到前排，意外听见了老师顺口补充的一条重要机制。",
        effects: { social: 1, coachFavor: 1, san: -1 },
      },
      {
        id: "self-study-back",
        title: "留在后排按讲义自学",
        preview: "心态 +1 · 对应模块小幅提升",
        result: "这堂课最终变成了安静的自习。效率没有想象中糟。",
        effects: { mindset: 1, module1: 0.8 },
      },
    ],
  },
  {
    id: "unexpected-classroom-animal",
    phase: "weekly",
    label: "校园事件 · 不请自来的观察材料",
    title: "暴雨之后，教室里闯进了一只所有人都想鉴定的动物。",
    body: ["讲课被迫暂停。有人翻动物学，有人负责拍照，还有人已经开始争论它该分到哪一科。"],
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
        result: "结论不一定正确，但这是你第一次觉得动物学真的从书页里爬了出来。",
        effects: { module2: 1.5, social: 2, san: 1 },
      },
      {
        id: "keep-distance",
        title: "保持距离，负责打开门窗",
        preview: "心态 +1 · 同学好感 +1",
        result: "几分钟后，它消失在走廊尽头，留下整节课的谈资。",
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
      "教练规定十点半统一收手机，但外培群正在激烈讨论当天的争议题。室友问你要不要一起看，走廊里还有老师巡查。",
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
        result: "第二天你确实漏掉了两条讨论，却是少数没有在早课打瞌睡的人。",
        effects: { san: 2, mindset: 1 },
      },
      {
        id: "phone-discuss",
        title: "只看十分钟争议题",
        preview: "思辨 +1 · SAN -2 · 被查到会影响教练好感",
        result: "十分钟最后变成四十分钟。你弄懂了题，也听见巡查老师的脚步在门口停了一下。",
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
      "题干漏了一个关键条件，解析却假装它从未缺失。有人要求机构删题，有人已经开始统计不同答案。",
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
        result: "晚上机构发出更正说明。题依旧很烂，但你至少让排名不再计算这道题。",
        effects: { reasoning: 2, social: 1, san: -1, tags: ["外培申诉成功"] },
      },
      {
        id: "bad-question-rant",
        title: "在群里跟着痛骂半小时",
        preview: "SAN +2 · 心态 -1 · 无学习收益",
        result: "情绪确实释放了，聊天记录也被教练完整看见。",
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
      "有人主张六点半起床刷一套小题，有人认为这会让所有人在上午课上睡着。教练让你们自己先统一意见。",
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
        result: "教练最终同意隔天晨练。不是所有人满意，但至少作息不再靠嗓门决定。",
        effects: { social: 1, mindset: 1, coachFavor: 0.5 },
      },
      {
        id: "schedule-obey",
        title: "服从安排，早晚都练",
        preview: "教练好感 +2 · SAN -5 · 学习效率可能下滑",
        result: "你完成了全部打卡，第三天却在文献课上错过了最关键的图表解释。",
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
      "这份排名混着不同省份、不同年级的选手。它不等于省赛结果，却足以让接下来一整天的空气发生变化。",
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
        result: "总排名被你折进书包，分科差距则变成了下一周能执行的任务。",
        effects: { reasoning: 1.5, mindset: 1, san: -1 },
      },
      {
        id: "ranking-compare",
        title: "把熟悉的名字全部圈出来比较",
        preview: "获得对手情报 · SAN -3 · 心态 -1",
        result: "你记住了十几个名字，却没有因此更清楚明天该学什么。",
        effects: { san: -3, mindset: -1, tags: ["沉迷外培排名"] },
      },
    ],
  },
  {
    id: "training-professor-overrun",
    phase: "training",
    label: "外培事件 · 教授拖堂",
    title: "老教授从一个代谢通路讲到自己的博士论文，已经拖堂四十分钟。",
    body: [
      "内容有趣，也确实超出考试很多。晚饭和晚测都被推迟，教练在门外反复看表。",
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
        result: "你听到了一个非常漂亮的实验故事，也成功把真正能用的三条结论圈了出来。",
        effects: { reasoning: 1, san: -2 },
      },
      {
        id: "professor-leave",
        title: "按原计划离场参加晚测",
        preview: "教练好感 +1 · 可能冒犯讲师",
        result: "你从最后一排悄悄离开。教练点了点头，教授似乎根本没有注意。",
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
      "老师认为这是“锻炼陌生情境”，后排却已经有人怀疑命题者只是想展示自己最近读了什么。",
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
        result: "你仍然不懂模型全貌，却拿到了这道题大部分能由材料支持的分数。",
        effects: { reasoning: 2.5, san: -2 },
      },
      {
        id: "paper-dismiss",
        title: "把它归为机构炫技题",
        preview: "SAN +1 · 错过陌生题训练",
        result: "这道题没有再折磨你，但其中两张图的读法也一起被放弃了。",
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
        result: "你们最终保留了两个无法由材料排除的解释。沈砚把纸对折收好：“这比猜命题人想法有用。”",
        effects: { reasoning: 2.5, peerFavor: 2, san: -2.5, tags: ["沈砚-共同读图"] },
      },
      {
        id: "shen-stop-tonight",
        title: "约好明天继续，今晚先回寝室",
        preview: "SAN +1 · 同学好感 +1",
        result: "沈砚没有反对，只在群里补发了一篇相关论文。第二天你发现他凌晨一点还改过一次消息。",
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
        result: "讲师本来已经背上包，听完问题又站在走廊画了十分钟维管束。回房间时，机构的热水刚好停了。",
        effects: { module2: 1.5, social: 1, san: -1, tags: ["唐榆-外培同行"] },
      },
      {
        id: "tang-night-snack",
        title: "去便利店补充糖分",
        preview: "SAN +2.5 · 心态 +0.5 · 零花钱 -18",
        result: "你们在路灯下分完一盒关东煮，短暂地没有谈排名、进度或明天的模考。",
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
        result: "第一遍你只写出一半。对照笔记补完后再合上本子，第二遍终于能把因果链连起来。",
        effects: { module2: 2, san: -1, peerFavor: 2, tags: ["乔木-遗忘复盘"] },
      },
      {
        id: "qiao-return-own-plan",
        title: "记下漏洞，按自己的计划稍后巩固",
        preview: "心态 +0.5",
        result: "你在周计划旁画了一个醒目的红圈。它会不会被真正完成，要等下一周才知道。",
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
        result: "讲到第二道题时，你发现自己会做却不会解释。许澄追问的每一句，都像在答案里凿开一道缝。",
        effects: { reasoning: 2, module3: 1, peerFavor: 2, san: -2, tags: ["许澄-交换错题"] },
      },
      {
        id: "xu-avoid-comparison",
        title: "说今天状态不好，先不对卷",
        preview: "SAN +1 · 同学好感 -1",
        result: "许澄点点头离开。那张排名表暂时从你眼前消失了，失分原因却还留在原地。",
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
      latestWeek: 112,
      requiredTags: ["第1次省赛-进入省队"],
      minSocial: 52,
      probability: 0.28,
    },
    choices: [
      {
        id: "camp-finish-debate",
        title: "用一分钟给出可检验的判别方案",
        preview: "实验 +1.5 · 思辨 +1 · SAN -2 · 社交 +1",
        result: "你提出补做一组分层取样。第二天讲师公布参考方案时，何闻野隔着两排座位向你比了个手势。",
        effects: { experiment: 1.5, reasoning: 1, san: -2, social: 1, tags: ["省队-宿舍讨论"] },
      },
      {
        id: "camp-sleep-first",
        title: "叫停讨论，明早再说",
        preview: "SAN +2",
        result: "你把眼罩拉下来。几分钟后，隔壁床还在用气声争论显著性水平。",
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
      probability: 0.18,
    },
    choices: [
      {
        id: "altitude-trace-source",
        title: "查找原始资料，在笔记中订正",
        preview: "思辨 +1.5 · 第三模块 +1 · SAN -1",
        result: "原文果然使用了完全不同的单位。你在页边写下：教材是参考，不是不可质疑的判决书。",
        effects: { reasoning: 1.5, module3: 1, san: -1, tags: ["教材考据"] },
      },
      {
        id: "altitude-meme",
        title: "拍下来发进训练群",
        preview: "同学好感 +2 · 社交 +1",
        result: "当天晚上，群名被短暂改成了“近地轨道迁徙研究所”。",
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
        result: "问题最终还是没能接回课程，但笑声让昏沉的下午短暂恢复了精神。",
        effects: { peerFavor: 3, social: 1 },
      },
      {
        id: "phone-focus-back",
        title: "忍住笑，继续整理板书",
        preview: "对应课程保持 · SAN +1",
        result: "五分钟后，讲师已经翻到下一张图。只有群里的表情包还在快速增加。",
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
        result: "真正恢复时，你们比其他组更快找回了步骤。被打断的实验没有完美完成，但混乱没有继续扩大。",
        effects: { experiment: 1.5, reasoning: 1, san: -1 },
      },
      {
        id: "outage-eat-icecream",
        title: "先吃冰棒，接受今天无法全真",
        preview: "SAN +3 · 心态 +0.5",
        result: "冰棒比实验结果更可靠。你第一次在模考时间里拥有了二十分钟真正的休息。",
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
      "讲师看了眼时间，很满意地总结：“今天讲得比较慢，只覆盖了两百多页。”",
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
        result: "你的笔记从密密麻麻的句子变成了十几个框。至少在课程结束时，你仍知道自己听过什么。",
        effects: { reasoning: 1, module4: 1, san: -2 },
      },
      {
        id: "no-break-restroom",
        title: "在下一次转身写板书时悄悄离场",
        preview: "SAN +2 · 心态 +0.5",
        result: "走廊的空气前所未有地清醒。回来时，PPT又前进了四十页。",
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
        result: "你把每页用时写在卷首。下一次遇到厚卷时，至少不会再把全部时间留在第一篇材料。",
        effects: { reasoning: 2, mindset: 1, san: -2, tags: ["厚卷时间策略"] },
      },
      {
        id: "pages-argue",
        title: "加入同学对题量的集体吐槽",
        preview: "同学好感 +2 · SAN +2",
        result: "吐槽没有让卷子变薄，却让“只有我完全做不完”的恐慌消失了一点。",
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
      probability: 0.19,
    },
    choices: [
      {
        id: "not-right-evidence",
        title: "限定题干语境，写出一份完整反驳",
        preview: "思辨 +2.5 · SAN -2 · 同学好感 +1",
        result: "答案没有当场更改，但你的反驳被转进了选手群。至少大家开始区分“知识错误”和“表述争议”。",
        effects: { reasoning: 2.5, san: -2, peerFavor: 1, tags: ["答案表述争议"] },
      },
      {
        id: "not-right-log-only",
        title: "记入争议题档案，到此为止",
        preview: "思辨 +1 · SAN +1",
        result: "你在错题类型一栏新增了“命题语言”。不是所有失分都能靠多背一遍教材解决。",
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
        result: "青蛙在地砖上停了几秒，随后跳进草丛。那一晚的遗传学少讲了一页，校园生活却多了一段真正的观察记录。",
        effects: { module2: 1, experiment: 0.5, mindset: 1 },
      },
      {
        id: "frog-class-photo",
        title: "拍照发群，继续上课",
        preview: "同学好感 +1 · SAN +1",
        result: "照片很快变成了表情包。老师重新打开PPT，台下仍有人小声讨论它到底是哪一种。",
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
        result: "你无法控制名单核验，但至少没有让每一条未经证实的转发占满整个夜晚。",
        effects: { mindset: 1, san: 1 },
      },
      {
        id: "midnight-support-friends",
        title: "陪状态崩溃的外省朋友等正式通知",
        preview: "社交 +2 · 同学好感 +2 · SAN -3",
        result: "最终名单在更晚的时候确认。你几乎没睡，却记住了几个人在最混乱时互相递水和充电线的样子。",
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
      "你原本只想说一句“粗心”，他却从题干、知识漏洞一路问到训练计划。别人需要预约的复盘，在你家会自然发生；代价是你很难真正下课。",
    ],
    inspiration: "原创",
    trigger: { earliestWeek: 5, latestWeek: 30, requiredTags: ["origin:coach-family"], probability: 0.42 },
    choices: [
      {
        id: "coach-family-accept-review",
        title: "把整道题讲完，接受一次家庭复盘",
        preview: "思辨 +2 · 家庭支持 +1 · SAN -2",
        result: "漏洞很快被指出，晚饭却凉了。你获得了方向，也更清楚家庭期待不会在教室门口停止。",
        effects: { reasoning: 2, familySupport: 1, san: -2, tags: ["家庭复盘常态化"] },
      },
      {
        id: "coach-family-set-boundary",
        title: "约定饭后只聊十五分钟",
        preview: "心态 +1 · 家庭支持 -1",
        result: "父亲有些不习惯，但同意把剩下的问题留到周末。餐桌第一次重新像餐桌。",
        effects: { mindset: 1, familySupport: -1, tags: ["与教练家长建立边界"] },
      },
    ],
  },
  {
    id: "origin-coach-family-failure",
    phase: "weekly",
    label: "出身事件 · 别人家的标准",
    title: "一次竞赛小测后，有人当着你的面说：“教练家的孩子也就这样？”",
    body: ["一句玩笑把你的成绩和父母职业绑在了一起。你既无法否认资源优势，也不愿让每次失误都变成家庭评价。"],
    inspiration: "原创",
    trigger: { earliestWeek: 16, latestWeek: 70, requiredTags: ["origin:coach-family", "家庭复盘常态化"], probability: 0.34 },
    choices: [
      {
        id: "coach-family-own-route",
        title: "承认资源优势，但坚持成绩是自己的",
        preview: "心态 +2 · 社交 +1",
        result: "话题没有立刻消失，但你第一次用自己的语言描述了这条路。",
        effects: { mindset: 2, social: 1 },
      },
      {
        id: "coach-family-prove",
        title: "连夜加练，证明他们错了",
        preview: "思辨 +1.5 · SAN -4",
        result: "第二天的题做得更快，那句话却没有因此从脑海里消失。",
        effects: { reasoning: 1.5, san: -4 },
      },
    ],
  },
  {
    id: "origin-top-scorer-spotlight",
    phase: "weekly",
    label: "出身事件 · 状元光环",
    title: "校内竞赛榜第一次公布，你的名字没有出现在前三。",
    body: ["班主任没有批评，只问了一句“是不是还没适应”。这句体谅比责备更像提醒：所有人仍把中考成绩当作你的默认水平。"],
    inspiration: "原创",
    trigger: { earliestWeek: 7, latestWeek: 35, requiredTags: ["origin:top-scorer"], probability: 0.45 },
    choices: [
      {
        id: "top-scorer-learn-biology",
        title: "承认竞赛需要重新从零学习",
        preview: "心态 +1 · 思辨 +1.5",
        result: "你把“我本来就应该会”改成“我正在学”。光环没有消失，至少不再妨碍你提问。",
        effects: { mindset: 1, reasoning: 1.5, tags: ["状元开始接受新手期"] },
      },
      {
        id: "top-scorer-hide-score",
        title: "避开榜单，也不和同学讨论",
        preview: "同学好感 -1 · SAN -2",
        result: "没有人继续追问，但你也失去了听见别人如何跨过同一阶段的机会。",
        effects: { peerFavor: -1, san: -2 },
      },
    ],
  },
  {
    id: "origin-top-scorer-double-duty",
    phase: "weekly",
    label: "出身事件 · 两张成绩单",
    title: "学校希望你同时维持常规年级排名和竞赛队表现。",
    body: ["招生时的承诺被重新提起。对别人而言可以取舍的两条路线，在你这里被默认都要漂亮。"],
    inspiration: "原创",
    trigger: { earliestWeek: 22, latestWeek: 70, requiredTags: ["origin:top-scorer", "状元开始接受新手期"], probability: 0.35 },
    choices: [
      {
        id: "top-scorer-negotiate-priority",
        title: "拿计划表与学校谈阶段性优先级",
        preview: "社交 +1 · 学校关系改善 · SAN -1",
        result: "学校没有完全放弃要求，但同意在联赛前降低一次常规考核权重。",
        effects: { social: 1, san: -1, coachFavor: 1 },
      },
      {
        id: "top-scorer-promise-both",
        title: "答应两边都不落下",
        preview: "家庭支持 +1 · SAN -4",
        result: "承诺很好听，接下来的日程却没有凭空多出一天。",
        effects: { familySupport: 1, san: -4 },
      },
    ],
  },
  {
    id: "origin-elite-resource-queue",
    phase: "weekly",
    label: "出身事件 · 资源也要排队",
    title: "学校只拿到六个外培名额，队里有十四个人报名。",
    body: ["成熟体系意味着更多资源，也意味着每份资源都有公开或隐形的排序。教练把最近三次小测和任务完成率摆在桌上。"],
    inspiration: "原创",
    trigger: { earliestWeek: 9, latestWeek: 40, requiredTags: ["origin:elite-school"], probability: 0.44 },
    choices: [
      {
        id: "elite-compete-openly",
        title: "按统一标准竞争名额",
        preview: "教练好感 +1 · SAN -2",
        result: "你未必拿到名额，但至少知道下一次差在哪里。队内竞争变得具体而可计算。",
        effects: { coachFavor: 1, san: -2, tags: ["接受名校队内竞争"] },
      },
      {
        id: "elite-share-notes",
        title: "提议入选者回来共享完整笔记",
        preview: "同学好感 +2 · 社交 +1",
        result: "名额仍然只有六个，收益却不再只留在六个人身上。",
        effects: { peerFavor: 2, social: 1 },
      },
    ],
  },
  {
    id: "origin-elite-comparison",
    phase: "weekly",
    label: "出身事件 · 强者环绕",
    title: "你刚为一次进步高兴，隔壁桌已经开始做下一阶段的卷子。",
    body: ["在名校队伍里，参照系总能迅速抹平满足感。资源带来的增长真实存在，持续比较造成的疲惫也同样真实。"],
    inspiration: "原创",
    trigger: { earliestWeek: 18, latestWeek: 78, requiredTags: ["origin:elite-school", "接受名校队内竞争"], probability: 0.36 },
    choices: [
      {
        id: "elite-personal-baseline",
        title: "保留个人基线，只比较关键差距",
        preview: "心态 +2 · 思辨 +0.5",
        result: "榜单仍有用，但不再负责定义每一天是否值得。",
        effects: { mindset: 2, reasoning: 0.5 },
      },
      {
        id: "elite-chase-everyone",
        title: "把每个领先者都当作追赶目标",
        preview: "思辨 +1.5 · SAN -4",
        result: "你的速度提高了，睡眠和判断却开始一起变薄。",
        effects: { reasoning: 1.5, san: -4 },
      },
    ],
  },
  {
    id: "origin-county-missing-resource",
    phase: "weekly",
    label: "出身事件 · 找不到的实验材料",
    title: "实验室没有你需要的显微切片，教练也不确定该向谁借。",
    body: ["县中自由度很高，因为几乎没人能给出完整路线。你可以等待资源，也可以自己把外界关系一点点搭起来。"],
    inspiration: "原创",
    trigger: { earliestWeek: 10, latestWeek: 46, requiredTags: ["origin:county-school"], probability: 0.46 },
    choices: [
      {
        id: "county-contact-alumni",
        title: "联系学长和邻市学校借材料",
        preview: "社交 +2 · 实验 +1 · SAN -1",
        result: "三次转介绍后，你拿到一盒旧切片，也第一次建立了校外联系。",
        effects: { social: 2, experiment: 1, san: -1, tags: ["县中建立外部资源网"] },
      },
      {
        id: "county-theory-only",
        title: "先把实验换成理论学习",
        preview: "思辨 +1 · 实验路线延后",
        result: "这周没有浪费，但缺失的实验条件仍会在之后回来。",
        effects: { reasoning: 1 },
      },
    ],
  },
  {
    id: "origin-county-first-result",
    phase: "weekly",
    label: "出身事件 · 第一次被看见",
    title: "一次联考里，你的成绩第一次排到省内前列。",
    body: ["原本观望的老师开始询问竞赛队缺什么，家长也把这张成绩截图保存了很久。县中的支持不是预先配置，而是被结果一点点换来的。"],
    inspiration: "原创",
    trigger: { earliestWeek: 24, latestWeek: 82, requiredTags: ["origin:county-school", "县中建立外部资源网"], probability: 0.34 },
    choices: [
      {
        id: "county-request-lab",
        title: "趁机申请固定实验时间",
        preview: "实验 +2 · 家庭支持 +2 · 教练好感 +1",
        result: "申请没有全批，但实验室每周为你留出一个下午。一次成绩终于沉淀成持续条件。",
        effects: { experiment: 2, familySupport: 2, coachFavor: 1 },
      },
      {
        id: "county-stay-quiet",
        title: "不提要求，继续按自己的节奏",
        preview: "心态 +1 · 支持不变",
        result: "你避开了额外关注，也错过了支持最容易被说服的窗口。",
        effects: { mindset: 1 },
      },
    ],
  },
  {
    id: "origin-wealthy-shopping-distance",
    phase: "weekly",
    label: "出身事件 · 轻松买下的东西",
    title: "你随手买下的新资料，正是队友犹豫了两周仍没下单的那套。",
    body: ["支付能力解决了选择，却没有自动解决相处方式。炫耀、假装无所谓或分享，都会改变别人怎样理解你的资源。"],
    inspiration: "原创",
    trigger: { earliestWeek: 6, latestWeek: 38, requiredTags: ["origin:wealthy-family"], probability: 0.45 },
    choices: [
      {
        id: "wealthy-share-resource",
        title: "扫描目录并邀请大家轮流借阅",
        preview: "同学好感 +2 · 社交 +1",
        result: "资料仍属于你，信息却没有成为关系里的门槛。",
        effects: { peerFavor: 2, social: 1, tags: ["富裕但愿意共享"] },
      },
      {
        id: "wealthy-hide-price",
        title: "避开价格话题，只自己使用",
        preview: "SAN +1 · 同学好感 -1",
        result: "尴尬暂时消失，队友也逐渐不再与你讨论培训和资料成本。",
        effects: { san: 1, peerFavor: -1 },
      },
    ],
  },
  {
    id: "origin-wealthy-result-condition",
    phase: "weekly",
    label: "出身事件 · 支持不是空白支票",
    title: "家长同意下一次外培，但要求你先给出最近三次测试的趋势。",
    body: ["家里付得起并不等于永远愿意付。资源越多，家长越希望看见选择、反馈与结果形成闭环。"],
    inspiration: "原创",
    trigger: { earliestWeek: 20, latestWeek: 78, requiredTags: ["origin:wealthy-family"], probability: 0.38 },
    choices: [
      {
        id: "wealthy-budget-plan",
        title: "整理培训预算和复盘目标",
        preview: "家庭支持 +3 · SAN -1",
        result: "家长批准预算，也明确下一次会检查是否完成复盘。宽裕被转化成了有条件的长期支持。",
        effects: { familySupport: 3, san: -1 },
      },
      {
        id: "wealthy-just-pay",
        title: "强调家里并不缺这笔钱",
        preview: "获得短期自由 · 家庭支持 -3",
        result: "费用最后还是支付了，但下一次申请不再像以前那么轻松。",
        effects: { familySupport: -3, pocketMoney: 50 },
      },
    ],
  },
  {
    id: "item-plant-sprout",
    phase: "weekly",
    label: "道具链 · 窗台植物 1/4",
    title: "那包看起来没什么用的种子，真的发芽了。",
    body: ["两片子叶从纸杯边缘探出来。你开始在每天的计划表旁记录浇水，也第一次把教材里的萌发条件和窗台上的变化对应起来。"],
    inspiration: "原创",
    trigger: { earliestWeek: 3, latestWeek: 70, requiredTags: ["shop:plant-seeds"], blockedTags: ["plant:sprouted"], probability: 0.65 },
    choices: [
      {
        id: "plant-record",
        title: "做一张简短观察表",
        preview: "第二模块 +0.8 · 心态 +1",
        result: "记录只有日期、叶片和光照，却让这盆植物从摆件变成了一个很小的长期实验。",
        effects: { module2: 0.8, mindset: 1, tags: ["plant:sprouted"] },
      },
      {
        id: "plant-decoration",
        title: "拍张照片，放着就好",
        preview: "SAN +2",
        result: "照片很好看。至于下一次浇水，你决定交给未来的自己。",
        effects: { san: 2, tags: ["plant:sprouted", "plant:neglected"] },
      },
    ],
  },
  {
    id: "item-plant-drought",
    phase: "weekly",
    label: "道具链 · 窗台植物 2/4",
    title: "连续外培几天后，幼苗叶片软了下来。",
    body: ["它没有发出通知，也不会因为你忙于竞赛而暂停生长。纸杯土壤已经完全发白。"],
    inspiration: "原创",
    trigger: { earliestWeek: 8, latestWeek: 85, requiredTags: ["plant:sprouted"], blockedTags: ["plant:rescued"], probability: 0.5 },
    choices: [
      {
        id: "plant-rescue",
        title: "补水、移到散射光并继续观察",
        preview: "心态 +1 · SAN +1",
        result: "第二天清晨叶片重新挺起。它恢复得比你预想快，也提醒你恢复并不等于毫无代价。",
        effects: { mindset: 1, san: 1, tags: ["plant:rescued"] },
      },
      {
        id: "plant-give-away",
        title: "交给更有空的队友照料",
        preview: "同学好感 +1 · 结束个人植物线",
        result: "植物活了下来，只是以后它的生长记录出现在队友的桌边。",
        effects: { peerFavor: 1, tags: ["plant:rescued", "plant:shared"] },
      },
    ],
  },
  {
    id: "item-plant-aphids",
    phase: "weekly",
    label: "道具链 · 窗台植物 3/4",
    title: "嫩叶背面出现了一小群蚜虫。",
    body: ["队友第一反应是把整盆扔掉，你却想起动物行为和植物防御都能从这团麻烦里找到对应知识。"],
    inspiration: "原创",
    trigger: { earliestWeek: 14, latestWeek: 95, requiredTags: ["plant:rescued"], blockedTags: ["plant:observed"], probability: 0.48 },
    choices: [
      {
        id: "plant-observe-aphids",
        title: "隔离植株，观察后再处理",
        preview: "第二模块 +1 · 第三模块 +0.8 · SAN -1",
        result: "你记录了取食位置与趋集变化，最后用温和方式处理。小玩意意外串起了两个模块。",
        effects: { module2: 1, module3: 0.8, san: -1, tags: ["plant:observed"] },
      },
      {
        id: "plant-clean-fast",
        title: "立刻清理，不让它影响书桌",
        preview: "SAN +1",
        result: "虫害很快消失，桌面也恢复整洁。你没有把每件生活小事都变成课题。",
        effects: { san: 1, tags: ["plant:observed"] },
      },
    ],
  },
  {
    id: "item-plant-flower",
    phase: "weekly",
    label: "道具链 · 窗台植物 4/4",
    title: "在省赛前最忙的一周，窗台上开出第一朵花。",
    body: ["它没有提高任何模考排名，却把几个月前那次毫无理由的消费完整地照应回来。队友们轮流拍照，连教练也停了一秒。"],
    inspiration: "原创",
    trigger: { earliestWeek: 34, latestWeek: 104, requiredTags: ["plant:observed"], probability: 0.7 },
    choices: [
      {
        id: "plant-keep-seeds",
        title: "保留种子，写下这段观察",
        preview: "心态 +3 · 同学好感 +1",
        result: "你把下一代种子夹进观察本。它不是竞赛资料，却成了这两年最具体的时间刻度。",
        effects: { mindset: 3, peerFavor: 1, tags: ["plant:completed"] },
      },
      {
        id: "plant-share-flower",
        title: "把花留在竞赛教室",
        preview: "SAN +3 · 同学好感 +2",
        result: "之后每个来教室的人都知道，这是那包“买来没用”的种子。",
        effects: { san: 3, peerFavor: 2, tags: ["plant:completed"] },
      },
    ],
  },
  {
    id: "item-lucky-pen-test",
    phase: "weekly",
    label: "道具链 · 幸运笔 1/2",
    title: "你第一次带着那支“玄学签字笔”参加模考。",
    body: ["开考前它只是玩笑，分数出来后却恰好比上周高。队友开始认真讨论是否应该把它留到联赛。"],
    inspiration: "原创",
    trigger: { earliestWeek: 10, latestWeek: 85, requiredTags: ["shop:lucky-pen"], blockedTags: ["lucky:tested"], probability: 0.5 },
    choices: [
      {
        id: "lucky-enjoy",
        title: "享受仪式感，但照常复盘",
        preview: "心态 +2 · 思辨 +0.5",
        result: "幸运笔负责让你笑一下，错题本仍负责解释分数。",
        effects: { mindset: 2, reasoning: 0.5, tags: ["lucky:tested"] },
      },
      {
        id: "lucky-believe",
        title: "宣布联赛必须用它",
        preview: "SAN +2 · 埋下遗失事件",
        result: "大家帮你给笔配了专用笔袋。它现在真的承担了一点不该承担的东西。",
        effects: { san: 2, tags: ["lucky:tested", "lucky:believed"] },
      },
    ],
  },
  {
    id: "item-lucky-pen-lost",
    phase: "weekly",
    label: "道具链 · 幸运笔 2/2",
    title: "考前整理文具时，幸运笔不见了。",
    body: ["它可能落在教室，也可能夹在某套卷子里。真正让你心跳加快的不是价格，而是你曾把稳定感寄托在它身上。"],
    inspiration: "原创",
    trigger: { earliestWeek: 28, latestWeek: 104, requiredTags: ["lucky:believed"], probability: 0.55 },
    choices: [
      {
        id: "lucky-use-normal-pen",
        title: "拿普通笔，按既定流程准备",
        preview: "心态 +2 · SAN -1",
        result: "普通笔写出的字没有任何不同。你把仪式感收回到自己的准备流程里。",
        effects: { mindset: 2, san: -1, tags: ["lucky:resolved"] },
      },
      {
        id: "lucky-search-night",
        title: "把教室翻到熄灯",
        preview: "SAN -3 · 找回幸运笔",
        result: "笔在一叠旧卷子下面被找到。你松了口气，也少睡了一个小时。",
        effects: { san: -3, tags: ["lucky:resolved"] },
      },
    ],
  },
  {
    id: "item-card-game-night",
    phase: "weekly",
    label: "道具事件 · 一局卡牌",
    title: "外培酒店熄灯前，队友看见了你买的生物主题卡牌。",
    body: ["原本只打算玩十分钟，卡牌上的物种关系却很快变成生态学争论。房间里第一次没人比较模考分数。"],
    inspiration: "原创",
    trigger: { earliestWeek: 12, latestWeek: 90, requiredTags: ["shop:card-game"], probability: 0.48 },
    choices: [
      {
        id: "card-play-one-round",
        title: "只玩一局，输了的人讲一道错题",
        preview: "同学好感 +3 · SAN +2 · 第三模块 +0.5",
        result: "游戏按时结束，还留下几条意外好用的生态学记忆。",
        effects: { peerFavor: 3, san: 2, module3: 0.5, tags: ["卡牌夜"] },
      },
      {
        id: "card-play-late",
        title: "再来一局，反正明早只是模考",
        preview: "同学好感 +2 · SAN +3 · 心态 -1",
        result: "友情升温，第二天第一道题读了三遍才看懂。",
        effects: { peerFavor: 2, san: 3, mindset: -1 },
      },
    ],
  },
  {
    id: "item-field-kit-outing",
    phase: "weekly",
    label: "道具事件 · 校园小样方",
    title: "周末午后，你把袖珍野外观察套装带到校园荒地。",
    body: ["一根卷尺、一个放大镜和几张记录纸当然做不出正式调查，却足够让纸面上的样方第一次落到真实地面。"],
    inspiration: "原创",
    trigger: { earliestWeek: 15, latestWeek: 90, requiredTags: ["shop:field-kit"], probability: 0.42 },
    choices: [
      {
        id: "field-kit-team",
        title: "叫两位队友一起做简易记录",
        preview: "第三模块 +1.5 · 同学好感 +2 · 实验 +0.5",
        result: "样本量很小，误差很大，但你们从争论“怎么才算一株”开始理解了操作定义。",
        effects: { module3: 1.5, peerFavor: 2, experiment: 0.5, tags: ["校园样方记录"] },
      },
      {
        id: "field-kit-relax",
        title: "只随便看看，不把它变成任务",
        preview: "SAN +3 · 心态 +1",
        result: "你没有记录任何数据，却记住了那天下午真实的风和草地。",
        effects: { san: 3, mindset: 1 },
      },
    ],
  },
  {
    id: "item-slide-box-discovery",
    phase: "weekly",
    label: "道具事件 · 空切片盒",
    title: "实验启蒙后，你终于知道那个空切片盒可以装什么。",
    body: ["教练允许你保存几张练习中制作失败但有代表性的切片。空盒从无用收藏变成了实验错题本。"],
    inspiration: "原创",
    trigger: { earliestWeek: 29, latestWeek: 100, requiredTags: ["shop:slide-box"], probability: 0.5 },
    choices: [
      {
        id: "slide-box-label",
        title: "按失败原因编号保存",
        preview: "实验 +2 · 思辨 +0.5",
        result: "厚、皱、染色过深和气泡各有位置。实验失误终于能被比较，而不只是重做。",
        effects: { experiment: 2, reasoning: 0.5, tags: ["切片失败档案"] },
      },
      {
        id: "slide-box-give",
        title: "送给更需要的队友",
        preview: "同学好感 +2",
        result: "对方认真收下，并约定下一次把做得最差的那张也给你看。",
        effects: { peerFavor: 2 },
      },
    ],
  },
  {
    id: "item-mug-mistaken",
    phase: "weekly",
    label: "道具事件 · 奇怪的杯子",
    title: "教练端起了你那只印着错误细胞结构图的杯子。",
    body: ["他看了几秒，指出图里至少有三处问题。原本只是恶趣味纪念品，突然变成了竞赛教室的找茬题。"],
    inspiration: "原创",
    trigger: { earliestWeek: 8, latestWeek: 75, requiredTags: ["shop:strange-mug"], probability: 0.5 },
    choices: [
      {
        id: "mug-find-errors",
        title: "发起全队找错挑战",
        preview: "第一模块 +0.8 · 同学好感 +2",
        result: "杯子上最终贴了七张小标签。从此新队员都要先接受这道非正式入队题。",
        effects: { module1: 0.8, peerFavor: 2, tags: ["错误细胞杯传统"] },
      },
      {
        id: "mug-just-drink",
        title: "它就是个杯子，先喝水",
        preview: "SAN +2",
        result: "不是所有错误都必须立刻订正，尤其当你只是口渴。",
        effects: { san: 2 },
      },
    ],
  },
];
