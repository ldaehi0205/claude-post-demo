import Link from 'next/link';
import { PostList } from '@/components/posts/PostList';
import { Button } from '@/components/ui/Button';

export default function PostsPage() {
  return (
    <div>
      <PostList />
    </div>
  );
}
