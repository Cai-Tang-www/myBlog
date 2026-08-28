"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Project } from "./projects-data";
import styles from "./projects.module.css";

interface ProjectShowcaseProps {
  projects: Project[];
}

export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const [activeId, setActiveId] = useState(projects[0]?.id ?? "");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const activeProject = projects.find((project) => project.id === activeId) ?? projects[0];

  if (!activeProject) return null;

  const projectImages = activeProject.images ?? [];
  const activeImage = projectImages[activeImageIndex % Math.max(projectImages.length, 1)];
  const selectProject = (id: string) => {
    setActiveId(id);
    setActiveImageIndex(0);
  };
  const moveImage = (direction: number) => {
    if (projectImages.length < 2) return;
    setActiveImageIndex((current) => (current + direction + projectImages.length) % projectImages.length);
  };
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 40) return;
    moveImage(deltaX < 0 ? 1 : -1);
  };

  return (
    <div className={`container wide-container ${styles.page}`}>
      <header className={styles.intro}>
        <p className={styles.kicker}>PROJECT EXPERIENCE</p>
        <h1>项目经历</h1>
        <p>我主要关注 Go 后端、AI Runtime、工具执行安全，以及可观测、可恢复的分布式系统。选择右侧项目，查看我负责的模块和解决的工程问题。</p>
      </header>

      <section className={styles.showcase} aria-label="项目经历展示">
        <div className={styles.mainColumn}>
          <figure className={styles.visual} aria-label={`${activeProject.name} 项目预览`}>
            {activeImage ? (
              <>
                <div className={styles.imageStage} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                  <Image className={styles.projectImage} src={activeImage.src} alt={activeImage.alt} width={activeImage.width} height={activeImage.height} priority={activeImageIndex === 0} sizes="(max-width: 720px) 100vw, calc(100vw - 28rem)" />
                  {projectImages.length > 1 ? (
                    <>
                      <button className={`${styles.imageControl} ${styles.imageControlPrevious}`} type="button" aria-label="查看上一张项目图片" title="上一张" onClick={() => moveImage(-1)}>←</button>
                      <button className={`${styles.imageControl} ${styles.imageControlNext}`} type="button" aria-label="查看下一张项目图片" title="下一张" onClick={() => moveImage(1)}>→</button>
                      <span className={styles.imageCounter}>{String(activeImageIndex + 1).padStart(2, "0")} / {String(projectImages.length).padStart(2, "0")}</span>
                    </>
                  ) : null}
                </div>
                {projectImages.length > 1 ? (
                  <div className={styles.thumbnails} aria-label="项目图片选择">
                    {projectImages.map((image, index) => (
                      <button className={`${styles.thumbnail} ${index === activeImageIndex ? styles.thumbnailActive : ""}`} type="button" key={image.src} aria-label={`查看第 ${index + 1} 张图片`} aria-pressed={index === activeImageIndex} onClick={() => setActiveImageIndex(index)}>
                        <Image src={image.src} alt="" width={image.width} height={image.height} sizes="7rem" />
                      </button>
                    ))}
                  </div>
                ) : null}
                <figcaption>项目界面与工作流截图</figcaption>
              </>
            ) : (
              <>
            <div className={styles.visualHeader}>
              <span className={styles.trafficLights} aria-hidden="true"><i /><i /><i /></span>
              <span>{activeProject.name} / project preview</span>
              <span className={styles.visualStatus}>ACTIVE</span>
            </div>
            <div className={styles.visualBody}>
              <p className={styles.visualEyebrow}>{activeProject.visualLabel}</p>
              <div className={styles.visualTitle}>{activeProject.name}</div>
              <div className={styles.nodeMap}>
                {activeProject.visualNodes.map((node, index) => (
                  <div className={styles.nodeRow} key={node}>
                    <span className={styles.nodeIndex}>0{index + 1}</span>
                    <span className={styles.node}>{node}</span>
                    {index < activeProject.visualNodes.length - 1 ? <span className={styles.connector} aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
              <div className={styles.visualFooter}><span>BOUNDARY CHECK</span><span>TRACE READY</span><span>RECOVERABLE</span></div>
            </div>
            <figcaption>项目架构与贡献方向预览</figcaption>
              </>
            )}
          </figure>

          <article className={styles.details} key={activeProject.id}>
            <div className={styles.detailHeading}>
              <div>
                <p className={styles.detailIndex}>{String(projects.findIndex((project) => project.id === activeProject.id) + 1).padStart(2, "0")}</p>
                <h2>{activeProject.name}</h2>
              </div>
              <p className={styles.period}>{activeProject.period}</p>
            </div>
            <p className={styles.type}>{activeProject.type}</p>
            <p className={styles.description}>{activeProject.description}</p>
            <div className={styles.detailGrid}>
              <div className={styles.section}><h3>我的贡献</h3><ul>{activeProject.contribution.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div className={styles.section}><h3>解决的问题</h3><ul>{activeProject.problems.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <div className={styles.bottomRow}>
              <div className={styles.tags} aria-label={`${activeProject.name} 技术标签`}>{activeProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {activeProject.link ? <Link className={styles.projectLink} href={activeProject.link.href} target="_blank" rel="noreferrer">{activeProject.link.label} <span aria-hidden="true">↗</span></Link> : <p className={styles.privateNote}>团队内部项目，展示负责模块与工程实践</p>}
            </div>
          </article>
        </div>

        <aside className={styles.projectRail} aria-label="选择项目">
          <div className={styles.railHeading}><span>PROJECTS</span><span>{String(projects.length).padStart(2, "0")} 项</span></div>
          <div className={styles.projectList}>
            {projects.map((project, index) => {
              const isActive = project.id === activeProject.id;
              return <button className={`${styles.projectItem} ${isActive ? styles.projectItemActive : ""}`} type="button" key={project.id} aria-pressed={isActive} onClick={() => selectProject(project.id)}>
                <span className={styles.itemNumber}>0{index + 1}</span>
                <span className={styles.itemCopy}><strong>{project.name}</strong><small>{project.type.replace("团队项目 · ", "").replace("个人项目 · ", "")}</small><span>{project.visualLabel}</span></span>
                <span className={styles.itemDot} aria-hidden="true" />
              </button>;
            })}
          </div>
          <p className={styles.railHint}>滚动查看项目 · 点击切换详情</p>
        </aside>
      </section>
    </div>
  );
}
