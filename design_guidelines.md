# Salon Booking Application - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based Design inspired by premium salon booking platforms (GlossGenius, Boulevard) combined with modern booking experiences (Calendly, Airbnb)

**Key Design Principles:**
1. **Trust & Professionalism:** Clean, sophisticated interface that mirrors high-end salon aesthetics
2. **Effortless Progression:** Clear visual hierarchy guiding users through each booking step
3. **Visual Reassurance:** Stylist profiles and service imagery build confidence in selections

---

## Typography System

**Font Stack:**
- Primary: 'Playfair Display' (headings, elegant serif for luxury feel)
- Secondary: 'Inter' (body text, UI elements - clean, modern sans-serif)

**Type Scale:**
- Hero/Page Titles: text-5xl to text-6xl, font-bold
- Section Headers: text-3xl to text-4xl, font-semibold
- Card Titles/Stylist Names: text-xl to text-2xl, font-semibold
- Service Names: text-lg, font-medium
- Body Text: text-base
- Labels/Captions: text-sm
- Metadata (prices, duration): text-sm, font-medium

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
- Active step highlighted, completed steps with checkmark icons
- Clickable for returning to previous completed steps
- Height: h-20, sticky positioning

**Step Counter Badge:**
- Position: top-right of each step
- Format: "Step 2 of 4"
- Styling: rounded-full badge, text-sm

### Step 1: Client Information

**Layout:**
- Centered single-column form: max-w-2xl mx-auto
- Welcoming headline: "Welcome! Let's get started with your booking"
- Subheading explaining the process

**Form Fields:**
- Full Name: Single input, w-full
- Email Address: w-full, with email validation indicator
- Phone Number: w-full, formatted input (XXX) XXX-XXXX
- Additional Information: textarea, rows-4, placeholder for allergies/preferences
- Field spacing: space-y-6

**Button Placement:**
- Primary CTA: "Continue to Services" - full-width on mobile, w-auto px-12 on desktop
- Position: Right-aligned on desktop, centered on mobile

### Step 2: Service Selection

**Layout:**
- Grid of service cards: 3 columns on desktop, 2 on tablet, 1 on mobile
- Each card: aspect-ratio-square or aspect-[4/3]

**Service Card Structure:**
- Service icon/image at top (occupying 40% of card height)
- Service name: text-2xl, font-semibold, mb-2
- Duration: text-sm with clock icon
- Price: text-lg, font-bold
- Brief description: text-sm, 2 lines max
- Selection state: border treatment changes when selected
- Padding: p-6

**Service Options:**
- Haircut, Manicure, Pedicure (expandable for future services)
- Multiple selection capability with visual indication

### Step 3: Stylist Selection

**Layout:**
- Two-column grid on desktop, single column on mobile
- Larger cards showcasing stylist personality

**Stylist Card Components:**
- Profile image: rounded-xl, aspect-square, mb-4
- Stylist name: text-2xl, font-semibold
- Specialties tags: flex gap-2, rounded-full pills
- Years of experience badge
- Star rating display (if applicable)
- "Select Stylist" button: w-full at card bottom
- Card dimensions: p-8, min-h-96

**Optional "Any Available Stylist" Card:**
- Same grid position, different visual treatment
- Icon instead of photo
- "First Available" badge

### Step 4: Date & Time Selection

**Layout:**
- Two-column layout: Calendar left, time slots right (stack on mobile)
- Calendar: max-w-md
- Time slots panel: flex-1

**Calendar Component:**
- Month view with previous/next navigation
- Available dates highlighted
- Unavailable dates grayed out
- Selected date with distinct visual treatment
- Header showing month/year: text-2xl

**Time Slots Grid:**
- Compact grid: 4-6 columns depending on viewport
- Each slot: rounded-lg button, py-3, px-4
- 30-minute or 60-minute intervals based on service
- Disabled slots shown but not clickable
- Format: "9:00 AM", "10:30 AM"

**Availability Indicator:**
- Color-coded legend above time slots
- "Available", "Limited", "Booked" states

### Step 5: Confirmation

**Layout:**
- Centered card: max-w-3xl
- Split into sections with dividers

**Summary Sections:**
- Success icon/animation at top
- "Booking Confirmed!" headline: text-4xl
- Booking reference number: prominent display

**Details Breakdown:**
- Client Information section
- Service Details section (with pricing)
- Stylist Information section (with small avatar)
- Appointment Date & Time (large, prominent)
- Total Price: text-3xl, font-bold

**Action Buttons:**
- "Add to Calendar" (with calendar icon)
- "Send Confirmation Email"
- "Book Another Appointment"
- Buttons in flex row, gap-4, flex-wrap

---

## Component Library

### Form Inputs
- Input fields: rounded-lg, border treatment, py-3, px-4
- Focus states with border highlight
- Label positioning: text-sm, font-medium, mb-2
- Error states: red border, error message text-sm below input
- Success validation: subtle checkmark icon

### Buttons
**Primary Actions:**
- rounded-lg, px-8, py-3, text-base, font-semibold
- Full-width on mobile, auto-width on desktop
- Disabled state: reduced opacity, cursor-not-allowed

**Secondary Actions:**
- Border variant: border-2, rounded-lg, px-6, py-2.5
- Icon + text combinations where appropriate

**Card Selection Buttons:**
- Entire card acts as button
- Border treatment indicates selection
- Subtle transform on hover: scale-105 transition

### Cards
**Standard Pattern:**
- rounded-2xl, overflow-hidden
- Shadow: shadow-md to shadow-lg
- Padding: p-6 to p-8
- Border on hover/selection states

**Interactive Cards:**
- cursor-pointer
- Transition: all duration-300
- Hover lift effect: hover:shadow-xl

### Icons
**Library:** Heroicons via CDN
- Service icons: 24px or 32px
- UI icons: 20px
- Checkmarks, arrows, calendar, clock icons
- Stylist specialty icons

### Progress Elements
**Stepper Component:**
- Horizontal line connecting steps
- Circular nodes for each step
- Active step: larger circle, filled
- Completed: checkmark icon
- Inactive: smaller circle, outlined

### Calendar Picker
**Structure:**
- Header: month/year with nav arrows
- Day labels: text-xs, uppercase
- Date cells: aspect-square, centered text
- Interactive states for selection

---

## Page Transitions

**Between Steps:**
- Fade + slide transition: 300ms ease-in-out
- Outgoing step: fade out, slide left slightly
- Incoming step: fade in, slide from right
- Progress indicator updates smoothly

**Card Interactions:**
- Selection: smooth border color transition
- Hover: subtle scale (scale-102), shadow increase
- Duration: 200ms

---

## Responsive Breakpoints

**Mobile (base):**
- Single column layouts
- Stacked navigation
- Full-width buttons
- Reduced spacing: py-8 instead of py-16

**Tablet (md: 768px):**
- Two-column grids where applicable
- Horizontal progress stepper
- Optimized card sizing

**Desktop (lg: 1024px):**
- Multi-column layouts
- Side-by-side date/time selection
- Maximum layout width constraints
- Enhanced spacing and breathing room

---

## Images Section

### Hero/Welcome Screen (Step 1 - Client Info)
**Image Placement:** Full-width background image with overlay
- **Description:** Bright, inviting salon interior shot - modern styling chairs, large mirrors, natural light streaming through windows, clean and professional aesthetic
- **Treatment:** Subtle gradient overlay for text readability
- **Position:** Top 40vh of viewport on desktop, 30vh on mobile
- **Content Over Image:** Welcome headline and subtext with blurred background treatment on text container

### Service Cards (Step 2)
**Images per Card:** Top section of each card
- **Haircut:** Close-up of stylist working on client's hair, scissors in action, professional lighting
- **Manicure:** Hands being serviced, nail polish bottles in background, elegant setup
- **Pedicure:** Spa pedicure station, foot bath, relaxing ambiance
- **Aspect Ratio:** 4:3 or square, rounded-t-xl

### Stylist Profile Images (Step 3)
**Individual Portraits:** Professional headshots
- **Description:** High-quality, well-lit portraits of stylists in salon setting or against clean background
- **Treatment:** Slightly softer focus on background, emphasis on friendly, welcoming expression
- **Shape:** rounded-xl or circular (rounded-full)
- **Size:** Minimum 300x300px, displayed at aspect-square

### Confirmation Screen (Step 5)
**Success Visual:** Illustrated icon or small animation
- **Description:** Checkmark in circle, confetti animation, or celebratory graphic
- **Purpose:** Visual reinforcement of successful booking

**No Hero Image:** Other steps (date/time selection) focus on functionality without background imagery

---

## Accessibility & Polish

- Minimum touch target: 44px height for all interactive elements
- Form validation messages clearly associated with inputs
- Loading states for async operations (checking availability)
- Keyboard navigation support throughout
- Screen reader labels for icon-only buttons
- Skip navigation for multi-step flow
- Error prevention: confirm before leaving incomplete booking

---

This design creates a premium, trustworthy salon booking experience that guides users effortlessly through appointment scheduling while maintaining visual elegance throughout the journey.