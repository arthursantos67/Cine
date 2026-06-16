export type MovieStatus = "em_cartaz" | "pre_venda" | "em_breve";

export type CatalogRoomExperienceType =
  | ""
  | "standard"
  | "vip"
  | "premium"
  | "imax";

export type CatalogAudioFormat = "" | "original" | "legendado" | "dublado";

export type CatalogProjectionFormat = "" | "2d" | "3d" | "imax";

export type CatalogSessionType = "" | "regular" | "preview" | "special_event";

export type CatalogGenre = {
  id: string;
  name: string;
  translations?: CatalogGenreTranslations;
};

export type CatalogTranslationLocale =
  | "pt-BR"
  | "en-US"
  | "es-ES"
  | "fr-FR"
  | "de-DE"
  | "it-IT"
  | "zh-CN"
  | "ja-JP";

export type CatalogGenreTranslations = Partial<
  Record<CatalogTranslationLocale, { name?: string }>
>;

export type CatalogMovieTranslations = Partial<
  Record<CatalogTranslationLocale, { synopsis?: string; title?: string }>
>;

export type CatalogRoomTranslations = Partial<
  Record<
    CatalogTranslationLocale,
    { description?: string; display_name?: string }
  >
>;

export type CatalogMovieAgeRating = "" | "L" | "10" | "12" | "14" | "16" | "18";

export type CatalogMovie = {
  age_rating?: CatalogMovieAgeRating | null;
  cast?: string[] | null;
  director?: string | null;
  duration_minutes: number;
  genres: CatalogGenre[];
  id: string;
  is_featured: boolean;
  poster_url: string;
  release_date?: string | null;
  status: MovieStatus;
  title: string;
  translations?: CatalogMovieTranslations;
};

export type CatalogMovieDetail = CatalogMovie & {
  created_at?: string;
  synopsis: string;
  updated_at?: string;
};

export type CatalogRoomSummary = {
  base_price?: string;
  capacity: number;
  description?: string | null;
  display_name?: string | null;
  experience_type?: CatalogRoomExperienceType | null;
  id: string;
  name: string;
  translations?: CatalogRoomTranslations;
};

export type CatalogSession = {
  audio_format?: CatalogAudioFormat | null;
  base_price: string;
  created_at?: string;
  end_time: string;
  id: string;
  movie: CatalogMovie;
  projection_format?: CatalogProjectionFormat | null;
  room: CatalogRoomSummary;
  session_type?: CatalogSessionType | null;
  start_time: string;
  updated_at?: string;
};

export type AdminRoom = CatalogRoomSummary & {
  created_at?: string;
  updated_at?: string;
};

export type RoomTypePricing = {
  id: number;
  experience_type: CatalogRoomExperienceType;
  base_price: string;
  updated_at: string;
};

export type AdminSession = CatalogSession & {
  seat_count?: number;
  has_reservations?: boolean;
  has_purchases?: boolean;
};

export type AdminSeatRow = {
  id: string;
  name: string;
  room: string;
};

export type AdminSeat = {
  companion_seat: string | null;
  id: string;
  is_accessible: boolean;
  number: number;
  row: string;
};

export type MovieInterestStatus = {
  count: number;
  user_interested: boolean | null;
};
