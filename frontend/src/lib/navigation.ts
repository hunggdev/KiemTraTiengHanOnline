import { useNavigate } from "react-router-dom";

/**
 * Custom hook hỗ trợ điều hướng thông minh theo lịch sử duyệt trang (Browser History).
 * - Nếu có lịch sử duyệt trong ứng dụng (idx > 0): gọi navigate(-1) để quay về trang trước đó.
 * - Nếu là trang đầu tiên (mở trực tiếp từ link mới): chuyển hướng an toàn về fallbackPath.
 */
export function useSmartNavigate() {
  const navigate = useNavigate();

  const goBack = (fallbackPath: string = "/") => {
    if (
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state.idx === "number" &&
      window.history.state.idx > 0
    ) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return { navigate, goBack };
}
