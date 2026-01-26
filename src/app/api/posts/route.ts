import { NextResponse } from 'next/server'
import { prisma } from '@/data/prisma'
import { CreatePostInput } from '@/types/post'

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const body: CreatePostInput = await request.json()
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
