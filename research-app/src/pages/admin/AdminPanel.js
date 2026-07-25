import { Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard";
import Researchers from "./Researchers";
import Users from "./Users";
import Publications from "./Publications";
import { useEffect } from "react";
import { userService } from "../../services/userService";
import NotFound from "../NotFound";
import useLoader from "../../hooks/useLoader";
import LoadingOverlay from "../../components/utils/LoadingOverlay";
import Scraper from "./Scraper";
import { navigate } from "../../services/navigationService";

const AdminPanel = () => {
    const { loading, error, withLoader } = useLoader();
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const user = await withLoader(() => userService.getUser());
                if(user?.isAdmin) return;
                throw new Error("User is not an Admin");
            } catch (error) {
                console.log('Error in checkAdmin:', error);
                return navigate("/");
            }
        }
        checkAdmin();
    }, [withLoader])

    if (loading) {
        return (
            <LoadingOverlay text={"loading..."} />
        )
    }

    if(error){
        return (
            <LoadingOverlay text={"loading..."} />
        );
    }

    return (
        <Routes>
            <Route path="*" element={<NotFound index="/admin" />} />
            <Route index element={<Dashboard />} />
            <Route path="researchers" element={<Researchers />} />
            <Route path="users" element={<Users />} />
            <Route path="publications" element={<Publications />} />
            <Route path="data" element={<Scraper />} />
        </Routes>
    )
}

export default AdminPanel;