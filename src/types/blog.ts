export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  featured_image: string | null;
  meta_description: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
