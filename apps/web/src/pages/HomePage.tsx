import { Loader2, PenLine, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { createBoard, listBoards, deleteBoard, logout, type BoardListItem } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const PREVIEW_COLORS = [
  "bg-[#FEF9C3]",
  "bg-[#DBEAFE]",
  "bg-[#FCE7F3]",
  "bg-[#DCFCE7]",
  "bg-[#F1F5F9]",
];

function NewBoardButton({ onClick, isCreating }: { onClick: () => void; isCreating: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCreating}
      className="flex items-center justify-center gap-1.5 rounded-none border-2 border-border bg-primary px-4 py-2 shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
    >
      {isCreating ? (
        <Loader2 className="size-4 animate-spin text-primary-foreground" />
      ) : (
        <Plus className="size-4 text-primary-foreground" />
      )}
      <span className="text-sm font-medium text-primary-foreground">新建白板</span>
    </button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isCreating, setIsCreating] = useState(false);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBoards() {
      try {
        const data = await listBoards();
        setBoards(data);
      } catch (error) {
        console.error("Failed to load boards:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadBoards();
  }, []);

  async function handleCreateBoard() {
    setIsCreating(true);
    try {
      const board = await createBoard("Untitled Board");
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error("Failed to create board:", error);
      toast.error("Failed to create board. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteBoard(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this board?")) return;

    try {
      await deleteBoard(id);
      setBoards(boards.filter((b) => b.id !== id));
      toast.success("Board deleted");
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast.error("Failed to delete board");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // session cleared client-side anyway
    }
    navigate("/login");
  }

  return (
    <DashboardLayout
      activeNav="boards"
      userName={user?.username ?? "李雷"}
      userEmail={user?.email ?? "li.lei@example.com"}
      onLogout={handleLogout}
    >
      <DashboardHeader
        title="我的白板"
        subtitle={
          boards.length === 0
            ? "还没有白板，从第一块开始吧"
            : `共 ${boards.length} 个白板，最近更新按时间排序`
        }
        action={<NewBoardButton onClick={handleCreateBoard} isCreating={isCreating} />}
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="flex size-18 items-center justify-center rounded-xl border-2 border-border bg-muted">
            <PenLine className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">还没有白板</h2>
          <p className="text-sm text-muted-foreground">创建你的第一块白板，把想法画出来</p>
          <NewBoardButton onClick={handleCreateBoard} isCreating={isCreating} />
        </div>
      ) : (
        <div className="grid w-full grid-cols-3 gap-6">
          {boards.map((board, index) => (
            <BoardCard
              key={board.id}
              title={board.title}
              meta={`更新于 ${formatDate(board.updatedAt)}`}
              previewClass={PREVIEW_COLORS[index % PREVIEW_COLORS.length]}
              onClick={() => navigate(`/board/${board.id}`)}
              previewOverlay={
                <button
                  type="button"
                  aria-label="删除白板"
                  onClick={(e) => handleDeleteBoard(board.id, e)}
                  className={cn(
                    "absolute top-2.5 right-2.5 flex size-7 items-center justify-center",
                    "rounded-md border-2 border-border bg-card shadow-[2px_2px_0px_0px_var(--border)]",
                  )}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              }
            />
          ))}
          <button
            type="button"
            onClick={handleCreateBoard}
            disabled={isCreating}
            className="flex min-h-[195px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-border bg-muted p-4"
          >
            {isCreating ? (
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="size-7 text-muted-foreground" />
            )}
            <span className="text-sm font-medium text-muted-foreground">新建白板</span>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
