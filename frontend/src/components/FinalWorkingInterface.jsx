import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectApi } from '../services/project';
import { creditApi } from '../services/credit';
import ChatLoginButton from './ChatLoginButton';

const FinalWorkingInterface = () => {
  console.log('🔧 FinalWorkingInterface rendering...');
  
  const { user, isAuthenticated } = useAuth();
  
  // Local state instead of useProjectStore
  const [recentProjects, setRecentProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  
  console.log('🔧 Auth state:', { isAuthenticated, user: user?.email });

  // Load user data with direct API calls
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('🔧 Loading user data with direct APIs...');
      
      // Load credits and projects in parallel
      const [creditsResponse, projectsResponse] = await Promise.all([
        creditApi.getBalance(user.id),
        projectApi.getProjects({ page: 1, limit: 50 }) // Get more projects for "All Projects"
      ]);
      
      console.log('🔧 Credits response:', creditsResponse);
      console.log('🔧 Projects response:', projectsResponse);
      
      // Set credit balance
      setCreditBalance(creditsResponse?.credits || 0);
      
      // Set projects
      const projectsData = projectsResponse?.data || projectsResponse || [];
      if (Array.isArray(projectsData)) {
        const sortedProjects = [...projectsData]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        // Set recent projects (first 6)
        setRecentProjects(sortedProjects.slice(0, 6));
        
        // Load images for all projects
        const projectsWithImages = await Promise.all(
          sortedProjects.map(async (project) => {
            try {
              const imagesResponse = await projectApi.getProjectImages(project.id, { page: 1, limit: 1 });
              const images = imagesResponse?.data || [];
              let segmentImage = null;
              
              if (images.length > 0 && images[0]?.imageFiles?.[0]?.s3Key) {
                segmentImage = `https://ds0fghatf06yb.cloudfront.net/${images[0].imageFiles[0].s3Key}`;
              }
              
              return {
                ...project,
                segmentImage,
                hasImage: images.length > 0
              };
            } catch (err) {
              console.error(`Failed to load image for project ${project.id}:`, err);
              return {
                ...project,
                segmentImage: null,
                hasImage: false
              };
            }
          })
        );
        
        setAllProjects(projectsWithImages);
      }
      
      console.log('🔧 User data loaded successfully');
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔧 Loading real data for user:', user.id);
      loadUserData();
    }
  }, [isAuthenticated, user?.id, loadUserData]);

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
      
      // Add to recent projects
      setRecentProjects(prev => [newProject, ...prev.slice(0, 5)]);
      
      // Navigate to main editor with chat flow
      navigateToEditorWithChat(newProject, description.trim());
      
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingProject(false);
    }
  };

  const navigateToEditorWithChat = (project, prompt) => {
    try {
      console.log('🎯 Navigating to main editor with project:', project);
      console.log('🎯 Starting chat flow with prompt:', prompt);
      
      // Close the chat interface overlay
      if (typeof window.hideChatInterface === 'function') {
        window.hideChatInterface();
      } else {
        // Fallback: hide the overlay directly
        const overlay = document.querySelector('react-chat-interface');
        if (overlay) {
          overlay.style.display = 'none';
        }
      }
      
      // Set the project as selected in project store for the main app
      localStorage.setItem('project-store-selectedProject', JSON.stringify(project));
      
      // If we have a prompt, also set it for the chat flow
      if (prompt && prompt.trim()) {
        localStorage.setItem('chatInterfacePrompt', prompt.trim());
        localStorage.setItem('startChatFlow', 'true');
      }
      
      // Dispatch events to notify the main app components
      window.dispatchEvent(new CustomEvent('projectSelected', { 
        detail: { project, prompt: prompt || '', startChat: !!prompt } 
      }));
      
      // Specifically notify ChatWidget if it exists
      window.dispatchEvent(new CustomEvent('openChatWithPrompt', { 
        detail: { 
          project, 
          prompt: prompt || '', 
          autoStart: !!prompt 
        } 
      }));
      
      console.log('✅ Successfully set up navigation to main editor');
      
    } catch (error) {
      console.error('Failed to navigate to editor:', error);
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
  if (!isAuthenticated) {
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
            console.log('Close button clicked');
            if (typeof window.hideChatInterface === 'function') {
              window.hideChatInterface();
            } else {
              // Fallback: hide the overlay directly
              const overlay = document.querySelector('react-chat-interface');
              if (overlay) {
                overlay.style.display = 'none';
              }
            }
          }}
          className="fixed top-4 right-4 z-[9999] w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-red-500"
          title="Close Chat Interface"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-white text-3xl font-bold mb-4">Welcome to AI Video Creator</h2>
            <p className="text-gray-400 mb-8">Please sign in to start creating amazing videos with AI</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main interface (logged in)
  return (
    <div className="w-full h-screen bg-gray-900 flex">
      <button 
        onClick={() => {
          console.log('Close button clicked (main interface)');
          if (typeof window.hideChatInterface === 'function') {
            window.hideChatInterface();
          } else {
            // Fallback: hide the overlay directly
            const overlay = document.querySelector('react-chat-interface');
            if (overlay) {
              overlay.style.display = 'none';
            }
          }
        }}
        className="fixed top-4 right-4 z-[9999] w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-red-500"
        title="Close Chat Interface"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
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
        
        {/* Credits - Real data */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-white font-medium mb-2">Credits</h3>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {loading ? '...' : creditBalance}
          </div>
          <p className="text-gray-400 text-sm">Available credits</p>
          <button 
            onClick={() => alert('Add credits functionality coming soon!')}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Add Credits
          </button>
        </div>
        
        {/* All Projects Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowAllProjects(!showAllProjects)}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              showAllProjects 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {showAllProjects ? 'Hide All Projects' : `All Projects (${allProjects.length})`}
          </button>
        </div>

        {/* Recent Projects Sidebar - Real data */}
        <div>
          <h3 className="text-white font-medium mb-3">Recent Projects</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading projects...</div>
            ) : recentProjects.length > 0 ? (
              recentProjects.slice(0, 3).map((project) => (
                <div 
                  key={project.id}
                  onClick={() => console.log('Selected project:', project)}
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
        
        {/* All Projects Section */}
        <div className="flex-1 p-6 pt-0 overflow-y-auto">
          <h2 className="text-white font-medium mb-4">
            {showAllProjects ? `All Projects (${allProjects.length})` : `Recent Projects (${Math.min(recentProjects.length, 6)})`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: showAllProjects ? 12 : 6 }, (_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden animate-pulse">
                  <div className="w-full h-32 bg-gray-700"></div>
                  <div className="p-3">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : (showAllProjects ? allProjects : recentProjects.slice(0, 6)).length > 0 ? (
              (showAllProjects ? allProjects : recentProjects.slice(0, 6)).map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => {
                    console.log('Opening project:', project);
                    navigateToEditorWithChat(project, '');
                  }}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors cursor-pointer"
                >
                  {/* Project Image */}
                  <div className="w-full h-32 bg-gray-700 flex items-center justify-center overflow-hidden">
                    {showAllProjects && project.segmentImage ? (
                      <img
                        src={project.segmentImage}
                        alt={project.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center ${showAllProjects && project.segmentImage ? 'hidden' : 'flex'}`}
                    >
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Project Info */}
                  <div className="p-3">
                    <h3 className="text-white font-medium text-sm truncate mb-1" title={project.name}>
                      {project.name}
                    </h3>
                    <p className="text-gray-400 text-xs mb-2">{formatTimeAgo(project.updatedAt)}</p>
                    {project.description && (
                      <p className="text-gray-500 text-xs truncate" title={project.description}>
                        {project.description}
                      </p>
                    )}
                    {showAllProjects && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${project.hasImage ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                        <span className="text-xs text-gray-400">
                          {project.hasImage ? 'Has content' : 'No content'}
                        </span>
                      </div>
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

export default FinalWorkingInterface;
