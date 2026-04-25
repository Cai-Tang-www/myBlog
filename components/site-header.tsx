import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import styles from "./site-header.module.css";

const navigation = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/#plan", label: "路线图" },
];

export function SiteHeader() {
  return (
    <header className={styles.header} data-pagefind-ignore>
      <div className="container">
        <div className={styles.inner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandBadge} aria-hidden="true" />
            <span>{siteConfig.name}</span>
          </Link>
          <nav className={styles.nav} aria-label="主导航">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            className={styles.cta}
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
