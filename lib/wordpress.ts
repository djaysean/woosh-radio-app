const WORDPRESS_API = "https://wooshradio.com/wp-json/wp/v2";
const SCHEDULE_API = "https://wooshradio.com/wp-json/proradio/v1/schedule/";

export type RadioShow = {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  artwork: string | null;
};

type WordPressShow = Omit<RadioShow, "artwork"> & {
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: {
          "proradio-squared-m"?: { source_url?: string };
          medium?: { source_url?: string };
        };
      };
    }>;
  };
};

export type ScheduledShow = {
  showId: string;
  startTime: string;
  endTime: string;
};

export type ScheduleDay = {
  id: number;
  title: string;
  menuOrder: number;
  shows: ScheduledShow[];
};

export type WeeklySchedule = {
  currentDayId: number;
  days: ScheduleDay[];
};

type WordPressScheduleSlot = {
  show_id: string[];
  show_time: string;
  show_time_end: string;
};

type WordPressSchedulePost = {
  ID: number;
  post_title: string;
  menu_order: number;
  shows?: WordPressScheduleSlot[];
};

type WordPressScheduleResponse = {
  current_day_id: number;
  posts: WordPressSchedulePost[];
};

export async function getRadioShows(): Promise<RadioShow[]> {
  const response = await fetch(
    `${WORDPRESS_API}/shows?per_page=100&_embed=wp:featuredmedia`,
  );

  if (!response.ok) {
    throw new Error(`Unable to load radio shows. HTTP ${response.status}`);
  }

  const shows: WordPressShow[] = await response.json();

  return shows
    .map((show) => {
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
    })
    .sort((a, b) =>
      a.title.rendered.localeCompare(b.title.rendered, undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    );
}

export async function getWeeklySchedule(): Promise<WeeklySchedule> {
  const response = await fetch(SCHEDULE_API);

  if (!response.ok) {
    throw new Error(`Unable to load the schedule. HTTP ${response.status}`);
  }

  const data: WordPressScheduleResponse = await response.json();

  if (!Array.isArray(data.posts)) {
    throw new Error("The schedule response has an unexpected format.");
  }

  const days = data.posts
    .map((day) => ({
      id: day.ID,
      title: day.post_title,
      menuOrder: day.menu_order,
      shows: (day.shows ?? []).map((slot) => ({
        showId: String(slot.show_id?.[0] ?? ""),
        startTime: slot.show_time,
        endTime: slot.show_time_end,
      })),
    }))
    .sort((a, b) => a.menuOrder - b.menuOrder);

  return {
    currentDayId: data.current_day_id,
    days,
  };
}
