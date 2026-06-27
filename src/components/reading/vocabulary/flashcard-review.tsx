"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, RotateCcw, Check, X, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/auth/supabase-browser";
import { calculateSM2 } from "@/lib/reading/srs-sm2";
import { toast } from "sonner";
import type { Flashcard, ReviewGrade } from "@/types/reading";

export function FlashcardReview() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, easy: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadCards = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("flashcards")
      .select("*, vocabulary:vocabulary(*)")
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(20);

    setCards(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleGrade = async (grade: ReviewGrade) => {
    const card = cards[currentIndex];
    if (!card) return;

    const result = calculateSM2(
      grade,
      card.ease_factor,
      card.interval_days,
      card.repetition_count
    );

    const supabase = createClient();
    await supabase.from("flashcards").update({
      ease_factor: result.ease_factor,
      interval_days: result.interval_days,
      repetition_count: result.repetition_count,
      next_review_at: result.next_review_at,
      last_reviewed_at: new Date().toISOString(),
    }).eq("id", card.id);

    // 更新生词掌握度
    if (card.vocabulary_id) {
      const proficiency = grade === 1 ? 0 : grade === 2 ? 0 : grade === 3 ? 1 : 2;
      await supabase.from("vocabulary").update({ proficiency }).eq("id", card.vocabulary_id);
    }

    // 更新统计
    setStats((prev) => ({
      correct: prev.correct + (grade >= 3 ? 1 : 0),
      wrong: prev.wrong + (grade === 1 ? 1 : 0),
      easy: prev.easy + (grade === 4 ? 1 : 0),
    }));
    setReviewedCount((prev) => prev + 1);

    // 下一张
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // 完成所有复习
      toast.success(`复习完成！正确 ${stats.correct + (grade >= 3 ? 1 : 0)} / ${reviewedCount + 1}`);
      setCards([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">加载闪卡...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        {reviewedCount > 0 ? (
          <>
            <Check className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold">今日复习完成！</h2>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.correct}</p>
                <p className="text-xs text-muted-foreground">正确</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.wrong}</p>
                <p className="text-xs text-muted-foreground">错误</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.easy}</p>
                <p className="text-xs text-muted-foreground">简单</p>
              </div>
            </div>
            <Button variant="outline" onClick={loadCards}>
              <RotateCcw className="h-4 w-4 mr-2" /> 再来一轮
            </Button>
          </>
        ) : (
          <>
            <Check className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">今日没有待复习的闪卡</p>
            <p className="text-sm text-muted-foreground">阅读时收藏生词后会自动生成闪卡</p>
          </>
        )}
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="space-y-6">
      {/* 进度 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{currentIndex + 1} / {cards.length}</span>
          <span className="text-muted-foreground">已复习 {reviewedCount} 张</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* 闪卡 */}
      <div className="flex justify-center">
        <div
          className="flashcard-container w-full max-w-lg h-72 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={cn("flashcard-inner", isFlipped && "flashcard-flipped")}>
            {/* 正面 - 单词 */}
            <Card className="flashcard-front flex flex-col items-center justify-center p-8">
              <p className="text-3xl font-bold mb-2">{card.front_content}</p>
              {card.vocabulary?.phonetic && (
                <p className="text-sm text-muted-foreground">/{card.vocabulary.phonetic}/</p>
              )}
              <p className="absolute bottom-4 text-xs text-muted-foreground">点击翻转</p>
            </Card>

            {/* 背面 - 释义 */}
            <Card className="flashcard-back flex flex-col items-center justify-center p-8">
              <p className="text-lg font-medium mb-3">{card.back_content}</p>
              {card.vocabulary?.example_sentence && (
                <p className="text-sm text-muted-foreground italic text-center mt-2">
                  "{card.vocabulary.example_sentence}"
                </p>
              )}
              <p className="absolute bottom-4 text-xs text-muted-foreground">选择掌握程度</p>
            </Card>
          </div>
        </div>
      </div>

      {/* 评分按钮 */}
      {isFlipped && (
        <div className="flex justify-center gap-3 animate-in fade-in">
          <Button
            variant="destructive"
            onClick={() => handleGrade(1)}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <X className="h-5 w-5" />
            <span className="text-xs">忘记</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGrade(2)}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <ThumbsDown className="h-5 w-5" />
            <span className="text-xs">困难</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleGrade(3)}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <Meh className="h-5 w-5" />
            <span className="text-xs">良好</span>
          </Button>
          <Button
            variant="default"
            onClick={() => handleGrade(4)}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            <ThumbsUp className="h-5 w-5" />
            <span className="text-xs">简单</span>
          </Button>
        </div>
      )}
    </div>
  );
}
