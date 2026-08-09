import type { GameEvent } from "./game-data.ts";
import {
  normalizeRelationship,
  type DeepRelationship,
  type RelationshipCandidate,
  type RelationshipInnerConflict,
} from "./relationship-content.ts";
import type { RelationshipDailyContext } from "./relationship-dailies.ts";

type Stage = "neutral" | "crush" | "dating" | "friend";
type Tone = "care" | "light" | "honest" | "practical" | "boundary" | "avoid" | "hurt";
type Personality = RelationshipCandidate["personalityKey"];

type Option = {
  tone: Tone;
  title: string;
  result: string;
  effects: GameEvent["choices"][number]["effects"];
};

type Template = {
  key: string;
  personality: Personality;
  stage: Stage;
  title: (name: string) => string;
  body: (name: string) => string[];
  options: (name: string) => Option[];
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

const templates: Template[] = [
  // 沉静克制：重要的话通常通过行动和留白出现。
  {
    key: "reserved-fixed-bookmark", personality: "reserved", stage: "neutral",
    title: (name) => `${name}悄悄替你修好了断掉的书签。`,
    body: (name) => ["书签是很普通的塑料片，你原本准备直接扔掉。第二天它被透明胶仔细接好，边缘甚至被剪得很整齐。", `${name}没有留下纸条，也没有主动认领。只有TA桌角放着同一卷已经用过的胶带。`],
    options: () => [
      { tone: "honest", title: "把书签放到TA面前，认真道谢", result: "对方只说顺手，却确认了两次胶带有没有刮到书页。", effects: { peerFavor: 0.8, san: 0.4 } },
      { tone: "care", title: "下次替TA补齐缺失的目录标签", result: "你没有要求一次口头回应，而是用同样具体的方式把关心送回去。", effects: { peerFavor: 0.9 } },
      { tone: "hurt", title: "在全队面前问是谁这么细心", result: "起哄让一件安静的小事突然暴露在所有人面前。TA没有承认，之后也很少再碰你的东西。", effects: { peerFavor: -1, san: -0.2 } },
    ],
  },
  {
    key: "reserved-quiet-umbrella", personality: "reserved", stage: "neutral",
    title: (name) => `雨下得很大，${name}把伞往你这边递了一半。`,
    body: () => ["对方没有说“一起走”，只站在门口调整握伞的位置。邀请被藏得很轻，拒绝也不会显得残忍。", "对于不擅长主动的人来说，这半把伞已经接近一段完整的话。"],
    options: () => [
      { tone: "care", title: "自然地走进伞下，不拆穿这次邀请", result: "一路没有太多交谈，肩膀却始终保持着不会让任何一方淋湿的距离。", effects: { peerFavor: 0.9, san: 0.6 } },
      { tone: "light", title: "说这把伞的覆盖率需要重新建模", result: "对方很轻地笑了一声，紧绷的肩膀终于放松。", effects: { san: 0.8, peerFavor: 0.5 } },
      { tone: "avoid", title: "说自己等雨小一点", result: "伞在雨里停了两秒，随后离开。那份没有说出口的邀请也没有第二次出现。", effects: { peerFavor: -0.5 } },
    ],
  },
  {
    key: "reserved-deleted-message", personality: "reserved", stage: "crush",
    title: (name) => `${name}连续撤回了三条消息。`,
    body: () => ["聊天框最后只剩一句“没事”。你没有看见原文，却很难相信三次撤回后真的什么都没有。", "追问可能逼近对方尚未准备好的边界，不追问也可能让一次求助彻底消失。"],
    options: () => [
      { tone: "boundary", title: "回复：想说的时候我在，不急着现在回答", result: "很久以后，TA重新发来一段完整的话。不是因为被追问，而是因为出口一直被保留。", effects: { peerFavor: 1, san: 0.3 } },
      { tone: "honest", title: "告诉TA自己确实有些担心", result: "你没有假装看不见，也没有要求立刻解释。对方最终承认今天发生了一点事。", effects: { peerFavor: 1, mindset: 0.2 } },
      { tone: "hurt", title: "反复追问撤回了什么", result: "对方给出一个足以结束话题的答案。你得到了内容，却失去了它原本可能承载的信任。", effects: { peerFavor: -1, san: -0.4 } },
    ],
  },
  {
    key: "reserved-empty-seat", personality: "reserved", stage: "crush",
    title: (name) => `${name}请假一天，旁边的空座比预想中醒目。`,
    body: () => ["没有人要求你注意那个位置。课程照常播放，翻页声也没有变化，你却数次下意识转向旁边。", "想念一个尚未确认关系的人，会让最普通的缺席变得难以解释。"],
    options: () => [
      { tone: "honest", title: "晚上告诉TA，今天少了个人很不习惯", result: "消息过了很久才回复：“我也是。”只有三个字，却让空座留下了答案。", effects: { peerFavor: 1.1, san: 0.5 } },
      { tone: "practical", title: "整理好当天笔记，等TA回来再交给TA", result: "对方接过笔记时逐页看得很慢，像在阅读你没有写出来的另一层意思。", effects: { reasoning: 0.1, peerFavor: 0.8 } },
      { tone: "avoid", title: "什么都不说，等这种感觉过去", result: "座位第二天重新有人。你也恢复平常，只是那次缺席始终没有被共同记住。", effects: { mindset: -0.2 } },
    ],
  },
  {
    key: "reserved-public-name", personality: "reserved", stage: "dating",
    title: (name) => `有人当众用你们私下的称呼喊了${name}。`,
    body: () => ["教室里立刻出现意味明确的笑声。对方没有反驳，却明显僵住，像一段只属于两个人的关系突然被拖到强光下。", "沉默型的人不一定羞于喜欢，可能只是厌恶失去决定何时被看见的权利。"],
    options: () => [
      { tone: "boundary", title: "立刻结束起哄，课后再确认TA的感受", result: "你没有替关系公开，也没有假装毫无关系。对方在课后告诉你，这正是TA需要的处理。", effects: { peerFavor: 1.1, mindset: 0.4 } },
      { tone: "care", title: "不解释，先陪TA离开人群", result: "走廊安静下来以后，对方才重新开始说话。你保护的不是秘密，而是TA的选择权。", effects: { san: 0.7, peerFavor: 1 } },
      { tone: "hurt", title: "顺势承认恋情，让大家别再猜", result: "关系获得了公开身份，对方却没有参与这个决定。当天晚上，聊天停在了一句很短的晚安。", effects: { peerFavor: -1.5, san: -0.8 } },
    ],
  },
  {
    key: "reserved-need-alone", personality: "reserved", stage: "dating",
    title: (name) => `${name}说今晚想一个人待着。`,
    body: () => ["没有争吵，也没有明显坏消息。正因为理由不够具体，你更容易把这句话理解成关系出了问题。", "亲密有时不是缩短所有距离，而是相信对方离开片刻仍然会回来。"],
    options: () => [
      { tone: "boundary", title: "接受，并约定明天简单报个平安", result: "第二天对方主动回来，也第一次相信独处不会被你解释成拒绝。", effects: { san: 0.6, peerFavor: 1 } },
      { tone: "honest", title: "承认自己会不安，但不要求TA留下", result: "你的不安被说清，也没有变成对方必须处理的命令。两个人都保留了真实。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "hurt", title: "追问是不是已经不喜欢了", result: "对方不得不用本应休息的夜晚证明关系。答案暂时让你安心，疲惫却转移到了TA身上。", effects: { peerFavor: -1.3, san: -0.8 } },
    ],
  },
  {
    key: "reserved-trust-box", personality: "reserved", stage: "friend",
    title: (name) => `${name}把一本私人日记交给你保管到省赛结束。`,
    body: () => ["TA没有解释里面写了什么，只说最近总忍不住翻回过去的失败，希望暂时把它放远一点。", "信任并不意味着你拥有阅读的权利，恰恰意味着你会保护没有被授予的部分。"],
    options: () => [
      { tone: "boundary", title: "封好保存，不询问内容", result: "省赛后日记原样归还。对方检查的不是封条，而是你是否真的尊重了沉默。", effects: { peerFavor: 1.2, mindset: 0.3 } },
      { tone: "care", title: "问是否需要同时联系可信任的成年人", result: "TA没有立刻同意，却认真考虑了你的建议。你没有把秘密据为己有。", effects: { peerFavor: 0.9, san: -0.3 } },
      { tone: "hurt", title: "偷偷翻一页确认是否有危险", result: "动机可以解释担忧，不能自动授予权限。日记被发现移动过以后，TA再也没有提起内容。", effects: { peerFavor: -2, san: -0.7 } },
    ],
  },
  {
    key: "reserved-unspoken-goodbye", personality: "reserved", stage: "friend",
    title: (name) => `${name}离开外培点时没有和任何人告别。`,
    body: () => ["座位已经收拾干净，消息只写着“先走了”。其他人觉得这很符合TA的性格，你却知道过度简短有时是一种无法开口。", "是否追上去，不取决于故事需要一个拥抱，而取决于你是否愿意给TA拒绝陪伴的空间。"],
    options: () => [
      { tone: "boundary", title: "发消息问：需要陪你走到车站吗", result: "对方回复“可以”。你们一路几乎没说话，告别却终于真正发生。", effects: { peerFavor: 1.1, san: 0.3 } },
      { tone: "honest", title: "告诉TA，不告别会让自己担心", result: "对方第一次意识到沉默也会影响别人。下一次离开前，TA主动来找了你。", effects: { peerFavor: 0.9, mindset: 0.3 } },
      { tone: "avoid", title: "尊重TA一贯的离开方式", result: "你没有追问。很久以后才知道，那天TA其实在车站等了十几分钟。", effects: { peerFavor: -0.4, san: -0.3 } },
    ],
  },

  // 温柔外向：很会照顾别人，也最容易把自己耗尽。
  {
    key: "warm-extra-lunch", personality: "warm", stage: "neutral",
    title: (name) => `${name}带了两份午饭，说家里“不小心做多了”。`,
    body: () => ["饭盒里的菜明显按照两个人的量分好，连你不吃的东西都被避开。对方把照顾说成偶然，似乎这样你就不必承担回报。", "接受别人的好意，有时也需要避免让它永久变成单方面劳动。"],
    options: () => [
      { tone: "care", title: "接受，并约定下次由自己带", result: "对方没有推辞。互相照顾第一次拥有了下一次和轮流。", effects: { san: 1, peerFavor: 1 } },
      { tone: "honest", title: "告诉TA自己确实很需要这顿饭", result: "真诚的感谢比客套拒绝更让TA高兴，也让好意不必继续假装偶然。", effects: { peerFavor: 0.9, mindset: 0.2 } },
      { tone: "hurt", title: "习惯性接过，连谢谢也省掉", result: "对方仍笑着把筷子递来。只是照顾从礼物开始像一项默认职责。", effects: { peerFavor: -0.6, san: 0.6 } },
    ],
  },
  {
    key: "warm-newcomer", personality: "warm", stage: "neutral",
    title: (name) => `${name}拉着你去认识刚加入竞赛队的新生。`,
    body: () => ["新生明显紧张，对课程、队内排名和每个人的关系都一无所知。对方自然地把你介绍成“可以认真讨论的人”。", "一句介绍既是社交帮助，也是一种对你人格的公开判断。"],
    options: () => [
      { tone: "care", title: "接住介绍，替新生讲清基本安排", result: "对方在旁边补充遗漏，没有抢走谈话。你们第一次像一个能够共同照顾别人的小组。", effects: { social: 0.3, peerFavor: 0.8 } },
      { tone: "light", title: "先告诉新生几条不会写进群公告的生存技巧", result: "紧张被笑声冲淡。对方看你的眼神像在说：果然没有介绍错。", effects: { san: 0.8, social: 0.3 } },
      { tone: "avoid", title: "说自己不擅长带人，迅速离开", result: "对方独自完成了介绍，却开始减少把你带进社交场景的次数。", effects: { peerFavor: -0.4 } },
    ],
  },
  {
    key: "warm-cares-everyone", personality: "warm", stage: "crush",
    title: (name) => `${name}也记得其他每个人的口味和生日。`,
    body: () => ["你曾把那些细节当作对自己的特别在意，现在才发现对方会给很多人带水、留座和准备药。失落因此显得有些自私。", "温柔是TA的性格，不是只向你发放的证明；关系的特别需要别的证据。"],
    options: () => [
      { tone: "honest", title: "承认自己曾误以为那些照顾只属于自己", result: "对方没有嘲笑，反而问你真正希望得到哪一种只属于两个人的关系。", effects: { peerFavor: 1, san: -0.3 } },
      { tone: "care", title: "主动帮TA分担对全队的照顾", result: "你没有要求TA减少善意，而是让善意不再全部消耗TA一个人。", effects: { peerFavor: 1, social: 0.2 } },
      { tone: "hurt", title: "讽刺TA对谁都一样好", result: "对方第一次因为自己的温柔感到像犯了错。那天以后，TA在你面前明显收敛了关心。", effects: { peerFavor: -1.5, mindset: -0.3 } },
    ],
  },
  {
    key: "warm-tired-smile", personality: "warm", stage: "crush",
    title: (name) => `${name}说“我没事”时，笑得比平时更完整。`,
    body: () => ["越是熟悉，你越能看出那种笑容专门用于让别人停止担心。今天已有三个人找TA倾诉，TA仍然在问你是不是心情不好。", "看见照顾者的疲惫，不等于强迫TA立刻脆弱。"],
    options: () => [
      { tone: "care", title: "先替TA完成手边琐事，不逼TA解释", result: "没有被追问的半小时，让对方终于安静坐下。离开前，TA主动说了今天真正发生的事。", effects: { peerFavor: 1.1, san: -0.2 } },
      { tone: "honest", title: "告诉TA，不必一直在自己面前表现没事", result: "笑容慢慢放下来。你没有解决问题，却成为一个不要求TA继续温柔的人。", effects: { peerFavor: 1.2, mindset: 0.3 } },
      { tone: "hurt", title: "既然TA说没事，就继续倾诉自己的压力", result: "对方依然耐心听完。代价是TA的疲惫再次没有位置。", effects: { peerFavor: -1, san: 0.3 } },
    ],
  },
  {
    key: "warm-emotional-labor", personality: "warm", stage: "dating",
    title: (name) => `${name}开始记不清自己一周安慰过你多少次。`,
    body: () => ["你习惯在每次模考后第一时间找TA，对方也总能说出合适的话。直到今天，TA在听到你的叹气时明显停顿了一下。", "恋人可以提供支持，却不该成为无限容量的情绪处理器。"],
    options: () => [
      { tone: "honest", title: "承认自己把所有压力都倒给了TA", result: "你们共同区分了分享、求助和反复倾倒。道歉没有要求对方立刻恢复温柔。", effects: { peerFavor: 1, san: -0.5, mindset: 0.4 } },
      { tone: "boundary", title: "约定倾诉前先询问对方有没有余力", result: "一句“现在方便听吗”让照顾重新成为选择，而不是恋爱义务。", effects: { peerFavor: 1.1, mindset: 0.4 } },
      { tone: "hurt", title: "反问恋人之间为什么还要这么客气", result: "亲密被用来取消边界。对方依旧留在关系里，却开始害怕你的每一次低落。", effects: { peerFavor: -1.6, san: -0.5 } },
    ],
  },
  {
    key: "warm-receive-care", personality: "warm", stage: "dating",
    title: (name) => `${name}生病后仍坚持说不需要你来。`,
    body: () => ["对方能熟练照顾所有人，却在角色交换时显得不知所措。拒绝里不只有独立，也有对成为负担的恐惧。", "真正的照顾需要让对方保留决定方式，而不是强行证明自己有用。"],
    options: () => [
      { tone: "boundary", title: "列出几种帮助方式，让TA自己选择", result: "对方选择了最简单的一项：带一份粥。被给予选择后，接受终于不再像欠债。", effects: { pocketMoney: -12, peerFavor: 1.2, san: 0.3 } },
      { tone: "care", title: "只送药到门口，不要求见面", result: "你留下照顾，也留下空间。晚上，对方第一次主动说自己其实很难受。", effects: { pocketMoney: -15, peerFavor: 1 } },
      { tone: "hurt", title: "责怪TA从不信任自己能够照顾人", result: "生病的人还要反过来安抚你的受挫。关心因为索取认可而失去原来的方向。", effects: { peerFavor: -1.3, san: -0.7 } },
    ],
  },
  {
    key: "warm-mediator", personality: "warm", stage: "friend",
    title: (name) => `${name}又被拉去调解两名队友的矛盾。`,
    body: () => ["所有人都默认TA擅长理解双方，于是最费力的工作总是自然落到TA身上。争吵结束后，没有人问调解者是否也被刺伤。", "你可以帮助朋友退出不属于TA的责任。"],
    options: () => [
      { tone: "care", title: "接手整理事实，让TA不必继续吸收情绪", result: "分工让调解第一次不依赖一个人的善良。事情结束后，TA终于能承认自己也很生气。", effects: { peerFavor: 1.1, social: 0.2 } },
      { tone: "boundary", title: "支持TA明确拒绝下一次无休止调解", result: "有人短暂不满，却开始学习直接和当事人沟通。TA也第一次没有因拒绝而道歉。", effects: { peerFavor: 1, mindset: 0.4 } },
      { tone: "hurt", title: "夸TA最会处理这种事，劝TA再坚持一下", result: "赞美把负担包装成天赋。对方完成了调解，也更加难以退出这个角色。", effects: { peerFavor: -1, san: -0.4 } },
    ],
  },
  {
    key: "warm-collapse", personality: "warm", stage: "friend",
    title: (name) => `${name}在所有人离开后突然说：“我今天不想照顾任何人。”`,
    body: () => ["这句话带着明显的内疚，仿佛停止温柔就是人格失职。TA靠在椅背上，连水杯都不想伸手去拿。", "朋友不是要求TA尽快恢复正常的人，而是允许“正常”暂时停止。"],
    options: () => [
      { tone: "care", title: "替TA关掉群消息，安静待一会儿", result: "没有倾诉任务，也没有感谢要求。TA终于能够只作为一个疲惫的人坐在那里。", effects: { san: 0.8, peerFavor: 1.2 } },
      { tone: "honest", title: "告诉TA，自己喜欢的不只是那个会照顾人的TA", result: "对方没有立刻相信，却把这句话记得比任何夸奖都久。", effects: { peerFavor: 1.3, mindset: 0.4 } },
      { tone: "hurt", title: "开玩笑说太阳从西边出来了", result: "对方配合地笑了一下，刚刚打开的出口又被熟悉的角色封住。", effects: { peerFavor: -1, san: -0.3 } },
    ],
  },

  // 好胜锋利：亲密与竞争经常同时发生。
  {
    key: "competitive-challenge", personality: "competitive", stage: "neutral",
    title: (name) => `${name}把自己的模考分数拍在你桌上。`,
    body: () => ["分数只比你高一点。对方没有炫耀，只说下一套卷继续，并明确要求不许故意让题。", "有些人的邀请听起来像挑衅，因为承认你值得竞争就是TA最直接的尊重。"],
    options: () => [
      { tone: "practical", title: "接受，并约定只比较同一套卷", result: "规则明确以后，竞争反而让关系变得简单。你们都开始期待下一次对答案。", effects: { problemSpeed: 0.1, peerFavor: 0.8 } },
      { tone: "light", title: "给这场对决起一个夸张的名字", result: "对方嫌弃了三分钟，最终还是把名字写在了比分表顶端。", effects: { san: 0.8, peerFavor: 0.5 } },
      { tone: "hurt", title: "说这种分差根本说明不了什么", result: "你否定的不只是分数，也是否定TA把你视为对手的认真。", effects: { peerFavor: -0.8 } },
    ],
  },
  {
    key: "competitive-redo", personality: "competitive", stage: "neutral",
    title: (name) => `${name}要求把刚才侥幸做对的题重新闭卷做一遍。`,
    body: () => ["你们都知道第一次正确有猜测成分。别人已经开始下一套卷，对方却不肯让运气冒充掌握。", "严格可能是有效方法，也可能把每一次学习都变成不能输的审判。"],
    options: () => [
      { tone: "practical", title: "一起重做，并分别写出证据链", result: "第二次答案仍然正确，这次终于属于理解。对方认真承认你确实掌握了。", effects: { reasoning: 0.15, peerFavor: 0.7 } },
      { tone: "boundary", title: "承认侥幸，但把重做安排到复习日", result: "你没有逃避漏洞，也没有服从即时竞争。对方不太习惯，却接受了计划。", effects: { mindset: 0.3, peerFavor: 0.5 } },
      { tone: "avoid", title: "说做对就是做对，不必折腾", result: "对方没有继续要求，也把你从最值得共同复盘的名单里往后挪了一点。", effects: { peerFavor: -0.5 } },
    ],
  },
  {
    key: "competitive-praise", personality: "competitive", stage: "crush",
    title: (name) => `${name}第一次当着别人承认你这道题做得比TA好。`,
    body: () => ["话说得很短，甚至带着一点不服气。可你知道，对一个把能力看得极重的人来说，公开认可比许多温柔话更难。", "你可以把它当作胜利，也可以把它理解为信任。"],
    options: () => [
      { tone: "honest", title: "告诉TA，这句认可对自己很重要", result: "对方移开视线，说重要就下次继续赢。声音却明显没有平时锋利。", effects: { peerFavor: 1, san: 0.5 } },
      { tone: "light", title: "立刻要求把这句话录音存证", result: "对方追着你要求删除，最后两个人都笑得无法继续讲题。", effects: { san: 1, peerFavor: 0.6 } },
      { tone: "hurt", title: "顺势说TA终于愿意服输了", result: "认可被改写成投降。对方迅速收回刚才的柔软，下一场竞争重新只剩胜负。", effects: { peerFavor: -1 } },
    ],
  },
  {
    key: "competitive-lose-you", personality: "competitive", stage: "crush",
    title: (name) => `${name}输给你以后，一整晚都异常安静。`,
    body: () => ["TA没有否认你的成绩，也没有找卷子借口。真正难以面对的是，在意的人恰好成为证明自己不够好的那个人。", "安慰如果带着居高临下，会比沉默更伤人。"],
    options: () => [
      { tone: "honest", title: "说自己很高兴赢，但不因此看低TA", result: "你没有虚伪地否认胜利，也没有把胜利扩大成人格判断。对方最终愿意和你复盘。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "practical", title: "只讨论彼此最值得交换的一道题", result: "排名被缩小到可以行动的差异。对方重新找回熟悉的锋利。", effects: { reasoning: 0.15, peerFavor: 0.7 } },
      { tone: "hurt", title: "故意说这次只是自己运气好", result: "看似谦让，却同时贬低了你的努力和对方的承受能力。TA听出了怜悯。", effects: { peerFavor: -1.2 } },
    ],
  },
  {
    key: "competitive-no-mercy", personality: "competitive", stage: "dating",
    title: (name) => `${name}问：谈恋爱以后，模考还要不要认真分胜负。`,
    body: () => ["问题听起来荒谬，却指向真正的担忧：如果一方开始让步，关系里的尊重是否也会被一起稀释。", "亲密不必取消竞争，但必须为失败留下不被羞辱的位置。"],
    options: () => [
      { tone: "honest", title: "继续认真比，但禁止用关系惩罚输家", result: "你们保留了胜负，也明确了冷战、讽刺和撤回关心不属于比赛规则。", effects: { peerFavor: 1, mindset: 0.4 } },
      { tone: "practical", title: "改成比较各自进步，而不是只看绝对名次", result: "竞争从零和变成了两条可以同时向上的曲线。对方起初不习惯，后来却最认真记录。", effects: { problemSpeed: 0.1, peerFavor: 0.8 } },
      { tone: "hurt", title: "说恋人当然应该让着对方", result: "对方听见的不是体贴，而是你不再把TA当作平等选手。", effects: { peerFavor: -1.4, san: -0.3 } },
    ],
  },
  {
    key: "competitive-same-team", personality: "competitive", stage: "dating",
    title: (name) => `省队最后一个位置，可能只够你和${name}中的一个。`,
    body: () => ["预测排名把两个人放在近乎重叠的位置。你们仍然一起学习，却无法假装每次交换资料都与自己的利益无关。", "爱并不会让竞争自动高尚。诚实承认自私，可能比表演牺牲更可靠。"],
    options: () => [
      { tone: "honest", title: "承认自己想赢，也希望TA发挥完整", result: "两种愿望同时存在，没有谁要求对方证明无私。你们约定不隐藏已经答应共享的资料。", effects: { peerFavor: 1.1, san: -0.5 } },
      { tone: "boundary", title: "暂停共同复盘，各自准备到考试结束", result: "短暂分开不是背叛，而是避免让每一次帮助都变成道德考试。", effects: { mindset: 0.5, peerFavor: 0.6 } },
      { tone: "hurt", title: "暗示如果TA在乎你，就应该主动退出", result: "关系被用来要求牺牲最核心的目标。对方第一次认真怀疑这段感情是否安全。", effects: { peerFavor: -2, san: -1 } },
    ],
  },
  {
    key: "competitive-one-place", personality: "competitive", stage: "friend",
    title: (name) => `${name}把唯一一张推荐名额表推到你面前。`,
    body: () => ["老师让你们私下商量谁更适合参加一场高质量培训。把资源稀缺造成的选择交给朋友，本身就很残酷。", "你们必须区分友情、能力与谁更需要这次机会。"],
    options: () => [
      { tone: "practical", title: "按当前短板和课程匹配程度共同判断", result: "决定仍然让一个人失望，却至少不是由谁更会牺牲来决定。", effects: { reasoning: 0.1, peerFavor: 0.9 } },
      { tone: "honest", title: "分别说出自己为什么想去，再交给老师决定", result: "你们拒绝替资源分配承担全部责任，也没有隐藏真实欲望。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "hurt", title: "提醒TA上次模考不如自己", result: "事实成为一把专门伤人的工具。名额也许属于你，关系却不再像原来那样平等。", effects: { peerFavor: -1.5 } },
    ],
  },
  {
    key: "competitive-celebrate", personality: "competitive", stage: "friend",
    title: (name) => `${name}考过你以后，反而不敢在你面前庆祝。`,
    body: () => ["TA压住了惯常的得意，像胜利会自动构成对朋友的伤害。你也确实有些难过，却不希望友情要求任何人缩小喜悦。", "真正困难的是让祝贺和不甘同时合法。"],
    options: () => [
      { tone: "honest", title: "祝贺TA，也承认自己会不甘心", result: "对方终于笑出来，也没有要求你立刻释怀。两种真实没有互相取消。", effects: { peerFavor: 1.1, mindset: 0.4 } },
      { tone: "light", title: "请赢家按传统承担今天的饮料", result: "胜负被转化成一项轻松仪式。下一轮挑战在吸管插进杯子时已经开始。", effects: { san: 1, pocketMoney: 0 } },
      { tone: "hurt", title: "说自己根本没认真，所以不算输", result: "你保护了自尊，也否定了朋友想与你认真竞争的价值。", effects: { peerFavor: -1.2 } },
    ],
  },

  // 活泼跳脱：玩笑既是亲密语言，也可能是逃避。
  {
    key: "playful-nickname", personality: "playful", stage: "neutral",
    title: (name) => `${name}给你起了一个只有竞赛队听得懂的外号。`,
    body: () => ["外号来自一次很小的实验失误，传播速度却超过任何勘误。你无法判断这是被接纳的标志，还是会持续让你不舒服的玩笑。", "关系轻松不等于边界可以靠猜。"],
    options: () => [
      { tone: "light", title: "给TA起一个同等荒谬的外号", result: "两个人完成了互相伤害式命名，外号最后只在彼此之间使用。", effects: { san: 1, peerFavor: 0.7 } },
      { tone: "boundary", title: "说明私下可以，公开场合不喜欢", result: "对方愣了一下，随后认真遵守。能停下玩笑，让轻松第一次变得安全。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "hurt", title: "当众用更难听的话反击", result: "笑声短暂扩大，关系却从玩笑滑向了互相试探底线。", effects: { peerFavor: -1, san: -0.3 } },
    ],
  },
  {
    key: "playful-prank-note", personality: "playful", stage: "neutral",
    title: (name) => `${name}把你的笔记标题改成了“绝密国家队资料”。`,
    body: () => ["下面还画了一个极其潦草的印章。你原本想生气，却发现对方只改了可擦掉的便签，没有碰正文。", "玩笑里保留的分寸，往往比玩笑本身更说明一个人。"],
    options: () => [
      { tone: "light", title: "追加一页伪造的使用许可证", result: "这份无用文件逐渐拥有完整的审批流程，成为你们最早的一项共同作品。", effects: { san: 1.1, peerFavor: 0.7 } },
      { tone: "boundary", title: "告诉TA正文和错题页不要碰", result: "对方立即答应，也真的再没有越过那条线。", effects: { peerFavor: 0.8, mindset: 0.2 } },
      { tone: "hurt", title: "直接撕掉便签并拒绝解释", result: "玩笑停止了，对方却不知道停止的是这一次，还是所有靠近。", effects: { peerFavor: -0.7 } },
    ],
  },
  {
    key: "playful-joke-confession", personality: "playful", stage: "crush",
    title: (name) => `${name}笑着说：“不然我们毕业以后结婚算了。”`,
    body: () => ["语气和往常的胡说没有区别，眼神却在等你的反应。玩笑提供了随时撤退的出口，也让任何认真回答都显得风险很高。", "你可以接梗，也可以温和地要求某些话不要永远躲在玩笑里。"],
    options: () => [
      { tone: "honest", title: "问TA如果不是玩笑，会希望得到什么回答", result: "对方第一次没能立刻接话。沉默以后，TA承认自己确实想象过那个以后。", effects: { peerFavor: 1.2, san: -0.2 } },
      { tone: "light", title: "说至少要先通过动物行为学考核", result: "话题被安全地接住。你们都笑了，也都知道这个玩笑从此不再完全无辜。", effects: { san: 1, peerFavor: 0.7 } },
      { tone: "hurt", title: "当着其他人把这句话复述一遍", result: "众人的起哄替你逃过回答，也夺走了对方选择是否认真的机会。", effects: { peerFavor: -1.3 } },
    ],
  },
  {
    key: "playful-suddenly-serious", personality: "playful", stage: "crush",
    title: (name) => `${name}讲完一个烂梗后，突然问你最近是不是很难受。`,
    body: () => ["转换没有铺垫。原来那些夸张笑话并非没有看见你的状态，只是在等一个不让你难堪的入口。", "你可以继续笑，也可以接受TA难得没有用玩笑保护自己。"],
    options: () => [
      { tone: "honest", title: "承认最近确实接近极限", result: "对方没有再逗你开心，只认真听完。原来TA也能够留在没有笑声的地方。", effects: { san: 0.8, peerFavor: 1.2 } },
      { tone: "care", title: "先问TA是不是也有类似感觉", result: "关心没有单向流动。对方坦白，最近的玩笑确实比以前更多。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "avoid", title: "用另一个梗把问题挡回去", result: "对方配合地笑了。那个认真问题此后很久没有再次出现。", effects: { peerFavor: -0.6, san: 0.4 } },
    ],
  },
  {
    key: "playful-secret-signal", personality: "playful", stage: "dating",
    title: (name) => `你和${name}发明了一套课堂上的秘密信号。`,
    body: () => ["敲两下桌子表示“这题有问题”，转笔表示“我快睡着了”，把橡皮推到桌角则表示“下课等我”。", "秘密语言让枯燥训练多了一层生活，也可能让注意力逐渐只剩彼此。"],
    options: () => [
      { tone: "light", title: "继续完善，但禁止在正式模考使用", result: "规则让整活有了边界。那些信号后来成为你们回忆这间教室时最清楚的细节。", effects: { san: 1, peerFavor: 0.8 } },
      { tone: "boundary", title: "只保留真正需要的三个信号", result: "亲密没有因为减少暗号而变淡，反而不再吞掉整堂课程。", effects: { mindset: 0.3, peerFavor: 0.7 } },
      { tone: "hurt", title: "在模考中用信号提示答案", result: "玩笑跨过考试边界以后不再轻松。你们都必须承担作弊嫌疑和彼此的不安。", effects: { coachFavor: -2, peerFavor: -0.8, san: -1 } },
    ],
  },
  {
    key: "playful-joke-boundary", personality: "playful", stage: "dating",
    title: (name) => `${name}把你们的一次争吵编成梗发进了小群。`,
    body: () => ["内容没有透露最私密的部分，大家也确实笑了。可你在看到截图时，首先感到的不是好笑，而是共同经历被未经同意地改写。", "幽默可以处理痛苦，前提是当事人仍拥有边界。"],
    options: () => [
      { tone: "honest", title: "说清自己为什么觉得被暴露", result: "对方起初辩解只是玩笑，最终还是删除消息并向群里说明越界。", effects: { peerFavor: 0.8, san: -0.4 } },
      { tone: "boundary", title: "约定涉及关系的梗必须先征得同意", result: "规则听起来不够浪漫，却让以后每一次笑都不再建立在某个人的忍耐上。", effects: { peerFavor: 1, mindset: 0.4 } },
      { tone: "hurt", title: "也把TA的糗事发出去作为报复", result: "公平伤害没有修复任何事，只把关系变成谁掌握更多素材的威慑。", effects: { peerFavor: -1.8, san: -0.8 } },
    ],
  },
  {
    key: "playful-meme-rescue", personality: "playful", stage: "friend",
    title: (name) => `你最低落的晚上，${name}没有劝你，只连续发了二十张怪图。`,
    body: () => ["其中大部分很难解释，最后一张却写着：“如果你不想说话，就回一个句号。”", "玩笑没有否认痛苦，只是在你无法组织语言时提供了更低的求助门槛。"],
    options: () => [
      { tone: "honest", title: "回一个句号", result: "对方立刻停止刷屏，只问要不要打电话。一个标点足够启动真正的陪伴。", effects: { san: 1.2, peerFavor: 1.1 } },
      { tone: "light", title: "回一张更怪的图", result: "对话没有触及问题核心，却确认今晚仍有人在屏幕另一边。", effects: { san: 1, peerFavor: 0.7 } },
      { tone: "avoid", title: "保持已读，不回应", result: "对方没有继续追问，第二天仍把早餐放在你桌边。出口还在，只是你这次没有走进去。", effects: { san: 0.4, peerFavor: 0.1 } },
    ],
  },
  {
    key: "playful-laugh-after-fail", personality: "playful", stage: "friend",
    title: (name) => `${name}实验失败后第一个笑了，随后却独自留到最后。`,
    body: () => ["白天TA把污染的培养皿说成现代艺术，让全组不至于陷入相互指责。晚上你回来取东西，才发现TA正在一项项重写记录。", "能让别人笑的人，也可能只是把自己的失败留到没人看见时处理。"],
    options: () => [
      { tone: "care", title: "坐下来一起完成复盘", result: "你没有要求TA继续活跃气氛。两个人在安静里找到了真正的污染来源。", effects: { experiment: 0.2, peerFavor: 1.1, san: -0.3 } },
      { tone: "honest", title: "告诉TA，失败时不逗大家笑也没关系", result: "对方说自己只是习惯了。那晚以后，TA偶尔也会直接说“我很难受”。", effects: { peerFavor: 1.1, mindset: 0.3 } },
      { tone: "hurt", title: "继续夸TA今天特别会救场", result: "夸奖再次把TA推回负责让所有人轻松的位置。真正的失落没有被看见。", effects: { peerFavor: -0.8 } },
    ],
  },

  // 好奇理性：亲密常从问题开始，也必须学习何时停止追问。
  {
    key: "curious-why-bio", personality: "curious", stage: "neutral",
    title: (name) => `${name}不接受你“因为喜欢生物”的回答。`,
    body: () => ["TA继续问喜欢的是知识、竞争、被认可，还是逃离常规课堂。每个问题都让原来的答案显得更像一句口号。", "认真追问可以让人被理解，也可能让普通聊天变成没有同意的审讯。"],
    options: () => [
      { tone: "honest", title: "承认答案里也有虚荣和偶然", result: "对方没有评价，只交换了自己同样不够纯粹的理由。谈话第一次真正平等。", effects: { peerFavor: 1, mindset: 0.3 } },
      { tone: "boundary", title: "说今天不想继续分析自己", result: "对方停下追问，并记住了你明确表达边界的方式。", effects: { peerFavor: 0.8, san: 0.4 } },
      { tone: "hurt", title: "反问TA为什么总把聊天弄得像面试", result: "问题本身并非无效，语气却让对方把好奇理解成不受欢迎。", effects: { peerFavor: -0.7 } },
    ],
  },
  {
    key: "curious-observe-habit", personality: "curious", stage: "neutral",
    title: (name) => `${name}指出你紧张时会反复转同一支笔。`,
    body: () => ["你自己从未注意。对方还能准确说出这种动作在哪几场模考前出现得最多。", "被认真观察可能意味着在意，也可能让人感到自己的每个动作都被记录。"],
    options: () => [
      { tone: "light", title: "请TA为转笔行为建立统计模型", result: "对方真的画出了一张极简陋的表。观察从审视变成了共同玩笑。", effects: { san: 0.9, peerFavor: 0.6 } },
      { tone: "honest", title: "告诉TA，被注意到让自己有点意外", result: "对方解释不是监视，只是每次你紧张时都恰好坐在附近。解释本身泄露了更多在意。", effects: { peerFavor: 1 } },
      { tone: "boundary", title: "说明不希望所有习惯都被分析", result: "对方认真道歉，也开始先询问你是否愿意听观察结果。", effects: { peerFavor: 0.8, mindset: 0.2 } },
    ],
  },
  {
    key: "curious-hypothetical", personality: "curious", stage: "crush",
    title: (name) => `${name}问：“如果两个人去了不同城市，关系还算什么？”`,
    body: () => ["问题被包装成假设，没有主语，也没有明确的关系名称。可你们都知道它并不来自一道题。", "理性讨论未来有时是表达心意最安全的方式，也可能永远停留在模型里。"],
    options: () => [
      { tone: "honest", title: "把“如果”换成你们两个人重新回答", result: "假设失去保护以后，对方沉默很久，最终开始谈真正想去的城市。", effects: { peerFavor: 1.2, san: -0.2 } },
      { tone: "practical", title: "一起列出异地关系可能面对的问题", result: "表格看起来过分认真，却第一次把彼此放进了可以讨论的未来。", effects: { reasoning: 0.1, peerFavor: 0.8 } },
      { tone: "avoid", title: "说高中生考虑这些太早了", result: "问题在逻辑上被驳回，真正想问的部分也随之失去回答。", effects: { peerFavor: -0.7 } },
    ],
  },
  {
    key: "curious-personal-question", personality: "curious", stage: "crush",
    title: (name) => `${name}问起你最不愿成为哪一种大人。`,
    body: () => ["这不是常见的暧昧话题，却比爱好和生日更接近某种核心。回答会暴露家庭、失败和你尚未整理好的价值判断。", "深度不应该成为亲密的强制门票。"],
    options: () => [
      { tone: "honest", title: "分享一个自己很少说的答案", result: "对方没有立即分析，而是先把答案完整记住。之后才交换TA自己的恐惧。", effects: { peerFavor: 1.2, mindset: 0.3 } },
      { tone: "boundary", title: "说现在还不准备谈这个", result: "对方接受，并把问题留到你愿意回答的以后。尊重让亲密没有因暂停而倒退。", effects: { peerFavor: 0.9, san: 0.3 } },
      { tone: "hurt", title: "随口编一个漂亮答案应付", result: "对方很快听出答案没有落在你身上。追问停止，谈话也回到安全表面。", effects: { peerFavor: -0.8 } },
    ],
  },
  {
    key: "curious-love-interview", personality: "curious", stage: "dating",
    title: (name) => `${name}认真问你：“你喜欢我的哪一部分？”`,
    body: () => ["一个看似普通的问题被拆成性格、能力、陪伴和投射。对方并非索要标准情话，而是在确认自己有没有被看成一个具体的人。", "答案不必完美，却不能只是一组适用于任何恋人的模板。"],
    options: (name) => [
      { tone: "honest", title: "说出一个优点和一个真实的矛盾", result: `${name}没有因为你提到矛盾而失望。被完整地看见，比被抽象地赞美更可靠。`, effects: { peerFavor: 1.2, mindset: 0.3 } },
      { tone: "light", title: "先说喜欢TA总能发现烂题", result: "对方要求这只能算第一条。你们把答案补到很晚，最后已经完全偏离原问题。", effects: { san: 0.9, peerFavor: 0.7 } },
      { tone: "hurt", title: "回答“全部”，拒绝继续具体化", result: "听起来最浪漫的词因为无法落地，反而让对方觉得自己可以被任何想象替代。", effects: { peerFavor: -1 } },
    ],
  },
  {
    key: "curious-privacy-line", personality: "curious", stage: "dating",
    title: (name) => `${name}追问你为什么不愿展示和家长的聊天。`,
    body: () => ["TA想理解你的家庭压力，也相信亲密应该减少隐瞒。你却清楚，那些聊天包含不属于恋人的隐私和自己尚未准备整理的伤口。", "理解的愿望不能自动越过边界。"],
    options: () => [
      { tone: "boundary", title: "解释可以谈感受，但不会展示原始聊天", result: "对方起初有些失落，随后接受理解一个人不等于拥有全部材料。", effects: { peerFavor: 1, mindset: 0.4 } },
      { tone: "honest", title: "选一段自己愿意谈的经历说清楚", result: "你提供了真实，也保留了边界。对方的问题终于从证据转向你的感受。", effects: { peerFavor: 1.1, san: -0.3 } },
      { tone: "hurt", title: "把手机丢过去，让TA自己看个够", result: "同意在愤怒中变成惩罚。对方没有继续翻，却意识到你们已经无法安全讨论这件事。", effects: { peerFavor: -1.4, san: -0.8 } },
    ],
  },
  {
    key: "curious-model", personality: "curious", stage: "friend",
    title: (name) => `${name}画了一张“你在什么情况下会崩溃”的流程图。`,
    body: () => ["图很粗糙，却准确连接了连续模考、睡眠不足、教练批评和你突然开始长时间摸鱼的行为。", "把朋友理解成模型可能显得冒犯，也可能是一种笨拙而认真的照看。"],
    options: () => [
      { tone: "light", title: "给流程图补上几个荒谬分支", result: "图变得更好笑，也因此不再像诊断书。你们共同保留了真正有用的预警信号。", effects: { san: 0.9, peerFavor: 0.7 } },
      { tone: "honest", title: "指出哪些观察准确、哪些让自己不舒服", result: "对方删掉越界部分，并第一次学会观察以后还需要询问。", effects: { peerFavor: 1.1, mindset: 0.3 } },
      { tone: "hurt", title: "嘲笑TA把友情也做成研究项目", result: "对方收起图，之后不再主动指出那些曾经很准确的危险信号。", effects: { peerFavor: -1 } },
    ],
  },
  {
    key: "curious-unanswered", personality: "curious", stage: "friend",
    title: (name) => `${name}第一次承认，有个问题TA也不知道答案。`,
    body: () => ["问题不是生物学，而是继续竞赛究竟是不是值得。对方列完所有收益与代价，仍然无法从事实推出一个人生决定。", "擅长追问的人也会来到证据无法替人选择的地方。"],
    options: () => [
      { tone: "care", title: "陪TA接受暂时没有答案", result: "你没有补上一套价值观。问题仍然存在，却不再要求今晚必须解决。", effects: { san: 0.8, peerFavor: 1.1 } },
      { tone: "honest", title: "分享自己也无法证明的那部分直觉", result: "直觉没有被包装成真理。你们第一次在不确定里平等地坐着。", effects: { peerFavor: 1.1, mindset: 0.4 } },
      { tone: "hurt", title: "说想这么多只会内耗，继续学就行", result: "行动建议跳过了问题本身。对方点头，却没有再邀请你进入下一层思考。", effects: { peerFavor: -1 } },
    ],
  },
];

function innerConflictFor(candidate: RelationshipCandidate, seed: string) {
  if (candidate.innerConflictKey) return candidate.innerConflictKey;
  const conflicts: RelationshipInnerConflict[] = ["abandonment", "burden", "achievement", "distance", "caretaking", "family"];
  return conflicts[hashSeed(`${seed}-${candidate.rival.id}-personality-conflict`) % conflicts.length];
}

function conflictForeshadow(
  conflict: RelationshipInnerConflict,
  name: string,
  sceneKey: string,
) {
  const lines: Record<RelationshipInnerConflict, string[]> = {
    abandonment: [
      `${name}总会在关系可能改变以前先准备好退路，仿佛主动失去比等待失去更安全。`,
      `${name}问“以后”的方式总像在提前练习告别；越是在意，越先替离开准备解释。`,
      `${name}把每一次计划改变都听成关系将要结束的预告，却很少承认自己因此害怕。`,
    ],
    burden: [
      `${name}很少直接提出需要，似乎接受帮助就意味着欠下一笔迟早要偿还的债。`,
      `${name}习惯把求助改写成交换，仿佛只有立刻还清，才有资格被人照顾。`,
      `${name}总先计算自己的需要会占用你多少时间；那份计算有时比问题本身更累。`,
    ],
    achievement: [
      `${name}仍习惯用表现确认自己是否值得留下，哪怕此刻谈论的并不是成绩。`,
      `${name}很难相信失败以后仍会被同样对待，于是每次靠近都夹带着一次自我证明。`,
      `${name}把“被喜欢”和“表现得足够好”写在同一条等式里，而你们正慢慢看见这条等式的代价。`,
    ],
    distance: [
      `${name}需要一块只属于自己的空间；靠近得太急，关心也会被感受成控制。`,
      `${name}并不拒绝亲密，只需要确认沉默和独处不会被自动解释成冷淡。`,
      `${name}靠近时很认真，退开时也同样认真；真正重要的是你们能否讨论那段距离。`,
    ],
    caretaking: [
      `${name}擅长看见别人的疲惫，却很难承认自己也可能需要被接住。`,
      `${name}总在所有人开口以前递出帮助，却会在轮到自己时说“没什么”。`,
      `${name}把可靠当成了一种不能卸下的职责，连难过都要等别人离开以后再处理。`,
    ],
    family: [
      `${name}在涉及家长时总会先停顿一下，家门内的规则比学校里看见的更加复杂。`,
      `${name}能在赛场上直接表达判断，却会在手机亮起“家里”两个字时立刻改变语气。`,
      `${name}从不把家庭简单说成支持或反对；那里同时有爱、期待、控制和很难偿还的亏欠。`,
    ],
  };
  const variants = lines[conflict];
  return variants[hashSeed(`${name}-${sceneKey}-${conflict}`) % variants.length];
}

function chooseLead(ctx: RelationshipDailyContext) {
  return ctx.candidates
    .filter(({ rival }) => rival.scope === "school-peer" && !ctx.retiredRivalIds.includes(rival.id))
    .map((candidate) => ({ candidate, relation: normalizeRelationship(ctx.relationships[candidate.rival.id], ctx.seed, candidate.rival.id) }))
    .filter(({ relation }) => ["neutral", "crush", "dating", "friend"].includes(relation.route))
    .sort((a, b) => b.relation.bond + b.relation.trust * 0.6 + b.relation.romance - (a.relation.bond + a.relation.trust * 0.6 + a.relation.romance))[0];
}

export function nextPersonalityDailyEvent(ctx: RelationshipDailyContext): GameEvent | null {
  if (ctx.week < 9) return null;
  const lead = chooseLead(ctx);
  if (!lead) return null;
  const { candidate, relation } = lead;
  const stage = relation.route as Stage;
  const lastDailyWeek = ctx.storyTags
    .filter((tag) => tag.startsWith("关系日常:发生周:"))
    .map((tag) => Number(tag.split(":").at(-1)))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  if (lastDailyWeek !== undefined && ctx.week - lastDailyWeek < 2) return null;
  if (hashSeed(`${ctx.seed}-${ctx.week}-${candidate.rival.id}-personality-roll`) % 100 >= 64) return null;
  const eligible = templates.filter((template) =>
    template.personality === candidate.personalityKey &&
    template.stage === stage &&
    !ctx.resolvedEvents.includes(`bondstory-${candidate.rival.id}-personality-${template.key}`),
  );
  if (!eligible.length) return null;
  const picked = eligible[hashSeed(`${ctx.seed}-${ctx.week}-${candidate.rival.id}-personality-pick`) % eligible.length];
  const conflict = innerConflictFor(candidate, ctx.seed);
  const { name } = candidate.rival;
  return {
    id: `bondstory-${candidate.rival.id}-personality-${picked.key}`,
    phase: ctx.isTraining ? "training" : "weekly",
    label:
      stage === "crush" ? "性格专属 · 朦胧好感" :
        stage === "dating" ? "性格专属 · 恋爱日常" :
          stage === "friend" ? "性格专属 · 挚友日常" : "性格专属 · 人物共通线",
    title: picked.title(name),
    body: [...picked.body(name), conflictForeshadow(conflict, name, picked.key)],
    concealConsequences: true,
    visualNovel: true,
    trigger: { earliestWeek: ctx.week, latestWeek: ctx.week },
    choices: picked.options(name).map((option) => ({
      id: `rel-daily-${option.tone}-${candidate.personalityKey}-${conflict}-${candidate.rival.id}-personality-${picked.key}`,
      title: option.title,
      preview: "你无法提前知道，TA真正看重的是这句话的哪一部分。",
      result: option.result,
      effects: {
        ...option.effects,
        tags: [
          ...(option.effects.tags ?? []),
          `关系日常:专属:${candidate.personalityKey}:${picked.key}`,
          `关系日常:发生周:${ctx.week}`,
        ],
      },
    })),
  };
}

export const relationshipPersonalityDailyCount = templates.length;
export const relationshipPersonalityCounts = templates.reduce<Record<Personality, number>>(
  (counts, template) => ({ ...counts, [template.personality]: counts[template.personality] + 1 }),
  { reserved: 0, warm: 0, competitive: 0, playful: 0, curious: 0 },
);
