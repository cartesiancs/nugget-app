import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { projectApi } from "../services/project";

export function ProjectHistoryDropdown({ onSelect }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedProjects = localStorage.getItem("project-store-projects");
    const storedSelected = localStorage.getItem("project-store-selectedProject");
    if (storedProjects) setProjects(JSON.parse(storedProjects));
    if (storedSelected) setSelectedProject(JSON.parse(storedSelected));
  }, []);

  // Fetch projects if needed
  useEffect(() => {
    if (isAuthenticated && projects.length === 0 && !loading) {
      setLoading(true);
      projectApi
        .getProjects({ page: 1, limit: 20 })
        .then((data) => {
          setProjects(data);
          localStorage.setItem("project-store-projects", JSON.stringify(data));
        })
        .catch((e) => setError(e.message || "Failed to fetch projects"))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, projects.length, loading]);

  const handleSelect = async (e) => {
    const projectId = e.target.value;
    const selected = projects.find((p) => String(p.id) === String(projectId));
    
    console.log('🎯 Project selected in dropdown:', selected?.name, `(ID: ${projectId})`);
    
    setSelectedProject(selected);
    localStorage.setItem("project-store-selectedProject", JSON.stringify(selected));
    
    if (onSelect) onSelect(selected);
    
    if (projectId) {
      try {
        console.log('📡 Fetching project essentials for localStorage...');
        // Fetch essentials and store in localStorage
        const [images, videos, segmentations] = await Promise.all([
          projectApi.getProjectImages(projectId, { page: 1, limit: 100 }),
          projectApi.getProjectVideos(projectId, { page: 1, limit: 100 }),
          projectApi.getProjectSegmentations(projectId, { page: 1, limit: 50 }),
        ]);
        
        localStorage.setItem(
          "project-store-images",
          JSON.stringify(images?.data || []),
        );
        localStorage.setItem(
          "project-store-videos",
          JSON.stringify(videos?.data || []),
        );
        localStorage.setItem(
          "project-store-segmentations",
          JSON.stringify(segmentations?.data || []),
        );
        
        console.log("✅ Fetched and stored essentials for project", selected?.name);
        
        // Dispatch another event after essentials are loaded
        window.dispatchEvent(new CustomEvent('projectEssentialsLoaded', { 
          detail: { project: selected, projectId } 
        }));
        
      } catch (err) {
        console.error("❌ Failed to fetch essentials for project", err);
      }
    }
  };

  if (loading) {
    return (
      <div
        className='absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto border border-gray-700/40'
        style={{
          background: "#18191C",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className='p-4 text-gray-300 text-sm text-center'>
          Loading projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto border border-red-700/40'
        style={{
          background: "#18191C",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className='p-4 text-red-400 text-sm text-center bg-red-900/20 border border-red-700/40 rounded m-2'>
          {error}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div
        className='absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto border border-gray-700/40'
        style={{
          background: "#18191C80",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className='p-4 text-gray-300 text-sm text-center'>
          No projects found.
        </div>
      </div>
    );
  }

  return (
    <div
      className='absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-[1100] max-h-96 overflow-y-auto border-0'
      style={{
        background: "#18191C",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className='p-3  border-b border-gray-700/40'>
        <h4 className='text-xs font-semibold text-white'>Your Projects</h4>
      </div>

      <div className='p-3'>
        <select
          className='w-full p-2 rounded text-white text-xs border-0 focus:outline-none  transition-colors'
          style={{
            background: "#FFFFFF0D",
            backdropFilter: "blur(10px)",
          }}
          value={selectedProject?.id || ""}
          onChange={handleSelect}
        >
          <option
            value=''
            disabled
            style={{ background: "#2d2d30", color: "#fff" }}
          >
            Select a project...
          </option>
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
              style={{ background: "#2d2d30", color: "#fff" }}
            >
              {project.name}  {project.description}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ProjectLoader() {
  return null;
}

export function SelectedProjectBanner() {
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const storedSelected = localStorage.getItem("project-store-selectedProject");
    if (storedSelected) setSelectedProject(JSON.parse(storedSelected));
  }, []);

  if (!selectedProject) return null;

  return (
    <div
      className='px-4 py-2 text-sm font-medium border-b border-gray-700/40'
      style={{
        background:
          "linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 100%)",
        color: "white",
      }}
    >
      Working on:{" "}
      <span className='font-semibold text-white'>{selectedProject.name}</span>
    </div>
  );
}
