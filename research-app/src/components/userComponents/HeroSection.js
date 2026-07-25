import { useEffect, useState } from 'react';
import { userService } from '../../services/userService'
import { navigate } from '../../services/navigationService';

export default function HeroSection() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const login = async () => {
      const check = await userService.checkTokens();
      if(check){
        return setLoggedIn(true);
      }
      return setLoggedIn(false);
    }
    login();
  }, [setLoggedIn]);

  return (
    <div className="bg-qut-dark-blue">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight qut-text-secondary sm:text-5xl lg:text-6xl">
            QUT Data Science Research Network
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-qut-vlight-blue">
            Discover connections, explore research interests, and find collaborators across the university.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <a
              href="#map"
              className="flex items-center justify-center px-8 py-3 border qut-border-primary text-base font-medium rounded-md qut-text-primary qut-bg-secondary hover:qut-bg-primary md:py-4 md:text-lg md:px-10"
            >
              Explore the Map
            </a>
            <span
              onClick={() => navigate(loggedIn ? '/edit-profile' : '/login')}
              className="flex items-center justify-center px-8 py-3 border qut-border-primary text-base font-medium rounded-md qut-text-secondary bg-qut-light-blue hover:bg-qut-blue md:py-4 md:text-lg md:px-10 clickable"
            >
              {loggedIn ? "Update Your Profile" : "Login"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}