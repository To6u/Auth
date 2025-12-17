import { memo } from 'react';
import { motion } from 'framer-motion';

export const Logo = memo(() => (
    <motion.div
        className="wave-trip-logo"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
        aria-label="Wave Trip Logo"
    />
));

Logo.displayName = 'Logo';
