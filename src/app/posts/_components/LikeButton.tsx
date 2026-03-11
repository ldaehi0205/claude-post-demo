'use client';

import { useState } from 'react';
import { usePostLike } from '@/hooks/usePostLike';

interface LikeButtonProps {
  postId: number;
  likeCount: number;
  isLiked: boolean;
  isLoggedIn: boolean;
}

export function LikeButton({ postId, likeCount, isLiked, isLoggedIn }: LikeButtonProps) {
  const { mutate, isPending } = usePostLike(postId);
  const [toast, setToast] = useState(false);

  const handleClick = () => {
    if (!isLoggedIn) {
      setToast(true);
      setTimeout(() => setToast(false), 2000);
      return;
    }
    mutate({ isLiked, likeCount });
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isLiked}
        aria-label={isLiked ? '좋아요 취소' : '좋아요'}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border transition-colors
          ${isLiked
            ? 'border-red-300 bg-red-50 text-red-500'
            : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
          }
          ${isPending ? 'opacity-70 pointer-events-none' : ''}
        `}
      >
        <span className="text-lg">{isLiked ? '♥' : '♡'}</span>
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
      {toast && (
        <p className="absolute top-full mt-1 text-xs text-red-500 whitespace-nowrap">
          로그인이 필요합니다
        </p>
      )}
    </div>
  );
}
