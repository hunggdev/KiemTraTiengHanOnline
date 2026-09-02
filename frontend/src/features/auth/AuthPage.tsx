import { useState } from "react";
import {
  User,
  Lock,
  LogIn,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore.ts";
import type { UserDTO } from "@/types/auth.types.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface AuthPageProps {
  onSuccess?: (user: UserDTO) => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const { signIn, signUp } = useAuthStore();

  // Sign In Form State
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up Form State
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signInUsername.trim() || !signInPassword) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const user = await signIn({
        username: signInUsername.trim(),
        password: signInPassword,
      });

      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.fullName}`);
      setTimeout(() => {
        onSuccess?.(user);
      }, 500);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (
      !signUpFullName.trim() ||
      !signUpUsername.trim() ||
      !signUpPassword ||
      !signUpConfirmPassword
    ) {
      setErrorMsg("Vui lòng điền đầy đủ tất cả các trường");
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);
    try {
      const user = await signUp({
        fullName: signUpFullName.trim(),
        username: signUpUsername.trim(),
        password: signUpPassword,
      });

      setSuccessMsg("Đăng ký tài khoản Học sinh thành công!");
      setTimeout(() => {
        onSuccess?.(user);
      }, 700);
    } catch (err: any) {
      console.error("Sign up failed:", err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl border shadow-lg overflow-hidden">
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-card p-6 pb-4 text-center border-b">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Hệ thống Kiểm Tra Trực Tuyến
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Đăng nhập để làm bài hoặc quản lý đề thi
          </p>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted border mt-5">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === "signin"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === "signup"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
              Đăng ký
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {/* Notification Banners */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Sign In */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tên đăng nhập</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={signInUsername}
                    onChange={(e) => setSignInUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập..."
                    className="pl-10 h-10 rounded-xl text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="pl-10 h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl font-bold shadow-xs text-sm mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Đăng nhập
              </Button>
            </form>
          )}

          {/* Form: Sign Up (No role selector, defaults to STUDENT) */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs text-primary font-medium">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Tài khoản tạo mới mặc định có quyền <strong>Học sinh (STUDENT)</strong></span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Họ và tên</Label>
                <Input
                  type="text"
                  value={signUpFullName}
                  onChange={(e) => setSignUpFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="h-10 rounded-xl text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Tên đăng nhập</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="Tên đăng nhập (viết liền không dấu)"
                    className="pl-10 h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    className="pl-10 h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10 h-10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl font-bold shadow-xs text-sm mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Tạo tài khoản học sinh
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
