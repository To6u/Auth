import { motion } from 'framer-motion';
import { useState } from 'react';
import AuthForm from '@/components/auth-form/AuthForm.tsx';
import '@/components/auth-form/auth-container.css';
import { Logo } from '@/components/auth-form/components';

const AuthContainer = () => {
    const [isExiting, setIsExiting] = useState(false);

    return (
        <div className="auth-wrapper">
            <div className="auth-container-layout">
                {/* Левая часть - форма с анимацией выезда */}
                <motion.div
                    className="auth-form-section"
                    animate={
                        isExiting
                            ? {
                                  opacity: 0,
                                  x: -100,
                                  filter: 'blur(10px)',
                              }
                            : {
                                  opacity: 1,
                                  x: 0,
                                  filter: 'blur(0px)',
                              }
                    }
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    <AuthForm onExitingChange={setIsExiting} />
                </motion.div>

                <Logo isExiting={isExiting} />
            </div>
        </div>
    );
};

export default AuthContainer;
