import { NextResponse } from 'next/server';

import { reportErrorToLinear } from '@/utils/linear';

interface ErrorBody {
  error: string;
  code: string;
}

/**
 * API 에러 응답을 생성하면서 Linear에 Bug 이슈를 비동기로 보고합니다.
 * 기존 NextResponse.json({ error, code }, { status }) 패턴을 대체합니다.
 */
export function errorResponse(
  request: Request,
  body: ErrorBody,
  status: number,
): NextResponse {
  if (status >= 400) {
    reportErrorToLinear({
      method: request.method,
      url: request.url,
      status,
      errorMessage: body.error,
      errorCode: body.code,
    }).catch(() => {});
  }

  return NextResponse.json(body, { status });
}
