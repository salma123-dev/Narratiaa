import { useState } from "react";
import { login } from "../services/authApi";
import "./SignupPage.css";

function Icon({ children, className = "" }) { return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }
function BookIcon({ className = "" }) { return <Icon className={className}><path d="M4 5.5c2.3-.8 4.8-.4 7 1.1v12.1c-2.2-1.4-4.7-1.8-7-1V5.5Z"/><path d="M20 5.5c-2.3-.8-4.8-.4-7 1.1v12.1c2.2-1.4 4.7-1.8 7-1V5.5Z"/><path d="M11 6.6c.6-.4 1.4-.4 2 0"/></Icon>; }

export default function SigninPage({ onShowSignup, onAuthenticated }) {
    const [fields, setFields] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    function updateField(event) { setFields({ ...fields, [event.target.name]: event.target.value }); setMessage(""); }
    async function submit(event) {
        event.preventDefault();
        if (!fields.email || !fields.password) return setMessage("Enter your email address and password.");
        setSubmitting(true);
        try { onAuthenticated(await login(fields)); }
        catch (error) { setMessage(error.message || "Unable to sign in."); }
        finally { setSubmitting(false); }
    }

    return <main className="signup-page"><div className="signup-shade"/>
        <section className="brand" aria-label="Narratiaa"><div className="brand-lockup"><BookIcon className="brand-book"/><h1>N A R R A T I A A</h1></div><div className="separator"/><p className="tagline">Every story deserves a voice.</p><div className="quote"><span className="quote-mark quote-open">&ldquo;</span><p>Welcome back to the</p><p>world between pages.</p><span className="quote-mark quote-close">&rdquo;</span></div></section>
        <section className="signup-card signin-card" aria-label="Sign in to your account"><div className="card-icon"><Icon><path d="M7 20c7-3.3 10.7-8.5 12.6-16.2-5.4 1.2-10 4.3-12.9 8.8-1.3 2.1-1.4 4.7.3 7.4Z"/><path d="M8.2 16.8c2.6-2.2 5.3-4.4 8.9-8.3"/></Icon></div><h2>Welcome back</h2><div className="small-separator"/><p className="subtitle">Continue your journey with Narratiaa.</p>
            <form onSubmit={submit} noValidate>{message && <p className="form-message" role="alert">{message}</p>}
                <label className="input-group"><Icon className="field-icon"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></Icon><input name="email" value={fields.email} onChange={updateField} type="email" placeholder="Email Address" autoComplete="email"/></label>
                <label className="input-group"><Icon className="field-icon"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Icon><input name="password" value={fields.password} onChange={updateField} type={showPassword ? "text" : "password"} placeholder="Password" autoComplete="current-password"/><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}><Icon className="eye-icon"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></Icon></button></label>
                <div className="signin-options"><label><input type="checkbox"/> Remember me</label><a href="#forgot-password">Forgot password?</a></div>
                <button className="submit-btn" type="submit" disabled={submitting}><span>{submitting ? "Signing in..." : "Sign In"}</span><span aria-hidden="true">&rarr;</span></button>
            </form>
            <div className="divider"><span/><p>or sign in with</p><span/></div><div className="socials"><button type="button" aria-label="Sign in with Google">G</button><button type="button" aria-label="Sign in with Facebook">f</button><button type="button" aria-label="Sign in with Apple">Apple</button></div>
            <p className="signin">Don&apos;t have an account? <a href="/signup" onClick={(event) => { event.preventDefault(); onShowSignup(); }}>Create account</a></p>
        </section>
    </main>;
}
