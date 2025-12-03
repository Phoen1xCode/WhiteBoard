// 基于 Zustand + Immer 实现的实时协作白板状态管理

import { create } from "zustand";
import { produce } from "immer";
import type {
  WhiteBoardElement,
  WhiteBoardOperation,
  ShapeType,
} from "@whiteboard/shared/types";
import { sendOperation } from "../lib/socket";

// 绘制样式配置
type DrawingStyle = {
  strokeColor: string; // 描边颜色
  strokeWidth: number; // 描边宽度
  fillColor?: string; // 填充颜色（可选）
  strokeDashArray?: number[]; // 虚线样式（可选）
};

// 历史记录条目
type HistoryEntry = {
  operation: WhiteBoardOperation; // 原始操作
  inverse: WhiteBoardOperation; // 逆向操作
};

/**
 * 应用状态定义
 * 白板的所有状态数据
 */
type State = {
  elements: Record<string, WhiteBoardElement>; // 所有白板元素，键为元素ID
  currentTool: ShapeType; // 当前选中的绘图工具
  currentStyle: DrawingStyle; // 当前绘图样式
  selectedElementId: string | null; // 当前选中的元素ID
  // 撤销/重做历史记录
  undoStack: HistoryEntry[]; // 撤销操作栈
  redoStack: HistoryEntry[]; // 重做操作栈
};

/**
 * Actions 定义
 * 白板状态的所有可操作方法
 */
type Actions = {
  setInitialElements: (elements: WhiteBoardElement[]) => void;
  applyOperation: (
    operation: WhiteBoardOperation,
    options?: { local?: boolean; recordHistory?: boolean }
  ) => void;
  setCurrentTool: (tool: ShapeType) => void; // 设置当前工具
  setCurrentStyle: (style: Partial<DrawingStyle>) => void; // 设置绘图样式
  setSelectedElementId: (id: string | null) => void; // 设置选中的元素
  deleteSelectedElement: (boardId: string) => void; // 删除选中的元素
  undo: (boardId: string) => void; // 撤销操作
  redo: (boardId: string) => void; // 重做操作
  canUndo: () => boolean; // 是否可以撤销
  canRedo: () => boolean; // 是否可以重做
};

/**
 * 创建逆向操作工具函数
 * 用于撤销/重做功能，为每个操作创建对应的逆向操作
 * @param operation 原始操作
 * @param elements 当前所有元素
 * @returns 逆向操作，如果无法创建则返回null
 */
function createInverseOperation(
  operation: WhiteBoardOperation,
  elements: Record<string, WhiteBoardElement>
): WhiteBoardOperation | null {
  switch (operation.type) {
    case "add":
      // 添加操作的逆向是删除操作
      return {
        type: "delete",
        boardId: operation.boardId,
        elementId: operation.element.id,
      };
    case "delete": {
      // 删除操作的逆向是重新添加被删除的元素
      const element = elements[operation.elementId];
      if (!element) return null; // 元素不存在，无法撤销
      return {
        type: "add",
        boardId: operation.boardId,
        element: { ...element },
      };
    }
    case "update": {
      // 更新操作的逆向是恢复原始值
      const element = elements[operation.elementId];
      if (!element) return null;

      // 存储变更属性的原始值
      const originalChanges: Partial<WhiteBoardElement> = {};
      for (const key of Object.keys(operation.changes)) {
        (originalChanges as any)[key] = (element as any)[key];
      }
      return {
        type: "update",
        boardId: operation.boardId,
        elementId: operation.elementId,
        changes: originalChanges,
      };
    }
    case "clear":
      // 清空操作比较复杂，暂不支持撤销
      return null;
  }
}

// 历史记录最大容量
const MAX_HISTORY_SIZE = 50;

/**
 * 白板 Zustand Store
 * 统一管理白板状态和实时协作功能
 */
export const useWhiteboardStore = create<State & Actions>((set, get) => ({
  // 初始状态
  elements: {}, // 空的白板元素集合
  currentTool: "freehand", // 默认工具为自由绘制
  currentStyle: {
    strokeColor: "#000000", // 默认描边颜色为黑色
    strokeWidth: 2, // 默认描边宽度为2
    fillColor: undefined, // 默认无填充
  },
  selectedElementId: null, // 初始无选中元素
  undoStack: [], // 撤销栈为空
  redoStack: [], // 重做栈为空

  /**
   * 初始化白板元素
   * 从服务器加载元素快照并清空历史记录
   * @param elements 从服务器获取的元素数组
   */
  setInitialElements: (elements) => {
    set(() => ({
      elements: Object.fromEntries(elements.map((el) => [el.id, el])),
      undoStack: [],
      redoStack: [],
    }));
  },

  /**
   * 应用操作到白板
   * 支持本地和远程操作，包含历史记录管理
   * @param operation 要应用的操作
   * @param options 可选项配置
   *   - local: 是否为本地操作（默认为false）
   *   - recordHistory: 是否记录历史（默认为local的值）
   */
  applyOperation: (operation, options) => {
    const local = options?.local ?? false; // 判断是否为本地操作
    const recordHistory = options?.recordHistory ?? local; // 本地操作则记录历史，远程操作不记录

    // 在应用变更前创建逆向操作
    let historyEntry: HistoryEntry | null = null;
    if (recordHistory) {
      const inverse = createInverseOperation(operation, get().elements);
      if (inverse) {
        historyEntry = { operation, inverse };
      }
    }

    set(
      produce((draft: State) => {
        switch (operation.type) {
          case "add": // 添加元素
            draft.elements[operation.element.id] = operation.element;
            break;
          case "update": // 更新现有元素属性
            if (draft.elements[operation.elementId]) {
              Object.assign(
                draft.elements[operation.elementId],
                operation.changes
              );
            }
            break;
          case "delete": // 删除元素
            delete draft.elements[operation.elementId];
            break;
          case "clear": // 清空所有元素
            draft.elements = {};
            break;
        }

        // 添加到撤销栈并清空重做栈
        if (historyEntry) {
          draft.undoStack.push(historyEntry);
          // 限制历史记录最大容量
          if (draft.undoStack.length > MAX_HISTORY_SIZE) {
            draft.undoStack.shift();
          }
          // 执行新操作时清空重做栈
          draft.redoStack = [];
        }
      })
    );

    // 本地操作需要发送到其他客户端
    if (local) {
      sendOperation(operation);
    }
  },

  /**
   * 设置当前绘图工具
   * @param tool 要设置的绘图工具类型
   */
  setCurrentTool: (tool) => {
    set({ currentTool: tool });
  },

  /**
   * 更新当前绘图样式
   * 合并更新样式属性，支持部分更新
   * @param style 要更新的样式属性
   */
  setCurrentStyle: (style) => {
    set(
      produce((draft: State) => {
        Object.assign(draft.currentStyle, style);
      })
    );
  },

  /**
   * 设置当前选中的元素
   * @param id 要选中的元素ID，null表示取消选择
   */
  setSelectedElementId: (id) => {
    set({ selectedElementId: id });
  },

  /**
   * 删除当前选中的元素
   * @param boardId 白板ID，用于操作标识
   */
  deleteSelectedElement: (boardId) => {
    const { selectedElementId } = get();
    if (selectedElementId) {
      // 应用删除操作
      get().applyOperation(
        { type: "delete", boardId, elementId: selectedElementId },
        { local: true }
      );
      // 清除选中状态
      set({ selectedElementId: null });
    }
  },

  /**
   * 撤销上一个操作
   * 从撤销栈中取出一个操作并应用其逆向操作
   * @param boardId 白板ID，确保操作在正确的白板上下文中执行
   */
  undo: (boardId) => {
    const { undoStack } = get();
    if (undoStack.length === 0) return; // 无操作可撤销

    const entry = undoStack[undoStack.length - 1];

    set(
      produce((draft: State) => {
        // 应用逆向操作
        const inverse = entry.inverse;
        switch (inverse.type) {
          case "add":
            // 逆向删除操作：重新添加元素
            draft.elements[inverse.element.id] = inverse.element;
            break;
          case "update":
            // 逆向更新操作：恢复原始值
            if (draft.elements[inverse.elementId]) {
              Object.assign(draft.elements[inverse.elementId], inverse.changes);
            }
            break;
          case "delete":
            // 逆向添加操作：删除元素
            delete draft.elements[inverse.elementId];
            break;
          case "clear":
            // 逆向清空操作：清空元素
            draft.elements = {};
            break;
        }

        // 将操作从撤销栈移到重做栈
        draft.undoStack.pop();
        draft.redoStack.push(entry);
      })
    );

    // 确保逆向操作使用正确的 boardId 并发送到其他客户端同步
    const syncedInverse = { ...entry.inverse, boardId };
    sendOperation(syncedInverse);
  },

  /**
   * 重做上一个撤销的操作
   * 从重做栈中取出一个操作并重新应用
   * @param boardId 白板ID，确保操作在正确的白板上下文中执行
   */
  redo: (boardId) => {
    const { redoStack } = get();
    if (redoStack.length === 0) return; // 无操作可重做

    const entry = redoStack[redoStack.length - 1];

    set(
      produce((draft: State) => {
        // 应用原始操作
        const op = entry.operation;
        switch (op.type) {
          case "add":
            draft.elements[op.element.id] = op.element;
            break;
          case "update":
            if (draft.elements[op.elementId]) {
              Object.assign(draft.elements[op.elementId], op.changes);
            }
            break;
          case "delete":
            delete draft.elements[op.elementId];
            break;
          case "clear":
            draft.elements = {};
            break;
        }

        // 将操作从重做栈移到撤销栈
        draft.redoStack.pop();
        draft.undoStack.push(entry);
      })
    );

    // 确保原始操作使用正确的 boardId 并发送到其他客户端同步
    const syncedOperation = { ...entry.operation, boardId };
    sendOperation(syncedOperation);
  },

  /**
   * 检查是否可以撤销
   * @returns 撤销栈是否非空
   */
  canUndo: () => get().undoStack.length > 0,

  /**
   * 检查是否可以重做
   * @returns 重做栈是否非空
   */
  canRedo: () => get().redoStack.length > 0,
}));
