// Utility function to generate SEO-friendly slugs from text

export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(baseText: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(baseText);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let slug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

