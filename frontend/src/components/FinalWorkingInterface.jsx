import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { projectApi } from "../services/project";
import { creditApi } from "../services/credit";
import ChatLoginButton from "./ChatLoginButton";
import CreditPurchase from "./CreditPurchase";
import InterfaceSidebar from "./InterfaceSidebar";
import { assets } from "../assets/assets";

const FinalWorkingInterface = () => {
  console.log("🔧 FinalWorkingInterface rendering...");

  const { user, isAuthenticated } = useAuth();
  const [PaymentSuccessComponent, setPaymentSuccessComponent] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("recents");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [interfaceOpen, setInterfaceOpen] = useState(true);

  console.log("🔧 Auth state:", { isAuthenticated, user: user?.email });
  useEffect(() => {
    setActiveSection(showAllProjects ? "all-projects" : "recents");
  }, [showAllProjects]);

  // Handle interface open/close events and timeline element visibility
  useEffect(() => {
    const openHandler = () => {
      console.log("🔧 Chat interface opening via event");
      setInterfaceOpen(true);
      window.dispatchEvent(new CustomEvent("chatInterface:opened"));
    };

    const closeHandler = () => {
      console.log("🔧 Chat interface closing via event");
      setInterfaceOpen(false);
      window.dispatchEvent(new CustomEvent("chatInterface:closed"));
    };

    window.addEventListener("chatInterface:open", openHandler);
    window.addEventListener("chatInterface:close", closeHandler);

    return () => {
      window.removeEventListener("chatInterface:open", openHandler);
      window.removeEventListener("chatInterface:close", closeHandler);
    };
  }, []);

  // Set the host attribute for visibility tracking (similar to FlowWidget)
  useEffect(() => {
    const host = document.querySelector("react-chat-interface");
    if (host) host.setAttribute("data-open", interfaceOpen ? "true" : "false");
  }, [interfaceOpen]);

  // Auto-open the interface when component mounts (since this is the chat interface)
  useEffect(() => {
    // Dispatch open event when the component mounts with a slight delay to ensure App.ts listeners are ready
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("chatInterface:open"));
    }, 100);

    // Cleanup: dispatch close event when component unmounts
    return () => {
      clearTimeout(timer);
      window.dispatchEvent(new CustomEvent("chatInterface:close"));
    };
  }, []);

  // Force hide timeline elements immediately if interface is open
  useEffect(() => {
    const hideElements = () => {
      const chatToggleContainer = document.getElementById(
        "chat-toggle-container",
      );
      const leftActionBar = document.getElementById("left-action-bar");
      const controlPanel = document.querySelector("control-panel");
      const timelineUI = document.getElementById("split_bottom");
      const publishButton = document.getElementById("publish-button");

      if (chatToggleContainer) chatToggleContainer.style.display = "none";
      if (leftActionBar) leftActionBar.style.display = "none";
      if (controlPanel) controlPanel.style.display = "none";
      if (timelineUI) timelineUI.style.display = "none";
      if (publishButton) {
        publishButton.style.opacity = "0";
        publishButton.style.pointerEvents = "none";
      }
    };

    if (interfaceOpen) {
      // Hide immediately
      hideElements();

      // Set up periodic check to ensure elements stay hidden (in case App.ts recreates them)
      const interval = setInterval(hideElements, 500);

      return () => clearInterval(interval);
    }
  }, [interfaceOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  // Load user data with direct API calls
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log("🔧 Loading user data with direct APIs...");

      // Load credits and projects in parallel
      const [creditsResponse, projectsResponse] = await Promise.all([
        creditApi.getBalance(user.id),
        projectApi.getProjects({ page: 1, limit: 50 }),
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

        // Set both allProjects and recentProjects from the processed projectsWithMedia
        setAllProjects(projectsWithMedia);
        setRecentProjects(projectsWithMedia.slice(0, 6)); // FIXED: Use projectsWithMedia instead of sortedProjects
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

      // Close the chat interface overlay and dispatch close event
      window.dispatchEvent(new CustomEvent("chatInterface:close"));

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

  const handleOpenProject = (project) => {
    console.log("Opening project:", project);
    navigateToEditorWithChat(project, "");
    setOpenDropdownId(null); // Close dropdown
  };

  const toggleDropdown = (projectId, e) => {
    e.stopPropagation(); // Prevent project card click
    setOpenDropdownId(openDropdownId === projectId ? null : projectId);
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

  // Helper function to trigger Google sign in
  const triggerGoogleSignIn = () => {
    // Find and click the ChatLoginButton
    const loginButton =
      document.querySelector("[data-login-button]") ||
      document.querySelector('button[aria-label*="login"]') ||
      document.querySelector('button[class*="login"]');
    if (loginButton) {
      loginButton.click();
    } else {
      // Fallback: try to trigger the auth flow directly
      if (window.electronAPI?.auth?.signIn) {
        window.electronAPI.auth.signIn();
      }
    }
  };

  // Dummy project data for non-authenticated users
  const dummyProjects = [
    {
      id: "demo-1",
      name: "AI Nature Documentary",
      description: "A stunning wildlife video created with AI",
      thumbnail:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
      updatedAt: "2024-01-15T10:30:00Z",
      hasMedia: true,
    },
    {
      id: "demo-2",
      name: "Product Showcase",
      description: "Professional product video with dynamic animations",
      thumbnail:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
      updatedAt: "2024-01-14T15:20:00Z",
      hasMedia: true,
    },
    {
      id: "demo-3",
      name: "Travel Adventure",
      description: "Epic travel montage with AI-generated scenes",
      thumbnail:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
      updatedAt: "2024-01-13T09:45:00Z",
      hasMedia: true,
    },
    {
      id: "demo-4",
      name: "Corporate Explainer",
      description: "Clean and professional AI video for business presentations",
      thumbnail:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop",
      updatedAt: "2024-01-12T11:10:00Z",
      hasMedia: true,
    },
    {
      id: "demo-5",
      name: "Music Visualizer",
      description: "Dynamic visuals synced perfectly with music beats",
      thumbnail:
        "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?w=400&h=300&fit=crop",
      updatedAt: "2024-01-11T14:50:00Z",
      hasMedia: true,
    },
    {
      id: "demo-6",
      name: "Fashion Lookbook",
      description: "Stylish AI-generated fashion video with modern aesthetics",
      thumbnail:
        "https://unsplash.com/photos/a-rack-of-clothes-and-hats-in-a-room-_a_FlMKo4Lk?w=400&h=300&fit=crop",
      updatedAt: "2024-01-10T17:25:00Z",
      hasMedia: true,
    },
  ];

  // Login screen - Same layout as logged in page
  if (!isAuthenticated) {
    return (
      <div className='w-full h-screen bg-black flex flex-col'>
        {/* Full Width Header - Removed user dropdown for non-auth */}
        <div className='w-full bg-black p-4 flex justify-between items-center z-10'>
          <div className='flex items-center gap-3'>
            <img src={assets.SandBoxLogo} alt='Usuals.ai' className='w-8 h-8' />
            <h1 className='text-white text-2xl font-bold'>Usuals.ai</h1>
          </div>
          <div className='flex items-center gap-3'>
            <div
              onClick={triggerGoogleSignIn}
              className='bg-[#FFFFFF0D] hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer'
            >
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M9.41405 6.58568L6.58562 9.41411M7.05703 4.22866L7.52843 3.75726C8.83018 2.45551 10.9407 2.45551 12.2425 3.75726C13.5442 5.059 13.5442 7.16955 12.2425 8.4713L11.7711 8.9427M4.2286 7.05709L3.75719 7.52849C2.45545 8.83024 2.45545 10.9408 3.75719 12.2425C5.05894 13.5443 7.16949 13.5443 8.47124 12.2425L8.94264 11.7711'
                  stroke='white'
                  strokeOpacity='0.5'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span>Invite</span>
            </div>
            <ChatLoginButton />
          </div>
        </div>

        {/* Main Content Area - Same structure as logged in */}
        <div className='flex-1 flex relative'>
          <InterfaceSidebar
            user={null}
            creditBalance={0}
            loading={false}
            activeSection='recents'
            onSectionChange={() => {}}
            onToggleAllProjects={() => {}}
            onPurchaseCredits={triggerGoogleSignIn}
          />

          {/* Main Content Area */}
          <div className='flex-1 flex flex-col ml-96 mr-4 mt-10 min-h-0'>
            {/* Chat Box - Original design but send button triggers sign up */}
            <div className=' mb-4'>
              <div className='text-center mb-8'>
                <h2 className='text-[#FFFFFF80] text-3xl font-sans'>
                  Set the stage for your next creation
                </h2>
              </div>
              <div className='max-w-6xl mx-auto'>
                <div className='bg-gradient-to-t from-[#20272B] to-[#000000]  rounded-2xl border-1 border-white/30 p-8'>
                  <div className='flex items-center gap-4'>
                    <input
                      type='text'
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder='how about "A bird flying on the moon with a red cape"...'
                      className='flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base'
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          triggerGoogleSignIn();
                        }
                      }}
                    />
                    <div
                      onClick={triggerGoogleSignIn}
                      className=' text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer relative group'
                    >
                      <svg
                        width='28'
                        height='29'
                        viewBox='0 0 28 29'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <rect
                          y='0.5'
                          width='28'
                          height='28'
                          rx='6'
                          fill='white'
                          fillOpacity='0.1'
                        />
                        <path
                          d='M12.3594 16.1406L8.70896 14.1497C7.75627 13.6302 7.76571 12.2605 8.72538 11.7672C11.3719 10.407 14.186 9.39704 17.0973 8.76249C17.9332 8.58029 18.8885 8.20889 19.5898 8.91018C20.2911 9.61147 19.9197 10.5668 19.7375 11.4027C19.103 14.314 18.093 17.1281 16.7328 19.7746C16.2395 20.7343 14.8698 20.7437 14.3503 19.791L12.3594 16.1406ZM12.3594 16.1406L14.5651 13.9349'
                          stroke='white'
                          strokeOpacity='0.5'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>

                      {/* Custom tooltip */}
                      <div className='absolute bottom-full left-1 transform -translate-x-1/2 mb-2 px-3  py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
                        Sign in to create project
                        <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black'></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content area - Show 6 dummy project cards */}
            <div className='flex-1 flex flex-col px-6 pb-8 min-h-0'>
              <h2 className='text-white font-semibold text-2xl mb-4 flex-shrink-0'>
                Get Started
              </h2>

              {/* Scrollable container for dummy projects */}
              <div
                className='overflow-y-auto'
                style={{ maxHeight: "calc(100vh - 350px)" }}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2 pb-8 auto-rows-max'>
                  {dummyProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={triggerGoogleSignIn}
                      className='bg-[#FFFFFF0D] backdrop-blur-[32.62921142578125px] rounded-lg border-1 border-white/10 overflow-visible hover:border-white/20 transition-colors cursor-pointer'
                    >
                      {/* Project Media */}
                      <div className='w-full h-52 bg-[#18191C80] flex items-center justify-center overflow-hidden relative group'>
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className='w-full h-full object-cover transition-transform group-hover:scale-105'
                        />
                        {/* Overlay with sign in prompt */}
                        <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                          <div className='text-center'>
                            <svg
                              className='w-12 h-12 text-white mx-auto mb-2'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                              />
                            </svg>
                            <p className='text-white text-sm font-medium'>
                              Sign in to view
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className='p-2 relative'>
                        {/* 3-dot menu */}
                        <div className='dropdown-container absolute top-1 right-1'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerGoogleSignIn();
                            }}
                            className='p-1 bg-[#18191ccc] hover:bg-white/10 rounded-full transition-colors'
                          >
                            <svg
                              width='21'
                              height='21'
                              viewBox='0 0 21 21'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                d='M5.54472 10.5988C5.54472 11.0591 5.17162 11.4322 4.71139 11.4322C4.25115 11.4322 3.87805 11.0591 3.87805 10.5988C3.87805 10.1386 4.25115 9.7655 4.71139 9.7655C5.17162 9.7655 5.54472 10.1386 5.54472 10.5988Z'
                                stroke='white'
                                strokeOpacity='0.5'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                              <path
                                d='M11.3781 10.5988C11.3781 11.0591 11.005 11.4322 10.5447 11.4322C10.0845 11.4322 9.71138 11.0591 9.71138 10.5988C9.71138 10.1386 10.0845 9.7655 10.5447 9.7655C11.005 9.7655 11.3781 10.1386 11.3781 10.5988Z'
                                stroke='white'
                                strokeOpacity='0.5'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                              <path
                                d='M17.2114 10.5988C17.2114 11.0591 16.8383 11.4322 16.3781 11.4322C15.9178 11.4322 15.5447 11.0591 15.5447 10.5988C15.5447 10.1386 15.9178 9.7655 16.3781 9.7655C16.8383 9.7655 17.2114 10.1386 17.2114 10.5988Z'
                                stroke='white'
                                strokeOpacity='0.5'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </button>
                        </div>
                        <h3
                          className='text-white font-medium text-base truncate mb-1 pr-8'
                          title={project.name}
                        >
                          {project.name}
                        </h3>
                        <p className='text-gray-400 text-xs mb-1'>
                          Edited {formatTimeAgo(project.updatedAt)}
                        </p>
                        {project.description && (
                          <p
                            className='text-gray-500 text-xs truncate mb-2'
                            title={project.description}
                          >
                            {project.description}
                          </p>
                        )}
                        <div className='flex items-center gap-2'>
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
                  ))}
                </div>
                {/* Add extra space at the bottom */}
                <div className='h-8'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main interface (logged in) - Updated Layout
  return (
    <div className='w-full h-screen bg-black flex flex-col'>
      {/* Full Width Header */}
      <div className='w-full bg-black p-4 flex justify-between items-center z-10'>
        <div className='flex items-center gap-3'>
          <img src={assets.SandBoxLogo} alt='Usuals.ai' className='w-8 h-8' />
          <h1 className='text-white text-2xl font-bold'>Usuals.ai</h1>
        </div>
        <div className='flex items-center gap-3'>
          <div className='bg-[#FFFFFF0D] hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M9.41405 6.58568L6.58562 9.41411M7.05703 4.22866L7.52843 3.75726C8.83018 2.45551 10.9407 2.45551 12.2425 3.75726C13.5442 5.059 13.5442 7.16955 12.2425 8.4713L11.7711 8.9427M4.2286 7.05709L3.75719 7.52849C2.45545 8.83024 2.45545 10.9408 3.75719 12.2425C5.05894 13.5443 7.16949 13.5443 8.47124 12.2425L8.94264 11.7711'
                stroke='white'
                strokeOpacity='0.5'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span>Invite</span>
          </div>
          <div
            onClick={() => handleCreateProject("Quick project creation")}
            disabled={isCreatingProject}
            className='bg-[#F9D312] hover:bg-yellow-400 disabled:bg-gray-600 text-black px-4 py-2 rounded-lg font-medium transition-colors'
          >
            {isCreatingProject ? "Creating..." : "+ New Project"}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex-1 flex relative'>
        <InterfaceSidebar
          user={user}
          creditBalance={creditBalance}
          loading={loading}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onToggleAllProjects={(show) => setShowAllProjects(show)}
          onPurchaseCredits={() => {
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
        />

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col ml-96 mr-4 mt-10 min-h-0'>
          {/* Chat Box - Fixed height */}
          <div className=' mb-4'>
            <div className='text-center mb-8'>
              <h2 className='text-[#FFFFFF80] text-3xl font-sans'>
                Set the stage for your next creation
              </h2>
            </div>
            <div className='max-w-6xl mx-auto'>
              <div className='bg-gradient-to-t from-[#20272B] to-[#000000]  rounded-2xl border-1 border-white/30 p-8'>
                <div className='flex items-center gap-4'>
                  <input
                    type='text'
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder='how about "A bird flying on the moon with a red cape"...'
                    className='flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base'
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isCreatingProject) {
                        handleCreateProject(chatInput);
                      }
                    }}
                    disabled={isCreatingProject}
                  />
                  <div
                    onClick={() => handleCreateProject(chatInput)}
                    disabled={isCreatingProject || !chatInput.trim()}
                    className=' text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0'
                  >
                    {isCreatingProject ? (
                      <span className='text-sm'>Creating...</span>
                    ) : (
                      <svg
                        width='28'
                        height='29'
                        viewBox='0 0 28 29'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <rect
                          y='0.5'
                          width='28'
                          height='28'
                          rx='6'
                          fill='white'
                          fillOpacity='0.1'
                        />
                        <path
                          d='M12.3594 16.1406L8.70896 14.1497C7.75627 13.6302 7.76571 12.2605 8.72538 11.7672C11.3719 10.407 14.186 9.39704 17.0973 8.76249C17.9332 8.58029 18.8885 8.20889 19.5898 8.91018C20.2911 9.61147 19.9197 10.5668 19.7375 11.4027C19.103 14.314 18.093 17.1281 16.7328 19.7746C16.2395 20.7343 14.8698 20.7437 14.3503 19.791L12.3594 16.1406ZM12.3594 16.1406L14.5651 13.9349'
                          stroke='white'
                          strokeOpacity='0.5'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Projects Section */}
          <div className='flex-1 flex flex-col px-6 pb-8 min-h-0'>
            <h2 className='text-white font-medium mb-4  flex-shrink-0'>
              {showAllProjects
                ? `All Projects (${allProjects.length})`
                : `Recent Projects (${Math.min(recentProjects.length, 6)})`}
            </h2>

            {/* Projects Container with conditional scrolling */}
            <div
              className='overflow-y-auto'
              style={{ maxHeight: "calc(100vh - 350px)" }}
            >
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2 pb-8 auto-rows-max'>
                {loading ? (
                  Array.from({ length: showAllProjects ? 12 : 6 }, (_, i) => (
                    <div
                      key={i}
                      className='bg-[#FFFFFF0D] backdrop-blur-[32.62921142578125px] rounded-lg border-0 overflow-hidden animate-pulse'
                    >
                      <div className='w-full h-52 bg-gray-700'></div>
                      <div className='p-4'>
                        <div className='h-5 bg-gray-700 rounded mb-3'></div>
                        <div className='h-4 bg-gray-700 rounded w-2/3'></div>
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
                      onClick={() => handleOpenProject(project)}
                      className='bg-[#FFFFFF0D] backdrop-blur-[32.62921142578125px] rounded-lg border-1 border-white/10 overflow-visible hover:border-white/20 transition-colors cursor-pointer'
                    >
                      {/* Project Media - Bigger */}
                      <div className='w-full h-52 bg-[#18191C80] flex items-center justify-center overflow-hidden relative group'>
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
                                    <div className='bg-[#18191C] px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1'>
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
                                className='w-16 h-16 text-gray-400'
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
                          <div className='w-full h-full  flex flex-col items-center justify-center'>
                            <svg
                              className='w-16 h-16 text-white mb-2'
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
                            <span className='text-sm text-white'>No media</span>
                          </div>
                        )}
                      </div>

                      {/* Project Info - Bigger */}
                      <div className='p-2 relative'>
                        {/* 3-dot menu */}
                        <div className='dropdown-container absolute top-1 right-1'>
                          <button
                            onClick={(e) => toggleDropdown(project.id, e)}
                            className='p-1 bg-[#18191ccc] hover:bg-white/10 rounded-full transition-colors'
                          >
                            <svg
                              width='21'
                              height='21'
                              viewBox='0 0 21 21'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                d='M5.54472 10.5988C5.54472 11.0591 5.17162 11.4322 4.71139 11.4322C4.25115 11.4322 3.87805 11.0591 3.87805 10.5988C3.87805 10.1386 4.25115 9.7655 4.71139 9.7655C5.17162 9.7655 5.54472 10.1386 5.54472 10.5988Z'
                                stroke='white'
                                strokeOpacity='0.5'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                              <path
                                d='M11.3781 10.5988C11.3781 11.0591 11.005 11.4322 10.5447 11.4322C10.0845 11.4322 9.71138 11.0591 9.71138 10.5988C9.71138 10.1386 10.0845 9.7655 10.5447 9.7655C11.005 9.7655 11.3781 10.1386 11.3781 10.5988Z'
                                stroke='white'
                                strokeOpacity='0.5'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                              <path
                                d='M17.2114 10.5988C17.2114 11.0591 16.8383 11.4322 16.3781 11.4322C15.9178 11.4322 15.5447 11.0591 15.5447 10.5988C15.5447 10.1386 15.9178 9.7655 16.3781 9.7655C16.8383 9.7655 17.2114 10.1386 17.2114 10.5988Z'
                                stroke='white'
                                strokeOpacity='0.5'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openDropdownId === project.id && (
                            <div className='absolute right-0 top-8 w-36 bg-[#1a1a1a77] rounded-lg shadow-xl z-[9999] py-1 border'>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenProject(project);
                                }}
                                className='w-full px-3 py-1.5 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2.5 text-xs'
                              >
                                <svg
                                  className='w-3.5 h-3.5'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                  />
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                  />
                                </svg>
                                Open
                              </div>
                              <hr className='my-1 border-white/10' />
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement delete functionality
                                }}
                                className='w-full px-3 py-1.5 text-left text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2.5 text-xs'
                              >
                                <svg
                                  className='w-3.5 h-3.5'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                  />
                                </svg>
                                Delete
                              </div>
                            </div>
                          )}
                        </div>
                        <h3
                          className='text-white font-medium text-base truncate mb-1 pr-8'
                          title={project.name}
                        >
                          {project.name}
                        </h3>
                        <p className='text-gray-400 text-xs mb-1'>
                          Edited {formatTimeAgo(project.updatedAt)}
                        </p>
                        {project.description && (
                          <p
                            className='text-gray-500 text-xs truncate mb-2'
                            title={project.description}
                          >
                            {project.description}
                          </p>
                        )}
                        <div className='flex items-center gap-2'>
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
                      className='w-20 h-20 text-gray-600 mx-auto mb-6'
                      fill='none'
                      stroke='white'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1}
                        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                    <h3 className='text-white text-xl font-medium mb-3'>
                      No projects yet
                    </h3>
                    <p className='text-gray-200 mb-6'>
                      Start creating amazing videos with AI
                    </p>
                    <button
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder="Describe your video idea..."]',
                        );
                        input?.focus();
                      }}
                      className='bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium transition-colors'
                    >
                      Create Your First Project
                    </button>
                  </div>
                )}
              </div>
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
