import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ProjectProvider } from './context/ProjectContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ProjectProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ProjectProvider>
  );
}