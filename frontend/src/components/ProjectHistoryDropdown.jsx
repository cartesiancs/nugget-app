import { useEffect } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useAuth } from "../hooks/useAuth";
import { projectApi } from "../services/project";

export function ProjectHistoryDropdown({ onSelect }) {
  const { isAuthenticated } = useAuth();
  const {
    projects,
    loading,
    error,
    selectedProject,
    setSelectedProject,
    fetchProjects,
    fetchProjectEssentials,
  } = useProjectStore();

  useEffect(() => {
    if (isAuthenticated && (!projects || projects.length === 0) && !loading) {
      fetchProjects(1, 20); 
    }
  }, [isAuthenticated, projects, loading, fetchProjects]);

  if (loading) return <div className="p-4 text-gray-400">Loading projects...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  // Use projects directly, as the store always provides an array
  if (!projects || projects.length === 0) return <div className="p-4 text-gray-400">No projects found.</div>;

  const handleSelect = async (e) => {
    const projectId = e.target.value;
    const selected = projects.find((p) => String(p.id) === String(projectId));
    setSelectedProject(selected);
    if (onSelect) onSelect(selected);
    if (projectId) {
      try {
        await fetchProjectEssentials(projectId);
        console.log("Fetched all essentials for project", projectId);
      } catch (err) {
        console.error("Failed to fetch essentials for project", err);
      }
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto">
      <div className="p-2 border-b border-gray-800 font-semibold text-white">Your Projects</div>
      <select
        className="w-full bg-gray-900 text-white p-2 rounded"
        value={selectedProject?.id || ""}
        onChange={handleSelect}
      >
        <option value="" disabled>Select a project...</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} - {project.description}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProjectLoader() {
  const { fetchProjects, loading } = useProjectStore();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log("User authenticated, fetching projects...");
      fetchProjects(1, 10); 
    }
  }, [isAuthenticated, fetchProjects, loading]);

  return null;
}

export function SelectedProjectBanner() {
  const { selectedProject } = useProjectStore();
  if (!selectedProject) return null;
  return (
    <div className='bg-blue-900 text-blue-100 px-4 py-2 text-sm font-medium border-b border-blue-800'>
      Working on: <span className='font-semibold'>{selectedProject.name}</span>
    </div>
  );
}