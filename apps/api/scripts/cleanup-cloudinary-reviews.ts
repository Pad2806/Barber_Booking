import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of reviews with Cloudinary images...');
  
  // Find reviews that have cloudinary in their images array
  const reviews = await prisma.review.findMany({
    where: {
      OR: [
        {
          images: {
            hasSome: ['cloudinary'], // This is for exact match, but we need partial
          }
        }
      ]
    }
  });

  // Prisma 'hasSome' for arrays is difficult with partial matches in some versions.
  // We'll fetch all reviews with images and filter in JS for safety.
  const allReviewsWithImages = await prisma.review.findMany({
    where: {
      images: {
        path: [],
        not: []
      }
    }
  });

  const brokenReviews = allReviewsWithImages.filter(r => 
    r.images.some(img => img.includes('cloudinary.com'))
  );

  console.log(`Found ${brokenReviews.length} reviews with Cloudinary images.`);

  if (brokenReviews.length > 0) {
    const ids = brokenReviews.map(r => r.id);
    const result = await prisma.review.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });
    console.log(`Successfully deleted ${result.count} reviews.`);
  } else {
    console.log('No reviews with Cloudinary images found.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
