'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/apis/auth';
import { LoginInput, RegisterInput } from '@/types/auth';

const AUTH_KEY = ['auth', 'me'];

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_KEY,
    queryFn: authApi.me,
    retry: false,
    enabled:
      typeof window !== 'undefined' && !!localStorage.getItem('accessToken'),
  });

  const isAuthenticated = !!user;

  return { user, isLoading, isAuthenticated };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: data => {
      localStorage.setItem('accessToken', data.accessToken);
      queryClient.setQueryData(AUTH_KEY, data.user);
      router.push('/posts');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: data => {
      localStorage.setItem('accessToken', data.accessToken);
      queryClient.setQueryData(AUTH_KEY, data.user);
      router.push('/posts');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    localStorage.removeItem('accessToken');
    queryClient.setQueryData(AUTH_KEY, null);
    queryClient.clear();
    router.push('/posts');
  };

  return { logout };
}
