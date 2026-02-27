export function PostListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="h-9 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 text-sm text-gray-500 whitespace-nowrap">
            <th className="py-3 px-2 w-10 text-center">
              <div className="w-4 h-4 bg-gray-100 rounded mx-auto" />
            </th>
            <th className="py-3 px-2 w-16 text-center">번호</th>
            <th className="py-3 px-4 text-left">제목</th>
            <th className="py-3 px-4 w-28 text-center">작성자</th>
            <th className="py-3 px-4 w-32 text-center">작성일</th>
            <th className="py-3 px-2 w-16 text-center">조회</th>
            <th className="py-3 px-2 w-16 text-center">댓글</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 px-2 text-center">
                <div className="w-4 h-4 bg-gray-100 rounded mx-auto animate-pulse" />
              </td>
              <td className="py-3 px-2 text-center">
                <div className="h-4 w-8 bg-gray-100 rounded mx-auto animate-pulse" />
              </td>
              <td className="py-3 px-4">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="flex gap-1 mt-2">
                  <div className="h-4 w-12 bg-gray-50 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-gray-50 rounded animate-pulse" />
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <div className="h-4 w-14 bg-gray-100 rounded mx-auto animate-pulse" />
              </td>
              <td className="py-3 px-4 text-center">
                <div className="h-4 w-20 bg-gray-100 rounded mx-auto animate-pulse" />
              </td>
              <td className="py-3 px-2 text-center">
                <div className="h-4 w-8 bg-gray-100 rounded mx-auto animate-pulse" />
              </td>
              <td className="py-3 px-2 text-center">
                <div className="h-4 w-8 bg-gray-100 rounded mx-auto animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
