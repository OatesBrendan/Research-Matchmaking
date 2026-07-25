import { userService } from "../services/userService";
import { createContext, useState, useContext } from "react";

// global context of whether the user is logged in or is an admin
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshAuth = async () => {
        const check = await userService.checkTokens();
        if(check){
            const user = await userService.getUser();
            setIsAdmin(user.isAdmin);
            setLoggedIn(true);
        }else{
            setIsAdmin(false);
            setLoggedIn(false);
        }
    };

    return (
        <AuthContext.Provider value={{ loggedIn, isAdmin, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);