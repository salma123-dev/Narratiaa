import { useState } from "react";
import { register, sendEmailVerification, verifyEmail } from "../services/authApi";
import "./SignupPage.css";

function Icon({ children, className = "" }) { return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }
function BookIcon({ className = "" }) { return <Icon className={className}><path d="M4 5.5c2.3-.8 4.8-.4 7 1.1v12.1c-2.2-1.4-4.7-1.8-7-1V5.5Z"/><path d="M20 5.5c-2.3-.8-4.8-.4-7 1.1v12.1c2.2-1.4 4.7-1.8 7-1V5.5Z"/><path d="M11 6.6c.6-.4 1.4-.4 2 0"/></Icon>; }
function LockIcon(){return <Icon className="field-icon"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Icon>}
function EyeIcon(){return <Icon className="eye-icon"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></Icon>}

export default function SignupPage({ onShowSignin, onAuthenticated }) {
    const [fields, setFields] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [verification, setVerification] = useState({ sent: false, verified: false, code: "", token: "", message: "", developmentCode: "", development: false, busy: false });

    function updateField(event) {
        const { name, value } = event.target;
        setFields({ ...fields, [name]: value });
        setErrors({ ...errors, [name]: "" });
        if (name === "email") setVerification({ sent: false, verified: false, code: "", token: "", message: "", developmentCode: "", development: false, busy: false });
    }
    function validate() {
        const next = {};
        if (fields.fullName.trim().length < 2) next.fullName = "Enter at least 2 characters.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) next.email = "Enter a valid email address.";
        else if (!verification.verified) next.email = "Verify your email before creating the account.";
        if (fields.password.length < 8 || !/[A-Za-z]/.test(fields.password) || !/\d/.test(fields.password)) next.password = "Use 8+ characters with a letter and a number.";
        if (fields.confirmPassword !== fields.password) next.confirmPassword = "Passwords do not match.";
        return next;
    }
    async function sendCode() {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return setErrors({ ...errors, email: "Enter a valid email address first." });
        setVerification(current => ({ ...current, busy: true, message: "" }));
        setErrors({ ...errors, email: "" });
        try {
            const result = await sendEmailVerification(fields.email);
            setVerification({ sent: true, verified: false, code: "", token: "", message: result.message, developmentCode: result.developmentCode || "", development: Boolean(result.development), busy: false });
        } catch (error) {
            const text = error.status === 401
                ? "Verification service was updated. Restart npm run dev, then try again."
                : error.message;
            setErrors(current => ({ ...current, email: text }));
            setVerification(current => ({ ...current, busy: false }));
        }
    }
    async function checkCode() {
        if (!/^\d{6}$/.test(verification.code)) return setErrors({ ...errors, verification: "Enter the 6-digit code." });
        setVerification(current => ({ ...current, busy: true }));
        try {
            const result = await verifyEmail(fields.email, verification.code);
            setErrors({ ...errors, verification: "", email: "" });
            setVerification(current => ({ ...current, verified: true, token: result.verificationToken, message: result.message, busy: false }));
        } catch (error) {
            setErrors({ ...errors, verification: error.message });
            setVerification(current => ({ ...current, busy: false }));
        }
    }
    async function submit(event) {
        event.preventDefault(); setMessage("");
        const nextErrors = validate();
        if (Object.keys(nextErrors).length) return setErrors(nextErrors);
        setSubmitting(true);
        try { onAuthenticated(await register({ ...fields, emailVerificationToken: verification.token })); }
        catch (error) { setErrors(error.errors ?? {}); setMessage(error.message || "Unable to create your account."); }
        finally { setSubmitting(false); }
    }

    return <main className="signup-page signup-page-long"><div className="signup-shade" />
        <section className="brand" aria-label="Narratiaa"><div className="brand-lockup"><BookIcon className="brand-book"/><h1>N A R R A T I A A</h1></div><div className="separator"/><p className="tagline">Every story deserves a voice.</p><div className="quote"><span className="quote-mark quote-open">&ldquo;</span><p>Between the pages</p><p>lives another world.</p><span className="quote-mark quote-close">&rdquo;</span></div></section>
        <section className="signup-card signup-card-long" aria-label="Create your account"><div className="card-icon"><Icon><path d="M7 20c7-3.3 10.7-8.5 12.6-16.2-5.4 1.2-10 4.3-12.9 8.8-1.3 2.1-1.4 4.7.3 7.4Z"/><path d="M8.2 16.8c2.6-2.2 5.3-4.4 8.9-8.3"/></Icon></div><h2>Create your account</h2><div className="small-separator"/><p className="subtitle">Start your journey with Narratiaa.</p>
            <form onSubmit={submit} noValidate>{message && <p className="form-message" role="alert">{message}</p>}
                <label className={`input-group ${errors.fullName ? "invalid" : ""}`}><Icon className="field-icon"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></Icon><input name="fullName" value={fields.fullName} onChange={updateField} type="text" placeholder="Full Name" autoComplete="name"/></label>{errors.fullName && <p className="field-error">{errors.fullName}</p>}
                <label className={`input-group email-input ${errors.email ? "invalid" : verification.verified ? "verified" : ""}`}><Icon className="field-icon"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></Icon><input name="email" value={fields.email} onChange={updateField} type="email" placeholder="Email Address" autoComplete="email" disabled={verification.verified}/><button className="verify-email-button" type="button" onClick={sendCode} disabled={verification.busy||verification.verified}>{verification.verified?"✓ Verified":verification.sent?"Resend":"Verify"}</button></label>
                {errors.email && <p className="field-error">{errors.email}</p>}{verification.message && <div className={`verification-message ${verification.verified?"success":""} ${verification.development?"development":""}`}><span>{verification.message}</span>{verification.developmentCode&&<strong>{verification.developmentCode}</strong>}</div>}
                {verification.sent&&!verification.verified&&<><div className={`verification-row ${errors.verification?"invalid":""}`}><input inputMode="numeric" maxLength="6" value={verification.code} onChange={e=>setVerification({...verification,code:e.target.value.replace(/\D/g,"")})} placeholder="6-digit verification code"/><button type="button" onClick={checkCode} disabled={verification.busy}>Confirm code</button></div>{errors.verification&&<p className="field-error verification-error">{errors.verification}</p>}</>}
                <label className={`input-group ${errors.password ? "invalid" : ""}`}><LockIcon/><input name="password" value={fields.password} onChange={updateField} type={showPassword?"text":"password"} placeholder="Password" autoComplete="new-password"/><button className="password-toggle" type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}><EyeIcon/></button></label>{errors.password&&<p className="field-error">{errors.password}</p>}
                <label className={`input-group ${errors.confirmPassword ? "invalid" : ""}`}><LockIcon/><input name="confirmPassword" value={fields.confirmPassword} onChange={updateField} type={showConfirm?"text":"password"} placeholder="Confirm Password" autoComplete="new-password"/><button className="password-toggle" type="button" onClick={()=>setShowConfirm(!showConfirm)} aria-label={showConfirm?"Hide password":"Show password"}><EyeIcon/></button></label>{errors.confirmPassword&&<p className="field-error">{errors.confirmPassword}</p>}
                <button className="submit-btn" type="submit" disabled={submitting}><span>{submitting?"Creating...":"Create Account"}</span><span aria-hidden="true">&rarr;</span></button>
            </form>
            <p className="signin">Already have an account? <a href="/signin" onClick={event=>{event.preventDefault();onShowSignin()}}>Sign in</a></p>
        </section>
    </main>;
}
