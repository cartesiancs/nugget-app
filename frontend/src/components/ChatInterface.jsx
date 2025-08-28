import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChatFlow } from '../hooks/useChatFlow';
import { useProjectStore } from '../store/useProjectStore';
import { projectApi } from '../services/project';
import ChatLoginButton from './ChatLoginButton';
import { 
  getTextCreditCost, 
  getImageCreditCost, 
  getVideoCreditCost
} from '../lib/pricing';

const ChatInterface = () => {
  console.log('🔧 ChatInterface component rendering...');
  
  const { user, isAuthenticated } = useAuth();
  const chatFlow = useChatFlow();
  
  console.log('🔧 Auth state:', { isAuthenticated, user: user?.email });
  const { 
    creditBalance, 
    fetchBalance, 
    setSelectedProject,
    loadingData 
  } = useProjectStore();

  // UI State
  const [message, setMessage] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loadingRecents, setLoadingRecents] = useState(false);

  // Refs
  const messageInputRef = useRef(null);
  const projectNameRef = useRef(null);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchBalance(user.id);
      loadRecentProjects();
    }
  }, [isAuthenticated, user?.id, fetchBalance, loadRecentProjects]);

  // Load recent projects with their videos for demo
  const loadRecentProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoadingRecents(true);
    try {
      const projectsData = await projectApi.getProjects({ page: 1, limit: 6 });
      
      // Enrich projects with first video for demo
      const enrichedProjects = await Promise.all(
        (projectsData?.data || projectsData || []).map(async (project) => {
          try {
            const videosResponse = await projectApi.getProjectVideos(project.id, { page: 1, limit: 1 });
            const videos = videosResponse?.data || [];
            let demoVideo = null;
            
            if (videos.length > 0 && videos[0]?.videoFiles?.[0]?.s3Key) {
              demoVideo = `https://ds0fghatf06yb.cloudfront.net/${videos[0].videoFiles[0].s3Key}`;
            }
            
            return {
              ...project,
              demoVideo,
              hasContent: videos.length > 0
            };
          } catch (err) {
            console.error(`Failed to load demo video for project ${project.id}:`, err);
            return {
              ...project,
              demoVideo: null,
              hasContent: false
            };
          }
        })
      );
      
      setRecentProjects(enrichedProjects);
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    } finally {
      setLoadingRecents(false);
    }
  }, [isAuthenticated]);

  // Auto-create project and start agent workflow
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || chatFlow.loading || !isAuthenticated) return;

    const prompt = message.trim();
    setMessage(''); // Clear immediately for better UX

    try {
      // Create project automatically with timestamp
      const timestamp = new Date().toLocaleString();
      const projectName = `Chat Project ${timestamp}`;
      
      setCreatingProject(true);
      const newProject = await projectApi.createProject({
        name: projectName,
        description: `Auto-created from chat: "${prompt.substring(0, 100)}..."`
      });

      // Set as selected project
      setSelectedProject(newProject);
      
      // Add to recent projects
      setRecentProjects(prev => [{ ...newProject, hasContent: false }, ...prev.slice(0, 5)]);
      
      setCreatingProject(false);

      // Start agent workflow with the prompt
      await chatFlow.startAgentStream(prompt);
      
    } catch (error) {
      console.error('Failed to create project or start agent:', error);
      chatFlow.setError('Failed to start conversation. Please try again.');
      setCreatingProject(false);
    }
  }, [message, chatFlow, isAuthenticated, setSelectedProject]);

  // Handle project creation
  const handleCreateProject = useCallback(async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      const newProject = await projectApi.createProject({
        name: newProjectName,
        description: newProjectDesc
      });

      setSelectedProject(newProject);
      setRecentProjects(prev => [{ ...newProject, hasContent: false }, ...prev.slice(0, 5)]);
      
      setShowCreateProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreatingProject(false);
    }
  }, [newProjectName, newProjectDesc, setSelectedProject]);

  // Select recent project
  const handleSelectProject = useCallback(async (project) => {
    setSelectedProject(project);
    
    // Load project data
    if (project.id) {
      try {
        await chatFlow.loadProjectData();
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    }
  }, [setSelectedProject, chatFlow]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to close overlay and show main Electron UI
  const handleCloseOverlay = useCallback(() => {
    // Use global function if available, otherwise fallback to direct manipulation
    if (typeof window.hideChatInterface === 'function') {
      window.hideChatInterface();
    } else {
      const overlay = document.getElementById('chat-interface-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex relative">
        {/* Debug indicator */}
        <div className="fixed top-0 left-0 bg-green-500 text-white p-2 text-xs z-50">
          Login Screen Loaded ✓
        </div>
        
        {/* Close/Cross Button */}
        <button
          onClick={handleCloseOverlay}
          className="fixed top-4 right-4 z-50 w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors border border-gray-600"
          title="Switch to Main Editor UI"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Sidebar - Branding */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col justify-center items-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">U</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Usuals.ai</h2>
            <p className="text-gray-400 text-sm">AI Video Creator</p>
          </div>

          {/* Features List */}
          <div className="mt-8 space-y-3 w-full">
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>AI-powered video creation</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Automated script generation</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Image & video synthesis</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Professional workflows</span>
            </div>
          </div>
        </div>

        {/* Right Content - Login */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-3">Welcome to AI Video Creator</h1>
              <p className="text-gray-400">Sign in to start creating amazing videos with AI assistance</p>
            </div>

            {/* Login Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <ChatLoginButton />
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                By signing in, you agree to our terms of service and privacy policy
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex relative">
      {/* Debug indicator */}
      <div className="fixed top-0 left-0 bg-red-500 text-white p-2 text-xs z-50">
        ChatInterface Loaded ✓
      </div>
      
      {/* Close/Cross Button */}
      <button
        onClick={handleCloseOverlay}
        className="fixed top-4 right-4 z-50 w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors border border-gray-600"
        title="Switch to Main Editor UI"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Left Sidebar - Credits & Info */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <h2 className="text-white font-semibold">Usuals.ai</h2>
              <p className="text-gray-400 text-sm">AI Video Creator</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name || user?.email || 'User'}
              </p>
              <p className="text-gray-400 text-xs">Active</p>
            </div>
          </div>
        </div>

        {/* Credits Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Credits</h3>
            <button
              onClick={() => user?.id && fetchBalance(user.id)}
              className="text-blue-400 hover:text-blue-300 text-sm"
              disabled={loadingData.balance}
            >
              {loadingData.balance ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {creditBalance || 0}
              </div>
              <div className="text-blue-200 text-sm">Available Credits</div>
            </div>
          </div>

          {/* Credit Costs */}
          <div className="space-y-2">
            <h4 className="text-gray-300 text-sm font-medium mb-3">Cost per Operation</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Web Research</span>
                <span className="text-gray-300">{getTextCreditCost('web-info')} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Concept Generation</span>
                <span className="text-gray-300">{getTextCreditCost('concept generator')} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Script Generation</span>
                <span className="text-gray-300">{getTextCreditCost('script & segmentation')} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Image Generation</span>
                <span className="text-gray-300">{getImageCreditCost('flux-1.1-pro')} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Video Generation (5s)</span>
                <span className="text-gray-300">{getVideoCreditCost('gen4_turbo', 5)} credits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Project */}
        {chatFlow.selectedProject && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-white font-semibold mb-3">Current Project</h3>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-white text-sm font-medium mb-1">
                {chatFlow.selectedProject.name}
              </p>
              <p className="text-gray-400 text-xs">
                {chatFlow.selectedProject.description || 'No description'}
              </p>
              {chatFlow.selectedProject.createdAt && (
                <p className="text-gray-500 text-xs mt-2">
                  Created: {new Date(chatFlow.selectedProject.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Agent Activity */}
        {chatFlow.agentActivity && (
          <div className="p-6 border-t border-gray-700">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-200 text-sm">{chatFlow.agentActivity}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800/50  border-b border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">AI Video Creator</h1>
            <p className="text-gray-400 text-sm">Create amazing videos with AI assistance</p>
          </div>
          
          {/* +Project Button */}
          <button
            onClick={() => setShowCreateProject(true)}
            className="bg-[#F9D312] hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            disabled={creatingProject}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
          {/* Welcome Message */}
          {!chatFlow.selectedProject && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M4 7h16M6 7v11a2 2 0 002 2h8a2 2 0 002-2V7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to AI Video Creator</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start a conversation to automatically create a new project and generate amazing video content with AI.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          {chatFlow.allUserMessages.length > 0 && (
            <div className="flex-1 mb-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatFlow.allUserMessages.slice().reverse().map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-blue-600/20 border border-blue-500/30 ml-12' 
                        : 'bg-gray-700 border border-gray-600/30 mr-12'
                    }`}
                  >
                    <p className="text-white text-sm">{msg.content}</p>
                    <span className="text-gray-500 text-xs mt-2 block">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Approvals */}
          {chatFlow.pendingApprovals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">Pending Approvals</h3>
              <div className="space-y-3">
                {chatFlow.pendingApprovals.map((approval) => (
                  <div key={approval.id} className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-white text-sm mb-3">
                      Ready to execute: <span className="font-medium">{approval.toolName}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => chatFlow.approveToolExecution(approval.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => chatFlow.rejectToolExecution(approval.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit Deduction Message */}
          {chatFlow.creditDeductionMessage && (
            <div className="mb-6">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-200 text-sm">{chatFlow.creditDeductionMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {chatFlow.error && (
            <div className="mb-6">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-200 text-sm">{chatFlow.error}</p>
                <button
                  onClick={() => chatFlow.setError(null)}
                  className="text-red-300 hover:text-red-200 text-xs mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="bg-gray-800/50  rounded-lg border border-gray-700 p-4">
            <div className="flex gap-3">
              <textarea
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe the video you want to create..."
                className="flex-1 bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                rows={3}
                disabled={chatFlow.loading || chatFlow.isStreaming || creatingProject}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || chatFlow.loading || chatFlow.isStreaming || creatingProject}
                className="bg-[#F9D312] hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {chatFlow.loading || chatFlow.isStreaming || creatingProject ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
            
            {message.trim() && (
              <p className="text-gray-400 text-xs mt-2">
                This will create a new project and start the AI workflow
              </p>
            )}
          </div>

          {/* Recent Projects */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Recent Projects</h3>
              <button
                onClick={loadRecentProjects}
                className="text-blue-400 hover:text-blue-300 text-sm"
                disabled={loadingRecents}
              >
                {loadingRecents ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loadingRecents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
                    <div className="w-full h-32 bg-gray-600 rounded mb-3"></div>
                    <div className="h-4 bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className="bg-gray-700 hover:bg-gray-700/50 rounded-lg p-4 cursor-pointer transition-colors border border-gray-600/30 hover:border-gray-500/50"
                  >
                    {/* Demo Video */}
                    <div className="w-full h-32 bg-gray-600 rounded mb-3 overflow-hidden flex items-center justify-center">
                      {project.demoVideo ? (
                        <video
                          src={project.demoVideo}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => e.target.pause()}
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M4 7h16M6 7v11a2 2 0 002 2h8a2 2 0 002-2V7" />
                          </svg>
                          <span className="text-xs">No video yet</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Project Info */}
                    <h4 className="text-white font-medium text-sm mb-1 truncate">
                      {project.name}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.hasContent 
                          ? 'bg-green-500/20 text-green-200' 
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {project.hasContent ? 'Has content' : 'Empty'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-400">No projects yet</p>
                <p className="text-gray-500 text-sm">Start a conversation to create your first project</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreateProject}
            className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-4">Create New Project</h3>
            
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Project Name
              </label>
              <input
                ref={projectNameRef}
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter project name"
                required
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Describe your project"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName('');
                  setNewProjectDesc('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                disabled={creatingProject}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#F9D312] hover:bg-yellow-400 text-black py-2 rounded-lg transition-colors"
                disabled={creatingProject || !newProjectName.trim()}
              >
                {creatingProject ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
