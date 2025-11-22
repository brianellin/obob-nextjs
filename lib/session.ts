import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: number;
  userType: 'coach' | 'team_member';
  email?: string; // Only for coaches
  username?: string; // Only for team members
  displayName: string;
  coachId?: number; // Only for team members
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_12345',
  cookieName: 'obob_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export const defaultSession: SessionData = {
  userId: 0,
  userType: 'coach',
  displayName: '',
  isLoggedIn: false,
};
