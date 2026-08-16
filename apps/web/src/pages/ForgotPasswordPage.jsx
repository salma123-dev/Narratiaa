import { useState } from "react";
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from "../services/authApi";
import "./SignupPage.css";

function Icon({ children, className = "" }) { return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }

export default function ForgotPasswordPage({ onShowSignin }) {
    const [step, setStep] = useState("email");
    const [fields, setFields] = useState({ email: "", code: "", password: "", confirmPassword: "" });
    const [resetToken, setResetToken] = useState("");
    const [message, setMessage] = useState("");
    const [developmentCode, setDevelopmentCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const update = (event) => { setFields({ ...fields, [event.target.name]: event.target.value }); setMessage(""); };

    async function submit(event) {
        event.preventDefault();setBusy(true);setMessage("");
        try {
            if (step === "email") { const result = await requestPasswordReset(fields.email);setDevelopmentCode(result.developmentCode || "");setMessage(result.message);setStep("code"); }
            else if (step === "code") { const result = await verifyPasswordResetCode(fields.email, fields.code);setResetToken(result.resetToken);setMessage(result.message);setStep("password"); }
            else { const result = await resetPassword({ email: fields.email, resetToken, password: fields.password, confirmPassword: fields.confirmPassword });setMessage(result.message);setStep("done"); }
        } catch (error) { setMessage(error.message || "Unable to reset your password."); }
        finally { setBusy(false); }
    }

    const title = step === "email" ? "Forgot password?" : step === "code" ? "Enter your code" : step === "password" ? "Create a new password" : "Password changed";
    return <main className="signup-page"><div className="signup-shade"/><section className="signup-card signin-card reset-card" aria-label="Reset your password">
        <div className="card-icon"><Icon><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Icon></div><h2>{title}</h2><div className="small-separator"/>
        <p className="subtitle">{step === "email" ? "Enter the email associated with your Narratiaa account." : step === "code" ? `We sent a 6-digit code to ${fields.email}.` : step === "password" ? "Use at least 8 characters, including a letter and a number." : "Your account is secure again."}</p>
        {message && <p className={step === "done" ? "verification-message success reset-success" : "form-message"} role="status">{message}</p>}
        {developmentCode && step === "code" && <div className="verification-message development"><span>Local test code</span><strong>{developmentCode}</strong></div>}
        {step !== "done" && <form onSubmit={submit} noValidate>
            {step === "email" && <label className="input-group"><Icon className="field-icon"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></Icon><input name="email" value={fields.email} onChange={update} type="email" placeholder="Email Address" autoComplete="email" required/></label>}
            {step === "code" && <label className="input-group"><Icon className="field-icon"><path d="M7 12h10M9 8h6M9 16h6"/></Icon><input name="code" value={fields.code} onChange={update} inputMode="numeric" maxLength="6" placeholder="6-digit reset code" autoComplete="one-time-code" required/></label>}
            {step === "password" && <><label className="input-group"><Icon className="field-icon"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Icon><input name="password" value={fields.password} onChange={update} type={showPassword ? "text" : "password"} placeholder="New password" autoComplete="new-password" required/><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>◉</button></label><label className="input-group"><Icon className="field-icon"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></Icon><input name="confirmPassword" value={fields.confirmPassword} onChange={update} type={showPassword ? "text" : "password"} placeholder="Confirm new password" autoComplete="new-password" required/></label></>}
            <button className="submit-btn reset-submit" type="submit" disabled={busy}><span>{busy ? "Please wait..." : step === "email" ? "Send reset code" : step === "code" ? "Confirm code" : "Change password"}</span><span aria-hidden="true">&rarr;</span></button>
        </form>}
        <p className="signin"><a href="/signin" onClick={(event) => { event.preventDefault(); onShowSignin(); }}>{step === "done" ? "Sign in" : "Back to sign in"}</a></p>
    </section></main>;
}
