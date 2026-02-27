import { PostListSkeleton } from './_components/PostListSkeleton';

const SKELETON_TAG_COUNT = 3;

export default function PostsLoading() {
  return (
    <div className="flex gap-6">
      <aside className="w-56 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="h-6 bg-gray-100 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: SKELETON_TAG_COUNT }, (_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <PostListSkeleton />
      </div>
    </div>
  );
}
