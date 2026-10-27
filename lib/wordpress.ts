const WORDPRESS_API = "https://wooshradio.com/wp-json/wp/v2";

export type RadioShow = {
  id: number;
  slug: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  artwork: string | null;
};

type WordPressShow = Omit<RadioShow, "artwork"> & {
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: {
          "proradio-squared-m"?: {
            source_url?: string;
          };
          medium?: {
            source_url?: string;
          };
        };
      };
    }>;
  };
};

export async function getRadioShows(): Promise<RadioShow[]> {
  const response = await fetch(
    `${WORDPRESS_API}/shows?per_page=100&_embed=wp:featuredmedia`,
  );

  if (!response.ok) {
    throw new Error(`Unable to load radio shows. HTTP ${response.status}`);
  }

  const shows: WordPressShow[] = await response.json();

  return shows.map((show) => {
    const media = show._embedded?.["wp:featuredmedia"]?.[0];

    const artwork =
      media?.media_details?.sizes?.["proradio-squared-m"]?.source_url ??
      media?.media_details?.sizes?.medium?.source_url ??
      media?.source_url ??
      null;

    return {
      id: show.id,
      slug: show.slug,
      link: show.link,
      title: show.title,
      content: show.content,
      excerpt: show.excerpt,
      featured_media: show.featured_media,
      artwork,
    };
  });
}
