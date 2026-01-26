import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/data/prisma';
import { signToken } from '@/utils/jwt';
import { RegisterInput } from '@/types/auth';

export async function POST(request: Request) {
  const body: RegisterInput = await request.json();
  const { userID, password, name } = body;

  const existingUser = await prisma.user.findUnique({
    where: { userID },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: '이미 사용 중인 아이디입니다.' },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      userID,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      userID: true,
      name: true,
      createdAt: true,
    },
  });

  const accessToken = signToken({ userId: user.id, userID: user.userID });

  return NextResponse.json({ user, accessToken }, { status: 201 });
}
