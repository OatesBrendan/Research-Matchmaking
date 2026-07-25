import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import QutLogo from '../global/QutLogo';
import { userService } from '../../services/userService'
import { useAuth } from '../../hooks/useAuth';

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {loggedIn, isAdmin, refreshAuth} = useAuth();

  useEffect(() => {
    refreshAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="qut-bg-primary shadow-lg sticky-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <QutLogo />
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
            <Link to="/" className={`${isActive("/") ? "text-qut-blue border-b-2 border-qut-blue" : "qut-text-tertiary hover:text-qut-blue"} px-3 py-2 text-sm font-medium`}>Home</Link>
            {isAdmin && (<Link to="/admin" className={`qut-text-tertiary hover:text-qut-blue px-3 py-2 text-sm font-medium`}>Admin Dashboard</Link>)}
            <Link to="/researchers" className={`${isActive("/researchers") ? "text-qut-blue border-b-2 border-qut-blue" : "qut-text-tertiary hover:text-qut-blue"} px-3 py-2 text-sm font-medium`}>Browse Profiles</Link>
            {loggedIn && (<Link to="/edit-profile" className={`${isActive("/edit-profile") ? "text-qut-blue border-b-2 border-qut-blue" : "qut-text-tertiary hover:text-qut-blue"} px-3 py-2 text-sm font-medium`}>Edit Profile</Link>)}
            <Link to={loggedIn ? "/logout" : "/login"} className="bg-qut-dark-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-qut-light-blue">{loggedIn ? "Logout" : "Login"}</Link>
          </div>


          <div className="-mr-2 flex items-center md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md qut-text-tertiary hover:qut-text-tertiary hover:qut-bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-qut-blue"
            >
              <span className="sr-only">Open main menu</span>
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <Link to="/" className={`${isActive("/") ? "bg-qut-light-blue bg-opacity-10 border-qut-blue text-qut-blue" : "border-transparent qut-text-tertiary hover:qut-bg-primary hover:qut-border-primary hover:qut-text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>Home</Link>
          <a href="#map" className="border-transparent qut-text-tertiary hover:qut-bg-primary hover:qut-border-primary hover:qut-text-primary block pl-3 pr-4 py-2 border-l-4 text-base font-medium" onClick={() => setMobileMenuOpen(false)}>Research Map</a>
          {isAdmin && (
            <Link to="/admin" className={`${isActive("/admin") ? "bg-qut-light-blue bg-opacity-10 border-qut-blue text-qut-blue" : "border-transparent qut-text-tertiary hover:qut-bg-primary hover:qut-border-primary hover:qut-text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`} onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
          )}
          <Link to="/researchers" className={`${isActive("/researchers") ? "bg-qut-light-blue bg-opacity-10 border-qut-blue text-qut-blue" : "border-transparent qut-text-tertiary hover:qut-bg-primary hover:qut-border-primary hover:qut-text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`} onClick={() => setMobileMenuOpen(false)}>Browse Profiles</Link>
          <Link to="/edit-profile" className={`${isActive("/edit-profile") ? "bg-qut-light-blue bg-opacity-10 border-qut-blue text-qut-blue" : "border-transparent qut-text-tertiary hover:qut-bg-primary hover:qut-border-primary hover:qut-text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`} onClick={() => setMobileMenuOpen(false)}>Edit Profile</Link>
          <Link to={loggedIn ? "/logout" : "/login"} className={`${isActive("/login") ? "bg-qut-light-blue bg-opacity-10 border-qut-blue text-qut-blue" : "border-transparent qut-text-tertiary hover:qut-bg-primary hover:qut-border-primary hover:qut-text-primary"} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`} onClick={() => setMobileMenuOpen(false)}>{loggedIn ? "Logout" : "Login"}</Link>
        </div>
      </div>
    </nav>
  );
}