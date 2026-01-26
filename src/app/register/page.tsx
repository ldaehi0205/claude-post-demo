'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const [userID, setUserID] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ userID, password, name });
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="이름"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <Input
          label="아이디"
          type="text"
          value={userID}
          onChange={e => setUserID(e.target.value)}
          required
        />
        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {register.error && (
          <p className="text-red-500 text-sm">
            회원가입에 실패했습니다. 다시 시도해주세요.
          </p>
        )}
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? '가입 중...' : '회원가입'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        이미 계정이 있으신가요?
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
