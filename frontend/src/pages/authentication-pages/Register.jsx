import { useState } from "react";
import { supabase } from "../../../utils/supabaseClient"
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";





function Register() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for the confirmation link.");
  };

    const handleGoogleSignIn = async () => {
        const {error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
              options: {
              redirectTo: 'http://localhost:5173',
                    },
         });

        if (error) alert(error.message);
    };
    return(
         <div className="register-container">

            <h1>
            Create an account today!
            </h1>
            <form onSubmit={handleSignUp}>
                <input type="text"
                    placeholder="Email"
                    value = {email}
                    onChange={(e) => setEmail(e.target.value)}
                    required />


                <input type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">
                    Sign Up
                </button>

                <hr />
            </form>

              <button
                    type="button"
                   onClick={handleGoogleSignIn}
                   className="google-sigin-button">
                    Continue with Google
                </button>
               <p>Already have an account? <Link to="/signin">Sign in</Link></p>



          </div>
    )
}


export default Register;
