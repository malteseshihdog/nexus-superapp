import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Project, CreateProjectInput } from '../../../shared/src/types/project.types';
import { projectEndpoints } from '../../../shared/src/api/endpoints';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,
};

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (page: number, { rejectWithValue }) => {
  try {
    const res = await projectEndpoints.listProjects(page);
    return res.data;
  } catch (err) {
    return rejectWithValue((err as { message: string }).message);
  }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id: string, { rejectWithValue }) => {
  try {
    const res = await projectEndpoints.getProject(id);
    return res.data;
  } catch (err) {
    return rejectWithValue((err as { message: string }).message);
  }
});

export const createProject = createAsyncThunk('projects/create', async (input: CreateProjectInput, { rejectWithValue }) => {
  try {
    const res = await projectEndpoints.createProject(input);
    return res.data;
  } catch (err) {
    return rejectWithValue((err as { message: string }).message);
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id: string, { rejectWithValue }) => {
  try {
    await projectEndpoints.deleteProject(id);
    return id;
  } catch (err) {
    return rejectWithValue((err as { message: string }).message);
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    selectProject(state, action: PayloadAction<Project | null>) {
      state.selectedProject = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.meta.arg === 1
          ? action.payload.data
          : [...state.projects, ...action.payload.data];
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchProjects.rejected, (state, action: PayloadAction<unknown>) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to load projects';
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.selectedProject = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload) state.selectedProject = null;
      });
  },
});

export const { selectProject, clearError } = projectSlice.actions;
export default projectSlice.reducer;
