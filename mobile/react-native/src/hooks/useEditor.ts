import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  openFile as openAction,
  closeFile as closeAction,
  setActiveFile as setActiveAction,
  updateContent as updateAction,
  markSaved,
} from '../store/editorSlice';
import { fileEndpoints } from '../../../shared/src/api/endpoints';

export function useEditor(projectId: string) {
  const dispatch = useAppDispatch();
  const { openFiles, activeFileId, fileContents } = useAppSelector((s) => s.editor);

  const openFile = useCallback(
    async (fileId: string, filePath: string) => {
      if (fileContents[fileId] !== undefined) {
        dispatch(openAction({ id: fileId, label: filePath.split('/').pop() ?? filePath, content: fileContents[fileId] }));
        return;
      }
      try {
        const res = await fileEndpoints.getFile(projectId, fileId);
        dispatch(openAction({ id: fileId, label: res.data.name, content: res.data.content ?? '' }));
      } catch {
        dispatch(openAction({ id: fileId, label: filePath.split('/').pop() ?? filePath, content: '' }));
      }
    },
    [dispatch, projectId, fileContents]
  );

  const closeFile = useCallback((fileId: string) => dispatch(closeAction(fileId)), [dispatch]);
  const setActiveFile = useCallback((fileId: string) => dispatch(setActiveAction(fileId)), [dispatch]);
  const updateContent = useCallback(
    (fileId: string, content: string) => dispatch(updateAction({ id: fileId, content })),
    [dispatch]
  );

  const saveFile = useCallback(
    async (fileId: string) => {
      const content = fileContents[fileId];
      if (content === undefined) return;
      try {
        await fileEndpoints.updateFile(projectId, fileId, {
          fileId,
          path: '',
          content,
          changeType: 'update',
          timestamp: new Date().toISOString(),
        });
        dispatch(markSaved(fileId));
      } catch {
        // leave as dirty so user can retry
      }
    },
    [dispatch, projectId, fileContents]
  );

  const getFileContent = useCallback((fileId: string) => fileContents[fileId] ?? '', [fileContents]);

  return { openFiles, activeFileId, openFile, closeFile, setActiveFile, saveFile, getFileContent, updateContent };
}
