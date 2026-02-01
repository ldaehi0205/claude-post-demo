---
name: db-migration
description: Prisma 스키마를 수정하고 DB 마이그레이션을 실행합니다. 테이블 추가, 필드 변경 시 사용합니다.
disable-model-invocation: true
---

# Prisma DB 마이그레이션

## 마이그레이션 절차

### 1. 스키마 수정

`prisma/schema.prisma` 파일 수정

### 2. 마이그레이션 생성 및 적용

```bash
npx prisma migrate dev --name 변경_내용_설명
```

### 3. 검증

```bash
npx prisma studio
```

localhost:5555에서 데이터베이스 확인

### 4. Prisma Client 재생성 (필요시)

```bash
npx prisma generate
```

## 일반적인 마이그레이션 예시

### 새 모델 추가

```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String   @db.Text
  postId    Int
  authorId  Int
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

### 필드 추가

```prisma
model Post {
  // 기존 필드...
  viewCount Int @default(0)  // 새 필드
}
```

## 주의사항

- 프로덕션 데이터 백업 필수
- 필드 삭제 시 데이터 손실 주의
- nullable 또는 @default 없이 필드 추가 시 기존 데이터 문제 발생

## 롤백

```bash
npx prisma migrate resolve --rolled-back "migration_name"
```
