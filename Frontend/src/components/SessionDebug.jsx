import { useEffect, useState } from "react";
import { sessionManager } from "../lib/sessionManager.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { Eye, EyeOff } from "lucide-react";

const SessionDebug = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const { authUser } = useAuthStore();

  useEffect(() => {
    const updateSessions = () => {
      const sessions = sessionManager.getAllActiveSessions();
      setActiveSessions(sessions);
    };

    updateSessions();

    const cleanup = sessionManager.onStorageChange(() => {
      updateSessions();
    });

    return cleanup;
  }, []);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        title="Show Session Debug Info"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Session Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Current User:</span>
          <span className="ml-2">{authUser?._id || 'Not logged in'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Current Session:</span>
          <span className="ml-2 font-mono text-xs">{sessionManager.getSessionId()}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Active Sessions:</span>
          <span className="ml-2">{activeSessions.length}</span>
        </div>
        
        {activeSessions.length > 0 && (
          <div className="mt-2">
            <div className="text-gray-400 text-xs mb-1">All Sessions:</div>
            {activeSessions.map((session, index) => (
              <div key={session.sessionId} className="text-xs bg-gray-800 p-2 rounded mb-1">
                <div>User: {session.userId}</div>
                <div>Session: {session.sessionId}</div>
                <div>Time: {new Date(session.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDebug;