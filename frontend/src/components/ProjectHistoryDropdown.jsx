import { useEffect } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useAuth } from "../hooks/useAuth";

export function ProjectHistoryDropdown({ onSelect }) {
  const { isAuthenticated } = useAuth();
  const {
    projects,
    loading,
    error,
    selectedProject,
    setSelectedProject,
    fetchProjects,
  } = useProjectStore();

  useEffect(() => {
    if (isAuthenticated && (!projects || projects.length === 0) && !loading) {
      fetchProjects(1, 20); 
    }
  }, [isAuthenticated, projects, loading, fetchProjects]);

  if (loading) return <div className="p-4 text-gray-400">Loading projects...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  const projectList = Array.isArray(projects) ? projects : projects?.data || [];
  if (projectList.length === 0) return <div className="p-4 text-gray-400">No projects found.</div>;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-[1100] max-h-96 overflow-y-auto">
      <div className="p-2 border-b border-gray-800 font-semibold text-white">Your Projects</div>
      <ul>
        {projectList.map((project) => (
          <li
            key={project.id}
            className={`px-4 py-3 cursor-pointer hover:bg-gray-800 ${selectedProject?.id === project.id ? 'bg-blue-900' : ''}`}
            onClick={() => { 
              setSelectedProject(project); 
              onSelect && onSelect(project); 
            }}
          >
            <div className="font-medium text-white">{project.name}</div>
            <div className="text-xs text-gray-400 truncate">{project.description}</div>
          </li>
        ))}
      </ul>
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