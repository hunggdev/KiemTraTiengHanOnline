import { useState, useEffect } from 'react'
import { AdminTestFeature } from './features/admin-test/index.tsx'
import { UserTestFeature } from './features/user-test/index.tsx'
import { AuthPage } from './features/auth/AuthPage.tsx'
import { useAuthStore } from './stores/useAuthStore.ts'
import { Shield, GraduationCap, LogOut, Loader2 } from 'lucide-react'
import { Button } from './components/ui/button.tsx'
import { Badge } from './components/ui/badge.tsx'

function App() {
  const { user, isAuthenticated, isLoading, checkAuth, signOut } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student')

  // Kiểm tra phiên đăng nhập khi khởi động
  useEffect(() => {
    checkAuth().then((userData) => {
      if (userData) {
        setActiveTab(userData.role === 'TEACHER' ? 'admin' : 'student')
      }
    })
  }, [])

  const handleAuthSuccess = (loggedUser: any) => {
    // Tự động điều hướng theo ROLE sau khi đăng nhập / đăng ký
    if (loggedUser.role === 'TEACHER') {
      setActiveTab('admin')
    } else {
      setActiveTab('student')
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header with User Info & Sign Out */}
      <nav className="border-b bg-card px-4 py-2.5 shadow-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              KT
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">
              Hệ thống Kiểm Tra Online
            </span>
          </div>

          {/* Role Navigation Buttons (nếu là giáo viên có thể chuyển tab) */}
          {isTeacher ? (
            <div className="flex items-center p-1 rounded-xl bg-muted border">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                Quản trị đề thi
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Làm bài (Học sinh)
              </button>
            </div>
          ) : (
            <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 bg-primary/5 text-primary border-primary/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Giao diện làm bài
            </Badge>
          )}

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
              onClick={() => signOut()}
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Feature View */}
      <div className="flex-1">
        {activeTab === 'admin' && isTeacher ? (
          <AdminTestFeature />
        ) : (
          <UserTestFeature />
        )}
      </div>
    </div>
  )
}

export default App
