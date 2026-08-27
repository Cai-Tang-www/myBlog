import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import styles from "./site-header.module.css";

const navigation = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/projects", label: "项目经历" },
];

export function SiteHeader() {
  return (
    <header className={styles.header} data-pagefind-ignore>
      <div className="container wide-container">
        <div className={styles.inner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandBadge} aria-hidden="true" />
            <span className="logo-line-before">
              <i />
            </span>
            <span className={styles.siteTitle}>{siteConfig.name}</span>
            <span className="logo-line-after">
              <i />
            </span>
          </Link>
          <nav className={styles.nav} aria-label="主导航">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
            <a
              className={styles.navLink}
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
