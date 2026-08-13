import "./AppShell.css";

export default function AppShell({ user, active, onNavigate, onLogout, children }) {
    const links = [["dashboard", "Home", "/dashboard"], ["library", "Library", "/library"], ["journal", "Journal", "/journal"], ["stats", "Progress", "/stats"]];
    return <main className="app-shell">
        <nav className="shell-nav">
            <button className="shell-brand" onClick={() => onNavigate("/dashboard")}>◇ <span>NARRATIAA</span></button>
            <div className="shell-links">{links.map(([key,label,path]) => <button className={active===key?"active":""} key={key} onClick={() => onNavigate(path)}>{label}</button>)}</div>
            <div className="shell-user"><span className="shell-avatar">{user.fullName[0].toUpperCase()}</span><span>{user.fullName.split(" ")[0]}</span><button onClick={onLogout}>Sign out</button></div>
        </nav>
        {children}
        <nav className="mobile-tabs">{links.map(([key,label,path]) => <button className={active===key?"active":""} key={key} onClick={() => onNavigate(path)}><span>{key==="dashboard"?"⌂":key==="library"?"▥":key==="journal"?"✎":"◒"}</span>{label}</button>)}</nav>
    </main>;
}
