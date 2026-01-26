import { PostDetail } from '@/components/posts/PostDetail'

interface Props {
  params: { id: string }
}

export default function PostDetailPage({ params }: Props) {
  return <PostDetail id={Number(params.id)} />
}
