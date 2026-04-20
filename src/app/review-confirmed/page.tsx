import Link from 'next/link';

export const metadata = {
  title: 'Review confirmed — Rub Ratings',
  robots: { index: false },
};

export default function ReviewConfirmedPage() {
  return (
    <main className="min-h-screen bg-[#F5EDD6] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-5">
        <div className="text-5xl">✓</div>
        <h1 className="font-serif text-3xl font-bold text-[#C4513A]">
          Email confirmed!
        </h1>
        <p className="text-[#1A1A1A] leading-relaxed">
          Your review is now in our moderation queue. We typically approve
          reviews within 24 hours. You&apos;ll receive an email once it&apos;s live.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[#C4513A] text-[#F5EDD6]
                     font-semibold px-8 py-3 text-sm hover:bg-[#a83e2a] transition-colors"
        >
          Back to Rub Ratings
        </Link>
      </div>
    </main>
  );
}
