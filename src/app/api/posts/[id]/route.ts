import { NextResponse } from 'next/server'
import { prisma } from '@/data/prisma'
import { UpdatePostInput } from '@/types/post'

interface Params {
  params: { id: string }
}

export async function GET(request: Request, { params }: Params) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: Params) {
  const body: UpdatePostInput = await request.json()

  const post = await prisma.post.update({
    where: { id: Number(params.id) },
    data: body,
  })

  return NextResponse.json(post)
}

export async function DELETE(request: Request, { params }: Params) {
  await prisma.post.delete({
    where: { id: Number(params.id) },
  })

  return NextResponse.json({ message: 'Post deleted' })
}
