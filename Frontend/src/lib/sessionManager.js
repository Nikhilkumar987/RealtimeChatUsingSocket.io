// Session management to handle multiple tabs/windows with different users
const SESSION_KEY = 'chat_app_session';
const USER_SESSION_KEY = 'chat_app_user_session';

export const sessionManager = {
  // Generate a unique session ID for this tab
  getSessionId: () => {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  },

  // Store user session for this tab
  setUserSession: (userId) => {
    const sessionId = sessionManager.getSessionId();
    const userSession = {
      userId,
      sessionId,
      timestamp: Date.now()
    };
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userSession));
    
    // Also store in localStorage for cross-tab communication
    const allSessions = JSON.parse(localStorage.getItem('chat_app_all_sessions') || '{}');
    allSessions[sessionId] = userSession;
    localStorage.setItem('chat_app_all_sessions', JSON.stringify(allSessions));
  },

  // Get user session for this tab
  getUserSession: () => {
    const userSession = sessionStorage.getItem(USER_SESSION_KEY);
    return userSession ? JSON.parse(userSession) : null;
  },

  // Check if this tab has a valid user session
  hasValidUserSession: () => {
    const userSession = sessionManager.getUserSession();
    return userSession && userSession.userId;
  },

  // Get all active sessions (for debugging/testing)
  getAllActiveSessions: () => {
    const allSessions = JSON.parse(localStorage.getItem('chat_app_all_sessions') || '{}');
    return Object.values(allSessions);
  },

  // Clean up session on page unload
  cleanup: () => {
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    const userSession = sessionManager.getUserSession();
    
    if (sessionId && userSession) {
      // Remove from localStorage
      const allSessions = JSON.parse(localStorage.getItem('chat_app_all_sessions') || '{}');
      delete allSessions[sessionId];
      localStorage.setItem('chat_app_all_sessions', JSON.stringify(allSessions));
    }
    
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);
  },

  // Listen for storage changes (other tabs)
  onStorageChange: (callback) => {
    const handleStorageChange = (e) => {
      if (e.key === 'chat_app_all_sessions') {
        callback();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  },

  // Check if user is already logged in in another tab
  isUserLoggedInElsewhere: (userId) => {
    const allSessions = JSON.parse(localStorage.getItem('chat_app_all_sessions') || '{}');
    const currentSessionId = sessionManager.getSessionId();
    
    return Object.values(allSessions).some(session => 
      session.userId === userId && session.sessionId !== currentSessionId
    );
  }
};

// Clean up on page unload
window.addEventListener('beforeunload', sessionManager.cleanup);