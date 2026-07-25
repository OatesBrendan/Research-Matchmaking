import { LucidePanelLeftClose, LucidePanelLeftOpen } from "lucide-react";
import QutLogo from "../global/QutLogo";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { userService } from "../../services/userService";
import { navigate } from "../../services/navigationService";

const AdminNavBar = () => {
    const [barCollapsed, setBarCollapsed] = useState(false);
    const location = useLocation();

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 vh-100 sticky-top shadow-lg qut-text-primary qut-bg-primary"
            style={{ "zIndex": "1000" }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3 mb-md-0 me-md-auto">
                <QutLogo text={!barCollapsed} />
                <span className="bi ms-2 clickable hover:qut-text-tertiary" onClick={() => setBarCollapsed(!barCollapsed)}>
                    {barCollapsed ? <LucidePanelLeftOpen /> : <LucidePanelLeftClose />}
                </span>
            </div>

            <hr />

            <SideBarLinks location={location} collapse={barCollapsed} />

            <hr />

            <ProfileLink collapse={barCollapsed} />
        </div>
    );

}

const SideBarLinks = ({ location, collapse }) => {
    if (collapse) {
        return (
            <ul className="nav nav-pills flex-column mb-auto">
                <SideBarLink url="" img="fas fa-home" location={location.pathname} />
                <SideBarLink url="/researchers" img="fas fa-users" location={location.pathname} />
                <SideBarLink url="/users" img="fas fa-user-friends" location={location.pathname} />
                <SideBarLink url="/publications" img="fas fa-book" location={location.pathname} />
                <SideBarLink url="/data" img="fas fa-database" location={location.pathname} />
            </ul>
        );
    }
    return (
        <ul className="nav nav-pills flex-column mb-auto">
            <SideBarLink text="Home" url="" img="fas fa-home" location={location.pathname} />
            <SideBarLink text="Researchers" url="/researchers" img="fas fa-users" location={location.pathname} />
            <SideBarLink text="Users" url="/users" img="fas fa-user-friends" location={location.pathname} />
            <SideBarLink text="Publications" url="/publications" img="fas fa-book" location={location.pathname} />
            <SideBarLink text="Data Scraping" url="/data" img="fas fa-database" location={location.pathname} />
        </ul>
    );
}

const SideBarLink = ({ text = null, url, img, location }) => {
    const route = `/admin${url}`
    return (
        <li>
            <Link to={route} className={location === route ? 'nav-link active bg-qut-dark-blue qut-text-secondary hover:bg-qut-blue' : 'nav-link qut-text-primary hover:qut-bg-tertiary'}>
                <i className={"bi me-2 " + img} />
                {text && ` ${text} `}
            </Link>
        </li>
    );
}

const ProfileLink = ({ collapse }) => {
    const [user, setUser] = useState({});
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const loadUser = async () => {
            let res;
            try {
                res = await userService.getUser();

                if (!res) {
                    console.error('Failed to load user profile');
                    setUser({ name: 'John Doe' });
                }
            } catch (err) {
                res = { name: 'John Doe' };
            } finally {
                setUser(res);
            }
        }
        loadUser();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProfileClick = () => {
        setMenuOpen(!menuOpen);
    };

    const handleMenuAction = (action) => {
        setMenuOpen(false);
        switch (action) {
            case 'profile':
                navigate('/admin/profile');
                break;
            case 'exit':
                navigate('/');
                break;
            case 'logout':
                // Implement your logout logic here
                console.log('Logging out...');
                navigate('/logout');
                break;
            default:
                break;
        }
    };

    if (collapse) {
        return (
            <div className="position-relative" ref={menuRef}>
                <span className="sidebar-profile" onClick={handleProfileClick}>
                    <div className="profile-image">{user?.name?.charAt(0) || '?'}</div>
                </span>
                {menuOpen && (
                    <div className="context-menu show">
                        <div className="context-item" onClick={() => handleMenuAction('exit')}>
                            <i className="fas fa-sign-out-alt me-2"></i>
                            <span>Home</span>
                        </div>
                        <div className="context-item" onClick={() => handleMenuAction('logout')}>
                            <i className="fas fa-power-off me-2"></i>
                            <span>Logout</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="position-relative" ref={menuRef}>
            <div href="#" className="sidebar-profile d-flex justify-content-between align-items-center text-decoration-none clickable" onClick={handleProfileClick}>
                <div className="d-flex">
                    <div className="profile-image me-2">{user?.name?.charAt(0) || '?'}</div>
                    <div className="profile-info">
                        <div className="profile-name">{user?.name || 'John Doe'}</div>
                        <div className="profile-role">Administrator</div>
                    </div>
                </div>
                <i class="fa fa-cog" aria-hidden="true" />
            </div>
            {menuOpen && (
                <div className="context-menu show">
                    <div className="context-item" onClick={() => handleMenuAction('exit')}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        <span>Home</span>
                    </div>
                    <div className="context-item" onClick={() => handleMenuAction('logout')}>
                        <i className="fas fa-power-off me-2"></i>
                        <span>Logout</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminNavBar;