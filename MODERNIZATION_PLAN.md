# City of Eastbrook Website Modernization Plan

## Analysis of Legacy Design Elements

### Color Palette (from screenshots):
- **Primary Navy Blue**: `#1e3a5f` - Header background, navigation
- **Light Beige/Tan**: `#d4c5a9` - Secondary background, content areas
- **Alert Red/Pink**: `#f8d7da` - Maintenance/alert banners
- **White**: `#ffffff` - Main content background
- **Dark Text**: `#333333` - Body text
- **Link Blue**: `#0066cc` - Hyperlinks

### Key Design Elements:
1. **Header Structure**:
   - Dark navy blue background
   - City seal/logo on left
   - "City of Eastbrook" branding with tagline "Serving Our Citizens Since 1847"
   - Emergency contact info (911 + non-emergency number) on right
   - Search functionality
   - Language selector dropdown

2. **Alert Banner**:
   - Red/pink background for scheduled maintenance
   - Warning icon
   - Clear, prominent messaging
   - Link to full notice

3. **Navigation**:
   - Horizontal menu bar below header
   - Tan/beige background
   - Categories: Residents, Businesses, Visitors, Departments, Government, Services A-Z, Permits & Licenses, Pay Online, Forms, News, Calendar, Contact, FAQ
   - "I want to:" quick action bar with common tasks

4. **Typography**:
   - Serif font for headings (traditional government feel)
   - Sans-serif for body text
   - Clear hierarchy

5. **Layout**:
   - Maximum width container
   - Generous padding and spacing
   - Card-based content sections
   - Department cards with icons/images

## Modernization Strategy

### 1. Color System Update
- Keep navy blue primary but modernize shade
- Update beige to warmer, more accessible tone
- Maintain high contrast for WCAG compliance
- Add modern accent colors while respecting brand

### 2. Header Redesign
- Maintain city seal prominence
- Add emergency contact banner
- Modernize navigation with better mobile support
- Keep language/accessibility controls visible

### 3. Alert System
- Create reusable alert banner component
- Support multiple alert types (maintenance, emergency, info)
- Dismissible with localStorage persistence
- Accessible with proper ARIA labels

### 4. Typography
- Use modern serif for headings (maintain government feel)
- Clean sans-serif for body (better readability)
- Proper font scaling and line heights
- Support for large text mode

### 5. Component Updates
- Modernize cards with subtle shadows
- Update buttons with better states
- Improve form inputs
- Add smooth transitions

## Implementation Steps

1. ✅ Update CSS variables with City of Eastbrook color palette
2. ✅ Create alert banner component
3. ✅ Redesign header with city branding
4. ✅ Update typography system
5. ✅ Test accessibility and responsiveness