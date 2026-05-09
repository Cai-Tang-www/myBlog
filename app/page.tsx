import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { ProfileActions } from "@/components/profile-actions";
import { getAllPosts, getFeaturedPosts, type PostSummary } from "@/lib/posts";
import styles from "./page.module.css";

type CategoryKey = "agent" | "engineering" | "architecture";

interface CategorySection {
  id: CategoryKey;
  phase: string;
  title: string;
  note: string;
  posts: PostSummary[];
}

const categoryOrder: CategoryKey[] = ["agent", "engineering", "architecture"];

const manualCategoryBySlug: Record<string, CategoryKey> = {
  "hooks-lifecycle-control-layer": "agent",
  "subagent-from-dag-to-inline": "agent",
  "skills-agent-brain": "agent",
  "human-in-the-loop-neocode": "engineering",
};

const heroMainTypingSvgUrl = `https://readme-typing-svg.demolab.com/?${new URLSearchParams(
  {
    font: "Noto Sans SC",
    weight: "900",
    size: "72",
    duration: "1200",
    pause: "2800",
    color: "16233F",
    vCenter: "false",
    repeat: "true",
    width: "1200",
    height: "94",
    lines: "从想法到交付",
  }
).toString()}`;

const heroSubTypingSvgUrl = `https://readme-typing-svg.demolab.com/?${new URLSearchParams(
  {
    font: "Noto Sans SC",
    weight: "820",
    size: "48",
    duration: "1100",
    pause: "2600",
    color: "4F6EF6",
    vCenter: "false",
    repeat: "true",
    width: "1200",
    height: "72",
    lines: "先回答要解决什么问题",
  }
).toString()}`;

function buildCategorySections(posts: PostSummary[]): CategorySection[] {
  const grouped: Record<CategoryKey, PostSummary[]> = {
    agent: [],
    engineering: [],
    architecture: [],
  };

  for (const post of posts) {
    const mapped = manualCategoryBySlug[post.slug] ?? "architecture";
    grouped[mapped].push(post);
  }

  return [
    {
      id: "agent",
      phase: "板块 1",
      title: "Agent开发",
      note: "聚焦 SubAgent、Skills、Hooks 等核心能力实现与演进。",
      posts: grouped.agent,
    },
    {
      id: "engineering",
      phase: "板块 2",
      title: "工程经验",
      note: "记录人机协作、交付节奏、复盘方法和团队实践。",
      posts: grouped.engineering,
    },
    {
      id: "architecture",
      phase: "板块 3",
      title: "架构思考",
      note: "围绕系统边界、能力分层与长期演进做结构化思考。",
      posts: grouped.architecture,
    },
  ];
}

export default async function Home() {
  const featuredPosts = await getFeaturedPosts(3);
  const allPosts = await getAllPosts();
  const categorySections = buildCategorySections(allPosts);

  return (
    <div className={styles.page}>
      <section className={`container ${styles.hero}`}>
        <div className={styles.decorLayer} aria-hidden="true">
          <span className={`${styles.orb} ${styles.orbA}`} />
          <span className={`${styles.orb} ${styles.orbB}`} />
          <span className={`${styles.orb} ${styles.orbC}`} />
        </div>
        <div className={styles.heroLead}>
          <p className={styles.kicker}>CA1_TANG / ENGINEERING NOTES</p>
          <h1 className={styles.heroTypingTitle}>
            <img
              className={styles.heroTypingMain}
              src={heroMainTypingSvgUrl}
              alt="从想法到交付"
              loading="eager"
              decoding="async"
            />
            <img
              className={styles.heroTypingSub}
              src={heroSubTypingSvgUrl}
              alt="先回答要解决什么问题"
              loading="eager"
              decoding="async"
            />
          </h1>
          <p className={styles.intro}>
            这是一个偏工程实践的个人博客，聚焦 Agent、工作流、内容系统和长期可维护的技术资产建设。
          </p>
          <div className={styles.heroActions}>
            <Link href="/blog" className="button-primary">
              进入文章库
            </Link>
            <a href="#plan" className="button-secondary">
              查看文章板块
            </a>
          </div>
        </div>
        <aside className={styles.heroPanel}>
          <div className={styles.profileHead}>
            <img
              src="/images/avatar-ca1.png"
              alt="CA1_TANG avatar"
              className={styles.profileAvatar}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.profileTitleWrap}>
              <h2>CA1_TANG</h2>
              <p className={styles.profileSubtitle}>Go Backend × Agent Engineering</p>
            </div>
          </div>
          <p className={styles.profileIntro}>
            主要做后端工程与系统实现，最近聚焦 Agent Runtime、SubAgent 编排、工具链与可交付工程实践。
          </p>
          <p className={styles.profileTagline}>
            野鸡学校&nbsp; | &nbsp;东莞留子&nbsp; | &nbsp;IMSB&nbsp; | &nbsp;绩点倒数&nbsp; | &nbsp;中中混血
          </p>
          <div className={styles.stackChips}>
            {["Go", "Gin", "MySQL", "Redis", "Docker", "Agent Runtime"].map((stack) => (
              <span key={stack} className="chip">
                {stack}
              </span>
            ))}
          </div>
          <ProfileActions
            githubUrl="https://github.com/Cai-Tang-www"
            className={styles.profileActions}
            linkClassName={styles.profileLink}
            resumeClassName={styles.resumeLink}
          />
        </aside>
      </section>

      <section className={`container ${styles.postSection}`}>
        <div className={styles.sectionHeader}>
          <h2>精选文章</h2>
          <Link href="/blog" className={styles.textLink}>
            查看全部 →
          </Link>
        </div>
        <div className={styles.postGrid}>
          {featuredPosts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      </section>

      <section id="plan" className={`container ${styles.phaseSection}`}>
        <div className={styles.sectionHeader}>
          <h2>文章板块</h2>
          <p>按主题组织内容，所有条目都可点击进入详情。</p>
        </div>
        <div className={styles.phaseGrid}>
          {categorySections.map((item, index) => (
            <article
              className={styles.phaseCard}
              key={item.id}
              style={{ animationDelay: `${index * 90 + 160}ms` }}
            >
              <p className={styles.phaseMeta}>
                <span>{item.phase}</span>
                <span>{item.posts.length} 篇</span>
              </p>
              <h3>{item.title}</h3>
              <p className={styles.phaseIntro}>{item.note}</p>
              <ul className={styles.phaseLinks}>
                {item.posts.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/blog/${post.slug}`} className={styles.phaseLink}>
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
