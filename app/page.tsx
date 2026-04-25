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
          <p className={styles.kicker}>CA1_TANG / ENGINEERING NOTES</p>
          <h1>
            从想法到交付
            <span className={styles.subline}>先回答要解决什么问题</span>
          </h1>
          <p className={styles.intro}>
            这是一个偏工程实践的个人博客，聚焦 Agent、工作流、内容系统和长期可维护的技术资产建设。
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
          <h2>当前站点能力</h2>
          <ul>
            <li>Next.js App Router + SSG 静态导出</li>
            <li>Markdown 内容结构 + 博客路由</li>
            <li>Pagefind 全站搜索</li>
            <li>giscus 评论与自动化部署</li>
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
          <p>按阶段推进结构、内容和自动化，持续可迭代。</p>
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
