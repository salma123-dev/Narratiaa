import { useState } from "react";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";

function App() {
    const [page, setPage] = useState("signup");

    return page === "signin" ? (
        <SigninPage onShowSignup={() => setPage("signup")} />
    ) : (
        <SignupPage onShowSignin={() => setPage("signin")} />
    );
}

export default App;
