const SKELETON_ROW_COUNT = 3;

export function PostSkeletonRows() {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <tr key={i} className="border-b border-gray-100">
          <td className="py-3 px-2 text-center">
            <div className="w-4 h-4 bg-gray-100 rounded mx-auto animate-pulse" />
          </td>
          <td className="py-3 px-2 text-center">
            <div className="h-4 w-8 bg-gray-100 rounded mx-auto animate-pulse" />
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
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
    </>
  );
}
