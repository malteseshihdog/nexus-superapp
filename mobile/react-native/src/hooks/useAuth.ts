import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { login as loginAction, register as registerAction, logout as logoutAction, clearError } from '../store/authSlice';
import type { LoginCredentials, RegisterCredentials } from '../../../shared/src/types/auth.types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const login = useCallback(
    (credentials: LoginCredentials) => dispatch(loginAction(credentials)),
    [dispatch]
  );

  const register = useCallback(
    (credentials: RegisterCredentials) => dispatch(registerAction(credentials)),
    [dispatch]
  );

  const logout = useCallback(() => dispatch(logoutAction()), [dispatch]);

  const resetError = useCallback(() => dispatch(clearError()), [dispatch]);

  return { user, isAuthenticated, isLoading, error, login, register, logout, resetError };
}
