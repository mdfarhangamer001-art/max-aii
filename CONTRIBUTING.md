# Contributing to MAX-AII

Thank you for your interest in contributing to MAX-AII!

## Getting Started

### Prerequisites
- Node.js 18+
- npm 8+
- Git

### Development Setup

```bash
git clone https://github.com/mdfarhangamer001-art/max-aii.git
cd max-aii
npm install
npm run dev
```

## Making Changes

### Branch Naming
```
feature/feature-name        # New features
fix/bug-name               # Bug fixes
docs/documentation-name    # Documentation
refactor/component-name    # Code refactoring
```

### Commit Messages
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor component
perf: Improve performance
ci: Update CI/CD
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly: `npm run validate`
5. Commit with clear messages
6. Push to your fork
7. Create a Pull Request

### PR Requirements
- ✅ Passes all CI/CD checks
- ✅ Code follows project conventions
- ✅ No breaking changes (unless major version)
- ✅ Updates documentation if needed

## Code Style

### TypeScript
```typescript
// ✅ Good
const getUserName = (userId: string): Promise<string> => {
  return fetchUser(userId).then(user => user.name);
};
```

### React Components
```typescript
// ✅ Good: Functional component with hooks
export const MyComponent: React.FC<Props> = ({ prop1 }) => {
  const [state, setState] = useState('');
  
  useEffect(() => {
    // effects
  }, []);
  
  return <div>{prop1}</div>;
};
```

## Testing

```bash
npm run lint       # Run linter
npm run type-check # Type checking
npm run build      # Build test
npm run validate   # Full validation
```

## Support

- 🐛 [GitHub Issues](https://github.com/mdfarhangamer001-art/max-aii/issues)
- 💬 [GitHub Discussions](https://github.com/mdfarhangamer001-art/max-aii/discussions)

---

**Thank you for contributing to MAX-AII!** 🚀