"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import styles from "./page.module.css";

interface Message {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
}

const STORAGE_KEY = "contact_messages";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // 从 localStorage 加载历史留言
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // localStorage 不可用时静默降级
    }
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "请输入昵称";
    if (!email.trim()) {
      errs.email = "请输入邮箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "邮箱格式不正确";
    }
    if (!content.trim()) errs.content = "请输入留言内容";
    else if (content.trim().length < 2) errs.content = "留言内容至少 2 个字符";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const newMessage: Message = {
      id: String(Date.now()),
      name: name.trim(),
      email: email.trim(),
      content: content.trim(),
      createdAt: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = [newMessage, ...messages];
    setMessages(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage 不可用时静默降级
    }

    setSubmitted(true);
    setName("");
    setEmail("");
    setContent("");
    setErrors({});

    setTimeout(() => setSubmitted(false), 3500);
  };

  const handleChange =
    (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      // 输入时清除对应字段的错误
      if (errors[e.target.name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[e.target.name];
          return next;
        });
      }
    };

  return (
    <div className={styles.page}>
      {/* 页面头部 */}
      <section className={`container ${styles.hero}`}>
        <h1 className={styles.title}>留言板</h1>
        <p className={styles.subtitle}>
          有什么想说的，写在这里吧。所有留言会保存在浏览器本地。
        </p>
      </section>

      {/* 表单区域 */}
      <section className={`container ${styles.formSection}`}>
        {/* 浮动装饰元素 —— 用于演示 CSS float 布局 */}
        <div className={styles.floatDeco} aria-hidden="true">
          <span className={styles.floatIcon}>💬</span>
          <span className={styles.floatLabel}>Say Hi</span>
        </div>

        {/* 成功提示 */}
        {submitted && (
          <div className={styles.successToast} role="status">
            ✅ 留言提交成功！（已保存在本地浏览器中）
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* 昵称 */}
          <div className={styles.field}>
            <label htmlFor="contact-name" className={styles.label}>
              昵称 <span className={styles.required}>*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              placeholder="你的名字或昵称"
              value={name}
              onChange={handleChange(setName)}
              autoComplete="name"
            />
            {errors.name && (
              <span className={styles.errorText} role="alert">
                {errors.name}
              </span>
            )}
          </div>

          {/* 邮箱 */}
          <div className={styles.field}>
            <label htmlFor="contact-email" className={styles.label}>
              邮箱 <span className={styles.required}>*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              placeholder="your@email.com"
              value={email}
              onChange={handleChange(setEmail)}
              autoComplete="email"
            />
            {errors.email && (
              <span className={styles.errorText} role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* 留言内容 */}
          <div className={styles.field}>
            <label htmlFor="contact-content" className={styles.label}>
              留言 <span className={styles.required}>*</span>
            </label>
            <textarea
              id="contact-content"
              name="content"
              className={`${styles.textarea} ${errors.content ? styles.inputError : ""}`}
              placeholder="写下你想说的话…"
              rows={5}
              value={content}
              onChange={handleChange(setContent)}
            />
            <span className={styles.charCount}>{content.length} 字</span>
            {errors.content && (
              <span className={styles.errorText} role="alert">
                {errors.content}
              </span>
            )}
          </div>

          {/* 提交按钮 */}
          <button type="submit" className={styles.submitBtn}>
            提交留言
          </button>
        </form>
      </section>

      {/* 历史留言 */}
      {messages.length > 0 && (
        <section className={`container ${styles.history}`}>
          <h2 className={styles.historyTitle}>
            历史留言 <span className={styles.historyCount}>({messages.length})</span>
          </h2>
          <div className={styles.messageList}>
            {messages.map((msg) => (
              <article key={msg.id} className={styles.messageCard}>
                <div className={styles.messageHead}>
                  <strong className={styles.messageName}>{msg.name}</strong>
                  <time className={styles.messageTime}>{msg.createdAt}</time>
                </div>
                <p className={styles.messageBody}>{msg.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
