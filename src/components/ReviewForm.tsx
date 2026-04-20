'use client';

import { useState } from 'react';

interface Props {
  venueDocumentId: string;
  venueName: string;
}

type Step = 'form' | 'submitted';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

export default function ReviewForm({ venueDocumentId, venueName }: Props) {
  const [step, setStep]     = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [stars, setStars]   = useState(0);
  const [hovered, setHovered] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrMsg('');

    const fd = new FormData(e.currentTarget);
    const body = {
      venueDocumentId,
      title:        fd.get('title'),
      content:      fd.get('content'),
      rating:       stars,
      authorName:   fd.get('authorName'),
      authorEmail:  fd.get('authorEmail'),
      visitDate:    fd.get('visitDate') || undefined,
      pricePaidAud: fd.get('pricePaidAud') || undefined,
    };

    if (!stars) {
      setErrMsg('Please select a star rating.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${STRAPI_URL}/api/reviews/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setErrMsg('You have already submitted a review for this venue recently. Please wait 24 hours.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrMsg(data?.error?.message ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setStep('submitted');
    } catch {
      setErrMsg('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'submitted') {
    return (
      <div className="rounded-xl border border-[#7A9E7E] bg-[#F5EDD6] p-8 text-center">
        <p className="text-2xl font-bold font-serif text-[#C4513A] mb-3">
          Almost there!
        </p>
        <p className="text-[#1A1A1A]">
          We&apos;ve sent a confirmation email to the address you provided.
          Click the link in that email and your review will enter our
          moderation queue — usually approved within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold font-serif text-[#1A1A1A]">
        Write a review for {venueName}
      </h2>

      <div>
        <label className="block text-sm font-semibold mb-1 text-[#1A1A1A]">
          Your rating <span className="text-[#C4513A]">*</span>
        </label>
        <div className="flex gap-1" role="group" aria-label="Star rating">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(n)}
              className={`text-3xl transition-colors ${
                n <= (hovered || stars) ? 'text-[#C4513A]' : 'text-[#ddd]'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1" htmlFor="title">
          Review headline <span className="text-[#C4513A]">*</span>
        </label>
        <input
          id="title" name="title" type="text" required maxLength={100}
          placeholder="e.g. Best Thai massage in Newtown"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#C4513A]"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1" htmlFor="content">
          Your review <span className="text-[#C4513A]">*</span>
        </label>
        <textarea
          id="content" name="content" required minLength={20} maxLength={2000} rows={5}
          placeholder="Tell others what you liked, who your therapist was, what service you had..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#C4513A] resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="authorName">
            Your name <span className="text-[#C4513A]">*</span>
          </label>
          <input
            id="authorName" name="authorName" type="text" required maxLength={50}
            placeholder="First name or nickname"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C4513A]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="authorEmail">
            Email <span className="text-[#C4513A]">*</span>
          </label>
          <input
            id="authorEmail" name="authorEmail" type="email" required
            placeholder="For verification only — never shown publicly"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C4513A]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="visitDate">
            Visit date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="visitDate" name="visitDate" type="date"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C4513A]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="pricePaidAud">
            Amount paid AUD <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="pricePaidAud" name="pricePaidAud" type="number" min={0} max={9999}
            placeholder="e.g. 90"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C4513A]"
          />
        </div>
      </div>

      {errMsg && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">
          {errMsg}
        </p>
      )}

      <p className="text-xs text-gray-500">
        Your email is used only to verify this review and is never displayed
        publicly. By submitting you agree to our review guidelines.
      </p>

      <button
        type="submit" disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-[#C4513A] text-[#F5EDD6] font-semibold
                   px-8 py-3 text-sm hover:bg-[#a83e2a] disabled:opacity-50
                   transition-colors focus:outline-none focus:ring-2 focus:ring-[#C4513A] focus:ring-offset-2"
      >
        {loading ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
