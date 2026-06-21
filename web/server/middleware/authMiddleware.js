import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const isServiceKeyConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing Supabase environment variables in server config.');
}

if (!isServiceKeyConfigured) {
  console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing on the server! The backend API will query as an anonymous user, causing Row Level Security (RLS) checks to fail and return "User profile not found". Please configure SUPABASE_SERVICE_ROLE_KEY.');
}

// Admin client to query profiles and other tables bypassing RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Middleware to verify Supabase JWT
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;

    // Fetch profile role from DB using admin client (bypasses RLS to ensure we can get it)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role, name, email')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      if (!isServiceKeyConfigured) {
        return res.status(403).json({ 
          error: 'User profile not found. (Backend is missing the SUPABASE_SERVICE_ROLE_KEY environment variable. Please configure it in your Vercel Dashboard under Settings > Environment Variables).' 
        });
      }
      return res.status(403).json({ error: 'User profile not found' });
    }

    req.role = profile.role;
    req.profileName = profile.name;
    req.profileEmail = profile.email;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Authentication internal server error' });
  }
}

// Middleware factory to enforce specific roles
export function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(403).json({ error: 'No role assigned to user' });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ 
        error: `Access Denied: Role '${req.role}' is not authorized to view this resource.` 
      });
    }

    next();
  };
}
