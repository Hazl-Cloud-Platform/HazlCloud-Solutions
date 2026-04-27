import type { SchemaTypeDefinition } from 'sanity'

export const insight: SchemaTypeDefinition = {
  name: 'insight',
  title: 'Insight',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().min(10).max(120),
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short summary shown on the list page and used as fallback OG description.',
      validation: (Rule) => Rule.required().min(40).max(220),
    },
    {
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string', validation: (Rule) => Rule.required() },
      ],
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'content',
      to: [{ type: 'author' }],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', title: 'URL', type: 'url', validation: (Rule) => Rule.required() },
                  { name: 'newTab', title: 'Open in new tab', type: 'boolean', initialValue: false },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt text', type: 'string' }],
        },
        {
          type: 'object',
          name: 'codeBlock',
          title: 'Code block',
          fields: [
            { name: 'language', type: 'string', title: 'Language' },
            { name: 'code', type: 'text', title: 'Code', rows: 8 },
          ],
        },
      ],
    },
    {
      name: 'seoTitle',
      title: 'SEO title (≤60 chars)',
      type: 'string',
      group: 'seo',
      validation: (Rule) => Rule.max(60),
    },
    {
      name: 'seoDescription',
      title: 'SEO description (150-160 chars)',
      type: 'text',
      rows: 2,
      group: 'seo',
      validation: (Rule) => Rule.max(170),
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
  },
}
