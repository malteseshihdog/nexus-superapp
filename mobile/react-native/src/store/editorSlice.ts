import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tab } from '../components/Tabs';

interface EditorState {
  openFiles: Tab[];
  activeFileId: string | null;
  fileContents: Record<string, string>;
  dirtyFiles: Set<string>;
  pendingChanges: number;
}

// NOTE: Set is not serialisable by Redux Toolkit default middleware.
// We serialise dirtyFiles as a string array in the store and convert on access.
interface SerializableEditorState {
  openFiles: Tab[];
  activeFileId: string | null;
  fileContents: Record<string, string>;
  dirtyFileIds: string[];
  pendingChanges: number;
}

const initialState: SerializableEditorState = {
  openFiles: [],
  activeFileId: null,
  fileContents: {},
  dirtyFileIds: [],
  pendingChanges: 0,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    openFile(state, action: PayloadAction<{ id: string; label: string; content: string }>) {
      const { id, label, content } = action.payload;
      if (!state.openFiles.find((f) => f.id === id)) {
        state.openFiles.push({ id, label });
      }
      state.activeFileId = id;
      if (state.fileContents[id] === undefined) {
        state.fileContents[id] = content;
      }
    },
    closeFile(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.openFiles = state.openFiles.filter((f) => f.id !== id);
      delete state.fileContents[id];
      state.dirtyFileIds = state.dirtyFileIds.filter((d) => d !== id);
      state.pendingChanges = Math.max(0, state.pendingChanges - 1);
      if (state.activeFileId === id) {
        state.activeFileId = state.openFiles[state.openFiles.length - 1]?.id ?? null;
      }
    },
    setActiveFile(state, action: PayloadAction<string>) {
      state.activeFileId = action.payload;
    },
    updateContent(state, action: PayloadAction<{ id: string; content: string }>) {
      const { id, content } = action.payload;
      state.fileContents[id] = content;
      if (!state.dirtyFileIds.includes(id)) {
        state.dirtyFileIds.push(id);
        state.pendingChanges += 1;
      }
      const tab = state.openFiles.find((f) => f.id === id);
      if (tab) tab.isDirty = true;
    },
    markSaved(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.dirtyFileIds = state.dirtyFileIds.filter((d) => d !== id);
      state.pendingChanges = Math.max(0, state.pendingChanges - 1);
      const tab = state.openFiles.find((f) => f.id === id);
      if (tab) tab.isDirty = false;
    },
  },
});

export const { openFile, closeFile, setActiveFile, updateContent, markSaved } = editorSlice.actions;
export default editorSlice.reducer;
