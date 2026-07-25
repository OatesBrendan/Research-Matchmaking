import { useState } from 'react';
import { emailService } from '../../services/emailService';
import { userService } from '../../services/userService';
import { navigate } from '../../services/navigationService';
import { useAuth } from '../../hooks/useAuth';

const Signup = () => {
    const {refreshAuth} = useAuth();
    const [loginFormData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    const [verificationForm, setVerificationForm] = useState({
        verification_code: ''
    });
    const [message, setMessage] = useState(null);
    const [resend, setResend] = useState(false);
    const [step, setStep] = useState('login'); // 'login', 'signup', 'verify', 'setPassword'
    //let researcher = null;

    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        try {
            const success = await emailService.verifyEmail(formData.email, verificationForm.verification_code);
            if (success) {
                setStep('setPassword'); // Move to set password step
                setMessage(null);
            } else {

                setMessage('Invalid verification code or email address');
                setResend(true); // Allow user to resend verification code
            }

        } catch (error) {
            setError(error.message);
        }
    }

    const setError = (error) => {
        console.error('Error:', error);
        setMessage(error);
        const elements = document.getElementsByClassName('login-input');
        for (let i = 0; i < elements.length; i++) {
            elements[i].setAttribute("style", "border: red 1px solid; box-shadow: 0 0 3px red;");
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
        setLoginData(prevState => ({
            ...prevState,
            [name]: value,
        }));
        setVerificationForm(prevState => ({
            ...prevState,
            [name]: value,
        }));
    }

    const backToSignup = () => {
        setStep('signup');
        setMessage(null);
        setResend(false);
    }

    const handleFullSignup = async (e) => {
        e.preventDefault();
        //const researchers = await researcherApi.getResearchers();

        //const existingResearcher = researchers.data.find((researcher) => researcher.name === (formData.firstName + ' ' + formData.lastName));
        //researcher = existingResearcher._id;

        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            const response = await userService.signup({
                name: formData.firstName + ' ' + formData.lastName,
                email: formData.email,
                password: password
            });

            if (response === 200) {
                refreshAuth();
                navigate('/');

            } else {
                setMessage('Signup failed');
            }
        } catch (error) {
            setError(error.message);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await userService.checkForExistingUser({
                userEmail: formData.email,
                userName: formData.firstName + ' ' + formData.lastName
            });
            if(response.exists === true){
                if(response.field === 'email'){
                    setMessage('User with that email already exists');
                } else if(response.field === 'name'){
                    setMessage('User with that name already exists');
                }
                return;
            }
            const success = await emailService.sendVerificationEmail(formData.email);
            if (success) {
                setStep('verify'); // Move to verification step
                setMessage(null);
                setResend(false); // Reset resend state
            } else {

                setMessage('Failed to send verification email');
            }

        } catch (error) {
            console.log(error);
            setError(error.message);
        }

    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { email, password } = loginFormData;

            const response = await userService.login({ email, password });

            if (response.success) {
                refreshAuth();
                navigate("/");
            } else {
                setError(`Login failed: ${response?.message}`);
            }

        } catch (error) {
            if (error.response && error.response.status === 401) {
                setError('Invalid email or password');
            } else {
                console.log(error);
                setError(error.message);
            }
        }
    };






    return (
        <div className="sign-up-page qut-bg-primary">
            <br></br>
            <h1 className="text-center text-4xl font-bold mb-6 qut-text-primary">Research Matchmaking</h1>
            <br></br>
            {(step === 'login' || step === 'signup') && (
                <div className="sign-up-container qut-bg-secondary qut-border-primary">
                    <h1 className="text-3xl font-bold mb-4 qut-text-primary">{step === 'login' ? "Log In" : "Link your Account"}</h1>
                    <form className="sign-up-form" onSubmit={(e) => {
                        if (step === 'login') {
                            handleLogin(e)
                        } else {
                            handleSubmit(e)
                        }
                    }}>
                        {step === 'login' ? (
                            <div className="form-group">

                                <br></br>
                                <input type="email" className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' id="email" name="email" value={loginFormData.email} placeholder='Email' onChange={handleChange} required />

                                <br></br>
                                <input type="password" className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' id="password" name="password" value={loginFormData.password} placeholder='Password' onChange={handleChange} required />
                            </div>
                        ) : (
                            <div className="form-group">

                                <br></br>
                                <input type="text" id="first-name" className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' name="firstName" placeholder='First Name' value={formData.firstName} onChange={handleChange} required />

                                <br></br>
                                <input type="text" id="last-name" className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' name="lastName" placeholder='Last Name' value={formData.lastName} onChange={handleChange} required />

                                <br></br>
                                <input type="email" id="email" className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' name="email" placeholder='Email' value={formData.email} onChange={handleChange} required />
                            </div>
                        )}

                        {message && <p className="error-message">{message}</p>}
                        {!message && <p> </p>}

                        <button type="submit" id="login-button" className="btn btn-primary">Enter</button>

                        <button type="button" className="btn-link qut-text-tertiary hover:text-qut-light-blue" onClick={() => {
                            if (step === 'login') {
                                setStep('signup');
                            } else {
                                setStep('login');
                            }
                        }}>{step === 'login' ? "Don't have an account?" : "Already have an Account?"}</button>
                    </form>
                </div>
            )}

            {step === 'verify' && (

                <div className="sign-up-container qut-bg-secondary qut-border-primary">


                    <form className="code-enter-form" onSubmit={handleVerificationSubmit}>
                        <div className="form-group">

                            <input type="text" inputMode='numeric' pattern='[0-9]*' id="code-enter" className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' name="verification_code" placeholder='Enter Verification Code' value={verificationForm.code} onChange={handleChange} required />
                            {message && <p className="error-message">{message}</p>}
                            {!message && <p> </p>}
                        </div>

                        <button type="submit" id='login-button' className="btn btn-primary">Enter</button>
                        <button className="btn btn-primary qut-text-tertiary hover:text-qut-light-blue" onClick={backToSignup}>Back</button>
                    </form>
                    <br></br>
                    {resend && (

                        <button className="btn btn-secondary qut-text-tertiary hover:text-qut-light-blue" onClick={() => emailService.sendVerificationEmail(formData.email)}>Resend Verification Code</button>
                    )}
                </div>

            )}

            {step === 'setPassword' && (
                <div className="sign-up-container qut-bg-secondary qut-border-primary">
                    <h1 className="text-center text-2xl font-bold">Set Password</h1>
                    <form className="set-password-form" onSubmit={handleFullSignup}>
                        <div className="form-group">

                            <input type="password" id="password" placeholder='Enter Password' className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' name="password" required />
                            {message && <p className="error-message">{message}</p>}
                            {!message && <p> </p>}
                            <input type="password" id="confirm-password" placeholder='Confirm Password' className='login-input qut-bg-primary border qut-border-primary qut-text-tertiary' name="confirmPassword" required />
                        </div>
                        <button type="submit" className="btn btn-primary qut-text-tertiary hover:text-qut-light-blue">Set Password</button>
                    </form>
                </div>
            )}

        </div>

    );
};

export default Signup;