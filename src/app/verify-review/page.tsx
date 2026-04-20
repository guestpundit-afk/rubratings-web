import { redirect } from 'next/navigation';

// The Strapi /api/reviews/verify endpoint redirects successful verifications
// to /review-confirmed. This stub exists so the /verify-review URL doesn't 404
// if someone visits it directly without a token.
export default function VerifyReviewPage() {
  redirect('/');
}
