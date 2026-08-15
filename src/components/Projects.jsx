import React from 'react';
import './Projects.css';

const Projects = () => {
  const projectData = [
    {
      id: 1,
      title: 'E-commerce Platform',
      description: 'A modern shopping experience built with React and seamless animations.',
      tags: ['React', 'CSS', 'API'],
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'Boost productivity with this intuitive drag-and-drop task manager.',
      tags: ['JavaScript', 'HTML', 'Vanilla CSS'],
    },
    {
      id: 3,
      title: 'Weather Dashboard',
      description: 'Real-time weather tracking with beautiful glassmorphism UI.',
      tags: ['React', 'Vite', 'OpenWeather'],
    }
  ];

  return (
    <section id="projects" className="projects">
      <h2>Featured Projects</h2>
      <div className="projects-grid">
        {projectData.map((project) => (
          <div key={project.id} className="project-card glass">
            <div className="project-image-placeholder"></div>
            <div className="project-info">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-tags">
                {project.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
