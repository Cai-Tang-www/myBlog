import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} data-pagefind-ignore>
      <div className="container">
        <div className={styles.inner}>
          <p className={styles.copyright}>
            &copy; {year} {siteConfig.author}
          </p>
          <div className={styles.links}>
            <Link href="/blog">文章</Link>
            <a href={siteConfig.links.rss}>RSS</a>
            <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
