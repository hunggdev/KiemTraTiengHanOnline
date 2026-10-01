import { useEffect } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { AdminTestFeature } from './features/admin-test/index.tsx'
import { UserTestFeature } from './features/user-test/index.tsx'
import { FlashcardFeature } from './features/flashcards/index.tsx'
import { JapaneseAIChatPage, FloatingAIChatWidget } from './features/ai-tutor/index.tsx'
import { AuthPage } from './features/auth/AuthPage.tsx'
import { useAuthStore } from './stores/useAuthStore.ts'
import { Shield, GraduationCap, Languages, LogOut, Loader2, Sparkles } from 'lucide-react'
import { Button } from './components/ui/button.tsx'
import { KoreanWordInspector } from './components/KoreanWordInspector.tsx'
import { useFlashcardStore } from './stores/useFlashcardStore.ts'

function App() {
  const { user, isAuthenticated, isLoading, checkAuth, signOut } = useAuthStore()
  const { fetchCloudDecks } = useFlashcardStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Kiểm tra phiên đăng nhập & tải dữ liệu Cloud Flashcard khi khởi động
  useEffect(() => {
    checkAuth()
    fetchCloudDecks()
  }, [checkAuth, fetchCloudDecks])

  const handleAuthSuccess = (loggedUser: any) => {
    // Nếu trước đó đang mở 1 route cụ thể (không phải trang chủ), giữ nguyên route đó
    const isTargetValid =
      location.pathname !== '/' &&
      location.pathname !== '/login' &&
      !location.pathname.startsWith('/auth')

    if (isTargetValid) {
      navigate(location.pathname + location.search, { replace: true })
    } else {
      navigate(loggedUser.role === 'TEACHER' ? '/admin' : '/student', { replace: true })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang kiểm tra trạng thái đăng nhập…</p>
      </div>
    )
  }

  // Nếu chưa đăng nhập -> hiển thị trang Sign In / Sign Up
  if (!isAuthenticated || !user) {
    return <AuthPage onSuccess={handleAuthSuccess} />
  }

  const isTeacher = user.role === 'TEACHER'

  // Xác định tab đang active dựa theo URL hiện tại (giúp highlight đúng khi back/forward)
  const getActiveTab = (): 'student' | 'admin' | 'flashcards' | 'ai-chat' => {
    const path = location.pathname
    if (path.startsWith('/admin')) return 'admin'
    if (path.startsWith('/flashcards')) return 'flashcards'
    if (path.startsWith('/ai-chat')) return 'ai-chat'
    if (path.startsWith('/student') || path.startsWith('/tests')) return 'student'
    return isTeacher ? 'admin' : 'student'
  }

  const activeTab = getActiveTab()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header with User Info & Sign Out */}
      <nav className="border-b bg-card px-4 py-2.5 shadow-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <div
            onClick={() => navigate(isTeacher ? '/admin' : '/student')}
            className="flex items-center gap-2 cursor-pointer select-none"
            title="Về trang chủ"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              KT
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">
              Hệ thống Kiểm Tra & Flashcard
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-muted border">
            {isTeacher && (
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Quản trị</span> đề thi
              </button>
            )}

            <button
              onClick={() => navigate('/student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Làm bài thi
            </button>

            <button
              onClick={() => navigate('/flashcards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-background text-primary font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-primary" />
              Học Flashcard
            </button>

            <button
              onClick={() => navigate('/ai-chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ai-chat'
                  ? 'bg-background text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Trợ lý AI</span>
            </button>
          </div>

          {/* User Profile & Sign Out Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-foreground leading-tight">
                {user.fullName}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isTeacher ? 'Giáo viên' : 'Học sinh'} (@{user.username})
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Feature View with React Router */}
      <div className="flex-1">
        <Routes>
          {/* Root: chuyển hướng theo vai trò */}
          <Route
            path="/"
            element={<Navigate to={isTeacher ? '/admin' : '/student'} replace />}
          />

          {/* Quản trị viên: Quản lý đề thi, thống kê, chấm bài */}
          <Route
            path="/admin/*"
            element={
              isTeacher ? <AdminTestFeature /> : <Navigate to="/student" replace />
            }
          />

          {/* Học sinh: Làm bài thi và xem kết quả */}
          <Route path="/student/*" element={<UserTestFeature />} />
          <Route path="/tests/*" element={<Navigate to="/student" replace />} />

          {/* Học từ vựng Flashcard SRS */}
          <Route path="/flashcards/*" element={<FlashcardFeature />} />

          {/* Trợ lý AI */}
          <Route path="/ai-chat" element={<JapaneseAIChatPage />} />

          {/* Catch-all: chuyển về trang chủ theo vai trò */}
          <Route
            path="*"
            element={<Navigate to={isTeacher ? '/admin' : '/student'} replace />}
          />
        </Routes>
      </div>

      {/* Floating AI Assistant Widget (hiển thị khi không ở tab AI chính) */}
      {activeTab !== 'ai-chat' && (
        <FloatingAIChatWidget onOpenFullTab={() => navigate('/ai-chat')} />
      )}

      {/* Tra cứu nhanh ngữ cảnh & 1-Click lưu vào Flashcard cá nhân */}
      <KoreanWordInspector />
    </div>
  )
}

export default App
