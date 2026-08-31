import type { Metadata } from "next";
import { ProjectShowcase } from "./project-showcase";
import { projects } from "./projects-data";

export const metadata: Metadata = {
  title: "项目经历",
  description: "围绕 Go、AI Runtime、工具执行安全和分布式系统的项目定位、功能与工程痛点。",
};

export default function ProjectsPage() {
  return <ProjectShowcase projects={projects} />;
}
