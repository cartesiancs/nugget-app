import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface User {
  name: string;
  email: string;
  avatar?: string;
}

const UserProfileDropdown: React.FC = () => {
  const { user, isAuthenticated, logout, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    console.log('UserProfileDropdown: Not authenticated, showing login button');
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            console.log('Login button clicked, calling login function');
            login();
          }}
          className="bg-[#191B1D] text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:bg-[#2A2D2F] text-sm"
        >
          Login
        </button>
      </div>
    );
  }

  console.log('UserProfileDropdown: Authenticated, showing dropdown for user:', user);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Prefer actual avatar if provided; support common field names
  const avatarUrl = (user as any)?.avatar || (user as any)?.picture || (user as any)?.image;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 bg-[#191B1D] text-white px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:bg-[#2A2D2F]"
        title="User Profile"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-6 h-6 rounded-full border border-gray-600 object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
        )}
        
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M7 10L12 15L17 10" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#191919] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md z-50 overflow-hidden">
          <div className="bg-white/5 rounded-lg p-3 m-2 flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium mb-0.5 truncate">
                {user.name || "User"}
              </div>
              <div className="text-white/60 text-xs truncate">
                {user.email || ""}
              </div>
            </div>
            
            <button className="text-white p-1 rounded hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.50023C18.8978 2.10297 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10297 21.5 2.50023C21.8978 2.89749 22.1221 3.43711 22.1221 4.00023C22.1221 4.56335 21.8978 5.10297 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="px-2">
            {[
              { icon: "⚙️", text: "Settings", active: true },
              { icon: "👤", text: "My Profile" },
              { icon: "ℹ️", text: "Help & Resources" },
              { icon: "➕", text: "Add Account" }
            ].map((item, index) => (
              <div
                key={index}
                className={`p-2.5 px-3 text-white text-sm cursor-pointer rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                  item.active 
                    ? 'bg-white/5' 
                    : 'hover:bg-white/10'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-[#8B4513] text-[#FFA500] text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#A0522D] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
