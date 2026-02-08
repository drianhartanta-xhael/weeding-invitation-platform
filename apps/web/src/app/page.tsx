import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Wedding Invitation Platform
        </h1>
        <p className="text-gray-600 mb-8">
          Create beautiful wedding invitations for your clients
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-block px-6 py-3 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
