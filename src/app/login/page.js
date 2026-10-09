import Image from "next/image";
import BrandMark from "@/components/game/BrandMark";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Login | B2B Logistics" };

export default function LoginPage() {
  return (
    <main className="relative isolate min-h-dvh w-full overflow-hidden bg-navy-950">
      {/* Full-page background: the image alone provides the visual design */}
      <Image
        src="/images/login-truck.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      {/* Subtle navy overlay for form readability; heavier only toward the right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,10,24,0.12),rgba(2,10,24,0.2),rgba(2,10,24,0.55))]"
      />

      <div className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:justify-end lg:pr-20 xl:pr-28">
        <div className="animate-fade-up w-full max-w-107.5">
          <div className="mb-6 flex justify-center">
            <BrandMark center size="lg" subtitle />
          </div>
          <div className="rounded-[20px] app-border app-border-subtle bg-[rgba(7,23,42,0.88)] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-9">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-ink">Welcome Back</h1>
              <p className="mt-1 text-sm text-ink-dim">Login to continue your training journey</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
