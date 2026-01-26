import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/data/prisma';
import { signToken } from '@/utils/jwt';
import { LoginInput } from '@/types/auth';

export async function POST(request: Request) {
  const body: LoginInput = await request.json();
  const { userID, password } = body;

  console.log(body, 'user');
  const user = await prisma.user.findUnique({
    where: { userID },
  });
  console.log(user, 'user');
  if (!user) {
    return NextResponse.json(
      { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    );
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return NextResponse.json(
      { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    );
  }

  const accessToken = signToken({ userId: user.id, userID: user.userID });

  return NextResponse.json({
    user: {
      id: user.id,
      userID: user.userID,
      name: user.name,
      createdAt: user.createdAt,
    },
    accessToken,
  });
}
