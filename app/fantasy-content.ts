import type { GameEvent } from "./game-data.ts";

export type FantasyStoryContext = {
  week: number;
  seed: string;
  social: number;
  peerFavor: number;
  san: number;
  slackActions: number;
  slackedThisWeek: boolean;
  slackDependence: number;
  resolvedEvents: string[];
  storyTags: string[];
  activeTeamSize: number;
  hasNationalAttempt: boolean;
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

type Chapter = {
  key: string;
  title: string;
  body: string[];
  choices: GameEvent["choices"];
  minWeek?: number;
  maxWeek?: number;
  maxSan?: number;
  requires?: string;
};

const choice = (
  id: string,
  title: string,
  result: string,
  effects: GameEvent["choices"][number]["effects"],
) => ({ id, title, preview: "发送出去以后，这句话会留在群记录里。", result, effects });

const chapters: Chapter[] = [
  {
    key: "first-question",
    title: "凌晨一点，有人问起一道没有答案的题",
    body: [
      "进群后的第一个晚上，你只是潜水。群文件有历年试题、过期讲义和不知出自哪一届选手的勘误，聊天却从细胞骨架一路跑到了便利店夜宵。",
      "凌晨一点零七分，一名现役选手贴出论文图，问为什么作者能从这条曲线得到那个结论。几分钟没有人说话。",
      "你知道一个不成熟的回答也可能被几十个人看见，但这里似乎允许人先把疑问说出来，再慢慢变得正确。",
    ],
    choices: [
      choice("fantasy-answer", "写下自己的证据链", "一位退役选手没有直接公布结论，而是逐句标出你从相关性跳到因果性的漏洞。没有人嘲笑那几处生涩的表述，后来者反而沿着你的思路补上了另一种解释。第二天，那张被多人批注过的图整理进群文件时，你的提问和修改记录也被完整保留。", { reasoning: 0.6, san: -0.5, social: 0.4, tags: ["幻想乡:第一次回答"] }),
      choice("fantasy-ask", "承认没看懂，追问第一步", "你坦白自己连图的横轴都不确定该怎样解释，讨论于是从结论退回坐标、样本量和对照组。几名原本争得很凶的人轮流画出简图，甚至有人发现自己先前也读错了条件。你第一次明白，所谓高手并不是永远直接看见答案，而是愿意从最朴素的地方重新确认。", { reasoning: 0.4, mindset: 0.4, tags: ["幻想乡:认真提问"] }),
      choice("fantasy-watch", "把讨论收藏起来，继续潜水", "你没有贸然加入争论，只把消息设为稍后阅读。第二天早晨，讨论已经滚过几百条，最初的问题也被拆成了三个更准确的小问题。你从中挑出真正说明证据边界的三条回复抄进笔记，并记下自己仍未弄懂的地方；这次沉默不是逃开，而是在为下一次开口积攒判断。", { reasoning: 0.25, san: 0.3, tags: ["幻想乡:潜水者"] }),
    ],
  },
  {
    key: "legendary-notes",
    title: "“想要我的细胞生物学讲义吗？”",
    body: [
      "一个退役多年的群友突然上传了压缩包，文件名从“最终版”一路迭代到“最终版_真的不改了_3”。",
      "讲义里不仅有知识，还有当年被老师批过的错题、赛后补写的注释，以及一句留给后来人的话：不要把别人的笔记当成自己的理解。",
      "下载人数飞快上涨。有人催着问密码，有人已经开始校对第十七页的图。",
    ],
    choices: [
      choice("fantasy-notes-read", "下载，并从头核对一章", "你没有从目录一路翻到结尾，而是挑出正在学习的一章，把讲义中的每个判断都同教材和原文核对。几处看似肯定的结论被你写上反例，也有一张旧图终于解释了困扰已久的概念。那份文件没有替你完成学习，却让一条跨越数届的经验链在你的批注里继续向前。", { reasoning: 0.5, san: -0.5, tags: ["achievement:legendary-notes"] }),
      choice("fantasy-notes-thank", "先给整理者认真道谢", "你没有只发一个表情，而是具体写下哪几页解决了自己的困惑，也问清哪些内容仍可能过时。对方回了一句“用得上就行”，语气轻得像这数百页从不曾耗费时间。几天后，他又私发来一份尚未公开的勘误；这一次你先征得同意，才把其中能分享的部分整理给后来者。", { social: 0.7, san: 0.5, tags: ["achievement:legendary-notes", "幻想乡:尊重整理者"] }),
      choice("fantasy-notes-hoard", "先收藏，等以后再看", "你把压缩包按年份和科目改好文件名，又复制进备份硬盘，仿佛完成这些步骤便已经吸收了内容。几周后搜索资料时，它仍安静躺在目录深处，旁边还有十几个同样“以后再看”的文件。拥有资料带来短暂安心，但那份安心也清楚提醒你：收藏从来不等于理解。", { san: 0.6, tags: ["achievement:legendary-notes", "幻想乡:收藏即学习"] }),
    ],
  },
  {
    key: "retired-veteran",
    title: "退役的人没有从群里消失",
    body: [
      "一名群友在省赛失利后改了群名片，把年级和奖项全部删掉。大家没有追问成绩，只把话题慢慢带回晚饭和学校生活。",
      "深夜，他写了一段很长的话：竞赛结束得很突然，但人不会因此失去此前建立的全部价值。",
      "那段消息很快被新梗刷走。你却知道，至少有几个人完整地读完了。",
    ],
    choices: [
      choice("fantasy-veteran-reply", "告诉他：以后也欢迎回来", "你没有追问分数，也没有用“明年再来”把失落草草盖住，只说群里的位置不会因一次结果被撤走。对方沉默很久，最后回了一个表情。几周后，他重新出现，开始替低年级拆解基础题；不同的是，他不再先介绍自己的奖项，也允许自己在讲到一半时说不知道。", { social: 0.6, mindset: 0.7, san: 0.5, tags: ["幻想乡:给退役者留灯"] }),
      choice("fantasy-veteran-private", "私下问他最近过得怎么样", "你避开所有关于竞赛的套话，只问新班级是否习惯、最近有没有睡好。起初回复很短，后来他发来一张晚饭照片，又抱怨起堆积的常规作业。你们整晚没有复盘那场考试；正因为如此，这次普通问候反而比“总结经验”更接近他当时需要的东西，也让关系不必随赛程一起结束。", { peerFavor: 0.8, san: -0.3, mindset: 0.5, tags: ["幻想乡:赛后仍是朋友"] }),
      choice("fantasy-veteran-read", "不打扰，只把那段话收藏下来", "你担心此刻的安慰会变成另一种围观，于是没有跟着追问，只把那段长消息完整收藏。之后群聊恢复日常，它偶尔回来发言，也偶尔消失数周。直到后来你也站在相似的岔路口，重新读见那些缓慢斟酌的句子，才明白当时的停顿并非矫情，而是在为一段突然结束的生活寻找新名字。", { mindset: 0.6, tags: ["幻想乡:记住退役者"] }),
    ],
  },
  {
    key: "bad-question",
    title: "一道烂题引发了四百条消息",
    body: [
      "机构模考把相关性写成因果，又在答案里补了一条题干从未给出的前提。群里从证据标准吵到命题伦理，最后连出题老师十年前的讲义都被翻了出来。",
      "有人只是痛骂，有人重新设计实验，也有人提醒：识别坏题重要，但别让愤怒替代真正的学习。",
    ],
    choices: [
      choice("fantasy-bad-rewrite", "试着把题改成能成立的版本", "你把情绪先放在一边，逐项补出样本、对照和可以被证伪的预测，再把“必然导致”改成更谨慎的表述。新版题目不再靠猜出题人的心思作答，群里也开始讨论哪些干扰项真正有区分度。气愤没有立刻消失，却被你转化成一次比争吵更扎实的论文题训练。", { reasoning: 0.7, san: -0.6, tags: ["achievement:paper-survival"] }),
      choice("fantasy-bad-rant", "加入痛骂，然后关掉群聊", "你跟着把最荒谬的设问骂了一遍，还截出那句自相矛盾的答案说明，换来一排整齐的附和表情。情绪宣泄之后，你没有继续守着消息刷新，而是直接关闭提醒去洗漱。题目并未因此变好，但至少今晚它不再占据全部注意力；明天是否复盘，可以等头脑清醒后再决定。", { san: 0.8, mindset: -0.2, tags: ["achievement:paper-survival"] }),
      choice("fantasy-bad-source", "追到原论文，确认作者究竟说了什么", "你沿着模糊的图注找到综述，又从参考文献追到原始实验。原文只讨论特定条件下的关联，语气远比题目克制，甚至主动列出两种替代解释。你把出处和关键段落贴回群里，并标明哪些是事实、哪些是自己的推断。持续数百条的争论终于拥有一块可以共同站立的地面。", { reasoning: 0.9, san: -1, tags: ["achievement:paper-survival", "幻想乡:追到原文"] }),
    ],
  },
  {
    key: "mock-night",
    title: "模考出分的夜晚，头像一个接一个亮起",
    body: [
      "有人比预期高二十分，有人第一次跌出省队线。隔着不同学校和城市，大家对着同一张排名表，反应却像站在完全不同的季节。",
      "一个平时最爱说笑的人突然安静。另一个常年潜水的人发了自己的错题统计，提醒所有人这只是一套卷。",
    ],
    choices: [
      choice("fantasy-mock-company", "陪那个沉默的人聊到情绪平稳", "你没有急着保证下一次一定会更好，也没有拿别人的低分证明情况不糟。你听他从一道误读的题说到教练的期待，再说到不敢打开排名表的那一刻。等呼吸慢下来，你们才约定明天只复盘最想弄懂的一题。这个夜晚没有翻盘，只把一次模考从世界末日还原成可以被承受的一次考试。", { san: -0.7, mindset: 0.6, social: 0.5, tags: ["幻想乡:模考陪伴"] }),
      choice("fantasy-mock-review", "一起匿名复盘最常见的失分", "你们隐去姓名与总分，只统计错因：概念空缺、时间不足、题干误读以及纯粹的犹豫。几个人发现自己在同类图表上反复失分，便各自贡献一道例题，拼成一份短小的复盘单。你们没有消灭难度和运气，却把令人窒息的排名拆成了下一周确实能做的几件事。", { reasoning: 0.5, problemSpeed: 0.35, san: -0.5, tags: ["幻想乡:共同复盘"] }),
      choice("fantasy-mock-offline", "退出群聊，先保护自己的睡眠", "你看见消息数量迅速上涨，也感觉自己开始把每个人的分数同自己比较。于是你写下一句“明早再看”，关闭群聊与成绩页面，把手机放到够不着的地方。夜里你错过了几百条讨论，却保住第二天清醒的上午；能够识别信息何时不再有益，并及时离开，同样是一种需要练习的能力。", { san: 1.5, mindset: 0.3, tags: ["幻想乡:知道下线"] }),
    ],
  },
  {
    key: "restaurant",
    title: "群友线下面基：一家没有公开菜单的店",
    body: [
      "培训间隙，几位群友终于把头像和真人对应起来。有人比网上沉默，有人比网上更吵，还有人带来一袋号称“富含优质蛋白”的神秘零食。",
      "桌上的菜名逐渐脱离正常餐饮学，最后变成一场不太适合让非竞赛生旁听的动物学讨论。",
    ],
    choices: [
      choice("fantasy-restaurant-try", "遵循好奇心，尝一口再说", "你先确认食材来源和过敏风险，才在一圈期待的目光里尝下很小一口。味道其实并不危险，真正危险的是众人试图用动物学术语描述口感的过程：有人画系统树，有人争论同源与类似，最后连老板都忍不住加入。你们笑得太响，邻桌端着碗默默换到了更远的位置。", { san: 2, pocketMoney: -18, social: 0.5, tags: ["achievement:members-only"] }),
      choice("fantasy-restaurant-photo", "负责拍照和记录，不碰神秘食材", "你谢绝试吃，转而替每一道菜拍照，顺手记下谁在入口前豪言壮语、谁在三秒后疯狂找水。等众人开始争论那究竟算哪一类组织时，只有你还记得完整的上菜顺序。照片后来成了群里经久不衰的表情包，也让所有当事人在你举起手机时立刻学会谨慎发言。", { san: 1.5, social: 0.7, tags: ["achievement:members-only"] }),
      choice("fantasy-restaurant-normal", "坚持点一碗正常的面", "面对桌上越来越难辨认的菜，你坚持向老板要了一碗配料清楚的普通面。众人先笑你错过传奇体验，十分钟后却一个接一个把筷子伸向你的碗，试图用一片青菜挽救味觉。你没有赢得冒险家的称号，却吃完了一顿安稳的晚饭，也给这场逐渐失控的聚餐留下可靠的补给点。", { san: 1, mindset: 0.3, pocketMoney: -12, tags: ["achievement:members-only"] }),
    ],
  },
  {
    key: "resource-ethics",
    title: "一份内部资料被转进群里",
    body: [
      "文件来源不明，页脚却清楚写着“仅限课程学员”。有人主张知识就该流动，也有人指出整理者和讲师同样投入了劳动。",
      "群管理没有立刻删除，而是让大家先把界限说清楚。第一次，你看见资源共享背后也有责任。",
    ],
    choices: [
      choice("fantasy-resource-delete", "提醒打码并联系原作者授权", "你指出页脚的使用范围，请上传者先撤回文件，再由群管理员联系整理者说明情况。讨论一度有些尴尬，却没有演变成公开审判。几天后，原作者提供了可公开的删节版本，也接受群友提交的两处勘误。资料仍然流动，只是这一次，劳动与边界没有被便利悄悄抹掉。", { social: 0.6, mindset: 0.5, tags: ["幻想乡:尊重资源边界"] }),
      choice("fantasy-resource-notes", "只总结知识点，不继续传播文件", "你没有转发原文件，而是把其中涉及的机制重新查证，用自己的语言写成一页知识提要，并附上能够公开访问的来源。群聊的注意力逐渐从“谁还有链接”回到内容本身，也有人补充了不同教材的表述。你这才发现，真正能继续传递的价值从来不只是一个随时可能失效的下载地址。", { reasoning: 0.35, tags: ["幻想乡:只传理解"] }),
      choice("fantasy-resource-silent", "不参与争论", "你没有在信息不全时站队，只看着管理员撤回文件、说明边界并给出后续处理。争议结束后，那行“仅限课程学员”却一直留在脑中。你打开自己的资料目录，第一次逐个检查那些从未问过来源的文件，把明显越界的内容删去，也给还能确认出处的笔记补上作者与链接。", { mindset: 0.25, tags: ["幻想乡:资源反思"] }),
    ],
  },
  {
    key: "province-eve",
    title: "联赛前夜，群公告只有一句话",
    body: [
      "“今晚不许对答案，不许传播押题，不许把一次失眠解释成失败。”",
      "群里仍有人发冷笑话，有人反复确认准考证，也有人坦白自己已经紧张到看不进任何字。来自不同学校的竞争者，在这一刻共享同一种不安。",
    ],
    choices: [
      choice("fantasy-eve-check", "互相核对物品，然后按时下线", "群里有人发出简短清单，你也把准考证、身份证和文具逐件摆到桌面，拍照回传。大家顺手提醒异地考试的人确认路线，又约定十点后不再讨论答案与分数线。事项并不复杂，却让被各种假设搅乱的脑子终于有了落点；当头像依次暗下去时，明天第一次只剩下按时抵达。", { san: 1.2, mindset: 0.5, tags: ["幻想乡:赛前互助"] }),
      choice("fantasy-eve-joke", "发一个只有生竞生看得懂的烂梗", "你把群公告改写成一张离谱的代谢通路图，箭头最后统一指向“现在去睡觉”。有人立刻接梗，有人认真纠正图里的酶，还有几个人只发来问号。笑声很短，却把紧绷的谈话撕开一道缝；至少在争论这个梗究竟算不算严谨的一分钟里，没有人继续刷新预测线。", { san: 1.5, social: 0.3, tags: ["幻想乡:赛前烂梗"] }),
      choice("fantasy-eve-confess", "承认自己真的很害怕", "你删掉几次故作轻松的句子，最后只留下“我现在真的很害怕”。没有人回复“别怕”或保证结果会好，几名平时显得游刃有余的人反而坦白自己也在反复检查文具、担心醒不来。恐惧并未消失，却不再像只属于你的缺陷。随后大家一个个道晚安，把剩下的勇气留给明早。", { san: 1, mindset: 0.8, tags: ["幻想乡:共同害怕"] }),
    ],
    minWeek: 34,
    maxWeek: 47,
  },
  {
    key: "result-night",
    title: "出分之夜，没有一句话适合所有人",
    body: [
      "喜报、遗憾和申诉消息挤在同一个窗口里。有人终于进队，有人以零点几分告别，也有人先祝贺朋友，再悄悄退出聊天。",
      "管理把炫耀和安慰分到不同的话题，提醒获胜的人不必为喜悦道歉，也提醒所有人不要拿别人的失败装饰自己的故事。",
    ],
    choices: [
      choice("fantasy-result-stay", "既祝贺，也留下陪失利的人", "你在喜报下面认真祝贺，也没有让自己的回复淹没那些只差一点的人。有人想复盘，你陪着核对；有人不想说话，你便不追问。这个夜晚没有一句万能安慰，却让你学会喜悦与遗憾可以在同一处被承认。竞赛结果把人带向不同方向，仍然记得彼此则是另一种主动选择。", { social: 0.7, mindset: 0.8, san: -0.4, tags: ["幻想乡:出分夜留守"] }),
      choice("fantasy-result-boundary", "关掉手机，先处理自己的结果", "屏幕上的喜悦和崩溃同时涌来，你意识到自己已经无法分辨究竟在替谁难过。于是你关闭群聊，先把成绩告诉家人，再独自走了一圈，让身体追上刚刚发生的事。你没有承担所有人的情绪，也没有因此成为冷漠的人；第二天重新打开消息时，你已经能用更诚实、更不勉强的语气回应。", { san: 1.2, mindset: 0.4, tags: ["幻想乡:先照顾自己"] }),
      choice("fantasy-result-record", "把申诉与删题信息整理成清单", "你暂时放下分数，把散落在聊天记录里的截止时间、材料格式和争议题编号集中到共享文档，并逐项注明来源与仍待确认的部分。原本相互覆盖的焦虑被整理成可以执行的步骤，群友也继续补充不同赛区的要求。有人因此赶在截止前交齐材料，而你第一次看见秩序也能成为一种具体的陪伴。", { reasoning: 0.25, social: 0.8, san: -0.8, tags: ["幻想乡:出分夜整理"] }),
    ],
    minWeek: 42,
  },
  {
    key: "world-visit",
    title: "全国赛场外，群友开始“跨省串门”",
    body: [
      "过去只在群里见过的名字忽然有了声音、口音和真实的身高。上午还是对手，晚上却有人抱着各省特产挨个敲门。",
      "你们交换的不只是零食，还有各自学校的训练方式、教练怪话和那些从未写进获奖感言的狼狈。",
    ],
    choices: [
      choice("fantasy-world-knock", "带上家乡零食，去敲下一扇门", "你抱着家乡零食按群里的楼层暗号敲门，门后的人先警惕地愣住，随后试探着喊出你的群昵称。几分钟后，小小的房间里已经摆满不同省份的包装袋，白天没有说过话的对手也开始交换教练怪话。所谓世界级串门就这样发生，并成为一条比当晚排名更长、更值得记住的路线。", { san: 2, social: 1, pocketMoney: -15, tags: ["achievement:world-visit"] }),
      choice("fantasy-world-lobby", "在大厅支一张桌，让大家自己聚过来", "你没有逐间敲门，而是在大厅角落铺开零食和纸杯，把位置发进群里。最先来的人拘谨地谈题，后来者却很快把话题带到各地口音、住宿条件和赛后打算。不久，桌边坐满金银铜牌尚未揭晓的人；至少今晚，没有谁按预测名次挑座位，也没有谁需要先报奖项才被欢迎。", { san: 1.5, social: 1.2, tags: ["achievement:world-visit"] }),
      choice("fantasy-world-quiet", "只和几个熟悉的人散步", "大厅的热闹让你有些疲惫，于是只约了几名长期聊过的群友沿校园慢慢走。你们确认彼此真实的声音，也谈起群里从不方便细说的家庭与退路。这个晚上你没有认识所有人，却把几个扁平的头像变成了有步速、有停顿、以后仍愿意单独联系的朋友；数量不多，关系却终于落到现实。", { san: 1.5, peerFavor: 0.8, tags: ["achievement:world-visit"] }),
    ],
    minWeek: 46,
    maxWeek: 65,
    requires: "幻想乡:加入",
  },
  {
    key: "retirement-return",
    title: "同期入群的人离开竞赛后，群聊仍然每天刷新",
    body: [
      "一位和你同期入群的选手宣布退赛。新的选手仍在问你们曾经问过的问题，旧群友则开始讨论大学、专业和不再以奖牌计量的生活。",
      "TA问自己是否还应该留在这里。群里没有人有权要求一个退役者继续提供经验，也没有人应该因为不再参赛就被从共同记忆里删掉。",
    ],
    choices: [
      choice("fantasy-after-help", "告诉TA：只回答真正想回答的问题就够了", "你提醒TA，留下不等于承担答疑值班，更不必把退赛经历反复讲给每个好奇的人听。几周后，TA偶尔会替新生解释一道真正想回答的题，也会在话题触及伤口时直接下线。群里的人逐渐习惯这种边界：经验仍在传递，却不再变成退役者必须偿还的债，更不会决定TA是否有资格留下。", { mindset: 0.8, social: 0.5, tags: ["幻想乡:给退役者选择权"] }),
      choice("fantasy-after-life", "邀请TA分享竞赛之外的生活", "你没有继续追问复盘，而是请TA发一张最近最喜欢的照片。群友这才知道TA会在清晨拍云、在窗边养植物，还听一种几乎没人听过的冷门音乐。话题从构图一路歪到晚饭，第一次没有绕回奖项。一个人也因此重新被认识：不是失败的竞赛生或经验提供者，而是拥有许多普通兴趣的完整朋友。", { san: 1.3, mindset: 0.7, tags: ["幻想乡:身份之外"] }),
      choice("fantasy-after-break", "支持TA暂时退群，等准备好再回来", "你告诉TA可以先关掉所有提醒，甚至直接离开，不必承诺什么时候回来。管理员替TA保存了共享文档的署名，也制止别人把告别解释成脆弱。退出键让头像从列表里消失，却没有抹去已经共同经历的深夜讨论；几个月后是重新加入、偶尔私聊还是彻底走向别处，终于都只由TA自己决定。", { san: 1.2, mindset: 0.7, tags: ["幻想乡:允许暂时告别"] }),
    ],
    minWeek: 50,
  },
  {
    key: "archive",
    title: "群文件里出现了一份《给下一届》",
    body: [
      "文档没有署名。不同人补上书目、训练安排、退赛提醒、情绪危机求助方式，也有人专门写了一段：不要把任何经验当成唯一正确的道路。",
      "你读见很多熟悉的句子，像看见无数人在同一条河边留下的路标。",
    ],
    choices: [
      choice("fantasy-archive-write", "补上一段自己走过的弯路", "你原本写了很多关于坚持和效率的话，读第二遍时却发现它们更像获奖感言。于是你删掉炫耀，只留下那次错误选择的代价、后来怎样补救，以及当时最希望有人提前告诉你的提醒。几天后，一个完全陌生的新生在段落下面写了谢谢；没有署名的经验第一次真正抵达了需要它的人。", { mindset: 1, social: 0.5, tags: ["幻想乡:留下路标"] }),
      choice("fantasy-archive-proof", "校对事实与过时信息", "你逐条打开文档里的政策链接，发现一项报名条件已经变更，另一处求助电话也换了入口。修改时你保留旧版本与日期，并请当地群友复核，避免用新的自信制造新的错误。校对没有留下动人的个人故事，却让这份面向后来者的善意不至于因为过时信息误导选择，甚至在最脆弱的时候伤到人。", { reasoning: 0.35, social: 0.4, tags: ["幻想乡:维护档案"] }),
      choice("fantasy-archive-read", "从头读完，不添加任何东西", "你从第一页读到最后一条求助信息，没有急着补充自己的经历。不同人的路线互相矛盾，却都保留着各自成立的条件；几段失败记录尤其让你停了很久。不是每个人都必须在共同文档里留下名字和文字，认真读完、理解前人为何作出不同选择，本身已经完成一次安静的传递，也避免把个人经验误当成唯一答案。", { mindset: 0.6, san: 0.5, tags: ["幻想乡:读完来路"] }),
    ],
    minWeek: 56,
  },
  {
    key: "watch-party",
    title: "国际赛直播夜，群里挤满了已经退役的人",
    body: [
      "有人逐题分析实验设计，有人只等最终名单，也有人认出屏幕里的选手曾在群里问过一道很基础的问题。",
      "当掌声响起，聊天窗口短暂地被同一句祝贺淹没。你忽然明白，幻想乡不是逃离现实的地方，而是一群人曾经认真相信过彼此的证据。",
    ],
    choices: [
      choice("fantasy-watch-together", "和大家一起看到直播结束", "你跟着群友逐项看完实验与颁奖，期间有人解释判分，也有人只负责在紧张处发一串表情。直播结束时已经凌晨，退役许久的头像仍没有立刻熄灭，群聊像一间跨越年份的教室。你知道自己未必站上那个赛场，却也明白观看、记住并把掌声传下去，同样让你成为这段共同历史的一部分。", { san: 1.4, mindset: 1, tags: ["幻想乡:看完世界赛"] }),
      choice("fantasy-watch-younger", "给紧张的新生解释选拔流程", "一名刚入门的新生在群里追问需要学到什么程度才有资格继续，你没有给出漂亮的保证，也没有用极端案例吓退TA。你把选拔节点、时间代价和常见退路一项项说明，并坦白每所学校条件不同。你没有神化坚持，只告诉TA困难在哪里、能够怎样求助，以及中途退出同样可以是负责任的决定。", { social: 0.7, mindset: 0.8, tags: ["幻想乡:给后来者真话"] }),
      choice("fantasy-watch-memory", "翻回自己刚进群时的第一条消息", "你沿搜索记录翻回入群当夜，那句生涩的问题仍挂在几年前的时间戳旁，下面是陌生人耐心补画的坐标轴。那时你不知道自己会走多远，也不认识后来陪你经历出分、退赛和重逢的人。如今答案仍不完整，许多选择也无法重来，但重新看见那条消息时，你已经不再是独自向黑暗提问的人。", { san: 1, mindset: 1.2, tags: ["幻想乡:回望第一条消息"] }),
    ],
    minWeek: 70,
    requires: "幻想乡:加入",
  },
];

export function nextFantasyStoryEvent(ctx: FantasyStoryContext): GameEvent | null {
  const joined = ctx.storyTags.includes("幻想乡:加入");
  if (!joined) {
    const deferred =
      ctx.storyTags.includes("幻想乡:暂缓加入") ||
      ctx.storyTags.includes("幻想乡:划走链接");
    if (deferred) {
      if (
        ctx.week < 14 ||
        !ctx.slackedThisWeek ||
        ctx.slackActions < 3 ||
        ctx.resolvedEvents.includes("fantasy-return-invite") ||
        ctx.storyTags.includes("幻想乡:明确拒绝") ||
        hashSeed(`${ctx.seed}-${ctx.week}-fantasy-return`) % 100 >= 72
      )
        return null;
      return {
        id: "fantasy-return-invite",
        phase: "weekly",
        label: "摸鱼偶遇 · 再次出现的链接",
        title: "你在摸鱼时，又刷到了那个熟悉的群聊截图。",
        body: [
          "你本来只想再刷五分钟。评论区却有人提到群里最近整理了新的勘误，也有人在讨论退赛和常规学习，不全是排名与押题。",
          "同一条入口第二次出现，仍然可能只是算法、共同关注和一点偶然。你可以进去看看，也可以明确让它从自己的故事里消失。",
        ],
        concealConsequences: true,
        visualNovel: true,
        trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
        choices: [
          choice("fantasy-return-anonymous", "这一次，用匿名昵称进去看看", "你换了一个不含姓名、学校与奖项线索的昵称，点进那扇第二次出现的门。群消息依然很多，但这一次你先阅读群规，关闭非必要提醒，也观察大家如何核对资料来源。你没有急着证明自己是谁，只从一道正在讨论的题开始参与；匿名没有阻止认真交流，反而给了你逐步决定边界的余地。", { social: 0.5, mindset: 0.4, tags: ["幻想乡:加入", "幻想乡:二次邀请加入"] }),
          choice("fantasy-return-known", "用常用昵称进去，但不透露学校", "你保留平时使用的昵称，却把学校、地区和成绩都留在个人资料之外。很快有人认出你曾在评论区留下的一道题，简单打过招呼后，话题便回到一张植物生理曲线。没有人要求你先展示奖项，也没人把熟悉的网名当成公开全部身份的许可；你开始体会被认出与保留隐私可以同时存在。", { social: 0.8, san: 0.3, tags: ["幻想乡:加入", "幻想乡:二次邀请加入"] }),
          choice("fantasy-return-close", "认真说自己不想加入，并删除链接", "你没有继续用“以后再说”拖延，而是明确告诉转发链接的队友，自己不想加入这个群，也不希望再收到邀请。对方略显意外，却接受了答案，并把聊天话题转回当天的训练。你没有进入幻想乡支线，却保住选择社交边界的权利；链接被删除后，这段故事也以一次清楚而没有惩罚的拒绝结束。", { san: 1, mindset: 0.6, tags: ["幻想乡:明确拒绝"] }),
        ],
      };
    }
    if (
      ctx.week < 7 ||
      !ctx.slackedThisWeek ||
      ctx.slackActions < 1 ||
      ctx.resolvedEvents.includes("fantasy-join") ||
      hashSeed(`${ctx.seed}-${ctx.week}-${ctx.slackActions}-fantasy-discovery`) % 100 >=
        Math.min(86, 42 + ctx.slackDependence * 3 + ctx.slackActions * 4)
    )
      return null;
    return {
      id: "fantasy-join",
      phase: "weekly",
      label: "摸鱼偶遇 · 屏幕另一边的幻想乡",
      title: "刷题间隙摸鱼时，你刷到一张陌生的生竞群聊截图。",
      body: [
        "你原本只是想刷几分钟视频。画面里，一群人从一道细胞生物学题吵到机构勘误，又突然开始讨论学校食堂。评论区有人问群名，发布者回复：“生竞幻想乡，现役退役都在。”",
        "置顶评论留下一个尚未失效的群链接。它可能通向经验、资料和同行者，也可能带来海量消息、焦虑比较与真假难辨的传闻。最重要的是，你不是因为社交能力达标才得到邀请——你只是摸鱼时偶然看见了门。",
        "五分钟已经过去。链接仍停在屏幕上。",
      ],
      concealConsequences: true,
      visualNovel: true,
      trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
      choices: [
        choice("fantasy-join-now", "用一个不带学校信息的昵称加入", "你注册了一个看不出学校和地区的新昵称，确认个人资料里没有可追溯信息后才点进群聊。欢迎消息很快淹没屏幕：有人问你学到哪本书，也有人先发来群规、资料核验方式和心理援助入口。你没有立刻暴露成绩，只从一句简单自我介绍开始，第一次看见竞赛教室之外更大也更复杂的同行者世界。", { social: 0.6, san: 0.5, tags: ["幻想乡:加入", "幻想乡:谨慎公开身份"] }),
        choice("fantasy-join-real", "用常用昵称加入，但先不说学校", "你沿用平时的昵称，却删去资料页里的学校信息，再点下加入。几个人似乎见过这个名字，欢迎之后便问起你正在看的书，也有人先递来群规与情绪求助资源。被认出的感觉让你既兴奋又紧张，于是只回答愿意公开的部分；从这一刻起，你开始学习怎样在真实社交里被看见，同时保留尚不想交出的边界。", { social: 1, san: -0.5, tags: ["幻想乡:加入", "幻想乡:有限公开身份"] }),
        choice("fantasy-later", "保存截图，先把视频划走", "你把截图存进一个不显眼的相册，没有点击仍在倒计时的邀请链接，随后划回原本的摸鱼内容。轻松的视频继续播放，那串群名却偶尔从脑中浮上来：它既像一个可能提供帮助的入口，也像新的比较与噪声。你允许自己暂时不作决定；如果以后再次看见，届时的你仍可以根据状态重新选择。", { san: 0.8, mindset: 0.3, tags: ["幻想乡:暂缓加入"] }),
        choice("fantasy-swipe", "不收藏，直接划走", "你没有截图，也没有把群名复制到备忘录，只让手指继续划向下一条视频。新的画面迅速覆盖群聊截图，几分钟后连发布者的头像也变得模糊。算法也许还会让你们相遇，也许这就是唯一一次擦肩而过；无论如何，你没有因为害怕错过而强迫自己进入一段尚未准备好的社交关系。", { san: 1, tags: ["幻想乡:划走链接"] }),
      ],
    };
  }

  const eligible = chapters.filter((chapter) => {
    if (ctx.resolvedEvents.includes(`fantasy-${chapter.key}`)) return false;
    if ((chapter.minWeek ?? 0) > ctx.week) return false;
    if ((chapter.maxWeek ?? Number.POSITIVE_INFINITY) < ctx.week) return false;
    if (chapter.maxSan !== undefined && ctx.san > chapter.maxSan) return false;
    if (chapter.requires && !ctx.storyTags.includes(chapter.requires)) return false;
    if (chapter.key === "world-visit" && !ctx.hasNationalAttempt) return false;
    // 入群后的普通群聊也只能在本周实际摸鱼后撞见。联赛正式出分夜
    // 是唯一例外，但必须等官方名单确认，不能仅凭周数提前出现。
    if (chapter.key === "result-night") {
      if (
        !ctx.storyTags.some((tag) =>
          /^第[12]次省赛-最终名单确认$/.test(tag),
        )
      )
        return false;
    } else if (!ctx.slackedThisWeek) {
      return false;
    }
    return true;
  });
  const chapter = eligible[0];
  if (!chapter) return null;
  return {
    id: `fantasy-${chapter.key}`,
    phase: "weekly",
    label: "生竞幻想乡 · 群像支线",
    title: chapter.title,
    body: chapter.body,
    concealConsequences: true,
    visualNovel: true,
    trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
    choices: chapter.choices,
  };
}

export function fantasyStoryDeveloperCatalog(seed = "developer-fantasy"): GameEvent[] {
  const catalog = new Map<string, GameEvent>();
  const findSpecial = (storyTags: string[], expectedId: string) => {
    for (let week = 7; week <= 120 && !catalog.has(expectedId); week += 1) {
      for (let variant = 0; variant < 160 && !catalog.has(expectedId); variant += 1) {
        const event = nextFantasyStoryEvent({
          week,
          seed: `${seed}-${variant}`,
          social: 50,
          peerFavor: 30,
          san: 38,
          slackActions: 8,
          slackedThisWeek: true,
          slackDependence: 5,
          resolvedEvents: [],
          storyTags,
          activeTeamSize: 8,
          hasNationalAttempt: true,
        });
        if (event?.id === expectedId) catalog.set(event.id, event);
      }
    }
  };
  findSpecial([], "fantasy-join");
  findSpecial(["幻想乡:暂缓加入"], "fantasy-return-invite");

  const resolvedEvents: string[] = [];
  for (let index = 0; index < chapters.length + 2; index += 1) {
    const event = nextFantasyStoryEvent({
      week: 100,
      seed,
      social: 70,
      peerFavor: 50,
      san: 20,
      slackActions: 12,
      slackedThisWeek: true,
      slackDependence: 6,
      resolvedEvents,
      storyTags: ["幻想乡:加入", "第1次省赛-最终名单确认"],
      activeTeamSize: 8,
      hasNationalAttempt: true,
    });
    if (!event) break;
    catalog.set(event.id, event);
    resolvedEvents.push(event.id);
  }
  return [...catalog.values()];
}
