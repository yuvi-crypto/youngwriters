import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './supabase';
import { useAuthStore, useAppStore } from './store';
import { identifyUser, resetAnalytics, trackPageViewed } from './analytics';

// Pages
import Landing from './pages/Landing';
import Signup, { Login } from './pages/Auth';
import Home from './pages/Home';
import { WriteSelect } from './pages/Write';
import Write from './pages/Write';
import Community from './pages/Community';
import Journal from './pages/Journal';
import Contests from './pages/Contests';
import Settings from './pages/Settings';
import ImageSprint from './pages/ImageSprint';
import AdminPanel from './pages/AdminPanel';
import Lab from './pages/Lab';
import ParentDashboard from './pages/ParentDashboard';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AssignmentCreate from './pages/teacher/AssignmentCreate';
import AssignmentDetail from './pages/teacher/AssignmentDetail';

// Student Assignments Inbox
import Assignments from './pages/Assignments';

// Components
import Navbar from './components/Navbar';

// ── Page Loader ──────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '16px',
      background: 'linear-gradient(160deg, hsl(258,60%,97%) 0%, hsl(210,50%,96%) 100%)',
    }}>
      <div style={{ fontSize: '3rem', animation: 'float 1.5s ease-in-out infinite' }}>✍️</div>
      <div style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '1.1rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, hsl(258,80%,62%), hsl(290,70%,62%))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Loading Young Writers...
      </div>
    </div>
  );
}

// ── Protected Route (Authenticated Users) ─────────────────────
function Protected({ children }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Teacher Protected Route ──────────────────────────────────
function TeacherProtected({ children }) {
  const { user, profile, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'teacher') return <Navigate to="/home" replace />;
  return children;
}

// ── Student Protected Route ──────────────────────────────────
function StudentProtected({ children }) {
  const { user, profile, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'child') {
    return <Navigate to={profile?.role === 'parent' ? '/parent' : '/teacher'} replace />;
  }
  return children;
}

// ── Parent Protected Route ───────────────────────────────────
function ParentProtected({ children }) {
  const { user, profile, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'parent') return <Navigate to="/home" replace />;
  return children;
}

// ── App Layout (with Navbar) ─────────────────────────────────
function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

// ── Page Tracker ─────────────────────────────────────────────
function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    const pageMap = {
      '/': 'landing', '/home': 'home', '/write': 'write_select',
      '/community': 'community', '/journal': 'journal',
      '/contests': 'contests', '/settings': 'settings',
      '/admin': 'admin_panel', '/write/image-sprint': 'image_sprint',
      '/teacher': 'teacher_dashboard', '/teacher/assignments/new': 'teacher_create_assignment',
      '/assignments': 'student_assignments', '/lab': 'lab_dashboard',
    };
    let page = pageMap[location.pathname];
    if (!page) {
      if (location.pathname.startsWith('/write/')) {
        page = `write_${location.pathname.split('/')[2]}`;
      } else if (location.pathname.startsWith('/teacher/assignments/')) {
        page = 'teacher_assignment_detail';
      } else {
        page = location.pathname;
      }
    }
    trackPageViewed(page);
  }, [location.pathname]);
  return null;
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();
  const { dyslexicMode, highContrast } = useAppStore();

  // Supabase auth listener — also wires Mixpanel identity
  useEffect(() => {
    async function syncProfile(user) {
      if (!user) return null;
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        const meta = user.user_metadata || {};
        const role = dbProfile?.role || meta.role || 'child';

        // Check if Parent exists in student profiles parent_email
        if (role === 'parent') {
          const parentEmail = user.email;
          const { data: linkedKids, error: linkErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('parent_email', parentEmail)
            .limit(1);

          if (linkErr) throw linkErr;

          if (!linkedKids || linkedKids.length === 0) {
            await supabase.auth.signOut();
            toast.error("No student is associated with this email address. Please contact your child's teacher. 🚫", { duration: 6000 });
            return null;
          }
        }

        return {
          uid: user.id,
          name: dbProfile?.name || meta.name || user.email?.split('@')[0] || 'Writer',
          email: dbProfile?.email || user.email,
          role: dbProfile?.role || meta.role || 'child',
          age: dbProfile?.age || meta.age || 12,
          language: dbProfile?.language || meta.language || 'en',
          username: dbProfile?.username || meta.username || null,
          accountType: dbProfile?.account_type || meta.account_type || 'email_account',
          teacherId: dbProfile?.teacher_id || meta.teacher_id || null,
          parent_email: dbProfile?.parent_email || meta.parentEmail || null,
        };
      } catch (e) {
        console.error('Error syncing profile:', e);
        return null;
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await syncProfile(session.user);
        setUser(session.user);
        if (profile) {
          setProfile(profile);
          identifyUser(session.user.id, profile);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await syncProfile(session.user);
          setUser(session.user);
          if (profile) {
            setProfile(profile);
            identifyUser(session.user.id, profile);
          }
        } else {
          setUser(null);
          setProfile(null);
          if (event === 'SIGNED_OUT') resetAnalytics();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Apply accessibility body classes
  useEffect(() => {
    document.body.classList.toggle('dyslexic-mode', dyslexicMode);
    document.body.classList.toggle('high-contrast', highContrast);
  }, [dyslexicMode, highContrast]);

  return (
    <>
      <PageTracker />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            borderRadius: '14px',
            boxShadow: '0 4px 16px hsla(240,20%,10%,0.10)',
          },
          success: { iconTheme: { primary: 'hsl(160,65%,46%)', secondary: 'white' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected (Students / Parents) */}
        <Route path="/home" element={<Protected><AppLayout><Home /></AppLayout></Protected>} />
        <Route path="/write" element={<StudentProtected><AppLayout><WriteSelect /></AppLayout></StudentProtected>} />
        <Route path="/write/image-sprint" element={<StudentProtected><AppLayout><ImageSprint /></AppLayout></StudentProtected>} />
        <Route path="/write/:format" element={<StudentProtected><AppLayout><Write /></AppLayout></StudentProtected>} />
        <Route path="/community" element={<Protected><AppLayout><Community /></AppLayout></Protected>} />
        <Route path="/journal" element={<StudentProtected><AppLayout><Journal /></AppLayout></StudentProtected>} />
        <Route path="/contests" element={<StudentProtected><AppLayout><Contests /></AppLayout></StudentProtected>} />
        <Route path="/settings" element={<Protected><AppLayout><Settings /></AppLayout></Protected>} />
        <Route path="/assignments" element={<StudentProtected><AppLayout><Assignments /></AppLayout></StudentProtected>} />
        <Route path="/lab" element={<StudentProtected><AppLayout><Lab /></AppLayout></StudentProtected>} />
        
        {/* Teacher Specific Routes (Protected) */}
        <Route path="/teacher" element={<TeacherProtected><TeacherDashboard /></TeacherProtected>} />
        <Route path="/teacher/assignments/new" element={<TeacherProtected><AssignmentCreate /></TeacherProtected>} />
        <Route path="/teacher/assignments/:id" element={<TeacherProtected><AssignmentDetail /></TeacherProtected>} />
        
        {/* Parent Specific Routes (Protected) */}
        <Route path="/parent" element={<ParentProtected><AppLayout><ParentDashboard /></AppLayout></ParentProtected>} />

        {/* Admin Route */}
        <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
