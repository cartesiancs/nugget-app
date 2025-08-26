import React from "react";
import ChatLoginButton from "../ChatLoginButton";

const AuthMessages = ({
  isAuthenticated,
  selectedProject,
  onCreateProject,
}) => {
  if (!isAuthenticated) {
    return (
      <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-white mb-2'>
            Welcome to Usuals.ai
          </h3>
          <p className='text-gray-400 text-sm'>
            Sign in to access AI-powered video creation features
          </p>
        </div>
        <ChatLoginButton />
      </div>
    );
  }

  if (isAuthenticated && !selectedProject) {
    return (
      <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-white mb-2'>
            No Project Selected
          </h3>
          <p className='text-gray-400 text-sm'>
            Please create or select a project to start creating video content
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className='bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-medium'
        >
          Create New Project
        </button>
      </div>
    );
  }

  return null;
};

export default AuthMessages;
