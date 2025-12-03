import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  boardId: string;
}

export function ShareButton({ boardId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/board/${boardId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  }

  return (
    <Button
      onClick={handleShare}
      className="gap-2"
      variant={copied ? "secondary" : "default"}
    >
      {copied ? (
        <>
          <Check size={18} />
          <span>已复制!</span>
        </>
      ) : (
        <>
          <Share2 size={18} />
          <span>分享</span>
        </>
      )}
    </Button>
  );
}
