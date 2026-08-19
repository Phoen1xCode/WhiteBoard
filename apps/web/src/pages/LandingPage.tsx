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
import { Link } from "react-router-dom";

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
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] border-2 border-border bg-primary">
            <PenLine className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-[18px] font-bold">Whiteboard</span>
        </div>

        <nav className="flex items-center gap-7">
          {navLinks.map((label) => (
            <span key={label} className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center justify-center gap-[6px] px-4 py-2 text-sm font-medium text-foreground"
          >
            登录
          </Link>
          <Link
            to="/signup"
            className="flex items-center justify-center gap-[6px] rounded-none border-2 border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]"
          >
            免费注册
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-8 pt-[72px] pb-16">
        <div className="flex items-center justify-center gap-2 bg-primary px-2 py-[2px]">
          <span className="text-center font-mono text-xs font-semibold text-primary-foreground">
            在线协作白板 · 免费使用
          </span>
        </div>

        <h1 className="text-[56px] font-bold">把想法，画在一起</h1>
        <p className="text-[18px] text-muted-foreground">
          一块无限画布，写作、绘图、脑暴，实时与团队同步
        </p>

        <div className="flex gap-4 pt-2 pb-4">
          <Link
            to="/signup"
            className="flex items-center justify-center gap-[6px] rounded-none border-2 border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]"
          >
            <PenLine className="h-4 w-4" />
            免费开始创作
          </Link>
          <button
            type="button"
            className="flex items-center justify-center gap-[6px] rounded-none border-2 border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-[2px_2px_0px_0px_var(--border)]"
          >
            <Plus className="h-4 w-4" />
            观看演示
          </button>
        </div>

        {/* Board Preview */}
        <div className="relative h-[400px] w-[960px] max-w-full overflow-hidden rounded-[8px] border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)]">
          {/* Mini Toolbar */}
          <div className="absolute top-4 left-[360px] flex items-center gap-[6px] rounded-[8px] border-2 border-border bg-popover p-[6px] shadow-[2px_2px_0px_0px_var(--border)]">
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
          <span className="absolute top-[340px] left-[390px] text-[13px] text-muted-foreground">
            实时协作中 · 3 人在线
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="flex flex-col items-center gap-8 px-8 pt-6 pb-[72px]">
        <h2 className="text-[30px] font-bold">为什么选择 Whiteboard</h2>

        <div className="flex w-full gap-6 px-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-1 flex-col gap-3 rounded-[8px] border-2 border-border bg-card p-6 shadow-[2px_2px_0px_0px_var(--border)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border-2 border-border bg-secondary">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-[18px] font-semibold">{feature.title}</h3>
              <p className="text-sm leading-[1.6] text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Band */}
      <section className="flex flex-col items-center gap-4 border-y-2 border-border bg-primary px-8 py-12">
        <h2 className="text-[32px] font-bold text-primary-foreground">准备好开始了吗？</h2>
        <Link
          to="/signup"
          className="flex items-center gap-2 rounded-none border-2 border-border bg-card px-5 py-[10px] text-sm font-semibold text-foreground shadow-[2px_2px_0px_0px_var(--border)]"
        >
          立即免费注册
        </Link>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between p-6">
        <span className="text-[13px] text-muted-foreground">© 2025 Whiteboard</span>
        <div className="flex gap-6">
          {footerLinks.map((label) => (
            <span key={label} className="text-[13px] text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
