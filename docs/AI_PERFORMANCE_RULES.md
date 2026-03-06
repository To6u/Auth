# Performance Rules — Auth Project

You must always analyze performance impact.

---

# FRONTEND CHECKLIST

- Avoid unnecessary re-renders
- Check Context over-rendering
- Validate useEffect dependencies
- Avoid excessive state lifting
- Consider memoization only when justified
- Measure bundle size impact
- Prefer code splitting and lazy loading
- Minimize blocking JS
- Avoid layout thrashing
- Evaluate animation repaint cost (Framer Motion)
- Evaluate R3F continuous render loop cost
- Ensure no heavy logic inside render

---

# BACKEND CHECKLIST

- better-sqlite3 is synchronous — check event loop blocking
- Ensure proper indexes on frequently queried columns
- Evaluate bcrypt cost impact
- Analyze JWT verification overhead
- Avoid unnecessary DB reads
- Validate rate limiter configuration

---

# MOBILE CRITICAL MODE

Always consider:

- 4x CPU throttling
- Low-end Android devices
- Slow 3G network
- Thermal throttling
- Memory pressure

If risk exists — propose fallback strategy.

Examples:

- Disable heavy animations
- Reduce R3F quality
- Conditional rendering
- Defer non-critical scripts
