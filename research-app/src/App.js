import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  HashRouter,
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

// Components import
import NavBar from './components/userComponents/NavBar';
import Footer from './components/global/Footer';
import ScrollToTopButton from './components/global/ScrollToTopButton';
import DarkModeToggle from './components/global/darkmodeToggle';
import AdminPanel from './pages/admin/AdminPanel';
import AdminNavBar from './components/adminComponents/AdminNavBar';
import UserPanel from './pages/users/UserPanel';
import { setNavigator } from './services/navigationService';
import { AuthProvider } from './hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const isElectron = window.IN_DESKTOP_ENV === true;
const Router = isElectron ? HashRouter : BrowserRouter;

const queryClient = new QueryClient()

function App() {
  return (
    <div className='qut-bg-primary'>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Content />
        </Router>
        <ScrollToTopButton />
        <DarkModeToggle />
      </QueryClientProvider>
    </div>

  );
}

const Content = () => {
  const navigate = useNavigate();
  setNavigator(navigate);
  return (
    <AuthProvider>
      <Routes>
        <Route path='/admin/*' element={<AdminContent />} />
        <Route path='/*' element={<UserContent />} />
      </Routes>
    </AuthProvider>
  )
}

const UserContent = () => {
  return (
    <div className='min-h-screen flex qut-bg-primary qut-text-primary flex-col'>
      <NavBar />
      <div className='flex flex-col flex-grow-1'>
        <UserPanel />
        <Footer />
      </div>
    </div>
  );
}

const AdminContent = () => {
  return (
    <div className='min-h-screen flex qut-bg-primary qut-text-primary flex-row'>
      <AdminNavBar />
      <div className='flex flex-col flex-grow-1'>
        <AdminPanel />
        <Footer />
      </div>
    </div>
  );
}

export default App;