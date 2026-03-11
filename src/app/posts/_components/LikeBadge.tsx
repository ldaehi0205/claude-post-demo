interface LikeBadgeProps {
  likeCount: number;
}

export function LikeBadge({ likeCount }: LikeBadgeProps) {
  return (
    <span className={`flex items-center gap-0.5 ${likeCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
      ♥ {likeCount}
    </span>
  );
}
