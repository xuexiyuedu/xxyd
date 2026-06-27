/**
 * 无后端 Supabase 时的本地开发 Mock 客户端
 * 仅在 NEXT_PUBLIC_MOCK_AUTH=true 时使用，生产环境必须关闭。
 * 支持完整的 CRUD 操作，数据存储在内存中。
 */

import type { User, Session } from "@supabase/supabase-js";
import {
  MOCK_USER, MOCK_SESSION, MOCK_PROFILE, getMockStore, MOCK_TXT_CONTENT,
} from "./mock-data";

// ============ 查询构建器 ============

type Row = Record<string, any>;

interface QueryState {
  table: string;
  filters: Array<(row: Row) => boolean>;
  orders: Array<{ column: string; ascending: boolean }>;
  limitN: number | null;
  rangeFrom: number | null;
  rangeTo: number | null;
  singleMode: boolean;
  countMode: boolean;
  headOnly: boolean;
  selectColumns: string | null;
  insertData: Row | Row[] | null;
  updateData: Row | null;
  upsertData: Row | null;
  conflictColumn: string | null;
  deleteMode: boolean;
}

function getTableData(table: string): Row[] {
  const store = getMockStore() as any;
  if (table in store) {
    return [...store[table]];
  }
  return [];
}

function setTableData(table: string, data: Row[]) {
  const store = getMockStore() as any;
  if (table in store) {
    store[table] = data;
  }
}

// 处理 select 字符串中的关联查询
function applySelect(row: Row, selectStr: string): Row {
  if (!selectStr || selectStr === "*") return { ...row };

  // 拆分字段，注意不在括号内拆分
  const fields: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of selectStr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) fields.push(current.trim());

  const result: Row = {};

  for (const field of fields) {
    // 处理关联查询：table:foreignTable(column)
    const match = field.match(/^(\w+):(\w+)\((.+)\)$/);
    if (match) {
      const [, localCol, foreignTable, foreignCol] = match;
      const foreignData = getTableData(foreignTable);

      if (localCol === "file" && foreignTable === "files") {
        const file = foreignData.find((f) => f.id === row.file_id);
        if (file) {
          result[localCol] = foreignCol === "*" ? file : pickColumns(file, foreignCol);
        }
      } else if (localCol === "highlight" && foreignTable === "highlights") {
        const hl = foreignData.find((h) => h.id === row.highlight_id);
        if (hl) {
          result[localCol] = foreignCol === "*" ? hl : pickColumns(hl, foreignCol);
        }
      } else if (localCol === "category" && foreignTable === "categories") {
        const cat = foreignData.find((c) => c.id === row.category_id);
        if (cat) {
          result[localCol] = foreignCol === "*" ? cat : pickColumns(cat, foreignCol);
        }
      } else if (localCol === "tags" && foreignTable === "file_tags") {
        // file_tags -> tags 嵌套关联，返回空数组（mock 无关联数据）
        result[localCol] = [];
      } else {
        // 通用处理：查找关联数据
        // 对于 file_tags，查找 file_id === row.id 的记录
        const related = foreignData.filter((f) => {
          if (foreignTable === "file_tags") return f.file_id === row.id;
          return f.id === row[localCol];
        });
        if (related.length > 0) {
          result[localCol] = related.map((r) => foreignCol === "*" ? r : pickColumns(r, foreignCol));
        } else {
          result[localCol] = null;
        }
      }
    } else {
      // 普通字段
      if (field in row) {
        result[field] = row[field];
      }
    }
  }

  return result;
}

function pickColumns(row: Row, columnsStr: string): Row {
  if (columnsStr === "*") return { ...row };
  const cols = columnsStr.split(",").map((c) => c.trim());
  const result: Row = {};
  for (const col of cols) {
    if (col in row) result[col] = row[col];
  }
  return result;
}

class MockQueryBuilder {
  private state: QueryState;

  constructor(table: string) {
    this.state = {
      table,
      filters: [],
      orders: [],
      limitN: null,
      rangeFrom: null,
      rangeTo: null,
      singleMode: false,
      countMode: false,
      headOnly: false,
      selectColumns: null,
      insertData: null,
      updateData: null,
      upsertData: null,
      conflictColumn: null,
      deleteMode: false,
    };
  }

  // ============ 查询方法 ============
  select(columns?: string, options?: { count?: string; head?: boolean }) {
    this.state.selectColumns = columns || "*";
    if (options?.count) this.state.countMode = true;
    if (options?.head) this.state.headOnly = true;
    return this;
  }

  eq(column: string, value: any) {
    this.state.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.state.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column: string, value: any) {
    this.state.filters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.state.filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.state.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.state.filters.push((row) => row[column] <= value);
    return this;
  }

  like(column: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, ".*"), "i");
    this.state.filters.push((row) => regex.test(String(row[column] || "")));
    return this;
  }

  ilike(column: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, ".*"), "i");
    this.state.filters.push((row) => regex.test(String(row[column] || "")));
    return this;
  }

  is(column: string, value: any) {
    this.state.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.state.filters.push((row) => values.includes(row[column]));
    return this;
  }

  or(filterStr: string) {
    // 解析 "col1.ilike.%x%,col2.ilike.%y%" 格式
    const conditions = filterStr.split(",").map((c) => c.trim());
    this.state.filters.push((row) => {
      return conditions.some((cond) => {
        const match = cond.match(/^(\w+)\.(ilike|like|eq)\.(.+)$/);
        if (!match) return false;
        const [, col, op, val] = match;
        const cleanVal = val.replace(/^%|%$/g, "");
        if (op === "eq") return row[col] === cleanVal;
        return String(row[col] || "").toLowerCase().includes(cleanVal.toLowerCase());
      });
    });
    return this;
  }

  contains(column: string, value: any) {
    this.state.filters.push((row) => {
      const arr = row[column];
      return Array.isArray(arr) && value.every((v: any) => arr.includes(v));
    });
    return this;
  }

  containedBy(column: string, value: any) {
    this.state.filters.push((row) => {
      const arr = row[column];
      return Array.isArray(arr) && arr.every((v: any) => value.includes(v));
    });
    return this;
  }

  match(conditions: Record<string, any>) {
    this.state.filters.push((row) =>
      Object.entries(conditions).every(([k, v]) => row[k] === v)
    );
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.state.orders.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(n: number) {
    this.state.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.state.rangeFrom = from;
    this.state.rangeTo = to;
    return this;
  }

  single() {
    this.state.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.state.singleMode = true;
    return this;
  }

  // ============ 写入方法 ============
  insert(data: Row | Row[]) {
    this.state.insertData = data;
    return this;
  }

  update(data: Row) {
    this.state.updateData = data;
    return this;
  }

  upsert(data: Row, options?: { onConflict?: string }) {
    this.state.upsertData = data;
    this.state.conflictColumn = options?.onConflict || null;
    return this;
  }

  delete() {
    this.state.deleteMode = true;
    return this;
  }

  // ============ 执行 ============
  async then(resolve: any, reject?: any) {
    try {
      const result = this.execute();
      return resolve(result);
    } catch (err) {
      if (reject) return reject(err);
      throw err;
    }
  }

  private execute(): { data: any; error: any; count?: number | null } {
    const store = getMockStore() as any;
    let tableData = getTableData(this.state.table);

    // INSERT
    if (this.state.insertData) {
      const now = new Date().toISOString();
      const items = Array.isArray(this.state.insertData)
        ? this.state.insertData
        : [this.state.insertData];

      const newRows = items.map((item) => ({
        id: item.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: now,
        updated_at: now,
        ...item,
      }));

      tableData = [...tableData, ...newRows];
      setTableData(this.state.table, tableData);

      // 返回插入的数据
      if (this.state.selectColumns) {
        const data = newRows.map((r) => applySelect(r, this.state.selectColumns!));
        return { data: this.state.singleMode ? data[0] || null : data, error: null };
      }
      return { data: this.state.singleMode ? newRows[0] || null : newRows, error: null };
    }

    // UPDATE
    if (this.state.updateData) {
      const updateData = { ...this.state.updateData, updated_at: new Date().toISOString() };
      let updatedRows: Row[] = [];

      tableData = tableData.map((row) => {
        if (this.state.filters.every((fn) => fn(row))) {
          const updated = { ...row, ...updateData };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      setTableData(this.state.table, tableData);

      if (this.state.selectColumns) {
        const data = updatedRows.map((r) => applySelect(r, this.state.selectColumns!));
        return { data: this.state.singleMode ? data[0] || null : data, error: null };
      }
      return { data: this.state.singleMode ? updatedRows[0] || null : updatedRows, error: null };
    }

    // UPSERT
    if (this.state.upsertData) {
      const now = new Date().toISOString();
      const data = this.state.upsertData;
      const conflictCol = this.state.conflictColumn || "id";
      let upsertedRow: Row | null = null;
      let found = false;

      tableData = tableData.map((row) => {
        if (this.state.filters.every((fn) => fn(row)) && row[conflictCol] === data[conflictCol]) {
          found = true;
          upsertedRow = { ...row, ...data, updated_at: now };
          return upsertedRow;
        }
        return row;
      });

      if (!found) {
        upsertedRow = {
          id: data.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          created_at: now,
          updated_at: now,
          ...data,
        };
        tableData = [...tableData, upsertedRow];
      }

      setTableData(this.state.table, tableData);

      if (this.state.selectColumns) {
        const result = upsertedRow ? applySelect(upsertedRow, this.state.selectColumns!) : null;
        return { data: this.state.singleMode ? result : result ? [result] : [], error: null };
      }
      return { data: this.state.singleMode ? upsertedRow : upsertedRow ? [upsertedRow] : [], error: null };
    }

    // DELETE
    if (this.state.deleteMode) {
      const remaining = tableData.filter((row) => !this.state.filters.every((fn) => fn(row)));
      const deleted = tableData.filter((row) => this.state.filters.every((fn) => fn(row)));
      setTableData(this.state.table, remaining);
      return { data: this.state.selectColumns ? deleted.map((r) => applySelect(r, this.state.selectColumns!)) : deleted, error: null };
    }

    // SELECT (默认)
    let filtered = tableData.filter((row) => this.state.filters.every((fn) => fn(row)));

    // 排序
    for (const order of this.state.orders) {
      filtered.sort((a, b) => {
        const av = a[order.column];
        const bv = b[order.column];
        if (av < bv) return order.ascending ? -1 : 1;
        if (av > bv) return order.ascending ? 1 : -1;
        return 0;
      });
    }

    // count
    const count = filtered.length;

    // range
    if (this.state.rangeFrom !== null && this.state.rangeTo !== null) {
      filtered = filtered.slice(this.state.rangeFrom, this.state.rangeTo + 1);
    }

    // limit
    if (this.state.limitN !== null) {
      filtered = filtered.slice(0, this.state.limitN);
    }

    // 应用 select 列
    if (this.state.selectColumns && this.state.selectColumns !== "*") {
      filtered = filtered.map((row) => applySelect(row, this.state.selectColumns!));
    }

    // head only (count query)
    if (this.state.headOnly) {
      return { data: null, error: null, count };
    }

    // single
    if (this.state.singleMode) {
      return { data: filtered[0] || null, error: null, count };
    }

    return { data: filtered, error: null, count };
  }
}

// ============ Mock 客户端 ============

export function createMockClient() {
  const listeners = new Set<(event: string, session: Session | null) => void>();

  return {
    auth: {
      getSession: async () => ({ data: { session: MOCK_SESSION }, error: null }),
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
      onAuthStateChange: (callback: any) => {
        listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      },
      signInWithPassword: async () => ({ data: { user: MOCK_USER, session: MOCK_SESSION }, error: null }),
      signUp: async () => ({ data: { user: MOCK_USER, session: MOCK_SESSION }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
    },
    from: (table: string) => new MockQueryBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "mock/file" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
        remove: async () => ({ error: null }),
      }),
    },
    rpc: async (_fn: string, _params?: any) => ({ data: null, error: null }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
  } as any;
}

export function isMockAuth() {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
  }
  return false;
}

export { MOCK_TXT_CONTENT };
