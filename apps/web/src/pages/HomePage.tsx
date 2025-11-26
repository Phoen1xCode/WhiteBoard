import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBoard } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateBoard() {
    setIsCreating(true);
    try {
      const board = await createBoard(title || "Untitled Board");
      navigate(`/board/${board.id}`);
    } catch (error) {
      console.error("Failed to create board:", error);
      alert("Failed to create board. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            WhiteBoard
          </CardTitle>
          <CardDescription className="text-center">
            Create a new collaborative whiteboard to start drawing with your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-title">Board Title (optional)</Label>
            <Input
              id="board-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Board"
              disabled={isCreating}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreateBoard}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create New Board
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
