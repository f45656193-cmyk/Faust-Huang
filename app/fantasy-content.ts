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
      choice("fantasy-answer", "写下自己的证据链", "一位退役选手逐句补全了你的漏洞，没有嘲笑。第二天，那张图被整理进了群文件。", { reasoning: 0.6, san: -0.5, social: 0.4, tags: ["幻想乡:第一次回答"] }),
      choice("fantasy-ask", "承认没看懂，追问第一步", "问题被拆回坐标轴和对照组。你第一次发现，所谓高手也会从最朴素的地方重新读图。", { reasoning: 0.4, mindset: 0.4, tags: ["幻想乡:认真提问"] }),
      choice("fantasy-watch", "把讨论收藏起来，继续潜水", "第二天早晨，讨论已经滚了几百条。你把其中三条真正有用的消息抄进了笔记。", { reasoning: 0.25, san: 0.3, tags: ["幻想乡:潜水者"] }),
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
      choice("fantasy-notes-read", "下载，并从头核对一章", "你在讲义边上写了自己的反例。那份文件没有替你学习，却让一条跨越数届的经验链继续延伸。", { reasoning: 0.5, san: -0.5, tags: ["achievement:legendary-notes"] }),
      choice("fantasy-notes-thank", "先给整理者认真道谢", "对方回了一句“用得上就行”。几天后，他又私发给你一份没有公开的勘误。", { social: 0.7, san: 0.5, tags: ["achievement:legendary-notes", "幻想乡:尊重整理者"] }),
      choice("fantasy-notes-hoard", "先收藏，等以后再看", "压缩包安静躺进硬盘深处。你获得了拥有资料的安心，以及尚未真正学会任何东西的事实。", { san: 0.6, tags: ["achievement:legendary-notes", "幻想乡:收藏即学习"] }),
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
      choice("fantasy-veteran-reply", "告诉他：以后也欢迎回来", "对方只回了一个表情。几周后，他又开始给低年级讲题，只是不再用奖项证明自己。", { social: 0.6, mindset: 0.7, san: 0.5, tags: ["幻想乡:给退役者留灯"] }),
      choice("fantasy-veteran-private", "私下问他最近过得怎么样", "你们没有谈竞赛。一次普通的问候，反而比所有复盘都更接近他当时真正需要的东西。", { peerFavor: 0.8, san: -0.3, mindset: 0.5, tags: ["幻想乡:赛后仍是朋友"] }),
      choice("fantasy-veteran-read", "不打扰，只把那段话收藏下来", "后来你也站在相似的岔路口，才明白当时那段话为什么写得那么慢。", { mindset: 0.6, tags: ["幻想乡:记住退役者"] }),
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
      choice("fantasy-bad-rewrite", "试着把题改成能成立的版本", "你补上对照与可检验预测。情绪没有立刻消失，却变成了一次真正的论文题训练。", { reasoning: 0.7, san: -0.6, tags: ["achievement:paper-survival"] }),
      choice("fantasy-bad-rant", "加入痛骂，然后关掉群聊", "你获得了短暂的痛快，也终于在睡前停止反复计算那道题。", { san: 0.8, mindset: -0.2, tags: ["achievement:paper-survival"] }),
      choice("fantasy-bad-source", "追到原论文，确认作者究竟说了什么", "原文比题目克制得多。你把关键段落贴回群里，争论终于有了一条共同的地面。", { reasoning: 0.9, san: -1, tags: ["achievement:paper-survival", "幻想乡:追到原文"] }),
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
      choice("fantasy-mock-company", "陪那个沉默的人聊到情绪平稳", "你没有承诺下一次一定会更好，只陪他把这一次从世界末日还原成一次考试。", { san: -0.7, mindset: 0.6, social: 0.5, tags: ["幻想乡:模考陪伴"] }),
      choice("fantasy-mock-review", "一起匿名复盘最常见的失分", "分数被拆成知识、时间和误读。你们没有消灭运气，却找到了下一周能做的事情。", { reasoning: 0.5, problemSpeed: 0.35, san: -0.5, tags: ["幻想乡:共同复盘"] }),
      choice("fantasy-mock-offline", "退出群聊，先保护自己的睡眠", "你错过了几百条讨论，却保住了第二天清醒的上午。边界也是一种学习能力。", { san: 1.5, mindset: 0.3, tags: ["幻想乡:知道下线"] }),
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
      choice("fantasy-restaurant-try", "遵循好奇心，尝一口再说", "味道并不危险，描述它的过程比较危险。你们笑到邻桌换了位置。", { san: 2, pocketMoney: -18, social: 0.5, tags: ["achievement:members-only"] }),
      choice("fantasy-restaurant-photo", "负责拍照和记录，不碰神秘食材", "你成为当晚唯一记得完整经过的人，也因此掌握了足够让其他人闭嘴的照片。", { san: 1.5, social: 0.7, tags: ["achievement:members-only"] }),
      choice("fantasy-restaurant-normal", "坚持点一碗正常的面", "众人短暂地嘲笑了你的保守，十分钟后却开始从你碗里夹菜。", { san: 1, mindset: 0.3, pocketMoney: -12, tags: ["achievement:members-only"] }),
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
      choice("fantasy-resource-delete", "提醒打码并联系原作者授权", "文件暂时撤回。几天后，作者提供了可以公开的删节版，也接受了群友整理的勘误。", { social: 0.6, mindset: 0.5, tags: ["幻想乡:尊重资源边界"] }),
      choice("fantasy-resource-notes", "只总结知识点，不继续传播文件", "讨论回到知识本身。你发现真正有价值的从来不只是一个下载链接。", { reasoning: 0.35, tags: ["幻想乡:只传理解"] }),
      choice("fantasy-resource-silent", "不参与争论", "争议最后有了处理方案。你也开始重新检查自己硬盘里那些从未问过来源的文件。", { mindset: 0.25, tags: ["幻想乡:资源反思"] }),
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
      choice("fantasy-eve-check", "互相核对物品，然后按时下线", "准考证、身份证、文具。清单很短，却让混乱的脑子终于停下来。", { san: 1.2, mindset: 0.5, tags: ["幻想乡:赛前互助"] }),
      choice("fantasy-eve-joke", "发一个只有生竞生看得懂的烂梗", "有人笑了，有人发问号。至少这一分钟，所有人都不在计算省队线。", { san: 1.5, social: 0.3, tags: ["幻想乡:赛前烂梗"] }),
      choice("fantasy-eve-confess", "承认自己真的很害怕", "没有人说“别怕”。他们只告诉你自己也一样，然后一个个道晚安。", { san: 1, mindset: 0.8, tags: ["幻想乡:共同害怕"] }),
    ],
    minWeek: 34,
  },
  {
    key: "result-night",
    title: "出分之夜，没有一句话适合所有人",
    body: [
      "喜报、遗憾和申诉消息挤在同一个窗口里。有人终于进队，有人以零点几分告别，也有人先祝贺朋友，再悄悄退出聊天。",
      "管理把炫耀和安慰分到不同的话题，提醒获胜的人不必为喜悦道歉，也提醒所有人不要拿别人的失败装饰自己的故事。",
    ],
    choices: [
      choice("fantasy-result-stay", "既祝贺，也留下陪失利的人", "你学会了让两种情绪同时存在。竞赛的结果把人分开，记得彼此却可以是另一种选择。", { social: 0.7, mindset: 0.8, san: -0.4, tags: ["幻想乡:出分夜留守"] }),
      choice("fantasy-result-boundary", "关掉手机，先处理自己的结果", "你没有承担所有人的情绪。第二天再回来时，你已经能用更诚实的语气说话。", { san: 1.2, mindset: 0.4, tags: ["幻想乡:先照顾自己"] }),
      choice("fantasy-result-record", "把申诉与删题信息整理成清单", "混乱被整理成可执行的步骤。有人因此赶在截止前递交了材料。", { reasoning: 0.25, social: 0.8, san: -0.8, tags: ["幻想乡:出分夜整理"] }),
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
      choice("fantasy-world-knock", "带上家乡零食，去敲下一扇门", "门后的人先愣了一下，随后喊出你的群昵称。世界级串门由此成为一条比排名更长的路线。", { san: 2, social: 1, pocketMoney: -15, tags: ["achievement:world-visit"] }),
      choice("fantasy-world-lobby", "在大厅支一张桌，让大家自己聚过来", "不久，桌边坐满了金银铜牌尚未揭晓的人。至少今晚，没有人按名次选择座位。", { san: 1.5, social: 1.2, tags: ["achievement:world-visit"] }),
      choice("fantasy-world-quiet", "只和几个熟悉的人散步", "你没有认识所有人，却第一次把几个头像变成了以后仍会联系的朋友。", { san: 1.5, peerFavor: 0.8, tags: ["achievement:world-visit"] }),
    ],
    minWeek: 46,
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
      choice("fantasy-after-help", "告诉TA：只回答真正想回答的问题就够了", "几周后，TA偶尔替新生解释一道题，也会在不想说话时直接下线。经验仍在传递，却不再成为新的义务。", { mindset: 0.8, social: 0.5, tags: ["幻想乡:给退役者选择权"] }),
      choice("fantasy-after-life", "邀请TA分享竞赛之外的生活", "群友第一次知道TA还会拍照、种植物、听很冷门的歌。一个人也第一次不靠生竞身份继续被认识。", { san: 1.3, mindset: 0.7, tags: ["幻想乡:身份之外"] }),
      choice("fantasy-after-break", "支持TA暂时退群，等准备好再回来", "退出键没有抹掉共同经历。几个月后是否回来，终于只由TA决定。", { san: 1.2, mindset: 0.7, tags: ["幻想乡:允许暂时告别"] }),
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
      choice("fantasy-archive-write", "补上一段自己走过的弯路", "你删掉所有炫耀，只留下当时最希望有人告诉你的那句话。后来，一个陌生的新生在下面写了谢谢。", { mindset: 1, social: 0.5, tags: ["幻想乡:留下路标"] }),
      choice("fantasy-archive-proof", "校对事实与过时信息", "你改掉一条已经失效的政策说明，也让这份善意不至于因为错误而伤人。", { reasoning: 0.35, social: 0.4, tags: ["幻想乡:维护档案"] }),
      choice("fantasy-archive-read", "从头读完，不添加任何东西", "不是每个人都必须留下文字。认真阅读本身，已经完成了一次传递。", { mindset: 0.6, san: 0.5, tags: ["幻想乡:读完来路"] }),
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
      choice("fantasy-watch-together", "和大家一起看到直播结束", "凌晨的群聊像一间不会熄灯的教室。你知道自己未必站上那个赛场，却仍是这段共同历史的一部分。", { san: 1.4, mindset: 1, tags: ["幻想乡:看完世界赛"] }),
      choice("fantasy-watch-younger", "给紧张的新生解释选拔流程", "你没有神化任何一条路，只告诉他难在哪里、代价是什么，以及退出也不是失败。", { social: 0.7, mindset: 0.8, tags: ["幻想乡:给后来者真话"] }),
      choice("fantasy-watch-memory", "翻回自己刚进群时的第一条消息", "那时你不知道会走到哪里。如今答案仍不完整，但你已经不是独自提问的人。", { san: 1, mindset: 1.2, tags: ["幻想乡:回望第一条消息"] }),
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
          choice("fantasy-return-anonymous", "这一次，用匿名昵称进去看看", "群消息依然很多，但你已经更清楚怎样关闭提醒、怎样判断资料，也怎样在不暴露学校和成绩的情况下认真参与。", { social: 0.5, mindset: 0.4, tags: ["幻想乡:加入", "幻想乡:二次邀请加入"] }),
          choice("fantasy-return-known", "用常用昵称进去，但不透露学校", "很快有人认出你在其他评论区留下过的题目。欢迎消息之后，聊天回到一道普通的植物生理题，没有人要求先展示奖项。", { social: 0.8, san: 0.3, tags: ["幻想乡:加入", "幻想乡:二次邀请加入"] }),
          choice("fantasy-return-close", "认真说自己不想加入，并删除链接", "队友接受了答案。你没有进入幻想乡支线，却保住了自己选择社交边界的权利；这条邀请此后不会再出现。", { san: 1, mindset: 0.6, tags: ["幻想乡:明确拒绝"] }),
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
        choice("fantasy-join-now", "用一个不带学校信息的昵称加入", "欢迎消息很快淹没屏幕。有人问你学到哪本书，也有人先发来群规和心理援助资源。你第一次看见竞赛教室之外更大的同行者世界。", { social: 0.6, san: 0.5, tags: ["幻想乡:加入", "幻想乡:谨慎公开身份"] }),
        choice("fantasy-join-real", "用常用昵称加入，但先不说学校", "欢迎消息很快淹没屏幕。有人问你学到哪本书，也有人先发来群规和心理援助资源。你开始学习怎样在被看见时保留边界。", { social: 1, san: -0.5, tags: ["幻想乡:加入", "幻想乡:有限公开身份"] }),
        choice("fantasy-later", "保存截图，先把视频划走", "你回到了原本的摸鱼内容，截图却留在相册角落。以后再次看见时，你仍然可以重新决定。", { san: 0.8, mindset: 0.3, tags: ["幻想乡:暂缓加入"] }),
        choice("fantasy-swipe", "不收藏，直接划走", "下一条视频立刻覆盖了群聊截图。算法也许还会把你带回来，也许这就是唯一一次擦肩而过。", { san: 1, tags: ["幻想乡:划走链接"] }),
      ],
    };
  }

  const eligible = chapters.filter((chapter) => {
    if (ctx.resolvedEvents.includes(`fantasy-${chapter.key}`)) return false;
    if ((chapter.minWeek ?? 0) > ctx.week) return false;
    if (chapter.maxSan !== undefined && ctx.san > chapter.maxSan) return false;
    if (chapter.requires && !ctx.storyTags.includes(chapter.requires)) return false;
    if (chapter.key === "world-visit" && !ctx.hasNationalAttempt) return false;
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
