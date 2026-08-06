export interface LeaderProfile {
  name: string;
  role: string;
  bio: string;
  avatarColor: string;
}

/** Demo content only - illustrative leadership profiles for the About page. */
export const LEADERSHIP_TEAM: LeaderProfile[] = [
  {
    name: 'Joel Talargie',
    role: 'Founder & CEO',
    bio: 'Started the academy after years of building internal training programs and wanting to make that quality of education available to anyone.',
    avatarColor: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Hannah Okoye',
    role: 'Head of Content',
    bio: 'Leads curriculum quality and works directly with instructors to make sure every course meets a consistent bar before it goes live.',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Ravi Patel',
    role: 'Head of Engineering',
    bio: 'Builds the platform students and instructors use every day, with a focus on speed, reliability, and accessibility.',
    avatarColor: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Maria Santos',
    role: 'Head of Student Success',
    bio: 'Runs the support and community team, making sure students get help quickly and stay motivated to finish what they start.',
    avatarColor: 'from-rose-500 to-pink-600',
  },
];
