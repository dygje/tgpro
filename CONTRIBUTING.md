# Contributing to TGPro

Thank you for your interest in contributing to TGPro! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment:

- **Be Respectful**: Treat all contributors with respect and kindness
- **Be Collaborative**: Work together to build something great
- **Be Professional**: Maintain professional communication and behavior
- **Be Inclusive**: Welcome contributions from developers of all backgrounds and skill levels

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Python 3.11+** installed
- **Node.js 18+** and **Yarn** package manager
- **MongoDB** (local or cloud instance)
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/tgpro.git
   cd tgpro
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-repo/tgpro.git
   ```

## 🛠 Development Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Start Development Servers

1. **Start Backend** (in `/backend` directory):
   ```bash
   python server.py
   ```

2. **Start Frontend** (in `/frontend` directory):
   ```bash
   yarn start
   ```

3. **Verify Setup**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/docs (Swagger UI)

## 🏗️ Project Structure

```
tgpro/
├── backend/                 # FastAPI backend
│   ├── routers/            # API route handlers
│   ├── services/           # Business logic services
│   ├── models/             # Pydantic data models
│   ├── middleware/         # Authentication & security
│   ├── utils/              # Utility functions
│   └── server.py           # Main server file
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API client & utilities
│   │   ├── theme/          # Chakra UI theme
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── tests/                  # Test files
├── docs/                   # Additional documentation
└── README.md               # Project overview
```

## 📝 Development Guidelines

### Code Style

#### Backend (Python)
- **PEP 8** compliance for Python code style
- **Type hints** for all function parameters and returns
- **Docstrings** for all classes and functions
- **Async/await** for all I/O operations
- **Pydantic models** for data validation

Example:
```python
async def create_user(user_data: UserCreateRequest) -> UserResponse:
    """
    Create a new user in the database.
    
    Args:
        user_data: Validated user creation data
        
    Returns:
        UserResponse: Created user information
        
    Raises:
        HTTPException: If user creation fails
    """
    # Implementation here
    pass
```

#### Frontend (TypeScript)
- **TypeScript strict mode** enabled
- **Functional components** with hooks
- **Chakra UI components** for consistent styling
- **Custom hooks** for reusable logic
- **Proper TypeScript types** for all props and state

Example:
```typescript
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

const UserCard: React.FC<Props> = ({ user, onUpdate }) => {
  // Component implementation
  return (
    <Card>
      <CardBody>
        {/* Component JSX */}
      </CardBody>
    </Card>
  );
};

export default UserCard;
```

### Commit Messages

Use **Conventional Commits** format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` New features
- `fix:` Bug fixes  
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

**Examples:**
```
feat(auth): add Telegram Login Widget support
fix(ui): resolve mobile navigation overflow issue
docs(readme): update installation instructions
style(backend): apply black formatting to server.py
```

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/telegram-login-widget`
- `bugfix/mobile-navigation-overflow`
- `hotfix/security-vulnerability`
- `docs/api-documentation-update`

### API Design

#### REST API Conventions
- **RESTful endpoints** with clear resource names
- **HTTP status codes** appropriate to the operation
- **JSON responses** with consistent structure
- **Error handling** with descriptive messages
- **API versioning** via URL path (`/api/v1/`)

#### Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-26T10:30:00Z"
}
```

#### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      // Specific error details
    }
  },
  "timestamp": "2025-01-26T10:30:00Z"
}
```

## 🧪 Testing

### Backend Testing

Run backend tests using pytest:

```bash
cd backend
pytest tests/ -v
python backend_test.py  # Comprehensive API testing
```

### Frontend Testing

Run frontend tests (if configured):

```bash
cd frontend
yarn test
```

### Integration Testing

Use the provided test scripts:

```bash
# Comprehensive backend API testing
python backend_test.py

# Focused endpoint testing
python focused_backend_test.py

# Telegram authentication testing
python telegram_login_test.py
```

### Test Coverage

Aim for:
- **Backend**: >80% code coverage
- **Frontend**: >70% component coverage
- **Integration**: All major user flows tested

## 🔄 Pull Request Process

### Before Submitting

1. **Update from upstream**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following the guidelines above

4. **Test thoroughly**:
   ```bash
   # Run backend tests
   python backend_test.py
   
   # Run frontend tests
   cd frontend && yarn test
   ```

5. **Update documentation** if needed

### PR Submission

1. **Commit changes** with conventional commit messages
2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub with:
   - **Clear title** describing the change
   - **Detailed description** of what was changed and why
   - **Screenshots** for UI changes
   - **Testing notes** explaining how to test the changes

### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Backend tests pass
- [ ] Frontend tests pass  
- [ ] Manual testing completed
- [ ] Integration tests pass

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated (if needed)
- [ ] Tests added or updated
- [ ] All tests pass
```

### Review Process

1. **Automated checks** must pass (CI/CD if configured)
2. **Code review** by maintainers
3. **Testing verification** by reviewers
4. **Approval** from at least one maintainer
5. **Merge** after all requirements are met

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should have happened.

## Actual Behavior  
What actually happened.

## Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Browser: [e.g., Chrome 96, Firefox 95]
- TGPro Version: [e.g., 3.1.0]

## Additional Context
Any additional information, logs, or screenshots.
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Any alternative solutions or workarounds considered.

## Additional Context
Any additional context, mockups, or examples.
```

## 📚 Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Chakra UI Documentation](https://chakra-ui.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Project Resources
- [Project README](./README.md)
- [Design Documentation](./DESIGN_DOCUMENTATION.md)
- [Changelog](./CHANGELOG.md)
- [Architecture Documentation](./docs/architecture.md)

## 🎉 Recognition

Contributors are recognized in:
- **CONTRIBUTORS.md** file
- **Release notes** for significant contributions
- **Project README** for major features

Thank you for contributing to TGPro! 🚀