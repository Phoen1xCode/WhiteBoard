import { Link } from "@tanstack/react-router";
import {
  Circle,
  Cloud,
  Infinity as InfinityIcon,
  MousePointer2,
  PenLine,
  Pencil,
  Plus,
  Square,
  Type,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const navLinks = ["功能", "模板", "价格", "关于"];

const features = [
  {
    icon: Users,
    title: "实时协作",
    description: "多人同时编辑，光标可见，想法即时碰撞",
  },
  {
    icon: InfinityIcon,
    title: "无限画布",
    description: "写作、绘图、流程图，不受边界限制",
  },
  {
    icon: Cloud,
    title: "云端同步",
    description: "自动保存每一笔画，离线也不丢内容",
  },
];

const toolbarIcons = [MousePointer2, Square, Circle, Pencil, Type];

const footerLinks = ["隐私政策", "服务条款", "联系我们"];

export function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="flex items-center justify-between border-b-2 border-border px-8 py-[14px]">
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-base border-2 border-border bg-primary">
            <PenLine className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-heading">Whiteboard</span>
        </div>

        <nav className="flex items-center gap-7">
          {navLinks.map((label) => (
            <span key={label} className="text-sm text-muted-foreground">
              {label}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link to="/login">登录</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">免费注册</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-8 pt-[72px] pb-16">
        <div className="flex items-center justify-center gap-2 rounded-full border-2 border-border bg-primary px-3 py-1">
          <span className="text-center font-mono text-xs font-heading text-primary-foreground">
            在线协作白板 · 免费使用
          </span>
        </div>

        <h1 className="text-6xl">把想法，画在一起</h1>
        <p className="text-lg text-muted-foreground">
          一块无限画布，写作、绘图、脑暴，实时与团队同步
        </p>

        <div className="flex gap-4 pt-2 pb-4">
          <Button asChild>
            <Link to="/signup">
              <PenLine />
              免费开始创作
            </Link>
          </Button>
          <Button type="button" variant="neutral">
            <Plus />
            观看演示
          </Button>
        </div>

        {/* Board Preview */}
        <div className="relative h-[400px] w-[960px] max-w-full overflow-hidden rounded-base border-2 border-border bg-card shadow-shadow">
          {/* Mini Toolbar */}
          <div className="absolute top-4 left-[360px] flex items-center gap-[6px] rounded-base border-2 border-border bg-popover p-[6px] shadow-shadow">
            {toolbarIcons.map((Icon, index) => (
              <Icon key={index} className="h-4 w-4 text-foreground" />
            ))}
          </div>

          {/* Sticky Note */}
          <div className="absolute top-[110px] left-[130px] h-[130px] w-[130px] rotate-[-4deg] border-2 border-border bg-[#FEF08A] shadow-[2px_2px_0px_0px_var(--border)]" />

          {/* Sketch Rect */}
          <div className="absolute top-[140px] left-[400px] h-[130px] w-[220px] rotate-[1deg] rounded-[4px] border-2 border-foreground" />

          {/* Sketch Ellipse */}
          <div className="absolute top-[120px] left-[700px] h-[110px] w-[150px] rotate-[-2deg] rounded-[50%] border-2 border-foreground" />

          {/* Hint */}
          <span className="absolute top-[340px] left-[390px] text-sm text-muted-foreground">
            实时协作中 · 3 人在线
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="flex flex-col items-center gap-8 px-8 pt-6 pb-[72px]">
        <h2 className="text-3xl">为什么选择 Whiteboard</h2>

        <div className="flex w-full gap-6 px-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-1 flex-col gap-3 rounded-base border-2 border-border bg-card p-6 shadow-shadow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-base border-2 border-border bg-secondary">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg">{feature.title}</h3>
              <p className="text-sm leading-[1.6] text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Band */}
      <section className="flex flex-col items-center gap-4 border-y-2 border-border bg-primary px-8 py-12">
        <h2 className="text-3xl text-primary-foreground">准备好开始了吗？</h2>
        <Button asChild variant="neutral" size="lg">
          <Link to="/signup">立即免费注册</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between p-6">
        <span className="text-sm text-muted-foreground">© 2025 Whiteboard</span>
        <div className="flex gap-6">
          {footerLinks.map((label) => (
            <span key={label} className="text-sm text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
