# Keshav Kitchen Design System

A comprehensive design system built with modern UI principles, accessibility-first approach, and responsive design patterns using Next.js and Tailwind CSS.

## 🎨 Color Palette

### Primary Colors
- **Primary**: `#2563EB` (Blue-600) - Main brand color for CTAs, links, and emphasis
- **Primary Variants**: 50-900 scale available with proper contrast ratios
- **Primary Foreground**: `#FFFFFF` - Text on primary backgrounds

### Secondary Colors
- **Secondary**: `#6B7280` (Gray-500) - Supporting actions and secondary content
- **Secondary Variants**: 50-900 scale for different UI states
- **Secondary Foreground**: `#FFFFFF` - Text on secondary backgrounds

### Semantic Colors
- **Success**: `#10B981` (Emerald-500) - Success states, confirmations
- **Error**: `#EF4444` (Red-500) - Error states, destructive actions
- **Warning**: `#F59E0B` (Amber-500) - Warning states, cautions
- **Info**: Uses primary color variants

### Neutral Colors
- **Background**: `#F9FAFB` (Neutral-50) - Main background
- **Foreground**: `#1F2937` (Neutral-800) - Primary text
- **Muted**: `#F3F4F6` (Neutral-100) - Subtle backgrounds
- **Border**: `#E5E7EB` (Neutral-200) - Borders and dividers

## 📝 Typography

### Font System
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif
- **Display**: swap for optimal loading
- **Features**: Supports font variations and OpenType features

### Typography Scale
```css
/* Display Headers */
.heading-display → text-4xl md:text-5xl lg:text-6xl font-bold
.heading-1 → text-3xl md:text-4xl font-bold
.heading-2 → text-2xl md:text-3xl font-semibold
.heading-3 → text-xl md:text-2xl font-semibold
.heading-4 → text-lg md:text-xl font-semibold

/* Body Text */
.body-large → text-base md:text-lg leading-relaxed
.body-medium → text-sm md:text-base leading-relaxed
.body-small → text-xs md:text-sm leading-relaxed
```

### Text Utilities
- **Gradient Text**: `.text-gradient` - Applies primary gradient to text
- **Text Balance**: `.text-balance` - Optimizes line breaks for headings
- **Tracking**: Enhanced letter spacing for better readability

## 🧩 Component Library

### Buttons

#### Variants
- **Default**: Primary blue with hover effects
- **Destructive**: Red for dangerous actions
- **Outline**: Border style with hover states
- **Secondary**: Gray variant for secondary actions
- **Ghost**: Transparent with hover background
- **Link**: Text-style button
- **Success**: Green for positive actions
- **Gradient**: Premium gradient style with shine effect

#### Sizes
- **SM**: `h-9 px-4 py-2 text-xs` - Compact interfaces
- **MD**: `h-11 px-6 py-3` - Default size
- **LG**: `h-12 px-8 py-4 text-base` - Prominent actions
- **XL**: `h-14 px-10 py-5 text-lg` - Hero sections
- **Icon**: Square buttons for icons only

#### Features
- Loading states with spinners
- Left/right icon support
- Accessibility compliance (ARIA, focus states)
- Hover animations (scale, shadow)
- Disabled states

### Cards

#### Variants
- **Default**: Subtle shadow with border
- **Outlined**: Emphasized border
- **Elevated**: Stronger shadow for prominence
- **Glass**: Glassmorphism effect

#### Specialized Cards
- **MetricCard**: Statistics display with trends
- **StatusCard**: Color-coded status indicators

#### Features
- Hover animations
- Responsive spacing
- Flexible content areas
- Header, content, footer sections

### Inputs

#### Variants
- **Default**: Standard border style
- **Filled**: Background-filled style
- **Ghost**: Minimal transparent style

#### Sizes
- **SM**: `h-9` - Compact forms
- **MD**: `h-11` - Default size
- **LG**: `h-12` - Prominent forms

#### Specialized Inputs
- **SearchInput**: Pre-configured with search icon
- **PasswordInput**: Toggle visibility functionality

#### Features
- Icon support (left/right)
- Error/success states
- Helper text
- Accessibility labels
- Focus ring animations

### Navigation

#### Tab Navigation
- **Default**: Segmented control style
- **Pills**: Rounded pill style
- **Underline**: Bottom border style
- **Cards**: Card-like tabs

#### Features
- Horizontal scrolling for overflow
- Touch-friendly drag scrolling
- Responsive behavior
- Active state indicators
- Icon and count support

### Dialogs

#### Sizes
- **SM**: `max-w-sm` - Confirmations
- **MD**: `max-w-md` - Default dialogs
- **LG**: `max-w-lg` - Forms
- **XL**: `max-w-xl` - Complex content
- **2XL**: `max-w-2xl` - Large forms
- **Full**: Full screen on mobile

#### Features
- Backdrop blur effects
- Smooth animations
- Keyboard navigation
- Focus trapping
- Mobile-optimized

## 🎭 Animation System

### Keyframes
```css
@keyframes fadeIn - Fade in with slight Y movement
@keyframes slideIn - Slide in from left
@keyframes scaleIn - Scale in from 95%
@keyframes slideUp - Slide up from bottom
@keyframes shimmer - Loading shimmer effect
```

### Animation Classes
- `.animate-fade-in` - 0.4s ease-out
- `.animate-slide-in` - 0.4s ease-out
- `.animate-scale-in` - 0.3s ease-out
- `.animate-slide-up` - 0.4s ease-out
- `.animate-shimmer` - 2s infinite

### Motion Preferences
- Respects `prefers-reduced-motion`
- Graceful degradation for accessibility
- Performance-optimized transforms

## 🎨 Layout System

### Container System
- **container-modern**: Max-width with responsive padding
- **section-modern**: Vertical spacing for sections
- **grid-modern**: Modern grid with responsive gaps

### Responsive Breakpoints
```css
xs: 475px    - Extra small devices
sm: 640px    - Small devices
md: 768px    - Medium devices
lg: 1024px   - Large devices
xl: 1280px   - Extra large devices
2xl: 1536px  - 2X large devices
3xl: 1680px  - Ultra wide displays
```

### Layout Variants
- **DashboardLayout**: Full application layout
- **CenteredLayout**: Centered content (auth, error pages)
- **SplitLayout**: Two-column layout

## 🔧 Design Tokens

### Spacing Scale
- Extended spacing: 18 (4.5rem), 88 (22rem), 128 (32rem)
- Consistent 8px grid system
- Responsive spacing modifiers

### Shadow System
```css
.shadow-modern     - Subtle depth
.shadow-modern-md  - Medium depth
.shadow-modern-lg  - Prominent depth
.shadow-modern-xl  - Maximum depth
.shadow-modern-2xl - Dramatic depth
```

### Border Radius
- **SM**: `calc(var(--radius) - 4px)`
- **MD**: `calc(var(--radius) - 2px)`
- **LG**: `var(--radius)` (0.75rem)
- **XL**: `1rem`
- **2XL**: `1.5rem`

## ♿ Accessibility Features

### Focus Management
- Visible focus rings on all interactive elements
- Focus trapping in modals
- Skip to main content link
- Keyboard navigation support

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Status announcements
- Proper heading hierarchy

### Color & Contrast
- WCAG AA compliant contrast ratios
- Color-blind friendly palette
- Dark mode support
- High contrast mode compatibility

### Motion & Animation
- Respects `prefers-reduced-motion`
- Optional animation controls
- Performance-optimized animations

## 📱 Responsive Design

### Mobile-First Approach
- Touch-friendly target sizes (44px minimum)
- Optimized gesture interactions
- Responsive typography scaling
- Mobile navigation patterns

### Breakpoint Strategy
- Progressive enhancement
- Flexible grid systems
- Responsive component variants
- Optimized content hierarchy

### Performance
- Optimized bundle sizes
- Lazy loading patterns
- Efficient re-renders
- Image optimization

## 🎯 Usage Guidelines

### Component Composition
```tsx
// Example: Modern button usage
<Button 
  variant="gradient" 
  size="lg" 
  leftIcon={<Icon />}
  loading={isLoading}
  onClick={handleClick}
>
  Action Label
</Button>

// Example: Enhanced card usage
<Card variant="elevated" hover>
  <CardHeader centered>
    <CardTitle size="lg" gradient>
      Card Title
    </CardTitle>
    <CardDescription>
      Supporting description text
    </CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter justified>
    <Button variant="outline">Cancel</Button>
    <Button>Confirm</Button>
  </CardFooter>
</Card>
```

### Layout Patterns
```tsx
// Dashboard with sidebar
<DashboardLayout activeMenuItem="dashboard">
  <PageHeader 
    title="Dashboard"
    subtitle="Welcome back"
    gradient
    actions={<Button>Action</Button>}
  />
  <StatsGrid 
    stats={metrics} 
    columns={4} 
    variant="detailed" 
  />
</DashboardLayout>

// Centered layout for auth
<CenteredLayout maxWidth="md">
  <Card variant="glass">
    <CardContent>
      <form>...</form>
    </CardContent>
  </Card>
</CenteredLayout>
```

### State Management
- Consistent loading states
- Error boundary patterns
- Success/error feedback
- Progressive disclosure

## 🚀 Implementation Steps

### 1. Setup
- ✅ Updated Tailwind configuration
- ✅ Enhanced global CSS with design tokens
- ✅ Configured Inter font system
- ✅ Added modern animation utilities

### 2. Core Components
- ✅ Enhanced Button component
- ✅ Modern Card variants
- ✅ Advanced Input system
- ✅ Responsive Dialog component

### 3. Layout System
- ✅ Dashboard layout improvements
- ✅ Enhanced page headers
- ✅ Modern navigation patterns
- ✅ Responsive grid systems

### 4. Accessibility
- ✅ Focus management
- ✅ Screen reader support
- ✅ Keyboard navigation
- ✅ WCAG compliance

### 5. Testing & Optimization
- Component testing
- Accessibility auditing
- Performance optimization
- Cross-browser compatibility

## 📚 Resources

### Design References
- Material Design 3 principles
- Apple Human Interface Guidelines
- Radix UI primitives
- Tailwind CSS patterns

### Development Tools
- Tailwind CSS
- Radix UI
- Next.js
- TypeScript
- Lucide Icons

### Accessibility Testing
- axe-core
- WAVE browser extension
- Lighthouse audits
- Screen reader testing

---

This design system provides a solid foundation for building modern, accessible, and scalable user interfaces while maintaining consistency across the Keshav Kitchen application.