import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchProjects, createProject as createAction } from '../store/projectSlice';
import type { CreateProjectInput } from '../../../shared/src/types/project.types';

export function useProjects() {
  const dispatch = useAppDispatch();
  const { projects, isLoading, error, hasMore, page } = useAppSelector((s) => s.projects);

  const refresh = useCallback(() => {
    dispatch(fetchProjects(1));
  }, [dispatch]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      dispatch(fetchProjects(page + 1));
    }
  }, [dispatch, isLoading, hasMore, page]);

  const createProject = useCallback(
    (input?: Partial<CreateProjectInput>) => {
      const defaults: CreateProjectInput = {
        name: `Project ${Date.now()}`,
        language: 'typescript',
        isPublic: false,
        ...input,
      };
      return dispatch(createAction(defaults));
    },
    [dispatch]
  );

  return { projects, isLoading, error, hasMore, refresh, loadMore, createProject };
}
