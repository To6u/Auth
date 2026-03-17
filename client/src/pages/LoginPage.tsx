import { AnimatedPageWrapper } from 'client/src/components/layout/AnimatedPageWrapper';
import AuthContainer from '@/components/auth-form/AuthContainer.tsx';

export const LoginPage = () => {
    return (
        <AnimatedPageWrapper enterFrom="left" exitTo="right">
            <AuthContainer />
        </AnimatedPageWrapper>
    );
};
