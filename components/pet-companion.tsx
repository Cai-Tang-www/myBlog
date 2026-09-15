"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { petConfig, type PetLine, type PetSpeech } from "@/lib/pet-config";
import styles from "./pet-companion.module.css";

// ─────────────────────────────────────────────────────────────
// 小宠物挂件
// 形象、音效、菜单、几何、调色板全部取自原插件
// MeteorNOX/DeepSeek-Balance-Whale-Widget（MIT），去掉纯后端依赖的部分。
//
//   · 拖拽（pointer 事件 + 指针捕获，位移平方 ≥ 9 才判定为拖动）
//   · 四分之一区域吸附：横、纵两轴独立判定，可自由组合到任意边/角
//   · 吸附左缘时整体水平镜像翻转，文字反向抵消保持可读
//   · 按压 Q 弹（scaleY .88 / scaleX 1.05，锚点 50% 100%）
//   · 音效：按下播 press，长按则松手才播 release，短按则衔接在 press 末尾
//   · 气泡：首次点击=时段卡 → 再点=随机台词（原厂 48 条）/动图 → 再点=关闭
//   · 菜单：大小（滑块 + 1~20 档号）、音效组、音量、气泡开关、隐藏菜单按钮
//   · 全部设置持久化到 localStorage
// ─────────────────────────────────────────────────────────────

const STORE_KEY = "pet-companion:v1";
/**
 * 落位规则版本号。改动默认位置时 +1，
 * 旧存档里的 h/v/fx/fy 会被忽略、改用新默认（缩放/音效等偏好仍然保留）。
 */
const POS_VERSION = 2;
/** 吸附后距视口边缘留白（px），0 = 完全贴边 */
const EDGE_MARGIN = 0;
/** 位移平方 < 9（即 <3px）算点击，否则算拖动 */
const CLICK_SQ = 9;
/** 基准边长收敛区间与原插件一致 */
const BASE_MIN = 122;
const BASE_MAX = 625;
/** 原插件字号档默认值（random 模块的 size） */
const DEFAULT_FONT_LEVEL = 8;
/** 北京时间相对 UTC 的偏移 */
const BJ_OFFSET_MS = 8 * 3600 * 1000;
/** 长按判定（毫秒）；超过则松手时立刻播 release，短按则延后衔接 */
const LONG_PRESS_MS = 250;
/** 右键 / 长按唤出菜单的长按时长 */
const MENU_LONG_PRESS_MS = 500;

/** 站点可能部署在子路径下，资源统一走 NEXT_PUBLIC_BASE_PATH */
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
const asset = (p: string) => (p.startsWith("http") ? p : `${BASE_PATH}${p}`);

type H = "left" | "right" | null;
type V = "top" | "bottom" | null;

interface Pos {
  left: number;
  top: number;
  h: H;
  v: V;
}

interface Persisted {
  scale?: number;
  sound?: boolean;
  vol?: number;
  soundSet?: string;
  bubbleOn?: boolean;
  hideMenuBtn?: boolean;
  h?: H;
  v?: V;
  /** 未吸附轴的相对位置（0~1） */
  fx?: number;
  fy?: number;
  /** 落位规则版本，见 POS_VERSION */
  posVersion?: number;
}

type BubbleContent = { kind: "first" } | { kind: "line"; line: PetSpeech } | { kind: "gif" };

interface PeakState {
  peak: boolean;
  countdown: string;
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);

/**
 * 原插件字号档换算，逐字照搬：
 *   fontU(level) = round(40 + (level-1) * 200/49)   （level 收在 1~50，缺省 6）
 * 单位是 u，即 1u = 挂件基准边长 / 1026。
 */
function fontU(level?: number) {
  const n = Math.max(1, Math.min(50, Math.round(Number(level) || DEFAULT_FONT_LEVEL)));
  return Math.round(40 + ((n - 1) * 200) / 49);
}

/** 档号 1~20 ↔ 缩放 0.6~2.5（原插件菜单的线性映射） */
const numFromScale = (s: number) => Math.round((s - petConfig.scale.min) / 0.1) + 1;
const scaleFromNum = (n: number) =>
  clamp(petConfig.scale.min + (Math.round(n) - 1) * 0.1, petConfig.scale.min, petConfig.scale.max);

/** 基准边长：随视口收敛，再乘用户缩放（同原插件 --dshw-base 公式） */
function computeBase(scale: number) {
  if (typeof window === "undefined") return BASE_MIN;
  const raw = Math.min(250, Math.min(window.innerWidth, window.innerHeight) * 0.28) * scale;
  return Math.round(clamp(raw, BASE_MIN, BASE_MAX));
}

/** 四分之一区域吸附判定 + 视口钳制 */
function settle(p: Pos, base: number): Pos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxL = Math.max(0, vw - base);
  const maxT = Math.max(0, vh - base);
  const cx = p.left + base / 2;
  const cy = p.top + base / 2;

  const h: H = cx < vw * 0.25 ? "left" : cx > vw * 0.75 ? "right" : null;
  const v: V = cy < vh * 0.25 ? "top" : cy > vh * 0.75 ? "bottom" : null;

  const left =
    h === "left" ? EDGE_MARGIN : h === "right" ? vw - base - EDGE_MARGIN : clamp(p.left, 0, maxL);
  const top =
    v === "top" ? EDGE_MARGIN : v === "bottom" ? vh - base - EDGE_MARGIN : clamp(p.top, 0, maxT);

  return { left, top, h, v };
}

// ── 峰谷时段：原插件用纯本地时钟判定，与后端无关，所以原样保留 ──
// 规则：工作日 9:00–12:00 与 14:00–18:00 为高峰，周末全天谷价（北京时间）。

/** 转成「读数即北京时间墙上时间」的 Date */
function toBeijingWall(now: Date) {
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + BJ_OFFSET_MS);
}

function isPeakWall(bj: Date) {
  const day = bj.getDay();
  if (day === 0 || day === 6) return false;
  const h = bj.getHours();
  return (h >= 9 && h < 12) || (h >= 14 && h < 18);
}

/** 下一分钟起的首个峰谷翻转点（同样以北京墙上时间表示） */
function nextSwitchWall(bj: Date) {
  const cur = isPeakWall(bj);
  const p = new Date(bj.getTime());
  p.setMilliseconds(0);
  p.setSeconds(0);
  p.setMinutes(p.getMinutes() + 1);
  for (let i = 0; i < 60 * 24 * 8; i++) {
    if (isPeakWall(p) !== cur) return p;
    p.setMinutes(p.getMinutes() + 1);
  }
  return null;
}

function readStore(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

function writeStore(patch: Persisted) {
  try {
    const merged = { ...(readStore() ?? {}), ...patch, posVersion: POS_VERSION };
    window.localStorage.setItem(STORE_KEY, JSON.stringify(merged));
  } catch {
    /* 隐私模式等场景静默降级 */
  }
}

export function PetCompanion() {
  const [base, setBase] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [scale, setScale] = useState(petConfig.scale.default);
  const [sound, setSound] = useState(petConfig.sound.enabled);
  const [vol, setVol] = useState(petConfig.sound.volume);
  const [soundSet, setSoundSet] = useState(petConfig.sound.set);
  const [bubbleOn, setBubbleOn] = useState(true);
  const [hideMenuBtn, setHideMenuBtn] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /** 缩放过程中禁掉根元素的 left/top 过渡，否则尺寸突变 + 位置滑动 = 抖动 */
  const [noTransition, setNoTransition] = useState(false);
  /** 设置面板用 fixed 坐标，打开时算一次，之后不随方框尺寸变化而移动 */
  const [menuCoords, setMenuCoords] = useState<{ left: number; top: number } | null>(null);
  /** 每次需要让菜单重新贴边时 +1（打开菜单 / 拖完挂件） */
  const [anchorSeq, setAnchorSeq] = useState(0);
  const [bubble, setBubble] = useState<{ content: BubbleContent; seq: number } | null>(null);

  const baseRef = useRef(0);
  const posRef = useRef<Pos | null>(null);
  const scaleRef = useRef(petConfig.scale.default);
  const freeRatio = useRef({ x: 1, y: 1 });
  const lastLineRef = useRef<PetSpeech | null>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
    id: number;
    pressAt: number;
    longPressFired: boolean;
  } | null>(null);
  const hideTimer = useRef<number | null>(null);
  const seqRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const noTransTimer = useRef<number | null>(null);

  /** 缩放/尺寸变更期间短暂禁用过渡（原插件「滑块抖动」的解法） */
  const suppressTransition = useCallback(() => {
    setNoTransition(true);
    if (noTransTimer.current !== null) window.clearTimeout(noTransTimer.current);
    noTransTimer.current = window.setTimeout(() => setNoTransition(false), 240);
  }, []);

  useEffect(
    () => () => {
      if (noTransTimer.current !== null) window.clearTimeout(noTransTimer.current);
    },
    []
  );

  // ── 音效：用原插件的两套 mp3，按下播 press、松手播 release ──
  // override 专门给「刚改完设置的那一次播放」用：此刻 state 还没提交，
  // 闭包里读到的是旧值（例如刚勾上音效开关时 sound 还是 false，会静音）。
  const playSfx = useCallback(
    (kind: "press" | "release", override?: { set?: string; force?: boolean }) => {
      const on = override?.force ? true : sound;
      const setId = override?.set ?? soundSet;
      if (!on || vol <= 0) return;
      const set = petConfig.sound.sets.find((x) => x.id === setId) ?? petConfig.sound.sets[0];
      if (!set) return;
      try {
        const a = new Audio(asset(kind === "press" ? set.press : set.release));
        a.volume = clamp(vol, 0, 1);
        void a.play().catch(() => {
          /* 浏览器自动播放策略拦截时忽略 */
        });
      } catch {
        /* noop */
      }
    },
    [sound, vol, soundSet]
  );

  // ── 提交位置：同步 ref + state，并记录未吸附轴的比例 ──
  const commit = useCallback((next: Pos, b: number) => {
    const maxL = Math.max(0, window.innerWidth - b);
    const maxT = Math.max(0, window.innerHeight - b);
    if (next.h === null) freeRatio.current.x = maxL > 0 ? next.left / maxL : 0;
    if (next.v === null) freeRatio.current.y = maxT > 0 ? next.top / maxT : 1;
    posRef.current = next;
    setPos(next);
  }, []);

  /** 尺寸变化后按锚点重算落位 */
  const relayout = useCallback(
    (b: number) => {
      const cur = posRef.current;
      if (!cur) return;
      const maxL = Math.max(0, window.innerWidth - b);
      const maxT = Math.max(0, window.innerHeight - b);
      commit(
        {
          left:
            cur.h === "left" ? EDGE_MARGIN : cur.h === "right" ? maxL : freeRatio.current.x * maxL,
          top: cur.v === "top" ? EDGE_MARGIN : cur.v === "bottom" ? maxT : freeRatio.current.y * maxT,
          h: cur.h,
          v: cur.v,
        },
        b
      );
    },
    [commit]
  );

  /** 把设置面板放到挂件方框外侧（默认在按钮上方，贴顶时改到下方），并钳制在视口内 */
  const placeMenu = useCallback(() => {
    const el = rootRef.current;
    const menu = menuRef.current;
    if (!el || !menu) return;
    const r = el.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const gap = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const snap = posRef.current;
    const left = snap?.h === "left" ? r.left : r.right - mw;
    const top = snap?.v === "top" ? r.bottom + gap : r.top - gap - mh;
    setMenuCoords({
      left: clamp(left, 8, Math.max(8, vw - mw - 8)),
      top: clamp(top, 8, Math.max(8, vh - mh - 8)),
    });
  }, []);

  /**
   * 定位时机：打开菜单、或把挂件拖到新位置之后。
   * 用 layout effect 保证在绘制前算好，避免闪一下默认位置。
   * 注意**不**在改大小时重算 —— 那正是「拖滑块菜单跟着跑」的根因。
   */
  useLayoutEffect(() => {
    if (menuOpen) placeMenu();
  }, [menuOpen, anchorSeq, placeMenu]);

  /** 窗口尺寸变化时重新贴边（拖动滑块改挂件大小时**不**重算，菜单要保持不动） */
  useEffect(() => {
    if (!menuOpen) return;
    const onWin = () => placeMenu();
    window.addEventListener("resize", onWin);
    window.addEventListener("orientationchange", onWin);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("orientationchange", onWin);
    };
  }, [menuOpen, placeMenu]);

  // ── 初始化：读存档 → 计算尺寸 → 落位 ──
  // 这个 effect 必须在挂载后 setState：视口尺寸和 localStorage 都只有挂载后才拿得到。
  // 若改成 useState 初始值里读，SSR 与客户端首帧会不一致（hydration mismatch）。
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = readStore();
    const sc = clamp(
      saved?.scale ?? petConfig.scale.default,
      petConfig.scale.min,
      petConfig.scale.max
    );
    scaleRef.current = sc;
    setScale(sc);
    if (typeof saved?.sound === "boolean") setSound(saved.sound);
    if (typeof saved?.vol === "number") setVol(clamp(saved.vol, 0, 1));
    if (typeof saved?.soundSet === "string") setSoundSet(saved.soundSet);
    if (typeof saved?.bubbleOn === "boolean") setBubbleOn(saved.bubbleOn);
    if (typeof saved?.hideMenuBtn === "boolean") setHideMenuBtn(saved.hideMenuBtn);

    const b = computeBase(sc);
    baseRef.current = b;
    setBase(b);

    const maxL = Math.max(0, window.innerWidth - b);
    const maxT = Math.max(0, window.innerHeight - b);
    // 默认落位与原插件一致：右下角。
    // 旧版本存的位置（posVersion 不匹配）一律作废，否则改了默认值老用户看不到效果。
    const posOk = saved?.posVersion === POS_VERSION;
    const h: H = posOk ? (saved?.h ?? "right") : "right";
    const v: V = posOk ? (saved?.v ?? "bottom") : "bottom";
    const fx = posOk ? (saved?.fx ?? 1) : 1;
    const fy = posOk ? (saved?.fy ?? 1) : 1;
    freeRatio.current = { x: fx, y: fy };

    commit(
      {
        left: h === "left" ? EDGE_MARGIN : h === "right" ? maxL : fx * maxL,
        top: v === "top" ? EDGE_MARGIN : v === "bottom" ? maxT : fy * maxT,
        h,
        v,
      },
      b
    );
    writeStore({ h, v, fx, fy });
  }, [commit]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── 视口变化 ──
  useEffect(() => {
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // 移动端地址栏收放会改变 innerHeight，但那不是真正的视口变化。
      // 不拦住的话，页面一滚动挂件就跟着上下抖。
      const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
      if (coarse && Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 150) return;
      lastW = w;
      lastH = h;
      const b = computeBase(scaleRef.current);
      baseRef.current = b;
      setBase(b);
      relayout(b);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [relayout]);

  // ── 气泡计时器 ──
  const clearHide = useCallback(() => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const startHide = useCallback(() => {
    clearHide();
    const ms = petConfig.bubble.autoHideMs;
    if (ms > 0) hideTimer.current = window.setTimeout(() => setBubble(null), ms);
  }, [clearHide]);

  useEffect(() => clearHide, [clearHide]);

  /**
   * 抽一次要显示的内容。
   * 原插件的结构是 choice( w:10 → 台词模块, w:1 → 动图 )，
   * 所以先按**分支权重**决定走台词还是动图，再在台词池内按各条权重抽；
   * gifWeight 不能混进台词条目的 w 里（那样动图概率会掉到 0.6%）。
   */
  const pickRandom = useCallback((): BubbleContent => {
    const { lines, gifSrc, gifWeight, linesWeight } = petConfig.bubble;
    const gifW = gifSrc ? Math.max(0, gifWeight) : 0;
    const linesW = Math.max(0, linesWeight);
    if (gifW > 0 && Math.random() * (linesW + gifW) >= linesW) return { kind: "gif" };

    // 台词池内抽，跳过上一句避免连续重复
    const pool = lines.filter((l) => l !== lastLineRef.current);
    const list = pool.length ? pool : lines;
    // 配置里把 lines 清空时兜底：否则下面会取到 undefined，渲染时读 line.size 直接崩
    if (!list.length) return gifW > 0 ? { kind: "gif" } : { kind: "first" };
    const total = list.reduce((sum, l) => sum + Math.max(0, l.w), 0);
    let r = Math.random() * total;
    for (const l of list) {
      r -= Math.max(0, l.w);
      if (r <= 0) {
        lastLineRef.current = l;
        return { kind: "line", line: l };
      }
    }
    const fallback = list[list.length - 1];
    lastLineRef.current = fallback;
    return { kind: "line", line: fallback };
  }, []);

  const openBubble = useCallback(() => {
    if (!bubbleOn) return;
    seqRef.current += 1;
    const initial: BubbleContent = petConfig.bubble.first.enabled
      ? { kind: "first" }
      : pickRandom();
    setBubble({ content: initial, seq: seqRef.current });
    startHide();
  }, [bubbleOn, pickRandom, startHide]);

  const closeBubble = useCallback(() => {
    clearHide();
    setBubble(null);
  }, [clearHide]);

  /** 点气泡：时段卡 → 随机台词 → 关闭（切换不重置总时长） */
  const advanceBubble = useCallback(() => {
    setBubble((cur) => {
      if (!cur) return cur;
      if (cur.content.kind === "first") {
        seqRef.current += 1;
        return { content: pickRandom(), seq: seqRef.current };
      }
      clearHide();
      return null;
    });
  }, [clearHide, pickRandom]);

  const toggleBubble = useCallback(() => {
    if (bubble) closeBubble();
    else openBubble();
  }, [bubble, closeBubble, openBubble]);

  // ── 拖拽 / 点击 / 长按 ──
  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    const cur = posRef.current;
    if (!cur) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 某些环境不支持指针捕获，忽略即可 */
    }
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: cur.left,
      top: cur.top,
      moved: false,
      id: e.pointerId,
      pressAt: Date.now(),
      longPressFired: false,
    };
    setPressed(true);
    playSfx("press");

    // 长按唤出菜单（原插件「隐藏菜单按钮」的配套交互）
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      const d = dragRef.current;
      if (!d || d.moved) return;
      d.longPressFired = true;
      setMenuOpen(true);
    }, MENU_LONG_PRESS_MS);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && dx * dx + dy * dy >= CLICK_SQ) {
      d.moved = true;
      clearLongPress();
      setDragging(true);
    }
    if (!d.moved) return;
    const b = baseRef.current;
    const maxL = Math.max(0, window.innerWidth - b);
    const maxT = Math.max(0, window.innerHeight - b);
    commit(
      {
        left: clamp(d.left + dx, 0, maxL),
        top: clamp(d.top + dy, 0, maxT),
        h: null,
        v: null,
      },
      b
    );
  };

  const finishPointer = (e: ReactPointerEvent<HTMLElement>, allowClick: boolean) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const { moved, pressAt, longPressFired } = d;
    dragRef.current = null;
    clearLongPress();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    setDragging(false);
    setPressed(false);

    // 原插件音效规则：长按 → 松手时立刻播 release；短按 → 衔接在 press 末尾
    if (!longPressFired && sound) {
      const held = Date.now() - pressAt;
      if (held >= LONG_PRESS_MS) playSfx("release");
      else window.setTimeout(() => playSfx("release"), 120);
    }

    const b = baseRef.current;
    const cur = posRef.current ?? { left: 0, top: 0, h: null, v: null };
    const settled = settle(cur, b);
    commit(settled, b);
    writeStore({ h: settled.h, v: settled.v, fx: freeRatio.current.x, fy: freeRatio.current.y });
    if (moved) setAnchorSeq((s) => s + 1); // 让菜单在新位置重新贴边

    if (!moved && allowClick && !longPressFired) toggleBubble();
  };

  // ── 右键唤出菜单（原插件的隐藏按钮交互） ──
  const onContextMenu = (e: ReactMouseEvent<HTMLElement>) => {
    if (!hideMenuBtn) return;
    e.preventDefault();
    setMenuOpen((v) => !v);
  };

  // ── 设置面板：点击面板外收起 ──
  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [menuOpen]);

  const applyScale = (next: number) => {
    // 尺寸突变 + 位置重算同时发生，必须先把过渡关掉，否则根元素会「滑」过去形成拖影
    suppressTransition();
    const sc = clamp(next, petConfig.scale.min, petConfig.scale.max);
    scaleRef.current = sc;
    setScale(sc);
    writeStore({ scale: sc });
    const b = computeBase(sc);
    baseRef.current = b;
    setBase(b);
    relayout(b);
  };

  const toggleSound = (on: boolean) => {
    setSound(on);
    writeStore({ sound: on });
    if (on) playSfx("press", { force: true });
  };

  const applyVol = (v: number) => {
    const nv = clamp(v, 0, 1);
    setVol(nv);
    writeStore({ vol: nv });
    // 音量拖到 0 → 自动关掉声音（原插件行为）
    if (nv <= 0 && sound) toggleSound(false);
  };

  const applySoundSet = (id: string) => {
    setSoundSet(id);
    writeStore({ soundSet: id });
    playSfx("press", { set: id });
  };

  const toggleBubbleOn = (on: boolean) => {
    setBubbleOn(on);
    writeStore({ bubbleOn: on });
    if (!on) closeBubble();
  };

  const toggleHideMenuBtn = (on: boolean) => {
    setHideMenuBtn(on);
    writeStore({ hideMenuBtn: on });
  };

  const resetPos = () => {
    const b = baseRef.current;
    freeRatio.current = { x: 1, y: 1 };
    const settled = settle({ left: window.innerWidth - b, top: window.innerHeight - b, h: "right", v: "bottom" }, b);
    commit(settled, b);
    writeStore({ h: "right", v: "bottom", fx: 1, fy: 1 });
    setMenuOpen(false);
  };

  // ── 时段状态：气泡打开时算一次 ──
  const peakState = useMemo<PeakState>(() => {
    const { peakText, offText } = petConfig.bubble.first;
    if (!bubble) return { peak: false, countdown: "" };
    const wall = toBeijingWall(new Date());
    const peak = isPeakWall(wall);
    const next = nextSwitchWall(wall);
    let countdown = "";
    if (next) {
      const mins = Math.max(1, Math.round((next.getTime() - wall.getTime()) / 60000));
      const h = Math.floor(mins / 60);
      countdown = h > 0 ? `${h} 小时 ${mins % 60} 分后切换` : `${mins} 分钟后切换`;
    }
    return { peak, countdown: countdown || (peak ? peakText : offText) };
  }, [bubble]);

  const flipped = pos?.h === "left";
  const ready = base > 0 && pos !== null;

  const rootStyle = useMemo(
    () =>
      ({
        left: `${pos?.left ?? -9999}px`,
        top: `${pos?.top ?? -9999}px`,
        "--pet-base": `${base}px`,
      }) as CSSProperties,
    [pos, base]
  );

  const rootClass = [
    styles.root,
    ready ? "" : styles.hidden,
    dragging ? styles.dragging : "",
    noTransition ? styles.noTransition : "",
  ]
    .filter(Boolean)
    .join(" ");

  const bubbleClass = [styles.bubble, bubble ? styles.bubbleOpen : ""].filter(Boolean).join(" ");

  const menuClass = [styles.menu, menuOpen ? styles.menuOpen : ""].filter(Boolean).join(" ");

  const menuStyle: CSSProperties = {
    left: `${menuCoords?.left ?? -9999}px`,
    top: `${menuCoords?.top ?? -9999}px`,
    transformOrigin: `${pos?.v === "top" ? "top" : "bottom"} ${pos?.h === "left" ? "left" : "right"}`,
  };

  const menuBtnClass = [
    styles.menuBtn,
    menuOpen || hideMenuBtn ? styles.menuBtnVisible : "",
    hideMenuBtn ? styles.menuBtnHidden : "",
  ]
    .filter(Boolean)
    .join(" ");

  /** 按原插件规则渲染一行：字号档、加粗 700、渐变、单色、时段取色 */
  const renderLine = (line: PetLine, key: string) => {
    const { peakColor, offColor, peakText, offText } = petConfig.bubble.first;
    const rowStyle: CSSProperties = {
      fontSize: `calc(var(--pet-u) * ${fontU(line.size)})`,
      fontWeight: line.bold ? 700 : 400,
    };
    const txStyle: CSSProperties = {};
    if (line.statusBadge) {
      txStyle.background = peakState.peak ? peakColor : offColor;
    } else if (line.statusColor) {
      txStyle.color = peakState.peak ? peakColor : offColor;
    } else if (line.color && !line.gradient) {
      txStyle.color = line.color;
    }

    const text = line.text
      .split("{status}")
      .join(peakState.peak ? peakText : offText)
      .split("{countdown}")
      .join(peakState.countdown);

    return (
      <div key={key} className={styles.line} style={rowStyle}>
        <span
          className={[
            styles.tx,
            line.italic ? styles.italic : "",
            line.underline ? styles.underline : "",
            line.statusBadge ? styles.badge : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-grad={line.gradient || undefined}
          style={txStyle}
        >
          {text}
        </span>
      </div>
    );
  };

  const content = bubble?.content;
  const textInnerKey = bubble?.seq ?? 0;
  const num = numFromScale(scale);

  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={rootStyle}
      data-pagefind-ignore
      aria-live="off"
      onContextMenu={onContextMenu}
    >
      <div className={[styles.doll, flipped ? styles.flipped : ""].filter(Boolean).join(" ")}>
        <div
          className={[styles.squish, pressed ? styles.squished : ""].filter(Boolean).join(" ")}
        >
          {/* 鲸鱼本体：承载拖拽、点击、长按 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.pet}
            src={asset(petConfig.imageSrc)}
            alt={petConfig.alt}
            draggable={false}
            role="button"
            tabIndex={0}
            aria-label={petConfig.alt}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => finishPointer(e, true)}
            onPointerCancel={(e) => finishPointer(e, false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleBubble();
              }
            }}
          />

          {/* 气泡：空白处不挡点击，只有画出来的形状可交互 */}
          <div className={bubbleClass} onClick={bubble ? advanceBubble : undefined}>
            <svg
              className={styles.bubbleSvg}
              viewBox="0 0 1026 700"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <ellipse
                className={styles.shape2}
                cx="442"
                cy="646"
                rx="24.5"
                ry="18"
                fill="#ffffff"
                stroke="#203170"
                strokeWidth="18"
                strokeLinejoin="round"
              />
              <ellipse
                className={styles.shape1}
                cx="352"
                cy="561"
                rx="37.5"
                ry="26"
                fill="#ffffff"
                stroke="#203170"
                strokeWidth="18"
                strokeLinejoin="round"
              />
              <ellipse
                className={styles.shape}
                cx="454"
                cy="247"
                rx="373"
                ry="232"
                fill="#ffffff"
                stroke="#203170"
                strokeWidth="18"
                strokeLinejoin="round"
              />
            </svg>

            <div className={styles.text}>
              {content ? (
                <div className={styles.textInner} key={textInnerKey}>
                  {content.kind === "first"
                    ? petConfig.bubble.first.lines.map((line, i) => renderLine(line, `f${i}`))
                    : null}
                  {content.kind === "line" ? renderLine(content.line, `l${textInnerKey}`) : null}
                  {content.kind === "gif" && petConfig.bubble.gifSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={styles.gif}
                      src={asset(petConfig.bubble.gifSrc)}
                      alt=""
                      draggable={false}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={menuBtnClass}
        aria-label="宠物设置"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        ref={menuRef}
        className={menuClass}
        style={menuStyle}
        role="group"
        aria-label="宠物设置面板"
      >
        <label className={styles.menuRow}>
          <span className={styles.menuLabel}>大小</span>
          <input
            className={styles.range}
            type="range"
            min={petConfig.scale.min}
            max={petConfig.scale.max}
            step={petConfig.scale.step}
            value={scale}
            onChange={(e) => applyScale(Number(e.target.value))}
          />
          <input
            className={styles.number}
            type="number"
            min={1}
            max={20}
            step={1}
            value={num}
            onChange={(e) => applyScale(scaleFromNum(Number(e.target.value)))}
          />
        </label>

        <label className={styles.menuRow}>
          <span className={styles.menuLabel}>音效</span>
          <select
            className={styles.select}
            value={soundSet}
            disabled={!sound}
            onChange={(e) => applySoundSet(e.target.value)}
          >
            {petConfig.sound.sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.menuRow}>
          <span className={styles.menuLabel}>音量</span>
          <input
            className={styles.range}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => applyVol(Number(e.target.value))}
          />
          <span className={styles.volPct}>{Math.round(vol * 100)}%</span>
        </label>

        <label className={styles.menuRow}>
          <span className={styles.menuLabel}>音效开关</span>
          <input
            className={styles.check}
            type="checkbox"
            checked={sound}
            onChange={(e) => toggleSound(e.target.checked)}
          />
        </label>

        <div className={styles.sep} />

        <label className={styles.menuRow}>
          <span className={styles.menuLabel}>气泡全局开关</span>
          <input
            className={styles.check}
            type="checkbox"
            checked={bubbleOn}
            onChange={(e) => toggleBubbleOn(e.target.checked)}
          />
        </label>

        <label className={styles.menuRow}>
          <span className={styles.menuLabel}>隐藏菜单按钮</span>
          <input
            className={styles.check}
            type="checkbox"
            checked={hideMenuBtn}
            onChange={(e) => toggleHideMenuBtn(e.target.checked)}
          />
        </label>

        <div className={styles.sep} />

        <div className={styles.menuRow}>
          <button type="button" className={styles.solidBtn} onClick={resetPos}>
            复位到右下角
          </button>
        </div>
      </div>
    </div>
  );
}
