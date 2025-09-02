import { useEffect, useState } from "react";
import { sessionManager } from "../lib/sessionManager.js";
import { Users, X } from "lucide-react";

const MultiTabWarning = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const updateSessions = () => {
      const sessions = sessionManager.getAllActiveSessions();
      setActiveSessions(sessions);
      setShowInfo(sessions.length > 1);
    };

    updateSessions();

    // Listen for storage changes
    const cleanup = sessionManager.onStorageChange(() => {
      updateSessions();
    });

    return cleanup;
  }, []);

  if (!showInfo) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 bg-blue-500 text-white p-3 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <div>
            <p className="font-medium">Multiple Sessions Active</p>
            <p className="text-sm">
              {activeSessions.length} tab(s) open with different user sessions
            </p>
            <p className="text-xs opacity-80">
              Each tab maintains its own session independently
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(false)}
          className="text-white hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MultiTabWarning;