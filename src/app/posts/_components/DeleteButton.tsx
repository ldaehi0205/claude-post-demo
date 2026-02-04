'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useDeletePost } from '@/hooks/usePosts';

const DeleteButton = ({
  ids,
  clearSelectPost,
}: {
  ids: number[];
  clearSelectPost: () => void;
}) => {
  const router = useRouter();
  const deletePost = useDeletePost();

  const handleDelete = async () => {
    try {
      if (ids.length === 0) return alert('삭제할 게시글을 선택해 주세요.');
      if (confirm('정말 삭제하시겠습니까?')) {
        await deletePost.mutateAsync(ids);
        clearSelectPost();
        router.refresh();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Button variant="danger" onClick={handleDelete}>
      삭제
    </Button>
  );
};

export default DeleteButton;
