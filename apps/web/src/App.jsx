import { useEffect, useState } from "react";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";
import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import BookPage from "./pages/BookPage";
import JournalPage from "./pages/JournalPage";
import StatsPage from "./pages/StatsPage";
import OnboardingPage from "./pages/OnboardingPage";
import { getCurrentUser, logout } from "./services/authApi";

export default function App() {
    const [path, setPath] = useState(window.location.pathname);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function navigate(nextPath) {
        window.history.pushState({}, "", nextPath);
        setPath(nextPath);
    }

    useEffect(() => {
        const onPopState = () => setPath(window.location.pathname);
        window.addEventListener("popstate", onPopState);
        getCurrentUser().then((currentUser) => {
            setUser(currentUser);
            const currentPath = window.location.pathname;
            const nextPath = currentUser
                ? (currentPath === "/signin" || currentPath === "/signup" ? "/dashboard" : currentPath)
                : (currentPath === "/signin" || currentPath === "/signup" ? currentPath : "/signin");
            if (nextPath !== currentPath) {
                window.history.replaceState({}, "", nextPath);
                setPath(nextPath);
            }
        }).finally(() => setLoading(false));
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    function handleAuthenticated(authenticatedUser) {
        setUser(authenticatedUser);
        navigate(authenticatedUser.onboardingCompleted ? "/dashboard" : "/onboarding");
    }

    async function handleLogout() {
        await logout();
        setUser(null);
        navigate("/signin");
    }

    if (loading) return <div className="app-loading">NARRATIAA</div>;
    if (path === "/signup" && !user) return <SignupPage onAuthenticated={handleAuthenticated} onShowSignin={() => navigate("/signin")} />;
    if (path === "/signin" && !user) return <SigninPage onAuthenticated={handleAuthenticated} onShowSignup={() => navigate("/signup")} />;
    if (user) {
        const shared = { user, onLogout: handleLogout, onNavigate: navigate };
        if (path === "/onboarding" || !user.onboardingCompleted) return <OnboardingPage {...shared} onComplete={() => { setUser({ ...user, onboardingCompleted: 1 }); navigate("/dashboard"); }} />;
        if (path === "/library") return <LibraryPage {...shared} />;
        if (path === "/journal") return <JournalPage {...shared} />;
        if (path === "/stats") return <StatsPage {...shared} />;
        const bookMatch = path.match(/^\/books\/(\d+)$/);
        if (bookMatch) return <BookPage {...shared} bookId={bookMatch[1]} />;
        return <DashboardPage {...shared} />;
    }
    return null;
}
