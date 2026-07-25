import { ArrowLeft } from "lucide-react";
import { navigate } from "../../services/navigationService";

const BackButton = () => {
    return (
        <button className="back-button text-qut-light-blue" onClick={() => navigate(-1)}>
            <ArrowLeft size={"2em"}/>
        </button>
    );
}

export default BackButton;