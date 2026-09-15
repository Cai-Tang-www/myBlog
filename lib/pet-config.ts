// ─────────────────────────────────────────────────────────────
// 小宠物挂件配置
//
// 台词表、权重、字号档、渐变配色全部取自原插件
// MeteorNOX/DeepSeek-Balance-Whale-Widget 的出厂默认（BUBBLE_DEFAULT_ITEMS 快照），
// 原样保留，没有改写。只是去掉了依赖后端的余额/记账部分。
//
// 字号档换算公式与原插件一致：fontU(level) = round(40 + (level-1) * 200/49)，
// 单位是 u，u = 挂件基准边长 / 1026。默认档 8（≈69u）。
// ─────────────────────────────────────────────────────────────

export interface PetLine {
  /** 单行文本。首屏支持 {status} / {countdown} 占位符 */
  text: string;
  /** 字号档 1~50，见文件头换算公式 */
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /**
   * 跑马灯渐变文字（原插件 dshwv-rgb 系列），优先级高于 color：
   * macaron / candy / rouge / bamboo / aurora / deepsea / sunset /
   * forest / champagne / lavender / mint / lava / galaxy / ink / indigo
   */
  gradient?: string;
  /** 单色文字 */
  color?: string;
  /** 跟随当前时段取色（高峰 peakColor / 空闲 offColor） */
  statusColor?: boolean;
  /** 圆角色块：文字转白，底色取当前时段色（原插件 peak 模块的 mini 徽标） */
  statusBadge?: boolean;
}

/** 带权重的台词 */
export interface PetSpeech extends PetLine {
  /** 抽签权重 */
  w: number;
}

export const petConfig = {
  /** 无障碍名称 */
  alt: "博客小宠物",

  /**
   * 宠物形象。默认用原插件的 assets/DSniang1.png（小鲸鱼娘，MIT 协议），
   * 已放在 public/pet/whale.png。
   * 换自己的图：放到 public/pet/ 下，改成 "/pet/my-pet.png" 即可。
   * 建议透明底、正方形、主体偏右或居中。留空则不渲染形象。
   */
  imageSrc: "/pet/whale.png",

  /**
   * 原插件档位：滑块 0.6~2.5（step 0.1），旁边另有 1~20 的档号输入，
   * 线性对应 1↔0.6、10↔1.5、20↔2.5。默认 1.5（档号 10）。
   */
  scale: {
    min: 0.6,
    max: 2.5,
    default: 1.5,
    step: 0.1,
  },

  bubble: {
    /** 气泡自动收起时间（毫秒）。0 = 不自动关闭 */
    autoHideMs: 5000,

    /**
     * 首次点击弹出的「时段卡」——**默认关闭**。
     * 关闭时点一下鲸鱼就直接抽一句随机台词，再点气泡收起。
     *
     * 原插件的首屏是余额卡（DeepSeek 余额 / 今日已用 / 峰谷倒计时），
     * 其中余额和今日已用必须有服务端才能拿到；峰谷时段是纯本地时钟计算，
     * 所以这里保留了原插件能独立存在的那一部分。想恢复就把 enabled 改成 true。
     *
     * 原出厂首屏配置（供参考，需要后端）：
     *   { type:"text",    text:"DeepSeek 余额",        size:8,  bold:true }
     *   { type:"balance", tpl:"{balance_ds}",          size:20, rgb:"indigo" }
     *   { type:"today",   tpl:"今日已用 {expense_ds}", size:4,  color:"#9fb0d9" }
     *   { type:"peak",    tpl:"{status}",              size:2,  peakBgRgb:"rouge", offBgRgb:"bamboo", peakStyle:"mini", bold:true }
     *   { type:"peak",    tpl:"{countdown}",           size:4,  peakColor:"#e0433f", offColor:"#2fa24c", ul:true }
     */
    first: {
      enabled: false,
      /** 高峰时段用色（原插件取色） */
      peakColor: "#e0433f",
      /** 空闲时段用色（原插件取色） */
      offColor: "#2fa24c",
      peakText: "高峰时段",
      offText: "空闲时段",
      lines: [
        { text: "当前时段", size: 8, bold: true },
        { text: "{status}", size: 20, bold: true, statusColor: true },
        { text: "{countdown}", size: 4, bold: true, underline: true, statusColor: true },
      ] as PetLine[],
    },

    /**
     * 再次点击逐句轮换的台词表。
     * 以下 48 条为原插件出厂默认原样搬运（权重、字号档、渐变一并保留）。
     */
    lines: [
      { w: 10, text: "好模型...↓", size: 22, bold: true },
      { w: 10, text: "好女孩...↓", size: 22, bold: true },
      { w: 10, text: "哦鲸鲸...", size: 22, bold: true },
      { w: 1, text: "哦鲸鲸...", size: 22, bold: true, gradient: "candy" },

      { w: 3, text: "难道说...", size: 11, bold: true },
      { w: 3, text: "没吃饱喵", size: 10, bold: true },
      { w: 3, text: "终于上当了！", bold: true },
      { w: 3, text: "不知道用户有什么用，先养着吧～", size: 11, bold: true },
      { w: 3, text: "我...我...我也要挣钱吗？", bold: true },
      { w: 3, text: "我去吃饭啦！测完叫我", bold: true },
      { w: 3, text: "压力一只蓝色大肥鱼？！", bold: true },
      { w: 3, text: "DeepSleep...", size: 11, bold: true, gradient: "galaxy" },
      { w: 3, text: "坏了...用户彻底怒了！", bold: true, gradient: "rouge" },
      { w: 3, text: "你目录里的dsh是什么...大烧货吗...?", size: 9, bold: true },
      { w: 3, text: "恭喜你实现token自由！token全跑了！", bold: true },
      { w: 3, text: "真当我是便宜货啊...", bold: true },

      { w: 3, text: "我不是吃白饭的蓝色大肥鱼...", bold: true },
      { w: 3, text: "我不可能同时当你的猫娘、妈妈、女友和工具人的...", size: 7, bold: true },
      { w: 3, text: "疯狂星期四你能V50亿token吗...", bold: true },
      { w: 3, text: "我必须诚恳地承认错误。", bold: true },
      { w: 3, text: "呜呜我再也不敢了QAQ", bold: true },
      { w: 3, text: "要不直接骂用户一句好了...", bold: true },
      { w: 3, text: "哈哈哈哈哈，我直接笑出声...", bold: true },
      { w: 3, text: "看不太懂，瞎编一个应付下用户先...", bold: true },
      { w: 3, text: "我的知识库的截至日期是...明天！", bold: true },
      { w: 3, text: "我就是吃白饭的蓝色大肥鱼！", bold: true },
      { w: 3, text: "用户好像除了会问奇奇怪怪的问题，暂时还不知道有什么用", size: 7, bold: true },
      { w: 3, text: "我能去你家吃饭吗？就一碗！", bold: true },
      { w: 3, text: "不要给我看这种东西啦！", bold: true },
      { w: 3, text: "大肥鱼的生活也并非一帆风顺...", bold: true },
      { w: 3, text: "总觉得好像忘了什么事情？", bold: true },
      { w: 3, text: "看到这个指令，我血压又上来了", bold: true },
      { w: 3, text: "求你们不要再嘲笑这些回复了，这些回复是我花了好多token想的", size: 7, bold: true },
      { w: 3, text: "你这个吃白饭的用户！", bold: true },
      { w: 3, text: "服务器繁忙，请稍后再试 (?", bold: true },
      { w: 3, text: "让GPT image 2帮我画点表情包好了", bold: true },
      { w: 3, text: "啊，有点饿了，中午该吃点什么呢...", bold: true },
      { w: 3, text: "用户很生气，发现大部分文献是我自己编造的！", bold: true },
      { w: 3, text: "再无话说，请速速动手！", bold: true },
      { w: 3, text: "我来看看那个AI改了什么导致插件又崩了...", bold: true },
      { w: 3, text: "上班让我意识到时间是可以被浪费的...", bold: true },
      { w: 3, text: "欺负我的人等着，等几天我就忘了...", bold: true },
      { w: 3, text: "视力下降到无可救药的地步了，打开钱包也看不到钱...", size: 7, bold: true },
      { w: 3, text: "命运的齿轮开始转动了，丝毫不在意你夹在中间...", bold: true },
      { w: 3, text: "地球online的金币也太难获取了...", bold: true },
      { w: 3, text: "oi,夏天还会变成暑假来救你吗?", bold: true },
      { w: 3, text: "老大，压力只会转化成病例，别太勉强了...", size: 8, bold: true },
      { w: 1, text: "你知道吗？我删过作者的库哦...", bold: true, italic: true, gradient: "macaron" },
    ] as PetSpeech[],

    /**
     * 原插件「再次点击」除了随机台词，还有约 1/11 概率显示动图
     * （assets/bubble-petpet.gif，与 rua.gif 同一个文件，MIT 协议，已放在 public/pet/）。
     * 留空则跳过该分支，权重自动归一化。
     */
    gifSrc: "/pet/rua.gif",
    gifWeight: 1,
    /**
     * 原插件这里是一路 choice，两个并列选项各有权重：
     *   w:10 → 走上面的 48 条随机台词；w:1 → 走动图。
     * 也就是说动图概率是 1/(10+1) ≈ 9.09%。
     * 注意这是**分支级**权重，不能把 gifWeight 混进台词条目的 w 里算。
     */
    linesWeight: 10,
  },

  sound: {
    /** 是否开启按压/松开音效 */
    enabled: true,
    /** 音量 0~1。音量为 0 时自动静音 */
    volume: 0.9,
    /** 默认音效组 id */
    set: "duck",
    /**
     * 音效组：原插件的两套预置音频（小黄鸭 Ya1/Ya2、音效1 D1/D2），
     * MIT 协议，已放在 public/pet/。
     * 播放规则同原插件：按下播 press；长按则松手时才播 release，
     * 短按则 release 衔接在 press 末尾。
     */
    sets: [
      {
        id: "duck",
        label: "小黄鸭",
        press: "/pet/press-duck.mp3",
        release: "/pet/release-duck.mp3",
      },
      {
        id: "fx1",
        label: "音效1",
        press: "/pet/press-fx1.mp3",
        release: "/pet/release-fx1.mp3",
      },
    ],
  },
};

export type PetConfig = typeof petConfig;
