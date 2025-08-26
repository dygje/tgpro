# TGPro Frontend

Modern React TypeScript frontend untuk TGPro - Telegram Automation Platform. Dibangun dengan React 19, TypeScript, dan Chakra UI dengan Linear + Vercel design system.

## 🎨 Design System

### UI Framework
- **React 19** dengan TypeScript untuk type safety
- **Chakra UI** dengan custom theme
- **Linear + Vercel** inspired design
- **Responsive design** untuk semua device

### Theme Features
- **Custom Color Palette** - Monochrome dengan accent colors
- **Typography System** - Inter + JetBrains Mono fonts
- **Component Variants** - Konsisten styling across components  
- **Dark/Light Mode** - Built-in theme switching

## 🛠 Development

### Quick Start
```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Build for production
yarn build
```

### Environment Setup
```bash
# Required environment variables in .env
REACT_APP_BACKEND_URL=https://your-backend-url.com/api
```

### Project Structure
```
src/
├── components/          # UI Components
│   ├── TelegramLogin.tsx    # Authentication
│   ├── Dashboard.tsx        # Main dashboard
│   ├── Sidebar.tsx          # Navigation
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilities & API client
├── theme/              # Chakra UI theme
├── types/              # TypeScript definitions
└── App.tsx             # Main application
```

## 🚀 Features

### Authentication
- **Telegram Login Widget** integration
- **Progressive authentication** flow
- **JWT token** management
- **Secure credential** handling

### Real-time Features
- **WebSocket** integration untuk live updates
- **Real-time dashboard** metrics
- **Live logging** dan monitoring
- **Task progress** tracking

### Management Interfaces
- **Groups Manager** - Manage Telegram groups
- **Messages Manager** - Create dan edit messages  
- **Template Manager** - Dynamic message templates
- **Config Manager** - System configuration
- **Log Viewer** - Real-time logs dengan filtering

## 🎯 Component Architecture

### Core Components
- `App.tsx` - Main application dan routing
- `TelegramLogin.tsx` - Authentication flow
- `Dashboard.tsx` - Main dashboard dengan metrics
- `Sidebar.tsx` - Collapsible navigation

### Management Components  
- `GroupsManager.tsx` - Group management
- `MessagesManager.tsx` - Message file management
- `TemplateManager.tsx` - Template creation
- `ConfigManager.tsx` - System configuration

### Utilities
- `api.ts` - HTTP client dengan Axios
- `useApi.ts` - API hooks
- `useWebSocket.ts` - WebSocket integration
- `theme/index.ts` - Chakra UI theme

## 📱 Responsive Design

### Breakpoints
```typescript
// Chakra UI breakpoints
base: '0px'     // Mobile
sm: '480px'     // Small mobile  
md: '768px'     // Tablet
lg: '992px'     // Desktop
xl: '1280px'    // Large desktop
```

### Layout Adaptations
- **Mobile**: Single column layout, collapsible sidebar
- **Tablet**: Adaptive grid, touch-friendly interactions
- **Desktop**: Multi-column layout, hover states

## 🔧 Build Configuration

### Dependencies
```json
{
  "react": "^19.0.0",
  "typescript": "^5.9.2", 
  "@chakra-ui/react": "^2.8.2",
  "react-router-dom": "^7.5.2",
  "axios": "^1.9.0",
  "framer-motion": "^10.16.16"
}
```

### Build Scripts
- `yarn start` - Development server (port 3000)
- `yarn build` - Production build
- `yarn test` - Run tests (jika ada)

### Performance Optimizations
- **Tree shaking** untuk bundle size
- **Code splitting** dengan React Router
- **Lazy loading** components
- **Memoization** untuk expensive components

## 🎨 Styling Guidelines

### Component Patterns
```typescript
// Consistent spacing
<VStack spacing={4}>
<HStack spacing={3}>

// Color system
color="text-primary"
bg="bg-surface" 
borderColor="border-primary"

// Typography
fontSize="sm" fontWeight={500}
fontFamily="mono" // untuk technical content
```

### Design Tokens
- **Spacing**: 4px base unit (1, 2, 3, 4, 6, 8)
- **Colors**: Semantic tokens (text-primary, bg-surface, dll)
- **Typography**: Inter untuk UI, JetBrains Mono untuk code
- **Borders**: 4-8px radius, 1px solid borders

## 🧪 Testing

### Component Testing
- Unit tests dengan React Testing Library
- Integration tests untuk API calls
- E2E tests dengan Playwright (via testing agent)

### Manual Testing Checklist
- ✅ Authentication flow
- ✅ Navigation dan routing
- ✅ Form validation
- ✅ Real-time updates
- ✅ Responsive design
- ✅ Dark/light mode
- ✅ API integration

## 🔒 Security

### Authentication
- **JWT tokens** untuk session management
- **Bearer token** untuk API calls
- **Secure cookie** storage
- **Auto-logout** pada token expiry

### Data Protection
- **Input sanitization** untuk forms
- **XSS protection** dengan React
- **CSRF protection** via backend
- **Secure API** communication

## 📈 Performance Metrics

### Bundle Size Targets
- **Initial bundle**: <500KB gzipped
- **Vendor chunks**: Cached efficiently
- **Code splitting**: Route-based splitting
- **Tree shaking**: Unused code removal

### Runtime Performance
- **First Contentful Paint**: <2s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3s
- **Cumulative Layout Shift**: <0.1

## 🚀 Deployment

### Production Build
```bash
yarn build
```

### Environment Variables
```bash
# Production settings
REACT_APP_BACKEND_URL=https://api.yourdomain.com/api
GENERATE_SOURCEMAP=false
```

### Build Optimization
- Minified JavaScript dan CSS
- Image optimization
- Service worker untuk caching
- Gzip compression

## 🤝 Contributing

### Code Style
- **TypeScript strict mode** enabled
- **ESLint** untuk code quality  
- **Prettier** untuk formatting (if configured)
- **Conventional commits** untuk git messages

### Component Development
1. Create component di `src/components/`
2. Add TypeScript types di `src/types/`
3. Export dari `index.ts` files
4. Update theme jika perlu customization
5. Test responsiveness dan accessibility

---

**🎨 Modern UI/UX** • **⚡ High Performance** • **📱 Responsive Design** • **🔒 Secure Authentication**
