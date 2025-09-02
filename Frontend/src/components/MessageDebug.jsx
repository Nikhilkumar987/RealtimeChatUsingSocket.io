import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useChatStore } from "../store/useChatStore.js";
import { MessageSquare, X } from "lucide-react";

const MessageDebug = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [messageLog, setMessageLog] = useState([]);
  const { socket, authUser } = useAuthStore();
  const { selectedUser, messages } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessageLog(prev => [...prev.slice(-9), {
        type: 'received',
        message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    const handleMessageSent = (message) => {
      setMessageLog(prev => [...prev.slice(-9), {
        type: 'sent',
        message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket]);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-16 right-4 z-50 bg-blue-800 text-white p-2 rounded-full shadow-lg hover:bg-blue-700"
        title="Show Message Debug"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Message Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Socket Status:</span>
          <span className={`ml-2 ${socket?.connected ? 'text-green-400' : 'text-red-400'}`}>
            {socket?.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Current User:</span>
          <span className="ml-2">{authUser?._id || 'None'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Selected User:</span>
          <span className="ml-2">{selectedUser?._id || 'None'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Messages Count:</span>
          <span className="ml-2">{messages.length}</span>
        </div>
        
        {messageLog.length > 0 && (
          <div className="mt-2">
            <div className="text-gray-400 text-xs mb-1">Recent Activity:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {messageLog.map((log, index) => (
                <div key={index} className={`text-xs p-1 rounded ${
                  log.type === 'sent' ? 'bg-blue-800' : 'bg-green-800'
                }`}>
                  <div className="font-mono">{log.timestamp}</div>
                  <div>{log.type}: {log.message.text || 'Image'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDebug;