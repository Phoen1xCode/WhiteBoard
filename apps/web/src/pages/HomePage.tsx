import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createBoard,
  listBoards,
  deleteBoard,
  type BoardListItem,
} from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function HomePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

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
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            WhiteBoard 协作白板
          </h1>
        </div>

        {/* Create New Board */}
        <Card className="shadow-xl border-border/50">
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
                <Button
                  onClick={handleCreateBoard}
                  disabled={isCreating}
                  size="lg"
                >
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
        <Card className="shadow-xl border-border/50">
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
              <div className="text-center py-8 text-gray-500">
                暂无白板 请创建新的白板
              </div>
            ) : (
              <div className="space-y-2">
                {boards.map((board) => (
                  <div
                    key={board.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {board.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        更新于 {formatDate(board.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
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
