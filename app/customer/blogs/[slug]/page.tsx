import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarIcon, UserIcon, ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/lib/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  tags?: string[];
  published_at: string;
  first_name?: string;
  last_name?: string;
}

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const blog = await prisma.blog.findFirst({
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

    if (!blog) return null;

    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || undefined,
      featured_image: blog.featuredImage || undefined,
      tags: blog.tags,
      published_at: blog.publishedAt?.toISOString() || '',
      first_name: blog.author.firstName,
      last_name: blog.author.lastName
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

async function getRelatedPosts(currentSlug: string, tags: string[] = [], limit: number = 3): Promise<BlogPost[]> {
  try {
    // First try to get posts with similar tags if current post has tags
    let blogs: any[] = [];
    if (tags.length > 0) {
      blogs = await prisma.blog.findMany({
        where: {
          slug: {
            not: currentSlug
          },
          status: 'published',
          tags: {
            hasSome: tags
          }
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
    }

    // If we don't have enough posts with similar tags, get more recent posts
    if (blogs.length < limit) {
      const additionalBlogs = await prisma.blog.findMany({
        where: {
          slug: {
            not: currentSlug
          },
          status: 'published',
          ...(blogs.length > 0 ? {
            id: {
              notIn: blogs.map(b => b.id)
            }
          } : {})
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
        take: limit - blogs.length
      });

      blogs = [...blogs, ...additionalBlogs];
    }

    return blogs.map(blog => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || undefined,
      featured_image: blog.featuredImage || undefined,
      tags: blog.tags,
      published_at: blog.publishedAt?.toISOString() || '',
      first_name: blog.author.firstName,
      last_name: blog.author.lastName
    }));
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const resolvedParams = await params;
  const blog = await getBlogPost(resolvedParams.slug);
  
  if (!blog) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(resolvedParams.slug, blog.tags);

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
                <Link href="/customer/blogs" className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2">
                  Blog
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate max-w-xs">
                  {blog.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <Link
          href="/customer/blogs"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        {/* Article */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {blog.featured_image && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            {/* Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {blog.title}
              </h1>
              
              {blog.excerpt && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {blog.excerpt}
                </p>
              )}

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {blog.tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/customer/blogs?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-6">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>
                    {blog.first_name && blog.last_name
                      ? `${blog.first_name} ${blog.last_name}`
                      : 'Admin'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <time dateTime={blog.published_at}>
                    {new Date(blog.published_at).toLocaleDateString('en-US', {
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
              className="prose prose-lg max-w-none prose-indigo"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/customer/blogs/${post.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {post.featured_image && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {post.excerpt}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      <time dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Enjoyed this article?</h3>
          <p className="text-gray-600 mb-4">
            Discover more insights and join our community of traders.
          </p>
          <div className="space-x-4">
            <Link
              href="/customer/blogs"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Read More Posts
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
            >
              Go to Dashboard
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
export async function generateMetadata({ params }: BlogDetailPageProps) {
  const resolvedParams = await params;
  const blog = await getBlogPost(resolvedParams.slug);
  
  if (!blog) {
    return {
      title: 'Blog Post Not Found | TradeFair',
    };
  }

  const keywords = blog.tags ? blog.tags.join(', ') : '';

  return {
    title: `${blog.title} | TradeFair Blog`,
    description: blog.excerpt || `Read our latest blog post: ${blog.title}`,
    keywords,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || `Read our latest blog post: ${blog.title}`,
      type: 'article',
      publishedTime: blog.published_at,
      images: blog.featured_image ? [blog.featured_image] : [],
      tags: blog.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt || `Read our latest blog post: ${blog.title}`,
      images: blog.featured_image ? [blog.featured_image] : [],
    },
  };
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const blogs = await prisma.blog.findMany({
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

    return blogs.map((blog) => ({
      slug: blog.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
