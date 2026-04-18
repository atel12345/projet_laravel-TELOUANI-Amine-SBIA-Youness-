import React from 'react';
import ReactDOM from 'react-dom/client';
import ProjectApp from './ProjectApp';

const container = document.getElementById('app');

if (container) {
	ReactDOM.createRoot(container).render(
		React.createElement(
			React.StrictMode,
			null,
			React.createElement(ProjectApp),
		),
	);
}
