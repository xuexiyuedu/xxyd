import { openDB } from "idb";

const DB_NAME = "knowledge-reader-offline";
const DB_VERSION = 1;

/**
 * 获取离线缓存数据库
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("highlights")) {
        db.createObjectStore("highlights", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", { keyPath: "id" });
      }
    },
  });
}

/**
 * 缓存文件元数据
 */
export async function cacheFile(fileId: string, data: any) {
  const db = await getDB();
  await db.put("files", { id: fileId, ...data, cachedAt: Date.now() });
}

/**
 * 获取缓存的文件
 */
export async function getCachedFile(fileId: string) {
  const db = await getDB();
  return db.get("files", fileId);
}

/**
 * 缓存高亮批注
 */
export async function cacheHighlights(fileId: string, highlights: any[]) {
  const db = await getDB();
  const tx = db.transaction("highlights", "readwrite");
  const store = tx.objectStore("highlights");
  for (const h of highlights) {
    await store.put({ ...h, fileId });
  }
  await tx.done;
}

/**
 * 获取缓存的高亮
 */
export async function getCachedHighlights(fileId: string) {
  const db = await getDB();
  const all = await db.getAll("highlights");
  return all.filter((h) => h.fileId === fileId);
}

/**
 * 清理过期缓存（默认7天）
 */
export async function clearExpiredCache(maxAgeDays = 7) {
  const db = await getDB();
  const maxAge = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const tx = db.transaction("files", "readwrite");
  const store = tx.objectStore("files");
  const all = await store.getAll();
  for (const item of all) {
    if (item.cachedAt && item.cachedAt < maxAge) {
      await store.delete(item.id);
    }
  }
  await tx.done;
}
