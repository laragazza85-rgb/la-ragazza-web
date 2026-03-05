/**
 * Normalize review data to ensure consistent formatting
 */

interface Review {
  reviewId: string;
  reviewerName: string;
  text_es: string;
  text_en: string;
  stars: number;
  reviewDate: string;
}

interface ReviewsJSON {
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
}

/**
 * Convert a string to Title Case
 * e.g., "juan luis González torres" -> "Juan Luis González Torres"
 */
function toTitleCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalize the first letter of a string
 * e.g., "a month ago" -> "A month ago"
 */
function capitalizeFirst(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Normalize a single review
 */
function normalizeReview(review: Review): Review {
  return {
    ...review,
    reviewerName: toTitleCase(review.reviewerName),
    text_es: review.text_es.trim(),
    text_en: review.text_en.trim(),
    reviewDate: capitalizeFirst(review.reviewDate),
  };
}

/**
 * Normalize all reviews in a ReviewsJSON object
 */
export function normalizeReviews(data: ReviewsJSON): ReviewsJSON {
  return {
    averageRating: data.averageRating,
    reviewCount: data.reviewCount,
    reviews: data.reviews.map(normalizeReview),
  };
}

