# Salon Booking Application - Design Guidelines

## Design Reference
**Primary Inspiration:** velvet-salon-pro.lovable.app
**Visual Identity:** Premium dark theme with sophisticated gold accents, creating an upscale salon experience

## Color System

**Theme:** Dark luxury with gold accents

**Color Palette:**
- **Background:** Very dark charcoal/black (#1a1a1a to #0f0f0f)
- **Primary Accent:** Warm gold (#D4AF37 / HSL 45° 66% 53%)
- **Text Primary:** Clean white (#FFFFFF)
- **Text Secondary:** Light gray (#B8B8B8)
- **Text Muted:** Medium gray (#7A7A7A)
- **Card Background:** Slightly elevated dark (#262626)
- **Border/Divider:** Subtle dark gray (#2a2a2a)

**Color Usage:**
- Gold is reserved for primary CTAs, highlights, and brand elements
- Dark backgrounds create depth and sophistication
- White text ensures maximum readability
- Gray variations establish information hierarchy

---

## Typography System

**Font Stack:**
- Primary: 'Playfair Display' (headings, elegant serif for luxury feel)
- Secondary: 'Inter' (body text, UI elements - clean, modern sans-serif)

**Type Scale:**
- Hero/Page Titles: text-5xl to text-6xl, font-bold, text-white
- Section Headers: text-3xl to text-4xl, font-semibold, text-white
- Card Titles/Stylist Names: text-xl to text-2xl, font-semibold, text-white
- Service Names: text-lg, font-medium, text-white
- Body Text: text-base, text-gray-300
- Labels/Captions: text-sm, text-gray-400
- Metadata (prices, duration): text-sm, font-medium, text-gray-300

---

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 24
- Consistent padding/margins: p-4, p-6, p-8, p-12, p-16, p-24
- Gap spacing for grids: gap-4, gap-6, gap-8
- Section spacing: py-12, py-16, py-24

**Container Strategy:**
- Max-width: max-w-6xl for form steps
- Full-width: w-full for progress indicator and navigation
- Card containers: max-w-sm to max-w-md for stylist/service cards

**Grid Patterns:**
- Service cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- Stylist selection: grid-cols-1 md:grid-cols-2, gap-8
- Date/time slots: grid-cols-3 md:grid-cols-4 lg:grid-cols-6, gap-3

---

## Multi-Step Booking Flow Architecture

### Global Navigation Elements

**Progress Indicator (Fixed Top):**
- Horizontal stepper showing: Client Info → Service → Stylist → Date & Time → Confirmation
- Active step highlighted in gold
- Completed steps with checkmark icons in gold
- Inactive steps in gray
- Height: h-20, sticky positioning

**Step Counter Badge:**
- Position: top-right of each step
- Format: "Paso 2 de 4"
- Styling: rounded-full badge with gold accent

### Step 1: Client Information

**Layout:**
- Centered single-column form: max-w-2xl mx-auto
- Welcoming headline in white
- Subheading in gray

**Form Fields:**
- Dark input backgrounds (#262626)
- White text
- Gold focus rings
- Field spacing: space-y-6

**Button Placement:**
- Primary CTA in gold: "Continuar"
- Full-width on mobile, w-auto px-12 on desktop

### Step 2: Service Selection

**Service Card Structure:**
- Dark card background (#262626)
- Service image with subtle overlay
- Service name in white
- Duration and price in light gray
- Gold border when selected
- Hover effect: subtle scale and gold glow

### Step 3: Stylist Selection

**Stylist Card Components:**
- Dark card background
- Profile image with gold border when selected
- Stylist name in white
- Specialty tags with dark background and gold text
- Experience and rating in gray
- "Seleccionar" button in gold

### Step 4: Date & Time Selection

**Calendar Component:**
- Dark background
- Available dates with gold highlight
- Selected date with gold background
- Unavailable dates grayed out

**Time Slots:**
- Dark button backgrounds
- Gold highlight when selected
- Disabled slots with reduced opacity

### Step 5: Confirmation

**Layout:**
- Centered card with dark background
- Gold success icon
- Booking reference in gold
- Details in white and gray
- Gold action buttons

---

## Component Library

### Buttons

**Primary (Gold):**
- Background: #D4AF37
- Text: Black
- Hover: Slightly lighter gold
- Border-radius: rounded-lg

**Secondary (Outline):**
- Border: gold
- Text: gold
- Background: transparent
- Hover: gold background with black text

**Ghost:**
- Text: gray
- Hover: dark gray background

### Cards

**Standard Pattern:**
- Background: #262626
- Border: subtle dark gray or none
- Border-radius: rounded-2xl
- Shadow: subtle dark shadows
- Padding: p-6 to p-8

**Selected State:**
- Gold border (2px)
- Subtle gold glow

### Form Inputs

- Background: #262626
- Border: dark gray
- Text: white
- Placeholder: gray
- Focus: gold ring

### Icons

**Library:** Lucide React
- Gold for active/selected states
- Gray for inactive states
- White for informational icons

---

## Page Transitions

**Between Steps:**
- Smooth fade transitions
- Duration: 300ms ease-in-out
- Gold progress indicator animation

**Card Interactions:**
- Selection: smooth gold border transition
- Hover: subtle scale (scale-102)
- Duration: 200ms

---

## Responsive Breakpoints

**Mobile (base):**
- Single column layouts
- Full-width buttons
- Reduced spacing

**Tablet (md: 768px):**
- Two-column grids where applicable
- Optimized card sizing

**Desktop (lg: 1024px):**
- Multi-column layouts
- Maximum layout width constraints
- Enhanced spacing

---

## Images Section

### Hero/Welcome Screen
**Treatment:** Full-width salon interior with dark gradient overlay
- Subtle vignette effect for depth
- Text overlays with gold accents

### Service Cards
**Images:** Professional service photography
- Dark overlay to maintain consistency
- Gold accent bar or corner element

### Stylist Profiles
**Format:** Professional headshots
- Clean backgrounds
- Gold border treatment for selected state
- Circular or rounded-square format

---

## Accessibility & Polish

- High contrast: white text on dark backgrounds
- Gold accents provide clear visual hierarchy
- Minimum touch target: 44px
- Keyboard navigation with visible gold focus states
- Loading states with gold spinners
- Error states in red with dark background
- Success states with gold accents

---

This design creates an upscale, premium salon booking experience with a sophisticated dark theme and luxurious gold accents throughout.
