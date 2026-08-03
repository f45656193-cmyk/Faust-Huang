export type FutureRelationship = {
  name: string;
  route: "dating" | "friend" | "broken-up" | "strained" | "crush";
  bond: number;
  trust: number;
  conflict: number;
};

export type FutureEpilogueInput = {
  seed: string;
  name: string;
  school: string;
  major: string;
  routeLabel: string;
  originId: string;
  retired: boolean;
  retiredWeek: number;
  academics: number;
  reasoning: number;
  biologyMastery: number;
  experiment: number;
  social: number;
  mindset: number;
  san: number;
  familySupport: number;
  medalTier: string;
  nationalRank: number | null;
  internationalMedal?: string;
  modules?: [number, number, number, number];
  relationships?: FutureRelationship[];
  fantasyJoined?: boolean;
  fantasyChats?: number;
  abnormal?: "pause" | "withdrawal";
};

export type FutureEpilogue = {
  routeId: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
};

type Route = {
  id: string;
  title: string;
  subtitle: string;
  score: (input: FutureEpilogueInput) => number;
  paragraphs: (input: FutureEpilogueInput) => string[];
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

const avg = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const moduleValue = (input: FutureEpilogueInput, index: number) =>
  input.modules?.[index] ?? input.biologyMastery;
const hasMajor = (input: FutureEpilogueInput, words: string[]) =>
  words.some((word) => input.major.includes(word));

const routes: Route[] = [
  {
    id: "basic-research",
    title: "在尚无答案的地方",
    subtitle: "基础研究 · 实验室与漫长问题",
    score: (i) => i.reasoning * 0.8 + i.biologyMastery * 0.7 + i.experiment * 0.45 + (hasMajor(i, ["生物", "生命"]) ? 20 : 0),
    paragraphs: (i) => [
      `进入${i.school}以后，你第一次发现大学实验室并不是更大的竞赛教室。题目没有标准答案，失败的数据也不会在晚上公布排名。你花了很长时间重新学习怎样提出一个值得做的问题，而不是猜测命题人想听什么。`,
      "大三那年，你在一次连续数周没有阳性结果的实验后留到很晚。过去的你也许会把这解释成能力不足；现在你先检查记录、约人复核，再决定是否推翻假设。竞赛留下的读图速度终于从武器变成了工具。",
      "后来你继续读博，在一个很窄却真实的问题上工作多年。论文没有让世界突然改变，但你知道其中哪一张图来自被认真对待的失败，也知道科学并不需要每个人永远做最快的那一个。",
    ],
  },
  {
    id: "wet-lab",
    title: "手会记得",
    subtitle: "实验科学 · 台面、移液枪与可靠数据",
    score: (i) => i.experiment * 1.15 + moduleValue(i, 1) * 0.45 + i.mindset * 0.25,
    paragraphs: (i) => [
      `你在${i.school}最先熟悉的不是图书馆，而是实验楼的门禁。国赛训练曾让你习惯计时和标准流程，真正的科研却要求你把“为什么这样做”写进每一页记录。`,
      "你成了组里最擅长排查异常的人。不是因为你从不失手，而是因为你肯承认哪一步不确定、哪一支试剂可能失效，也从不要求低年级用沉默掩盖错误。",
      "很多年后，你负责一个不大的实验平台。新人第一次打翻缓冲液时，你没有复刻当年听过的训斥，只让他先保证安全，再一起重建记录。技术最终变成一种照顾人的方式。",
    ],
  },
  {
    id: "bioinformatics",
    title: "另一种显微镜",
    subtitle: "生物信息 · 数据与生命系统",
    score: (i) => i.reasoning * 0.95 + moduleValue(i, 0) * 0.65 + i.academics * 0.12 + (hasMajor(i, ["生物", "计算", "工程"]) ? 12 : 0),
    paragraphs: (i) => [
      "大学第一门编程课让你措手不及。报错信息不像选择题，它不在乎你是否理解大意。你从最笨的循环开始，把序列、表达矩阵和进化树一点点变成可重复的分析。",
      "竞赛时训练出的论文阅读能力帮你迅速看见漂亮图表背后的缺口。你逐渐不满足于跑通现成流程，开始追问数据怎样产生、偏差从哪里进入，以及模型到底遗漏了哪部分生命。",
      "后来你在湿实验与算法之间搭桥。别人把代码称作工具，你却把它看作另一种显微镜：不能替代观察，但能让人看见肉眼无法同时容纳的尺度。",
    ],
  },
  {
    id: "field-ecology",
    title: "走出有空调的考场",
    subtitle: "生态与野外 · 山野不是背景板",
    score: (i) => moduleValue(i, 2) * 1.05 + i.mindset * 0.45 + i.san * 0.18,
    paragraphs: (i) => [
      "第一次野外实习时，书上的物种名终于不再按章节出现。泥、雨、蚊虫和临时改变的样线让你意识到，自然从不配合一张干净的答题卡。",
      "你喜欢上长期调查。它的进展缓慢得近乎反竞赛：一年只多一个季节的数据，一次错误定位可能让整天作废。可你也第一次在知识里获得不依赖排名的耐心。",
      "后来你的工作与栖息地保护相连。公众会议比论文答辩更难，妥协也不是标准答案。你学会让数据进入现实，而不是只停留在最漂亮的模型里。",
    ],
  },
  {
    id: "medicine",
    title: "题目变成具体的人",
    subtitle: "医学与健康 · 证据之外仍有生活",
    score: (i) => i.academics * 0.4 + i.social * 0.6 + i.mindset * 0.5 + moduleValue(i, 1) * 0.45 + (hasMajor(i, ["医学", "生物医学"]) ? 30 : 0),
    paragraphs: (i) => [
      "大学里的医学课程比任何一本竞赛书都厚。你能够快速理解机制，却很快发现，真正的病人不会按模块出现，也不会只提供相关变量。",
      "实习时，一位患者问的不是治疗成功率，而是能不能赶上女儿的婚礼。你第一次清楚地感到：正确结论仍需要被翻译成一个人能够承担的选择。",
      "后来你留在临床与研究交界的位置。竞赛给你的不是诊断天赋，而是面对复杂证据时不轻易假装确定；经历过压力的你，也更愿意问一句对方是否真的听懂。",
    ],
  },
  {
    id: "biotech",
    title: "从论文到生产线",
    subtitle: "生物产业 · 让方法在现实里工作",
    score: (i) => i.experiment * 0.72 + i.reasoning * 0.55 + i.social * 0.4 + (hasMajor(i, ["工程", "技术"]) ? 25 : 0),
    paragraphs: (i) => [
      "你在大学后进入生物技术行业。第一次放大生产时，实验室里漂亮的条件全部开始失效：成本、稳定性、法规和交付日期同时成为变量。",
      "你擅长在混乱中找到最关键的对照，也逐渐学会一项技术的价值不仅取决于能不能做出来，还取决于谁能承担、怎样验证、失败时由谁负责。",
      "多年后，你参与的产品真正抵达医院或农田。新闻没有提到你，用户也不会知道那次关键的工艺修正。你却知道，知识落地本来就是许多无名步骤共同完成的事。",
    ],
  },
  {
    id: "startup",
    title: "没有标准答案的创业题",
    subtitle: "创业 · 风险、团队与重新开始",
    score: (i) => i.social * 0.9 + i.reasoning * 0.5 + i.mindset * 0.55 + (i.originId === "wealthy-family" ? 18 : 0),
    paragraphs: (i) => [
      "大学里一次不起眼的项目，让你和几位同伴决定把技术真正做成产品。竞赛生涯里最熟悉的“再多学一点就能准备好”在这里失效了：市场不会等你看完最后一本书。",
      "第一次项目失败时，你经历了比落榜更复杂的情绪，因为没有一条明确的分数线可以归因。你们复盘技术、合作和承诺，最后有人离开，也有人愿意再做一次。",
      "后来公司未必成为传奇，却稳定地解决了一小块真实需求。你终于明白，冒险不是永远向前冲，而是在知道代价以后仍有能力选择，也有能力停下。",
    ],
  },
  {
    id: "teacher",
    title: "站在讲台的另一边",
    subtitle: "教育 · 把路标留给后来者",
    score: (i) => i.social * 0.8 + i.biologyMastery * 0.65 + i.mindset * 0.48 + (i.retired ? 8 : 0),
    paragraphs: (i) => [
      "毕业后，你回到中学或竞赛课堂。第一届学生问的问题和你当年几乎一样：要不要学、来不来得及、退赛是不是失败。你没有用自己的结局替他们回答。",
      "你仍然会要求严谨，也会在模考后指出没有认真训练的代价。但你不再把羞耻当成动力，更不会假装竞赛适合每一个被选进教室的人。",
      "多年后，一名早早退赛的学生写信告诉你，他不记得你讲过的代谢通路，却一直记得你当时允许他离开。那封信和获奖名单被你放在同一个抽屉里。",
    ],
  },
  {
    id: "science-communication",
    title: "把复杂的事讲给更多人",
    subtitle: "科普与出版 · 知识也需要被翻译",
    score: (i) => i.social * 0.86 + i.reasoning * 0.55 + i.biologyMastery * 0.36,
    paragraphs: (i) => [
      "大学期间，你开始把论文和课程写成普通人也能读懂的文章。最初只是给学弟学妹整理资料，后来读者来自完全不同的专业和年龄。",
      "你拒绝把科学写成万能答案，也拒绝用术语制造权威。竞赛训练让你知道一幅图可以被怎样误读，过去的焦虑则提醒你，传播知识不该以羞辱不知道的人为代价。",
      "后来你成为编辑、作者或科学传播者。某本书的销量并不惊人，却在很多学生最迷茫的夜里被翻开。你终于理解，留下路标也是一种研究。",
    ],
  },
  {
    id: "cross-major",
    title: "生物不是唯一的语法",
    subtitle: "跨专业 · 把竞赛留作一种观看方式",
    score: (i) => (hasMajor(i, ["生物", "生命", "医学"]) ? 0 : 35) + i.reasoning * 0.5 + i.academics * 0.25 + (i.retired ? 10 : 0),
    paragraphs: (i) => [
      `你最终没有把专业和生物绑定。进入${i.school}后，你从新的学科重新学习基本概念，也经历了一段“不再擅长”的时期。`,
      "很久以后你才发现，竞赛没有白费。它留下的是拆解机制、寻找反例和面对复杂系统的习惯，而不是一份必须终身兑现的专业合同。",
      "你在新的领域逐渐站稳，也仍会在路过实验楼时认出熟悉的气味。那不是后悔，只是承认一段生命可以结束，又继续影响后来。",
    ],
  },
  {
    id: "stable-career",
    title: "不传奇的好日子",
    subtitle: "稳定生活 · 工作不是全部叙事",
    score: (i) => i.mindset * 0.75 + i.san * 0.48 + i.social * 0.32 + (i.medalTier === "none" ? 8 : 0),
    paragraphs: (i) => [
      "大学毕业后，你选择了一份稳定的工作。它和少年时代想象的“改变世界”有距离，却允许你按时吃饭、照顾家人，也保留每周真正属于自己的时间。",
      "偶尔有人知道你学过竞赛，追问为什么没有继续走到学术最深处。你不再急着证明选择正确。人生不是一张只能向上延伸的排名表。",
      "许多年后，奖牌、退赛申请或旧笔记都变成搬家时才会翻出的物件。你仍然认真生活，而这份不传奇的完整，正是当年那个疲惫的中学生很难想象的未来。",
    ],
  },
  {
    id: "overseas",
    title: "更远的实验楼",
    subtitle: "海外求学 · 离开熟悉坐标",
    score: (i) => i.academics * 0.42 + i.reasoning * 0.65 + i.social * 0.36 + (i.nationalRank && i.nationalRank <= 150 ? 15 : 0),
    paragraphs: (i) => [
      "大学后，你前往另一种教育环境继续学习。语言、讨论方式和评价体系都不同，过去熟悉的奖项在新同学眼里只是一行需要解释的经历。",
      "失去光环也带来轻松。你开始重新判断自己真正想研究什么，也学会在不知道答案时公开提问，而不是靠更长的准备隐藏不确定。",
      "后来你可能留下，也可能回来。重要的不是距离，而是你终于能在不同坐标系之间移动，不再把任何一所学校或一次考试当作世界边界。",
    ],
  },
  {
    id: "hometown",
    title: "把看见的东西带回去",
    subtitle: "返乡与公共实践 · 资源不应只向中心聚集",
    score: (i) => (i.originId === "county-school" ? 28 : 0) + i.social * 0.58 + i.mindset * 0.48 + i.biologyMastery * 0.25,
    paragraphs: (i) => [
      "大学毕业后，你把一部分工作带回资源并不充足的地方。曾经需要辗转寻找的教材、老师和同伴，被你整理成更容易抵达的课程与社群。",
      "你很清楚，仅靠热爱不能抹平差距。因此你不把少数逆袭故事当作制度合理的证据，而是认真争取经费、培训教师，也允许学生首先照顾自己的生活。",
      "多年后，本地终于有学生走到全国赛，也有人在入门后坦然选择普通高考。你为两种结果都准备了祝福，因为机会真正公平时，本来就应该包括退出的自由。",
    ],
  },
  {
    id: "public-service",
    title: "证据进入公共决定",
    subtitle: "公共事务 · 科学之外的责任",
    score: (i) => i.reasoning * 0.62 + i.social * 0.65 + i.mindset * 0.5 + i.academics * 0.16,
    paragraphs: (i) => [
      "你后来进入公共管理、公益组织或科学政策领域。文件里的每一个百分比都可能影响具体的人，而现实决策永远比竞赛题多出价值冲突。",
      "你坚持区分证据与立场，也逐渐明白“有数据”不等于“没有选择”。那些年经历过的资源差异、学校支持和家庭压力，让你不愿把制度问题推回个人努力。",
      "你的名字很少出现在最终成果的最上方，但一些流程因此变得更透明，一些年轻人因此少走了不必要的弯路。你把思辨用在了比试卷更嘈杂的地方。",
    ],
  },
  {
    id: "ordinary-restart",
    title: "从暂停处重新开始",
    subtitle: "康复与重建 · 时间没有把你落下",
    score: (i) => (i.abnormal === "pause" ? 130 : 0) + (100 - i.san) * 0.55 + i.mindset * 0.3,
    paragraphs: (i) => [
      "休学后的日子没有剧情性的飞跃。睡眠先恢复一点，药物和咨询需要调整，能够完整读完一页书有时就是当天全部进展。你慢慢学会不再用产出来证明康复。",
      "重新进入学习或工作时，你走得比原计划晚。可那段空白并非被删除的时间：它教会你识别危险信号、向人求助，也让你不再赞美以崩溃为代价的坚持。",
      "许多年后，你拥有一份可以持续的生活。偶尔仍会有低谷，但你已经知道暂停不是失败，重新开始也不需要回到原来的起点。",
    ],
  },
  {
    id: "alternative-path",
    title: "没有统一模板的学历之外",
    subtitle: "非传统路径 · 自己搭建下一段路",
    score: (i) => (i.abnormal === "withdrawal" ? 140 : 0) + i.social * 0.45 + i.mindset * 0.42,
    paragraphs: (i) => [
      "离开原有学校轨道以后，你经历了一段没有标准进度表的生活。技能课程、工作、重新考试或其他教育方式交错出现，每一步都比别人熟悉的路线更需要解释。",
      "你也曾羡慕那些按时收到录取通知书的人。但当你真正做出作品、完成一项工作、被可靠的伙伴需要时，评价终于不再只来自失去的那张学籍表。",
      "后来你建立起自己的职业与生活。它不替当年的痛苦辩护，却证明一个人离开主流轨道后仍有未来，而且未来不必是对所有质疑者的表演。",
    ],
  },
  {
    id: "creative-life",
    title: "把观察留下来",
    subtitle: "创作 · 另一种记录生命的方法",
    score: (i) => i.social * 0.55 + i.reasoning * 0.4 + (i.fantasyJoined ? 22 : 0) + (i.retired ? 7 : 0),
    paragraphs: (i) => [
      "你在大学开始写作、拍摄或制作游戏。最初只是想保存竞赛生活里那些不会出现在喜报中的细节：走廊的灯、退赛前的沉默、群聊里陌生人的一句安慰。",
      "作品逐渐被更多人看见。有人把它当笑话，有人从中确认自己并不孤单，也有人第一次理解竞赛生为什么既怀念又不愿回去。",
      "后来创作成为你的工作或一生保留的副线。你没有替所有人总结生竞，只把自己看见的世界诚实地留下。真实因此不再只属于胜利者。",
    ],
  },
  {
    id: "academic-leader",
    title: "从选手到同行",
    subtitle: "长期学术 · 领导一个问题共同体",
    score: (i) => i.reasoning * 0.88 + i.experiment * 0.65 + i.biologyMastery * 0.62 + (i.medalTier === "training-team" ? 26 : 0),
    paragraphs: (i) => [
      "你在学术道路上走得很远。最初的奖项帮你更早看见一些门，但真正留下你的是多年以后仍愿意面对失败结果的耐心。",
      "当你开始指导自己的学生，最难的并不是告诉他们下一步实验，而是克制用自己的速度和经历定义所有人成长。你努力建立一个可以承认不知道、可以休息、也可以离开的实验室。",
      "某天，一名学生提出了你没有想到的反例。你没有感到权威受损，只感到一种久违的快乐：知识终于不再围绕个人荣誉，而成为可以被后来者继续推翻的共同事业。",
    ],
  },
  {
    id: "industry-switch",
    title: "允许自己再次转向",
    subtitle: "职业转轨 · 成年人的第二次选科",
    score: (i) => i.reasoning * 0.45 + i.social * 0.5 + (i.retired ? 14 : 0) + (hasMajor(i, ["生物", "生命"]) ? 5 : 15),
    paragraphs: (i) => [
      "毕业后的第一份工作并没有成为终身答案。你曾因为已经投入太多而迟迟不愿离开，像极了当年坐在竞赛教室里计算沉没成本。",
      "这一次你更早认出了问题。你用业余时间学习新的技能，和家人争论，也接受自己会暂时变成新人。转轨并不浪漫，却是一次清醒的主动选择。",
      "后来你在新的行业扎根。生物知识有时仍会意外派上用场，但更重要的是，你终于不再要求人生必须证明过去每一步都完全正确。",
    ],
  },
  {
    id: "community-builder",
    title: "幻想乡不只存在于服务器",
    subtitle: "社群建设 · 让同行者彼此看见",
    score: (i) => (i.fantasyJoined ? 50 : 0) + (i.fantasyChats ?? 0) * 1.8 + i.social * 0.65 + i.mindset * 0.25,
    paragraphs: (i) => [
      "大学以后，你仍然留在生竞交流社群里。身份从提问者变成回答者，又从回答者变成维护规则、整理资源和处理冲突的人。",
      "你知道社群最宝贵的不是免费资料，而是让不同学校、不同结果的人能够彼此看见。因此你坚持保护隐私、标注来源，也给退赛与失败保留说话的位置。",
      "多年后，旧群也许迁移、沉寂或更名。可其中建立的友谊和互助又长出新的空间。幻想乡从来不是逃离现实，而是一群人决定让现实稍微不那么孤独。",
    ],
  },
  {
    id: "family-and-life",
    title: "把期待还给生活",
    subtitle: "家庭与自我 · 不再以结果交换支持",
    score: (i) => i.mindset * 0.7 + i.social * 0.48 + Math.abs(i.familySupport - 50) * 0.18,
    paragraphs: (i) => [
      "成年后，你花了很久重新理解家庭。曾经的支持与压力往往来自同一双手，这并不抵消伤害，也不意味着爱只能以服从证明。",
      "你逐渐学会在重要决定里说出自己的边界，也学会听见父母当年没有说清的恐惧。有些关系得到修复，有些只能保持适当距离。两种结果都比假装无事发生诚实。",
      "后来，当你需要照顾更年轻的人时，你很少问“为什么不能再坚持一下”。你更愿意和他一起看清代价，然后让选择真正属于当事人。",
    ],
  },
];

export const futureRouteCatalog = routes.map(({ id, title, subtitle }) => ({
  id,
  title,
  subtitle,
}));

function relationshipParagraph(input: FutureEpilogueInput) {
  const partner = input.relationships?.find((item) => item.route === "dating");
  if (partner) {
    const stable = partner.trust >= 45 && partner.conflict < 45;
    return stable
      ? `你和${partner.name}没有因为高中时的一次确认就自动拥有完美结局。异地、专业选择和各自的低谷仍然制造争执，但你们学会把关心从“替对方决定”改成“陪对方承担”。很多年后，你们偶尔还会拿当年的错题开玩笑，那段关系也终于不再需要竞赛作为见面的理由。`
      : `你和${partner.name}认真尝试过把高中时的心意带进更远的生活。后来道路发生变化，你们未必一直同行，却没有把分开解释成此前的一切都是错误。那段关系让你知道，喜欢一个人并不等于拥有他的人生。`;
  }
  const former = input.relationships?.find((item) => item.route === "broken-up");
  if (former) {
    return `你和${former.name}后来有过一次平静的重逢。没有人要求复合，也没有人否认当年的心意。你们终于能够谈起那场被压力切断的关系，并把迟到的道歉还给彼此，而不是还给某个想象中的结局。`;
  }
  const friend = input.relationships?.find((item) => item.route === "friend");
  if (friend) {
    return `${friend.name}一直留在你的生活里。你们未必在同一城市，也不再每周共同学习，却仍然知道怎样在对方最狼狈时不急着给答案。多年后再谈竞赛，你们最先想起的不是名次，而是曾经有人见过自己动摇的样子。`;
  }
  return null;
}

function fantasyParagraph(input: FutureEpilogueInput) {
  if (!input.fantasyJoined) return null;
  return "生竞幻想乡的群记录后来换过平台，也丢失过一部分。可你仍和几位当年只见过头像的人保持联系。有人做科研，有人转行，有人早已不再谈生物；共同点只是大家都愿意承认，那段青春既有光荣，也有代价。";
}

export function buildFutureEpilogue(input: FutureEpilogueInput): FutureEpilogue {
  const ranked = routes
    .map((route) => ({
      route,
      score:
        route.score(input) +
        ((hashSeed(`${input.seed}-future-${route.id}`) % 1601) - 800) / 100,
    }))
    .sort((a, b) => b.score - a.score);
  const forcedAbnormal = input.abnormal
    ? routes.find((route) =>
        input.abnormal === "pause"
          ? route.id === "ordinary-restart"
          : route.id === "alternative-path",
      )
    : undefined;
  const pool = ranked.slice(0, 3);
  const picked =
    forcedAbnormal ??
    pool[hashSeed(`${input.seed}-future-pick`) % pool.length].route;
  const paragraphs = picked.paragraphs(input);
  const relation = relationshipParagraph(input);
  const fantasy = fantasyParagraph(input);
  if (relation) paragraphs.push(relation);
  if (fantasy) paragraphs.push(fantasy);
  paragraphs.push(
    "生活继续向前以后，你也经历过换城市、换工作、照顾亲友和重新判断成功含义的普通年份。少年时代那种必须立刻证明自己的紧迫感逐渐退去，你开始允许重要决定经过讨论、试错甚至撤回；这并没有让人生变得平庸，反而让每一段选择真正可以持续。",
  );
  paragraphs.push(
    `再往后，${input.name}很少用某一枚奖牌、某一次退赛或某封通知书概括自己。那段高中生活没有被美化，也没有被否认；它只是成为许多后来选择的底色之一。`,
  );
  return {
    routeId: picked.id,
    title: picked.title,
    subtitle: picked.subtitle,
    paragraphs,
  };
}

export function futureRouteCount() {
  return routes.length;
}
