"use client";

import { VocabularyList } from "@/components/reading/vocabulary/vocabulary-list";

export default function VocabularyPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">生词本</h1>
        <p className="text-sm text-muted-foreground mt-1">
          阅读时收藏的生词，支持复习与熟练度管理
        </p>
      </div>

      <VocabularyList />
    </div>
  );
}
