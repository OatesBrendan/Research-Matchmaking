import { useCallback, useState } from "react"

const useLoader = (initialState = false) => {
    const [loading, setLoading] = useState(initialState);
    const [error, setError] = useState(null);

    const withLoader = useCallback(async (asyncFunction) => {
        setLoading(true);
        setError(null);
        try{
            const result = await asyncFunction();
            return result;
        }catch(err){
            setError(err.message || 'An error occurred');
            throw err;
        }finally{
            setLoading(false);
        }
    }, []);

    const startLoading = useCallback(() => {
        setLoading(true);
        setError(null);
    }, []);

    const stopLoading = useCallback(() => {
        setLoading(false);
    }, []);

    const setLoadingError = useCallback((errorMessage) => {
        setError(errorMessage);
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        withLoader,
        startLoading,
        stopLoading,
        setLoadingError,
        clearError: () => setError(null)
    }
}

export default useLoader;