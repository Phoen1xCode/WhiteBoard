import { Loader2, Plus, Trash2, ExternalLink, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createBoard, listBoards, deleteBoard, logout, type BoardListItem } from "../lib/api";
import { getStoredUser } from "../lib/auth";

export function HomePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [title, setTitle] = useState("");
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
      const board = await createBoard(title || "Untitled Board");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="bg-grid-slate-100 absolute inset-0 -z-10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-bold text-gray-900">WhiteBoard 协作白板</h1>
            {user && <p className="text-sm text-gray-600">已登录：{user.username}</p>}
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await logout();
              } catch {
                // session cleared client-side anyway
              }
              navigate("/login");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出
          </Button>
        </div>

        {/* Create New Board */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">新建白板</CardTitle>
            <CardDescription>创建一个新的白板</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="board-title">白板标题（可选）</Label>
                <Input
                  id="board-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Board"
                  disabled={isCreating}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateBoard} disabled={isCreating} size="lg">
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      创建
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Board List */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">白板创建记录</CardTitle>
            <CardDescription>之前创建的白板</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : boards.length === 0 ? (
              <div className="py-8 text-center text-gray-500">暂无白板 请创建新的白板</div>
            ) : (
              <div className="space-y-2">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className="group flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                    onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-gray-900">{board.title}</h3>
                      <p className="text-sm text-gray-500">更新于 {formatDate(board.updatedAt)}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/board/${board.id}`, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                        onClick={(e) => handleDeleteBoard(board.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
