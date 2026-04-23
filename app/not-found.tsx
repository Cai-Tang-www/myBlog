import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <section
        style={{
          border: "1px solid var(--border-soft)",
          borderRadius: "1.2rem",
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-soft)",
          padding: "2rem 1.4rem",
        }}
      >
        <p style={{ margin: 0, color: "var(--text-muted)", letterSpacing: "0.09em" }}>
          404
        </p>
        <h1 style={{ margin: "0.65rem 0 0", fontSize: "2rem" }}>页面不存在</h1>
        <p style={{ margin: "0.7rem 0 0", color: "var(--text-secondary)" }}>
          这个地址还没有对应内容，你可以先回文章首页继续浏览。
        </p>
        <div style={{ marginTop: "1.1rem" }}>
          <Link href="/blog" className="button-primary">
            前往文章列表
          </Link>
        </div>
      </section>
    </div>
  );
}
