import Link from 'next/link';
import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/lib/prisma';

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  first_name?: string;
  last_name?: string;
}

interface NewsPageProps {
  searchParams: { page?: string };
}

async function getNews(page: number = 1, limit: number = 12) {
  const offset = (page - 1) * limit;

  // Get total count of published news
  const total = await prisma.news.count({
    where: {
      status: 'published'
    }
  });

  // Get published news with author information
  const newsData = await prisma.news.findMany({
    where: {
      status: 'published'
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      publishedAt: 'desc'
    },
    skip: offset,
    take: limit
  });

  // Map to match the expected interface
  const news = newsData.map(article => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    featured_image: article.featuredImage,
    published_at: article.publishedAt?.toISOString() || new Date().toISOString(),
    first_name: article.author?.firstName,
    last_name: article.author?.lastName
  }));

  return {
    news,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export default async function CustomerNewsPage({ searchParams }: NewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams.page || '1');
  const { news, pagination } = await getNews(currentPage);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest News & Updates</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed with the latest announcements, platform updates, and important information from our team.
          </p>
        </div>

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">News</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* News Grid */}
        {news.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No news articles found</h3>
            <p className="text-gray-600">Check back later for updates and announcements.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {news.map((article) => (
                <article
                  key={article.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link href={`/customer/news/${article.slug}`}>
                    {article.featured_image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-indigo-600 transition-colors">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span>
                            {article.first_name && article.last_name
                              ? `${article.first_name} ${article.last_name}`
                              : 'Admin'
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <time dateTime={article.published_at}>
                            {new Date(article.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <nav className="flex justify-center" aria-label="Pagination">
                <div className="flex items-center space-x-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/customer/news?page=${currentPage - 1}`}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <Link
                          key={page}
                          href={`/customer/news?page=${page}`}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            page === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Link>
                      );
                    } else if (
                      (page === currentPage - 3 && page > 1) ||
                      (page === currentPage + 3 && page < pagination.totalPages)
                    ) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  {currentPage < pagination.totalPages && (
                    <Link
                      href={`/customer/news?page=${currentPage + 1}`}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-indigo-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Stay Connected</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Don&apos;t miss out on the latest market insights and trading opportunities. Check back regularly or follow us on social media.
          </p>
          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/customer/blogs"
              className="inline-flex items-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
            >
              Read Our Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: NewsPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams.page || '1');
  
  return {
    title: currentPage > 1 ? `News - Page ${currentPage} | TradeFair` : 'Latest News & Updates | TradeFair',
    description: 'Stay updated with the latest announcements, platform updates, and important information from TradeFair.',
    openGraph: {
      title: 'Latest News & Updates | TradeFair',
      description: 'Stay updated with the latest announcements, platform updates, and important information from TradeFair.',
      type: 'website',
    },
  };
}
