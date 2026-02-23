# Task Completion Checklist

작업 완료 시 다음을 수행:

1. **테스트 통과 확인**: `npm test` 실행하여 모든 단위/통합 테스트 통과 확인
2. **린트 확인**: `npm run lint` 실행
3. **코드 리뷰**: `.claude/skills/review-code/SKILL.md` 체크리스트 적용
4. **커밋 분리**: 구조적 변경(refactor)과 행위적 변경(feat/fix) 별도 커밋
5. **커밋 메시지**: 한국어로 작성, `<타입>: <제목>` 형식
6. **문서 업데이트** (필요 시):
   - API 변경 → `docs/API.md` 업데이트
   - 시스템 변경 → `CLAUDE.md` 업데이트
7. **push는 사용자가 명시적으로 요청할 때만**

## 사소한 변경 시 (비즈니스 로직/API/보안 변경 없음)
- TDD 사이클과 문서화 생략 가능
