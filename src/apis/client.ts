import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 쿠키 전송을 위해 필요
});

// 토큰 갱신 상태 관리
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 대기 중인 요청들에게 새 토큰 전달
function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// 토큰 갱신 대기 큐에 요청 추가
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// 로그아웃 처리
function logout() {
  localStorage.removeItem('accessToken');
  window.location.replace('/login');
}

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ error: string; code: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = error.response?.data?.code;

    // 401 에러 처리
    if (status === 401) {
      // expired_token인 경우에만 refresh 시도
      if (code === 'expired_token' && !originalRequest._retry) {
        // 이미 refresh 중인 경우 대기 큐에 추가
        if (isRefreshing) {
          return new Promise(resolve => {
            addRefreshSubscriber((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // refresh 호출
          const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
          const { accessToken } = response.data;

          // 새 토큰 저장
          localStorage.setItem('accessToken', accessToken);

          // 대기 중인 요청들에게 새 토큰 전달
          onRefreshed(accessToken);

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // refresh 실패 시 로그아웃
          logout();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // expired_token이 아닌 401 에러는 로그아웃
      logout();
      return Promise.reject(error);
    }

    // 401 외 에러는 alert 표시
    const message = error.response?.data?.error || '요청 처리 중 오류가 발생했습니다.';
    alert(message);

    return Promise.reject(error);
  },
);
