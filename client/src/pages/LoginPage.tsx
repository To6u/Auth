import AuthContainer from '@/components/auth-form/AuthContainer.tsx';
import { AnimatedPageWrapper } from '@/components/layout/AnimatedPageWrapper';

export const LoginPage = () => {
    return (
        <AnimatedPageWrapper>
            <AuthContainer />
        </AnimatedPageWrapper>
    );
};
