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
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#191919] border-0 rounded-xl shadow-2xl backdrop-blur-md z-50 overflow-hidden">
          <div className="bg-white/5 rounded-lg p-2 m-2 flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium mb-0.5 truncate">
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
              { 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2569 9.77251 19.9859C9.5799 19.7148 9.31074 19.5067 9 19.39C8.69838 19.2569 8.36381 19.2172 8.03941 19.276C7.71502 19.3348 7.41568 19.4895 7.18 19.72L7.12 19.78C6.93425 19.966 6.71368 20.1135 6.47088 20.2141C6.22808 20.3148 5.96783 20.3666 5.705 20.3666C5.44217 20.3666 5.18192 20.3148 4.93912 20.2141C4.69632 20.1135 4.47575 19.966 4.29 19.78C4.10405 19.5943 3.95653 19.3737 3.85588 19.1309C3.75523 18.8881 3.70343 18.6278 3.70343 18.365C3.70343 18.1022 3.75523 17.8419 3.85588 17.5991C3.95653 17.3563 4.10405 17.1357 4.29 16.95L4.35 16.89C4.58054 16.6543 4.73519 16.355 4.794 16.0306C4.85282 15.7062 4.81312 15.3716 4.68 15.07C4.55324 14.7742 4.34276 14.522 4.07447 14.3443C3.80618 14.1666 3.49179 14.0713 3.17 14.07H3C2.46957 14.07 1.96086 13.8593 1.58579 13.4842C1.21071 13.1091 1 12.6004 1 12.07C1 11.5396 1.21071 11.0309 1.58579 10.6558C1.96086 10.2807 2.46957 10.07 3 10.07H3.09C3.42099 10.0623 3.742 9.95512 4.01309 9.76251C4.28417 9.5699 4.49226 9.30074 4.61 9C4.74312 8.69838 4.78282 8.36381 4.724 8.03941C4.66519 7.71502 4.51054 7.41568 4.28 7.18L4.22 7.12C4.03405 6.93425 3.88653 6.71368 3.78588 6.47088C3.68523 6.22808 3.63343 5.96783 3.63343 5.705C3.63343 5.44217 3.68523 5.18192 3.78588 4.93912C3.88653 4.69632 4.03405 4.47575 4.22 4.29C4.40575 4.10405 4.62632 3.95653 4.86912 3.85588C5.11192 3.75523 5.37217 3.70343 5.635 3.70343C5.89783 3.70343 6.15808 3.75523 6.40088 3.85588C6.64368 3.95653 6.86425 4.10405 7.05 4.29L7.11 4.35C7.34568 4.58054 7.64502 4.73519 7.96941 4.794C8.29381 4.85282 8.62838 4.81312 8.93 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ), 
                text: "Settings", 
                active: true 
              },
              { 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ), 
                text: "My Profile" 
              },
              { 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ), 
                text: "Help & Resources" 
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`p-1.5 px-3 text-white text-xs cursor-pointer rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                  item.active 
                    ? 'bg-white/5' 
                    : 'hover:bg-white/10'
                }`}
              >
                <span className="w-4 flex justify-center text-white">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
