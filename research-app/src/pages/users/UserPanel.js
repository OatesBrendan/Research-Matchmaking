import { Route, Routes } from "react-router-dom"
import Home from "./Home"
import Signup from "./Signup"
import BrowseProfiles from "./BrowseProfiles"
import EditProfile from "./EditProfile"
import ResearcherProfile from "./ResearcherProfile"
import Logout from '../logout'
import NotFound from "../NotFound"

const UserPanel = () => {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
      <Route index element={<Home />} />
      <Route path="login" element={<Signup />} />
      <Route path="researchers" element={<BrowseProfiles />} />
      <Route path="edit-profile" element={<EditProfile />} />
      <Route path="researchers/:id" element={<ResearcherProfile />} />
      <Route path='logout' element={<Logout />} />
    </Routes>
  )
}

export default UserPanel;