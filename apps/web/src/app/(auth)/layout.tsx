export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0e0e10] p-5">
      {children}
    </div>
  );
}
