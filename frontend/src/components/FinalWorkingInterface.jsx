import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { projectApi } from "../services/project";
import { creditApi } from "../services/credit";
import ChatLoginButton from "./ChatLoginButton";
import CreditPurchase from "./CreditPurchase";
import { assets } from "../assets/assets";

const FinalWorkingInterface = () => {
  console.log("🔧 FinalWorkingInterface rendering...");

  const { user, isAuthenticated } = useAuth();
  const [PaymentSuccessComponent, setPaymentSuccessComponent] = useState(null);

  // Local state instead of useProjectStore
  const [recentProjects, setRecentProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  console.log("🔧 Auth state:", { isAuthenticated, user: user?.email });

  // Load user data with direct API calls
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log("🔧 Loading user data with direct APIs...");

      // Load credits and projects in parallel
      const [creditsResponse, projectsResponse] = await Promise.all([
        creditApi.getBalance(user.id),
        projectApi.getProjects({ page: 1, limit: 50 }), // Get more projects for "All Projects"
      ]);

      console.log("🔧 Credits response:", creditsResponse);
      console.log("🔧 Projects response:", projectsResponse);

      // Set credit balance
      setCreditBalance(creditsResponse?.credits || 0);

      // Set projects
      const projectsData = projectsResponse?.data || projectsResponse || [];
      if (Array.isArray(projectsData)) {
        const sortedProjects = [...projectsData].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        // Set recent projects (first 6)
        setRecentProjects(sortedProjects.slice(0, 6));

        // Load images and videos for all projects
        const projectsWithMedia = await Promise.all(
          sortedProjects.map(async (project) => {
            console.log(
              `🖼️ Loading media for project ${project.id} (${project.name})`,
            );
            try {
              // Get both images and videos with error handling for each
              let imagesResponse = { data: [] };
              let videosResponse = { data: [] };

              try {
                imagesResponse = await projectApi.getProjectImages(project.id, {
                  page: 1,
                  limit: 3,
                });
              } catch (imgErr) {
                console.warn(
                  `Failed to fetch images for project ${project.id}:`,
                  imgErr,
                );
              }

              try {
                videosResponse = await projectApi.getProjectVideos(project.id, {
                  page: 1,
                  limit: 1,
                });
              } catch (vidErr) {
                console.warn(
                  `Failed to fetch videos for project ${project.id}:`,
                  vidErr,
                );
              }

              console.log(
                `📸 Images response for ${project.id}:`,
                imagesResponse,
              );
              console.log(
                `🎥 Videos response for ${project.id}:`,
                videosResponse,
              );

              const images = imagesResponse?.data || imagesResponse || [];
              const videos = videosResponse?.data || videosResponse || [];

              console.log(
                `📊 Project ${project.id} - Images: ${images.length}, Videos: ${videos.length}`,
              );

              let thumbnail = null;
              let mediaType = "none";

              // Only show images in preview, not videos
              if (images.length > 0) {
                const image = images[0];
                console.log(`🖼️ First image for ${project.id}:`, image);

                if (image?.s3Key) {
                  thumbnail = `https://ds0fghatf06yb.cloudfront.net/${image.s3Key}`;
                  mediaType = "image";
                } else if (image?.imageFiles?.[0]?.s3Key) {
                  thumbnail = `https://ds0fghatf06yb.cloudfront.net/${image.imageFiles[0].s3Key}`;
                  mediaType = "image";
                } else if (image?.url) {
                  thumbnail = image.url;
                  mediaType = "image";
                }
              }

              // Still log video info for debugging but don't use for thumbnails
              if (videos.length > 0) {
                console.log(
                  `🎬 Videos found for ${project.id}: ${videos.length} (not shown in preview)`,
                );
              }

              console.log(
                `✅ Final media for ${project.id}: thumbnail=${thumbnail}, type=${mediaType}`,
              );

              return {
                ...project,
                thumbnail,
                mediaType,
                imageCount: images.length,
                videoCount: videos.length,
                hasMedia: images.length > 0, // Only consider images for hasMedia since we only show images
                allImages: images
                  .slice(0, 3)
                  .map((img) => ({
                    url: img.s3Key
                      ? `https://ds0fghatf06yb.cloudfront.net/${img.s3Key}`
                      : img.imageFiles?.[0]?.s3Key
                      ? `https://ds0fghatf06yb.cloudfront.net/${img.imageFiles[0].s3Key}`
                      : img.url || null,
                    alt: img.name || "Project image",
                  }))
                  .filter((img) => img.url),
              };
            } catch (err) {
              console.error(
                `❌ Failed to load media for project ${project.id}:`,
                err,
              );
              return {
                ...project,
                thumbnail: null,
                mediaType: "none",
                imageCount: 0,
                videoCount: 0,
                hasMedia: false,
                allImages: [],
              };
            }
          }),
        );

        setAllProjects(projectsWithMedia);
      }

      console.log("🔧 User data loaded successfully");
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log("🔧 Loading real data for user:", user.id);
      loadUserData();
    }
  }, [isAuthenticated, user?.id, loadUserData]);

  // Check for payment success and load component dynamically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      setShowPaymentSuccess(true);
      // Dynamically import PaymentSuccess component
      import("./PaymentSuccess").then((module) => {
        setPaymentSuccessComponent(() => module.default);
      });
    }
  }, []);

  const handleCreateProject = async (description = "") => {
    if (!description.trim()) return;

    setIsCreatingProject(true);
    try {
      console.log("🚀 Creating new project with description:", description);

      const projectName = `Project ${new Date().toLocaleString()}`;
      const newProject = await projectApi.createProject({
        name: projectName,
        description: description.trim(),
      });

      console.log("✅ Project created:", newProject);

      // Add to recent projects
      setRecentProjects((prev) => [newProject, ...prev.slice(0, 5)]);

      // Navigate to main editor with chat flow
      navigateToEditorWithChat(newProject, description.trim());
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project: " + (error.message || "Unknown error"));
    } finally {
      setIsCreatingProject(false);
    }
  };

  const navigateToEditorWithChat = (project, prompt) => {
    try {
      console.log("🎯 Navigating to main editor with project:", project);
      console.log("🎯 Starting chat flow with prompt:", prompt);

      // Close the chat interface overlay
      if (typeof window.hideChatInterface === "function") {
        window.hideChatInterface();
      } else {
        // Fallback: hide the overlay directly
        const overlay = document.querySelector("react-chat-interface");
        if (overlay) {
          overlay.style.display = "none";
        }
      }

      // Set the project as selected in project store for the main app
      localStorage.setItem(
        "project-store-selectedProject",
        JSON.stringify(project),
      );

      // If we have a prompt, also set it for the chat flow
      if (prompt && prompt.trim()) {
        localStorage.setItem("chatInterfacePrompt", prompt.trim());
        localStorage.setItem("startChatFlow", "true");
      }

      // Dispatch events to notify the main app components
      window.dispatchEvent(
        new CustomEvent("projectSelected", {
          detail: { project, prompt: prompt || "", startChat: !!prompt },
        }),
      );

      // Specifically notify ChatWidget if it exists
      window.dispatchEvent(
        new CustomEvent("openChatWithPrompt", {
          detail: {
            project,
            prompt: prompt || "",
            autoStart: !!prompt,
          },
        }),
      );

      console.log("✅ Successfully set up navigation to main editor");
    } catch (error) {
      console.error("Failed to navigate to editor:", error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className='w-full h-screen bg-gray-900'>
        <div className='bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold'>U</span>
            </div>
            <h1 className='text-white text-xl font-bold'>Usuals.ai</h1>
          </div>
          <ChatLoginButton />
        </div>

        <button
          onClick={() => {
            console.log("Close button clicked");
            if (typeof window.hideChatInterface === "function") {
              window.hideChatInterface();
            } else {
              // Fallback: hide the overlay directly
              const overlay = document.querySelector("react-chat-interface");
              if (overlay) {
                overlay.style.display = "none";
              }
            }
          }}
          className='fixed top-4 right-4 z-[9999] w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-red-500'
          title='Close Chat Interface'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        <div className='flex-1 flex items-center justify-center h-full'>
          <div className='text-center'>
            <h2 className='text-white text-3xl font-bold mb-4'>
              Welcome to AI Video Creator
            </h2>
            <p className='text-gray-400 mb-8'>
              Please sign in to start creating amazing videos with AI
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main interface (logged in) - Updated Layout
  return (
    <div className='w-full h-screen bg-black flex flex-col'>
      {/* Full Width Header */}
      <div className='w-full bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center z-10'>
        <div className='flex items-center gap-3'>
          <img src={assets.SandBoxLogo} alt='Usuals.ai' className='w-8 h-8' />
          <h1 className='text-white text-2xl font-bold'>Usuals.ai</h1>
        </div>
        <button
          onClick={() => handleCreateProject("Quick project creation")}
          disabled={isCreatingProject}
          className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors'
        >
          {isCreatingProject ? "Creating..." : "+ New Project"}
        </button>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex relative'>
        {/* Floating Left Sidebar */}
        <div className='absolute left-4 top-4 w-80 bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-2xl z-20 max-h-[calc(100vh-8rem)] overflow-y-auto'>
          {/* Credits - Real data */}
          <div className='bg-gray-700 rounded-lg p-4 mb-6'>
            <h3 className='text-white font-medium mb-2'>Credits</h3>
            <div className='text-2xl font-bold text-blue-400 mb-1'>
              {loading ? "..." : creditBalance}
            </div>
            <p className='text-gray-400 text-sm'>Available credits</p>
            <button
              onClick={() => {
                const token = localStorage.getItem("authToken");
                console.log("🔘 User object:", user);
                console.log("🔘 User ID:", user?.id);
                console.log("🔘 Token exists:", !!token);

                if (user?.id && token) {
                  const purchaseUrl = `https://register.usuals.ai/purchase/${user.id}/${token}`;
                  console.log("🔘 Final purchase URL:", purchaseUrl);
                  window.open(purchaseUrl, "_blank");
                } else {
                  console.error("Missing user ID or auth token", {
                    userId: user?.id,
                    hasToken: !!token,
                  });
                  alert("Please log in first to purchase credits");
                }
              }}
              className='w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors'
            >
              Add Credits
            </button>
          </div>

          {/* All Projects Toggle */}
          <div className='mb-6'>
            <button
              onClick={() => setShowAllProjects(!showAllProjects)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                showAllProjects
                  ? "bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                />
              </svg>
              {showAllProjects
                ? "Hide All Projects"
                : `All Projects (${allProjects.length})`}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col ml-96 mr-4'>
          {/* Chat Box */}
          <div className='p-6'>
            <div className='bg-gray-800 rounded-lg border border-gray-700 p-4'>
              <h2 className='text-white font-medium mb-4'>
                What would you like to create today?
              </h2>
              <div className='flex gap-3'>
                <input
                  type='text'
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder='Describe your video idea...'
                  className='flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isCreatingProject) {
                      handleCreateProject(chatInput);
                    }
                  }}
                  disabled={isCreatingProject}
                />
                <button
                  onClick={() => handleCreateProject(chatInput)}
                  disabled={isCreatingProject || !chatInput.trim()}
                  className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'
                >
                  {isCreatingProject ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>

          {/* All Projects Section */}
          <div className='flex-1 p-6 pt-0 overflow-y-auto'>
            <h2 className='text-white font-medium mb-4'>
              {showAllProjects
                ? `All Projects (${allProjects.length})`
                : `Recent Projects (${Math.min(recentProjects.length, 6)})`}
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {loading ? (
                Array.from({ length: showAllProjects ? 12 : 6 }, (_, i) => (
                  <div
                    key={i}
                    className='bg-gray-800 rounded-lg border border-gray-700 overflow-hidden animate-pulse'
                  >
                    <div className='w-full h-32 bg-gray-700'></div>
                    <div className='p-3'>
                      <div className='h-4 bg-gray-700 rounded mb-2'></div>
                      <div className='h-3 bg-gray-700 rounded w-2/3'></div>
                    </div>
                  </div>
                ))
              ) : (showAllProjects ? allProjects : recentProjects.slice(0, 6))
                  .length > 0 ? (
                (showAllProjects
                  ? allProjects
                  : recentProjects.slice(0, 6)
                ).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      console.log("Opening project:", project);
                      navigateToEditorWithChat(project, "");
                    }}
                    className='bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors cursor-pointer'
                  >
                    {/* Project Media */}
                    <div className='w-full h-32 bg-gray-700 flex items-center justify-center overflow-hidden relative group'>
                      {project.thumbnail ? (
                        <>
                          <img
                            src={project.thumbnail}
                            alt={project.name}
                            className='w-full h-full object-cover transition-transform group-hover:scale-105'
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />

                          {/* Image overlay for multiple images */}
                          {project.mediaType === "image" &&
                            project.allImages.length > 1 && (
                              <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'>
                                <div className='absolute bottom-2 left-2 flex items-center gap-1'>
                                  <div className='bg-blue-600 px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1'>
                                    <svg
                                      className='w-3 h-3'
                                      fill='none'
                                      stroke='currentColor'
                                      viewBox='0 0 24 24'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                      />
                                    </svg>
                                    +{project.allImages.length - 1}
                                  </div>
                                </div>
                              </div>
                            )}
                          <div className='w-full h-full hidden items-center justify-center'>
                            <svg
                              className='w-12 h-12 text-gray-400'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1}
                                d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                              />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className='w-full h-full flex flex-col items-center justify-center'>
                          <svg
                            className='w-12 h-12 text-gray-400 mb-2'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={1}
                              d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                            />
                          </svg>
                          <span className='text-xs text-gray-500'>
                            No media
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Project Info */}
                    <div className='p-3'>
                      <h3
                        className='text-white font-medium text-sm truncate mb-1'
                        title={project.name}
                      >
                        {project.name}
                      </h3>
                      <p className='text-gray-400 text-xs mb-2'>
                        {formatTimeAgo(project.updatedAt)}
                      </p>
                      {project.description && (
                        <p
                          className='text-gray-500 text-xs truncate'
                          title={project.description}
                        >
                          {project.description}
                        </p>
                      )}
                      <div className='flex items-center gap-2 mt-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            project.hasMedia ? "bg-green-400" : "bg-gray-500"
                          }`}
                        ></div>
                        <span className='text-xs text-gray-400'>
                          {project.hasMedia ? "Has content" : "No content"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='col-span-full text-center py-12'>
                  <svg
                    className='w-16 h-16 text-gray-600 mx-auto mb-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1}
                      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                  <h3 className='text-gray-400 text-lg font-medium mb-2'>
                    No projects yet
                  </h3>
                  <p className='text-gray-500 mb-4'>
                    Start creating amazing videos with AI
                  </p>
                  <button
                    onClick={() => {
                      const input = document.querySelector(
                        'input[placeholder="Describe your video idea..."]',
                      );
                      input?.focus();
                    }}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
                  >
                    Create Your First Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Purchase Modal */}
      {showCreditPurchase && (
        <CreditPurchase
          onClose={() => setShowCreditPurchase(false)}
          onSuccess={() => {
            // Reload user data to get updated credit balance
            loadUserData();
            setShowCreditPurchase(false);
          }}
        />
      )}

      {/* Payment Success Modal */}
      {showPaymentSuccess && PaymentSuccessComponent && (
        <PaymentSuccessComponent
          onClose={() => {
            setShowPaymentSuccess(false);
            setPaymentSuccessComponent(null);
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname);
            // Reload user data to get updated credit balance
            loadUserData();
          }}
        />
      )}
    </div>
  );
};

export default FinalWorkingInterface;
