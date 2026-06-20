/**
 * useAdminRole.js
 *
 * Returns screen-level access rights for the currently logged-in user
 * based on their role. This enforces the role table from the PRD at the
 * frontend layer.
 *
 * IMPORTANT: This is UI-layer enforcement only. Real enforcement must
 * also happen in backend API middleware — never trust frontend-only gates.
 *
 * Role table (from PRD):
 * Role                   | Dashboard | Safety | Contests | Schools | Moderation
 * Super Admin            |   full    |  full  |   full   |  full   |    full
 * Trust & Safety Reviewer|   view    |  full  |   view   |   —     |    full
 * Contest Coordinator    |   view    |   —    |   full   |   —     |     —
 * School Account Manager |   view    |   —    |    —     | full*   |     —
 *                        *own schools only
 */

import { useAuthStore } from '../store';

// Screen IDs used throughout AdminPanel.jsx
export const SCREENS = {
  DASHBOARD: 'dashboard',
  SAFETY: 'safety',
  CONTESTS: 'contests',
  SCHOOLS: 'schools',
  MODERATION: 'moderation',
};

const ROLE_MAP = {
  super_admin: {
    view:    [SCREENS.DASHBOARD, SCREENS.SAFETY, SCREENS.CONTESTS, SCREENS.SCHOOLS, SCREENS.MODERATION],
    edit:    [SCREENS.DASHBOARD, SCREENS.SAFETY, SCREENS.CONTESTS, SCREENS.SCHOOLS, SCREENS.MODERATION],
    safetyAccess: true,
  },
  trust_safety: {
    view:    [SCREENS.DASHBOARD, SCREENS.SAFETY, SCREENS.CONTESTS, SCREENS.MODERATION],
    edit:    [SCREENS.SAFETY, SCREENS.MODERATION],
    safetyAccess: true,
  },
  contest_coordinator: {
    view:    [SCREENS.DASHBOARD, SCREENS.CONTESTS],
    edit:    [SCREENS.CONTESTS],
    safetyAccess: false, // Explicitly NO safety access
  },
  school_manager: {
    view:    [SCREENS.DASHBOARD, SCREENS.SCHOOLS],
    edit:    [SCREENS.SCHOOLS], // own schools only — enforced by API
    safetyAccess: false, // Explicitly NO safety access
  },
};

export function useAdminRole() {
  const { profile } = useAuthStore();
  const role = profile?.role || '';

  // Only these roles can access /admin at all
  const isAdmin = Object.keys(ROLE_MAP).includes(role);

  const rights = ROLE_MAP[role] || { view: [], edit: [], safetyAccess: false };

  return {
    role,
    isAdmin,
    canView: (screen) => rights.view.includes(screen),
    canEdit: (screen) => rights.edit.includes(screen),
    hasSafetyAccess: rights.safetyAccess,
    visibleScreens: rights.view,
  };
}
