import { useEffect } from "react";
import { userService } from "../services/userService";
import { navigate } from "../services/navigationService";
import { useAuth } from "../hooks/useAuth";

export default function Logout() {
    const {refreshAuth} = useAuth();
    useEffect(() => {
        const handleLogout = async () => {
            try {
                await userService.logout();
                refreshAuth();
                navigate("/");

            } catch (error) {
                console.error('Logout failed', error);
            }
        };
        handleLogout();
    });

    return (
        <div className="loading-container" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="loading-spinner"></div>
            <span className="loading-text">Logging out...</span>
        </div>
    );
}