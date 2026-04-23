import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getFeaturedPosts } from "@/lib/posts";
import { phasePlan } from "@/lib/plan";
import styles from "./page.module.css";

export default async function Home() {
  const featuredPosts = await getFeaturedPosts(3);

  return (
    <div className={styles.page}>
      <section className={`container ${styles.hero}`}>
        <div className={styles.decorLayer} aria-hidden="true">
          <span className={`${styles.orb} ${styles.orbA}`} />
          <span className={`${styles.orb} ${styles.orbB}`} />
          <span className={`${styles.orb} ${styles.orbC}`} />
        </div>
        <div className={styles.heroLead}>
          <p className={styles.kicker}>PERSONAL ENGINEERING BLOG</p>
          <h1>
            把灵感变成可交付内容，
            <span>再把内容变成可复用系统。</span>
          </h1>
          <p className={styles.intro}>
            这个博客以 Next.js SSG 为核心，面向长期写作、技术沉淀和自动化发布。你现在看到的是第一版基础框架。
          </p>
          <div className={styles.heroActions}>
            <Link href="/blog" className="button-primary">
              进入文章库
            </Link>
            <a href="#plan" className="button-secondary">
              查看计划套餐
            </a>
          </div>
        </div>
        <aside className={styles.heroPanel}>
          <h2>基础框架已就绪</h2>
          <ul>
            <li>Next.js App Router + SSG 静态导出</li>
            <li>Markdown 内容结构 + 博客路由</li>
            <li>可扩展动效视觉系统</li>
            <li>Pagefind / giscus / Pages 预接入</li>
          </ul>
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
          <h2>计划套餐</h2>
          <p>按可交付结果拆分阶段，避免博客项目半途失速。</p>
        </div>
        <div className={styles.phaseGrid}>
          {phasePlan.map((item, index) => (
            <article
              className={styles.phaseCard}
              key={item.phase}
              style={{ animationDelay: `${index * 90 + 160}ms` }}
            >
              <p className={styles.phaseMeta}>
                <span>{item.phase}</span>
                <span>{item.duration}</span>
              </p>
              <h3>{item.focus}</h3>
              <ul>
                {item.deliverables.map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
