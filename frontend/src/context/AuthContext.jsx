import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return {
        ...initialState,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    case 'AUTH_LOADED':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: 'AUTH_LOADED' });
      return;
    }
    // Decode JWT to get user info (payload is base64url in the middle segment)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      dispatch({
        type: 'SET_USER',
        payload: { id: payload.id, role: payload.role, username: payload.username || 'User' },
      });
    } catch {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const login = useCallback((user, token) => {
    localStorage.setItem('token', token);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token },
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = {
    ...state,
    login,
    logout,
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}