import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold mb-4">Welcome to Too Many Subscriptions</h1>
      <p className="text-lg mb-8">Track and manage your subscriptions in one calm place.</p>
      <div className="space-x-4">
        <Link href="/login" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
          Login
        </Link>
        <Link href="/register" className="px-4 py-2 bg-secondary text-base rounded hover:bg-secondary-dark">
          Register
        </Link>
      </div>
    </div>
  );
}