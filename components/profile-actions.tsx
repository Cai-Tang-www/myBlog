"use client";

interface ProfileActionsProps {
  githubUrl: string;
  className?: string;
  linkClassName?: string;
  resumeClassName?: string;
}

export function ProfileActions({
  githubUrl,
  className,
  linkClassName,
  resumeClassName,
}: ProfileActionsProps) {
  return (
    <div className={className}>
      <a className={linkClassName} href={githubUrl} target="_blank" rel="noreferrer">
        GitHub 主页 →
      </a>
      <a
        href="#"
        className={resumeClassName}
        onClick={(event) => {
          event.preventDefault();
          window.alert("我还没写好...");
        }}
      >
        看看简历 →
      </a>
    </div>
  );
}
