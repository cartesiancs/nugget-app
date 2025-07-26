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
    const storedProjects = localStorage.getItem('project-store-projects');
    const storedSelected = localStorage.getItem('project-store-selectedProject');
    if (storedProjects) setProjects(JSON.parse(storedProjects));
    if (storedSelected) setSelectedProject(JSON.parse(storedSelected));
  }, []);

  // Fetch projects if needed
  useEffect(() => {
    if (isAuthenticated && projects.length === 0 && !loading) {
      setLoading(true);
      projectApi.getProjects({ page: 1, limit: 20 })
        .then((data) => {
          setProjects(data);
          localStorage.setItem('project-store-projects', JSON.stringify(data));
        })
        .catch((e) => setError(e.message || "Failed to fetch projects"))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, projects.length, loading]);

  if (loading) return <div className="p-4 text-gray-400">Loading projects...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;
  if (!projects || projects.length === 0) return <div className="p-4 text-gray-400">No projects found.</div>;

  const handleSelect = async (e) => {
    const projectId = e.target.value;
    const selected = projects.find((p) => String(p.id) === String(projectId));
    setSelectedProject(selected);
    localStorage.setItem('project-store-selectedProject', JSON.stringify(selected));
    if (onSelect) onSelect(selected);
    if (projectId) {
      try {
        // Fetch essentials and store in localStorage
        const [images, videos, segmentations] = await Promise.all([
          projectApi.getProjectImages(projectId, { page: 1, limit: 100 }),
          projectApi.getProjectVideos(projectId, { page: 1, limit: 100 }),
          projectApi.getProjectSegmentations(projectId, { page: 1, limit: 50 }),
        ]);
        localStorage.setItem('project-store-images', JSON.stringify(images?.data || []));
        localStorage.setItem('project-store-videos', JSON.stringify(videos?.data || []));
        localStorage.setItem('project-store-segmentations', JSON.stringify(segmentations?.data || []));
        console.log("Fetched and stored essentials for project", projectId);
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
  return null;
}

export function SelectedProjectBanner() {
  const [selectedProject, setSelectedProject] = useState(null);
  useEffect(() => {
    const storedSelected = localStorage.getItem('project-store-selectedProject');
    if (storedSelected) setSelectedProject(JSON.parse(storedSelected));
  }, []);
  if (!selectedProject) return null;
  return (
    <div className='bg-blue-900 text-blue-100 px-4 py-2 text-sm font-medium border-b border-blue-800'>
      Working on: <span className='font-semibold'>{selectedProject.name}</span>
    </div>
  );
}