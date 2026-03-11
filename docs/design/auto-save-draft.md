---
idea_ref: docs/ideas/2026-03-12-auto-save-draft.md
date: 2026-03-12
status: designed
feature_slug: auto-save-draft
---

# 게시글 작성 자동저장 (임시저장) UI 설계 명세

## 영향 범위

- 수정 파일:
  - `src/app/posts/_components/PostForm.tsx`
- 신규 파일:
  - `src/app/posts/_components/DraftRestoreModal.tsx`
  - `src/app/posts/_components/AutoSaveIndicator.tsx`
  - `src/hooks/useDraftAutoSave.ts`

## 컴포넌트 트리

```
PostForm (수정 - Client Component)
├── AutoSaveIndicator (신규)         ← 폼 헤더 우측 상단
├── Input (재사용) — 제목 입력
├── MarkdownEditor (재사용) — 내용 입력
├── 태그 입력 영역 (기존 인라인)
├── SubmitButtons (재사용)
│   └── Button "임시저장 삭제" (신규 추가)
└── DraftRestoreModal (신규)         ← 페이지 진입 시 조건부 렌더링
    ├── 제목 미리보기 텍스트
    ├── 내용 미리보기 텍스트 (최대 3줄)
    ├── Button "복원하기" (재사용)
    └── Button "삭제하고 새로 작성" (재사용, variant="secondary")
```

## 컴포넌트 명세

### AutoSaveIndicator

- **경로**: `src/app/posts/_components/AutoSaveIndicator.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

  interface AutoSaveIndicatorProps {
    status: AutoSaveStatus;
    savedAt: Date | null;
  }
  ```
- **레이아웃**:
  - `flex items-center gap-1.5 text-xs text-gray-400` — 인라인 수평 배치
  - status가 `'saved'`일 때: 체크 아이콘(12px) + "자동저장됨 HH:MM" 텍스트 (`text-green-500`)
  - status가 `'saving'`일 때: 스피너 아이콘(12px, `animate-spin`) + "저장 중..." 텍스트
  - status가 `'error'`일 때: 경고 아이콘(12px) + "저장 실패" 텍스트 (`text-red-400`)
  - status가 `'idle'`일 때: 아무것도 렌더링하지 않음 (null 반환)
  - 시간 포맷: `HH:MM` (24시간제, `Date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })`)
- **상태/이벤트**: 없음 (순수 표시 컴포넌트)

---

### DraftRestoreModal

- **경로**: `src/app/posts/_components/DraftRestoreModal.tsx`
- **타입**: Client Component
- **Props**:
  ```typescript
  interface DraftData {
    title: string;
    content: string;
    tags: string[];
    savedAt: string; // ISO string
  }

  interface DraftRestoreModalProps {
    draft: DraftData;
    onRestore: (draft: DraftData) => void;
    onDiscard: () => void;
  }
  ```
- **레이아웃**:
  - 모달 오버레이: `fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4`
  - 모달 박스: `bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4`
  - 헤더: `text-base font-semibold text-gray-900` — "임시저장된 글이 있습니다"
  - 저장 시각: `text-xs text-gray-400` — "저장 시각: YYYY. MM. DD HH:MM"
  - 미리보기 영역: `border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-1`
    - 제목: `text-sm font-medium text-gray-800 truncate`
    - 내용: `text-xs text-gray-500 line-clamp-3`
  - 태그 목록: `flex flex-wrap gap-1` — 태그별 `text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded`
  - 버튼 영역: `flex gap-2 pt-2`
    - "복원하기": `Button variant="primary"` — flex-1
    - "삭제하고 새로 작성": `Button variant="secondary"` — flex-1
- **상태/이벤트**:
  - `onRestore` 클릭: 부모에 `draft` 데이터 전달 후 모달 닫힘
  - `onDiscard` 클릭: `localStorage.removeItem('post-draft')` 후 모달 닫힘

---

### useDraftAutoSave (커스텀 훅)

- **경로**: `src/hooks/useDraftAutoSave.ts`
- **타입**: Client Hook
- **시그니처**:
  ```typescript
  interface DraftData {
    title: string;
    content: string;
    tags: string[];
    savedAt: string;
  }

  interface UseDraftAutoSaveReturn {
    status: AutoSaveStatus;
    savedAt: Date | null;
    loadDraft: () => DraftData | null;
    clearDraft: () => void;
  }

  function useDraftAutoSave(
    title: string,
    content: string,
    tags: string[],
    enabled: boolean   // isEdit 모드에서는 false
  ): UseDraftAutoSaveReturn
  ```
- **동작**:
  - `useEffect` 내에서 `debounce(500ms)` 타이머로 localStorage 저장 (`post-draft` 키)
  - 저장 직전 `status = 'saving'`, 성공 후 `status = 'saved'` + `savedAt = new Date()`
  - 30초 인터벌 fallback 저장 (debounce 미발동 대비)
  - `loadDraft()`: `localStorage.getItem('post-draft')` → JSON.parse
  - `clearDraft()`: `localStorage.removeItem('post-draft')`
  - `enabled`가 false이면 아무 동작도 하지 않음 (수정 모드 제외)

---

### PostForm (수정)

- **경로**: `src/app/posts/_components/PostForm.tsx`
- **타입**: Client Component (기존 유지)
- **변경 사항**:
  ```typescript
  // 추가 상태
  const [title, setTitle] = useState(post?.title ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);

  // 추가 훅 사용
  const { status, savedAt, loadDraft, clearDraft } = useDraftAutoSave(
    title, content, tags, !isEdit
  );
  ```
- **레이아웃 변경**:
  - 폼 상단 헤더 영역 추가: `flex items-center justify-between mb-4`
    - 좌측: 폼 제목 텍스트 (있는 경우)
    - 우측: `<AutoSaveIndicator status={status} savedAt={savedAt} />`
  - SubmitButtons 하단에 "임시저장 삭제" 버튼 추가:
    ```
    {!isEdit && (
      <Button type="button" variant="secondary" onClick={clearDraft}>
        임시저장 삭제
      </Button>
    )}
    ```
- **이벤트**:
  - `handleSubmit` 호출 시 `clearDraft()` 추가 호출
  - 마운트 시(`useEffect`): `loadDraft()` 결과 있으면 `setPendingDraft`, `setShowRestoreModal(true)`

## 사용자 인터랙션 흐름

1. 사용자가 `/posts/new` 페이지에 진입한다.
2. `useDraftAutoSave`의 `loadDraft()`가 localStorage를 확인한다.
3. 임시저장 데이터가 있으면 `DraftRestoreModal`이 화면 중앙에 표시된다.
   - 3a. "복원하기" 클릭 → 제목·내용·태그 state에 draft 값 주입, 모달 닫힘
   - 3b. "삭제하고 새로 작성" 클릭 → `clearDraft()` 호출, 모달 닫힘, 빈 폼 유지
4. 사용자가 제목 또는 내용을 입력한다.
5. 500ms debounce 후 자동저장이 실행된다.
   - 폼 우측 상단에 "저장 중..." → "자동저장됨 HH:MM"으로 변경된다.
6. 사용자가 "작성" 버튼을 클릭하여 게시글을 발행한다.
7. 발행 성공 시 `clearDraft()`가 호출되어 localStorage 데이터가 제거된다.
8. 사용자가 "임시저장 삭제" 버튼을 클릭하면 즉시 `clearDraft()` 호출 + `AutoSaveIndicator`가 idle 상태로 전환된다.

## API 연동

- 없음 — 순수 클라이언트 localStorage 기반 구현
- 게시글 발행: 기존 `createPost` Server Action 재사용 (변경 없음)

## 구현 시 주의사항

- `isEdit` 모드(`PostForm`에 `post` prop이 전달된 경우)에서는 자동저장 비활성화. 수정 중인 게시글과 임시저장 데이터가 혼용되지 않도록 한다.
- `MarkdownEditor`가 controlled 모드를 지원하는지 확인 필요. 현재 `defaultValue` 기반이라면 `value` + `onChange` props 추가가 필요하다.
- `DraftRestoreModal`은 `createPortal`이 아닌 컴포넌트 내 조건부 렌더링으로 구현 (z-index `z-50` 사용).
- localStorage는 SSR 환경에서 접근 불가. `loadDraft()` 호출을 반드시 `useEffect` 내부에서 수행한다.
- 모바일에서 키보드 진입 시 모달이 가려지지 않도록 `items-start pt-20` 대안 고려.
- 접근성: `DraftRestoreModal`에 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 적용.
