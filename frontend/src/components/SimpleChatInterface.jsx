import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProjectStore } from '../store/useProjectStore';
import { projectApi } from '../services/project';
import ChatLoginButton from './ChatLoginButton';

const SimpleChatInterface = () => {
  console.log('🔧 SimpleChatInterface rendering...');
  
  const { user, isAuthenticated } = useAuth();
  const {
    projects,
    creditBalance,
    loading,
    fetchProjects,
    fetchBalance,
    setSelectedProject,
  } = useProjectStore();

  const [recentProjects, setRecentProjects] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const showLogin = !isAuthenticated;

  // Load real data when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔧 Loading real data for user:', user.id);
      loadUserData();
    }
  }, [isAuthenticated, user?.id, loadUserData]);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      await Promise.all([
        fetchBalance(user.id),
        fetchProjects(1, 20),
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [user?.id, fetchBalance, fetchProjects]);

  // Update recent projects when projects change
  useEffect(() => {
    if (projects?.data) {
      const sortedProjects = [...projects.data]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
      setRecentProjects(sortedProjects);
    }
  }, [projects]);

  const handleCreateProject = async (description = '') => {
    if (!description.trim()) return;
    
    setIsCreatingProject(true);
    try {
      console.log('🚀 Creating new project with description:', description);
      
      const projectName = `Project ${new Date().toLocaleString()}`;
      const newProject = await projectApi.createProject({
        name: projectName,
        description: description.trim(),
      });

      console.log('✅ Project created:', newProject);
      setSelectedProject(newProject);
      await fetchProjects(1, 20);
      setChatInput('');
      alert('Project created successfully!');
      
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingProject(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };
  
  // Login screen
  if (showLogin) {
    return (
      <div className="w-full h-screen bg-gray-900">
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
            <h1 className="text-white text-xl font-bold">Usuals.ai</h1>
          </div>
          <ChatLoginButton />
        </div>

        <button 
          onClick={() => {
            if (typeof window.hideChatInterface === 'function') {
              window.hideChatInterface();
            }
          }}
          className="fixed top-4 right-20 z-50 w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center text-white text-sm"
        >
          ✕
        </button>
        
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-white text-3xl font-bold mb-4">Welcome to AI Video Creator</h2>
            <p className="text-gray-400 mb-8">Please sign in to start creating amazing videos with AI</p>
            <div className="text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Sign in using the button in the top right corner</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main interface
  return (
    <div className="w-full h-screen bg-gray-900 flex">
      <button 
        onClick={() => {
          if (typeof window.hideChatInterface === 'function') {
            window.hideChatInterface();
          }
        }}
        className="fixed top-4 right-4 z-50 w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center text-white text-sm"
      >
        ✕
      </button>
      
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">{user?.email || 'User'}</h2>
              <p className="text-gray-400 text-sm">Pro Member</p>
            </div>
          </div>
        </div>
        
        {/* Credits */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-white font-medium mb-2">Credits</h3>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {loading ? '...' : creditBalance || 0}
          </div>
          <p className="text-gray-400 text-sm">Available credits</p>
          <button 
            onClick={() => alert('Add credits functionality coming soon!')}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Add Credits
          </button>
        </div>
        
        {/* Recent Projects Sidebar */}
        <div>
          <h3 className="text-white font-medium mb-3">Recent Projects</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading projects...</div>
            ) : recentProjects.length > 0 ? (
              recentProjects.slice(0, 3).map((project) => (
                <div 
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    console.log('Selected project:', project);
                  }}
                  className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="w-full h-16 bg-gray-600 rounded mb-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{project.name}</p>
                  <p className="text-gray-400 text-xs">{formatTimeAgo(project.updatedAt)}</p>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No projects yet</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">AI Video Creator</h1>
          <button 
            onClick={() => handleCreateProject('Quick project creation')}
            disabled={isCreatingProject}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isCreatingProject ? 'Creating...' : '+ New Project'}
          </button>
        </div>
        
        {/* Chat Box */}
        <div className="p-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-white font-medium mb-4">What would you like to create today?</h2>
            <div className="flex gap-3">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Describe your video idea..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isCreatingProject) {
                    handleCreateProject(chatInput);
                  }
                }}
                disabled={isCreatingProject}
              />
              <button 
                onClick={() => handleCreateProject(chatInput)}
                disabled={isCreatingProject || !chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {isCreatingProject ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Recent Projects Grid */}
        <div className="flex-1 p-6 pt-0">
          <h2 className="text-white font-medium mb-4">Recent Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden animate-pulse">
                  <div className="w-full h-32 bg-gray-700"></div>
                  <div className="p-3">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => {
                    setSelectedProject(project);
                    console.log('Opening project:', project);
                  }}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-medium text-sm truncate" title={project.name}>
                      {project.name}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">{formatTimeAgo(project.updatedAt)}</p>
                    {project.description && (
                      <p className="text-gray-500 text-xs mt-1 truncate" title={project.description}>
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-gray-400 text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-4">Start creating amazing videos with AI</p>
                <button 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Describe your video idea..."]');
                    input?.focus();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Your First Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatInterface;