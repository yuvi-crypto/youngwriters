import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const profile = {
          uid: session.user.id,
          name: meta.name || session.user.email?.split('@')[0] || 'Writer',
          email: session.user.email,
          role: meta.role || 'child',
          age: meta.age || 12,
          language: meta.language || 'en',
        };
        setUser(session.user);
        setProfile(profile);
        identifyUser(session.user.id, profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const profile = {
            uid: session.user.id,
            name: meta.name || session.user.email?.split('@')[0] || 'Writer',
            email: session.user.email,
            role: meta.role || 'child',
            age: meta.age || 12,
            language: meta.language || 'en',
          };
          setUser(session.user);
          setProfile(profile);
          identifyUser(session.user.id, profile);
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
        <Route path="/write" element={<Protected><AppLayout><WriteSelect /></AppLayout></Protected>} />
        <Route path="/write/image-sprint" element={<Protected><AppLayout><ImageSprint /></AppLayout></Protected>} />
        <Route path="/write/:format" element={<Protected><AppLayout><Write /></AppLayout></Protected>} />
        <Route path="/community" element={<Protected><AppLayout><Community /></AppLayout></Protected>} />
        <Route path="/journal" element={<Protected><AppLayout><Journal /></AppLayout></Protected>} />
        <Route path="/contests" element={<Protected><AppLayout><Contests /></AppLayout></Protected>} />
        <Route path="/settings" element={<Protected><AppLayout><Settings /></AppLayout></Protected>} />
        <Route path="/assignments" element={<Protected><AppLayout><Assignments /></AppLayout></Protected>} />
        <Route path="/lab" element={<Protected><AppLayout><Lab /></AppLayout></Protected>} />
        
        {/* Teacher Specific Routes (Protected) */}
        <Route path="/teacher" element={<TeacherProtected><TeacherDashboard /></TeacherProtected>} />
        <Route path="/teacher/assignments/new" element={<TeacherProtected><AssignmentCreate /></TeacherProtected>} />
        <Route path="/teacher/assignments/:id" element={<TeacherProtected><AssignmentDetail /></TeacherProtected>} />
        
        {/* Admin Route */}
        <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
