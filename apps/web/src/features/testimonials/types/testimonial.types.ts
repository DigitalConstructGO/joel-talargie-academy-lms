export interface Testimonial {
  id: string;
  studentName: string;
  avatarUrl?: string | null;
  role: string;
  avatarColor: string;
  courseTitle: string;
  rating: number;
  quote: string;
}
