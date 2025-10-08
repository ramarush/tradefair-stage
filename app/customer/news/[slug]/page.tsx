import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/lib/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  first_name?: string;
  last_name?: string;
}

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  try {
    const article = await prisma.news.findFirst({
      where: {
        slug: slug,
        status: 'published'
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!article) return null;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || undefined,
      featured_image: article.featuredImage || undefined,
      published_at: article.publishedAt?.toISOString() || '',
      first_name: article.author.firstName,
      last_name: article.author.lastName
    };
  } catch (error) {
    console.error('Error fetching news article:', error);
    return null;
  }
}

async function getRelatedNews(currentSlug: string, limit: number = 3): Promise<NewsArticle[]> {
  try {
    const articles = await prisma.news.findMany({
      where: {
        slug: {
          not: currentSlug
        },
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
      take: limit
    });

    return articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || undefined,
      featured_image: article.featuredImage || undefined,
      published_at: article.publishedAt?.toISOString() || '',
      first_name: article.author.firstName,
      last_name: article.author.lastName
    }));
  } catch (error) {
    console.error('Error fetching related news:', error);
    return [];
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const resolvedParams = await params;
  const article = await getNewsArticle(resolvedParams.slug);
  
  if (!article) {
    notFound();
  }

  const relatedNews = await getRelatedNews(resolvedParams.slug);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <Link href="/customer/news" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">
                  News
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate max-w-xs">
                  {article.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <Link
          href="/customer/news"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to News
        </Link>

        {/* Article */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {article.featured_image && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-6">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>
                    {article.first_name && article.last_name
                      ? `${article.first_name} ${article.last_name}`
                      : 'Admin'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <time dateTime={article.published_at}>
                    {new Date(article.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>
            </header>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-gray prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-gray-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-indigo-500 prose-blockquote:text-gray-700 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-pre:bg-gray-900"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related News</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/customer/news/${news.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {news.featured_image && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={news.featured_image}
                        alt={news.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
                      {news.title}
                    </h3>
                    {news.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {news.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <time dateTime={news.published_at}>
                        {new Date(news.published_at).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-indigo-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Updated</h3>
          <p className="text-gray-600 mb-4">
            Don&apos;t miss out on the latest market insights and trading opportunities.
          </p>
          <Link
            href="/customer/news"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            View All News
          </Link>
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: NewsDetailPageProps) {
  const resolvedParams = await params;
  const article = await getNewsArticle(resolvedParams.slug);
  
  if (!article) {
    return {
      title: 'News Article Not Found | TradeFair',
    };
  }

  return {
    title: `${article.title} | TradeFair News`,
    description: article.excerpt || `Read the latest news article: ${article.title}`,
    openGraph: {
      title: article.title,
      description: article.excerpt || `Read the latest news article: ${article.title}`,
      type: 'article',
      publishedTime: article.published_at,
      images: article.featured_image ? [article.featured_image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || `Read the latest news article: ${article.title}`,
      images: article.featured_image ? [article.featured_image] : [],
    },
  };
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const articles = await prisma.news.findMany({
      where: {
        status: 'published'
      },
      select: {
        slug: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 100
    });

    return articles.map((article) => ({
      slug: article.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
