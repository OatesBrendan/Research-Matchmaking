let navigator;

export const setNavigator = (nav) => {
    navigator = nav;
}

export const navigate = (to, options) => {
    if(navigator){
        navigator(to, options);
    }else{
        console.warn("Navigator not initialised, falling back to window.location");
        window.location.href = to;
    }
}