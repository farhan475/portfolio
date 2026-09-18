import { projectFormSchema } from './schemas';
import { formBool, formInt, formRequired, formStringArray, formText } from './form';
import { slugify } from './utils';

/** Parsing form proyek. Dipakai halaman tambah dan halaman edit. */
export function parseProjectForm(form: FormData, currentSortOrder = 0) {
  const title = formRequired(form, 'title');

  return projectFormSchema.safeParse({
    title,
    // Slug kosong diisi otomatis dari judul, sama seperti perilaku di browser.
    slug: formText(form, 'slug') ?? slugify(title),
    description: formRequired(form, 'description'),
    content: formText(form, 'content'),
    category: formText(form, 'category'),
    image_url: formText(form, 'image_url'),
    gallery: formStringArray(form, 'gallery'),
    tech_stack: formStringArray(form, 'tech_stack'),
    github_url: formText(form, 'github_url'),
    demo_url: formText(form, 'demo_url'),
    featured: formBool(form, 'featured'),
    is_published: formBool(form, 'is_published'),
    sort_order: formInt(form, 'sort_order', currentSortOrder),
  });
}
