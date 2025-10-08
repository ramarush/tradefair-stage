/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { Metadata } from 'next';
import { CalendarIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { prisma } from '@/lib/prisma';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  published_at: string;
  first_name?: string;
  last_name?: string;
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

async function getBlogs(page: number = 1, limit: number = 12, tag?: string) {
  const offset = (page - 1) * limit;

  // Build query conditions
  const whereCondition: any = {
    status: 'published'
  };

  if (tag) {
    whereCondition.tags = {
      has: tag
    };
  }

  // Get total count of published blogs
  const total = await prisma.blog.count({
    where: whereCondition
  });

  // Get published blogs with author information
  const blogsData = await prisma.blog.findMany({
    where: whereCondition,
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
  const blogs = blogsData.map(blog => ({
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    featured_image: blog.featuredImage,
    tags: blog.tags,
    published_at: blog.publishedAt?.toISOString() || new Date().toISOString(),
    first_name: blog.author?.firstName,
    last_name: blog.author?.lastName
  }));

  return {
    blogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getAllTags(): Promise<string[]> {
  // Get all published blogs with tags
  const blogs = await prisma.blog.findMany({
    where: {
      status: 'published',
      NOT: {
        tags: {
          isEmpty: true
        }
      }
    },
    select: {
      tags: true
    }
  });

  // Extract unique tags and sort them
  const allTags = blogs.flatMap(blog => blog.tags || []);
  const uniqueTags = [...new Set(allTags)].sort();
  
  return uniqueTags;
}

export default async function CustomerBlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const selectedTag = params.tag;
  const { blogs, pagination } = await getBlogs(currentPage, 12, selectedTag);
  const allTags = await getAllTags();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, tutorials, and stories from our team. Explore topics that matter to you and stay ahead in the trading world.
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
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Blog</span>
              </div>
            </li>
            {selectedTag && (
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{selectedTag}</span>
                </div>
              </li>
            )}
          </ol>
        </nav>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Browse by Topic</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/customer/blogs"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Posts
              </Link>
              {allTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/customer/blogs?tag=${encodeURIComponent(tag)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <TagIcon className="h-3 w-3 inline mr-1" />
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedTag ? `No blog posts found with tag "${selectedTag}"` : 'No blog posts found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedTag ? 'Try selecting a different tag or view all posts.' : 'Check back later for new content and insights.'}
            </p>
            {selectedTag && (
              <Link
                href="/customer/blogs"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View all posts
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <Link href={`/customer/blogs/${blog.slug}`}>
                    {blog.featured_image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-indigo-600 transition-colors">
                        {blog.title}
                      </h2>
                      {blog.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {blog.excerpt}
                        </p>
                      )}
                      
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {blog.tags.slice(0, 3).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {blog.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{blog.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span>
                            {blog.first_name && blog.last_name
                              ? `${blog.first_name} ${blog.last_name}`
                              : 'Admin'
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <time dateTime={blog.published_at}>
                            {new Date(blog.published_at).toLocaleDateString('en-US', {
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
                      href={`/customer/blogs?${new URLSearchParams({ 
                        ...(selectedTag && { tag: selectedTag }), 
                        page: (currentPage - 1).toString() 
                      })}`}
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
                          href={`/customer/blogs?${new URLSearchParams({ 
                            ...(selectedTag && { tag: selectedTag }), 
                            page: page.toString() 
                          })}`}
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
                      href={`/customer/blogs?${new URLSearchParams({ 
                        ...(selectedTag && { tag: selectedTag }), 
                        page: (currentPage + 1).toString() 
                      })}`}
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
        <div className="mt-16 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Our Community</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get exclusive insights, trading tips, and be the first to know about new features and updates.
          </p>
          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/customer/news"
              className="inline-flex items-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
            >
              Read Latest News
            </Link>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const selectedTag = params.tag;
  
  let title = 'Blog - Insights & Tutorials | TradeFair';
  let description = 'Explore our blog for trading insights, tutorials, and expert analysis to help you succeed in the financial markets.';
  
  if (selectedTag) {
    title = `${selectedTag} Articles | TradeFair Blog`;
    description = `Read articles about ${selectedTag} and related topics on TradeFair blog.`;
  } else if (currentPage > 1) {
    title = `Blog - Page ${currentPage} | TradeFair`;
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}
