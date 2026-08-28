import { useNavigate } from "@tanstack/react-router";
import { Loader2, PenLine, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  BoardCard,
  DashboardHeader,
  DashboardLayout,
} from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { createBoard, deleteBoard, listBoards, type BoardListItem } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

const PREVIEW_COLORS = [
  "bg-[#FEF9C3]",
  "bg-[#DBEAFE]",
  "bg-[#FCE7F3]",
  "bg-[#DCFCE7]",
  "bg-[#F1F5F9]",
];

function NewBoardButton({ onClick, isCreating }: { onClick: () => void; isCreating: boolean }) {
  return (
    <Button type="button" onClick={onClick} disabled={isCreating}>
      {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
      新建白板
    </Button>
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
      await navigate({ to: "/board/$boardId", params: { boardId: board.id } });
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

  return (
    <DashboardLayout activeNav="boards" userName={user?.username} userEmail={user?.email}>
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
          <div className="flex size-18 items-center justify-center rounded-base border-2 border-border bg-muted">
            <PenLine className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl text-foreground">还没有白板</h2>
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
              onClick={() =>
                void navigate({ to: "/board/$boardId", params: { boardId: board.id } })
              }
              previewOverlay={
                <Button
                  type="button"
                  variant="neutral"
                  size="icon"
                  aria-label="删除白板"
                  onClick={(e) => handleDeleteBoard(board.id, e)}
                  className="absolute top-2.5 right-2.5 size-7"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              }
            />
          ))}
          <button
            type="button"
            onClick={handleCreateBoard}
            disabled={isCreating}
            className="flex min-h-[195px] flex-col items-center justify-center gap-2 rounded-base border-2 border-border bg-muted p-4 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden"
          >
            {isCreating ? (
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="size-7 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">新建白板</span>
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
