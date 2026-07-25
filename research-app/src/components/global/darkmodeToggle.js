import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "lucide-react";

const DarkModeToggle = () => {
    const [UI_MODE, setUI_MODE] = useState(localStorage.getItem('QUT-UI-MODE'));

    useEffect(() => {
        setUI_MODE(localStorage.getItem('QUT-UI-MODE'));
        if (UI_MODE && UI_MODE === "dark") {
            document.documentElement.setAttribute('data-theme', UI_MODE);
        }else{
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('QUT-UI-MODE', 'light');
        }
    }, [UI_MODE])

    const toggleMode = (e) => {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('QUT-UI-MODE', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('QUT-UI-MODE', 'dark');
        }
    }

    return (
        <div className="theme-toggle-container">
            <div className="theme-toggle qut-bg-secondary qut-text-primary" onClick={toggleMode}>
                <div className="sun">
                    <SunIcon />
                </div>
                <div className="moon">
                    <MoonIcon />
                </div>
            </div>
        </div>
    )
}

export default DarkModeToggle;