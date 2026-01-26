import Link from 'next/link';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {post.title}
        </h2>
        <p className="text-gray-600 line-clamp-2">{post.content}</p>
        <p className="text-sm text-gray-400 mt-2">
          {post.author.name} / {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
