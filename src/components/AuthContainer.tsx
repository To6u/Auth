import "./auth.css";
import WavesBackground from "./wave-bg/WavesBackground.tsx";
import ThinWavesBackground from "./wave-bg/ThinWavesBackground.tsx";
import AuthForm from "@/components/auth-form/AuthForm.tsx";

const AuthContainer = () => {
    return (
        <div className="auth-wrapper">
            <div className="auth-container-layout">
                {/* Левая часть - форма */}
                <div className="auth-form-section">
                    <AuthForm />
                </div>

                {/* Правая часть - волны */}
                <div className="auth-image-section">
                    <ThinWavesBackground />
                    <WavesBackground />
                </div>

                <div className="auth-image-overlay">
                    <div className="wave-trip-logo"></div>
                {/*    <h1>Добро пожаловать!</h1>*/}
                {/*    <p>Войдите в свой аккаунт, чтобы продолжить</p>*/}
                </div>
            </div>
        </div>
    );
};

export default AuthContainer;