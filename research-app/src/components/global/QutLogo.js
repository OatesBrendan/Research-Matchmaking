const QutLogo = ({text = true}) => {
    return (
        <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
                <img
                    src="https://www.qut.edu.au/__data/assets/image/0007/909781/qut-logo-og-1200.jpg"
                    alt="QUT logo"
                    className="qut-logo"
                />
                {text && (<span className="text-xl font-bold text-qut-blue ml-2">Research Matchmaking</span>)}
            </div>
        </div>
    );
}

export default QutLogo;