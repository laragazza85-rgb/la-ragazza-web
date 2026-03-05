import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeReviews } from './normalizeReviews.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function parseCSV(csvPath: string): ReviewsJSON {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Get header and clean them
  const headers = lines[0].split(',').map(h => h.trim());
  const headerIndices = {
    reviewId: headers.indexOf('reviewId'),
    reviewerName: headers.indexOf('reviewerName'),
    text: headers.indexOf('text'),
    translatedText: headers.indexOf('translatedText'),
    stars: headers.indexOf('stars'),
    reviewDate: headers.indexOf('reviewDate'),
    averageRating: headers.indexOf('averageRating'),
    reviewCount: headers.indexOf('reviewCount'),
  };

  let averageRating = 0;
  let reviewCount = 0;
  const reviews: Review[] = [];

  // Parse rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handles quoted fields)
    const values = parseCSVLine(line);

    const review: Review = {
      reviewId: values[headerIndices.reviewId]?.trim() || '',
      reviewerName: values[headerIndices.reviewerName]?.trim() || '',
      text_es: values[headerIndices.translatedText]?.trim() || '',
      text_en: values[headerIndices.text]?.trim() || '',
      stars: parseInt(values[headerIndices.stars]?.trim() || '0', 10),
      reviewDate: values[headerIndices.reviewDate]?.trim() || '',
    };

    reviews.push(review);

    // Get averageRating and reviewCount from first row (they should be the same for all)
    if (i === 1) {
      averageRating = parseFloat(values[headerIndices.averageRating]?.trim() || '0');
      const count = values[headerIndices.reviewCount]?.trim() || '0';
      reviewCount = count === '' ? 0 : parseInt(count, 10);
    }
  }

  return {
    averageRating,
    reviewCount,
    reviews,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check if it's an escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function main() {
  const csvPath = path.join(__dirname, '../data/reviews/reviews_spreadsheet - reviews.csv');
  const outputPath = path.join(__dirname, '../data/reviews/reviews.json');

  try {
    let reviewsData = parseCSV(csvPath);
    // Normalize the reviews data
    reviewsData = normalizeReviews(reviewsData);
    fs.writeFileSync(outputPath, JSON.stringify(reviewsData, null, 2), 'utf-8');
    console.log(`✅ Successfully converted CSV to JSON`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Total reviews: ${reviewsData.reviews.length}`);
    console.log(`⭐ Average rating: ${reviewsData.averageRating}`);
    console.log(`👥 Review count: ${reviewsData.reviewCount}`);
  } catch (error) {
    console.error('❌ Error converting CSV to JSON:', error);
    process.exit(1);
  }
}

main();

